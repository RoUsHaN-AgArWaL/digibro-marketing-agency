import connectDB from "../backend/config/db.js";
import app from "../backend/server.js";

export default async function handler(req, res) {
  await connectDB();
  return app(req, res);
}

