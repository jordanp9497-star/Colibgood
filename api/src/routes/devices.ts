import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { validate, getValidated } from "../middleware/validate.js";
import { sendError } from "../lib/http.js";
import { registerDeviceSchema } from "../validation/devices.js";
import type { RegisterDeviceInput } from "../validation/devices.js";
import * as devicesService from "../services/devices.js";
import type { AuthenticatedRequest } from "../types/index.js";

export const devicesRouter = Router();

devicesRouter.post(
  "/devices/register",
  requireAuth,
  validate(registerDeviceSchema),
  async (req, res) => {
    const ar = req as AuthenticatedRequest;
    const body = getValidated<RegisterDeviceInput>(req, "body");
    const { data, error } = await devicesService.registerDevice(ar.user.id, body.token);
    if (error) {
      sendError(res, 500, error.message);
      return;
    }
    res.status(200).json(data ?? { ok: true });
  }
);
