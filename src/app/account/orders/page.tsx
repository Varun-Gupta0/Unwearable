import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import type { Order } from "@/types";
import { EmptyOrders, OrderList } from "@/components/account/orders";
import { ErrorState } from "@/components/account/state/ErrorState";
import { EmptyState } from "@/components/account/state/EmptyState";

export const dynamic = "force-dynamic";

export default async function MyOrdersPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  try {
    const { data: orders, error } = await supabaseAdmin
      .from("orders")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      return <ErrorState title="Failed to load orders" message={error.message} />;
    }

    const myOrders = (orders ?? []) as Order[];

    return (
      <div className="px-4 py-8 max-w-4xl mx-auto min-h-screen">
        <h1 className="font-mono text-4xl md:text-5xl font-bold uppercase mb-2">My Orders</h1>
        <p className="font-sans text-brutal-black/60 mb-8">Track your custom pieces and order history</p>
        {myOrders.length === 0 ? (
          <EmptyState title="No orders" description="You have no orders yet." />
        ) : (
          <OrderList orders={myOrders} />
        )}
      </div>
    );
  } catch (e) {
    return <ErrorState title="Unexpected error" message={String(e)} />;
  }
}
