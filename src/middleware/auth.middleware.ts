import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/AppError";
import { verifyAccessToken } from "../utils/jwt";



declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}


export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    throw new AppError("Authentication required", 401);
  }
  const token = header.split(" ")[1];
  try {
    req.userId = verifyAccessToken(token).userId;
    next();
  } catch {
    throw new AppError("Invalid or expired token", 401);
  }
}