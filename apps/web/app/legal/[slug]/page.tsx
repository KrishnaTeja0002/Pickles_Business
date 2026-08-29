import { PageHero } from "@/components/ui/PageHero";

const titles: Record<string, string> = {
  "privacy-policy": "Privacy Policy",
  "shipping-policy": "Shipping Policy",
  "refund-policy": "Refund Policy",
  "terms-and-conditions": "Terms & Conditions",
  "return-policy": "Return Policy",
  "cookie-policy": "Cookie Policy"
};

export function generateStaticParams() {
  return Object.keys(titles).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return { title: titles[slug] ?? "Legal" };
}

export default async function LegalPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const title = titles[slug] ?? "Legal";
  return (
    <>
      <PageHero eyebrow="Legal" title={title} subtitle="Production policy page template ready for counsel-reviewed business terms." />
      <section className="section page">
        <article className="card" style={{ padding: 28 }}>
          <p className="subtitle">This page documents customer rights, business responsibilities, data handling, shipping timelines, refund windows, returns, cookies, and dispute resolution. Replace this operational template with counsel-approved copy before public launch.</p>
        </article>
      </section>
    </>
  );
}
