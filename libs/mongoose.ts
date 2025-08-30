import mongoose from "mongoose";

// Global variable to track connection status
let isConnected = false;
let connectionPromise: Promise<typeof mongoose> | null = null;

const connectMongo = async () => {
  // If already connected, return existing connection
  if (isConnected && mongoose.connection.readyState === 1) {
    console.log("✅ [DB] Using existing MongoDB connection");
    return mongoose.connection;
  }

  // If connection is in progress, wait for it
  if (connectionPromise) {
    console.log("⏳ [DB] Connection in progress, waiting...");
    return connectionPromise;
  }

  // Create new connection promise
  connectionPromise = mongoose.connect(process.env.MONGODB_URI!, {
    maxPoolSize: 10, // Maintain up to 10 socket connections
    serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
    socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
    bufferCommands: false, // Disable mongoose buffering
    bufferMaxEntries: 0, // Disable mongoose buffering
  });

  try {
    const connection = await connectionPromise;
    isConnected = true;
    console.log("✅ [DB] MongoDB connected successfully");
    
    // Handle connection events
    mongoose.connection.on('connected', () => {
      console.log("✅ [DB] MongoDB connection established");
    });
    
    mongoose.connection.on('error', (err) => {
      console.error("❌ [DB] MongoDB connection error:", err);
      isConnected = false;
    });
    
    mongoose.connection.on('disconnected', () => {
      console.log("⚠️ [DB] MongoDB connection disconnected");
      isConnected = false;
    });
    
    return connection;
  } catch (error) {
    console.error("💥 [DB] Failed to connect to MongoDB:", error);
    isConnected = false;
    connectionPromise = null;
    throw error;
  }
};

export default connectMongo;
