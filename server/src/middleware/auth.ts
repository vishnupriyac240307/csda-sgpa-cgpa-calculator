
import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export interface AuthRequest extends Request {
  userId?: string;
}

export function requireAuth(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  const token = req.cookies?.csda_session;

  if (!token) {
    return res.status(401).json({
      message: "Please log in to continue.",
    });
  }

  try {
    const payload = jwt.verify(
      token,
      process.env.JWT_SECRET!
    ) as { sub: string };

    req.userId = payload.sub;
    next();
  } catch {
    res.clearCookie("csda_session");

    return res.status(401).json({
      message: "Your session has expired. Please log in again.",
    });
  }
}
