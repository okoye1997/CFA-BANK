import mongoose from "mongoose";

declare global {
  var mongooseCache: { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null } | undefined;
}

const cache = globalThis.mongooseCache ?? { conn: null, promise: null };
globalThis.mongooseCache = cache;

export async function connectMongo() {
  if (cache.conn) return cache.conn;
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI is not configured");
  cache.promise ??= mongoose.connect(uri, { bufferCommands: false });
  try {
    cache.conn = await cache.promise;
    return cache.conn;
  } catch (error) {
    cache.promise = null;
    throw error;
  }
}
