import { Router } from "express";
import { z } from "zod";
import { asyncHandler } from "../utils/async-handler.js";
import { HttpError } from "../utils/http-error.js";
import { prisma } from "../utils/prisma.js";

export const catalogRouter = Router();

catalogRouter.get(
  "/categories",
  asyncHandler(async (_req, res) => {
    const categories = await prisma.category.findMany({ orderBy: { name: "asc" }, include: { _count: { select: { products: true } } } });
    res.json({ categories });
  })
);

catalogRouter.get(
  "/products",
  asyncHandler(async (req, res) => {
    const query = z
      .object({
        q: z.string().optional(),
        category: z.string().optional(),
        sort: z.enum(["new", "price-asc", "price-desc", "rating"]).default("new"),
        page: z.coerce.number().min(1).default(1),
        limit: z.coerce.number().min(1).max(48).default(12),
        featured: z.coerce.boolean().optional(),
        bestSeller: z.coerce.boolean().optional()
      })
      .parse(req.query);

    const where = {
      isActive: true,
      isFeatured: query.featured,
      isBestSeller: query.bestSeller,
      category: query.category ? { slug: query.category } : undefined,
      OR: query.q
        ? [
            { name: { contains: query.q, mode: "insensitive" as const } },
            { shortDescription: { contains: query.q, mode: "insensitive" as const } }
          ]
        : undefined
    };

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: { category: true, variants: { orderBy: { price: "asc" } }, reviews: true },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        orderBy: query.sort === "new" ? { createdAt: "desc" } : { name: "asc" }
      }),
      prisma.product.count({ where })
    ]);

    res.json({ products, pagination: { total, page: query.page, pages: Math.ceil(total / query.limit) } });
  })
);

catalogRouter.get(
  "/products/:slug",
  asyncHandler(async (req, res) => {
    const product = await prisma.product.findUnique({
      where: { slug: req.params.slug },
      include: { category: true, variants: true, reviews: { include: { user: { select: { name: true } } } } }
    });
    if (!product) throw new HttpError(404, "Product not found");
    const related = await prisma.product.findMany({
      where: { categoryId: product.categoryId, id: { not: product.id }, isActive: true },
      include: { variants: true },
      take: 4
    });
    res.json({ product, related });
  })
);

catalogRouter.get(
  "/search/suggestions",
  asyncHandler(async (req, res) => {
    const q = z.string().optional().parse(req.query.q);
    const products = await prisma.product.findMany({
      where: q ? { name: { contains: q, mode: "insensitive" }, isActive: true } : { isBestSeller: true },
      select: { name: true, slug: true, images: true },
      take: 8
    });
    res.json({ suggestions: products, trending: ["mango pickle", "gongura", "chicken pickle", "gift box"] });
  })
);
