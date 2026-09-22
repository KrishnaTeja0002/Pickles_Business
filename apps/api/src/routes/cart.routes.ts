import { Router } from "express";
import { z } from "zod";
import { optionalAuth, requireAuth } from "../middleware/auth.js";
import { asyncHandler } from "../utils/async-handler.js";
import { HttpError } from "../utils/http-error.js";
import { prisma } from "../utils/prisma.js";

export const cartRouter = Router();

// GET CART (authenticated)
cartRouter.get(
  "/",
  requireAuth,
  asyncHandler(async (req, res) => {
    const cart = await prisma.cart.findUnique({
      where: { userId: req.user!.id },
      include: {
        items: {
          include: {
            product: { select: { name: true, slug: true, images: true, isActive: true } },
            variant: { select: { weight: true, price: true, mrp: true, stock: true, isActive: true } },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });
    res.json({ cart: cart ?? { items: [] } });
  })
);

// ADD TO CART (Guest and Authenticated)
cartRouter.post(
  "/items",
  optionalAuth,
  asyncHandler(async (req, res) => {
    const body = z
      .object({
        productId: z.string(),
        variantId: z.string(),
        quantity: z.number().int().min(1).default(1),
      })
      .parse(req.body);

    // Validate and resolve variant flexibly
    let variant: any = await prisma.productVariant.findFirst({
      where: {
        OR: [
          { id: body.variantId },
          { sku: body.variantId },
          {
            product: {
              OR: [
                { id: body.productId },
                { slug: body.productId },
              ],
            },
          },
        ],
      },
      include: { product: true },
    });

    if (!variant) {
      const product = await prisma.product.findFirst({
        where: {
          OR: [
            { id: body.productId },
            { slug: body.productId },
          ],
        },
        include: { variants: true },
      });
      if (product && product.variants.length > 0) {
        variant = { ...product.variants[0], product };
      }
    }

    if (!variant) {
      return res.status(201).json({
        item: {
          productId: body.productId,
          variantId: body.variantId,
          quantity: body.quantity,
        },
      });
    }

    // If unauthenticated guest, return formatted item directly
    if (!req.user) {
      return res.status(201).json({
        item: {
          productId: variant.productId,
          variantId: variant.id,
          quantity: body.quantity,
          product: { name: variant.product.name, slug: variant.product.slug, images: variant.product.images },
          variant: { weight: variant.weight, price: variant.price, mrp: variant.mrp, stock: variant.stock },
        },
      });
    }

    // Authenticated user: persist to database cart
    const cart = await prisma.cart.upsert({
      where: { userId: req.user.id },
      create: { userId: req.user.id },
      update: {},
    });

    const item = await prisma.cartItem.upsert({
      where: { cartId_variantId: { cartId: cart.id, variantId: variant.id } },
      create: {
        cartId: cart.id,
        productId: variant.productId,
        variantId: variant.id,
        quantity: body.quantity,
      },
      update: {
        quantity: { increment: body.quantity },
      },
      include: {
        product: { select: { name: true, slug: true, images: true } },
        variant: { select: { weight: true, price: true, mrp: true, stock: true } },
      },
    });

    res.status(201).json({ item });
  })
);


// UPDATE CART ITEM QUANTITY
cartRouter.patch(
  "/items/:itemId",
  requireAuth,
  asyncHandler(async (req, res) => {
    const { quantity } = z.object({ quantity: z.number().int().min(1) }).parse(req.body);

    const item = await prisma.cartItem.findUnique({
      where: { id: req.params.itemId },
      include: { cart: true, variant: true },
    });
    if (!item || item.cart.userId !== req.user!.id) {
      throw new HttpError(404, "Cart item not found");
    }
    if (quantity > item.variant.stock) {
      throw new HttpError(409, `Only ${item.variant.stock} items available in stock`);
    }

    const updated = await prisma.cartItem.update({
      where: { id: req.params.itemId },
      data: { quantity },
      include: {
        product: { select: { name: true, slug: true, images: true } },
        variant: { select: { weight: true, price: true, mrp: true, stock: true } },
      },
    });

    res.json({ item: updated });
  })
);

// REMOVE CART ITEM
cartRouter.delete(
  "/items/:itemId",
  requireAuth,
  asyncHandler(async (req, res) => {
    const item = await prisma.cartItem.findUnique({
      where: { id: req.params.itemId },
      include: { cart: true },
    });
    if (!item || item.cart.userId !== req.user!.id) {
      throw new HttpError(404, "Cart item not found");
    }

    await prisma.cartItem.delete({ where: { id: req.params.itemId } });
    res.status(204).send();
  })
);

// CLEAR CART
cartRouter.delete(
  "/",
  requireAuth,
  asyncHandler(async (req, res) => {
    const cart = await prisma.cart.findUnique({ where: { userId: req.user!.id } });
    if (cart) {
      await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
    }
    res.status(204).send();
  })
);

// CART QUOTE / PRICE CALCULATION (can be used without auth for guest carts)
cartRouter.post(
  "/quote",
  asyncHandler(async (req, res) => {
    const body = z
      .object({
        items: z.array(z.object({ variantId: z.string(), quantity: z.number().int().min(1) })),
        coupon: z.string().optional(),
        pincode: z.string().min(6).optional(),
      })
      .parse(req.body);

    const variants = await prisma.productVariant.findMany({
      where: { id: { in: body.items.map((item) => item.variantId) }, isActive: true },
      include: { product: { select: { name: true, slug: true, images: true, isActive: true } } },
    });

    // Validate stock
    const stockIssues: string[] = [];
    for (const item of body.items) {
      const variant = variants.find((v) => v.id === item.variantId);
      if (!variant) {
        stockIssues.push(`Variant ${item.variantId} not found`);
      } else if (!variant.product.isActive) {
        stockIssues.push(`${variant.product.name} is no longer available`);
      } else if (variant.stock < item.quantity) {
        stockIssues.push(`${variant.product.name} (${variant.weight}): only ${variant.stock} in stock`);
      }
    }

    const subtotal = body.items.reduce((sum, item) => {
      const variant = variants.find((v) => v.id === item.variantId);
      return sum + Number(variant?.price ?? 0) * item.quantity;
    }, 0);

    // Coupon validation
    let couponData = null;
    let couponError = null;
    let discount = 0;

    if (body.coupon) {
      const coupon = await prisma.coupon.findUnique({ where: { code: body.coupon.toUpperCase() } });
      if (!coupon) {
        couponError = "Invalid coupon code";
      } else if (!coupon.isActive) {
        couponError = "This coupon is no longer active";
      } else if (new Date() < coupon.startsAt) {
        couponError = "This coupon is not yet active";
      } else if (new Date() > coupon.endsAt) {
        couponError = "This coupon has expired";
      } else if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
        couponError = "This coupon has reached its usage limit";
      } else if (subtotal < Number(coupon.minOrder)) {
        couponError = `Minimum order of ₹${coupon.minOrder} required for this coupon`;
      } else {
        discount = coupon.percentOff
          ? Math.min(Math.round((subtotal * coupon.percentOff) / 100), Number(coupon.maxDiscount ?? Infinity))
          : Math.min(Number(coupon.amountOff ?? 0), subtotal);
        couponData = { code: coupon.code, description: coupon.description, discount };
      }
    }

    // Shipping
    const shippingConfig = await prisma.shippingConfig.findFirst({ where: { isActive: true } });
    const deliveryCharge = subtotal >= Number(shippingConfig?.freeShippingAbove ?? 999) ? 0 : Number(shippingConfig?.flatRate ?? 59);

    const tax = Math.round((subtotal - discount) * 0.05);
    const total = Math.max(0, subtotal - discount + tax + deliveryCharge);

    res.json({
      items: body.items.map((item) => {
        const variant = variants.find((v) => v.id === item.variantId);
        return { ...item, variant, available: !!variant && variant.stock >= item.quantity };
      }),
      subtotal,
      discount,
      coupon: couponData,
      couponError,
      tax,
      deliveryCharge,
      freeShippingThreshold: Number(shippingConfig?.freeShippingAbove ?? 999),
      total,
      stockIssues,
      delivery: {
        available: true,
        estimate: shippingConfig?.estimatedDays ?? "2-5 business days",
      },
    });
  })
);

// VALIDATE COUPON
cartRouter.post(
  "/validate-coupon",
  asyncHandler(async (req, res) => {
    const { code, subtotal } = z
      .object({ code: z.string(), subtotal: z.number().min(0) })
      .parse(req.body);

    const coupon = await prisma.coupon.findUnique({ where: { code: code.toUpperCase() } });

    if (!coupon) throw new HttpError(404, "Invalid coupon code");
    if (!coupon.isActive) throw new HttpError(400, "This coupon is no longer active");
    if (new Date() < coupon.startsAt) throw new HttpError(400, "This coupon is not yet active");
    if (new Date() > coupon.endsAt) throw new HttpError(400, "This coupon has expired");
    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) throw new HttpError(400, "This coupon has reached its usage limit");
    if (subtotal < Number(coupon.minOrder)) throw new HttpError(400, `Minimum order of ₹${coupon.minOrder} required`);

    const discount = coupon.percentOff
      ? Math.min(Math.round((subtotal * coupon.percentOff) / 100), Number(coupon.maxDiscount ?? Infinity))
      : Math.min(Number(coupon.amountOff ?? 0), subtotal);

    res.json({ coupon: { code: coupon.code, description: coupon.description, discount } });
  })
);
