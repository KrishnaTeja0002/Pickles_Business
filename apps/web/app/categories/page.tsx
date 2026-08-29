import Link from "next/link";
import { PageHero } from "@/components/ui/PageHero";
import { categories } from "@/lib/data";

export const metadata = { title: "Categories" };

export default function CategoriesPage() {
  return (
    <>
      <PageHero eyebrow="Categories" title="Pickle collections" subtitle="Browse vegetarian classics, non-veg signatures, seasonal specials, and gift boxes." />
      <section className="section page grid">
        {categories.map((category) => <Link className="card" style={{ padding: 24, color: "var(--green)", fontWeight: 900 }} key={category} href={`/shop?category=${encodeURIComponent(category)}`}>{category}</Link>)}
      </section>
    </>
  );
}
