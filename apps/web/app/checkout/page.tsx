import { CreditCard, MapPin, Truck } from "lucide-react";
import { PageHero } from "@/components/ui/PageHero";
import styles from "../cart/commerce.module.scss";

export const metadata = { title: "Checkout" };

export default function CheckoutPage() {
  return (
    <>
      <PageHero eyebrow="Checkout" title="Delivery and payment" subtitle="Address, pincode availability, estimated delivery, payment method, and order summary in one focused flow." />
      <section className={`section page ${styles.twoCol}`}>
        <form className={styles.panel}>
          <label className="field">Full name<input /></label>
          <label className="field">Address<input /></label>
          <label className="field">Pincode<input /></label>
          <label className="field">Payment<select><option>Razorpay UPI</option><option>Google Pay</option><option>PhonePe</option><option>Paytm</option><option>BHIM</option></select></label>
          <a className="button" href="/payment">Continue to payment</a>
        </form>
        <aside className={styles.panel}><p><MapPin size={18} /> Delivery availability checker</p><p><Truck size={18} /> Estimated delivery: 2-5 business days</p><p><CreditCard size={18} /> Secure payment with transaction ID and invoice generation</p></aside>
      </section>
    </>
  );
}
