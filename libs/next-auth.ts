import NextAuth from "next-auth";
import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { MongoDBAdapter } from "@auth/mongodb-adapter";
import config from "@/config";

interface NextAuthOptionsExtended extends NextAuthOptions {
  adapter?: any;
}

// 只在运行时导入 MongoDB 相关代码
let connectMongo: any = null;
let MongoDBAdapterInstance: any = null;

// 动态导入，避免构建时执行
if (typeof window === "undefined") {
  // 生产环境和开发环境都尝试导入
  try {
    connectMongo = require("./mongo").default;
    MongoDBAdapterInstance = MongoDBAdapter;
  } catch (error) {
    console.warn("MongoDB not available:", error.message);
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
          createdAt: new Date(),
        };
      },
    }),
  ],
  // 只在有 MongoDB 连接时才使用适配器
  ...(connectMongo && MongoDBAdapterInstance && { 
    adapter: MongoDBAdapterInstance(connectMongo) 
  }),

  callbacks: {
    session: async ({ session, token, user }) => {
      if (session?.user) {
        // 如果使用 MongoDB 适配器，使用 user.id (MongoDB ObjectId)
        // 如果使用 JWT 策略，使用 token.sub (Google ID)
        session.user.id = user?.id || token.sub;
      }
      return session;
    },
    jwt: async ({ token, user, account }) => {
      // 如果是首次登录，将用户信息添加到 token
      if (account && user) {
        token.userId = user.id;
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
