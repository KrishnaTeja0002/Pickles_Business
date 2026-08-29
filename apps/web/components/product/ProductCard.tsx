import { Heart, ShoppingBag, Star } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import styles from "./ProductCard.module.scss";

type Product = {
  name: string;
  slug: string;
  category: string;
  price: number;
  mrp: number;
  rating: number;
  image: string;
  tag: string;
};

export function ProductCard({ product }: { product: Product }) {
  return (
    <article className={styles.card}>
      <Link href={`/product/${product.slug}`} className={styles.imageWrap}>
        <Image src={product.image} alt={product.name} width={520} height={430} />
        <span>{product.tag}</span>
      </Link>
      <div className={styles.body}>
        <p>{product.category}</p>
        <Link href={`/product/${product.slug}`}><h3>{product.name}</h3></Link>
        <div className={styles.rating}><Star size={16} fill="currentColor" /> {product.rating}</div>
        <div className={styles.price}>
          <strong>₹{product.price}</strong>
          <del>₹{product.mrp}</del>
        </div>
        <div className={styles.actions}>
          <button aria-label={`Add ${product.name} to wishlist`}><Heart size={18} /></button>
          <button aria-label={`Add ${product.name} to cart`}><ShoppingBag size={18} /> Add</button>
        </div>
      </div>
    </article>
  );
}
