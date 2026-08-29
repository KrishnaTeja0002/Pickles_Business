import { Router } from "express";
import { z } from "zod";
import { asyncHandler } from "../utils/async-handler.js";
import { prisma } from "../utils/prisma.js";

export const cartRouter = Router();

cartRouter.post(
  "/quote",
  asyncHandler(async (req, res) => {
    const body = z
      .object({
        items: z.array(z.object({ variantId: z.string(), quantity: z.number().int().min(1) })),
        coupon: z.string().optional(),
        pincode: z.string().min(6).optional()
      })
      .parse(req.body);
    const variants = await prisma.productVariant.findMany({ where: { id: { in: body.items.map((item) => item.variantId) } }, include: { product: true } });
    const subtotal = body.items.reduce((sum, item) => {
      const variant = variants.find((entry) => entry.id === item.variantId);
      return sum + Number(variant?.price ?? 0) * item.quantity;
    }, 0);
    const coupon = body.coupon ? await prisma.coupon.findUnique({ where: { code: body.coupon.toUpperCase() } }) : null;
    const discount = coupon?.percentOff ? Math.round((subtotal * coupon.percentOff) / 100) : Number(coupon?.amountOff ?? 0);
    const tax = Math.round((subtotal - discount) * 0.05);
    const deliveryCharge = subtotal > 999 ? 0 : 59;
    res.json({
      items: variants,
      subtotal,
      discount,
      tax,
      deliveryCharge,
      total: Math.max(0, subtotal - discount + tax + deliveryCharge),
      delivery: { available: Boolean(body.pincode), estimate: body.pincode ? "2-5 business days" : null }
    });
  })
);
