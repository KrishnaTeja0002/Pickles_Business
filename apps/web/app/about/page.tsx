import { Leaf, ShieldCheck, Heart, Sparkles, Sun, Award, HelpCircle } from "lucide-react";
import Link from "next/link";
import { PageHero } from "@/components/ui/PageHero";
import styles from "./simple.module.scss";

export const metadata = {
  title: "About Us - Ur Home Taste",
  description: "Learn about Ur Home Taste, our traditional Andhra home recipes, stone-ground spices, cold-pressed oils, and generational kitchen heritage.",
};

const storyPillars = [
  {
    icon: Heart,
    title: "Generations of Family Heritage",
    content: "Ur Home Taste began in our family kitchen in Andhra Pradesh. For decades, our grandmothers hand-selected raw mangoes and sun-cured Gongura leaves using timeless recipes passed down across generations. We started this journey so that anyone living anywhere in India can taste the unmistakable, uncompromised warmth of an authentic Andhra home kitchen."
  },
  {
    icon: Sun,
    title: "Sun-Cured, Slow-Matured",
    content: "Unlike industrial factory pickles that rely on vinegar and artificial preservatives for speed, our pickles are made the patient way. Farm-fresh produce is cleaned, sun-wilted under natural sunlight, hand-sliced, and aged in traditional ceramic jars (jaadilu) for 7 to 14 days to let the oil and spices marry deeply."
  },
  {
    icon: Leaf,
    title: "Pure Cold-Pressed Oils",
    content: "We use exclusively pure, unrefined cold-pressed sesame oil (nuvvula nune) for our signature Avakaya and cold-pressed groundnut oil for our Gongura and tomato pickles. Zero chemical refining, zero mineral oils, zero palm oil. You can smell the rich, nutty aroma the moment you open the seal."
  },
  {
    icon: ShieldCheck,
    title: "Zero Chemicals & Zero Preservatives",
    content: "Our pickles preserve naturally using ancient food science: optimal salt concentration, natural antioxidants from cold-pressed oils, turmeric, and mustard. We never add artificial colors, sodium benzoate, synthetic vinegar, or flavour enhancers. What you taste is 100% wholesome food."
  },
  {
    icon: Award,
    title: "Handpicked Farm Produce",
    content: "We source our raw mangoes from local Andhra orchards, hand-sorting every piece for the right firmness and tartness. Our chillies come straight from Guntur markets for genuine pungency, and our garlic cloves are peeled and sorted by hand in small batches."
  },
  {
    icon: Sparkles,
    title: "Small-Batch Hand Packing",
    content: "Every single jar is filled by hand with a generous layer of seasoned oil to maintain an airtight protective seal. Each jar is vacuum-sealed and inspected before dispatch so it arrives fresh, vibrant, and leak-free at your doorstep."
  }
];

const faqs = [
  {
    q: "How are your pickles different from supermarket brands?",
    a: "Commercial brands use commercial vinegar, preservatives, and diluted refined oils to extend shelf life cheaply. We use generations-old recipes, stone-ground spices, and 100% cold-pressed oils without a drop of chemical preservatives."
  },
  {
    q: "How should I store the pickles once opened?",
    a: "Always use a clean, completely dry spoon. Keep the pickle surface submerged under a thin layer of oil. For vegetarian pickles, a cool and dry cupboard is ideal. Non-veg pickles (Chicken and Mutton) are best refrigerated after opening for extended freshness."
  },
  {
    q: "What is the shelf life of Ur Home Taste pickles?",
    a: "Our pickles have a natural shelf life of 6 to 9 months when stored properly with a dry spoon. Because we use traditional oil-maturation techniques, the flavor actually becomes deeper and richer over the first few weeks!"
  },
  {
    q: "How do you ensure safe, zero-leak delivery?",
    a: "Every jar is double-sealed with an induction inner seal, a food-grade security shrink cap, and custom shock-absorbing packaging. We offer a 100% free instant replacement guarantee if any damage occurs in transit."
  }
];

export default function AboutPage() {
  return (
    <>
      <PageHero
        eyebrow="From Our Home to Yours"
        title="Authentic Andhra Kitchen Heritage"
        subtitle="We preserve the slow, traditional art of homemade pickles — prepared with cold-pressed oils, stone-ground spices, and generational love."
      />

      {/* Main Pillars */}
      <section className={`section page ${styles.grid}`} style={{ marginBottom: "48px" }}>
        {storyPillars.map((pillar) => {
          const Icon = pillar.icon;
          return (
            <article className="card" key={pillar.title} style={{ padding: "28px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
                <div style={{
                  background: "rgba(24, 63, 44, 0.08)",
                  color: "var(--green)",
                  borderRadius: "8px",
                  padding: "10px",
                  display: "grid",
                  placeItems: "center"
                }}>
                  <Icon size={22} />
                </div>
                <h2 style={{ margin: 0, fontSize: "1.15rem", color: "var(--green)" }}>{pillar.title}</h2>
              </div>
              <p style={{ margin: 0, fontSize: "0.92rem", lineHeight: 1.7, color: "var(--muted)" }}>
                {pillar.content}
              </p>
            </article>
          );
        })}
      </section>

      {/* FAQs Section */}
      <section className="section page" style={{ maxWidth: "860px", margin: "0 auto 60px" }}>
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <span className="eyebrow" style={{ justifyContent: "center" }}>
            <HelpCircle size={15} /> Common Questions
          </span>
          <h2 className="title" style={{ textAlign: "center", margin: "6px 0 10px" }}>
            Frequently Asked Questions
          </h2>
          <p className="subtitle" style={{ textAlign: "center", margin: "0 auto" }}>
            Everything you need to know about our ingredients, storage, and small-batch craft.
          </p>
        </div>

        <div style={{ display: "grid", gap: "16px" }}>
          {faqs.map((faq, idx) => (
            <div
              key={idx}
              style={{
                background: "var(--white)",
                border: "1px solid var(--line)",
                borderRadius: "10px",
                padding: "20px 24px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.03)"
              }}
            >
              <h3 style={{ margin: "0 0 8px", fontSize: "1.05rem", color: "var(--green)" }}>
                {faq.q}
              </h3>
              <p style={{ margin: 0, fontSize: "0.92rem", color: "var(--muted)", lineHeight: 1.65 }}>
                {faq.a}
              </p>
            </div>
          ))}
        </div>

        <div style={{ textAlign: "center", marginTop: "36px" }}>
          <Link href="/shop" className="button" style={{ padding: "12px 28px" }}>
            Explore Our Handmade Pickles
          </Link>
        </div>
      </section>
    </>
  );
}
