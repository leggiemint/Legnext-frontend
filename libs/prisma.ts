import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { 
  prisma?: PrismaClient;
};

export const prisma = globalForPrisma.prisma || new PrismaClient({
  log: ["error", "warn"], // 记录错误和警告日志，帮助诊断连接问题
  // 优化外部数据库连接配置
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  // 设置连接超时，适用于外部数据库连接
  ...(process.env.NODE_ENV === "production" && {
    transactionOptions: {
      timeout: 10000, // 10 seconds
    },
  }),
});

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export default prisma;
