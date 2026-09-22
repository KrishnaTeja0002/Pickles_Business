"use client";

import { Heart, Search, ShoppingBag, UserRound, Shield } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import styles from "./Header.module.scss";

const links = [
  ["Shop", "/shop"],
  ["Categories", "/categories"],
  ["About", "/about"],
  ["Blog", "/blog"],
  ["Contact", "/contact"],
  ["Track Order", "/track-order"],
];

export function Header() {
  const { user } = useAuth();
  const { itemCount } = useCart();
  const { items: wishlistItems } = useWishlist();

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
        <Link href="/shop" aria-label="Search">
          <Search size={19} />
        </Link>
        <Link href="/account" aria-label="Wishlist" style={{ position: "relative" }}>
          <Heart size={19} />
          {wishlistItems.length > 0 && (
            <span style={{
              position: "absolute",
              top: "-2px",
              right: "-2px",
              background: "#b5371b",
              color: "#fff",
              fontSize: "10px",
              fontWeight: "bold",
              borderRadius: "999px",
              width: "16px",
              height: "16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              lineHeight: 1
            }}>
              {wishlistItems.length}
            </span>
          )}
        </Link>
        <Link href="/account" aria-label="Account" title={user ? user.name : "Sign In"}>
          <UserRound size={19} />
        </Link>
        <Link href="/cart" aria-label="Cart" className={styles.cart} style={{ position: "relative" }}>
          <ShoppingBag size={19} />
          {itemCount > 0 && (
            <span style={{
              position: "absolute",
              top: "-2px",
              right: "-2px",
              background: "#d97706",
              color: "#fff",
              fontSize: "10px",
              fontWeight: "bold",
              borderRadius: "999px",
              width: "18px",
              height: "18px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              lineHeight: 1,
              border: "2px solid #fff"
            }}>
              {itemCount}
            </span>
          )}
        </Link>
      </div>
    </header>
  );
}
