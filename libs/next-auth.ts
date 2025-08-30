import NextAuth from "next-auth";
import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { MongoDBAdapter } from "@auth/mongodb-adapter";
import config from "@/config";
import connectMongo from "@/libs/mongoose";
import User from "@/models/User";

interface NextAuthOptionsExtended extends NextAuthOptions {
  adapter?: any;
}

// 获取 MongoDB 客户端
let mongoClientPromise: any = null;

// 动态导入，避免构建时执行
if (typeof window === "undefined") {
  try {
    mongoClientPromise = require("./mongo").default;
  } catch (error) {
    console.warn("MongoDB client not available:", error.message);
  }
}

export const authOptions: NextAuthOptionsExtended = {
  // Set any random key in .env.local
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    GoogleProvider({
      // Follow the "Login with Google" tutorial to get your credentials
      clientId: process.env.GOOGLE_ID,
      clientSecret: process.env.GOOGLE_SECRET,
      async profile(profile) {
        return {
          id: profile.sub,
          name: profile.given_name ? profile.given_name : profile.name,
          email: profile.email,
          image: profile.picture,
          googleId: profile.sub, // 确保保存Google ID
          createdAt: new Date(),
        };
      },
    }),
  ],
  // 使用 MongoDB 适配器
  ...(mongoClientPromise && { 
    adapter: MongoDBAdapter(mongoClientPromise) 
  }),

  callbacks: {
    signIn: async ({ user, account, profile }) => {
      if (account?.provider === "google") {
        try {
          await connectMongo();
          
          // 检查用户是否已存在
          let existingUser = await User.findOne({
            $or: [
              { email: user.email },
              { googleId: account.providerAccountId }
            ]
          });

          if (!existingUser) {
            // 创建新用户
            console.log(`🔄 Creating new user for Google ID: ${account.providerAccountId}`);
            existingUser = await User.create({
              name: user.name,
              email: user.email,
              image: user.image,
              googleId: account.providerAccountId,
              plan: "free",
              subscriptionStatus: "inactive",
              credits: {
                balance: 60, // 新用户免费积分
                totalEarned: 60,
                totalSpent: 0,
                lastCreditGrant: {
                  date: new Date(),
                  amount: 60,
                  reason: "welcome_bonus"
                }
              },
              preferences: {
                emailNotifications: true,
                theme: "light"
              },
              lastLoginAt: new Date()
            });
            console.log(`✅ User created successfully: ${existingUser.email}`);
          } else {
            // 更新最后登录时间和Google ID（如果缺失）
            if (!existingUser.googleId) {
              existingUser.googleId = account.providerAccountId;
            }
            existingUser.lastLoginAt = new Date();
            await existingUser.save();
            console.log(`✅ User updated: ${existingUser.email}`);
          }
          
          return true;
        } catch (error) {
          console.error("🚨 Error in signIn callback:", error);
          return false;
        }
      }
      return true;
    },
    session: async ({ session, token, user }) => {
      if (session?.user) {
        try {
          await connectMongo();
          
          // 通过email或Google ID查找用户
          const dbUser = await User.findOne({
            $or: [
              { email: session.user.email },
              { googleId: token.sub }
            ]
          });
          
          if (dbUser) {
            session.user.id = dbUser._id.toString();
            console.log(`✅ Session updated with DB user ID: ${session.user.id}`);
          } else {
            // 如果找不到用户，使用token中的Google ID
            session.user.id = token.sub;
            console.log(`⚠️ Using Google ID as fallback: ${session.user.id}`);
          }
        } catch (error) {
          console.error("🚨 Error in session callback:", error);
          session.user.id = token.sub || user?.id;
        }
      }
      return session;
    },
    jwt: async ({ token, user, account }) => {
      // 如果是首次登录，将用户信息添加到 token
      if (account && user) {
        token.userId = user.id;
        if (account.provider === "google") {
          token.googleId = account.providerAccountId;
        }
      }
      return token;
    },
  },
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/auth/signin",
  },
  theme: {
    brandColor: config.colors.main,
    // PNGTuberMaker logo for authentication pages
    // It will be used in the login flow to display your logo
    logo: `https://${config.domainName}/logo.svg`,
  },
};

export default NextAuth(authOptions);
