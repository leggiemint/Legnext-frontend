import NextAuth from "next-auth";
import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import GitHubProvider from "next-auth/providers/github";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/libs/prisma";
import config from "@/config";

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  
  // 纯JWT策略，不使用数据库adapter
  // adapter: PrismaAdapter(prisma) as any, // 移除adapter
  
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

  // 纯JWT策略，确保userId唯一性
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  callbacks: {
    async jwt({ token, user, account }) {
      // 在纯JWT策略下，使用email作为唯一标识符
      if (user) {
        // 使用email的hash作为稳定的userId
        const crypto = await import('crypto');
        const userId = crypto.createHash('sha256').update(user.email!).digest('hex');
        token.userId = userId;
        token.email = user.email;
        token.name = user.name;
        token.image = user.image;
      }
      return token;
    },
    
    async session({ session, token }) {
      // 传递稳定的userId到session
      if (token?.userId) {
        session.user.id = token.userId as string;
      }
      if (token?.email) {
        session.user.email = token.email as string;
      }
      if (token?.name) {
        session.user.name = token.name as string;
      }
      if (token?.image) {
        session.user.image = token.image as string;
      }
      return session;
    },
    
    async signIn({ user, account, profile }) {
      try {
        // 在纯JWT策略下，确保用户profile存在
        if (user?.email) {
          console.log(`🔐 User signing in: ${user.email}`);
          
          // 生成稳定的userId
          const crypto = await import('crypto');
          const userId = crypto.createHash('sha256').update(user.email).digest('hex');
          
          // Import here to avoid circular dependency
          const { getUserWithProfile, ensureUserProfile } = await import("./user-helpers");
          
          // This will create profile and backend account if needed
          const userWithProfile = await ensureUserProfile(userId, user.email, user.name, user.image);
          
          if (userWithProfile) {
            console.log(`✅ User profile ready: ${user.email}, plan: ${userWithProfile.profile?.plan}`);
            
            if (userWithProfile.profile?.backendAccountId) {
              console.log(`✅ Backend account connected: ${userWithProfile.profile.backendAccountId}`);
            } else {
              console.warn(`⚠️ User profile created but no backend account ID found`);
            }
          } else {
            console.error(`❌ Failed to ensure user profile for: ${user.email}`);
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
