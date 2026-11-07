import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import User from "../models/User.js";
import { requireAuth, AuthRequest } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();
router.use(requireAuth);
router.get("/", asyncHandler(async (req: AuthRequest, res) => {
  const user = await User.findById(req.userId).select("-passwordHash");
  if (!user) return res.status(404).json({ message: "Profile not found." });
  res.json({ user });
}));
router.patch("/", asyncHandler(async (req: AuthRequest, res) => {
  const schema = z.object({
    fullName: z.string().trim().min(2).max(100),
    rollNumber: z.string().trim().min(1).max(30),
    email: z.string().email().max(150),
    username: z.string().trim().min(3).max(30).regex(/^[a-zA-Z0-9_.-]+$/)
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: parsed.error.issues[0]?.message });
  const data = parsed.data;
  const duplicate = await User.findOne({ _id: { $ne: req.userId }, $or: [
    { email: data.email.toLowerCase() }, { username: data.username.toLowerCase() },
    { rollNumber: data.rollNumber.toUpperCase() }
  ] });
  if (duplicate) return res.status(409).json({ message: "Email, username or roll number is already in use." });
  try {
    const user = await User.findByIdAndUpdate(req.userId, {
      ...data, email: data.email.toLowerCase(), username: data.username.toLowerCase(), rollNumber: data.rollNumber.toUpperCase()
    }, { new: true, runValidators: true }).select("-passwordHash");
    res.json({ user });
  } catch (e: any) {
    if (e.code === 11000) return res.status(409).json({ message: "Email, username or roll number is already in use." });
    throw e;
  }
}));
router.patch("/password", asyncHandler(async (req: AuthRequest, res) => {
  const parsed = z.object({ currentPassword: z.string(), newPassword: z.string().min(8).max(100) }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: "New password must contain at least 8 characters." });
  const user = await User.findById(req.userId).select("+passwordHash");
  if (!user) return res.status(404).json({ message: "Account not found." });
  if (!(await bcrypt.compare(parsed.data.currentPassword, user.passwordHash)))
    return res.status(400).json({ message: "Current password is incorrect." });
  user.passwordHash = await bcrypt.hash(parsed.data.newPassword, 12);
  await user.save();
  res.json({ message: "Password changed successfully." });
}));
export default router;
