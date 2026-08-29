import { PageHero } from "@/components/ui/PageHero";

export const metadata = { title: "Seller Panel" };

export default function SellerPage() {
  const items = ["Add Products", "Edit Products", "Delete Products", "Inventory", "Orders", "Sales", "Revenue", "Analytics", "Profile"];
  return (
    <>
      <PageHero eyebrow="Seller" title="Seller operations" subtitle="A focused seller panel for product management, inventory, orders, sales, revenue, analytics, and profile management." />
      <section className="section page grid">{items.map((item) => <article className="card" style={{ padding: 24, color: "var(--green)", fontWeight: 900 }} key={item}>{item}</article>)}</section>
    </>
  );
}
