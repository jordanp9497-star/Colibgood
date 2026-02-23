import { z } from "zod";

export const registerDeviceSchema = z.object({
  token: z.string().min(1, "Expo push token required"),
});

export type RegisterDeviceInput = z.infer<typeof registerDeviceSchema>;
