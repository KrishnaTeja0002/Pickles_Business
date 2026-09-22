"use client";

import { useState } from "react";
import {
  Gift,
  ShoppingBag,
  Ticket,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  ShieldCheck,
  Truck,
  Sparkles,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { PageHero } from "@/components/ui/PageHero";
import { useCart } from "@/context/CartContext";
import { useToast } from "@/components/ui/Toast";
import styles from "./commerce.module.scss";

export default function CartPage() {
  const {
    items,
    updateQuantity,
    removeItem,
    clearCart,
    coupon,
    applyCoupon,
    removeCoupon,
    quote,
  } = useCart();
  const { toast } = useToast();

  const [couponInput, setCouponInput] = useState("");
  const [giftWrap, setGiftWrap] = useState(false);
  const [applyingCoupon, setApplyingCoupon] = useState(false);

  // Fallback quote calculations if quote API is pending
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const discountAmount = coupon?.code === "UHTWELCOME" ? Math.round(subtotal * 0.1) : (coupon?.discount ?? 0);
  const giftWrapFee = giftWrap ? 49 : 0;
  const deliveryFee = subtotal >= 999 || subtotal === 0 ? 0 : 60;
  const taxableAmount = Math.max(0, subtotal - discountAmount);
  const tax = Math.round(taxableAmount * 0.05); // 5% GST
  const grandTotal = taxableAmount + tax + deliveryFee + giftWrapFee;

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponInput.trim()) return;

    setApplyingCoupon(true);
    try {
      const code = couponInput.trim().toUpperCase();
      if (code === "UHTWELCOME" || code === "ANDHRA50") {
        await applyCoupon(code);
        toast(`Coupon "${code}" applied successfully!`, "success");
        setCouponInput("");
      } else {
        await applyCoupon(code);
        toast(`Coupon "${code}" applied!`, "success");
        setCouponInput("");
      }
    } catch (err: any) {
      toast(err.message || "Invalid or expired coupon code", "error");
    } finally {
      setApplyingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    removeCoupon();
    toast("Coupon removed.", "info");
  };

  if (items.length === 0) {
    return (
      <>
        <PageHero
          eyebrow="Your Pickle Barrel"
          title="Your Cart is Empty"
          subtitle="You haven't added any authentic Andhra pickles to your basket yet."
        />
        <section className="section page" style={{ textAlign: "center", padding: "60px 20px" }}>
          <div
            style={{
              maxWidth: "460px",
              margin: "0 auto",
              padding: "40px 24px",
              background: "var(--white)",
              borderRadius: "12px",
              border: "1px dashed var(--line)",
            }}
          >
            <ShoppingBag size={48} style={{ color: "var(--muted)", margin: "0 auto 16px" }} />
            <h3 style={{ color: "var(--green)", marginBottom: "8px" }}>Craving homemade Avakaya?</h3>
            <p style={{ color: "var(--muted)", marginBottom: "24px" }}>
              Explore our small-batch pickles made with cold-pressed gingelly oil and traditional Andhra spice blends.
            </p>
            <Link href="/shop" className="button" style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
              <Sparkles size={16} /> Explore Pickles & Podulu
            </Link>
          </div>
        </section>
      </>
    );
  }

  const amountToFreeDelivery = Math.max(0, 999 - subtotal);

  return (
    <>
      <PageHero
        eyebrow="Shopping Cart"
        title="Review Your Jars"
        subtitle="Freshly hand-packed Andhra style handmade pickles. Vacuum-sealed for zero leakages."
      />

      <section className={`section page ${styles.twoCol}`}>
        {/* Cart Items List */}
        <div className={styles.panel}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--line)", paddingBottom: "12px" }}>
            <h2 style={{ fontSize: "1.2rem", margin: 0 }}>
              Items in Cart ({items.reduce((s, i) => s + i.quantity, 0)})
            </h2>
            <button
              type="button"
              onClick={clearCart}
              style={{
                background: "none",
                border: "none",
                color: "var(--muted)",
                fontSize: "0.85rem",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
              }}
            >
              <Trash2 size={14} /> Empty Cart
            </button>
          </div>

          {/* Free Shipping Notification */}
          <div
            style={{
              background: amountToFreeDelivery === 0 ? "rgba(24, 63, 44, 0.08)" : "#fff8e7",
              color: amountToFreeDelivery === 0 ? "var(--green)" : "#8a5300",
              padding: "10px 14px",
              borderRadius: "6px",
              fontSize: "0.88rem",
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <Truck size={18} />
            {amountToFreeDelivery === 0
              ? "Congratulations! You unlocked FREE Pan-India Shipping!"
              : `Add ₹${amountToFreeDelivery} more worth of pickles to get FREE Shipping!`}
          </div>

          {/* Items mapping */}
          <div style={{ display: "grid", gap: "16px" }}>
            {items.map((item) => (
              <article
                key={item.variantId}
                style={{
                  display: "grid",
                  gridTemplateColumns: "72px 1fr auto",
                  gap: "14px",
                  alignItems: "center",
                  paddingBottom: "16px",
                  borderBottom: "1px solid var(--line)",
                }}
              >
                <Image
                  src={item.image || "/images/avakaya-mango.png"}
                  alt={item.name}
                  width={72}
                  height={72}
                  style={{ borderRadius: "8px", objectFit: "cover" }}
                />
                <div>
                  <Link href={`/product/${item.slug || ""}`} style={{ color: "var(--green)", fontWeight: 700 }}>
                    <h3 style={{ margin: "0 0 4px", fontSize: "1rem" }}>{item.name}</h3>
                  </Link>
                  <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--muted)" }}>
                    Jar Size: <strong>{item.weight || "500g"}</strong> · ₹{item.price} each
                  </p>
                  <div style={{ marginTop: "8px", display: "inline-flex", alignItems: "center", border: "1px solid var(--line)", borderRadius: "999px" }}>
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.variantId, item.quantity - 1)}
                      style={{ border: "none", background: "none", padding: "4px 10px", cursor: "pointer" }}
                      aria-label="Decrease quantity"
                    >
                      <Minus size={14} />
                    </button>
                    <span style={{ fontSize: "0.85rem", fontWeight: 700, padding: "0 6px" }}>
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.variantId, item.quantity + 1)}
                      style={{ border: "none", background: "none", padding: "4px 10px", cursor: "pointer" }}
                      aria-label="Increase quantity"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <strong style={{ fontSize: "1.1rem", display: "block", color: "var(--brown)" }}>
                    ₹{item.price * item.quantity}
                  </strong>
                  <button
                    type="button"
                    onClick={() => {
                      removeItem(item.variantId);
                      toast(`Removed "${item.name}" from cart`, "info");
                    }}
                    style={{
                      background: "none",
                      border: "none",
                      color: "#b5371b",
                      cursor: "pointer",
                      padding: "4px",
                      marginTop: "6px",
                    }}
                    title="Remove item"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </article>
            ))}
          </div>

          {/* Gift wrap option */}
          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              padding: "12px 14px",
              background: "#fafaf8",
              borderRadius: "8px",
              cursor: "pointer",
              border: "1px solid var(--line)",
            }}
          >
            <input
              type="checkbox"
              checked={giftWrap}
              onChange={(e) => setGiftWrap(e.target.checked)}
            />
            <Gift size={18} style={{ color: "#d97706" }} />
            <span style={{ fontSize: "0.9rem" }}>
              Include Jute Gift Wrap & Personal Greeting Note (+ ₹49)
            </span>
          </label>
        </div>

        {/* Order Summary & Checkout */}
        <aside className={styles.panel}>
          <h2 style={{ fontSize: "1.2rem", borderBottom: "1px solid var(--line)", paddingBottom: "10px" }}>
            Order Summary
          </h2>

          {/* Coupon input form */}
          <form onSubmit={handleApplyCoupon} style={{ display: "flex", gap: "8px" }}>
            <div style={{ position: "relative", flex: 1 }}>
              <Ticket size={16} style={{ position: "absolute", left: "10px", top: "12px", color: "var(--muted)" }} />
              <input
                type="text"
                placeholder="Coupon code (e.g. UHTWELCOME)"
                value={couponInput}
                onChange={(e) => setCouponInput(e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px 10px 8px 34px",
                  borderRadius: "6px",
                  border: "1px solid var(--line)",
                  textTransform: "uppercase",
                  fontSize: "0.85rem",
                }}
              />
            </div>
            <button type="submit" className="button secondary" disabled={applyingCoupon} style={{ padding: "8px 16px" }}>
              {applyingCoupon ? "..." : "Apply"}
            </button>
          </form>

          {coupon && (
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                background: "#f0fdf4",
                border: "1px solid #86efac",
                padding: "8px 12px",
                borderRadius: "6px",
                fontSize: "0.85rem",
                color: "#166534",
              }}
            >
              <span>
                <strong>{coupon.code}</strong> applied (-₹{discountAmount})
              </span>
              <button
                type="button"
                onClick={handleRemoveCoupon}
                style={{ background: "none", border: "none", color: "#b5371b", cursor: "pointer", fontWeight: 700 }}
              >
                Remove
              </button>
            </div>
          )}

          {/* Price Breakdown */}
          <div style={{ display: "grid", gap: "8px", fontSize: "0.92rem", color: "var(--brown)" }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>Bag Subtotal</span>
              <strong>₹{subtotal}</strong>
            </div>

            {discountAmount > 0 && (
              <div style={{ display: "flex", justifyContent: "space-between", color: "#166534" }}>
                <span>Coupon Discount</span>
                <strong>-₹{discountAmount}</strong>
              </div>
            )}

            {giftWrap && (
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Gift Wrap</span>
                <strong>₹{giftWrapFee}</strong>
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>Estimated Shipping</span>
              <strong>{deliveryFee === 0 ? "FREE" : `₹${deliveryFee}`}</strong>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>Estimated GST (5%)</span>
              <strong>₹{tax}</strong>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                borderTop: "2px solid var(--line)",
                paddingTop: "12px",
                marginTop: "4px",
                fontSize: "1.2rem",
                color: "var(--green)",
              }}
            >
              <strong>Grand Total</strong>
              <strong>₹{grandTotal}</strong>
            </div>
          </div>

          <Link
            className="button"
            href="/checkout"
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: "8px",
              textAlign: "center",
              marginTop: "8px",
              padding: "14px",
              fontSize: "1rem",
            }}
          >
            Proceed to Checkout <ArrowRight size={18} />
          </Link>

          <div
            style={{
              borderTop: "1px solid var(--line)",
              paddingTop: "14px",
              marginTop: "8px",
              display: "grid",
              gap: "6px",
              fontSize: "0.8rem",
              color: "var(--muted)",
            }}
          >
            <p style={{ margin: 0, display: "flex", alignItems: "center", gap: "6px" }}>
              <ShieldCheck size={16} style={{ color: "var(--green)" }} />
              Guaranteed leakproof packaging with food-grade inner seals.
            </p>
            <p style={{ margin: 0, display: "flex", alignItems: "center", gap: "6px" }}>
              <Truck size={16} style={{ color: "var(--green)" }} />
              Ships within 24 hours of batch curing.
            </p>
          </div>
        </aside>
      </section>
    </>
  );
}
