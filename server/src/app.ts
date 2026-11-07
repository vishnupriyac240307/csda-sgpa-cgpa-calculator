import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import authRoutes from "./routes/auth.js";
import profileRoutes from "./routes/profile.js";
import academicRoutes from "./routes/academic.js";
import curriculumRoutes from "./routes/curriculum.js";

const app = express();
app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL, credentials: true }));
app.use(express.json({ limit: "30kb" }));
app.use(cookieParser());
app.get("/api/health", (_req, res) => res.json({ status: "ok" }));
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 30, standardHeaders: true, legacyHeaders: false });
app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/academic", academicRoutes);
app.use("/api/curriculum", curriculumRoutes);
app.use((err: any, _req: any, res: any, _next: any) => {
  console.error(err);
  res.status(500).json({ message: "An unexpected server error occurred." });
});
export default app;
