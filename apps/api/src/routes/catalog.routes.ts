import { Router } from "express";
import { z } from "zod";
import { asyncHandler } from "../utils/async-handler.js";
import { HttpError } from "../utils/http-error.js";
import { prisma } from "../utils/prisma.js";

export const catalogRouter = Router();

// GET CATEGORIES
catalogRouter.get(
  "/categories",
  asyncHandler(async (_req, res) => {
    const categories = await prisma.category.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      include: { _count: { select: { products: { where: { isActive: true } } } } },
    });
    res.json({ categories });
  })
);

// GET PRODUCTS with search, filter, sort, pagination
catalogRouter.get(
  "/products",
  asyncHandler(async (req, res) => {
    const query = z
      .object({
        q: z.string().optional(),
        category: z.string().optional(),
        sort: z.enum(["new", "price-asc", "price-desc", "rating", "popularity", "bestseller"]).default("new"),
        page: z.coerce.number().min(1).default(1),
        limit: z.coerce.number().min(1).max(100).default(12),
        featured: z.coerce.boolean().optional(),
        bestSeller: z.coerce.boolean().optional(),
        minPrice: z.coerce.number().optional(),
        maxPrice: z.coerce.number().optional(),
        weight: z.string().optional(), // comma-separated: "250g,500g"
        inStock: z.coerce.boolean().optional(),
        isVeg: z.coerce.boolean().optional(),
        minRating: z.coerce.number().min(1).max(5).optional(),
      })
      .parse(req.query);

    const where: any = {
      isActive: true,
    };

    if (query.featured !== undefined) where.isFeatured = query.featured;
    if (query.bestSeller !== undefined) where.isBestSeller = query.bestSeller;
    if (query.isVeg !== undefined) where.isVeg = query.isVeg;
    if (query.category) where.category = { slug: query.category };

    if (query.q) {
      where.OR = [
        { name: { contains: query.q, mode: "insensitive" } },
        { shortDescription: { contains: query.q, mode: "insensitive" } },
        { tags: { hasSome: [query.q.toLowerCase()] } },
      ];
    }

    // Price filter (based on variant prices)
    if (query.minPrice !== undefined || query.maxPrice !== undefined) {
      where.variants = {
        some: {
          isActive: true,
          ...(query.minPrice !== undefined ? { price: { gte: query.minPrice } } : {}),
          ...(query.maxPrice !== undefined ? { price: { lte: query.maxPrice } } : {}),
        },
      };
    }

    // Weight filter
    if (query.weight) {
      const weights = query.weight.split(",").map((w) => w.trim());
      where.variants = {
        ...where.variants,
        some: { ...where.variants?.some, weight: { in: weights }, isActive: true },
      };
    }

    // Stock filter
    if (query.inStock) {
      where.variants = {
        ...where.variants,
        some: { ...where.variants?.some, stock: { gt: 0 }, isActive: true },
      };
    }

    // Sorting
    let orderBy: any;
    switch (query.sort) {
      case "price-asc":
        orderBy = { variants: { _min: { price: "asc" } } };
        break;
      case "price-desc":
        orderBy = { variants: { _min: { price: "desc" } } };
        break;
      case "popularity":
        orderBy = { orderItems: { _count: "desc" } };
        break;
      case "bestseller":
        orderBy = [{ isBestSeller: "desc" }, { createdAt: "desc" }];
        break;
      case "rating":
        orderBy = { reviews: { _count: "desc" } };
        break;
      case "new":
      default:
        orderBy = { createdAt: "desc" };
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          category: true,
          variants: { where: { isActive: true }, orderBy: { price: "asc" } },
          reviews: { where: { isApproved: true }, select: { rating: true } },
          _count: { select: { orderItems: true, reviews: { where: { isApproved: true } } } },
        },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        orderBy,
      }),
      prisma.product.count({ where }),
    ]);

    // Compute average ratings
    const productsWithRating = products.map((p) => {
      const avgRating = p.reviews.length > 0 ? p.reviews.reduce((s, r) => s + r.rating, 0) / p.reviews.length : 0;
      return { ...p, avgRating: Math.round(avgRating * 10) / 10, reviewCount: p._count.reviews };
    });

    // Post-filter by min rating if needed
    let filtered = productsWithRating;
    if (query.minRating) {
      filtered = filtered.filter((p) => p.avgRating >= query.minRating!);
    }

    res.json({
      products: filtered,
      pagination: { total, page: query.page, pages: Math.ceil(total / query.limit), limit: query.limit },
    });
  })
);

// GET SINGLE PRODUCT
catalogRouter.get(
  "/products/:slug",
  asyncHandler(async (req, res) => {
    const product = await prisma.product.findUnique({
      where: { slug: req.params.slug },
      include: {
        category: true,
        variants: { where: { isActive: true }, orderBy: { price: "asc" } },
        reviews: {
          where: { isApproved: true },
          include: { user: { select: { name: true } } },
          orderBy: { createdAt: "desc" },
        },
        _count: { select: { orderItems: true, reviews: { where: { isApproved: true } } } },
      },
    });
    if (!product) throw new HttpError(404, "Product not found");

    const avgRating = product.reviews.length > 0
      ? Math.round((product.reviews.reduce((s, r) => s + r.rating, 0) / product.reviews.length) * 10) / 10
      : 0;

    const related = await prisma.product.findMany({
      where: { categoryId: product.categoryId, id: { not: product.id }, isActive: true },
      include: {
        variants: { where: { isActive: true }, orderBy: { price: "asc" } },
        reviews: { where: { isApproved: true }, select: { rating: true } },
      },
      take: 4,
    });

    res.json({ product: { ...product, avgRating, reviewCount: product._count.reviews }, related });
  })
);

// SEARCH SUGGESTIONS
catalogRouter.get(
  "/search/suggestions",
  asyncHandler(async (req, res) => {
    const q = z.string().optional().parse(req.query.q);
    const products = await prisma.product.findMany({
      where: q
        ? { OR: [{ name: { contains: q, mode: "insensitive" } }], isActive: true }
        : { isBestSeller: true, isActive: true },
      select: { name: true, slug: true, images: true },
      take: 8,
    });
    res.json({
      suggestions: products,
      trending: ["avakaya", "gongura", "chicken pickle", "gift box", "combo pack", "garlic pickle"],
    });
  })
);
