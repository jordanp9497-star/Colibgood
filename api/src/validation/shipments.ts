import { z } from "zod";

export const SHIPMENT_STATUSES = [
  "created",
  "pickup_scheduled",
  "picked_up",
  "in_transit",
  "delivered",
  "disputed",
  "cancelled",
] as const;

export type ShipmentStatus = (typeof SHIPMENT_STATUSES)[number];

/** Allowed transitions: only driver can move forward (and cancel from non-delivered). */
export const ALLOWED_TRANSITIONS: Record<ShipmentStatus, ShipmentStatus[]> = {
  created: ["pickup_scheduled", "cancelled"],
  pickup_scheduled: ["picked_up", "cancelled"],
  picked_up: ["in_transit", "cancelled"],
  in_transit: ["delivered", "cancelled"],
  delivered: [],
  disputed: [],
  cancelled: [],
};

export const updateShipmentStatusSchema = z.object({
  status: z.enum(SHIPMENT_STATUSES),
});

export const addProofSchema = z.object({
  type: z.string().min(1),
  storage_path: z.string().min(1),
});

export type UpdateShipmentStatusInput = z.infer<typeof updateShipmentStatusSchema>;
export type AddProofInput = z.infer<typeof addProofSchema>;
