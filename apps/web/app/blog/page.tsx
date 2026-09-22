import { Clock, BookOpen, ArrowRight, Sparkles } from "lucide-react";
import Link from "next/link";
import { PageHero } from "@/components/ui/PageHero";

export const metadata = {
  title: "Pickle Stories & Culinary Traditions - Ur Home Taste",
  description: "Explore the rich heritage of Andhra pickles, traditional sun-curing methods, health benefits of cold-pressed oils, and mouthwatering food pairing guides.",
};

const articles = [
  {
    title: "The Art of Sun-Cured Avakaya: Why Mustard & Gingelly Oil Matter",
    slug: "art-of-sun-cured-avakaya",
    category: "Heritage Recipes",
    readTime: "4 min read",
    date: "September 2026",
    summary: "In traditional Andhra households, making Avakaya is an annual ritual. Discover why cold-pressed sesame oil (nuvvula nune) and hand-ground mustard seeds are indispensable for the legendary punch.",
    highlight: "Avakaya Mango Pickle",
    productLink: "/product/andhra-avakaya-mango-pickle",
  },
  {
    title: "Gongura: The Tangy Sorrel Leaf That Defines Andhra Cuisine",
    slug: "gongura-the-tangy-soul-of-andhra",
    category: "Culinary Secrets",
    readTime: "5 min read",
    date: "September 2026",
    summary: "Known as the 'Crown Jewel of Andhra Pickles', Gongura (Red Sorrel) is packed with natural iron, folic acid, and an unforgettably tangy bite. Learn how stone-pounding brings out its deepest flavors.",
    highlight: "Gongura Leaf Pickle",
    productLink: "/product/gongura-leaf-pickle",
  },
  {
    title: "The Perfect Andhra Meal: How to Pair Pickles with Hot Rice & Fresh Ghee",
    slug: "perfect-andhra-meal-pairing-guide",
    category: "Dining Guide",
    readTime: "3 min read",
    date: "August 2026",
    summary: "Nothing compares to hot steaming Sona Masoori rice, a dollop of pure homemade ghee (mudda pappu), and a spoonful of spicy Avakaya. Here is our master guide to classic South Indian pickle pairings.",
    highlight: "Browse All Jars",
    productLink: "/shop",
  },
  {
    title: "How to Store and Age Homemade Pickles for Peak Flavor",
    slug: "how-to-store-and-age-pickles",
    category: "Kitchen Tips",
    readTime: "4 min read",
    date: "August 2026",
    summary: "Did you know that authentic oil-cured pickles actually improve with age? Follow these simple rules to keep your pickles vibrant, aromatic, and fresh for up to 9 months without refrigeration.",
    highlight: "Storage Guidelines",
    productLink: "/about",
  },
  {
    title: "Natu Kodi & Mutton Pickles: The Andhra Non-Veg Preservation Secret",
    slug: "andhra-non-veg-pickle-tradition",
    category: "Non-Veg Specialties",
    readTime: "5 min read",
    date: "July 2026",
    summary: "Slow-cooked boneless country chicken and tender mutton pieces immersed in aromatic ginger-garlic-chilli masala. Discover how Andhra travelers historically carried meat pickles across long journeys.",
    highlight: "Country Chicken Pickle",
    productLink: "/shop?category=non-veg",
  },
  {
    title: "Seasonal Harvest: Why Wild Amla (Usirikaya) is an Immunity Powerhouse",
    slug: "wild-amla-usirikaya-health-benefits",
    category: "Health & Nutrition",
    readTime: "4 min read",
    date: "July 2026",
    summary: "Harvested during the winter months, wild gooseberries slit and marinated with mustard and sesame oil offer up to 20x more Vitamin C than oranges. Learn why our ancestors valued Usirikaya Pachadi for digestion.",
    highlight: "Amla Pickle",
    productLink: "/product/amla-gooseberry-pickle",
  },
];

export default function BlogPage() {
  return (
    <>
      <PageHero
        eyebrow="Pickle Wisdom & Culinary Culture"
        title="Stories from the Andhra Kitchen"
        subtitle="Discover traditional slow-curing techniques, health benefits of cold-pressed oils, and generational recipes from our kitchen to yours."
      />

      <section className="section page" style={{ maxWidth: "1100px", margin: "0 auto 60px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "24px" }}>
          {articles.map((post) => (
            <article
              key={post.slug}
              className="card"
              style={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                padding: "26px",
                borderRadius: "12px",
                border: "1px solid var(--line)",
                background: "var(--white)",
                boxShadow: "0 2px 10px rgba(0,0,0,0.03)",
                transition: "transform 0.2s ease, box-shadow 0.2s ease",
              }}
            >
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                  <span
                    style={{
                      fontSize: "0.78rem",
                      fontWeight: 700,
                      background: "rgba(24, 63, 44, 0.08)",
                      color: "var(--green)",
                      padding: "4px 10px",
                      borderRadius: "999px",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                    }}
                  >
                    {post.category}
                  </span>
                  <span style={{ fontSize: "0.8rem", color: "var(--muted)", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                    <Clock size={13} /> {post.readTime}
                  </span>
                </div>

                <h2 style={{ fontSize: "1.2rem", color: "var(--green)", margin: "0 0 10px", lineHeight: 1.4 }}>
                  {post.title}
                </h2>

                <p style={{ fontSize: "0.9rem", color: "var(--muted)", lineHeight: 1.65, margin: "0 0 18px" }}>
                  {post.summary}
                </p>
              </div>

              <div style={{ borderTop: "1px solid var(--line)", paddingTop: "14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "0.8rem", color: "var(--muted)" }}>{post.date}</span>
                <Link
                  href={post.productLink}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    fontSize: "0.88rem",
                    fontWeight: 700,
                    color: "var(--brown)",
                    textDecoration: "none",
                  }}
                >
                  {post.highlight} <ArrowRight size={15} />
                </Link>
              </div>
            </article>
          ))}
        </div>

        <div style={{ textAlign: "center", marginTop: "48px" }}>
          <Link href="/shop" className="button" style={{ padding: "14px 32px" }}>
            <Sparkles size={16} style={{ display: "inline", marginRight: "8px" }} />
            Browse Freshly Packed Pickles
          </Link>
        </div>
      </section>
    </>
  );
}
