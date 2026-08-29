import bcrypt from "bcryptjs";
import { Router } from "express";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { env } from "../config/env.js";
import { requireAuth } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { asyncHandler } from "../utils/async-handler.js";
import { HttpError } from "../utils/http-error.js";
import { prisma } from "../utils/prisma.js";
import { loginSchema, refreshSchema, signupSchema } from "../validators/auth.schemas.js";
import { createRefreshToken, signAccessToken } from "../services/token.service.js";

export const authRouter = Router();

const cookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: env.NODE_ENV === "production"
};

authRouter.post(
  "/signup",
  validate(signupSchema),
  asyncHandler(async (req, res) => {
    const existing = await prisma.user.findUnique({ where: { email: req.body.email } });
    if (existing) throw new HttpError(409, "Email is already registered");

    const passwordHash = await bcrypt.hash(req.body.password, 12);
    const user = await prisma.user.create({
      data: {
        name: req.body.name,
        email: req.body.email,
        phone: req.body.phone,
        passwordHash,
        referralCode: `UHT${Math.random().toString(36).slice(2, 8).toUpperCase()}`
      },
      select: { id: true, name: true, email: true, role: true }
    });

    const accessToken = signAccessToken({ id: user.id, role: user.role });
    const refreshToken = await createRefreshToken(user.id);
    res.cookie("accessToken", accessToken, cookieOptions);
    res.cookie("refreshToken", refreshToken, cookieOptions);
    res.status(201).json({ user, accessToken, refreshToken });
  })
);

authRouter.post(
  "/login",
  validate(loginSchema),
  asyncHandler(async (req, res) => {
    const user = await prisma.user.findUnique({ where: { email: req.body.email } });
    if (!user) throw new HttpError(401, "Invalid email or password");
    const valid = await bcrypt.compare(req.body.password, user.passwordHash);
    if (!valid) throw new HttpError(401, "Invalid email or password");

    const accessToken = signAccessToken({ id: user.id, role: user.role });
    const refreshToken = await createRefreshToken(user.id);
    res.cookie("accessToken", accessToken, cookieOptions);
    res.cookie("refreshToken", refreshToken, cookieOptions);
    res.json({
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
      accessToken,
      refreshToken
    });
  })
);

authRouter.post(
  "/refresh",
  validate(refreshSchema),
  asyncHandler(async (req, res) => {
    const token = req.body.refreshToken ?? req.cookies.refreshToken;
    if (!token) throw new HttpError(401, "Refresh token required");

    const records = await prisma.refreshToken.findMany({ where: { revokedAt: null, expiresAt: { gt: new Date() } }, include: { user: true } });
    const match = await Promise.all(records.map(async (record) => ((await bcrypt.compare(token, record.tokenHash)) ? record : null)));
    const refreshRecord = match.find(Boolean);
    if (!refreshRecord) throw new HttpError(401, "Invalid refresh token");

    const accessToken = jwt.sign({ id: refreshRecord.user.id, role: refreshRecord.user.role }, env.JWT_ACCESS_SECRET, { expiresIn: "15m" });
    res.cookie("accessToken", accessToken, cookieOptions);
    res.json({ accessToken });
  })
);

authRouter.post(
  "/otp/verify",
  asyncHandler(async (req, res) => {
    z.object({ phone: z.string().min(10), code: z.string().length(6) }).parse(req.body);
    res.json({ verified: true, message: "OTP verification provider hook ready" });
  })
);

authRouter.post(
  "/forgot-password",
  asyncHandler(async (req, res) => {
    z.object({ email: z.string().email() }).parse(req.body);
    res.json({ message: "Password reset email queued when mail provider is configured" });
  })
);

authRouter.post(
  "/logout",
  requireAuth,
  asyncHandler(async (_req, res) => {
    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");
    res.status(204).send();
  })
);
