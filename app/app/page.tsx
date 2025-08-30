"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";

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
        <p className="text-lg text-base-content/80 mb-6">
          Ready to create your PNGTuber avatar?
        </p>
        
        {/* Primary CTA Button */}
        <Link href="/app/create">
          <button className="btn btn-lg bg-[#06b6d4] hover:bg-[#06b6d4]/90 text-white border-none px-8 py-3 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200">
            <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Create Avatar
          </button>
        </Link>
      </div>

      {/* My Avatars Section */}
      <div className="card bg-base-200 shadow-lg">
        <div className="card-body">
          <div className="flex justify-between items-center mb-4">
            <h2 className="card-title text-xl">My Avatars</h2>
            <Link href="/app/avatars">
              <button className="btn btn-ghost btn-sm">View All →</button>
            </Link>
          </div>
          
          {/* Recent Avatars Grid - Placeholder for now */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="aspect-square bg-base-300 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <svg className="w-8 h-8 mx-auto mb-2 text-base-content/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                <p className="text-xs text-base-content/60">Create your first avatar</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Usage/Upgrade Section */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="card bg-base-200 shadow-lg">
          <div className="card-body">
            <h3 className="card-title">Usage This Month</h3>
            <div className="mt-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm">Free Plan</span>
                <span className="text-sm font-semibold">0 / 3 credits used</span>
              </div>
              <div className="w-full bg-base-300 rounded-full h-2">
                <div className="bg-[#06b6d4] h-2 rounded-full" style={{width: '0%'}}></div>
              </div>
              <p className="text-xs text-base-content/60 mt-2">3 avatar generations remaining</p>
            </div>
          </div>
        </div>
        
        <div className="card bg-gradient-to-r from-[#06b6d4]/10 to-[#6ecfe0]/10 shadow-lg border border-[#06b6d4]/20">
          <div className="card-body">
            <h3 className="card-title text-[#06b6d4]">Upgrade to Pro</h3>
            <p className="text-sm text-base-content/70 mb-4">Get unlimited generations, HD exports, and more!</p>
            <Link href="/#pricing">
              <button className="btn bg-[#06b6d4] hover:bg-[#06b6d4]/90 text-white border-none btn-sm">
                Upgrade Now
              </button>
            </Link>
          </div>
        </div>
      </div>

    </div>
  );
}
