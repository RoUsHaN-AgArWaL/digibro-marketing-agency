// import mongoose from "mongoose";

// export function isDatabaseConnected() {
//   return mongoose.connection.readyState === 1;
// }

// export function getDatabaseStatus() {
//   return {
//     connected: isDatabaseConnected(),
//     readyState: mongoose.connection.readyState,
//     host: mongoose.connection.host || null,
//     name: mongoose.connection.name || process.env.MONGODB_DB || "digibro",
//   };
// }

// export async function connectDB() {
//   const mongoUri = process.env.MONGODB_URI;

//   if (!mongoUri) {
//     console.warn("MONGODB_URI not defined. Running API without DB connection.");
//     return;
//   }

//   await mongoose.connect(mongoUri, {
//     dbName: process.env.MONGODB_DB || "digibro",
//     serverSelectionTimeoutMS: 10000,
//   });

//   console.log("MongoDB connected");
// }

import mongoose from "mongoose";

/*
  Global Mongoose configuration
  - Disable query buffering so we fail fast instead of timing out
*/

mongoose.set("bufferCommands", false);

/*
  Global cache for serverless environments (Vercel / AWS Lambda)
  Prevents multiple MongoDB connections
*/

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = {
    conn: null,
    promise: null,
  };
}

/* ---------- DATABASE STATUS ---------- */

export function isDatabaseConnected() {
  return mongoose.connection.readyState === 1;
}

export function getDatabaseStatus() {
  return {
    connected: isDatabaseConnected(),
    readyState: mongoose.connection.readyState,
    host: mongoose.connection.host || null,
    name: mongoose.connection.name || process.env.MONGODB_DB || "digibro",
  };
}

/* ---------- CONNECT DATABASE ---------- */

export async function connectDB() {
  if (cached.conn) {
    return cached.conn;
  }

  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri) {
    console.warn(
      "⚠️ MONGODB_URI not defined. Running API without database connection."
    );
    return;
  }

  if (!cached.promise) {
    cached.promise = mongoose.connect(mongoUri, {
      dbName: process.env.MONGODB_DB || "digibro",
      serverSelectionTimeoutMS: 10000,
    });
  }

  try {
    cached.conn = await cached.promise;

    console.log("✅ MongoDB connected");

    return cached.conn;
  } catch (error) {
    cached.promise = null;

    console.error("❌ MongoDB connection failed:", error);

    throw error;
  }
}