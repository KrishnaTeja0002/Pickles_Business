import crypto from "node:crypto";
import Razorpay from "razorpay";
import { env } from "../config/env.js";
import { HttpError } from "../utils/http-error.js";

const razorpay =
  env.RAZORPAY_KEY_ID && env.RAZORPAY_KEY_SECRET
    ? new Razorpay({ key_id: env.RAZORPAY_KEY_ID, key_secret: env.RAZORPAY_KEY_SECRET })
    : null;

export const createRazorpayOrder = async (amountPaise: number, receipt: string) => {
  if (!razorpay) throw new HttpError(503, "Razorpay is not configured");
  return razorpay.orders.create({
    amount: amountPaise,
    currency: "INR",
    receipt,
    payment_capture: true
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
