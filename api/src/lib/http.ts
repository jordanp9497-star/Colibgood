import type { Response } from "express";

export function sendError(
  res: Response,
  status: number,
  message: string,
  details?: unknown
) {
  if (details === undefined) return res.status(status).json({ error: message });
  return res.status(status).json({ error: message, details });
}

