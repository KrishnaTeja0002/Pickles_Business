import crypto from "node:crypto";
import type { NextFunction, Request, Response } from "express";
import { env } from "../config/env.js";
import { HttpError } from "../utils/http-error.js";

const cookieName = "csrfToken";

const sign = (token: string) =>
  crypto.createHmac("sha256", env.COOKIE_SECRET).update(token).digest("hex");

export const issueCsrfToken = (_req: Request, res: Response) => {
  const token = crypto.randomBytes(32).toString("hex");
  res.cookie(cookieName, `${token}.${sign(token)}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: env.NODE_ENV === "production"
  });
  res.json({ csrfToken: token });
};

export const csrfProtection = (req: Request, _res: Response, next: NextFunction) => {
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) {
    next();
    return;
  }

  const rawCookie = req.cookies[cookieName];
  const headerToken = req.get("x-csrf-token");
  if (!rawCookie || !headerToken) throw new HttpError(403, "Invalid CSRF token");

  const [cookieToken, signature] = String(rawCookie).split(".");
  if (!cookieToken || !signature || headerToken !== cookieToken || sign(cookieToken) !== signature) {
    throw new HttpError(403, "Invalid CSRF token");
  }

  next();
};
