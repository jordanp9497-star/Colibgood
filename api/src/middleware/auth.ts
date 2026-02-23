import { Request, Response, NextFunction } from "express";
import { getUserFromJwt } from "../lib/auth.js";
import { sendError } from "../lib/http.js";
import type { AuthUser } from "../types/index.js";

export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) {
    sendError(res, 401, "Missing or invalid Authorization header (Bearer token required)");
    return;
  }
  const user = await getUserFromJwt(token);
  if (!user) {
    sendError(res, 401, "Invalid or expired token");
    return;
  }
  (req as Request & { user: AuthUser }).user = user;
  next();
}
