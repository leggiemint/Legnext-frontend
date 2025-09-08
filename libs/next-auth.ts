import NextAuth from "next-auth";
import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import GitHubProvider from "next-auth/providers/github";
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
    GitHubProvider({
      clientId: process.env.GITHUB_ID!,
      clientSecret: process.env.GITHUB_SECRET!,
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
          const { getUserWithProfile, createUserBackendAccount } = await import("./user-service");
          
          // This will create profile and grant welcome credits if needed
          const userWithProfile = await getUserWithProfile(user.id);
          
          if (userWithProfile) {
            console.log(`✅ User profile ready: ${user.email}, credits: ${userWithProfile.profile.credits}`);
            
            // 🚀 检查并创建后端账户（仅在登录时执行一次）
            const preferences = userWithProfile.profile.preferences as any;
            if (user.email && !preferences?.backendAccountId) {
              console.log(`🔍 Creating backend account for user: ${user.email}`);
              try {
                const backendResult = await createUserBackendAccount(user.id, user.email, userWithProfile.profile.plan);
                console.log(`✅ Backend account created successfully for: ${user.email}`);
                
                // 🎁 授予新用户100欢迎credits (前端+后端同步)
                if (backendResult.success && userWithProfile.profile.totalCreditsEarned === 0) {
                  console.log(`🎁 Granting welcome credits for new user: ${user.email}`);
                  const { grantCredits } = await import("./user-service");
                  
                  const welcomeResult = await grantCredits(
                    user.id,
                    100,
                    "Welcome bonus for new user",
                    "welcome_bonus",
                    null
                  );
                  
                  if (welcomeResult.success) {
                    console.log(`✅ Welcome credits granted to: ${user.email}`);
                  } else {
                    console.warn(`⚠️ Failed to grant welcome credits:`, welcomeResult.error);
                  }
                }
              } catch (error) {
                console.warn(`🔔 Backend account creation failed for ${user.email}:`, error?.message || error);
              }
            }
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
