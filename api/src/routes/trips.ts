import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { validate, getValidated } from "../middleware/validate.js";
import { sendError } from "../lib/http.js";
import { createTripSchema, updateTripSchema, listTripsQuerySchema } from "../validation/trips.js";
import type { CreateTripInput, UpdateTripInput, ListTripsQuery } from "../validation/trips.js";
import * as tripsService from "../services/trips.js";
import type { AuthenticatedRequest } from "../types/index.js";

export const tripsRouter = Router();

tripsRouter.get(
  "/trips",
  requireAuth,
  validate(listTripsQuerySchema, "query"),
  async (req, res) => {
    const ar = req as AuthenticatedRequest;
    const query = getValidated<ListTripsQuery>(req, "query");
    const { data, error, count } = await tripsService.listTrips(ar.user.id, query);
    if (error) {
      sendError(res, 500, error.message);
      return;
    }
    res.json({ data, count });
  }
);

tripsRouter.get("/trips/:id", requireAuth, async (req, res) => {
  const ar = req as AuthenticatedRequest;
  const { data, error } = await tripsService.getTripById(req.params.id, ar.user.id);
  if (error) {
    sendError(res, error.message === "Forbidden" ? 403 : 404, error.message);
    return;
  }
  res.json(data);
});

tripsRouter.post("/trips", requireAuth, validate(createTripSchema), async (req, res) => {
  const ar = req as AuthenticatedRequest;
  const body = getValidated<CreateTripInput>(req, "body");
  const { data, error } = await tripsService.createTrip(ar.user.id, body);
  if (error) {
    sendError(res, error.message === "Profile verification required" ? 403 : 500, error.message);
    return;
  }
  res.status(201).json(data);
});

tripsRouter.patch(
  "/trips/:id",
  requireAuth,
  validate(updateTripSchema),
  async (req, res) => {
    const ar = req as AuthenticatedRequest;
    const body = getValidated<UpdateTripInput>(req, "body");
    const { data, error } = await tripsService.updateTrip(req.params.id, ar.user.id, body);
    if (error) {
      sendError(res, error.message === "Forbidden or not found" ? 404 : 500, error.message);
      return;
    }
    res.json(data);
  }
);

tripsRouter.delete("/trips/:id", requireAuth, async (req, res) => {
  const ar = req as AuthenticatedRequest;
  const { error } = await tripsService.deleteTrip(req.params.id, ar.user.id);
  if (error) {
    sendError(res, 500, error.message);
    return;
  }
  res.status(204).send();
});
