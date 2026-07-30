import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { log } from "@/lib/logger";

/**
 * Razorpay server-to-server webhook.
 * Acts as a backup to /api/payment/verify in case the client call fails.
 * Configure in Razorpay Dashboard → Webhooks → add this URL.
 */
export async function POST(request: NextRequest) {
  const signature = request.headers.get("x-razorpay-signature");
  const body = await request.text();

  // ── Verify Razorpay webhook signature ────────────────────────────────────
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 });
  }

  const expectedSig = crypto
    .createHmac("sha256", webhookSecret)
    .update(body)
    .digest("hex");

  if (signature !== expectedSig) {
    await log("payment_webhook", "Invalid webhook signature", { severity: "critical" });
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const event = JSON.parse(body);

  // ── Handle payment.captured ───────────────────────────────────────────────
  if (event.event === "payment.captured") {
    const payment = event.payload?.payment?.entity;
    if (!payment) return NextResponse.json({ received: true });

    const { razorpay_payment_id, razorpay_order_id } = {
      razorpay_payment_id: payment.id,
      razorpay_order_id: payment.order_id,
    };

    // Idempotent update — safe to run even if client-side verify already ran
    const { data: paymentRow } = await supabaseAdmin
      .from("payments")
      .update({
        gateway_payment_id: razorpay_payment_id,
        status: "captured",
        verified: true,
        webhook_payload: event,
      })
      .eq("gateway_order_id", razorpay_order_id)
      .eq("verified", false) // only update if NOT already verified
      .select("id")
      .single();

    if (paymentRow) {
      // Find linked order and advance it if still pending
      const { data: order } = await supabaseAdmin
        .from("orders")
        .select("id, status")
        .eq("payment_id", paymentRow.id)
        .single();

      if (order && order.status === "pending") {
        await supabaseAdmin
          .from("orders")
          .update({ status: "paid" })
          .eq("id", order.id);

        // Trigger Qikink submission (awaited to prevent Vercel termination)
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
        try {
          const response = await fetch(`${appUrl}/api/orders/submit`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-internal-key": process.env.INTERNAL_API_KEY ?? "",
            },
            body: JSON.stringify({ order_id: order.id }),
            signal: AbortSignal.timeout(15_000),
          });
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            await log("order_submit_trigger", `Webhook order submission returned status ${response.status}: ${errorData.error || 'Unknown error'}`, {
              severity: "error",
              order_id: order.id,
            });
          }
        } catch (err: any) {
          await log("order_submit_trigger", `Failed to trigger order submission via webhook: ${err.message}`, {
            severity: "error",
            order_id: order.id,
          });
        }
      }
    }
  }

  // ── Handle payment.failed ─────────────────────────────────────────────────
  if (event.event === "payment.failed") {
    const payment = event.payload?.payment?.entity;
    if (payment?.order_id) {
      await supabaseAdmin
        .from("payments")
        .update({ status: "failed", webhook_payload: event })
        .eq("gateway_order_id", payment.order_id);

      await log("payment_webhook", "Payment failed", {
        severity: "warn",
        payload: { razorpay_order_id: payment.order_id },
      });
    }
  }

  return NextResponse.json({ received: true });
}
