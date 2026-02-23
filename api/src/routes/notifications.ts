import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { sendError } from "../lib/http.js";
import * as notificationsService from "../services/notifications.js";
import type { AuthenticatedRequest } from "../types/index.js";

export const notificationsRouter = Router();

notificationsRouter.get("/notifications", requireAuth, async (req, res) => {
  const ar = req as AuthenticatedRequest;
  const limit = Math.min(Number(req.query.limit) || 50, 100);
  const { data, error } = await notificationsService.listNotifications(ar.user.id, limit);
  if (error) {
    sendError(res, 500, error.message);
    return;
  }
  res.json({ data });
});
