import { Router } from "express";
import { z } from "zod";
import { optionalAuth, requireAuth } from "../middleware/auth.js";
import { createNotification } from "../services/notification.service.js";
import { createRazorpayOrder, isRazorpayConfigured, verifyRazorpaySignature, verifyWebhookSignature } from "../services/payment.service.js";
import { asyncHandler } from "../utils/async-handler.js";
import { HttpError } from "../utils/http-error.js";
import { prisma } from "../utils/prisma.js";
import express from "express";

export const paymentRouter = Router();

// CREATE RAZORPAY ORDER
paymentRouter.post(
  "/razorpay/order",
  optionalAuth,
  asyncHandler(async (req, res) => {
    const { orderId, method } = z
      .object({
        orderId: z.string(),
        method: z.enum(["RAZORPAY", "UPI", "GOOGLE_PAY", "PHONEPE", "PAYTM", "BHIM"]),
      })
      .parse(req.body);

    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        ...(req.user ? { userId: req.user.id } : {}),
      },
    });
    if (!order) throw new HttpError(404, "Order not found");
    if (order.status !== "PENDING_PAYMENT") throw new HttpError(409, "Order is not awaiting payment");

    // Check if we already have a payment record with a valid Razorpay order
    const existingPayment = await prisma.payment.findUnique({ where: { orderId } });
    if (
      existingPayment?.razorpayOrderId &&
      existingPayment.razorpayOrderId.startsWith("order_") &&
      existingPayment.status === "CREATED"
    ) {
      // Return existing Razorpay order (idempotent)
      return res.json({
        razorpayOrderId: existingPayment.razorpayOrderId,
        amount: Number(order.total) * 100,
        currency: "INR",
        keyId: process.env.RAZORPAY_KEY_ID,
        orderId: order.id,
        orderNumber: order.orderNumber,
        configured: isRazorpayConfigured(),
      });
    }

    if (isRazorpayConfigured()) {
      try {
        const razorpayOrder = await createRazorpayOrder(
          Math.round(Number(order.total) * 100),
          order.orderNumber
        );
        await prisma.payment.upsert({
          where: { orderId },
          create: { orderId, method, amount: order.total, razorpayOrderId: razorpayOrder.id },
          update: { method, amount: order.total, razorpayOrderId: razorpayOrder.id, status: "CREATED" },
        });

        return res.json({
          razorpayOrderId: razorpayOrder.id,
          amount: razorpayOrder.amount,
          currency: razorpayOrder.currency,
          keyId: process.env.RAZORPAY_KEY_ID,
          orderId: order.id,
          orderNumber: order.orderNumber,
          configured: true,
        });
      } catch (err: any) {
        console.warn("Razorpay order creation fallback:", err.message || err);
      }
    }

    // Dev / Test simulation fallback
    const payment = await prisma.payment.upsert({
      where: { orderId },
      create: { orderId, method, amount: order.total, razorpayOrderId: `dev_${Date.now()}` },
      update: { method, amount: order.total, status: "CREATED" },
    });
    return res.json({
      razorpayOrderId: payment.razorpayOrderId,
      amount: Number(order.total) * 100,
      currency: "INR",
      keyId: process.env.RAZORPAY_KEY_ID || "rzp_test_dev_mode",
      orderId: order.id,
      orderNumber: order.orderNumber,
      configured: false,
    });
  })
);

// VERIFY RAZORPAY PAYMENT
paymentRouter.post(
  "/razorpay/verify",
  optionalAuth,
  asyncHandler(async (req, res) => {
    const body = z
      .object({
        orderId: z.string(),
        razorpayOrderId: z.string(),
        razorpayPaymentId: z.string(),
        signature: z.string(),
      })
      .parse(req.body);

    // Verify order exists
    const order = await prisma.order.findFirst({
      where: {
        id: body.orderId,
        ...(req.user ? { userId: req.user.id } : {}),
      },
    });
    if (!order) throw new HttpError(404, "Order not found");

    // Idempotency: if already captured, return success
    const existingPayment = await prisma.payment.findUnique({ where: { orderId: body.orderId } });
    if (existingPayment?.status === "CAPTURED") {
      return res.json({ payment: existingPayment, message: "Payment already verified" });
    }

    // Verify signature (skip in dev mode)
    if (isRazorpayConfigured()) {
      const valid = verifyRazorpaySignature(body.razorpayOrderId, body.razorpayPaymentId, body.signature);
      if (!valid) throw new HttpError(400, "Payment verification failed — invalid signature");
    }

    // Update payment and order in transaction
    const result = await prisma.$transaction(async (tx) => {
      const payment = await tx.payment.update({
        where: { orderId: body.orderId },
        data: {
          status: "CAPTURED",
          razorpayPaymentId: body.razorpayPaymentId,
          razorpaySignature: body.signature,
          transactionId: body.razorpayPaymentId,
        },
      });

      // Move reserved stock to sold (remove reservation)
      const items = await tx.orderItem.findMany({ where: { orderId: body.orderId } });
      for (const item of items) {
        await tx.productVariant.update({
          where: { id: item.variantId },
          data: { reserved: { decrement: item.quantity } },
        });
      }

      await tx.order.update({
        where: { id: body.orderId },
        data: {
          status: "CONFIRMED",
          timeline: {
            create: [
              { status: "CONFIRMED", note: `Payment captured. Transaction: ${body.razorpayPaymentId}` },
            ],
          },
        },
      });

      return payment;
    });

    // Clear cart after successful payment if logged in
    if (req.user?.id) {
      const cart = await prisma.cart.findUnique({ where: { userId: req.user.id } });
      if (cart) {
        await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
      }
    }

    // Notification
    createNotification(order.userId, "PAYMENT_CONFIRMED", {
      orderNumber: order.orderNumber,
      amount: String(order.total),
    }).catch(() => {});

    res.json({ payment: result });
  })
);

// DEV MODE: Simulate successful payment (only in development)
paymentRouter.post(
  "/dev/simulate-success",
  optionalAuth,
  asyncHandler(async (req, res) => {
    if (process.env.NODE_ENV === "production") throw new HttpError(403, "Not available in production");

    const { orderId } = z.object({ orderId: z.string() }).parse(req.body);
    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        ...(req.user ? { userId: req.user.id } : {}),
      },
    });
    if (!order) throw new HttpError(404, "Order not found");

    const result = await prisma.$transaction(async (tx) => {
      const payment = await tx.payment.upsert({
        where: { orderId },
        create: {
          orderId,
          method: "RAZORPAY",
          amount: order.total,
          status: "CAPTURED",
          razorpayOrderId: `dev_${Date.now()}`,
          razorpayPaymentId: `pay_dev_${Date.now()}`,
          transactionId: `txn_dev_${Date.now()}`,
        },
        update: {
          status: "CAPTURED",
          razorpayPaymentId: `pay_dev_${Date.now()}`,
          transactionId: `txn_dev_${Date.now()}`,
        },
      });

      const items = await tx.orderItem.findMany({ where: { orderId } });
      for (const item of items) {
        await tx.productVariant.update({
          where: { id: item.variantId },
          data: { reserved: { decrement: item.quantity } },
        });
      }

      await tx.order.update({
        where: { id: orderId },
        data: {
          status: "CONFIRMED",
          timeline: { create: { status: "CONFIRMED", note: "Payment simulated in dev mode" } },
        },
      });

      return payment;
    });

    // Clear cart if logged in
    if (req.user?.id) {
      const cart = await prisma.cart.findUnique({ where: { userId: req.user.id } });
      if (cart) await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
    }

    createNotification(order.userId, "PAYMENT_CONFIRMED", {
      orderNumber: order.orderNumber,
      amount: String(order.total),
    }).catch(() => {});

    res.json({ payment: result, message: "Payment simulated successfully" });
  })
);

// WEBHOOK (Razorpay server-to-server callback)
paymentRouter.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  asyncHandler(async (req, res) => {
    const signature = req.headers["x-razorpay-signature"] as string;
    const body = typeof req.body === "string" ? req.body : JSON.stringify(req.body);

    // Verify webhook signature
    if (isRazorpayConfigured() && signature) {
      try {
        const valid = verifyWebhookSignature(body, signature);
        if (!valid) {
          console.error("Webhook signature verification failed");
          return res.status(400).json({ error: "Invalid signature" });
        }
      } catch {
        console.error("Webhook verification error");
        return res.status(400).json({ error: "Verification error" });
      }
    }

    const event = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    const eventType = event?.event;

    switch (eventType) {
      case "payment.captured": {
        const paymentEntity = event.payload?.payment?.entity;
        if (paymentEntity) {
          const payment = await prisma.payment.findFirst({
            where: { razorpayOrderId: paymentEntity.order_id },
          });
          if (payment && payment.status !== "CAPTURED") {
            await prisma.$transaction(async (tx) => {
              await tx.payment.update({
                where: { id: payment.id },
                data: {
                  status: "CAPTURED",
                  razorpayPaymentId: paymentEntity.id,
                  transactionId: paymentEntity.id,
                },
              });
              await tx.order.update({
                where: { id: payment.orderId },
                data: {
                  status: "CONFIRMED",
                  timeline: { create: { status: "CONFIRMED", note: `Webhook: Payment captured ${paymentEntity.id}` } },
                },
              });
            });
          }
        }
        break;
      }
      case "payment.failed": {
        const paymentEntity = event.payload?.payment?.entity;
        if (paymentEntity) {
          const payment = await prisma.payment.findFirst({
            where: { razorpayOrderId: paymentEntity.order_id },
          });
          if (payment && payment.status !== "CAPTURED") {
            await prisma.$transaction(async (tx) => {
              await tx.payment.update({
                where: { id: payment.id },
                data: {
                  status: "FAILED",
                  failureReason: paymentEntity.error_description || "Payment failed",
                },
              });
              await tx.order.update({
                where: { id: payment.orderId },
                data: {
                  status: "PAYMENT_FAILED",
                  timeline: { create: { status: "PAYMENT_FAILED", note: paymentEntity.error_description || "Payment failed" } },
                },
              });
              // Restore stock
              const items = await tx.orderItem.findMany({ where: { orderId: payment.orderId } });
              for (const item of items) {
                await tx.productVariant.update({
                  where: { id: item.variantId },
                  data: { stock: { increment: item.quantity }, reserved: { decrement: item.quantity } },
                });
              }
            });
          }
        }
        break;
      }
      case "refund.processed": {
        const refundEntity = event.payload?.refund?.entity;
        if (refundEntity) {
          const payment = await prisma.payment.findFirst({
            where: { razorpayPaymentId: refundEntity.payment_id },
          });
          if (payment) {
            await prisma.payment.update({
              where: { id: payment.id },
              data: {
                refundId: refundEntity.id,
                refundAmount: refundEntity.amount / 100,
                refundStatus: "COMPLETED",
              },
            });
            await prisma.order.update({
              where: { id: payment.orderId },
              data: {
                status: "REFUNDED",
                timeline: { create: { status: "REFUNDED", note: `Refund processed: ${refundEntity.id}` } },
              },
            });
          }
        }
        break;
      }
    }

    res.json({ received: true });
  })
);
