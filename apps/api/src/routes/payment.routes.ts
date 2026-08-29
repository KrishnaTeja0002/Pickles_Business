import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../middleware/auth.js";
import { createRazorpayOrder, verifyRazorpaySignature } from "../services/payment.service.js";
import { asyncHandler } from "../utils/async-handler.js";
import { HttpError } from "../utils/http-error.js";
import { prisma } from "../utils/prisma.js";

export const paymentRouter = Router();

paymentRouter.post(
  "/razorpay/order",
  requireAuth,
  asyncHandler(async (req, res) => {
    const { orderId, method } = z.object({ orderId: z.string(), method: z.enum(["RAZORPAY", "UPI", "GOOGLE_PAY", "PHONEPE", "PAYTM", "BHIM"]) }).parse(req.body);
    const order = await prisma.order.findFirst({ where: { id: orderId, userId: req.user!.id } });
    if (!order) throw new HttpError(404, "Order not found");
    const razorpayOrder = await createRazorpayOrder(Math.round(Number(order.total) * 100), order.orderNumber);
    const payment = await prisma.payment.upsert({
      where: { orderId },
      create: { orderId, method, amount: order.total, razorpayOrderId: razorpayOrder.id },
      update: { method, amount: order.total, razorpayOrderId: razorpayOrder.id, status: "CREATED" }
    });
    res.json({ razorpayOrder, payment });
  })
);

paymentRouter.post(
  "/razorpay/verify",
  requireAuth,
  asyncHandler(async (req, res) => {
    const body = z.object({ orderId: z.string(), razorpayOrderId: z.string(), razorpayPaymentId: z.string(), signature: z.string() }).parse(req.body);
    const valid = verifyRazorpaySignature(body.razorpayOrderId, body.razorpayPaymentId, body.signature);
    if (!valid) throw new HttpError(400, "Payment verification failed");
    const payment = await prisma.payment.update({
      where: { orderId: body.orderId },
      data: { status: "CAPTURED", razorpayOrderId: body.razorpayOrderId, razorpayPaymentId: body.razorpayPaymentId, razorpaySignature: body.signature, transactionId: body.razorpayPaymentId }
    });
    await prisma.order.update({ where: { id: body.orderId }, data: { timeline: { create: { status: "ACCEPTED", note: "Payment captured" } } } });
    res.json({ payment });
  })
);

paymentRouter.post(
  "/webhook",
  asyncHandler(async (_req, res) => {
    res.json({ received: true });
  })
);
