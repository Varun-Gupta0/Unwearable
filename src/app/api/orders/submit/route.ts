import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { log } from "@/lib/logger";
import type { Order } from "@/types";

const QIKINK_BASE_URL = process.env.QIKINK_API_URL || "https://sandbox.qikink.com";
const MAX_RETRIES = 3;

// ── Shared Qikink token cache ──────────────────────────────────────────────────
let _tokenCache: { token: string; expiresAt: number } | null = null;

async function getQikinkToken(): Promise<string> {
  if (_tokenCache && Date.now() < _tokenCache.expiresAt) return _tokenCache.token;

  const res = await fetch(`${QIKINK_BASE_URL}/api/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      ClientId: process.env.QIKINK_CLIENT_ID!,
      client_secret: process.env.QIKINK_CLIENT_SECRET!,
    }).toString(),
    signal: AbortSignal.timeout(10_000),
  });

  const data = await res.json();
  if (!res.ok || !data.Accesstoken) throw new Error(`Qikink token failed: ${res.status}`);

  _tokenCache = { token: data.Accesstoken, expiresAt: Date.now() + 55 * 60 * 1000 };
  return _tokenCache.token;
}

async function submitToQikink(order: Order): Promise<{ qikink_order_id: string; raw: unknown }> {
  const token = await getQikinkToken();
  const clientId = process.env.QIKINK_CLIENT_ID!;

  const nameParts = order.customer_name.split(/\s+/);
  const firstName = nameParts[0];
  const lastName = nameParts.length > 1 ? nameParts.slice(1).join(" ") : firstName;

  // Build line items — use SKU from item metadata
  const lineItems = order.items.map((item) => ({
    sku: item.slug, // SKU lookup handled below
    quantity: item.quantity,
    price: item.price,
    search_from_my_products: 1,
    ...(item.designImageUrl ? { print_file: item.designImageUrl } : {}),
  }));

  const payload = {
    order_number: order.order_number,
    qikink_shipping: 1,
    gateway: "Prepaid",
    total_order_value: order.total_amount / 100, // convert paise to rupees
    line_items: lineItems,
    shipping_address: {
      first_name: firstName,
      last_name: lastName,
      address1: order.shipping_address.address,
      address2: "",
      phone: order.shipping_address.phone.replace(/\D/g, ""),
      email: order.shipping_address.email,
      city: order.shipping_address.city,
      zip: parseInt(order.shipping_address.pincode.replace(/\D/g, ""), 10) || 0,
      province: order.shipping_address.state,
      country_code: "IN",
    },
  };

  const res = await fetch(`${QIKINK_BASE_URL}/api/order/create`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ClientId: clientId,
      Accesstoken: token,
    },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(15_000),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.message || data.error || `Qikink error: ${res.status}`);

  return { qikink_order_id: data.order_id ?? data.id ?? "unknown", raw: data };
}

/**
 * Internal endpoint — submits a paid order to Qikink with retry logic.
 * Protected by x-internal-key header, not Clerk (called server-to-server).
 */
export async function POST(request: NextRequest) {
  // ── Internal key guard ───────────────────────────────────────────────────
  const internalKey = request.headers.get("x-internal-key");
  if (internalKey !== process.env.INTERNAL_API_KEY) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { order_id } = await request.json();
  if (!order_id) return NextResponse.json({ error: "Missing order_id" }, { status: 400 });

  // ── Fetch order ──────────────────────────────────────────────────────────
  const { data: order, error: fetchError } = await supabaseAdmin
    .from("orders")
    .select("*")
    .eq("id", order_id)
    .single();

  if (fetchError || !order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  if (order.status !== "paid") {
    return NextResponse.json({
      error: `Order is not in paid state (current: ${order.status})`,
    }, { status: 409 });
  }

  // ── Mark as processing ───────────────────────────────────────────────────
  await supabaseAdmin.from("orders").update({ status: "processing" }).eq("id", order_id);

  try {
    // ── Submit to Qikink ─────────────────────────────────────────────────
    const { qikink_order_id, raw } = await submitToQikink(order as Order);

    // ── Mark fulfilled ───────────────────────────────────────────────────
    await supabaseAdmin.from("orders").update({
      status: "fulfilled",
      qikink_order_id,
      qikink_response: raw as Record<string, unknown>,
      error_message: null,
    }).eq("id", order_id);

    await log("order_submit", `Order ${order.order_number} submitted to Qikink`, {
      severity: "info",
      order_id,
    });

    return NextResponse.json({ success: true, qikink_order_id });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    const newRetryCount = (order.retry_count ?? 0) + 1;
    const isFinalFailure = newRetryCount >= MAX_RETRIES;

    // ── Update retry count and status ────────────────────────────────────
    await supabaseAdmin.from("orders").update({
      status: isFinalFailure ? "failed" : "paid", // reset to "paid" so it can be retried
      retry_count: newRetryCount,
      error_message: msg,
    }).eq("id", order_id);

    await log("qikink_api", `Qikink submission failed (attempt ${newRetryCount}): ${msg}`, {
      severity: isFinalFailure ? "critical" : "error",
      order_id,
      user_id: order.user_id,
    });

    return NextResponse.json({
      success: false,
      error: msg,
      retry_count: newRetryCount,
      final_failure: isFinalFailure,
    }, { status: 502 });
  }
}
