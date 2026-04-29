import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import Link from "next/link";
import { formatPrice } from "@/lib/utils";
import type { Order } from "@/types";

export const dynamic = "force-dynamic";

export default async function MyOrdersPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  // Fetch user's orders (most recent first)
  const { data: orders } = await supabaseAdmin
    .from("orders")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  const myOrders = (orders ?? []) as Order[];

  const STATUS_COLORS: Record<string, string> = {
    pending: "bg-brutal-black/10 text-brutal-black",
    paid: "bg-blue-100 text-blue-800",
    processing: "bg-yellow-100 text-yellow-800",
    fulfilled: "bg-toxic text-brutal-black",
    failed: "bg-accent/20 text-accent",
    cancelled: "bg-brutal-black/20 text-brutal-black/60",
  };

  return (
    <div className="px-4 py-8 max-w-4xl mx-auto min-h-screen">
      <h1 className="font-mono text-4xl md:text-5xl font-bold uppercase mb-2">My Orders</h1>
      <p className="font-sans text-brutal-black/60 mb-8">Track your custom pieces and order history</p>

      {myOrders.length === 0 ? (
        <div className="border-brutal border-3 border-brutal-black p-12 text-center bg-cream" style={{ boxShadow: "8px 8px 0 #0A0A0A" }}>
          <p className="font-mono text-xl uppercase mb-6 text-brutal-black/40">You haven&apos;t ordered any void-wear yet.</p>
          <Link href="/shop" className="inline-block border-brutal border-3 bg-accent text-cream px-8 py-3 font-mono uppercase font-bold hover:bg-brutal-black transition-colors">
            Start Shopping
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {myOrders.map((order) => (
            <div
              key={order.id}
              className="border-brutal border-3 border-brutal-black bg-cream overflow-hidden"
              style={{ boxShadow: "6px 6px 0 #0A0A0A" }}
            >
              <div className="p-4 md:p-6 border-b-2 border-brutal-black flex flex-wrap justify-between items-center gap-4">
                <div>
                  <p className="font-mono text-xs uppercase text-brutal-black/60">Order Number</p>
                  <p className="font-mono font-bold">{order.order_number}</p>
                </div>
                <div>
                  <p className="font-mono text-xs uppercase text-brutal-black/60">Date</p>
                  <p className="font-sans text-sm">{new Date(order.created_at).toLocaleDateString("en-IN", { dateStyle: "medium" })}</p>
                </div>
                <div>
                  <p className="font-mono text-xs uppercase text-brutal-black/60">Status</p>
                  <span className={`inline-block mt-1 font-mono text-[10px] uppercase px-2 py-0.5 ${STATUS_COLORS[order.status] || ""}`}>
                    {order.status}
                  </span>
                </div>
                <div>
                  <p className="font-mono text-xs uppercase text-brutal-black/60">Total</p>
                  <p className="font-mono font-bold text-accent">{formatPrice(order.total_amount / 100)}</p>
                </div>
              </div>

              <div className="p-4 md:p-6 space-y-4">
                {order.items.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-4">
                    {item.designImageUrl ? (
                      <img
                        src={item.designImageUrl}
                        alt="Design"
                        className="w-16 h-16 object-cover border-2 border-brutal-black/20"
                      />
                    ) : (
                      <div className="w-16 h-16 bg-brutal-black/5 border-2 border-brutal-black/20 flex items-center justify-center text-xs text-brutal-black/40 font-mono">
                        No Image
                      </div>
                    )}
                    <div className="flex-1">
                      <p className="font-mono text-sm font-bold">{item.name}</p>
                      <p className="font-sans text-xs text-brutal-black/60">
                        Size: {item.selectedSize} · Qty: {item.quantity}
                        {item.designId && <span className="ml-2 text-accent">✦ Custom Design</span>}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {order.status === "failed" && (
                <div className="bg-accent/10 p-4 border-t-2 border-brutal-black flex items-center gap-3">
                  <span className="text-xl">⚠</span>
                  <p className="font-sans text-xs text-accent">
                    There was an issue processing your order for fulfillment. Our team is looking into it.
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
