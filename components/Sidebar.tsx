"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";

const sidebarItems = [
  {
    name: "PngTuber Maker",
    href: "/app/pngtuber-maker",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.982 18.725A7.488 7.488 0 0 0 12 15.75a7.488 7.488 0 0 0-5.982 2.975m11.963 0a9 9 0 1 0-11.963 0m11.963 0A8.966 8.966 0 0 1 12 21a8.966 8.966 0 0 1-5.982-2.275M15 9.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
      </svg>
    ),
  },
  {
    name: "My PngTubers",
    href: "/app/avatars",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    name: "Settings",
    href: "/app/settings",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
];

interface UserData {
  user: {
    plan: string;
    name: string;
  };
  credits: {
    balance: number;
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
                        ? "bg-[#06b6d4]/10 text-[#06b6d4] font-semibold shadow-sm"
                        : "text-slate-600 hover:bg-base-300 hover:text-slate-800"
                    }`}
                  >
                    <div className={`${isActive ? "text-[#06b6d4]" : "text-slate-500"} flex-shrink-0`}>
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
                      ? 'bg-[#06b6d4]/10 text-[#06b6d4]' 
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
                {userData.user.plan === 'pro' && userData.planLimits.creditsPerMonth > 0 && (
                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                    <div 
                      className="bg-[#06b6d4] h-1.5 rounded-full transition-all duration-300"
                      style={{
                        width: `${Math.min(100, (userData.credits.balance / userData.planLimits.creditsPerMonth) * 100)}%`
                      }}
                    ></div>
                  </div>
                )}
              </div>

              {/* Upgrade Button for Free Users */}
              {userData.user.plan === 'free' && (
                <Link 
                  href="/pricing"
                  className="w-full block text-center bg-gradient-to-r from-[#06b6d4] to-[#0891b2] text-white py-2 px-3 rounded-lg text-sm font-medium hover:from-[#0891b2] hover:to-[#0e7490] transition-all duration-200 hover:scale-[1.02] shadow-sm"
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