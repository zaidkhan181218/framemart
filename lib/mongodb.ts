
import mongoose from "mongoose";

const MONGODB_URI: string = process.env.MONGODB_URI ?? "";

if (!MONGODB_URI) {
  throw new Error(
    "Please define MONGODB_URI in .env.local"
  );
}

type MongooseCache = {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

const globalWithMongoose = globalThis as typeof globalThis & {
  mongooseCache?: MongooseCache;
};

if (!globalWithMongoose.mongooseCache) {
  globalWithMongoose.mongooseCache = {
    conn: null,
    promise: null,
  };
}

export async function connectDB() {
  const cache = globalWithMongoose.mongooseCache!;

  // Already connected
  if (cache.conn) {
    return cache.conn;
  }

  // Start a new connection if one isn't already in progress
  if (!cache.promise) {
    cache.promise = mongoose.connect(MONGODB_URI);
  }

  try {
    cache.conn = await cache.promise;

    return cache.conn;
  } catch (error) {
    cache.promise = null;

    console.error("MongoDB connection error:", error);

    throw error;
  }
}