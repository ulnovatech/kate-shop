import { create } from "zustand";
import { persist } from "zustand/middleware";

export type CartItem = {
  productId: string;
  name: string;
  slug: string;
  price: number;
  image: string;
  quantity: number;
};

function createSessionId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `sess-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function ensureSessionId(sessionId: string): string {
  return sessionId || createSessionId();
}

type CartState = {
  sessionId: string;
  items: CartItem[];
  add: (item: Omit<CartItem, "quantity">, qty?: number) => void;
  remove: (productId: string) => void;
  setQty: (productId: string, qty: number) => void;
  clear: () => void;
  total: () => number;
  count: () => number;
  getSessionId: () => string;
};

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      // Defer crypto.randomUUID until client interaction — Workers forbid it at module scope.
      sessionId: "",
      items: [],
      add: (item, qty = 1) => {
        const sessionId = ensureSessionId(get().sessionId);
        if (sessionId !== get().sessionId) set({ sessionId });
        const items = [...get().items];
        const i = items.findIndex((x) => x.productId === item.productId);
        if (i >= 0) items[i].quantity += qty;
        else items.push({ ...item, quantity: qty });
        set({ items });
      },
      remove: (productId) => set({ items: get().items.filter((x) => x.productId !== productId) }),
      setQty: (productId, qty) =>
        set({
          items: get().items.map((x) =>
            x.productId === productId ? { ...x, quantity: Math.max(1, qty) } : x,
          ),
        }),
      clear: () => set({ items: [] }),
      total: () => get().items.reduce((s, x) => s + x.price * x.quantity, 0),
      count: () => get().items.reduce((s, x) => s + x.quantity, 0),
      getSessionId: () => {
        const sessionId = ensureSessionId(get().sessionId);
        if (sessionId !== get().sessionId) set({ sessionId });
        return sessionId;
      },
    }),
    {
      name: "kate-jewels-cart",
      partialize: (state) => ({ sessionId: state.sessionId, items: state.items }),
      merge: (persisted, current) => {
        const saved = persisted as Partial<CartState> | undefined;
        return {
          ...current,
          ...saved,
          sessionId: saved?.sessionId ?? current.sessionId,
        };
      },
      onRehydrateStorage: () => (state) => {
        if (state && !state.sessionId) {
          state.sessionId = createSessionId();
        }
      },
    },
  ),
);
