import { SlidersHorizontal, Search } from "lucide-react";
import { ProductCard } from "@/components/product/ProductCard";
import { PageHero } from "@/components/ui/PageHero";
import { filterCategories, products } from "@/lib/data";
import styles from "./shop.module.scss";

export const metadata = { title: "Shop Pickles" };

export default function ShopPage() {
  return (
    <>
      <PageHero eyebrow="Shop" title="Find your next favourite pickle" subtitle="Search, filter, sort, wishlist, quick-view, and buy homemade pickles across vegetarian, non-vegetarian, seasonal, and gifting categories." />
      <section className="section page">
        <div className={styles.toolbar}>
          <label><Search size={18} /><input placeholder="Search mango, gongura, chicken..." /></label>
          <select aria-label="Sort products"><option>Newest</option><option>Price: low to high</option><option>Price: high to low</option><option>Top rated</option></select>
          <button><SlidersHorizontal size={18} /> Filters</button>
        </div>
        <div className={styles.layout}>
          <aside>
            <h2>Filters</h2>
            {filterCategories.map((category) => <label key={category}><input type="checkbox" /> {category}</label>)}
            <h2>Weight</h2>
            {["250g", "500g", "1kg"].map((weight) => <label key={weight}><input type="checkbox" /> {weight}</label>)}
          </aside>
          <div>
            <div className={styles.viewToggle}><button>Grid</button><button>List</button><span>Showing 1-12 of 48</span></div>
            <div className="grid">{products.concat(products).map((product, index) => <ProductCard key={`${product.slug}-${index}`} product={product} />)}</div>
          </div>
        </div>
      </section>
    </>
  );
}
