import { CheckCircle2, Heart, MessageSquare, ShoppingBag, Star } from "lucide-react";
import Image from "next/image";
import { ProductCard } from "@/components/product/ProductCard";
import { products } from "@/lib/data";
import styles from "./product.module.scss";

export function generateStaticParams() {
    return products.map((product) => ({ slug: product.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const product = products.find((entry) => entry.slug === slug) ?? products[0];
    return { title: product.name, description: product.description };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const product = products.find((entry) => entry.slug === slug) ?? products[0];
    return (
        <section className="section page">
            <div className={styles.product}>
                <div className={styles.gallery}>
                    <Image src={product.image} alt={product.name} width={760} height={680} priority />
                    <div><Image src={product.image} alt="" width={160} height={120} /><Image src={product.image} alt="" width={160} height={120} /><Image src={product.image} alt="" width={160} height={120} /></div>
                </div>
                <div className={styles.info}>
                    <span className="eyebrow">{product.category}</span>
                    <h1>{product.name}</h1>
                    <p>{product.description}</p>
                    <div className={styles.rating}><Star size={18} fill="currentColor" /> {product.rating} · 128 reviews · 42 questions</div>
                    <div className={styles.price}><strong>₹{product.price}</strong><del>₹{product.mrp}</del><span>Save ₹{product.mrp - product.price}</span></div>
                    <div className={styles.weights}>{["250g", "500g", "1kg"].map((weight) => <button key={weight}>{weight}</button>)}</div>
                    <div className={styles.offer}><CheckCircle2 size={18} /> Extra 10% off with UHTWELCOME · Free delivery above ₹999</div>
                    <div className={styles.actions}><button className="button"><ShoppingBag size={18} /> Add to cart</button><button className="button secondary"><Heart size={18} /> Wishlist</button></div>
                </div>
            </div>
            <div className={styles.tabs}>
                {["Ingredients", "Nutrition", "Shelf life", "Storage", "How it is made"].map((label) => <article className="card" key={label}><h2>{label}</h2><p>{label === "Ingredients" ? product.ingredients.join(", ") : label === "Nutrition" ? product.nutrition : label === "Shelf life" ? product.shelfLife : label === "Storage" ? product.storage : product.process}</p></article>)}
            </div>
            <div className={styles.qa}>
                <h2>Reviews and Questions</h2>
                <article><MessageSquare size={20} /> Is it very spicy? Medium-high Andhra heat, balanced by oil maturation.</article>
            </div>
            <h2 className={styles.relatedTitle}>Frequently bought together</h2>
            <div className="grid">{products.filter((entry) => entry.slug !== product.slug).slice(0, 3).map((entry) => <ProductCard key={entry.slug} product={entry} />)}</div>
        </section>
    );
}
