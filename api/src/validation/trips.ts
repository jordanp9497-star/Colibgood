import { z } from "zod";

const numericOptional = z.union([z.number(), z.string().transform(Number)]).optional();
const dateOptional = z.union([z.string().datetime(), z.date()]).optional();

export const createTripSchema = z.object({
  origin_city: z.string().optional(),
  origin_lat: numericOptional,
  origin_lng: numericOptional,
  destination_city: z.string().optional(),
  destination_lat: numericOptional,
  destination_lng: numericOptional,
  depart_datetime: dateOptional,
  arrive_datetime: dateOptional,
  capacity_kg: numericOptional,
  notes: z.string().optional(),
});

export const updateTripSchema = createTripSchema.partial();

export const listTripsQuerySchema = z.object({
  driver_id: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  offset: z.coerce.number().int().min(0).optional().default(0),
});

export type CreateTripInput = z.infer<typeof createTripSchema>;
export type UpdateTripInput = z.infer<typeof updateTripSchema>;
export type ListTripsQuery = z.infer<typeof listTripsQuerySchema>;
