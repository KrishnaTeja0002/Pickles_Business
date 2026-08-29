import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../middleware/auth.js";
import { asyncHandler } from "../utils/async-handler.js";
import { HttpError } from "../utils/http-error.js";
import { prisma } from "../utils/prisma.js";

export const orderRouter = Router();
orderRouter.use(requireAuth);

orderRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const orders = await prisma.order.findMany({ where: { userId: req.user!.id }, include: { items: true, payment: true, timeline: true }, orderBy: { createdAt: "desc" } });
    res.json({ orders });
  })
);

orderRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const body = z
      .object({
        addressId: z.string(),
        items: z.array(z.object({ productId: z.string(), variantId: z.string(), quantity: z.number().int().min(1) })),
        couponCode: z.string().optional(),
        giftWrap: z.boolean().default(false),
        giftMessage: z.string().optional()
      })
      .parse(req.body);
    const address = await prisma.address.findFirst({ where: { id: body.addressId, userId: req.user!.id } });
    if (!address) throw new HttpError(404, "Address not found");

    const variants = await prisma.productVariant.findMany({ where: { id: { in: body.items.map((item) => item.variantId) } }, include: { product: true } });
    const subtotal = body.items.reduce((sum, item) => sum + Number(variants.find((variant) => variant.id === item.variantId)?.price ?? 0) * item.quantity, 0);
    const coupon = body.couponCode ? await prisma.coupon.findUnique({ where: { code: body.couponCode.toUpperCase() } }) : null;
    const discount = coupon?.percentOff ? Math.round((subtotal * coupon.percentOff) / 100) : Number(coupon?.amountOff ?? 0);
    const tax = Math.round((subtotal - discount) * 0.05);
    const deliveryCharge = subtotal > 999 ? 0 : 59;
    const total = subtotal - discount + tax + deliveryCharge + (body.giftWrap ? 49 : 0);

    const order = await prisma.order.create({
      data: {
        orderNumber: `UHT-${Date.now()}`,
        userId: req.user!.id,
        addressSnapshot: address,
        subtotal,
        discount,
        tax,
        deliveryCharge,
        total,
        giftWrap: body.giftWrap,
        giftMessage: body.giftMessage,
        couponId: coupon?.id,
        items: {
          create: body.items.map((item) => {
            const variant = variants.find((entry) => entry.id === item.variantId);
            if (!variant) throw new HttpError(422, "Invalid product variant");
            return {
              productId: item.productId,
              variantId: item.variantId,
              name: variant.product.name,
              weight: variant.weight,
              quantity: item.quantity,
              price: variant.price,
              total: Number(variant.price) * item.quantity
            };
          })
        },
        timeline: { create: { status: "PLACED", note: "Order received" } }
      },
      include: { items: true, timeline: true }
    });

    res.status(201).json({ order });
  })
);

orderRouter.patch(
  "/:id/cancel",
  asyncHandler(async (req, res) => {
    const order = await prisma.order.findFirst({ where: { id: req.params.id, userId: req.user!.id } });
    if (!order) throw new HttpError(404, "Order not found");
    if (!["PLACED", "ACCEPTED"].includes(order.status)) throw new HttpError(409, "Order can no longer be cancelled");
    const updated = await prisma.order.update({
      where: { id: order.id },
      data: { status: "CANCELLED", timeline: { create: { status: "CANCELLED", note: "Cancelled by customer" } } }
    });
    res.json({ order: updated });
  })
);
