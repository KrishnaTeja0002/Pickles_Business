import { Heart, Search, ShoppingBag, UserRound } from "lucide-react";
import Link from "next/link";
import styles from "./Header.module.scss";

const links = [
  ["Shop", "/shop"],
  ["Categories", "/categories"],
  ["About", "/about"],
  ["Blog", "/blog"],
  ["Contact", "/contact"]
];

export function Header() {
  return (
    <header className={styles.header}>
      <Link href="/" className={styles.brand} aria-label="Ur Home Taste home">
        <span>Ur</span> Home Taste
      </Link>
      <nav className={styles.nav} aria-label="Primary navigation">
        {links.map(([label, href]) => (
          <Link key={href} href={href}>{label}</Link>
        ))}
      </nav>
      <div className={styles.actions}>
        <Link href="/shop" aria-label="Search"><Search size={19} /></Link>
        <Link href="/account" aria-label="Wishlist"><Heart size={19} /></Link>
        <Link href="/account" aria-label="Account"><UserRound size={19} /></Link>
        <Link href="/cart" aria-label="Cart" className={styles.cart}><ShoppingBag size={19} /></Link>
      </div>
    </header>
  );
}
