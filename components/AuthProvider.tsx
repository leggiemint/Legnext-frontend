"use client";

import { createContext, useContext, ReactNode } from "react";
import { useSession } from "next-auth/react";

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: any;
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  isLoading: true,
  user: null,
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    // During SSR, return safe defaults instead of throwing
    if (typeof window === 'undefined') {
      return {
        isAuthenticated: false,
        isLoading: true,
        user: null
      };
    }
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const sessionResponse = useSession();
  const session = sessionResponse?.data;
  const status = sessionResponse?.status;

  const value = {
    isAuthenticated: status === "authenticated",
    isLoading: status === "loading",
    user: session?.user || null,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
