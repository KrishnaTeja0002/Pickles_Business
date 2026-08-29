import { PageHero } from "@/components/ui/PageHero";
import styles from "./simple.module.scss";

export const metadata = { title: "About Us" };

export default function AboutPage() {
  const sections = ["Founder Story", "Mission", "Vision", "Journey", "Kitchen Story", "Traditional Recipes", "Manufacturing Process", "Our Promise"];
  return (
    <>
      <PageHero eyebrow="About us" title="Our Home Taste, shared with every home" subtitle="A premium homemade pickle brand rooted in family recipes, clean sourcing, traditional preparation, and dependable fulfilment." />
      <section className={`section page ${styles.grid}`}>
        {sections.map((section) => <article className="card" key={section}><h2>{section}</h2><p>We preserve the warmth of an Indian home kitchen while building systems for safety, consistency, freshness, and scale.</p></article>)}
      </section>
    </>
  );
}
