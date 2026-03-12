import app from "../backend/server.js";
import connectDB from "../backend/config/db.js";

export default async function handler(req, res) {
  await connectDB();   // connect MongoDB
  return app(req, res); // run Express
}