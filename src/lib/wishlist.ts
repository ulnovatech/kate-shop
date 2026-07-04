import { create } from "zustand";
import { persist } from "zustand/middleware";

type WishlistState = {
  productIds: string[];
  has: (productId: string) => boolean;
  toggleLocal: (productId: string) => void;
  setMany: (ids: string[]) => void;
  clear: () => void;
};

export const useWishlist = create<WishlistState>()(
  persist(
    (set, get) => ({
      productIds: [],
      has: (productId) => get().productIds.includes(productId),
      toggleLocal: (productId) => {
        const ids = get().productIds;
        if (ids.includes(productId)) {
          set({ productIds: ids.filter((id) => id !== productId) });
        } else {
          set({ productIds: [...ids, productId] });
        }
      },
      setMany: (ids) => set({ productIds: [...new Set(ids)] }),
      clear: () => set({ productIds: [] }),
    }),
    { name: "kate-wishlist" },
  ),
);
