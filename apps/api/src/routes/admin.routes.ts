import { Router } from "express";
import slugify from "slugify";
import { z } from "zod";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { asyncHandler } from "../utils/async-handler.js";
import { prisma } from "../utils/prisma.js";

export const adminRouter = Router();
adminRouter.use(requireAuth, requireRole("ADMIN", "SELLER"));

adminRouter.get(
  "/dashboard",
  asyncHandler(async (_req, res) => {
    const [orders, customers, products, revenue] = await Promise.all([
      prisma.order.count(),
      prisma.user.count({ where: { role: "CUSTOMER" } }),
      prisma.product.count(),
      prisma.order.aggregate({ _sum: { total: true }, where: { status: { notIn: ["CANCELLED", "REFUNDED"] } } })
    ]);
    res.json({ stats: { orders, customers, products, revenue: revenue._sum.total ?? 0 } });
  })
);

adminRouter.get(
  "/orders",
  asyncHandler(async (_req, res) => {
    const orders = await prisma.order.findMany({ include: { user: { select: { name: true, email: true } }, items: true, payment: true }, orderBy: { createdAt: "desc" } });
    res.json({ orders });
  })
);

adminRouter.patch(
  "/orders/:id/status",
  asyncHandler(async (req, res) => {
    const { status, note } = z.object({ status: z.enum(["PLACED", "ACCEPTED", "PREPARING", "PACKED", "SHIPPED", "OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED", "RETURN_REQUESTED", "REFUNDED"]), note: z.string().optional() }).parse(req.body);
    const order = await prisma.order.update({ where: { id: req.params.id }, data: { status, timeline: { create: { status, note } } } });
    res.json({ order });
  })
);

adminRouter.post(
  "/products",
  asyncHandler(async (req, res) => {
    const body = z
      .object({
        categoryId: z.string(),
        name: z.string(),
        shortDescription: z.string(),
        description: z.string(),
        ingredients: z.array(z.string()),
        nutrition: z.record(z.any()).default({}),
        shelfLife: z.string(),
        storage: z.string(),
        process: z.string(),
        images: z.array(z.string()).default([]),
        isVeg: z.boolean().default(true),
        isFeatured: z.boolean().default(false),
        isBestSeller: z.boolean().default(false),
        variants: z.array(z.object({ weight: z.string(), sku: z.string(), mrp: z.number(), price: z.number(), stock: z.number().int() }))
      })
      .parse(req.body);
    const product = await prisma.product.create({
      data: {
        ...body,
        slug: slugify(body.name, { lower: true, strict: true }),
        variants: { create: body.variants }
      },
      include: { variants: true }
    });
    res.status(201).json({ product });
  })
);

adminRouter.patch(
  "/inventory/:variantId",
  asyncHandler(async (req, res) => {
    const { stock } = z.object({ stock: z.number().int().min(0) }).parse(req.body);
    const variant = await prisma.productVariant.update({ where: { id: req.params.variantId }, data: { stock } });
    res.json({ variant });
  })
);

adminRouter.get(
  "/reports/export/orders",
  asyncHandler(async (_req, res) => {
    const orders = await prisma.order.findMany({ include: { user: true, items: true } });
    res.json({ exportType: "orders", generatedAt: new Date().toISOString(), orders });
  })
);
