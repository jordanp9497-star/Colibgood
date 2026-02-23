import { z } from "zod";

const intOptional = z.union([z.number().int(), z.string().transform((s) => parseInt(s, 10))]).optional();

export const createProposalSchema = z.object({
  listing_id: z.string().uuid(),
  trip_id: z.string().uuid().optional().nullable(),
  price_cents: intOptional,
  message: z.string().optional(),
});

export type CreateProposalInput = z.infer<typeof createProposalSchema>;
