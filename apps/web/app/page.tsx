import { Leaf, ShieldCheck, Sparkles, Truck } from "lucide-react";
import Link from "next/link";
import { Hero } from "@/components/home/Hero";
import { processSteps, reviews } from "@/lib/data";
import styles from "./page.module.scss";

export default function HomePage() {
    return (
        <>
            <Hero />
            <section className={styles.band}>
                <div className="page" style={{ textAlign: "center" }}>
                    <span className="eyebrow" style={{ justifyContent: "center" }}>Categories</span>
                    <h2 className="title" style={{ textAlign: "center", marginBottom: "8px" }}>Every Craving Has a Jar</h2>
                    <p className="subtitle" style={{ maxWidth: "580px", margin: "0 auto 28px", textAlign: "center" }}>
                        Explore authentic Andhra handmade pickles, sun-cured with stone-ground spices and pure cold-pressed oil.
                    </p>
                    <div className={styles.chips}>
                        <Link href="/shop">All Pickles</Link>
                        <Link href="/shop?category=all-time">All-Time Classics</Link>
                        <Link href="/shop?category=seasonal">Seasonal Specials</Link>
                        <Link href="/shop?category=non-veg">Non-Veg Pickles</Link>
                        <Link href="/shop?category=combos">Combos &amp; Gift Boxes</Link>
                        <Link href="/shop?category=Mango%20Pickle">Avakaya Mango</Link>
                        <Link href="/shop?category=Gongura%20Pickle">Gongura Leaf</Link>
                        <Link href="/shop?category=Garlic%20Pickle">Spicy Garlic</Link>
                        <Link href="/shop?category=Tomato%20Pickle">Andhra Tomato</Link>
                        <Link href="/shop?category=Chicken%20Pickle">Country Chicken</Link>
                        <Link href="/shop?category=Mutton%20Pickle">Andhra Mutton</Link>
                        <Link href="/shop?category=Amla%20Pickle">Usirikaya (Amla)</Link>
                    </div>
                </div>
            </section>
            <section className="section page">
                <div className={styles.deal}>
                    <div>
                        <span className="eyebrow">Today's special</span>
                        <h2>Avakaya + Gongura combo</h2>
                        <p>Save 18% on the most-loved Andhra duo. Includes gift note, tamper-safe packing, and free delivery above ₹999.</p>
                    </div>
                    <Link className="button" href="/shop">Grab deal</Link>
                </div>
            </section>
            <section className="section page">
                <div className={styles.features}>
                    {[["Traditional recipes", Leaf], ["Secure payments", ShieldCheck], ["Fresh delivery", Truck], ["Premium gifting", Sparkles]].map(([label, Icon]) => (
                        <div className="card" key={String(label)}><Icon size={28} /><strong>{String(label)}</strong><p>Built for trust, repeat purchases, and everyday home dining.</p></div>
                    ))}
                </div>
            </section>
            <section className={styles.process}>
                <div className="page">
                    <span className="eyebrow">Preparation process</span>
                    <h2 className="title">Made the slow way</h2>
                    <div>{processSteps.map((step, index) => <article key={step}><b>{String(index + 1).padStart(2, "0")}</b><span>{step}</span></article>)}</div>
                </div>
            </section>
            <section className="section page">
                <div className={styles.story}>
                    <div>
                        <span className="eyebrow">Our story</span>
                        <h2 className="title">A family kitchen, scaled with care</h2>
                        <p className="subtitle">Ur Home Taste began as Our Home Taste: a promise that every jar should feel personal, honest, and unmistakably homemade.</p>
                        <Link className="button secondary" href="/about">Read our journey</Link>
                    </div>
                    <div className={styles.video}>Kitchen Story Video</div>
                </div>
            </section>
            <section className={styles.reviews}>
                <div className="page">
                    <span className="eyebrow">Customer reviews</span>
                    <h2 className="title">Loved at first spoon</h2>
                    <div className="grid">{reviews.map((review) => <article className="card" key={review.name}><b>{review.name}</b><p>{review.text}</p><span>{"★".repeat(review.rating)}</span></article>)}</div>
                </div>
            </section>
            <section className="section page">
                <div className={styles.newsletter}>
                    <span className="eyebrow">Newsletter</span>
                    <h2>Fresh batches, festival boxes, secret recipes.</h2>
                    <form><input placeholder="Email address" aria-label="Email address" /><button>Subscribe</button></form>
                </div>
            </section>
        </>
    );
}
