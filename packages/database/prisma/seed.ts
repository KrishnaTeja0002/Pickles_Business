import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const categories = [
  ["Mango Pickle", "mango-pickle"],
  ["Lemon Pickle", "lemon-pickle"],
  ["Gongura Pickle", "gongura-pickle"],
  ["Chicken Pickle", "chicken-pickle"],
  ["Gift Boxes", "gift-boxes"]
];

async function main() {
  const passwordHash = await bcrypt.hash("UrHomeTaste@123", 12);
  await prisma.user.upsert({
    where: { email: "admin@urhometaste.in" },
    update: {},
    create: {
      name: "Ur Home Taste Admin",
      email: "admin@urhometaste.in",
      passwordHash,
      role: "ADMIN",
      isVerified: true,
      referralCode: "UHTADMIN"
    }
  });

  for (const [name, slug] of categories) {
    await prisma.category.upsert({ where: { slug }, update: {}, create: { name, slug, description: `${name} collection` } });
  }

  const mango = await prisma.category.findUniqueOrThrow({ where: { slug: "mango-pickle" } });
  await prisma.product.upsert({
    where: { slug: "andhra-avakaya-mango-pickle" },
    update: {},
    create: {
      categoryId: mango.id,
      name: "Andhra Avakaya Mango Pickle",
      slug: "andhra-avakaya-mango-pickle",
      shortDescription: "Traditional raw mango pickle with sesame oil.",
      description: "Sun-cured mango, cold-pressed sesame oil, mustard, chilli, and rock salt.",
      ingredients: ["Raw mango", "Sesame oil", "Mustard", "Red chilli", "Rock salt"],
      nutrition: { energy: "62 kcal", fat: "5g", serving: "15g" },
      shelfLife: "9 months",
      storage: "Use a dry spoon and store away from sunlight.",
      process: "Washed, sun-dried, hand-cut, spice-coated, oil-matured, and packed in sterilized jars.",
      images: ["/products/avakaya.jpg"],
      isFeatured: true,
      isBestSeller: true,
      variants: {
        create: [
          { weight: "250g", sku: "UHT-AVA-250", mrp: 229, price: 189, stock: 120 },
          { weight: "500g", sku: "UHT-AVA-500", mrp: 399, price: 349, stock: 80 },
          { weight: "1kg", sku: "UHT-AVA-1000", mrp: 749, price: 649, stock: 40 }
        ]
      }
    }
  });

  await prisma.coupon.upsert({
    where: { code: "UHTWELCOME" },
    update: {},
    create: {
      code: "UHTWELCOME",
      description: "Welcome discount",
      percentOff: 10,
      minOrder: 299,
      maxDiscount: 150,
      startsAt: new Date(),
      endsAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365),
      isActive: true
    }
  });
}

main().finally(async () => {
  await prisma.$disconnect();
});
