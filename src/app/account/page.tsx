import React from "react";
import { auth } from "@clerk/nextjs/server";
import UserInfo from "@/components/account/UserInfo";
import { EmptyState } from "@/components/account/state/EmptyState";
import { Activity } from "lucide-react";

export default async function AccountPage() {
  const { userId } = await auth();
  if (!userId) {
    // Unauthenticated users will be redirected by middleware; return null.
    return null;
  }

  return (
    <main className="min-h-screen bg-cream p-6">
      <section className="mb-8">
        <UserInfo />
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-bold text-brutal-black mb-4 uppercase flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Recent Activity
        </h2>
        {/* EmptyState is used inline (not full-screen overlay) via className override */}
        <EmptyState
          title="No recent activity"
          description="Start exploring or creating designs to see activity here."
          className="relative inset-auto backdrop-filter-none bg-white border-brutal border-3 border-brutal-black"
        />
      </section>
    </main>
  );
}
