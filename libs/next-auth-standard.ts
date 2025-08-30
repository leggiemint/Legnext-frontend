import NextAuth from "next-auth";
import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { MongoDBAdapter } from "@auth/mongodb-adapter";
import config from "@/config";

// 标准的MongoDB客户端 - 专门用于NextAuth
let mongoClientPromise: Promise<any>;

if (typeof window === "undefined") {
  const { MongoClient } = require("mongodb");
  
  const uri = process.env.MONGODB_URI;
  const options = {};

  if (!uri) {
    throw new Error('Please add your MONGODB_URI to .env.local');
  }

  if (process.env.NODE_ENV === "development") {
    // 开发环境使用全局变量避免热重载时重复连接
    if (!global._mongoClientPromise) {
      const client = new MongoClient(uri, options);
      global._mongoClientPromise = client.connect();
    }
    mongoClientPromise = global._mongoClientPromise;
  } else {
    // 生产环境每次都创建新连接
    const client = new MongoClient(uri, options);
    mongoClientPromise = client.connect();
  }
} else {
  // 客户端环境返回rejected promise
  mongoClientPromise = Promise.reject(new Error("MongoDB client only available on server"));
}

// 标准NextAuth配置
export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  
  // 使用MongoDB适配器 - 这是标准做法
  adapter: MongoDBAdapter(mongoClientPromise),
  
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_ID!,
      clientSecret: process.env.GOOGLE_SECRET!,
      // 标准profile映射 - 不需要自定义
    }),
  ],

  // 使用database策略 - 与MongoDB适配器配合
  session: {
    strategy: "database",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  // 标准回调 - 最小化自定义逻辑
  callbacks: {
    session: async ({ session, user }) => {
      // 标准做法：直接使用适配器提供的user数据
      if (session?.user && user) {
        session.user.id = user.id;
      }
      return session;
    },
  },

  // 页面配置
  pages: {
    signIn: "/auth/signin",
  },

  // 主题配置
  theme: {
    brandColor: config.colors.main,
    logo: `https://${config.domainName}/logo.svg`,
  },

  // 调试配置 - 生产环境应设为false
  debug: process.env.NODE_ENV === "development",
};

export default NextAuth(authOptions);
