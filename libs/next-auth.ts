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
if (typeof window === "undefined" && process.env.NODE_ENV !== "production") {
  // 开发环境
  try {
    connectMongo = require("./mongo").default;
    MongoDBAdapterInstance = MongoDBAdapter;
  } catch (error) {
    console.warn("MongoDB not available in development");
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
    session: async ({ session, token }) => {
      if (session?.user) {
        session.user.id = token.sub;
      }
      return session;
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
