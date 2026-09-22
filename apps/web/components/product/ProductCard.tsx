"use client";

import { useState, useEffect } from "react";
import { Heart, ShoppingBag, Star, Plus, Minus } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import { useToast } from "@/components/ui/Toast";
import styles from "./ProductCard.module.scss";

export type ProductCardData = {
  id?: string;
  name: string;
  slug: string;
  category?: string;
  price: number;
  mrp?: number;
  rating?: number;
  image?: string;
  tag?: string;
  spiceLevel?: string;
  variants?: Array<{
    id: string;
    weight: string;
    price: number;
    mrp: number;
    stock?: number;
  }>;
};

export function ProductCard({
  product,
  selectedWeightFilter,
  stockFilter,
}: {
  product: ProductCardData;
  selectedWeightFilter?: string;
  stockFilter?: string;
}) {
  const { items, addItem, updateQuantity, removeItem } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { toast } = useToast();

  const isFavorited = product.id ? isInWishlist(product.id) : false;
  const displayImage = product.image || "/images/avakaya-mango.png";
  const displayRating = product.rating ?? 4.8;
  const tag = product.tag;

  // Determine active variants & dynamic price
  const variants = product.variants && product.variants.length > 0
    ? product.variants.map((v) => ({
        ...v,
        price: Number(v.price),
        mrp: Number(v.mrp || Math.round(Number(v.price) * 1.25)),
        stock: v.stock !== undefined && v.stock !== null ? Number(v.stock) : 50,
      }))
    : [
        { id: `${product.slug}-250g`, weight: "250g", price: Math.round(Number(product.price) * 0.55), mrp: Math.round((Number(product.mrp) || Number(product.price) * 1.25) * 0.55), stock: 50 },
        { id: `${product.slug}-500g`, weight: "500g", price: Number(product.price), mrp: Number(product.mrp) || Math.round(Number(product.price) * 1.25), stock: 50 },
        { id: `${product.slug}-1kg`, weight: "1kg", price: Math.round(Number(product.price) * 1.85), mrp: Math.round((Number(product.mrp) || Number(product.price) * 1.25) * 1.85), stock: 50 },
      ];

  const [selectedVariantIndex, setSelectedVariantIndex] = useState(0);
  const [isAdding, setIsAdding] = useState(false);

  // Auto-switch variant when a weight filter or stock condition filter is selected on the shop page
  useEffect(() => {
    if (selectedWeightFilter && selectedWeightFilter !== "all") {
      const idx = variants.findIndex(
        (v) => v.weight.toLowerCase() === selectedWeightFilter.toLowerCase()
      );
      if (idx >= 0) {
        setSelectedVariantIndex(idx);
        return;
      }
    }
    if (stockFilter === "low-stock") {
      const idx = variants.findIndex((v) => {
        const s = v.stock !== undefined && v.stock !== null ? Number(v.stock) : 50;
        return s > 0 && s < 10;
      });
      if (idx >= 0) setSelectedVariantIndex(idx);
    } else if (stockFilter === "out-of-stock") {
      const idx = variants.findIndex((v) => {
        const s = v.stock !== undefined && v.stock !== null ? Number(v.stock) : 50;
        return s <= 0;
      });
      if (idx >= 0) setSelectedVariantIndex(idx);
    }
  }, [selectedWeightFilter, stockFilter, variants]);

  const activeVariant = variants[selectedVariantIndex] || variants[0];
  const unitPrice = Number(activeVariant.price) || 0;
  const unitMrp = Number(activeVariant.mrp) || Math.round(unitPrice * 1.25);
  const currentStock = activeVariant.stock !== undefined && activeVariant.stock !== null ? Number(activeVariant.stock) : 50;
  const isOutOfStock = currentStock <= 0;
  const isLowStock = currentStock > 0 && currentStock < 10;
  const isInStock = currentStock >= 10;

  // Check if this specific jar variant is currently in the cart
  const cartItem = items.find(
    (i) =>
      i.variantId === activeVariant.id ||
      (i.productId === (product.id || product.slug) && i.weight === activeVariant.weight)
  );
  const quantityInCart = cartItem ? cartItem.quantity : 0;

  // Dynamic price based on quantity in cart (or unit price if not yet in cart)
  const displayPrice = quantityInCart > 1 ? unitPrice * quantityInCart : unitPrice;
  const displayMrp = quantityInCart > 1 ? unitMrp * quantityInCart : unitMrp;

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isOutOfStock) return;

    setIsAdding(true);
    await addItem({
      productId: product.id || product.slug,
      variantId: activeVariant.id,
      name: product.name,
      slug: product.slug,
      image: displayImage,
      weight: activeVariant.weight,
      price: unitPrice,
      quantity: 1,
      variant: activeVariant,
    });
    setIsAdding(false);
    toast(`Added "${product.name}" (${activeVariant.weight}) to bag!`, "success");
  };

  const handleIncrementInCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (quantityInCart >= currentStock || quantityInCart >= 25) {
      toast(`Only ${currentStock} items available in stock`, "info");
      return;
    }
    await updateQuantity(activeVariant.id, quantityInCart + 1);
  };

  const handleDecrementInCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (quantityInCart <= 1) {
      await removeItem(activeVariant.id);
      toast(`Removed "${product.name}" (${activeVariant.weight}) from bag`, "info");
    } else {
      await updateQuantity(activeVariant.id, quantityInCart - 1);
    }
  };

  const handleToggleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!product.id) {
      toast("Please sign in to save items to your wishlist.", "info");
      return;
    }

    try {
      await toggleWishlist(product.id);
      toast(
        isFavorited ? `Removed "${product.name}" from wishlist` : `Added "${product.name}" to wishlist`,
        "info"
      );
    } catch {
      toast("Sign in to save items to wishlist", "info");
    }
  };

  return (
    <article className={styles.card}>
      <Link href={`/product/${product.slug}`} className={styles.imageWrap}>
        <Image src={displayImage} alt={product.name} width={520} height={430} />
        {tag && <span className={styles.tagBadge}>{tag}</span>}
      </Link>
      <div className={styles.body}>
        <p>{product.category || "Traditional Pachadi"}</p>
        <Link href={`/product/${product.slug}`}>
          <h3>{product.name}</h3>
        </Link>

        <div className={styles.rating}>
          <Star size={15} fill="currentColor" /> {displayRating}
        </div>

        {/* Real-time Inventory Stock Status */}
        <div className={styles.stockStatus}>
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
              <span className={styles.stockDot} /> In Stock
            </span>
          )}
        </div>

        {/* Weight Variant Selector */}
        {variants.length > 1 && (
          <div className={styles.weightSelector} onClick={(e) => e.stopPropagation()}>
            {variants.map((v, idx) => {
              const vStock = v.stock !== undefined && v.stock !== null ? Number(v.stock) : 50;
              const vOutOfStock = vStock <= 0;
              const vLowStock = vStock > 0 && vStock < 10;
              return (
                <button
                  key={v.id || v.weight}
                  type="button"
                  className={`${idx === selectedVariantIndex ? styles.active : ""} ${vOutOfStock ? styles.variantOutOfStock : ""} ${vLowStock ? styles.variantLowStock : ""}`}
                  onClick={() => setSelectedVariantIndex(idx)}
                  title={
                    vOutOfStock
                      ? `${v.weight} — Out of Stock`
                      : vLowStock
                      ? `${v.weight} — Only ${vStock} items available`
                      : `${v.weight} — In Stock`
                  }
                >
                  {v.weight}
                  {vOutOfStock && <span className={styles.soldOutBadge}>Sold Out</span>}
                  {vLowStock && <span className={styles.lowStockBadge}>Only {vStock} left</span>}
                </button>
              );
            })}
          </div>
        )}

        {/* Dynamic Price Display */}
        <div className={styles.priceRow}>
          <div className={styles.price}>
            <strong>₹{displayPrice}</strong>
            {displayMrp > displayPrice && <del>₹{displayMrp}</del>}
          </div>
          {quantityInCart > 1 && (
            <span className={styles.unitDetail}>
              (₹{unitPrice} × {quantityInCart})
            </span>
          )}
        </div>

        {/* Action Controls: Shows 'Out of Stock', 'Add to Bag', or stepper when in cart */}
        <div className={styles.actions}>
          <button
            type="button"
            onClick={handleToggleWishlist}
            aria-label={`Toggle ${product.name} in wishlist`}
            style={{ color: isFavorited ? "#b5371b" : "inherit" }}
          >
            <Heart size={18} fill={isFavorited ? "currentColor" : "none"} />
          </button>

          {isOutOfStock ? (
            <button
              type="button"
              className={`${styles.addBtn} ${styles.disabledBtn}`}
              disabled={true}
              aria-label={`${product.name} (${activeVariant.weight}) is out of stock`}
            >
              Out of Stock
            </button>
          ) : quantityInCart === 0 ? (
            <button
              type="button"
              onClick={handleAddToCart}
              className={styles.addBtn}
              aria-label={`Add ${product.name} to bag`}
              disabled={isAdding}
            >
              <ShoppingBag size={17} /> Add to Bag
            </button>
          ) : (
            <div className={styles.cartStepper} onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                onClick={handleDecrementInCart}
                aria-label="Decrease quantity in bag"
                title="Decrease quantity"
              >
                <Minus size={14} />
              </button>
              <span className={styles.cartCount}>
                <strong>{quantityInCart}</strong> in Bag
              </span>
              <button
                type="button"
                onClick={handleIncrementInCart}
                disabled={quantityInCart >= currentStock || quantityInCart >= 25}
                aria-label="Increase quantity in bag"
                title={
                  quantityInCart >= currentStock
                    ? `Only ${currentStock} items available in stock`
                    : "Increase quantity"
                }
              >
                <Plus size={14} />
              </button>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
