import Link from "next/link";
import styles from "./Footer.module.scss";

export function Footer() {
  const legal = ["privacy-policy", "shipping-policy", "refund-policy", "terms-and-conditions", "return-policy", "cookie-policy"];
  return (
    <footer className={styles.footer}>
      <div>
        <h2>Ur Home Taste</h2>
        <p>From Our Home to Yours. Small-batch Indian pickles, packed fresh and shipped with care.</p>
      </div>
      <div>
        <h3>Company</h3>
        <Link href="/about">About</Link>
        <Link href="/contact">Contact</Link>
        <Link href="/blog">Blogs</Link>
        <Link href="/track-order">Track order</Link>
      </div>
      <div>
        <h3>Policies</h3>
        {legal.map((slug) => <Link key={slug} href={`/legal/${slug}`}>{slug.replaceAll("-", " ")}</Link>)}
      </div>
      <div>
        <h3>Newsletter</h3>
        <form className={styles.newsletter}>
          <input aria-label="Email" placeholder="you@example.com" />
          <button>Join</button>
        </form>
        <p>Instagram · Facebook · YouTube · LinkedIn · WhatsApp</p>
      </div>
      <small>© {new Date().getFullYear()} Ur Home Taste. All rights reserved.</small>
    </footer>
  );
}
