import type { MetadataRoute } from "next";
import { products } from "@/lib/data";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_WEB_URL ?? "http://localhost:3000";
  const staticRoutes = [
    "",
    "about",
    "shop",
    "categories",
    "cart",
    "checkout",
    "track-order",
    "contact",
    "blog",
    "account",
    "legal/privacy-policy",
    "legal/shipping-policy",
    "legal/refund-policy",
    "legal/terms-and-conditions",
    "legal/return-policy",
    "legal/cookie-policy"
  ];
  return [
    ...staticRoutes.map((route) => ({ url: `${base}/${route}`, lastModified: new Date() })),
    ...products.map((product) => ({ url: `${base}/product/${product.slug}`, lastModified: new Date() }))
  ];
}
