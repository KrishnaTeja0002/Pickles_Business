"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { userApi } from "@/lib/api";
import { useAuth } from "./AuthContext";

type WishlistItem = {
  id: string;
  productId: string;
  product: any;
};

type WishlistContextValue = {
  items: WishlistItem[];
  loading: boolean;
  isInWishlist: (productId: string) => boolean;
  toggle: (productId: string) => Promise<void>;
  toggleWishlist: (productId: string) => Promise<void>;
  remove: (productId: string) => Promise<void>;
  removeFromWishlist: (productId: string) => Promise<void>;
  refresh: () => Promise<void>;
};

const WishlistContext = createContext<WishlistContextValue | null>(null);

export function WishlistProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!user) {
      setItems([]);
      return;
    }
    setLoading(true);
    try {
      const res = await userApi.getWishlist();
      setItems(res.data.items || []);
    } catch {
      // silent
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const isInWishlist = (productId: string) => items.some((i) => i.productId === productId);

  const toggle = async (productId: string) => {
    if (!user) throw new Error("Login required to use wishlist");
    if (isInWishlist(productId)) {
      await userApi.removeFromWishlist(productId);
      setItems((prev) => prev.filter((i) => i.productId !== productId));
    } else {
      const res = await userApi.addToWishlist(productId);
      setItems((prev) => [...prev, res.data.item]);
    }
  };

  const remove = async (productId: string) => {
    if (!user) return;
    await userApi.removeFromWishlist(productId);
    setItems((prev) => prev.filter((i) => i.productId !== productId));
  };

  return (
    <WishlistContext.Provider
      value={{
        items,
        loading,
        isInWishlist,
        toggle,
        toggleWishlist: toggle,
        remove,
        removeFromWishlist: remove,
        refresh,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error("useWishlist must be used within WishlistProvider");
  return ctx;
}
