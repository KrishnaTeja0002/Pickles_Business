import { CheckCircle2, FileText } from "lucide-react";
import { PageHero } from "@/components/ui/PageHero";
import styles from "../cart/commerce.module.scss";

export const metadata = { title: "Order Confirmation" };

export default function OrderConfirmationPage() {
  return (
    <>
      <PageHero eyebrow="Success" title="Your order is placed" subtitle="Payment captured, invoice generated, and preparation timeline started." />
      <section className={`section page ${styles.panel}`}><h2><CheckCircle2 /> Order UHT-20260625</h2><p><FileText size={18} /> Invoice download ready</p><a className="button" href="/track-order">Track order</a></section>
    </>
  );
}
