import mongoose from "mongoose";
import User from "@/models/User";

const connectMongo = async () => {
  if (!process.env.MONGODB_URI) {
    // In build time, just return to avoid errors
    if (process.env.NODE_ENV === "production" && !process.env.VERCEL) {
      throw new Error(
        "Add the MONGODB_URI environment variable inside .env.local to use mongoose"
      );
    }
    return;
  }
  return mongoose
    .connect(process.env.MONGODB_URI)
    .catch((e) => console.error("Mongoose Client Error: " + e.message));
};

export default connectMongo;
