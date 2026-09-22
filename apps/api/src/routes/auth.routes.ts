import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { Router } from "express";
import { z } from "zod";
import { env } from "../config/env.js";
import { requireAuth } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { createNotification } from "../services/notification.service.js";
import { createRefreshToken, signAccessToken } from "../services/token.service.js";
import { asyncHandler } from "../utils/async-handler.js";
import { HttpError } from "../utils/http-error.js";
import { prisma } from "../utils/prisma.js";

export const authRouter = Router();

const cookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: env.NODE_ENV === "production",
  path: "/",
};

const signupSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  phone: z.string().min(10).max(15).optional(),
  password: z.string().min(8).max(128),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

// SIGNUP
authRouter.post(
  "/signup",
  validate(signupSchema),
  asyncHandler(async (req, res) => {
    const existing = await prisma.user.findUnique({ where: { email: req.body.email } });
    if (existing) throw new HttpError(409, "Email is already registered");

    if (req.body.phone) {
      const phoneExists = await prisma.user.findUnique({ where: { phone: req.body.phone } });
      if (phoneExists) throw new HttpError(409, "Phone number is already registered");
    }

    const passwordHash = await bcrypt.hash(req.body.password, 12);
    const user = await prisma.user.create({
      data: {
        name: req.body.name,
        email: req.body.email,
        phone: req.body.phone || null,
        passwordHash,
        referralCode: `UHT${crypto.randomBytes(4).toString("hex").toUpperCase()}`,
      },
      select: { id: true, name: true, email: true, phone: true, role: true },
    });

    const accessToken = signAccessToken({ id: user.id, role: user.role });
    const refreshToken = await createRefreshToken(user.id);
    res.cookie("accessToken", accessToken, { ...cookieOptions, maxAge: 15 * 60 * 1000 });
    res.cookie("refreshToken", refreshToken, { ...cookieOptions, maxAge: 30 * 24 * 60 * 60 * 1000 });

    // Welcome notification
    await createNotification(user.id, "WELCOME", { name: user.name }).catch(() => {});

    res.status(201).json({ user, accessToken });
  })
);

// LOGIN
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
    res.cookie("accessToken", accessToken, { ...cookieOptions, maxAge: 15 * 60 * 1000 });
    res.cookie("refreshToken", refreshToken, { ...cookieOptions, maxAge: 30 * 24 * 60 * 60 * 1000 });
    res.json({
      user: { id: user.id, name: user.name, email: user.email, phone: user.phone, role: user.role },
      accessToken,
    });
  })
);

// REFRESH TOKEN
authRouter.post(
  "/refresh",
  asyncHandler(async (req, res) => {
    const token = req.body.refreshToken ?? req.cookies.refreshToken;
    if (!token) throw new HttpError(401, "Refresh token required");

    const records = await prisma.refreshToken.findMany({
      where: { revokedAt: null, expiresAt: { gt: new Date() } },
      include: { user: true },
    });

    let refreshRecord: (typeof records)[0] | undefined;
    for (const record of records) {
      if (await bcrypt.compare(token, record.tokenHash)) {
        refreshRecord = record;
        break;
      }
    }
    if (!refreshRecord) throw new HttpError(401, "Invalid refresh token");

    const accessToken = signAccessToken({ id: refreshRecord.user.id, role: refreshRecord.user.role });
    res.cookie("accessToken", accessToken, { ...cookieOptions, maxAge: 15 * 60 * 1000 });
    res.json({
      accessToken,
      user: {
        id: refreshRecord.user.id,
        name: refreshRecord.user.name,
        email: refreshRecord.user.email,
        phone: refreshRecord.user.phone,
        role: refreshRecord.user.role,
      },
    });
  })
);

// FORGOT PASSWORD
authRouter.post(
  "/forgot-password",
  asyncHandler(async (req, res) => {
    const { email } = z.object({ email: z.string().email() }).parse(req.body);
    const user = await prisma.user.findUnique({ where: { email } });

    if (user) {
      const resetToken = crypto.randomBytes(32).toString("hex");
      const resetHash = crypto.createHash("sha256").update(resetToken).digest("hex");
      await prisma.user.update({
        where: { id: user.id },
        data: {
          passwordResetToken: resetHash,
          passwordResetExpires: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
        },
      });
      // In production, send email with: ${env.WEB_URL}/account/reset-password?token=${resetToken}
      console.log(`[DEV] Password reset token for ${email}: ${resetToken}`);
      console.log(`[DEV] Reset URL: ${env.WEB_URL}/account/reset-password?token=${resetToken}`);
    }

    // Always return success to prevent email enumeration
    res.json({ message: "If that email exists, a password reset link has been sent." });
  })
);

// RESET PASSWORD
authRouter.post(
  "/reset-password",
  asyncHandler(async (req, res) => {
    const { token, password } = z
      .object({ token: z.string().min(1), password: z.string().min(8).max(128) })
      .parse(req.body);

    const resetHash = crypto.createHash("sha256").update(token).digest("hex");
    const user = await prisma.user.findFirst({
      where: {
        passwordResetToken: resetHash,
        passwordResetExpires: { gt: new Date() },
      },
    });

    if (!user) throw new HttpError(400, "Invalid or expired reset token");

    const passwordHash = await bcrypt.hash(password, 12);
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        passwordResetToken: null,
        passwordResetExpires: null,
      },
    });

    // Revoke all refresh tokens
    await prisma.refreshToken.updateMany({
      where: { userId: user.id, revokedAt: null },
      data: { revokedAt: new Date() },
    });

    res.json({ message: "Password reset successful. Please login with your new password." });
  })
);

// CHANGE PASSWORD (requires auth)
authRouter.post(
  "/change-password",
  requireAuth,
  asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = z
      .object({ currentPassword: z.string().min(1), newPassword: z.string().min(8).max(128) })
      .parse(req.body);

    const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
    if (!user) throw new HttpError(404, "User not found");

    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) throw new HttpError(401, "Current password is incorrect");

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash },
    });

    res.json({ message: "Password changed successfully" });
  })
);

// LOGOUT
authRouter.post(
  "/logout",
  requireAuth,
  asyncHandler(async (req, res) => {
    // Revoke all refresh tokens for this user
    await prisma.refreshToken.updateMany({
      where: { userId: req.user!.id, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    res.clearCookie("accessToken", cookieOptions);
    res.clearCookie("refreshToken", cookieOptions);
    res.status(204).send();
  })
);

// GET CURRENT USER (lightweight check)
authRouter.get(
  "/me",
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: { id: true, name: true, email: true, phone: true, role: true },
    });
    if (!user) throw new HttpError(404, "User not found");
    res.json({ user });
  })
);
