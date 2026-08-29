import { Router } from "express";
import { z } from "zod";
import { asyncHandler } from "../utils/async-handler.js";
import { prisma } from "../utils/prisma.js";

export const contentRouter = Router();

contentRouter.get(
  "/blog",
  asyncHandler(async (_req, res) => {
    const posts = await prisma.blogPost.findMany({ where: { publishedAt: { not: null } }, orderBy: { publishedAt: "desc" } });
    res.json({ posts });
  })
);

contentRouter.post(
  "/newsletter",
  asyncHandler(async (req, res) => {
    const { email, source } = z.object({ email: z.string().email(), source: z.string().optional() }).parse(req.body);
    const subscriber = await prisma.newsletterSubscriber.upsert({ where: { email }, create: { email, source }, update: { source } });
    res.status(201).json({ subscriber });
  })
);

contentRouter.post(
  "/contact",
  asyncHandler(async (req, res) => {
    z.object({ name: z.string(), email: z.string().email(), message: z.string().min(10) }).parse(req.body);
    res.status(202).json({ message: "Contact request received" });
  })
);

contentRouter.get(
  "/faqs",
  asyncHandler(async (_req, res) => {
    res.json({
      faqs: [
        { question: "Are the pickles homemade?", answer: "Yes, every batch follows traditional small-batch preparation." },
        { question: "How long does delivery take?", answer: "Most orders arrive in 2-5 business days depending on the pincode." },
        { question: "Do you offer non-veg pickles?", answer: "Yes, chicken, mutton, fish, and prawn pickle are available in selected regions." }
      ]
    });
  })
);
