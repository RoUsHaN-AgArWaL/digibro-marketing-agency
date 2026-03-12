import mongoose from "mongoose";

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
  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri) {
    console.warn("MONGODB_URI not defined. Running API without DB connection for demo.");
    return; // skip DB connection for demo / local run
  }

  await mongoose.connect(mongoUri, {
    dbName: process.env.MONGODB_DB || "digibro",
    serverSelectionTimeoutMS: 10000,
  });

  console.log("MongoDB connected");
}