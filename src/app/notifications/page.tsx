import React from "react";
import { auth } from "@clerk/nextjs/server";
import { Bell } from "lucide-react";

export default async function NotificationsPage() {
  const { userId } = await auth();
  if (!userId) return null;

  return (
    <main className="min-h-screen bg-cream p-6 max-w-4xl mx-auto">
      <div className="border-brutal border-3 border-brutal-black bg-white p-8" style={{ boxShadow: "8px 8px 0 #0A0A0A" }}>
        <h1 className="text-3xl font-bold text-brutal-black mb-6 uppercase flex items-center gap-3">
          <Bell className="h-8 w-8" />
          Notifications
        </h1>
        <div className="text-center py-12">
          <p className="text-brutal-gray font-mono text-lg">You have no new notifications.</p>
          <p className="text-brutal-gray/60 font-sans mt-2">Updates about your orders will appear here.</p>
        </div>
      </div>
    </main>
  );
}
