import type { Request } from "express";

export type AuthUser = { id: string };

export interface AuthenticatedRequest extends Request {
  user: AuthUser;
}
