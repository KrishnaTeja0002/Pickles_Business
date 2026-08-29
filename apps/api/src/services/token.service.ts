import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { prisma } from "../utils/prisma.js";

export const signAccessToken = (payload: { id: string; role: string }) =>
  jwt.sign(payload, env.JWT_ACCESS_SECRET, { expiresIn: "15m" });

export const createRefreshToken = async (userId: string) => {
  const token = crypto.randomBytes(48).toString("hex");
  const tokenHash = await bcrypt.hash(token, 10);
  await prisma.refreshToken.create({
    data: {
      tokenHash,
      userId,
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30)
    }
  });
  return token;
};

export const hashToken = (token: string) => crypto.createHash("sha256").update(token).digest("hex");
