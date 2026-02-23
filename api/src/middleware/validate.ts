import { Request, Response, NextFunction } from "express";
import { z, ZodSchema } from "zod";
import { sendError } from "../lib/http.js";

type Source = "body" | "query" | "params";

export function validate(schema: ZodSchema, source: Source = "body") {
  return (req: Request, res: Response, next: NextFunction) => {
    const raw = req[source];
    const result = schema.safeParse(raw);
    if (!result.success) {
      sendError(res, 400, "Validation failed", result.error.flatten());
      return;
    }
    (req as Request & { [k: string]: unknown })[`_${source}`] = result.data;
    next();
  };
}

export function getValidated<T>(req: Request, source: Source): T {
  return (req as Request & { _body?: T; _query?: T; _params?: T })[`_${source}`] as T;
}
