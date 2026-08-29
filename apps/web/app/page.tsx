import { ArrowRight, Leaf, ShieldCheck, Sparkles, Truck } from "lucide-react";
import Link from "next/link";
import { Hero } from "@/components/home/Hero";
import { ProductCard } from "@/components/product/ProductCard";
import { categories, processSteps, products, reviews } from "@/lib/data";
import styles from "./page.module.scss";

export default function HomePage() {
    return (
        <>
            <Hero />
            <section className="section page">
                <div className={styles.sectionHead}>
                    <div>
                        <span className="eyebrow">Featured pickles</span>
                        <h2 className="title">Small-batch favourites</h2>
                    </div>
                    <Link className="button secondary" href="/shop">View all <ArrowRight size={18} /></Link>
                </div>
                <div className="grid">{products.map((product) => <ProductCard key={product.slug} product={product} />)}</div>
            </section>
            <section className={styles.band}>
                <div className="page">
                    <span className="eyebrow">Categories</span>
                    <h2 className="title">Every craving has a jar</h2>
                    <div className={styles.chips}>{categories.map((category) => <Link key={category} href={`/shop?category=${encodeURIComponent(category)}`}>{category}</Link>)}</div>
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
