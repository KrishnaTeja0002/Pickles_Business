import { PageHero } from "@/components/ui/PageHero";
import styles from "../cart/commerce.module.scss";

export const metadata = { title: "Track Order" };

export default function TrackOrderPage() {
  return (
    <>
      <PageHero eyebrow="Tracking" title="Order timeline" subtitle="Placed, accepted, preparing, packed, shipped, out for delivery, delivered, cancellation, return, and refund status." />
      <section className={`section page ${styles.timeline}`}>{["Placed", "Accepted", "Preparing", "Packed", "Shipped", "Out for Delivery", "Delivered"].map((step, index) => <article key={step}><b>{index + 1}</b><span>{step}</span></article>)}</section>
    </>
  );
}
