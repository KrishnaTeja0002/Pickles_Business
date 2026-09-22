import { Router } from "express";
import slugify from "slugify";
import { z } from "zod";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { createNotification } from "../services/notification.service.js";
import { initiateRefund, isRazorpayConfigured } from "../services/payment.service.js";
import { asyncHandler } from "../utils/async-handler.js";
import { HttpError } from "../utils/http-error.js";
import { prisma } from "../utils/prisma.js";

export const adminRouter = Router();
adminRouter.use(requireAuth, requireRole("ADMIN", "SELLER"));

// ─── DASHBOARD ───
adminRouter.get(
  "/dashboard",
  asyncHandler(async (_req, res) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      totalOrders, totalCustomers, totalProducts,
      totalRevenue, todayOrders, todayRevenue,
      pendingOrders, deliveredOrders, cancelledOrders,
      lowStockVariants, recentOrders,
    ] = await Promise.all([
      prisma.order.count(),
      prisma.user.count({ where: { role: "CUSTOMER" } }),
      prisma.product.count({ where: { isActive: true } }),
      prisma.order.aggregate({ _sum: { total: true }, where: { status: { notIn: ["CANCELLED", "REFUNDED", "PAYMENT_FAILED", "PENDING_PAYMENT"] } } }),
      prisma.order.count({ where: { createdAt: { gte: today } } }),
      prisma.order.aggregate({ _sum: { total: true }, where: { createdAt: { gte: today }, status: { notIn: ["CANCELLED", "REFUNDED", "PAYMENT_FAILED", "PENDING_PAYMENT"] } } }),
      prisma.order.count({ where: { status: { in: ["CONFIRMED", "PROCESSING"] } } }),
      prisma.order.count({ where: { status: "DELIVERED" } }),
      prisma.order.count({ where: { status: "CANCELLED" } }),
      prisma.productVariant.findMany({ where: { stock: { lte: prisma.productVariant.fields.lowStock } }, include: { product: { select: { name: true } } }, take: 20 }),
      prisma.order.findMany({ include: { user: { select: { name: true } }, _count: { select: { items: true } } }, orderBy: { createdAt: "desc" }, take: 10 }),
    ]);

    // Low stock — manual filter since Prisma can't compare two columns directly
    const allLowStock = await prisma.productVariant.findMany({
      where: { isActive: true },
      include: { product: { select: { name: true, slug: true } } },
    });
    const lowStock = allLowStock.filter(v => v.stock <= v.lowStock);

    // Top products by order count
    const topProducts = await prisma.orderItem.groupBy({
      by: ["productId"],
      _sum: { quantity: true, total: true },
      orderBy: { _sum: { quantity: "desc" } },
      take: 10,
    });
    const topProductIds = topProducts.map(p => p.productId);
    const topProductDetails = await prisma.product.findMany({
      where: { id: { in: topProductIds } },
      select: { id: true, name: true, slug: true, images: true },
    });

    res.json({
      stats: {
        totalOrders,
        totalCustomers,
        totalProducts,
        totalRevenue: totalRevenue._sum.total ?? 0,
        todayOrders,
        todayRevenue: todayRevenue._sum.total ?? 0,
        pendingOrders,
        deliveredOrders,
        cancelledOrders,
      },
      lowStock: lowStock.slice(0, 20),
      topProducts: topProducts.map(tp => ({
        ...tp,
        product: topProductDetails.find(p => p.id === tp.productId),
      })),
      recentOrders,
    });
  })
);

// ─── ORDERS ───
adminRouter.get(
  "/orders",
  asyncHandler(async (req, res) => {
    const query = z.object({
      status: z.string().optional(),
      q: z.string().optional(),
      page: z.coerce.number().min(1).default(1),
      limit: z.coerce.number().min(1).max(100).default(20),
    }).parse(req.query);

    const where: any = {};
    if (query.status) where.status = query.status;
    if (query.q) {
      where.OR = [
        { orderNumber: { contains: query.q, mode: "insensitive" } },
        { user: { name: { contains: query.q, mode: "insensitive" } } },
        { user: { email: { contains: query.q, mode: "insensitive" } } },
      ];
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          user: { select: { name: true, email: true, phone: true } },
          items: true,
          payment: { select: { status: true, method: true, transactionId: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      prisma.order.count({ where }),
    ]);

    res.json({ orders, pagination: { total, page: query.page, pages: Math.ceil(total / query.limit) } });
  })
);

adminRouter.get(
  "/orders/:id",
  asyncHandler(async (req, res) => {
    const order = await prisma.order.findUnique({
      where: { id: req.params.id },
      include: {
        user: { select: { id: true, name: true, email: true, phone: true } },
        items: { include: { product: { select: { slug: true, images: true } } } },
        payment: true,
        timeline: { orderBy: { createdAt: "asc" } },
      },
    });
    if (!order) throw new HttpError(404, "Order not found");
    res.json({ order });
  })
);

adminRouter.patch(
  "/orders/:id/status",
  asyncHandler(async (req, res) => {
    const { status, note, trackingNumber, courier } = z.object({
      status: z.enum(["PENDING_PAYMENT", "CONFIRMED", "PROCESSING", "PACKED", "DISPATCHED", "IN_TRANSIT", "OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED", "REFUND_INITIATED", "REFUNDED", "PAYMENT_FAILED"]),
      note: z.string().optional(),
      trackingNumber: z.string().optional(),
      courier: z.string().optional(),
    }).parse(req.body);

    const order = await prisma.order.update({
      where: { id: req.params.id },
      data: {
        status,
        ...(trackingNumber ? { trackingNumber } : {}),
        ...(courier ? { courier } : {}),
        timeline: { create: { status, note: note ?? `Status updated to ${status}` } },
      },
      include: { items: true, payment: true, timeline: { orderBy: { createdAt: "desc" } } },
    });

    // Status-specific notifications
    const statusNotifMap: Record<string, string> = {
      PROCESSING: "ORDER_PROCESSING",
      PACKED: "ORDER_PACKED",
      DISPATCHED: "ORDER_DISPATCHED",
      DELIVERED: "ORDER_DELIVERED",
    };
    if (statusNotifMap[status]) {
      createNotification(order.userId, statusNotifMap[status] as any, {
        orderNumber: order.orderNumber,
        courier: courier ?? "",
        trackingNumber: trackingNumber ?? "",
      }).catch(() => {});
    }

    res.json({ order });
  })
);

// PROCESS REFUND
adminRouter.post(
  "/orders/:id/refund",
  asyncHandler(async (req, res) => {
    const order = await prisma.order.findUnique({
      where: { id: req.params.id },
      include: { payment: true },
    });
    if (!order) throw new HttpError(404, "Order not found");
    if (!order.payment || order.payment.status !== "CAPTURED") {
      throw new HttpError(400, "No captured payment to refund");
    }

    const amountPaise = Math.round(Number(order.total) * 100);

    if (isRazorpayConfigured() && order.payment.razorpayPaymentId) {
      try {
        const refund = await initiateRefund(order.payment.razorpayPaymentId, amountPaise);
        await prisma.payment.update({
          where: { id: order.payment.id },
          data: { refundId: refund.id, refundAmount: order.total, refundStatus: "PROCESSING" },
        });
      } catch (err: any) {
        throw new HttpError(500, `Refund initiation failed: ${err.message}`);
      }
    } else {
      // Dev mode: mark as refunded directly
      await prisma.payment.update({
        where: { id: order.payment.id },
        data: { refundStatus: "COMPLETED", refundAmount: order.total },
      });
    }

    await prisma.order.update({
      where: { id: order.id },
      data: {
        status: "REFUND_INITIATED",
        timeline: { create: { status: "REFUND_INITIATED", note: `Refund of ₹${order.total} initiated` } },
      },
    });

    createNotification(order.userId, "REFUND_INITIATED", {
      orderNumber: order.orderNumber,
      amount: String(order.total),
    }).catch(() => {});

    res.json({ message: "Refund initiated", orderId: order.id });
  })
);

// ─── PRODUCTS ───
adminRouter.get(
  "/products",
  asyncHandler(async (req, res) => {
    const query = z.object({
      q: z.string().optional(),
      category: z.string().optional(),
      page: z.coerce.number().min(1).default(1),
      limit: z.coerce.number().min(1).max(100).default(20),
    }).parse(req.query);

    const where: any = {};
    if (query.q) where.name = { contains: query.q, mode: "insensitive" };
    if (query.category) where.category = { slug: query.category };

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: { category: true, variants: { orderBy: { price: "asc" } }, _count: { select: { reviews: true, orderItems: true } } },
        orderBy: { createdAt: "desc" },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      prisma.product.count({ where }),
    ]);

    res.json({ products, pagination: { total, page: query.page, pages: Math.ceil(total / query.limit) } });
  })
);

adminRouter.post(
  "/products",
  asyncHandler(async (req, res) => {
    const body = z.object({
      categoryId: z.string(),
      name: z.string().min(2),
      shortDescription: z.string(),
      description: z.string(),
      ingredients: z.array(z.string()).default([]),
      allergens: z.array(z.string()).default([]),
      tags: z.array(z.string()).default([]),
      nutrition: z.record(z.any()).default({}),
      shelfLife: z.string(),
      storage: z.string(),
      process: z.string(),
      images: z.array(z.string()).default([]),
      isVeg: z.boolean().default(true),
      isFeatured: z.boolean().default(false),
      isBestSeller: z.boolean().default(false),
      variants: z.array(z.object({
        weight: z.string(),
        sku: z.string(),
        mrp: z.number(),
        price: z.number(),
        stock: z.number().int(),
      })).min(1),
    }).parse(req.body);

    const slug = slugify(body.name, { lower: true, strict: true });
    const existing = await prisma.product.findUnique({ where: { slug } });
    if (existing) throw new HttpError(409, "A product with a similar name already exists");

    const product = await prisma.product.create({
      data: { ...body, slug, variants: { create: body.variants } },
      include: { variants: true, category: true },
    });
    res.status(201).json({ product });
  })
);

// ─── BULK PRODUCT IMPORT / EXCEL UPDATE ───
adminRouter.post(
  "/products/bulk",
  asyncHandler(async (req, res) => {
    const { items } = z.object({
      items: z.array(z.object({
        name: z.string().min(1),
        category: z.string().optional(),
        weight: z.string().optional().default("500g"),
        price: z.coerce.number().min(1),
        mrp: z.coerce.number().optional(),
        stock: z.coerce.number().int().min(0).default(50),
        spiceLevel: z.string().optional(),
        image: z.string().optional(),
        description: z.string().optional(),
        isActive: z.boolean().optional().default(true),
      })).min(1),
    }).parse(req.body);

    let updatedCount = 0;
    let createdCount = 0;

    for (const item of items) {
      const slug = slugify(item.name, { lower: true, strict: true });

      // Find or create category
      let categoryId: string | undefined = undefined;
      if (item.category) {
        const catSlug = slugify(item.category, { lower: true, strict: true });
        const cat = await prisma.category.upsert({
          where: { slug: catSlug },
          create: { name: item.category, slug: catSlug, description: item.category },
          update: { name: item.category },
        });
        categoryId = cat.id;
      }

      // Check if product exists by slug or name
      let product = await prisma.product.findFirst({
        where: {
          OR: [
            { slug },
            { name: { equals: item.name, mode: "insensitive" } },
          ],
        },
        include: { variants: true },
      });

      const cleanMrp = item.mrp && item.mrp >= item.price ? item.mrp : Math.round(item.price * 1.25);
      const images = item.image ? [item.image] : undefined;

      if (product) {
        await prisma.product.update({
          where: { id: product.id },
          data: {
            ...(item.description ? { description: item.description } : {}),
            ...(images ? { images } : {}),
            ...(item.spiceLevel ? { tags: [item.spiceLevel] } : {}),
            ...(categoryId ? { categoryId } : {}),
            isActive: item.isActive ?? true,
          },
        });

        const existingVariant = product.variants.find(
          (v) => v.weight.toLowerCase() === (item.weight || "500g").toLowerCase()
        );

        if (existingVariant) {
          await prisma.productVariant.update({
            where: { id: existingVariant.id },
            data: {
              price: item.price,
              mrp: cleanMrp,
              stock: item.stock,
              isActive: item.isActive ?? true,
            },
          });
        } else {
          await prisma.productVariant.create({
            data: {
              productId: product.id,
              weight: item.weight || "500g",
              sku: `UHT-${slug.slice(0, 4).toUpperCase()}-${item.weight || "500G"}`,
              price: item.price,
              mrp: cleanMrp,
              stock: item.stock,
              isActive: item.isActive ?? true,
            },
          });
        }
        updatedCount++;
      } else {
        if (!categoryId) {
          const defaultCat = await prisma.category.findFirst();
          categoryId = defaultCat?.id;
        }

        if (!categoryId) {
          const newCat = await prisma.category.create({
            data: { name: "Andhra Pickles", slug: "andhra-pickles", description: "Authentic Andhra Pickles" },
          });
          categoryId = newCat.id;
        }

        await prisma.product.create({
          data: {
            name: item.name,
            slug,
            categoryId,
            shortDescription: item.description ? item.description.slice(0, 120) : `${item.name} handmade Andhra style`,
            description: item.description || `Authentic handmade ${item.name} prepared with cold-pressed oil and traditional spices.`,
            images: images || ["/products/avakaya-1.jpg"],
            shelfLife: "6 months",
            storage: "Store in a cool dry place. Use dry spoon.",
            process: "Sun-cured and matured in ceramic jars with pure gingelly oil.",
            ingredients: ["Raw ingredients", "Gingelly Oil", "Chilli", "Mustard", "Salt"],
            allergens: [],
            nutrition: { note: "Authentic handmade recipe" },
            tags: [item.spiceLevel || "Medium"],
            isActive: item.isActive ?? true,
            variants: {
              create: [
                {
                  weight: item.weight || "500g",
                  sku: `UHT-${slug.slice(0, 4).toUpperCase()}-${item.weight || "500G"}`,
                  price: item.price,
                  mrp: cleanMrp,
                  stock: item.stock,
                  isActive: true,
                },
              ],
            },
          },
        });
        createdCount++;
      }
    }

    res.json({ success: true, updatedCount, createdCount, totalProcessed: items.length });
  })
);

adminRouter.patch(
  "/products/:id",
  asyncHandler(async (req, res) => {
    const body = z.object({
      categoryId: z.string().optional(),
      name: z.string().min(2).optional(),
      shortDescription: z.string().optional(),
      description: z.string().optional(),
      ingredients: z.array(z.string()).optional(),
      allergens: z.array(z.string()).optional(),
      tags: z.array(z.string()).optional(),
      nutrition: z.record(z.any()).optional(),
      shelfLife: z.string().optional(),
      storage: z.string().optional(),
      process: z.string().optional(),
      images: z.array(z.string()).optional(),
      isVeg: z.boolean().optional(),
      isFeatured: z.boolean().optional(),
      isBestSeller: z.boolean().optional(),
      isActive: z.boolean().optional(),
    }).parse(req.body);

    const data: any = { ...body };
    if (body.name) data.slug = slugify(body.name, { lower: true, strict: true });

    const product = await prisma.product.update({
      where: { id: req.params.id },
      data,
      include: { variants: true, category: true },
    });
    res.json({ product });
  })
);

adminRouter.delete(
  "/products/:id",
  asyncHandler(async (req, res) => {
    await prisma.product.update({ where: { id: req.params.id }, data: { isActive: false } });
    res.status(204).send();
  })
);

// ─── VARIANTS / INVENTORY ───
adminRouter.post(
  "/products/:productId/variants",
  asyncHandler(async (req, res) => {
    const body = z.object({
      weight: z.string(), sku: z.string(), mrp: z.number(), price: z.number(), stock: z.number().int(),
    }).parse(req.body);
    const variant = await prisma.productVariant.create({ data: { ...body, productId: req.params.productId } });
    res.status(201).json({ variant });
  })
);

adminRouter.patch(
  "/variants/:id",
  asyncHandler(async (req, res) => {
    const body = z.object({
      weight: z.string().optional(), mrp: z.number().optional(), price: z.number().optional(),
      stock: z.number().int().optional(), lowStock: z.number().int().optional(), isActive: z.boolean().optional(),
    }).parse(req.body);
    const variant = await prisma.productVariant.update({ where: { id: req.params.id }, data: body });
    res.json({ variant });
  })
);

adminRouter.patch(
  "/inventory/:variantId",
  asyncHandler(async (req, res) => {
    const { stock, reason } = z.object({ stock: z.number().int().min(0), reason: z.string().optional() }).parse(req.body);
    const variant = await prisma.productVariant.findUnique({ where: { id: req.params.variantId } });
    if (!variant) throw new HttpError(404, "Variant not found");

    const change = stock - variant.stock;
    await prisma.inventory.create({ data: { productId: variant.productId, variantId: variant.id, change, reason: reason ?? "Manual adjustment" } });
    const updated = await prisma.productVariant.update({ where: { id: req.params.variantId }, data: { stock } });
    res.json({ variant: updated });
  })
);

// ─── CATEGORIES ───
adminRouter.get(
  "/categories",
  asyncHandler(async (_req, res) => {
    const categories = await prisma.category.findMany({
      orderBy: { sortOrder: "asc" },
      include: { _count: { select: { products: true } } },
    });
    res.json({ categories });
  })
);

adminRouter.post(
  "/categories",
  asyncHandler(async (req, res) => {
    const body = z.object({ name: z.string().min(2), description: z.string().optional(), image: z.string().optional() }).parse(req.body);
    const slug = slugify(body.name, { lower: true, strict: true });
    const category = await prisma.category.create({ data: { ...body, slug } });
    res.status(201).json({ category });
  })
);

adminRouter.patch(
  "/categories/:id",
  asyncHandler(async (req, res) => {
    const body = z.object({ name: z.string().optional(), description: z.string().optional(), image: z.string().optional(), isActive: z.boolean().optional(), sortOrder: z.number().int().optional() }).parse(req.body);
    const data: any = { ...body };
    if (body.name) data.slug = slugify(body.name, { lower: true, strict: true });
    const category = await prisma.category.update({ where: { id: req.params.id }, data });
    res.json({ category });
  })
);

adminRouter.delete(
  "/categories/:id",
  asyncHandler(async (req, res) => {
    const hasProducts = await prisma.product.count({ where: { categoryId: req.params.id } });
    if (hasProducts > 0) throw new HttpError(409, "Cannot delete category with products. Reassign products first.");
    await prisma.category.delete({ where: { id: req.params.id } });
    res.status(204).send();
  })
);

// ─── COUPONS ───
adminRouter.get(
  "/coupons",
  asyncHandler(async (_req, res) => {
    const coupons = await prisma.coupon.findMany({ orderBy: { createdAt: "desc" } });
    res.json({ coupons });
  })
);

adminRouter.post(
  "/coupons",
  asyncHandler(async (req, res) => {
    const body = z.object({
      code: z.string().min(3).max(20),
      description: z.string().optional(),
      percentOff: z.number().int().min(1).max(100).optional(),
      amountOff: z.number().min(1).optional(),
      minOrder: z.number().default(0),
      maxDiscount: z.number().optional(),
      startsAt: z.string().transform(s => new Date(s)),
      endsAt: z.string().transform(s => new Date(s)),
      usageLimit: z.number().int().optional(),
      perUserLimit: z.number().int().default(1),
    }).parse(req.body);

    const coupon = await prisma.coupon.create({ data: { ...body, code: body.code.toUpperCase() } });
    res.status(201).json({ coupon });
  })
);

adminRouter.patch(
  "/coupons/:id",
  asyncHandler(async (req, res) => {
    const body = z.object({
      description: z.string().optional(),
      isActive: z.boolean().optional(),
      usageLimit: z.number().int().optional(),
      maxDiscount: z.number().optional(),
      endsAt: z.string().transform(s => new Date(s)).optional(),
    }).parse(req.body);
    const coupon = await prisma.coupon.update({ where: { id: req.params.id }, data: body });
    res.json({ coupon });
  })
);

// ─── REVIEWS ───
adminRouter.get(
  "/reviews",
  asyncHandler(async (req, res) => {
    const query = z.object({ approved: z.coerce.boolean().optional(), page: z.coerce.number().min(1).default(1), limit: z.coerce.number().default(20) }).parse(req.query);
    const where: any = {};
    if (query.approved !== undefined) where.isApproved = query.approved;
    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where,
        include: { product: { select: { name: true, slug: true } }, user: { select: { name: true, email: true } } },
        orderBy: { createdAt: "desc" },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      prisma.review.count({ where }),
    ]);
    res.json({ reviews, pagination: { total, page: query.page, pages: Math.ceil(total / query.limit) } });
  })
);

adminRouter.patch(
  "/reviews/:id",
  asyncHandler(async (req, res) => {
    const { isApproved } = z.object({ isApproved: z.boolean() }).parse(req.body);
    const review = await prisma.review.update({ where: { id: req.params.id }, data: { isApproved } });
    res.json({ review });
  })
);

adminRouter.delete(
  "/reviews/:id",
  asyncHandler(async (req, res) => {
    await prisma.review.delete({ where: { id: req.params.id } });
    res.status(204).send();
  })
);

// ─── CUSTOMERS ───
adminRouter.get(
  "/customers",
  asyncHandler(async (req, res) => {
    const query = z.object({ q: z.string().optional(), page: z.coerce.number().min(1).default(1), limit: z.coerce.number().default(20) }).parse(req.query);
    const where: any = { role: "CUSTOMER" };
    if (query.q) where.OR = [{ name: { contains: query.q, mode: "insensitive" } }, { email: { contains: query.q, mode: "insensitive" } }];
    const [customers, total] = await Promise.all([
      prisma.user.findMany({
        where, select: { id: true, name: true, email: true, phone: true, createdAt: true, _count: { select: { orders: true } } },
        orderBy: { createdAt: "desc" }, skip: (query.page - 1) * query.limit, take: query.limit,
      }),
      prisma.user.count({ where }),
    ]);
    res.json({ customers, pagination: { total, page: query.page, pages: Math.ceil(total / query.limit) } });
  })
);

// ─── SHIPPING CONFIG ───
adminRouter.get(
  "/shipping",
  asyncHandler(async (_req, res) => {
    const config = await prisma.shippingConfig.findFirst({ where: { isActive: true } });
    res.json({ config });
  })
);

adminRouter.patch(
  "/shipping/:id",
  asyncHandler(async (req, res) => {
    const body = z.object({ flatRate: z.number().optional(), freeShippingAbove: z.number().optional(), estimatedDays: z.string().optional() }).parse(req.body);
    const config = await prisma.shippingConfig.update({ where: { id: req.params.id }, data: body });
    res.json({ config });
  })
);

// ─── REPORTS ───
adminRouter.get(
  "/reports/export/orders",
  asyncHandler(async (_req, res) => {
    const orders = await prisma.order.findMany({ include: { user: { select: { name: true, email: true } }, items: true, payment: { select: { status: true, method: true } } }, orderBy: { createdAt: "desc" } });
    res.json({ exportType: "orders", generatedAt: new Date().toISOString(), count: orders.length, orders });
  })
);
