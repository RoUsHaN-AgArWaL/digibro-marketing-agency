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


const app = express();
app.use(express.json());
app.get("/", (req, res) => {
  res.json({
    message: "DIGIBRO API running"
  });
});

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});


app.use(helmet());
app.use(
  cors({
    origin: (process.env.CLIENT_URL || "http://localhost:5173,http://localhost:4173,https://digibro-marketing-agency.vercel.app/")
      .split(",")
      .map((o) => o.trim())
      .filter(Boolean),
    credentials: true,
  }),
);
app.use(morgan("dev"));
app.use(express.json({ limit: "1mb" }));
app.set("trust proxy", 1);
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200,
    standardHeaders: true,
    legacyHeaders: false,
  }),
);

app.get("/api/health", (req, res) => {
  const database = getDatabaseStatus();
  res.json({
    status: "ok",
    service: "DIGIBRO API",
    database,
    note: database.connected
      ? "MongoDB connected and ready for writes"
      : "Running in demo mode without Mongo when MONGODB_URI is unset or disconnected",
  });
});

app.use("/api/auth", authRouter);
app.use("/api/services", servicesRouter);
app.use("/api/appointments", appointmentsRouter);
app.use("/api/messages", messagesRouter);
app.use("/api/blog", blogRouter);
app.use("/api/portfolio", portfolioRouter);
app.use("/api/dashboard", dashboardRouter);

app.use(errorHandler);

const port = Number(process.env.PORT || 4000);

await connectDB();

export default app;