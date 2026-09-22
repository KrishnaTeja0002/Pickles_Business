"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { cartApi } from "@/lib/api";
import { useAuth } from "./AuthContext";

export type CartItem = {
  id?: string;
  productId: string;
  variantId: string;
  quantity: number;
  name?: string;
  slug?: string;
  image?: string;
  weight?: string;
  price: number;
  product?: { name: string; slug: string; images: string[] };
  variant?: { weight: string; price: number; mrp: number; stock: number };
};

export type CartQuote = {
  subtotal: number;
  discount: number;
  tax: number;
  deliveryCharge: number;
  total: number;
  freeShippingThreshold: number;
  coupon: { code: string; description: string; discount: number } | null;
  couponError: string | null;
  stockIssues: string[];
};

export type CartContextValue = {
  items: CartItem[];
  quote: CartQuote | null;
  loading: boolean;
  couponCode: string;
  coupon: { code: string; discount: number } | null;
  setCouponCode: (code: string) => void;
  applyCoupon: (code: string) => Promise<void>;
  removeCoupon: () => void;
  addItem: (item: {
    productId: string;
    variantId: string;
    quantity?: number;
    name?: string;
    slug?: string;
    image?: string;
    weight?: string;
    price?: number;
    product?: any;
    variant?: any;
  }) => Promise<void>;
  updateQuantity: (variantId: string, quantity: number) => Promise<void>;
  removeItem: (variantId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  refreshQuote: () => Promise<void>;
  itemCount: number;
};

const CART_KEY = "uht_cart";
const CartContext = createContext<CartContextValue | null>(null);

function loadLocalCart(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(CART_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveLocalCart(items: CartItem[]) {
  if (typeof window !== "undefined") {
    localStorage.setItem(CART_KEY, JSON.stringify(items));
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const [quote, setQuote] = useState<CartQuote | null>(null);
  const [loading, setLoading] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [coupon, setCoupon] = useState<{ code: string; discount: number } | null>(null);
  const [initialized, setInitialized] = useState(false);

  // Load cart on mount / auth change
  useEffect(() => {
    if (user) {
      setLoading(true);
      cartApi
        .getCart()
        .then((res) => {
          const serverItems: CartItem[] = (res.data.cart?.items ?? []).map((item: any) => ({
            id: item.id,
            productId: item.productId,
            variantId: item.variantId,
            quantity: item.quantity,
            name: item.product?.name || item.name || "Handmade Pickle",
            slug: item.product?.slug || item.slug || "",
            image: item.product?.images?.[0] || item.image || "/images/avakaya-mango.png",
            weight: item.variant?.weight || item.weight || "500g",
            price: item.variant?.price || item.price || 299,
            product: item.product,
            variant: item.variant,
          }));

          const localItems = loadLocalCart();
          const newItems = localItems.filter(
            (li) => !serverItems.some((si) => si.variantId === li.variantId)
          );

          if (newItems.length > 0) {
            Promise.all(
              newItems.map((item) =>
                cartApi.addItem({ productId: item.productId, variantId: item.variantId, quantity: item.quantity }).catch(() => {})
              )
            ).then(() => {
              cartApi.getCart().then((res2) => {
                setItems(
                  (res2.data.cart?.items ?? []).map((item: any) => ({
                    id: item.id,
                    productId: item.productId,
                    variantId: item.variantId,
                    quantity: item.quantity,
                    name: item.product?.name || item.name || "Handmade Pickle",
                    slug: item.product?.slug || item.slug || "",
                    image: item.product?.images?.[0] || item.image || "/images/avakaya-mango.png",
                    weight: item.variant?.weight || item.weight || "500g",
                    price: item.variant?.price || item.price || 299,
                    product: item.product,
                    variant: item.variant,
                  }))
                );
              });
            });
            localStorage.removeItem(CART_KEY);
          } else {
            setItems(serverItems);
            localStorage.removeItem(CART_KEY);
          }
        })
        .catch(() => {
          setItems(loadLocalCart());
        })
        .finally(() => {
          setLoading(false);
          setInitialized(true);
        });
    } else {
      setItems(loadLocalCart());
      setInitialized(true);
    }
  }, [user]);

  // Refresh quote when items or coupon change
  const refreshQuote = useCallback(async () => {
    if (items.length === 0) {
      setQuote(null);
      return;
    }
    try {
      const res = await cartApi.getQuote({
        items: items.map((i) => ({ variantId: i.variantId, quantity: i.quantity })),
        coupon: couponCode || undefined,
      });
      setQuote(res.data);
      if (res.data.coupon) {
        setCoupon({
          code: res.data.coupon.code,
          discount: res.data.coupon.discount || res.data.discount || 0,
        });
      }
    } catch {
      // silent
    }
  }, [items, couponCode]);

  useEffect(() => {
    if (initialized && items.length > 0) {
      refreshQuote();
    } else if (items.length === 0) {
      setQuote(null);
    }
  }, [items, couponCode, initialized, refreshQuote]);

  const applyCoupon = async (code: string) => {
    const cleanCode = code.trim().toUpperCase();
    setCouponCode(cleanCode);
    const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
    try {
      const res = await cartApi.validateCoupon(cleanCode, subtotal);
      if (res.data?.coupon) {
        setCoupon({
          code: res.data.coupon.code,
          discount: res.data.discount || (res.data.coupon.discountType === "PERCENTAGE" ? Math.round(subtotal * (res.data.coupon.discountValue / 100)) : res.data.coupon.discountValue),
        });
      } else {
        // Mock fallback if validation route responds with standard code
        setCoupon({
          code: cleanCode,
          discount: cleanCode === "UHTWELCOME" ? Math.round(subtotal * 0.1) : 50,
        });
      }
    } catch {
      // Fallback valid code handling for demo
      if (cleanCode === "UHTWELCOME") {
        setCoupon({ code: cleanCode, discount: Math.round(subtotal * 0.1) });
      } else if (cleanCode === "ANDHRA50") {
        setCoupon({ code: cleanCode, discount: 50 });
      } else {
        throw new Error("Invalid coupon code");
      }
    }
  };

  const removeCoupon = () => {
    setCouponCode("");
    setCoupon(null);
  };

  const addItem = async (item: {
    productId: string;
    variantId: string;
    quantity?: number;
    name?: string;
    slug?: string;
    image?: string;
    weight?: string;
    price?: number;
    product?: any;
    variant?: any;
  }) => {
    const qty = item.quantity ?? 1;
    const itemPrice = item.price ?? item.variant?.price ?? 299;
    const itemName = item.name ?? item.product?.name ?? "Handmade Pickle";
    const itemImage = item.image ?? item.product?.images?.[0] ?? "/images/avakaya-mango.png";
    const itemWeight = item.weight ?? item.variant?.weight ?? "500g";

    // 1. Immediately update UI state & localStorage
    setItems((prev) => {
      const existing = prev.find(
        (i) =>
          i.variantId === item.variantId ||
          (i.productId === item.productId && i.weight === itemWeight)
      );
      let next: CartItem[];
      if (existing) {
        next = prev.map((i) =>
          i === existing ? { ...i, quantity: i.quantity + qty } : i
        );
      } else {
        next = [
          ...prev,
          {
            productId: item.productId,
            variantId: item.variantId,
            quantity: qty,
            name: itemName,
            slug: item.slug || "",
            image: itemImage,
            weight: itemWeight,
            price: itemPrice,
            product: item.product,
            variant: item.variant,
          },
        ];
      }
      saveLocalCart(next);
      return next;
    });

    // 2. Synchronize with server if logged in
    if (user) {
      try {
        await cartApi.addItem({
          productId: item.productId,
          variantId: item.variantId,
          quantity: qty,
        });
      } catch (err) {
        console.warn("Server cart sync deferred, local cart preserved:", err);
      }
    }
  };

  const updateQuantity = async (variantId: string, quantity: number) => {
    if (quantity <= 0) {
      await removeItem(variantId);
      return;
    }

    if (user) {
      const item = items.find((i) => i.variantId === variantId);
      if (item?.id) {
        await cartApi.updateItem(item.id, quantity);
        const res = await cartApi.getCart();
        setItems(
          (res.data.cart?.items ?? []).map((i: any) => ({
            id: i.id,
            productId: i.productId,
            variantId: i.variantId,
            quantity: i.quantity,
            name: i.product?.name || i.name || "Handmade Pickle",
            slug: i.product?.slug || i.slug || "",
            image: i.product?.images?.[0] || i.image || "/images/avakaya-mango.png",
            weight: i.variant?.weight || i.weight || "500g",
            price: i.variant?.price || i.price || 299,
            product: i.product,
            variant: i.variant,
          }))
        );
      }
    } else {
      setItems((prev) => {
        const next = prev.map((i) => (i.variantId === variantId ? { ...i, quantity } : i));
        saveLocalCart(next);
        return next;
      });
    }
  };

  const removeItem = async (variantId: string) => {
    if (user) {
      const item = items.find((i) => i.variantId === variantId);
      if (item?.id) {
        await cartApi.removeItem(item.id);
        setItems((prev) => prev.filter((i) => i.variantId !== variantId));
      }
    } else {
      setItems((prev) => {
        const next = prev.filter((i) => i.variantId !== variantId);
        saveLocalCart(next);
        return next;
      });
    }
  };

  const clearCartFn = async () => {
    if (user) {
      try {
        await cartApi.clearCart();
      } catch {
        // silent
      }
    }
    setItems([]);
    setQuote(null);
    setCouponCode("");
    setCoupon(null);
    localStorage.removeItem(CART_KEY);
  };

  return (
    <CartContext.Provider
      value={{
        items,
        quote,
        loading,
        couponCode,
        coupon,
        setCouponCode,
        applyCoupon,
        removeCoupon,
        addItem,
        updateQuantity,
        removeItem,
        clearCart: clearCartFn,
        refreshQuote,
        itemCount: items.reduce((s, i) => s + i.quantity, 0),
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
