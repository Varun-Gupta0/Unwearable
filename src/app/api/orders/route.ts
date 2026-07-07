import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/server/supabaseAdmin"; // server‑only admin client
import { enforceRateLimit, ORDER_RATE_LIMIT } from "@/lib/rateLimiter";
import { parseOrderPayload } from "@/lib/validation";
import { requireAuth } from "@/server/auth";
import { supabase } from "@/lib/supabase";

export type { OrderItem, CustomerInfo, OrderPayload, QikinkLineItem, QikinkShippingAddress, QikinkOrderPayload } from '@/types/orders';
import type { QikinkOrderPayload } from '@/types/orders';

import { createOrder } from '@/server/services/OrderService';

export async function POST(request: NextRequest) {
  // ── Auth guard: require a signed‑in Clerk session ──────────────────────────
  const userId = await requireAuth();
  if (!userId) {
    return NextResponse.json(
      { error: "You must be signed in to place an order." },
      { status: 401 }
    );
  }

  // Parse request payload
  const payload = await request.json();
  const { items, customer, totalOrderValue } = payload;
  if (!items || !Array.isArray(items) || items.length === 0) {
    return NextResponse.json(
      { error: "Each item must have a valid slug and quantity" },
      { status: 400 }
    );
  }

  // Enforce rate limit
  try {
    enforceRateLimit(request, ORDER_RATE_LIMIT);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 429 });
  }

  try {
    const orderPayload = parseOrderPayload(payload);
    const result = await createOrder(orderPayload, userId);
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Order creation error:", errorMessage);
    return NextResponse.json({ error: "Order processing failed", details: errorMessage }, { status: 500 });
  }
}