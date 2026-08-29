import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { HttpError } from "../utils/http-error.js";

export type AuthUser = { id: string; role: "CUSTOMER" | "ADMIN" | "SELLER" | "SUPPORT" };

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export const requireAuth = (req: Request, _res: Response, next: NextFunction) => {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice(7) : req.cookies.accessToken;
  if (!token) throw new HttpError(401, "Authentication required");

  try {
    req.user = jwt.verify(token, env.JWT_ACCESS_SECRET) as AuthUser;
    next();
  } catch {
    throw new HttpError(401, "Invalid or expired token");
  }
};

export const requireRole =
  (...roles: AuthUser["role"][]) =>
  (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      throw new HttpError(403, "You do not have permission for this action");
    }
    next();
  };
