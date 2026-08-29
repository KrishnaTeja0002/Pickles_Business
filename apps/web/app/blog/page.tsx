import Link from "next/link";
import { PageHero } from "@/components/ui/PageHero";

export const metadata = { title: "Blog" };

const posts = ["Recipes", "Health Benefits", "Food Tips", "Traditional Foods", "Festival Specials"];

export default function BlogPage() {
  return (
    <>
      <PageHero eyebrow="Blog" title="Recipes, traditions, and pickle wisdom" subtitle="SEO-ready editorial sections for recipe ideas, health benefits, food tips, traditional foods, and festival specials." />
      <section className="section page grid">{posts.map((post) => <Link className="card" style={{ padding: 24 }} key={post} href="#"><h2 style={{ color: "var(--green)" }}>{post}</h2><p className="subtitle">Editorial content hub for organic search and customer education.</p></Link>)}</section>
    </>
  );
}
