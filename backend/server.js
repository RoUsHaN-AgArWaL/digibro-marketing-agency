import "dotenv/config";
import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import morgan from "morgan";

import { connectDB, getDatabaseStatus } from "./config/db.js";
import { errorHandler } from "./middleware/errorHandler.js";

import appointmentsRouter from "./routes/appointments.js";
import authRouter from "./routes/auth.js";
import blogRouter from "./routes/blog.js";
import dashboardRouter from "./routes/dashboard.js";
import messagesRouter from "./routes/messages.js";
import portfolioRouter from "./routes/portfolio.js";
import servicesRouter from "./routes/services.js";

// Ensure we establish a DB connection during cold start of the serverless function.
// api/index.js also calls connectDB(), but this guarantees the connection
// is ready before any route handlers run on a given Lambda instance.
await connectDB();

const app = express();

/* ---------- BASIC ---------- */

app.use(express.json());

app.get("/", (req, res) => {
  res.json({ message: "DIGIBRO API running" });
});

/* ---------- SECURITY ---------- */

app.use(helmet());

app.use(
  cors({
    origin: (
      process.env.CLIENT_URL ||
      "http://localhost:5173,http://localhost:4173,https://digibro-marketing-agency.vercel.app"
    )
      .split(",")
      .map((o) => o.trim())
      .filter(Boolean),
    credentials: true,
  })
);

/* ---------- MIDDLEWARE ---------- */

app.use(morgan("dev"));

app.set("trust proxy", 1);

app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200,
    standardHeaders: true,
    legacyHeaders: false,
  })
);

app.use((req, res, next) => {
  res.set("Cache-Control", "no-store");
  next();
});

/* ---------- HEALTH CHECK ---------- */

app.get("/api/health", (req, res) => {
  const database = getDatabaseStatus();

  res.json({
    status: "ok",
    service: "DIGIBRO API",
    database,
    note: database.connected
      ? "MongoDB connected and ready for writes"
      : "MongoDB not connected",
  });
});

/* ---------- DEBUG: SIMPLE DB CHECK ---------- */

app.get("/api/debug-db", async (req, res) => {
  try {
    const conn = await connectDB();
    const database = getDatabaseStatus();

    return res.json({
      ok: true,
      database,
      connectedUriPresent: Boolean(process.env.MONGODB_URI),
      dbNameEnv: process.env.MONGODB_DB || null,
      connectionReady: Boolean(conn),
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: error?.message || "Unknown error",
    });
  }
});

/* ---------- ROUTES ---------- */

app.use("/api/auth", authRouter);
app.use("/api/services", servicesRouter);
app.use("/api/appointments", appointmentsRouter);
app.use("/api/messages", messagesRouter);
app.use("/api/blog", blogRouter);
app.use("/api/portfolio", portfolioRouter);
app.use("/api/dashboard", dashboardRouter);

/* ---------- ERROR HANDLER ---------- */

app.use(errorHandler);

export default app;