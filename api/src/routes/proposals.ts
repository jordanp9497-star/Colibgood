import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { validate, getValidated } from "../middleware/validate.js";
import { sendError } from "../lib/http.js";
import { createProposalSchema } from "../validation/proposals.js";
import type { CreateProposalInput } from "../validation/proposals.js";
import * as proposalsService from "../services/proposals.js";
import type { AuthenticatedRequest } from "../types/index.js";

export const proposalsRouter = Router();

proposalsRouter.get("/proposals", requireAuth, async (req, res) => {
  const ar = req as AuthenticatedRequest;
  const { data, error } = await proposalsService.listProposals(ar.user.id);
  if (error) {
    sendError(res, 500, error.message);
    return;
  }
  res.json({ data });
});

proposalsRouter.post(
  "/proposals",
  requireAuth,
  validate(createProposalSchema),
  async (req, res) => {
    const ar = req as AuthenticatedRequest;
    const body = getValidated<CreateProposalInput>(req, "body");
    const { data, error } = await proposalsService.createProposal(ar.user.id, body);
    if (error) {
      const status = error.message === "Profile verification required"
        ? 403
        : [
        "Listing not found",
        "Shipper cannot propose on own listing",
        "Listing is not active",
        "Trip not found or not yours",
      ].some((m) => error.message === m)
        ? 400
        : 500;
      sendError(res, status, error.message);
      return;
    }
    res.status(201).json(data);
  }
);

proposalsRouter.post("/proposals/:id/accept", requireAuth, async (req, res) => {
  const ar = req as AuthenticatedRequest;
  const { data, error } = await proposalsService.acceptProposal(req.params.id, ar.user.id);
  if (error) {
    const status =
      error.message === "Only shipper can accept" || error.message === "Proposal is not pending"
        ? 403
        : error.message === "A shipment already exists for this listing"
          ? 409
          : 500;
    sendError(res, status, error.message);
    return;
  }
  res.status(201).json(data);
});

proposalsRouter.post("/proposals/:id/reject", requireAuth, async (req, res) => {
  const ar = req as AuthenticatedRequest;
  const { data, error } = await proposalsService.rejectProposal(req.params.id, ar.user.id);
  if (error) {
    const status =
      error.message === "Only shipper can reject" || error.message === "Proposal is not pending" ? 403 : 500;
    sendError(res, status, error.message);
    return;
  }
  res.json(data);
});
