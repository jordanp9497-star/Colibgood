import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { sendError } from "../lib/http.js";
import { getProfile } from "../services/me.js";
import type { AuthenticatedRequest } from "../types/index.js";

export const meRouter = Router();

meRouter.get("/me", requireAuth, async (req, res) => {
  const ar = req as AuthenticatedRequest;
  const { data, error } = await getProfile(ar.user.id);
  if (error) {
    sendError(res, error.message === "PGRST116" ? 404 : 500, error.message);
    return;
  }
  res.json(data);
});
