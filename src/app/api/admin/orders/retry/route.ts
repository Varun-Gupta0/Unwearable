import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { clerkClient } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { log } from "@/lib/logger";

async function requireAdmin(userId: string): Promise<boolean> {
  const adminRole = (process.env.ADMIN_ROLE ?? "admin").toLowerCase();
  const client = await clerkClient();
  const user = await client.users.getUser(userId);
  const role = (user?.publicMetadata?.role as string | undefined)?.toLowerCase();
  return role === adminRole;
}

/**
 * POST /api/admin/orders/retry
 * Body: { order_id: string }
 * Re-triggers Qikink submission for a failed order.
 */
export async function POST(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!(await requireAdmin(userId))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { order_id } = await request.json();
  if (!order_id) return NextResponse.json({ error: "Missing order_id" }, { status: 400 });

  // Reset status to "paid" so submit endpoint accepts it
  const { error } = await supabaseAdmin
    .from("orders")
    .update({ status: "paid", retry_count: 0, error_message: null })
    .eq("id", order_id)
    .eq("status", "failed"); // only retry failed orders

  if (error) {
    return NextResponse.json({ error: "Failed to reset order status." }, { status: 500 });
  }

  // Trigger Qikink submission
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  // Use internal API with rate limiting
  const res = await fetch(`${appUrl}/api/orders/submit`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-internal-key": process.env.INTERNAL_API_KEY ?? "",
    },
    body: JSON.stringify({ order_id }),
  });

  const data = await res.json();
  await log("admin_retry", `Admin retried order ${order_id}`, {
    severity: "info",
    order_id,
    user_id: userId,
  });

  return NextResponse.json(data);
}
