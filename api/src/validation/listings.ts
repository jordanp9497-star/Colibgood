import { z } from "zod";

const numericOptional = z.union([z.number(), z.string().transform(Number)]).optional();
const intOptional = z.union([z.number().int(), z.string().transform((s) => parseInt(s, 10))]).optional();
const dateOptional = z.union([z.string().datetime(), z.date()]).optional();

export const createListingSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  origin_city: z.string().optional(),
  origin_lat: numericOptional,
  origin_lng: numericOptional,
  destination_city: z.string().optional(),
  destination_lat: numericOptional,
  destination_lng: numericOptional,
  pickup_date: z.string().optional(),
  delivery_deadline: dateOptional,
  weight_kg: numericOptional,
  size_category: z.string().optional(),
  price_cents: intOptional,
});

export const updateListingSchema = createListingSchema.partial().extend({
  status: z.enum(["active", "inactive", "cancelled"]).optional(),
});

export const listListingsQuerySchema = z.object({
  shipper_id: z.string().uuid().optional(),
  status: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  offset: z.coerce.number().int().min(0).optional().default(0),
});

export type CreateListingInput = z.infer<typeof createListingSchema>;
export type UpdateListingInput = z.infer<typeof updateListingSchema>;
export type ListListingsQuery = z.infer<typeof listListingsQuerySchema>;
