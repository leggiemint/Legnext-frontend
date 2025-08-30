import mongoose from "mongoose";
import User from "@/models/User";

const connectMongo = async () => {
  // 在构建时直接返回，避免连接数据库
  if (typeof window !== "undefined" || process.env.NODE_ENV === "production") {
    return;
  }
  
  if (!process.env.MONGODB_URI) {
    // 开发环境但没有 URI
    throw new Error(
      "Add the MONGODB_URI environment variable inside .env.local to use mongoose"
    );
  }
  
  return mongoose
    .connect(process.env.MONGODB_URI)
    .catch((e) => console.error("Mongoose Client Error: " + e.message));
};

export default connectMongo;
