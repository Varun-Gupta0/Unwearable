import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { clerkClient } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import AdminOrdersClient from "./AdminOrdersClient";
import type { Order } from "@/types";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminOrdersPage() {
  // ── Admin guard ─────────────────────────────────────────────────────────
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const adminEmail = (process.env.ADMIN_EMAIL || "varungupta010307@gmail.com").toLowerCase();
  const client = await clerkClient();
  const clerkUser = await client.users.getUser(userId);
  const userEmail = clerkUser?.primaryEmailAddress?.emailAddress?.toLowerCase();
  if (userEmail !== adminEmail) redirect("/");

  // ── Fetch orders (most recent 50) ───────────────────────────────────────
  const { data: orders } = await supabaseAdmin
    .from("orders")
    .select("*, payments(*)")
    .order("created_at", { ascending: false })
    .limit(50);

  // ── Stats ────────────────────────────────────────────────────────────────
  const allOrders = (orders ?? []) as Order[];
  const stats = {
    total: allOrders.length,
    paid: allOrders.filter((o) => o.status === "paid").length,
    fulfilled: allOrders.filter((o) => o.status === "fulfilled").length,
    failed: allOrders.filter((o) => o.status === "failed").length,
    revenue: allOrders
      .filter((o) => ["paid", "processing", "fulfilled"].includes(o.status))
      .reduce((sum, o) => sum + (o.total_amount ?? 0), 0),
  };

  return (
    <div className="px-4 py-8 max-w-7xl mx-auto">
      <h1 className="font-mono text-4xl md:text-5xl font-bold uppercase mb-2">
        Orders Dashboard
      </h1>
      <p className="font-sans text-brutal-black/60 mb-8">
        Manage all customer orders and Qikink submissions
      </p>

      {/* Stats bar */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        {[
          { label: "Total Orders", value: stats.total },
          { label: "Paid", value: stats.paid },
          { label: "Fulfilled", value: stats.fulfilled },
          { label: "Failed", value: stats.failed },
          {
            label: "Revenue",
            value: `₹${(stats.revenue / 100).toLocaleString("en-IN")}`,
          },
        ].map(({ label, value }) => (
          <div
            key={label}
            className="border-brutal border-3 border-brutal-black bg-cream p-4"
            style={{ boxShadow: "4px 4px 0 #0A0A0A" }}
          >
            <p className="font-mono text-xs uppercase text-brutal-black/60 mb-1">{label}</p>
            <p className="font-mono text-2xl font-bold">{value}</p>
          </div>
        ))}
      </div>

      {/* Admin Tab Navigation */}
      <div className="flex gap-4 mb-8 border-b-3 border-brutal-black pb-4">
        <a href="/admin" className="font-mono text-sm uppercase hover:text-accent transition-colors text-brutal-black/60">Products</a>
        <a href="/admin/templates" className="font-mono text-sm uppercase hover:text-accent transition-colors text-brutal-black/60">Templates</a>
        <span className="font-mono text-sm uppercase font-bold border-b-3 border-accent pb-4 -mb-4">Orders</span>
      </div>

      {/* Orders table (client component for interactivity) */}
      <AdminOrdersClient initialOrders={allOrders} />
    </div>
  );
}
