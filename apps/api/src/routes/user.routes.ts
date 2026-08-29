import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../middleware/auth.js";
import { asyncHandler } from "../utils/async-handler.js";
import { prisma } from "../utils/prisma.js";

export const userRouter = Router();
userRouter.use(requireAuth);

userRouter.get(
  "/me",
  asyncHandler(async (req, res) => {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: { id: true, name: true, email: true, phone: true, role: true, rewardPoints: true, walletBalance: true, referralCode: true, addresses: true, wishlist: { include: { product: { include: { variants: true } } } } }
    });
    res.json({ user });
  })
);

userRouter.post(
  "/addresses",
  asyncHandler(async (req, res) => {
    const body = z
      .object({
        fullName: z.string().min(2),
        phone: z.string().min(10),
        line1: z.string().min(4),
        line2: z.string().optional(),
        city: z.string(),
        state: z.string(),
        pincode: z.string().min(6),
        landmark: z.string().optional(),
        isDefault: z.boolean().default(false)
      })
      .parse(req.body);
    if (body.isDefault) await prisma.address.updateMany({ where: { userId: req.user!.id }, data: { isDefault: false } });
    const address = await prisma.address.create({ data: { ...body, userId: req.user!.id } });
    res.status(201).json({ address });
  })
);

userRouter.post(
  "/wishlist/:productId",
  asyncHandler(async (req, res) => {
    const item = await prisma.wishlistItem.upsert({
      where: { userId_productId: { userId: req.user!.id, productId: req.params.productId } },
      create: { userId: req.user!.id, productId: req.params.productId },
      update: {}
    });
    res.status(201).json({ item });
  })
);

userRouter.delete(
  "/wishlist/:productId",
  asyncHandler(async (req, res) => {
    await prisma.wishlistItem.deleteMany({ where: { userId: req.user!.id, productId: req.params.productId } });
    res.status(204).send();
  })
);

userRouter.post(
  "/reviews/:productId",
  asyncHandler(async (req, res) => {
    const body = z.object({ rating: z.number().int().min(1).max(5), title: z.string().min(2), body: z.string().min(5) }).parse(req.body);
    const review = await prisma.review.create({ data: { ...body, productId: req.params.productId, userId: req.user!.id } });
    res.status(201).json({ review });
  })
);

userRouter.get(
  "/notifications",
  asyncHandler(async (req, res) => {
    const notifications = await prisma.notification.findMany({ where: { OR: [{ userId: req.user!.id }, { userId: null }] }, orderBy: { createdAt: "desc" } });
    res.json({ notifications });
  })
);
