import { Router } from "express";
import { z } from "zod";
import { asyncHandler } from "../utils/async-handler.js";
import { prisma } from "../utils/prisma.js";

export const contentRouter = Router();

contentRouter.get(
  "/blog",
  asyncHandler(async (_req, res) => {
    const posts = await prisma.blogPost.findMany({
      where: { publishedAt: { not: null } },
      orderBy: { publishedAt: "desc" },
    });
    res.json({ posts });
  })
);

contentRouter.post(
  "/newsletter",
  asyncHandler(async (req, res) => {
    const { email, source } = z.object({ email: z.string().email(), source: z.string().optional() }).parse(req.body);
    const subscriber = await prisma.newsletterSubscriber.upsert({
      where: { email },
      create: { email, source },
      update: { source },
    });
    res.status(201).json({ subscriber, message: "Subscribed successfully!" });
  })
);

contentRouter.post(
  "/contact",
  asyncHandler(async (req, res) => {
    const body = z.object({
      name: z.string().min(2).max(100),
      email: z.string().email(),
      phone: z.string().optional(),
      subject: z.string().optional(),
      message: z.string().min(10).max(5000),
    }).parse(req.body);

    // In production, send email notification to admin
    console.log("[Contact Form]", body);
    res.status(202).json({ message: "Thank you for reaching out. We'll get back to you soon!" });
  })
);

contentRouter.get(
  "/faqs",
  asyncHandler(async (_req, res) => {
    res.json({
      faqs: [
        {
          question: "Are the pickles homemade?",
          answer: "Yes, every batch is prepared in small quantities using traditional Andhra style recipes. We use only cold-pressed oils, hand-ground spices, and seasonal produce."
        },
        {
          question: "How long does delivery take?",
          answer: "Most orders arrive within 2-5 business days across India. Orders above ₹999 qualify for free delivery. You can track your order in real-time from your account."
        },
        {
          question: "Do you offer non-veg pickles?",
          answer: "Yes! We offer authentic Natu Kodi (country chicken) pickle and Mutton pickle. Both are prepared with boneless meat, slow-cooked in Andhra masala, and sealed in cold-pressed sesame oil."
        },
        {
          question: "What oils do you use?",
          answer: "We use only cold-pressed sesame oil (nuvvula nune) for most of our pickles and cold-pressed groundnut oil for gongura and tomato varieties. We never use refined or blended oils."
        },
        {
          question: "How should I store the pickles?",
          answer: "Always use a clean, dry spoon. Store in a cool, dark place. Refrigerate non-veg pickles after opening. Most pickles have a shelf life of 6-9 months when stored properly."
        },
        {
          question: "Can I return or cancel my order?",
          answer: "You can cancel your order anytime before it is dispatched. For quality reasons, we cannot accept returns on food items. If you receive a damaged or incorrect product, contact us for a full refund."
        },
        {
          question: "Do you ship across India?",
          answer: "Yes, we deliver to most pincodes across India. Delivery charges are ₹59 for orders below ₹999 and free for orders above ₹999."
        },
        {
          question: "Are your pickles suitable for people with allergies?",
          answer: "Each product lists its ingredients and allergens clearly. Common allergens include sesame, mustard, and groundnut. Please check the product page for specific allergen information."
        },
        {
          question: "Do you offer gift packing?",
          answer: "Yes! We offer premium gift boxes with 3-pack and 6-pack options. You can also add gift wrapping (₹49) and a personalized message to any order during checkout."
        },
        {
          question: "What payment methods do you accept?",
          answer: "We accept all major payment methods through Razorpay including UPI (Google Pay, PhonePe, Paytm, BHIM), credit/debit cards, and net banking."
        },
      ],
    });
  })
);

contentRouter.get(
  "/shipping-info",
  asyncHandler(async (_req, res) => {
    const config = await prisma.shippingConfig.findFirst({ where: { isActive: true } });
    res.json({
      flatRate: Number(config?.flatRate ?? 59),
      freeShippingAbove: Number(config?.freeShippingAbove ?? 999),
      estimatedDays: config?.estimatedDays ?? "2-5 business days",
    });
  })
);
