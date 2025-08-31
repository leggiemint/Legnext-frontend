import NextAuth from "next-auth";
import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/libs/prisma";
import config from "@/config";

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  
  // Use Prisma adapter for PostgreSQL - type cast for compatibility
  adapter: PrismaAdapter(prisma) as any,
  
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_ID!,
      clientSecret: process.env.GOOGLE_SECRET!,
    }),
  ],

  // Use JWT strategy for better performance
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  callbacks: {
    async jwt({ token, user, account }) {
      // Store user ID in token when user signs in
      if (user) {
        token.userId = user.id;
      }
      return token;
    },
    
    async session({ session, token }) {
      // Pass user ID to session
      if (token?.userId) {
        session.user.id = token.userId as string;
      }
      return session;
    },
    
    async signIn({ user, account, profile }) {
      try {
        // Ensure user profile exists and welcome credits are granted
        if (user?.id) {
          console.log(`🔐 User signing in: ${user.email} (${user.id})`);
          
          // Import here to avoid circular dependency
          const { getUserWithProfile } = await import("./user-service");
          
          // This will create profile and grant welcome credits if needed
          const userWithProfile = await getUserWithProfile(user.id);
          
          if (userWithProfile) {
            console.log(`✅ User profile ready: ${user.email}, credits: ${userWithProfile.profile.credits}`);
          } else {
            console.error(`❌ Failed to get/create user profile for: ${user.email}`);
          }
        }
        
        return true; // Allow sign in
      } catch (error) {
        console.error("Error in signIn callback:", error);
        // Still allow sign in even if profile creation fails
        return true;
      }
    },
  },
  
  pages: {
    signIn: "/auth/signin",
  },
  
  theme: {
    brandColor: config.colors.main,
    logo: `https://${config.domainName}/logo.svg`,
  },
};

export default NextAuth(authOptions);
