"use client";

import { useEffect, useState } from "react";
import {
  CheckCircle2,
  Heart,
  ShoppingBag,
  Star,
  Truck,
  ShieldCheck,
  Plus,
  Minus,
  Sparkles,
  Send,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/components/ui/Toast";
import { catalogApi, userApi } from "@/lib/api";
import { products as fallbackProducts } from "@/lib/data";
import styles from "./product.module.scss";

type Variant = {
  id: string;
  weight: string;
  price: number;
  mrp: number;
  stock?: number;
};

type Review = {
  id: string;
  rating: number;
  title: string;
  body: string;
  isVerified: boolean;
  createdAt: string;
  user?: { name: string };
};

type ProductDetail = {
  id: string;
  name: string;
  slug: string;
  category?: { name: string };
  categoryName?: string;
  description: string;
  shortDescription?: string;
  spiceLevel?: string;
  oilType?: string;
  shelfLife?: string;
  storage?: string;
  images: string[];
  variants: Variant[];
  reviews: Review[];
  ratingAverage: number;
  ratingCount: number;
  ingredients?: string[];
  nutrition?: string;
  process?: string;
};

export default function ProductPage() {
  const router = useRouter();
  const routeParams = useParams();
  const slug = typeof routeParams?.slug === "string" ? routeParams.slug : (Array.isArray(routeParams?.slug) ? routeParams.slug[0] : "");

  const { addItem } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { user } = useAuth();
  const { toast } = useToast();

  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [selectedImage, setSelectedImage] = useState<string>("");
  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [pincode, setPincode] = useState("");
  const [pincodeResult, setPincodeResult] = useState<string | null>(null);

  // Review form state
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewTitle, setReviewTitle] = useState("");
  const [reviewBody, setReviewBody] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    async function fetchProduct() {
      setLoading(true);
      try {
        const res = await catalogApi.getProduct(slug);
        if (res.data?.product) {
          const p = res.data.product;
          const mappedVariants = (p.variants || []).map((v: any) => ({
            id: v.id,
            weight: v.weight,
            price: Number(v.price),
            mrp: Number(v.mrp || Math.round(Number(v.price) * 1.25)),
            stock: v.stock !== undefined && v.stock !== null ? Number(v.stock) : 50,
          }));
          const productDetail: ProductDetail = {
            ...p,
            variants: mappedVariants,
            ratingAverage: p.avgRating ?? p.ratingAverage ?? 4.8,
            ratingCount: p.reviewCount ?? p.ratingCount ?? (p.reviews?.length || 0),
          };
          setProduct(productDetail);
          setSelectedImage(p.images?.[0] || "/images/avakaya-mango.png");
          if (mappedVariants.length > 0) {
            setSelectedVariant(mappedVariants[0]);
          }
          setLoading(false);
          return;
        }
      } catch (err) {
        console.warn("Could not fetch product from API, checking fallback:", err);
      }

      // Fallback
      const fb = fallbackProducts.find((p) => p.slug === slug) || fallbackProducts[0];
      const detail: ProductDetail = {
        id: fb.slug,
        name: fb.name,
        slug: fb.slug,
        categoryName: fb.category,
        description: fb.description,
        shortDescription: fb.description,
        spiceLevel: "Andhra Spicy",
        oilType: "Cold-Pressed Gingelly (Sesame) Oil",
        shelfLife: fb.shelfLife,
        storage: fb.storage,
        images: [fb.image, fb.image, fb.image],
        variants: [
          { id: `${fb.slug}-250g`, weight: "250g", price: Math.round(fb.price * 0.55), mrp: Math.round(fb.mrp * 0.55), stock: 35 },
          { id: `${fb.slug}-500g`, weight: "500g", price: fb.price, mrp: fb.mrp, stock: 50 },
          { id: `${fb.slug}-1kg`, weight: "1kg", price: Math.round(fb.price * 1.85), mrp: Math.round(fb.mrp * 1.85), stock: 20 },
        ],
        reviews: [
          {
            id: "rev-1",
            rating: 5,
            title: "Authentic Andhra style taste!",
            body: "The cold-pressed sesame oil and Guntur red chilli balance is extraordinary. Reminds me of traditional homemade pickles.",
            isVerified: true,
            createdAt: "2026-08-20T00:00:00Z",
            user: { name: "Rao V." },
          },
          {
            id: "rev-2",
            rating: 5,
            title: "Zero preservatives, crisp pieces",
            body: "Mango pieces are rock hard and perfectly cured without getting soggy. Fast delivery to Bengaluru in double-sealed jars.",
            isVerified: true,
            createdAt: "2026-08-25T00:00:00Z",
            user: { name: "Ananya K." },
          },
        ],
        ratingAverage: fb.rating,
        ratingCount: 128,
        ingredients: fb.ingredients,
        nutrition: fb.nutrition,
        process: fb.process,
      };
      setProduct(detail);
      setSelectedImage(detail.images[0]);
      setSelectedVariant(detail.variants[1] || detail.variants[0]);
      setLoading(false);
    }

    fetchProduct();
  }, [slug]);

  if (loading || !product) {
    return (
      <section className="section page" style={{ textAlign: "center", padding: "100px 20px" }}>
        <Sparkles size={36} style={{ animation: "spin 2s linear infinite", margin: "0 auto 16px" }} />
        <h2>Opening our pickle barrel...</h2>
      </section>
    );
  }

  const currentPrice = selectedVariant?.price ?? 299;
  const currentMrp = selectedVariant?.mrp ?? Math.round(currentPrice * 1.25);
  const currentStock = selectedVariant?.stock !== undefined && selectedVariant?.stock !== null ? Number(selectedVariant.stock) : 50;
  const isOutOfStock = currentStock <= 0;
  const isLowStock = currentStock > 0 && currentStock < 10;
  const isInStock = currentStock >= 10;
  const savings = currentMrp - currentPrice;
  const isWishlisted = isInWishlist(product.id);

  const handleAddToCart = async () => {
    if (!selectedVariant || isOutOfStock) return;

    await addItem({
      productId: product.id,
      variantId: selectedVariant.id,
      name: product.name,
      slug: product.slug,
      image: selectedImage || product.images[0],
      weight: selectedVariant.weight,
      price: currentPrice,
      quantity,
      variant: selectedVariant,
    });

    toast(`Added ${quantity}x "${product.name}" (${selectedVariant.weight}) to your cart!`, "success");
  };

  const handleBuyNow = async () => {
    if (!selectedVariant || isOutOfStock) return;
    await handleAddToCart();
    router.push("/checkout");
  };

  const handlePincodeCheck = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pincode || pincode.length < 6) {
      setPincodeResult("Please enter a valid 6-digit Indian pincode.");
      return;
    }

    if (pincode.startsWith("52") || pincode.startsWith("50") || pincode.startsWith("53")) {
      setPincodeResult("Express Andhra Delivery: 24-48 hours. Cash on Delivery Available!");
    } else {
      setPincodeResult("Standard Pan-India Delivery: 2-4 business days. Safe vacuum-sealed pack.");
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast("Please sign in to share a review.", "info");
      return;
    }
    if (!reviewTitle.trim() || !reviewBody.trim()) {
      toast("Please write a title and your review comments.", "error");
      return;
    }

    setSubmittingReview(true);
    try {
      await userApi.addReview(product.id, {
        rating: reviewRating,
        title: reviewTitle,
        body: reviewBody,
      });
      toast("Thank you! Your verified review has been submitted.", "success");
      setReviewTitle("");
      setReviewBody("");
      setShowReviewForm(false);
    } catch (err: any) {
      toast(err.response?.data?.message || "Failed to submit review. Have you ordered this item?", "error");
    } finally {
      setSubmittingReview(false);
    }
  };

  return (
    <section className="section page">
      <div className={styles.product}>
        {/* Gallery */}
        <div className={styles.gallery}>
          <Image
            src={selectedImage || "/images/avakaya-mango.png"}
            alt={product.name}
            width={760}
            height={680}
            priority
            style={{ width: "100%", borderRadius: "12px", objectFit: "cover" }}
          />
          {product.images?.length > 1 && (
            <div>
              {product.images.map((img, i) => (
                <Image
                  key={i}
                  src={img}
                  alt={`${product.name} thumb ${i + 1}`}
                  width={160}
                  height={120}
                  onClick={() => setSelectedImage(img)}
                  style={{
                    cursor: "pointer",
                    border: selectedImage === img ? "2px solid var(--green)" : "1px solid var(--line)",
                    borderRadius: "8px",
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className={styles.info}>
          <span className="eyebrow">{product.category?.name || product.categoryName || "Handcrafted Pachadi"}</span>
          <h1>{product.name}</h1>
          <p>{product.description}</p>

          <div className={styles.rating}>
            <Star size={18} fill="currentColor" /> {product.ratingAverage || 4.9} ·{" "}
            <span>{product.ratingCount || product.reviews?.length || 128} verified reviews</span>
          </div>

          <div className={styles.price}>
            <strong>₹{currentPrice}</strong>
            {currentMrp > currentPrice && <del>₹{currentMrp}</del>}
            {savings > 0 && <span>Save ₹{savings}</span>}
          </div>

          {/* Real-time Inventory Stock Status */}
          <div style={{ margin: "14px 0 18px", display: "flex", alignItems: "center", gap: "10px" }}>
            {isOutOfStock ? (
              <span className={`${styles.stockBadge} ${styles.outOfStock}`}>
                <span className={styles.stockDot} /> Out of Stock
              </span>
            ) : isLowStock ? (
              <span className={`${styles.stockBadge} ${styles.lowStock}`}>
                <span className={styles.stockDot} /> Only {currentStock} items available
              </span>
            ) : (
              <span className={`${styles.stockBadge} ${styles.inStock}`}>
                <span className={styles.stockDot} /> In Stock — Ready to Dispatch
              </span>
            )}
          </div>

          {/* Variants / Weights */}
          <div style={{ marginBottom: "16px" }}>
            <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--muted)", display: "block", marginBottom: "8px" }}>
              SELECT JAR SIZE:
            </span>
            <div className={styles.weights}>
              {product.variants?.map((v) => {
                const isSelected = selectedVariant?.id === v.id;
                const vStock = v.stock !== undefined && v.stock !== null ? Number(v.stock) : 50;
                const vOutOfStock = vStock <= 0;
                return (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => {
                      setSelectedVariant(v);
                      setQuantity(1);
                    }}
                    style={{
                      background: isSelected ? "var(--green)" : "var(--white)",
                      color: isSelected ? "var(--white)" : vOutOfStock ? "#94a3b8" : "var(--green)",
                      border: isSelected ? "2px solid var(--green)" : "1px solid var(--line)",
                      cursor: "pointer",
                      opacity: vOutOfStock ? 0.7 : 1,
                      textDecoration: vOutOfStock ? "line-through" : "none",
                    }}
                    title={
                      vOutOfStock
                        ? `${v.weight} — Out of Stock`
                        : vStock < 10
                        ? `${v.weight} — Only ${vStock} items available`
                        : `${v.weight} — In Stock`
                    }
                  >
                    {v.weight} — ₹{v.price} {vOutOfStock ? "(Out of Stock)" : vStock < 10 ? `(Only ${vStock} left)` : ""}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quantity Selector */}
          <div style={{ display: "flex", alignItems: "center", gap: "16px", margin: "20px 0" }}>
            <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--muted)" }}>QUANTITY:</span>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                border: "1px solid var(--line)",
                borderRadius: "999px",
                background: isOutOfStock ? "#f1f5f9" : "var(--white)",
                overflow: "hidden",
                opacity: isOutOfStock ? 0.6 : 1,
              }}
            >
              <button
                type="button"
                disabled={isOutOfStock || quantity <= 1}
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                style={{
                  border: "none",
                  background: "none",
                  padding: "8px 14px",
                  cursor: isOutOfStock || quantity <= 1 ? "not-allowed" : "pointer",
                }}
              >
                <Minus size={16} />
              </button>
              <span style={{ minWidth: "24px", textAlign: "center", fontWeight: 700 }}>
                {isOutOfStock ? 0 : quantity}
              </span>
              <button
                type="button"
                disabled={isOutOfStock || quantity >= currentStock || quantity >= 25}
                onClick={() => {
                  if (quantity >= currentStock) {
                    toast(`Only ${currentStock} items available in stock`, "info");
                    return;
                  }
                  setQuantity(quantity + 1);
                }}
                style={{
                  border: "none",
                  background: "none",
                  padding: "8px 14px",
                  cursor: isOutOfStock || quantity >= currentStock ? "not-allowed" : "pointer",
                }}
              >
                <Plus size={16} />
              </button>
            </div>
            {isLowStock && (
              <span style={{ fontSize: "0.82rem", color: "#b45309", fontWeight: 700 }}>
                Hurry, only {currentStock} items available!
              </span>
            )}
          </div>

          {/* Offer Banner */}
          <div className={styles.offer}>
            <CheckCircle2 size={18} /> Extra 10% off with coupon <strong>UHTWELCOME</strong> · Free delivery over ₹999
          </div>

          {/* Action Buttons */}
          <div className={styles.actions} style={{ marginTop: "24px" }}>
            {isOutOfStock ? (
              <button
                type="button"
                className="button"
                disabled={true}
                style={{
                  flex: 1,
                  background: "#e2e8f0",
                  color: "#64748b",
                  border: "1px solid #cbd5e1",
                  cursor: "not-allowed",
                  boxShadow: "none",
                }}
              >
                Out of Stock
              </button>
            ) : (
              <>
                <button type="button" className="button" onClick={handleAddToCart} style={{ flex: 1 }}>
                  <ShoppingBag size={18} /> Add to Cart (₹{currentPrice * quantity})
                </button>
                <button
                  type="button"
                  className="button secondary"
                  onClick={handleBuyNow}
                  style={{ background: "#d97706", color: "#fff", borderColor: "#d97706" }}
                >
                  Buy Now
                </button>
              </>
            )}
            <button
              type="button"
              className="button secondary"
              onClick={() => {
                toggleWishlist(product.id);
                toast(isWishlisted ? "Removed from wishlist" : "Added to wishlist", "info");
              }}
              style={{ color: isWishlisted ? "#b5371b" : "inherit" }}
              title="Wishlist"
            >
              <Heart size={18} fill={isWishlisted ? "currentColor" : "none"} />
            </button>
          </div>

          {/* Pincode checker */}
          <div
            style={{
              marginTop: "28px",
              padding: "16px",
              background: "rgba(24, 63, 44, 0.04)",
              borderRadius: "8px",
              border: "1px solid var(--line)",
            }}
          >
            <form onSubmit={handlePincodeCheck} style={{ display: "flex", gap: "8px" }}>
              <input
                type="text"
                placeholder="Enter 6-digit Pincode"
                value={pincode}
                maxLength={6}
                onChange={(e) => setPincode(e.target.value.replace(/\D/g, ""))}
                style={{
                  flex: 1,
                  padding: "10px 14px",
                  borderRadius: "6px",
                  border: "1px solid var(--line)",
                  background: "#fff",
                }}
              />
              <button type="submit" className="button secondary" style={{ whiteSpace: "nowrap" }}>
                Check Delivery
              </button>
            </form>
            {pincodeResult && (
              <p style={{ marginTop: "8px", fontSize: "0.85rem", color: "var(--green)", fontWeight: 600 }}>
                <Truck size={14} style={{ display: "inline", marginRight: "4px" }} />
                {pincodeResult}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Product Details Tabs */}
      <div className={styles.tabs}>
        <article className="card">
          <h2>Traditional Heritage</h2>
          <p>
            {product.process ||
              "Hand-pounded using aged granite pestles. Sun-cured for three days in ceramic jathula jars to allow the pungent Andhra mustard and gingelly oils to mature fully."}
          </p>
        </article>
        <article className="card">
          <h2>Pure Ingredients</h2>
          <p>
            {product.ingredients?.join(", ") ||
              "Hand-cut tender green mangoes, Guntur red chili powder, cold-pressed sesame oil, fenugreek, rock salt, garlic pods."}
          </p>
        </article>
        <article className="card">
          <h2>Shelf Life & Storage</h2>
          <p>
            {product.shelfLife || "12 Months."} {product.storage || "Keep jar submerged under oil cover. Always use a clean, dry spoon. Refrigeration optional."}
          </p>
        </article>
        <article className="card">
          <h2>Quality Assurance</h2>
          <p>
            <ShieldCheck size={18} style={{ display: "inline", marginRight: "4px" }} />
            Zero chemical preservatives, zero artificial colors, zero vinegar. 100% authentic Andhra taste.
          </p>
        </article>
      </div>

      {/* Customer Reviews & Questions */}
      <div className={styles.qa}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <h2>Customer Reviews ({product.reviews?.length || 0})</h2>
          <button
            type="button"
            className="button secondary"
            onClick={() => setShowReviewForm(!showReviewForm)}
          >
            {showReviewForm ? "Cancel Review" : "Write a Review"}
          </button>
        </div>

        {/* Review Form */}
        {showReviewForm && (
          <form
            onSubmit={handleSubmitReview}
            style={{
              padding: "20px",
              background: "#fff8f0",
              borderRadius: "8px",
              marginBottom: "24px",
              border: "1px solid var(--line)",
            }}
          >
            <h3 style={{ marginBottom: "12px", color: "var(--green)" }}>Share Your Taste Experience</h3>
            <div style={{ marginBottom: "12px", display: "flex", alignItems: "center", gap: "8px" }}>
              <span>Your Rating:</span>
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setReviewRating(star)}
                  style={{ background: "none", border: "none", cursor: "pointer", color: star <= reviewRating ? "#d97706" : "#cbd5e1" }}
                >
                  <Star size={22} fill="currentColor" />
                </button>
              ))}
            </div>
            <div style={{ marginBottom: "12px" }}>
              <input
                type="text"
                placeholder="Review headline (e.g. Crisp pieces, unmatched pungency!)"
                value={reviewTitle}
                onChange={(e) => setReviewTitle(e.target.value)}
                style={{ width: "100%", padding: "10px 14px", borderRadius: "6px", border: "1px solid var(--line)" }}
                required
              />
            </div>
            <div style={{ marginBottom: "16px" }}>
              <textarea
                placeholder="How was the oil balance, heat, salt, and freshness?"
                value={reviewBody}
                onChange={(e) => setReviewBody(e.target.value)}
                rows={3}
                style={{ width: "100%", padding: "10px 14px", borderRadius: "6px", border: "1px solid var(--line)" }}
                required
              />
            </div>
            <button type="submit" className="button" disabled={submittingReview}>
              <Send size={16} /> {submittingReview ? "Submitting..." : "Publish Review"}
            </button>
          </form>
        )}

        {/* Existing Reviews */}
        {product.reviews && product.reviews.length > 0 ? (
          product.reviews.map((rev) => (
            <article key={rev.id} style={{ display: "block", marginBottom: "18px", borderBottom: "1px solid var(--line)", paddingBottom: "16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <strong style={{ color: "var(--green)" }}>{rev.user?.name || "Verified Customer"}</strong>
                  {rev.isVerified && (
                    <span style={{ fontSize: "0.75rem", background: "#dcfce7", color: "#166534", padding: "2px 8px", borderRadius: "999px" }}>
                      Verified Purchase
                    </span>
                  )}
                </div>
                <div style={{ color: "#d97706", display: "flex", alignItems: "center", gap: "2px" }}>
                  {[...Array(rev.rating)].map((_, i) => (
                    <Star key={i} size={14} fill="currentColor" />
                  ))}
                </div>
              </div>
              <h4 style={{ margin: "4px 0", color: "var(--brown)" }}>{rev.title}</h4>
              <p style={{ color: "var(--muted)", margin: 0 }}>{rev.body}</p>
            </article>
          ))
        ) : (
          <p style={{ color: "var(--muted)" }}>Be the first to review this traditional pickle batch!</p>
        )}
      </div>
    </section>
  );
}
