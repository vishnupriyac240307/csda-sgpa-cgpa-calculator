import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import User from "../models/User.js";
import { requireAuth, AuthRequest } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();
const signupSchema = z.object({
  fullName: z.string().trim().min(2).max(100),
  rollNumber: z.string().trim().min(1).max(30),
  email: z.string().email().max(150),
  username: z.string().trim().min(3).max(30).regex(/^[a-zA-Z0-9_.-]+$/),
  password: z.string().min(8).max(100)
});
const cookieOptions = () => ({
  httpOnly: true, secure: process.env.NODE_ENV === "production",
  sameSite: (process.env.COOKIE_SAME_SITE || "lax") as "lax" | "none" | "strict",
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: "/"
});
function issueCookie(res: any, id: string) {
  const token = jwt.sign({ sub: id }, process.env.JWT_SECRET!, { expiresIn: "7d" });
  res.cookie("csda_session", token, cookieOptions());
}
router.post("/register", asyncHandler(async (req, res) => {
  const parsed = signupSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: parsed.error.issues[0]?.message || "Invalid details." });
  const data = parsed.data;
  const existing = await User.findOne({ $or: [
    { email: data.email.toLowerCase() }, { username: data.username.toLowerCase() },
    { rollNumber: data.rollNumber.toUpperCase() }
  ] });
  if (existing) return res.status(409).json({ message: "That email, username or roll number is already registered." });
  const passwordHash = await bcrypt.hash(data.password, 12);
  await User.create({ ...data, passwordHash });
  res.status(201).json({ message: "Account created. Please log in." });
}));
router.post("/login", asyncHandler(async (req, res) => {
  const username = String(req.body.username || "").trim().toLowerCase();
  const password = String(req.body.password || "");
  const user = await User.findOne({ username }).select("+passwordHash");
  if (!user || !(await bcrypt.compare(password, user.passwordHash)))
    return res.status(401).json({ message: "Invalid username or password." });
  issueCookie(res, user.id);
  res.json({ user: { id: user.id, fullName: user.fullName, rollNumber: user.rollNumber, email: user.email, username: user.username } });
}));
router.post("/logout", (_req, res) => {
  res.clearCookie("csda_session", { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: (process.env.COOKIE_SAME_SITE || "lax") as any, path: "/" });
  res.json({ message: "Logged out." });
});
router.get("/me", requireAuth, asyncHandler(async (req: AuthRequest, res) => {
  const user = await User.findById(req.userId).select("-passwordHash");
  if (!user) return res.status(401).json({ message: "Account not found." });
  res.json({ user });
}));
export default router;
