import bcrypt from "bcryptjs";
import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../middleware/auth.js";
import { asyncHandler } from "../utils/async-handler.js";
import { HttpError } from "../utils/http-error.js";
import { prisma } from "../utils/prisma.js";

export const userRouter = Router();
userRouter.use(requireAuth);

// GET PROFILE
userRouter.get(
  "/me",
  asyncHandler(async (req, res) => {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: {
        id: true, name: true, email: true, phone: true, role: true,
        rewardPoints: true, walletBalance: true, referralCode: true,
        addresses: { orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }] },
        wishlist: { include: { product: { include: { variants: { where: { isActive: true }, orderBy: { price: "asc" } } } } } },
        _count: { select: { orders: true, reviews: true } },
        createdAt: true,
      },
    });
    if (!user) throw new HttpError(404, "User not found");
    res.json({ user });
  })
);

// UPDATE PROFILE
userRouter.patch(
  "/me",
  asyncHandler(async (req, res) => {
    const body = z
      .object({
        name: z.string().min(2).max(100).optional(),
        phone: z.string().min(10).max(15).optional(),
      })
      .parse(req.body);

    if (body.phone) {
      const existing = await prisma.user.findFirst({ where: { phone: body.phone, id: { not: req.user!.id } } });
      if (existing) throw new HttpError(409, "Phone number already in use");
    }

    const user = await prisma.user.update({
      where: { id: req.user!.id },
      data: body,
      select: { id: true, name: true, email: true, phone: true, role: true },
    });
    res.json({ user });
  })
);

// CREATE ADDRESS
userRouter.post(
  "/addresses",
  asyncHandler(async (req, res) => {
    const body = z
      .object({
        fullName: z.string().min(2),
        phone: z.string().min(10),
        line1: z.string().min(4),
        line2: z.string().optional(),
        city: z.string().min(2),
        state: z.string().min(2),
        pincode: z.string().min(6).max(6),
        landmark: z.string().optional(),
        isDefault: z.boolean().default(false),
      })
      .parse(req.body);

    if (body.isDefault) {
      await prisma.address.updateMany({ where: { userId: req.user!.id }, data: { isDefault: false } });
    }

    const address = await prisma.address.create({ data: { ...body, userId: req.user!.id } });
    res.status(201).json({ address });
  })
);

// UPDATE ADDRESS
userRouter.patch(
  "/addresses/:id",
  asyncHandler(async (req, res) => {
    const existing = await prisma.address.findFirst({ where: { id: req.params.id, userId: req.user!.id } });
    if (!existing) throw new HttpError(404, "Address not found");

    const body = z
      .object({
        fullName: z.string().min(2).optional(),
        phone: z.string().min(10).optional(),
        line1: z.string().min(4).optional(),
        line2: z.string().optional(),
        city: z.string().min(2).optional(),
        state: z.string().min(2).optional(),
        pincode: z.string().min(6).max(6).optional(),
        landmark: z.string().optional(),
        isDefault: z.boolean().optional(),
      })
      .parse(req.body);

    if (body.isDefault) {
      await prisma.address.updateMany({ where: { userId: req.user!.id }, data: { isDefault: false } });
    }

    const address = await prisma.address.update({ where: { id: req.params.id }, data: body });
    res.json({ address });
  })
);

// DELETE ADDRESS
userRouter.delete(
  "/addresses/:id",
  asyncHandler(async (req, res) => {
    const existing = await prisma.address.findFirst({ where: { id: req.params.id, userId: req.user!.id } });
    if (!existing) throw new HttpError(404, "Address not found");
    await prisma.address.delete({ where: { id: req.params.id } });
    res.status(204).send();
  })
);

// ADD TO WISHLIST
userRouter.post(
  "/wishlist/:productId",
  asyncHandler(async (req, res) => {
    const product = await prisma.product.findUnique({ where: { id: req.params.productId } });
    if (!product) throw new HttpError(404, "Product not found");

    const item = await prisma.wishlistItem.upsert({
      where: { userId_productId: { userId: req.user!.id, productId: req.params.productId } },
      create: { userId: req.user!.id, productId: req.params.productId },
      update: {},
      include: { product: { include: { variants: { where: { isActive: true }, orderBy: { price: "asc" } } } } },
    });
    res.status(201).json({ item });
  })
);

// REMOVE FROM WISHLIST
userRouter.delete(
  "/wishlist/:productId",
  asyncHandler(async (req, res) => {
    await prisma.wishlistItem.deleteMany({ where: { userId: req.user!.id, productId: req.params.productId } });
    res.status(204).send();
  })
);

// GET WISHLIST
userRouter.get(
  "/wishlist",
  asyncHandler(async (req, res) => {
    const items = await prisma.wishlistItem.findMany({
      where: { userId: req.user!.id },
      include: {
        product: {
          include: {
            variants: { where: { isActive: true }, orderBy: { price: "asc" } },
            category: true,
            reviews: { where: { isApproved: true }, select: { rating: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    res.json({ items });
  })
);

// CREATE REVIEW (only for verified purchasers)
userRouter.post(
  "/reviews/:productId",
  asyncHandler(async (req, res) => {
    const body = z
      .object({
        rating: z.number().int().min(1).max(5),
        title: z.string().min(2).max(200),
        body: z.string().min(5).max(2000),
      })
      .parse(req.body);

    // Check if user has purchased this product
    const hasPurchased = await prisma.orderItem.findFirst({
      where: {
        productId: req.params.productId,
        order: { userId: req.user!.id, status: "DELIVERED" },
      },
    });
    if (!hasPurchased) {
      throw new HttpError(403, "You can only review products you have purchased and received");
    }

    // Check for duplicate review
    const existingReview = await prisma.review.findUnique({
      where: { productId_userId: { productId: req.params.productId, userId: req.user!.id } },
    });
    if (existingReview) {
      throw new HttpError(409, "You have already reviewed this product");
    }

    const review = await prisma.review.create({
      data: { ...body, productId: req.params.productId, userId: req.user!.id },
    });
    res.status(201).json({ review });
  })
);

// GET NOTIFICATIONS
userRouter.get(
  "/notifications",
  asyncHandler(async (req, res) => {
    const notifications = await prisma.notification.findMany({
      where: { OR: [{ userId: req.user!.id }, { userId: null }] },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    res.json({ notifications });
  })
);

// MARK NOTIFICATION AS READ
userRouter.patch(
  "/notifications/:id/read",
  asyncHandler(async (req, res) => {
    const notification = await prisma.notification.findFirst({
      where: { id: req.params.id, userId: req.user!.id },
    });
    if (!notification) throw new HttpError(404, "Notification not found");
    await prisma.notification.update({ where: { id: req.params.id }, data: { readAt: new Date() } });
    res.json({ message: "Marked as read" });
  })
);
