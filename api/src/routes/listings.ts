import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { validate, getValidated } from "../middleware/validate.js";
import { sendError } from "../lib/http.js";
import {
  createListingSchema,
  updateListingSchema,
  listListingsQuerySchema,
} from "../validation/listings.js";
import type { CreateListingInput, UpdateListingInput, ListListingsQuery } from "../validation/listings.js";
import * as listingsService from "../services/listings.js";
import type { AuthenticatedRequest } from "../types/index.js";

export const listingsRouter = Router();

listingsRouter.get("/listings/feed", requireAuth, async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 20, 100);
  const offset = Number(req.query.offset) || 0;
  const status = (req.query.status as string) ?? "active";
  const { data, error } = await listingsService.listListingsFeed({ status, limit, offset });
  if (error) {
    sendError(res, 500, error.message);
    return;
  }
  res.json({ data });
});

listingsRouter.get("/listings/map", requireAuth, async (req, res) => {
  const lat = Number(req.query.lat);
  const lng = Number(req.query.lng);
  if (Number.isNaN(lat) || Number.isNaN(lng)) {
    sendError(res, 400, "lat and lng query params required");
    return;
  }
  const radius_km = Math.min(Math.max(Number(req.query.radius_km) || 50, 5), 500);
  const limit = Math.min(Number(req.query.limit) || 100, 100);
  const { data, error } = await listingsService.listListingsMap({ lat, lng, radius_km, limit });
  if (error) {
    sendError(res, 500, error.message);
    return;
  }
  res.json({ data });
});

listingsRouter.get(
  "/listings",
  requireAuth,
  validate(listListingsQuerySchema, "query"),
  async (req, res) => {
    const ar = req as AuthenticatedRequest;
    const query = getValidated<ListListingsQuery>(req, "query");
    const { data, error, count } = await listingsService.listListings(ar.user.id, query);
    if (error) {
      sendError(res, 500, error.message);
      return;
    }
    res.json({ data, count });
  }
);

listingsRouter.get("/listings/:id", requireAuth, async (req, res) => {
  const ar = req as AuthenticatedRequest;
  const { data, error } = await listingsService.getListingById(req.params.id, ar.user.id);
  if (error) {
    sendError(res, error.message === "Forbidden" ? 403 : 404, error.message);
    return;
  }
  res.json(data);
});

listingsRouter.post(
  "/listings",
  requireAuth,
  validate(createListingSchema),
  async (req, res) => {
    const ar = req as AuthenticatedRequest;
    const body = getValidated<CreateListingInput>(req, "body");
    const { data, error } = await listingsService.createListing(ar.user.id, body);
    if (error) {
      sendError(res, 500, error.message);
      return;
    }
    res.status(201).json(data);
  }
);

listingsRouter.patch(
  "/listings/:id",
  requireAuth,
  validate(updateListingSchema),
  async (req, res) => {
    const ar = req as AuthenticatedRequest;
    const body = getValidated<UpdateListingInput>(req, "body");
    const { data, error } = await listingsService.updateListing(req.params.id, ar.user.id, body);
    if (error) {
      sendError(res, error.message === "Forbidden or not found" ? 404 : 500, error.message);
      return;
    }
    res.json(data);
  }
);

listingsRouter.delete("/listings/:id", requireAuth, async (req, res) => {
  const ar = req as AuthenticatedRequest;
  const { error } = await listingsService.deleteListing(req.params.id, ar.user.id);
  if (error) {
    sendError(res, 500, error.message);
    return;
  }
  res.status(204).send();
});
