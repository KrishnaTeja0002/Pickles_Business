import crypto from "node:crypto";
import Razorpay from "razorpay";
import { env } from "../config/env.js";
import { HttpError } from "../utils/http-error.js";
import { prisma } from "../utils/prisma.js";

const razorpay =
  env.RAZORPAY_KEY_ID && env.RAZORPAY_KEY_SECRET && !env.RAZORPAY_KEY_ID.includes("xxxxx")
    ? new Razorpay({ key_id: env.RAZORPAY_KEY_ID, key_secret: env.RAZORPAY_KEY_SECRET })
    : null;

export const isRazorpayConfigured = () => !!razorpay;

export const createRazorpayOrder = async (amountPaise: number, receipt: string) => {
  if (!razorpay) throw new HttpError(503, "Razorpay is not configured. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to .env");
  return razorpay.orders.create({
    amount: amountPaise,
    currency: "INR",
    receipt,
    payment_capture: true,
  });
};

export const verifyRazorpaySignature = (orderId: string, paymentId: string, signature: string) => {
  if (!env.RAZORPAY_KEY_SECRET) throw new HttpError(503, "Razorpay is not configured");
  const expected = crypto
    .createHmac("sha256", env.RAZORPAY_KEY_SECRET)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
};

export const verifyWebhookSignature = (body: string, signature: string) => {
  if (!env.RAZORPAY_WEBHOOK_SECRET) throw new HttpError(503, "Webhook secret not configured");
  const expected = crypto
    .createHmac("sha256", env.RAZORPAY_WEBHOOK_SECRET)
    .update(body)
    .digest("hex");
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
};

export const initiateRefund = async (paymentId: string, amountPaise: number) => {
  if (!razorpay) throw new HttpError(503, "Razorpay is not configured");
  return razorpay.payments.refund(paymentId, {
    amount: amountPaise,
    speed: "normal",
  });
};
