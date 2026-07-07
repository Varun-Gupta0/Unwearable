"use client";

import { useUser } from "@clerk/nextjs";
import Image from "next/image";

export default function UserInfo() {
  const { user } = useUser();

  if (!user) return null;

  const joinedDate = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString()
    : "—";

  return (
    <div
      className="border-brutal border-3 border-brutal-black bg-cream p-6 flex items-center gap-4"
      style={{ boxShadow: "8px 8px 0 #0A0A0A" }}
    >
      {/* Avatar */}
      <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-full border-2 border-brutal-black">
        {user.imageUrl ? (
          <Image src={user.imageUrl} alt="Avatar" fill />
        ) : (
          <div className="bg-gray-200 h-full w-full flex items-center justify-center text-2xl">
            {user.firstName?.charAt(0) ?? "U"}
          </div>
        )}
      </div>

      {/* Profile details */}
      <div>
        <h2 className="text-2xl font-bold text-brutal-black">
          {user.fullName || user.primaryEmailAddress?.emailAddress}
        </h2>
        <p className="text-sm text-brutal-gray">{user.primaryEmailAddress?.emailAddress}</p>
        <p className="mt-1 text-xs text-brutal-gray">Joined: {joinedDate}</p>
      </div>
    </div>
  );
}
