"use client";

import { useState } from "react";
import Link from "next/link";
import { contentApi } from "@/lib/api";
import { useToast } from "@/components/ui/Toast";
import styles from "./Footer.module.scss";

export function Footer() {
  const [email, setEmail] = useState("");
  const [subscribing, setSubscribing] = useState(false);
  const { toast } = useToast();

  const legal = [
    "privacy-policy",
    "shipping-policy",
    "refund-policy",
    "terms-and-conditions",
    "return-policy",
    "cookie-policy",
  ];

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes("@")) {
      toast("Please enter a valid email address.", "error");
      return;
    }

    setSubscribing(true);
    try {
      await contentApi.subscribeNewsletter(email.trim(), "footer");
      toast("Subscribed! You'll receive early access to new seasonal pickle batches.", "success");
      setEmail("");
    } catch (err: any) {
      toast(err.response?.data?.message || "Thank you for subscribing!", "info");
      setEmail("");
    } finally {
      setSubscribing(false);
    }
  };

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
        {legal.map((slug) => (
          <Link key={slug} href={`/legal/${slug}`}>
            {slug.replaceAll("-", " ")}
          </Link>
        ))}
      </div>
      <div>
        <h3>Newsletter</h3>
        <form className={styles.newsletter} onSubmit={handleSubscribe}>
          <input
            aria-label="Email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
          />
          <button type="submit" disabled={subscribing}>
            {subscribing ? "..." : "Join"}
          </button>
        </form>
        <p>Instagram · Facebook · YouTube · LinkedIn · WhatsApp</p>
      </div>
      <small>© {new Date().getFullYear()} Ur Home Taste. All rights reserved.</small>
    </footer>
  );
}
