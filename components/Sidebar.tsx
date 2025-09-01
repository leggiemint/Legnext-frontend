"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { PaintBrushIcon, PhotoIcon, Cog6ToothIcon } from "@heroicons/react/24/outline";

const sidebarItems = [
  {
    name: "Create",
    href: "/app/pngtuber-maker",
    icon: <PaintBrushIcon className="w-5 h-5" />,
  },
  {
    name: "My PngTubers",
    href: "/app/pngtubers",
    icon: <PhotoIcon className="w-5 h-5" />,
  },
  {
    name: "Settings",
    href: "/app/settings",
    icon: <Cog6ToothIcon className="w-5 h-5" />,
  },
];

interface UserData {
  user: {
    plan: string;
    name: string;
  };
  credits: {
    balance: number;
    totalEarned: number;
    totalSpent: number;
  };
  planLimits: {
    creditsPerMonth: number;
  };
}

const Sidebar = () => {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (session?.user?.id) {
      setLoading(true);
      fetch('/api/user/settings')
        .then(res => res.json())
        .then(data => {
          setUserData(data);
        })
        .catch(err => console.error('Failed to fetch user data:', err))
        .finally(() => setLoading(false));
    }
  }, [session?.user?.id]);

  return (
    <div className="bg-white w-64 fixed left-0 top-16 h-[calc(100vh-4rem)] flex flex-col z-40">
      {/* Scrollable content area */}
      <div className="overflow-y-auto flex-grow pt-8 pr-0">
        {/* Navigation */}
        <nav className="px-4">
          <ul className="space-y-3">
            {sidebarItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl text-sm transition-all duration-200 hover:scale-[1.02] ${
                      isActive
                        ? "bg-[#4f46e5]/10 text-[#4f46e5] font-semibold shadow-sm"
                        : "text-slate-600 hover:bg-base-300 hover:text-slate-800"
                    }`}
                  >
                    <div className={`${isActive ? "text-[#4f46e5]" : "text-slate-500"} flex-shrink-0`}>
                      {item.icon}
                    </div>
                    <span className="truncate font-medium">{item.name}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

      </div>

             {/* Plan Section */}
       {session && (
         <div className="p-4 border-t border-gray-200 bg-white">
          {loading ? (
            <div className="animate-pulse">
              <div className="h-4 bg-base-300 rounded w-20 mb-2"></div>
              <div className="h-3 bg-base-300 rounded w-16"></div>
            </div>
          ) : userData ? (
            <div className="space-y-3">
              {/* Plan Badge */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`px-2 py-1 rounded-full text-xs font-semibold uppercase tracking-wide ${
                    userData.user.plan === 'pro' 
                      ? 'bg-[#4f46e5]/10 text-[#4f46e5]' 
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {userData.user.plan}
                  </div>
                </div>
              </div>

              {/* Credits Display */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Credits</span>
                  <span className="font-semibold text-gray-900">{userData.credits.balance}</span>
                </div>
                <div className="text-xs text-gray-500">
                  {userData.user.plan === 'pro' ? 'Pro plan' : 'Free plan'}
                </div>
              </div>

              {/* Upgrade Button for Free Users */}
              {userData.user.plan === 'free' && (
                <Link 
                  href="/pricing"
                  className="w-full block text-center bg-gradient-to-r from-[#4f46e5] to-[#0891b2] text-white py-2 px-3 rounded-lg text-sm font-medium hover:from-[#0891b2] hover:to-[#0e7490] transition-all duration-200 hover:scale-[1.02] shadow-sm"
                >
                  ⚡ Upgrade to Pro
                </Link>
              )}
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
};

export default Sidebar;