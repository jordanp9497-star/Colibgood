import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { validate, getValidated } from "../middleware/validate.js";
import { sendError } from "../lib/http.js";
import { updateShipmentStatusSchema, addProofSchema } from "../validation/shipments.js";
import type { UpdateShipmentStatusInput, AddProofInput } from "../validation/shipments.js";
import * as shipmentsService from "../services/shipments.js";
import type { AuthenticatedRequest } from "../types/index.js";

export const shipmentsRouter = Router();

shipmentsRouter.get("/shipments", requireAuth, async (req, res) => {
  const ar = req as AuthenticatedRequest;
  const { data, error } = await shipmentsService.listShipments(ar.user.id);
  if (error) {
    sendError(res, 500, error.message);
    return;
  }
  res.json({ data });
});

shipmentsRouter.get("/shipments/:id", requireAuth, async (req, res) => {
  const ar = req as AuthenticatedRequest;
  const { data, error } = await shipmentsService.getShipmentById(req.params.id, ar.user.id);
  if (error) {
    sendError(res, error.message === "Forbidden" ? 403 : 404, error.message);
    return;
  }
  res.json(data);
});

shipmentsRouter.get("/shipments/:id/events", requireAuth, async (req, res) => {
  const ar = req as AuthenticatedRequest;
  const { data, error } = await shipmentsService.listShipmentEvents(req.params.id, ar.user.id);
  if (error) {
    sendError(res, error.message === "Forbidden" ? 403 : 404, error.message);
    return;
  }
  res.json(data);
});

shipmentsRouter.post(
  "/shipments/:id/status",
  requireAuth,
  validate(updateShipmentStatusSchema),
  async (req, res) => {
    const ar = req as AuthenticatedRequest;
    const body = getValidated<UpdateShipmentStatusInput>(req, "body");
    const { data, error } = await shipmentsService.updateShipmentStatus(req.params.id, ar.user.id, body);
    if (error) {
      const status =
        error.message === "Only driver can update status"
          ? 403
          : error.message.startsWith("Transition from")
            ? 400
            : 404;
      sendError(res, status, error.message);
      return;
    }
    res.json(data);
  }
);

shipmentsRouter.post(
  "/shipments/:id/proof",
  requireAuth,
  validate(addProofSchema),
  async (req, res) => {
    const ar = req as AuthenticatedRequest;
    const body = getValidated<AddProofInput>(req, "body");
    const { data, error } = await shipmentsService.addProof(req.params.id, ar.user.id, body);
    if (error) {
      sendError(res, error.message === "Forbidden" ? 403 : 404, error.message);
      return;
    }
    res.status(201).json(data);
  }
);
