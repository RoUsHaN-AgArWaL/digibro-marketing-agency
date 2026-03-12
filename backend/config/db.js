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

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

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

export async function connectDB() {
  if (cached.conn) {
    return cached.conn;
  }

  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri) {
    console.warn("MONGODB_URI not defined. Running API without DB connection.");
    return;
  }

  if (!cached.promise) {
    cached.promise = mongoose.connect(mongoUri, {
      dbName: process.env.MONGODB_DB || "digibro",
      serverSelectionTimeoutMS: 10000,
    });
  }

  cached.conn = await cached.promise;

  console.log("MongoDB connected");

  return cached.conn;
}