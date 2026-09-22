import type { NextFunction, Request, Response } from "express";
import type { ZodSchema, ZodObject } from "zod";

export const validate =
  (schema: ZodSchema) => (req: Request, _res: Response, next: NextFunction) => {
    const shape = (schema as unknown as ZodObject<any>).shape;
    if (shape && (shape.body || shape.query || shape.params)) {
      const parsed = schema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
      }) as any;
      if (parsed.body !== undefined) req.body = parsed.body;
      if (parsed.query !== undefined) req.query = parsed.query;
      if (parsed.params !== undefined) req.params = parsed.params;
    } else {
      const parsed = schema.parse(req.body);
      req.body = parsed;
    }
    next();
  };
