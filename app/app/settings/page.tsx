"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import Link from "next/link";
import ButtonAccount from "@/components/ButtonAccount";

export default function SettingsPage() {
  const { data: session } = useSession();
  const [notifications, setNotifications] = useState(true);
  const [autoSave, setAutoSave] = useState(true);
  const [defaultStyle, setDefaultStyle] = useState("anime");
  const [isClient, setIsClient] = useState(false);

  // Fix hydration mismatch by only rendering date on client
  useEffect(() => {
    setIsClient(true);
  }, []);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Settings</h1>
        <div className="text-sm text-base-content/60">
          Manage your account and preferences
        </div>
      </div>
      
      <div className="grid gap-6">
        {/* Profile Information */}
        <div className="card bg-base-200 shadow-lg">
          <div className="card-body">
            <h2 className="card-title mb-4">Profile Information</h2>
            
            <div className="flex items-center gap-4 mb-6">
              <div className="avatar">
                <div className="w-16 h-16 rounded-full">
                  {session?.user?.image ? (
                    <img src={session.user.image} alt="Profile" />
                  ) : (
                    <div className="w-16 h-16 bg-[#06b6d4] rounded-full flex items-center justify-center text-white font-semibold text-lg">
                      {session?.user?.name?.[0]?.toUpperCase() || "U"}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg">{session?.user?.name || "User"}</h3>
                <p className="text-base-content/60">{session?.user?.email}</p>
                <p className="text-sm text-base-content/50">
                  Member since {isClient ? formatDate(new Date()) : 'Loading...'}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold">Display Name</span>
                </label>
                <input 
                  type="text" 
                  className="input input-bordered w-full" 
                  defaultValue={session?.user?.name || ""}
                  placeholder="Enter your display name"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Subscription Status */}
        <div className="card bg-base-200 shadow-lg">
          <div className="card-body">
            <div className="flex justify-between items-start mb-4">
              <h2 className="card-title">Subscription & Usage</h2>
              <div className="badge badge-outline">Free Plan</div>
            </div>
            
            <div className="grid md:grid-cols-2 gap-4 mb-6">
              <div className="stats shadow">
                <div className="stat">
                  <div className="stat-title">Current Plan</div>
                  <div className="stat-value text-lg">Free</div>
                  <div className="stat-desc">3 generations / month</div>
                </div>
              </div>
              <div className="stats shadow">
                <div className="stat">
                  <div className="stat-title">Usage This Month</div>
                  <div className="stat-value text-lg">0 / 3</div>
                  <div className="stat-desc">Credits remaining: 3</div>
                </div>
              </div>
            </div>

            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Monthly Usage</span>
                <span className="text-sm">0%</span>
              </div>
              <div className="w-full bg-base-300 rounded-full h-2">
                <div className="bg-[#06b6d4] h-2 rounded-full" style={{width: '0%'}}></div>
              </div>
            </div>

            <div className="flex gap-2">
              <Link href="/#pricing">
                <button className="btn bg-[#06b6d4] hover:bg-[#06b6d4]/90 text-white border-none">
                  Upgrade to Pro
                </button>
              </Link>
              <ButtonAccount />
            </div>
          </div>
        </div>

        {/* Avatar Preferences */}
        <div className="card bg-base-200 shadow-lg">
          <div className="card-body">
            <h2 className="card-title mb-4">Avatar Preferences</h2>
            <div className="space-y-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold">Default Avatar Style</span>
                  <span className="label-text-alt">Choose your preferred generation style</span>
                </label>
                <select 
                  className="select select-bordered w-full max-w-xs"
                  value={defaultStyle}
                  onChange={(e) => setDefaultStyle(e.target.value)}
                >
                  <option value="anime">Anime</option>
                  <option value="realistic">Realistic</option>
                  <option value="cartoon">Cartoon</option>
                  <option value="chibi">Chibi</option>
                </select>
              </div>
              
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold">Default Export Format</span>
                </label>
                <select className="select select-bordered w-full max-w-xs">
                  <option value="png">PNG (High Quality)</option>
                  <option value="jpg">JPG (Smaller Size)</option>
                  <option value="webp">WebP (Best Compression)</option>
                </select>
              </div>

              <div className="form-control">
                <label className="label cursor-pointer">
                  <span className="label-text font-semibold">Auto-save creations</span>
                  <input 
                    type="checkbox" 
                    className="checkbox checkbox-primary"
                    checked={autoSave}
                    onChange={(e) => setAutoSave(e.target.checked)}
                  />
                </label>
                <div className="label">
                  <span className="label-text-alt">Automatically save generated avatars to your collection</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className="card bg-base-200 shadow-lg">
          <div className="card-body">
            <h2 className="card-title mb-4">Notifications</h2>
            <div className="space-y-4">
              <div className="form-control">
                <label className="label cursor-pointer">
                  <span className="label-text font-semibold">Email notifications</span>
                  <input 
                    type="checkbox" 
                    className="checkbox checkbox-primary"
                    checked={notifications}
                    onChange={(e) => setNotifications(e.target.checked)}
                  />
                </label>
                <div className="label">
                  <span className="label-text-alt">Get notified about new features, usage limits, and account updates</span>
                </div>
              </div>

              <div className="form-control">
                <label className="label cursor-pointer">
                  <span className="label-text">Generation completed notifications</span>
                  <input type="checkbox" className="checkbox checkbox-primary" defaultChecked />
                </label>
              </div>

              <div className="form-control">
                <label className="label cursor-pointer">
                  <span className="label-text">Monthly usage reminders</span>
                  <input type="checkbox" className="checkbox checkbox-primary" defaultChecked />
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Data & Privacy */}
        <div className="card bg-base-200 shadow-lg">
          <div className="card-body">
            <h2 className="card-title mb-4">Data & Privacy</h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-semibold">Download your data</p>
                  <p className="text-sm text-base-content/60">Get a copy of all your avatars and account data</p>
                </div>
                <button className="btn btn-outline btn-sm">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Export Data
                </button>
              </div>

              <div className="divider"></div>

              <div className="flex justify-between items-center">
                <div>
                  <p className="font-semibold text-error">Delete account</p>
                  <p className="text-sm text-base-content/60">Permanently delete your account and all data</p>
                </div>
                <button className="btn btn-error btn-outline btn-sm">
                  Delete Account
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Support & Help */}
        <div className="card bg-base-200 shadow-lg">
          <div className="card-body">
            <h2 className="card-title mb-4">Support & Help</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <Link href="https://discord.gg/zysPAnvP8f" target="_blank" rel="noopener noreferrer">
                <button className="btn btn-block btn-outline">
                  <svg className="w-5 h-5 mr-2" fill="#5865F2" viewBox="0 0 24 24">
                    <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419-.019 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1568 2.4189Z"/>
                  </svg>
                  Join Discord Community
                </button>
              </Link>
              
              <Link href="/contact">
                <button className="btn btn-block btn-outline">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  Contact Support
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}