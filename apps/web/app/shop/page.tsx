"use client";

import { useEffect, useState, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { SlidersHorizontal, Search, RotateCcw, Sparkles } from "lucide-react";
import { ProductCard, type ProductCardData } from "@/components/product/ProductCard";
import { PageHero } from "@/components/ui/PageHero";
import { catalogApi } from "@/lib/api";
import { products as fallbackProducts } from "@/lib/data";
import styles from "./shop.module.scss";

const defaultProducts: ProductCardData[] = fallbackProducts.map((p) => ({
  id: p.slug,
  name: p.name,
  slug: p.slug,
  category: p.category,
  price: p.price,
  mrp: p.mrp,
  rating: p.rating,
  image: p.image,
  tag: p.tag,
  spiceLevel:
    p.name.toLowerCase().includes("mutton") ||
    p.name.toLowerCase().includes("chicken") ||
    p.name.toLowerCase().includes("garlic")
      ? "Andhra Spicy"
      : "Medium",
  variants: [
    { id: `${p.slug}-250g`, weight: "250g", price: Math.round(p.price * 0.55), mrp: Math.round(p.mrp * 0.55), stock: 50 },
    { id: `${p.slug}-500g`, weight: "500g", price: p.price, mrp: p.mrp, stock: 50 },
    { id: `${p.slug}-1kg`, weight: "1kg", price: Math.round(p.price * 1.85), mrp: Math.round(p.mrp * 1.85), stock: 50 },
  ],
}));

const collections = [
  { id: "all", label: "All Pickles", description: "Complete handmade catalog" },
  { id: "all-time", label: "All-Time Classics", description: "Everyday authentic pickles (Avakaya, Gongura, Garlic, Lemon, Tomato, Ginger, Veg)" },
  { id: "seasonal", label: "Seasonal Specials", description: "Limited seasonal harvest batches (Amla / Usirikaya & Specials)" },
  { id: "non-veg", label: "Non-Veg Pickles", description: "Boneless Country Chicken & Spicy Mutton" },
  { id: "combos", label: "Combos & Gift Boxes", description: "Curated 3-Pack trios and 6-Pack gift boxes" },
];

const jarSizes = [
  { id: "all", label: "All Sizes" },
  { id: "250g", label: "250g (Small Jar)" },
  { id: "500g", label: "500g (Standard Jar)" },
  { id: "1kg", label: "1kg (Family Jar)" },
];

const stockConditions = [
  { id: "all", label: "All Items" },
  { id: "in-stock", label: "In Stock (10+ jars)" },
  { id: "low-stock", label: "Below 10 items (Low Stock) 🔥" },
  { id: "out-of-stock", label: "Out of Stock" },
];

function matchCollection(product: ProductCardData, collectionId: string): boolean {
  if (!collectionId || collectionId === "all") return true;

  const name = product.name.toLowerCase();
  const cat = (product.category || "").toLowerCase();
  const slug = product.slug.toLowerCase();
  const full = `${name} ${cat} ${slug}`;

  if (collectionId === "seasonal") {
    return (
      full.includes("amla") ||
      full.includes("usiri") ||
      full.includes("seasonal") ||
      full.includes("harvest") ||
      full.includes("magaya") ||
      full.includes("winter")
    );
  }

  if (collectionId === "non-veg") {
    return (
      full.includes("chicken") ||
      full.includes("mutton") ||
      full.includes("prawn") ||
      full.includes("fish") ||
      full.includes("non-veg")
    );
  }

  if (collectionId === "combos" || collectionId.includes("gift") || collectionId.includes("combo")) {
    return (
      full.includes("combo") ||
      full.includes("gift") ||
      full.includes("pack") ||
      full.includes("box") ||
      full.includes("trio")
    );
  }

  if (collectionId === "all-time") {
    // Everyday pickles (not seasonal, not combo/gift packs)
    const isSeasonal = matchCollection(product, "seasonal");
    const isCombo = matchCollection(product, "combos");
    return !isSeasonal && !isCombo;
  }

  // Exact or partial category match (e.g. from query param "Gift Packs" or "Mango Pickle")
  return (
    cat === collectionId.toLowerCase() ||
    cat.includes(collectionId.toLowerCase()) ||
    collectionId.toLowerCase().includes(cat) ||
    name.includes(collectionId.toLowerCase())
  );
}

function ShopContent() {
  const searchParams = useSearchParams();
  const initialCategory = searchParams.get("category") || "all";

  const [products, setProducts] = useState<ProductCardData[]>(defaultProducts);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory);
  const [selectedWeight, setSelectedWeight] = useState<string>("all");
  const [selectedStock, setSelectedStock] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("featured");
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  useEffect(() => {
    const urlCategory = searchParams.get("category");
    if (urlCategory) {
      setSelectedCategory(urlCategory);
    }
  }, [searchParams]);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const prodRes = await catalogApi.getProducts({ limit: 100 });

        if (prodRes.data?.products && prodRes.data.products.length > 0) {
          const prods = prodRes.data.products.map((p: any) => {
            const matchingFallback = defaultProducts.find(
              (dp) => dp.slug === p.slug || dp.name.toLowerCase() === p.name.toLowerCase()
            );
            const displayImg = p.images?.[0] || matchingFallback?.image || "/products/avakaya.png";

            const rawVariants = p.variants?.length ? p.variants : matchingFallback?.variants || [];
            const mappedVariants = rawVariants.map((v: any) => ({
              id: v.id,
              weight: v.weight,
              sku: v.sku,
              price: Number(v.price),
              mrp: Number(v.mrp || Math.round(Number(v.price) * 1.25)),
              stock: v.stock !== undefined && v.stock !== null ? Number(v.stock) : 50,
            }));

            return {
              id: p.id,
              name: p.name,
              slug: p.slug,
              category: p.category?.name || matchingFallback?.category || "Andhra Pickle",
              price: mappedVariants[0]?.price ?? Number(matchingFallback?.price ?? 189),
              mrp: mappedVariants[0]?.mrp ?? Number(matchingFallback?.mrp ?? 229),
              rating: p.ratingAverage ?? matchingFallback?.rating ?? 4.8,
              image: displayImg,
              tag: p.isFeatured
                ? "Best Seller"
                : p.spiceLevel
                ? `${p.spiceLevel} Spicy`
                : matchingFallback?.tag || "Authentic",
              spiceLevel: p.spiceLevel || matchingFallback?.spiceLevel || "Andhra Spicy",
              variants: mappedVariants,
            };
          });
          setProducts(prods);
        }
      } catch (err) {
        console.warn("Using default catalog data:", err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const filteredProducts = useMemo(() => {
    let result = [...products];

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.category?.toLowerCase().includes(q) ||
          p.slug.toLowerCase().includes(q)
      );
    }

    // Collection / Category filter
    if (selectedCategory !== "all") {
      result = result.filter((p) => matchCollection(p, selectedCategory));
    }

    // Weight variant auto-filter
    if (selectedWeight !== "all") {
      result = result.filter((p) =>
        p.variants?.some((v) => v.weight.toLowerCase().includes(selectedWeight.toLowerCase()))
      );
    }

    // Stock availability condition filter
    if (selectedStock === "in-stock") {
      result = result.filter((p) =>
        p.variants?.some((v) => (v.stock !== undefined ? v.stock >= 10 : true))
      );
    } else if (selectedStock === "low-stock") {
      result = result.filter((p) =>
        p.variants?.some((v) => v.stock !== undefined && v.stock > 0 && v.stock < 10)
      );
    } else if (selectedStock === "out-of-stock") {
      result = result.filter((p) =>
        p.variants?.some((v) => v.stock !== undefined && v.stock <= 0)
      );
    }

    // Sorting
    switch (sortBy) {
      case "price-asc":
        result.sort((a, b) => a.price - b.price);
        break;
      case "price-desc":
        result.sort((a, b) => b.price - a.price);
        break;
      case "rating":
        result.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
        break;
      case "newest":
        result.reverse();
        break;
      default:
        // Featured
        break;
    }

    return result;
  }, [products, searchQuery, selectedCategory, selectedWeight, selectedStock, sortBy]);

  const resetFilters = () => {
    setSearchQuery("");
    setSelectedCategory("all");
    setSelectedWeight("all");
    setSelectedStock("all");
    setSortBy("featured");
  };

  return (
    <>
      <PageHero
        eyebrow="Direct Andhra Pantry"
        title="Our Homemade Andhra Pickles"
        subtitle="100% handmade authentic Andhra pachallu sun-cured with stone-ground spices and cold-pressed gingelly oil."
      />

      <section className={`page ${styles.shopSection}`}>
        {/* Controls Header: Search, Sort, Mobile Filter toggle */}
        <div className={styles.toolbar}>
          <label>
            <Search size={18} />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search mango, gongura, chicken, garlic, mutton, tomato..."
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                style={{ border: "none", background: "transparent", cursor: "pointer", padding: 0 }}
              >
                ×
              </button>
            )}
          </label>
          <select
            aria-label="Sort products"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="featured">Featured Picks</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
            <option value="rating">Top Rated (★)</option>
            <option value="newest">Newest Batches</option>
          </select>
          <button
            type="button"
            onClick={() => setShowMobileFilters(!showMobileFilters)}
          >
            <SlidersHorizontal size={18} /> Filters
          </button>
        </div>

        {/* Main Catalog Layout */}
        <div className={styles.layout}>
          {/* Sidebar Filters: Seasonality / Collections & Auto-filtered Jar Sizes */}
          <aside style={{ display: showMobileFilters ? "flex" : undefined }}>
            <div className={styles.filterHeader}>
              <h2>Categories</h2>
              {(selectedCategory !== "all" || selectedWeight !== "all" || selectedStock !== "all" || searchQuery) && (
                <button
                  type="button"
                  onClick={resetFilters}
                  className={styles.resetBtn}
                >
                  <RotateCcw size={12} /> Reset
                </button>
              )}
            </div>

            {/* Collections: Seasonal, All-Time, Non-Veg, Combos */}
            {collections.map((col) => {
              const count = products.filter((p) => matchCollection(p, col.id)).length;
              const isChecked = selectedCategory === col.id;
              return (
                <label
                  key={col.id}
                  className={`${styles.filterOption} ${isChecked ? styles.active : ""}`}
                  title={col.description}
                >
                  <span className={styles.optionLeft}>
                    <input
                      type="radio"
                      name="category"
                      checked={isChecked}
                      onChange={() => setSelectedCategory(col.id)}
                    />
                    <span>{col.label}</span>
                  </span>
                  <span className={`${styles.count} ${isChecked ? styles.countActive : ""}`}>
                    ({count})
                  </span>
                </label>
              );
            })}

            {/* If a custom category query param was passed (e.g. Gift Packs), show it as active option */}
            {!collections.some((c) => c.id === selectedCategory) && selectedCategory !== "all" && (
              <label className={`${styles.filterOption} ${styles.active}`}>
                <span className={styles.optionLeft}>
                  <input
                    type="radio"
                    name="category"
                    checked={true}
                    onChange={() => {}}
                  />
                  <span>{selectedCategory}</span>
                </span>
                <span className={`${styles.count} ${styles.countActive}`}>
                  ({products.filter((p) => matchCollection(p, selectedCategory)).length})
                </span>
              </label>
            )}

            {/* Jar Sizes: Auto-filter with dynamic counts */}
            <h2>Jar Sizes</h2>
            {jarSizes.map((sz) => {
              const count = sz.id === "all"
                ? products.filter((p) => matchCollection(p, selectedCategory)).length
                : products.filter(
                    (p) =>
                      matchCollection(p, selectedCategory) &&
                      p.variants?.some((v) => v.weight.toLowerCase().includes(sz.id.toLowerCase()))
                  ).length;
              const isChecked = selectedWeight === sz.id;

              return (
                <label
                  key={sz.id}
                  className={`${styles.filterOption} ${isChecked ? styles.active : ""}`}
                >
                  <span className={styles.optionLeft}>
                    <input
                      type="radio"
                      name="weight"
                      checked={isChecked}
                      onChange={() => setSelectedWeight(sz.id)}
                    />
                    <span>{sz.label}</span>
                  </span>
                  <span className={`${styles.count} ${isChecked ? styles.countActive : ""}`}>
                    ({count})
                  </span>
                </label>
              );
            })}

            {/* Stock Availability: In Stock, Below 10 items, Out of Stock */}
            <h2>Stock Availability</h2>
            {stockConditions.map((st) => {
              const count = products.filter((p) => {
                if (st.id === "all") return true;
                if (st.id === "in-stock") return p.variants?.some((v) => (v.stock ?? 50) >= 10);
                if (st.id === "low-stock") return p.variants?.some((v) => (v.stock ?? 50) > 0 && (v.stock ?? 50) < 10);
                if (st.id === "out-of-stock") return p.variants?.some((v) => (v.stock ?? 50) <= 0);
                return true;
              }).length;
              const isChecked = selectedStock === st.id;

              return (
                <label
                  key={st.id}
                  className={`${styles.filterOption} ${isChecked ? styles.active : ""}`}
                >
                  <span className={styles.optionLeft}>
                    <input
                      type="radio"
                      name="stockCondition"
                      checked={isChecked}
                      onChange={() => setSelectedStock(st.id)}
                    />
                    <span style={{ color: st.id === "low-stock" && isChecked ? "#b45309" : undefined }}>
                      {st.label}
                    </span>
                  </span>
                  <span
                    className={`${styles.count} ${isChecked ? styles.countActive : ""}`}
                    style={{ color: isChecked && st.id === "low-stock" ? "#b45309" : undefined }}
                  >
                    ({count})
                  </span>
                </label>
              );
            })}
          </aside>

          {/* Product Grid Area */}
          <div>
            <div className={styles.viewToggle}>
              <span>
                Showing <strong>{filteredProducts.length}</strong> of {products.length} handmade jars
                {selectedCategory !== "all" && (
                  <> in <em>{collections.find((c) => c.id === selectedCategory)?.label || selectedCategory}</em></>
                )}
                {selectedWeight !== "all" && <> ({selectedWeight})</>}
                {selectedStock !== "all" && (
                  <> · <strong style={{ color: selectedStock === "low-stock" ? "#b45309" : "var(--green)" }}>{stockConditions.find((s) => s.id === selectedStock)?.label}</strong></>
                )}
              </span>
            </div>

            {loading ? (
              <div style={{ textAlign: "center", padding: "60px 20px", color: "var(--muted)" }}>
                <Sparkles size={32} style={{ animation: "spin 2s linear infinite", margin: "0 auto 12px" }} />
                <p>Loading freshly seasoned Andhra pickles...</p>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div
                style={{
                  textAlign: "center",
                  padding: "60px 20px",
                  background: "var(--white)",
                  borderRadius: "12px",
                  border: "1px dashed var(--line)",
                }}
              >
                <h3>No pickles found matching your filters</h3>
                <p style={{ color: "var(--muted)", margin: "8px 0 20px" }}>
                  Try relaxing your search terms or resetting your filters.
                </p>
                <button
                  type="button"
                  className="button"
                  onClick={resetFilters}
                  style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}
                >
                  <RotateCcw size={16} /> View All Pickles
                </button>
              </div>
            ) : (
              <div className={styles.grid}>
                {filteredProducts.map((product) => (
                  <ProductCard
                    key={product.id || product.slug}
                    product={product}
                    selectedWeightFilter={selectedWeight}
                    stockFilter={selectedStock}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </>
  );
}

export default function ShopPage() {
  return (
    <Suspense
      fallback={
        <div style={{ textAlign: "center", padding: "100px 20px", color: "var(--muted)" }}>
          <Sparkles size={32} style={{ animation: "spin 2s linear infinite", margin: "0 auto 12px" }} />
          <p>Loading Andhra Handmade Pickles...</p>
        </div>
      }
    >
      <ShopContent />
    </Suspense>
  );
}
