import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { log } from "@/lib/logger";

interface VerifyBody {
  rz_order_id: string;
  rz_payment_id: string;
  rz_signature: string;
  order_id: string; // our internal DB order UUID
}

export async function POST(request: NextRequest) {
  // ── Auth guard ────────────────────────────────────────────────────────────
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body: VerifyBody = await request.json();
    const { rz_order_id, rz_payment_id, rz_signature, order_id } = body;

    if (!rz_order_id || !rz_payment_id || !rz_signature || !order_id) {
      return NextResponse.json({ error: "Missing payment verification fields." }, { status: 400 });
    }

    // ── 1. Verify HMAC signature (prevents fake payment confirmation) ─────
    const expectedSig = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
      .update(`${rz_order_id}|${rz_payment_id}`)
      .digest("hex");

    if (expectedSig !== rz_signature) {
      await log("payment_verify", "Invalid HMAC signature — possible tampered request", {
        severity: "critical",
        user_id: userId,
        payload: { rz_order_id, rz_payment_id, order_id },
      });
      return NextResponse.json({ error: "Payment verification failed." }, { status: 400 });
    }

    // ── 2. Confirm order belongs to this user ────────────────────────────
    const { data: order } = await supabaseAdmin
      .from("orders")
      .select("id, user_id, status")
      .eq("id", order_id)
      .single();

    if (!order || order.user_id !== userId) {
      return NextResponse.json({ error: "Order not found." }, { status: 404 });
    }

    // Idempotency: if already paid, return success without re-processing
    if (order.status === "paid" || order.status === "processing" || order.status === "fulfilled") {
      return NextResponse.json({ success: true, already_processed: true });
    }

    // ── 3. Mark payment captured + verified ─────────────────────────────
    await supabaseAdmin
      .from("payments")
      .update({
        gateway_payment_id: rz_payment_id,
        status: "captured",
        verified: true,
      })
      .eq("gateway_order_id", rz_order_id);

    // ── 4. Advance order to "paid" ───────────────────────────────────────
    await supabaseAdmin
      .from("orders")
      .update({ status: "paid" })
      .eq("id", order_id);

    // ── 5. Async: trigger Qikink submission (fire and forget) ────────────
    //    We do NOT await this — user gets success response immediately
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    fetch(`${appUrl}/api/orders/submit`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-internal-key": process.env.INTERNAL_API_KEY ?? "",
      },
      body: JSON.stringify({ order_id }),
    }).catch((err) => {
      log("order_submit_trigger", `Failed to trigger order submission: ${err.message}`, {
        severity: "error",
        order_id,
        user_id: userId,
      });
    });

    return NextResponse.json({ success: true, order_id });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    await log("payment_verify", msg, { severity: "error", user_id: userId });
    return NextResponse.json({ error: "Verification failed.", details: msg }, { status: 500 });
  }
}
