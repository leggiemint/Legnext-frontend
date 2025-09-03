"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";

export interface UserProfile {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  profile: {
    plan: string;
    credits: number;
    apiCalls: number;
    subscriptionStatus: string;
    imagesGenerated: number;
    preferences: any;
    totalCreditsEarned: number;
    totalCreditsSpent: number;
  };
}

export const useUserProfile = () => {
  const { data: session, status } = useSession();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUserProfile = async () => {
    if (!session?.user?.id) return;

    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch("/api/user/settings");
      
      if (!response.ok) {
        throw new Error("Failed to fetch user profile");
      }
      
      const data = await response.json();
      setUserProfile(data.user);
    } catch (err) {
      console.error("Error fetching user profile:", err);
      setError(err instanceof Error ? err.message : "Failed to load user profile");
      
      // Fallback to session data if API fails
      if (session?.user) {
        setUserProfile({
          id: session.user.id,
          name: session.user.name,
          email: session.user.email,
          image: session.user.image,
          profile: {
            plan: "free",
            credits: 0,
            apiCalls: 0,
            subscriptionStatus: "inactive",
            imagesGenerated: 0,
            preferences: {},
            totalCreditsEarned: 0,
            totalCreditsSpent: 0,
          }
        });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (status === "authenticated" && session?.user?.id) {
      fetchUserProfile();
    } else if (status === "unauthenticated") {
      setUserProfile(null);
      setError(null);
    }
  }, [session?.user?.id, status]);

  const refetch = () => {
    if (session?.user?.id) {
      fetchUserProfile();
    }
  };

  return {
    userProfile,
    loading: loading || status === "loading",
    error,
    refetch,
    isAuthenticated: status === "authenticated"
  };
};