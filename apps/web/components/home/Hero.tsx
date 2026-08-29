"use client";

import { motion } from "framer-motion";
import { ArrowRight, MapPin } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import styles from "./Hero.module.scss";

export function Hero() {
  return (
    <section className={styles.hero}>
      <Image
        src="https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=1800&q=80"
        alt="Traditional Indian spices and pickle ingredients"
        fill
        priority
      />
      <div className={styles.overlay} />
      <motion.div className={styles.content} initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.65 }}>
        <span className="eyebrow">From Our Home to Yours</span>
        <h1>Ur Home Taste</h1>
        <p>Premium homemade Indian pickles made in small batches with seasonal produce, family recipes, and a serious respect for spice.</p>
        <div className={styles.actions}>
          <Link className="button" href="/shop">Shop pickles <ArrowRight size={18} /></Link>
          <Link className="button secondary" href="/track-order"><MapPin size={18} /> Track order</Link>
        </div>
      </motion.div>
    </section>
  );
}
