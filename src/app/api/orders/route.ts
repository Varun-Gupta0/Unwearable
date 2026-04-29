import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabase } from "@/lib/supabase";

interface OrderItem {
  slug: string;
  sku?: string;
  quantity: number;
  price?: number;
  selectedSize?: string;
  selectedColorId?: string;
  designId?: string;
  designImageUrl?: string;
}

interface CustomerInfo {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
}

interface OrderPayload {
  customer: CustomerInfo;
  items: OrderItem[];
  totalOrderValue?: number;
}

interface QikinkLineItem {
  sku: string;
  quantity: number;
  price: number;
  search_from_my_products: number;
  print_file?: string; // design image URL for custom prints
}

interface QikinkShippingAddress {
  first_name: string;
  last_name: string;
  address1: string;
  address2: string;
  phone: string;
  email: string;
  city: string;
  zip: number;
  province: string;
  country_code: string;
}

interface QikinkOrderPayload {
  order_number: string;
  qikink_shipping: number;
  gateway: string;
  total_order_value: number;
  line_items: QikinkLineItem[];
  shipping_address: QikinkShippingAddress;
}

function generateOrderId(): string {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).substring(2, 5).toUpperCase();
  return `UNW${ts}${rand}`.substring(0, 15);
}

import { products as localProducts } from "@/data/products";

async function getProductStoreSku(slug: string, colorId?: string, sizeId?: string): Promise<string | null> {
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

const QIKINK_BASE_URL = process.env.QIKINK_API_URL || "https://api.qikink.com";

// ─── Token Cache (in-memory, reused across requests in the same serverless instance) ─
let _tokenCache: { token: string; expiresAt: number } | null = null;

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

export async function POST(request: NextRequest) {
  // ── Auth guard: require a signed-in Clerk session ──────────────────────────
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json(
      { error: "You must be signed in to place an order." },
      { status: 401 }
    );
  }

  try {
    const body: OrderPayload = await request.json();

    const { customer, items } = body;

    if (!customer || !items || items.length === 0) {
      return NextResponse.json(
        { error: "Missing customer details or cart items" },
        { status: 400 }
      );
    }

    if (!customer.name || !customer.email || !customer.phone || !customer.address || !customer.pincode) {
      return NextResponse.json(
        { error: "Missing required customer fields: name, email, phone, address, pincode" },
        { status: 400 }
      );
    }

    for (const item of items) {
      if (!item.slug || !item.quantity || item.quantity < 1) {
        return NextResponse.json(
          { error: "Each item must have a valid slug and quantity" },
          { status: 400 }
        );
      }
    }

    // Build line items with variant-specific Store SKU lookup
    const lineItems: QikinkLineItem[] = await Promise.all(
      items.map(async (item) => {
        const sku = await getProductStoreSku(item.slug, item.selectedColorId, item.selectedSize);
        if (!sku) {
          throw new Error(`SKU not found for product: ${item.slug}`);
        }
        return {
          sku,
          quantity: item.quantity,
          price: item.price || 0,
          search_from_my_products: 1,
          ...(item.designImageUrl && { print_file: item.designImageUrl }),
        };
      })
    );

    // Sanitize and normalize customer input
    const sanitizedEmail = customer.email.trim().toLowerCase();
    const sanitizedName = customer.name.trim();
    const sanitizedAddress = customer.address.trim().substring(0, 100); // Prevent overflow
    const sanitizedCity = (customer.city || "").trim();
    const sanitizedState = (customer.state || "Chhattisgarh").trim();

    // Split customer name into first/last
    const nameParts = sanitizedName.split(/\s+/);
    const firstName = nameParts[0] || "";
    const lastName = nameParts.length > 1 ? nameParts.slice(1).join(" ") : firstName;

    const orderNumber = generateOrderId();
    const totalOrderValue = body.totalOrderValue || lineItems.reduce((sum, li) => sum + li.price * li.quantity, 0);

    const cleanPhone = customer.phone.replace(/\D/g, "");
    const cleanZip = parseInt(customer.pincode.replace(/\D/g, ""), 10) || 0;

    const qikinkPayload: QikinkOrderPayload = {
      order_number: orderNumber,
      qikink_shipping: 1,
      gateway: "Prepaid",
      total_order_value: totalOrderValue,
      line_items: lineItems,
      shipping_address: {
        first_name: firstName,
        last_name: lastName,
        address1: sanitizedAddress,
        address2: "",
        phone: cleanPhone,
        email: sanitizedEmail,
        city: sanitizedCity,
        zip: cleanZip,
        province: sanitizedState,
        country_code: "IN",
      },
    };

    console.log(`[Order] Creating order ${orderNumber} for ${sanitizedEmail} with ${lineItems.length} item(s)`);

    const result = await createQikinkOrder(qikinkPayload);

    if (!result.success) {
      console.error("QIKINK ERROR:", result.error);
      return NextResponse.json(
        { 
          error: "Failed to create order with Qikink",
          details: result.error,
          order_id: orderNumber
        },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Order created successfully",
      order_id: orderNumber,
      qikink_response: result.data,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Order creation error:", errorMessage);

    return NextResponse.json(
      { error: "Invalid request payload", details: errorMessage },
      { status: 400 }
    );
  }
}