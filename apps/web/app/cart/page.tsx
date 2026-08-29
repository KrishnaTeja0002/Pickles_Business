import { Gift, ShoppingBag, Ticket } from "lucide-react";
import { PageHero } from "@/components/ui/PageHero";
import { products } from "@/lib/data";
import styles from "./commerce.module.scss";

export const metadata = { title: "Cart" };

export default function CartPage() {
  const subtotal = products.slice(0, 2).reduce((sum, product) => sum + product.price, 0);
  return (
    <>
      <PageHero eyebrow="Cart" title="Review your jars" subtitle="Apply coupons, add gift wrap, estimate delivery charges, taxes, and move into secure checkout." />
      <section className={`section page ${styles.twoCol}`}>
        <div className={styles.panel}>{products.slice(0, 2).map((product) => <article key={product.slug}><ShoppingBag size={22} /><div><h2>{product.name}</h2><p>500g · Qty 1 · ₹{product.price}</p></div></article>)}</div>
        <aside className={styles.panel}><h2>Order summary</h2><p><Ticket size={18} /> Coupon UHTWELCOME ready</p><p><Gift size={18} /> Gift wrap ₹49</p><strong>Subtotal ₹{subtotal}</strong><strong>Taxes ₹{Math.round(subtotal * .05)}</strong><strong>Total ₹{subtotal + Math.round(subtotal * .05) + 59}</strong><a className="button" href="/checkout">Checkout</a></aside>
      </section>
    </>
  );
}
