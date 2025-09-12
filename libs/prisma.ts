import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { 
  prisma?: PrismaClient;
};

export const prisma = globalForPrisma.prisma || new PrismaClient({
  log: ["error"], // 只记录错误日志，不记录查询日志
});

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export default prisma;
