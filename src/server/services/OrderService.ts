import { getSupabaseAdmin } from '@/server/supabaseAdmin';
import { log } from '@/lib/logger';
import { QikinkOrderPayload, QikinkLineItem, OrderPayload } from '@/app/api/orders/route'; // reuse types if exported, otherwise re-declare minimal types
import { ValidationError, DatabaseError, PaymentError } from '@/server/errors';
import { EventEmitter } from 'events';
import { emitEvent } from '@/server/events';
import { supabase } from "@/lib/supabase";
import { products as localProducts } from "@/data/products";

const QIKINK_BASE_URL = process.env.QIKINK_API_URL || "https://api.qikink.com";

// ─── Token Cache (in-memory, reused across requests in the same serverless instance) ─
let _tokenCache: { token: string; expiresAt: number } | null = null;

export async function getProductStoreSku(slug: string, colorId?: string, sizeId?: string): Promise<string | null> {
  try {
    let query = supabase
      .from("products")
      .select("store_sku")
      .eq("slug", slug);

    if (colorId) {
      query = query.eq("color", colorId);
    }
    
    if (sizeId) {
      query = query.eq("size", sizeId);
    }

    const { data, error } = await query.limit(1).single();

    if (!error && data) {
      return data.store_sku;
    }

    // Fallback to local products
    const localProduct = localProducts.find(p => p.slug === slug);
    if (localProduct) {
      console.log(`Using local SKU for slug ${slug}: ${localProduct.sku}`);
      return localProduct.sku;
    }

    console.error(`Failed to fetch SKU for slug ${slug}:`, error);
    return null;
  } catch (error) {
    // Final fallback
    const localProduct = localProducts.find(p => p.slug === slug);
    return localProduct ? localProduct.sku : null;
  }
}

async function getQikinkAccessToken(): Promise<{ token?: string; error?: string }> {
  const clientId = process.env.QIKINK_CLIENT_ID;
  const clientSecret = process.env.QIKINK_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return { error: "Qikink API credentials not configured" };
  }

  // Return cached token if still valid (55-min TTL to account for clock drift)
  if (_tokenCache && Date.now() < _tokenCache.expiresAt) {
    return { token: _tokenCache.token };
  }

  try {
    const tokenUrl = `${QIKINK_BASE_URL}/api/token`;

    const response = await fetch(tokenUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        ClientId: clientId,
        client_secret: clientSecret,
      }).toString(),
    });

    const data = await response.json();

    if (!response.ok || !data.Accesstoken) {
      console.error("[Qikink] Token request failed:", response.status);
      return { error: data.error || data.message || `Token request failed: ${response.status}` };
    }

    // Cache token for 55 minutes
    _tokenCache = { token: data.Accesstoken, expiresAt: Date.now() + 55 * 60 * 1000 };
    return { token: _tokenCache.token };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return { error: `Token fetch error: ${errorMessage}` };
  }
}

async function createQikinkOrder(payload: QikinkOrderPayload): Promise<{ success: boolean; data?: unknown; error?: string }> {
  const clientId = process.env.QIKINK_CLIENT_ID;
  const tokenResult = await getQikinkAccessToken();

  if (tokenResult.error || !tokenResult.token) {
    return { success: false, error: tokenResult.error || "Failed to obtain access token" };
  }

  try {
    const response = await fetch(`${QIKINK_BASE_URL}/api/order/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "ClientId": clientId!,
        "Accesstoken": tokenResult.token,
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      return { 
        success: false, 
        error: data.error || data.message || `API error: ${response.status}` 
      };
    }

    return { success: true, data };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    return { success: false, error: `Network error: ${errorMessage}` };
  }
}

/**
 * Service responsible for handling order creation logic.
 * It validates the payload, creates the Qikink order, logs the action, and emits an event.
 */
export async function createOrder(order: OrderPayload, userId: string) {
  // Basic validation – more thorough Zod validation will be added later.
  if (!order.customer || !order.items || order.items.length === 0) {
    throw new ValidationError('Missing customer details or cart items');
  }

  // Sanitize customer fields (same logic as in route).
  const sanitizedEmail = order.customer.email.trim().toLowerCase();
  const sanitizedName = order.customer.name.trim();
  const sanitizedAddress = order.customer.address.trim().substring(0, 100);
  const sanitizedCity = (order.customer.city || '').trim();
  const sanitizedState = (order.customer.state || 'Chhattisgarh').trim();

  const nameParts = sanitizedName.split(/\s+/);
  const firstName = nameParts[0] || '';
  const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : firstName;

  // Build line items – reuse helper from route.
  const lineItems: QikinkLineItem[] = [];
  for (const item of order.items) {
    // Direct call instead of dynamic import
    const sku = await getProductStoreSku(item.slug, item.selectedColorId, item.selectedSize);
    if (!sku) {
      throw new ValidationError(`SKU not found for product: ${item.slug}`);
    }
    lineItems.push({
      sku,
      quantity: item.quantity,
      price: item.price || 0,
      search_from_my_products: 1,
      ...(item.designImageUrl && { print_file: item.designImageUrl }),
    });
  }

  const cleanPhone = order.customer.phone.replace(/\D/g, '');
  const cleanZip = parseInt(order.customer.pincode.replace(/\D/g, ''), 10) || 0;

  const orderNumber = generateOrderId();
  const totalOrderValue = order.totalOrderValue || lineItems.reduce((sum, li) => sum + li.price * li.quantity, 0);

  const qikinkPayload: QikinkOrderPayload = {
    order_number: orderNumber,
    qikink_shipping: 1,
    gateway: 'Prepaid',
    total_order_value: totalOrderValue,
    line_items: lineItems,
    shipping_address: {
      first_name: firstName,
      last_name: lastName,
      address1: sanitizedAddress,
      address2: '',
      phone: cleanPhone,
      email: sanitizedEmail,
      city: sanitizedCity,
      zip: cleanZip,
      province: sanitizedState,
      country_code: 'IN',
    },
  };

  // Call Qikink order creation directly
  const result = await createQikinkOrder(qikinkPayload);

  if (!result.success) {
    // Log failure and surface as PaymentError
    await log('order_service', `Failed Qikink order ${orderNumber}`, { severity: 'error', order_id: orderNumber, user_id: userId, payload: { error: result.error } });
    throw new PaymentError(result.error ?? 'Failed to create order with Qikink');
  }

  // Audit log success
  await log('order_service', `Order ${orderNumber} created`, { severity: 'info', order_id: orderNumber, user_id: userId });

  // Emit event for downstream listeners
  emitEvent('order_created', { orderId: orderNumber, userId, payload: order });

  return { orderId: orderNumber, qikinkResponse: result.data };
}

// Helper to generate order IDs – extracted to share with route.
function generateOrderId(): string {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).substring(2, 5).toUpperCase();
  return `UNW${ts}${rand}`.substring(0, 15);
}
