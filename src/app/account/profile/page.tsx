import { UserProfile } from "@clerk/nextjs";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Profile – Unwearable",
};

export default function ProfilePage() {
  return (
    <div className="px-4 py-8 max-w-3xl mx-auto min-h-screen">
      <h1 className="font-mono text-4xl md:text-5xl font-bold uppercase mb-2">Profile</h1>
      <p className="font-sans text-brutal-black/60 mb-8">
        Manage your account, security and personal information.
      </p>
      <div
        className="border-brutal border-3 border-brutal-black bg-cream p-6"
        style={{ boxShadow: "6px 6px 0 #0A0A0A" }}
      >
        <UserProfile routing="hash" />
      </div>
    </div>
  );
}
