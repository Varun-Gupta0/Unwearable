"use server";

import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

interface RecentOrdersProps {
  userId: string;
}

/**
 * Server component – fetches the 5 most recent orders for the given user.
 * Uses the same query patterns as the existing /account/orders page.
 */
export default async function RecentOrders({ userId }: RecentOrdersProps) {
  const { data: orders, error } = await supabaseAdmin
    .from("orders")
    .select("id, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(5);

  return (
    <section className="border-brutal border-3 border-brutal-black bg-cream p-6">
      <h3 className="text-xl font-bold mb-4 text-brutal-black">Recent Orders</h3>

      {error ? (
        <p className="text-red-600">Failed to load orders.</p>
      ) : orders && orders.length > 0 ? (
        <ul className="space-y-4">
          {orders.map((order: any) => (
            <li key={order.id} className="border-b border-brutal-gray pb-2 last:border-b-0">
              <Link href={`/account/orders/${order.id}`}>
                <a className="flex justify-between items-center hover:underline">
                  <span className="font-medium">Order #{order.id}</span>
                  <span className="text-sm text-brutal-gray">
                    {new Date(order.created_at).toLocaleDateString()}
                  </span>
                </a>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-brutal-gray">You haven’t placed any orders yet.</p>
      )}
    </section>
  );
}
