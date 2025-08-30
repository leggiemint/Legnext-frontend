"use client";

import { useSession } from "next-auth/react";
import ButtonAccount from "@/components/ButtonAccount";

export const dynamic = "force-dynamic";

// This is the main app dashboard page
// It's protected by the layout.tsx component which ensures the user is authenticated
// The Header, Sidebar, and Footer are handled in the layout
export default function AppDashboard() {
  const { data: session, status } = useSession();

  // Show loading state while session is being fetched
  if (status === "loading") {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="loading loading-spinner loading-lg text-[#06b6d4]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-[#06b6d4]/10 to-[#6ecfe0]/10 rounded-lg p-8">
        <h1 className="text-3xl md:text-4xl font-extrabold mb-4">
          Welcome back, {session?.user?.name || "Creator"}! 👋
        </h1>
        <p className="text-lg text-base-content/80">
          Ready to create amazing PNGTuber avatars? Let's get started!
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-3 gap-6">
        <div className="card bg-base-200 shadow-lg">
          <div className="card-body">
            <h3 className="card-title">Create New Avatar</h3>
            <p className="text-sm text-base-content/70">Generate a new PNGTuber avatar with AI</p>
            <div className="card-actions justify-end">
              <button className="btn bg-[#06b6d4] hover:bg-[#06b6d4]/90 text-white border-none btn-sm">Create</button>
            </div>
          </div>
        </div>

        <div className="card bg-base-200 shadow-lg">
          <div className="card-body">
            <h3 className="card-title">My Avatars</h3>
            <p className="text-sm text-base-content/70">View and manage your created avatars</p>
            <div className="card-actions justify-end">
              <button className="btn btn-ghost btn-sm">View All</button>
            </div>
          </div>
        </div>

        <div className="card bg-base-200 shadow-lg">
          <div className="card-body">
            <h3 className="card-title">Usage Stats</h3>
            <p className="text-sm text-base-content/70">Track your monthly usage and limits</p>
            <div className="card-actions justify-end">
              <button className="btn btn-ghost btn-sm">View Stats</button>
            </div>
          </div>
        </div>
      </div>

      {/* Account Management */}
      <div className="card bg-base-200 shadow-lg">
        <div className="card-body">
          <h3 className="card-title mb-4">Account Settings</h3>
          <ButtonAccount />
        </div>
      </div>
    </div>
  );
}
