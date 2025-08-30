"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import Link from "next/link";


interface UserData {
  user: {
    id: string;
    name: string;
    email: string;
    image?: string;
    plan: string;
    subscriptionStatus: string;
    totalAvatarsCreated: number;
    lastLoginAt?: string;
    preferences: any;
  };
  credits: {
    balance: number;
    totalEarned: number;
    totalSpent: number;
    lastCreditGrant: {
      date: string;
      amount: number;
      reason: string;
    };
  };
  planLimits: {
    creditsPerMonth: number;
    animationsAllowed: boolean;
    hdExportsAllowed: boolean;
    watermarkFree: boolean;
    commercialUse: boolean;
  };
  subscription: {
    isActive: boolean;
    plan: string;
    endDate?: string;
  };
}

export default function SettingsPage() {
  const { data: session } = useSession();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);

  // Local form state - simplified to only include name
  const [formData, setFormData] = useState({
    name: "",
  });

  // Fix hydration mismatch by only rendering date on client
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Fetch user data
  useEffect(() => {
    if (session?.user) {
      fetchUserData();
    } else if (session === null) {
      // Session is null, user is not logged in
      setIsLoading(false);
    }
  }, [session]);

  const fetchUserData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch("/api/user/settings");
      
      if (!response.ok) {
        throw new Error("Failed to fetch user data");
      }
      
      const data: UserData = await response.json();
      setUserData(data);
      
      // Update form data with fetched user data
      setFormData({
        name: data.user.name || "",
      });
    } catch (err) {
      console.error("Error fetching user data:", err);
      setError("Failed to load user settings");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    try {
      setIsSaving(true);
      setError(null);
      setSuccessMessage(null);

      const response = await fetch("/api/user/settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          profile: {
            name: formData.name,
          },
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save settings");
      }

      await response.json();
      setSuccessMessage("Settings saved successfully!");
      
      // Update local user data
      if (userData) {
        setUserData({
          ...userData,
          user: {
            ...userData.user,
            name: formData.name,
          },
        });
      }

      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error("Error saving settings:", err);
      setError("Failed to save settings. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString || !isClient) return 'Loading...';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="loading loading-spinner loading-lg text-[#06b6d4]"></div>
          <p className="mt-4 text-gray-600">Loading your settings...</p>
        </div>
      </div>
    );
  }

  // Show content for non-logged in users
  if (!session?.user && !isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Settings</h1>
          <div className="text-sm text-base-content/60">
            Account settings and preferences
          </div>
        </div>

        <div className="card bg-base-200 shadow-lg">
          <div className="card-body text-center py-12">
            <div className="mb-6">
              <svg className="w-16 h-16 mx-auto text-base-content/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2">Settings Unavailable</h3>
            <p className="text-base-content/60 mb-6 max-w-md mx-auto">
              Settings are only available for logged-in users. Your preferences and account details can be managed once you&apos;re signed in.
            </p>
            <div className="space-y-3">
              <p className="text-sm text-base-content/50">
                You can customize your profile, manage subscriptions, and track your usage after signing in.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error && !userData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-red-500 mb-4">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.864-.833-2.634 0L4.18 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <p className="text-red-600 mb-4">{error}</p>
          <button onClick={fetchUserData} className="btn btn-primary">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Settings</h1>
        <div className="text-sm text-base-content/60">
          Manage your account and preferences
        </div>
      </div>

      {/* Success/Error Messages */}
      {successMessage && (
        <div className="alert alert-success">
          <svg className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          <span>{successMessage}</span>
        </div>
      )}

      {error && (
        <div className="alert alert-error">
          <svg className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          <span>{error}</span>
        </div>
      )}
      
      <div className="grid gap-6">
        {/* Profile Information */}
        <div className="card bg-base-200 shadow-lg">
          <div className="card-body">
            <h2 className="card-title mb-4">Profile Information</h2>
            
            <div className="flex items-center gap-4 mb-6">
              <div className="avatar">
                <div className="w-16 h-16 rounded-full">
                  {userData?.user?.image ? (
                    <img src={userData.user.image} alt="Profile" />
                  ) : (
                    <div className="w-16 h-16 bg-[#06b6d4] rounded-full flex items-center justify-center text-white font-semibold text-lg">
                      {userData?.user?.name?.[0]?.toUpperCase() || "U"}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg">{userData?.user?.name || "User"}</h3>
                <p className="text-base-content/60">{userData?.user?.email}</p>
                <p className="text-sm text-base-content/50">
                  Member since {formatDate(userData?.user?.lastLoginAt)}
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
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter your display name"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Credits & Subscription */}
        <div className="card bg-base-200 shadow-lg">
          <div className="card-body">
            <div className="flex justify-between items-start mb-4">
              <h2 className="card-title">Credits & Subscription</h2>
              <div className={`badge ${userData?.user?.plan === 'pro' ? '!bg-[#06b6d4] !text-white' : 'badge-outline'}`}>
                {userData?.user?.plan?.toUpperCase() || 'FREE'} Plan
              </div>
            </div>
            
            <div className="grid md:grid-cols-3 gap-4 mb-6">
              <div className="stats shadow">
                <div className="stat">
                  <div className="stat-title">Credit Balance</div>
                  <div className="stat-value text-lg text-[#06b6d4]">{userData?.credits?.balance || 0}</div>
                  <div className="stat-desc">
                    ${((userData?.credits?.balance || 0) * 0.1).toFixed(2)} worth
                  </div>
                </div>
              </div>
              <div className="stats shadow">
                <div className="stat">
                  <div className="stat-title">Credits Spent</div>
                  <div className="stat-value text-lg">{userData?.credits?.totalSpent || 0}</div>
                  <div className="stat-desc">
                    ${((userData?.credits?.totalSpent || 0) * 0.1).toFixed(2)} total
                  </div>
                </div>
              </div>
              <div className="stats shadow">
                <div className="stat">
                  <div className="stat-title">Monthly Allowance</div>
                  <div className="stat-value text-lg">{userData?.planLimits?.creditsPerMonth || 0}</div>
                  <div className="stat-desc">
                    {userData?.user?.plan === 'pro' ? '260 credits/month' : '60 credits/month'}
                  </div>
                </div>
              </div>
            </div>

            {/* Credit Usage Info */}
            <div className="bg-base-300 rounded-lg p-4 mb-4">
              <h3 className="font-semibold mb-2">Credit Costs</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                <div>Avatar Generation: <span className="font-semibold">5 credits</span></div>
                <div>Expression Pack: <span className="font-semibold">3 credits</span></div>
                <div>Animation: <span className="font-semibold">2 credits</span></div>
                <div>HD Export: <span className="font-semibold">1 credit</span></div>
              </div>
            </div>

            {/* Plan Features */}
            <div className="mb-4">
              <h3 className="font-semibold mb-2">Plan Features</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex items-center gap-2">
                  {userData?.planLimits?.animationsAllowed ? (
                    <span className="text-green-500">✓</span>
                  ) : (
                    <span className="text-red-500">✗</span>
                  )}
                  <span>Animations</span>
                </div>
                <div className="flex items-center gap-2">
                  {userData?.planLimits?.hdExportsAllowed ? (
                    <span className="text-green-500">✓</span>
                  ) : (
                    <span className="text-red-500">✗</span>
                  )}
                  <span>HD Exports</span>
                </div>
                <div className="flex items-center gap-2">
                  {userData?.planLimits?.watermarkFree ? (
                    <span className="text-green-500">✓</span>
                  ) : (
                    <span className="text-red-500">✗</span>
                  )}
                  <span>No Watermark</span>
                </div>
                <div className="flex items-center gap-2">
                  {userData?.planLimits?.commercialUse ? (
                    <span className="text-green-500">✓</span>
                  ) : (
                    <span className="text-red-500">✗</span>
                  )}
                  <span>Commercial Use</span>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <Link href="/pricing">
                <button className="btn bg-[#06b6d4] hover:bg-[#06b6d4]/90 text-white border-none">
                  {userData?.user?.plan === 'pro' ? 'Manage Subscription' : 'Upgrade to Pro'}
                </button>
              </Link>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="card bg-base-200 shadow-lg">
          <div className="card-body">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-semibold">Save Changes</h3>
                <p className="text-sm text-base-content/60">Update your profile information</p>
              </div>
              <button 
                className="btn bg-[#06b6d4] hover:bg-[#06b6d4]/90 text-white border-none"
                onClick={handleSaveSettings}
                disabled={isSaving}
              >
                {isSaving ? (
                  <>
                    <span className="loading loading-spinner loading-sm"></span>
                    Saving...
                  </>
                ) : (
                  "Save Settings"
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}