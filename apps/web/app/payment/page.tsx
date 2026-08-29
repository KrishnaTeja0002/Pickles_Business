import { Smartphone, ShieldCheck } from "lucide-react";
import { PageHero } from "@/components/ui/PageHero";
import styles from "../cart/commerce.module.scss";

export const metadata = { title: "Payment" };

export default function PaymentPage() {
  return (
    <>
      <PageHero eyebrow="Payment" title="Razorpay UPI checkout" subtitle="Supports UPI, Google Pay, PhonePe, Paytm, BHIM, payment success, payment failure, retry, transaction ID, and invoice hooks." />
      <section className={`section page ${styles.panel}`}>
        <h2>Choose payment app</h2>
        <div className="grid">{["UPI", "Google Pay", "PhonePe", "Paytm", "BHIM"].map((method) => <button className="button secondary" key={method}><Smartphone size={18} /> {method}</button>)}</div>
        <p><ShieldCheck size={18} /> Order ID UHT-20260625 · Transaction pending · Retry enabled</p>
        <a className="button" href="/order-confirmation">Simulate success</a>
      </section>
    </>
  );
}
