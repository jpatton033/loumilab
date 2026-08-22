import { useCallback, useMemo, useState } from "react";
import type { StoreProduct } from "@/data/orders/storefronts";

export interface CartLine {
  product: StoreProduct;
  quantity: number;
}

/**
 * Cart state for Orders storefronts. Local for now; the same API will back a
 * persisted cart and server-side checkout without component changes.
 */
export const useCart = () => {
  const [lines, setLines] = useState<CartLine[]>([]);

  const add = useCallback((product: StoreProduct) => {
    setLines((prev) => {
      const existing = prev.find((l) => l.product.id === product.id);
      if (existing) {
        return prev.map((l) => (l.product.id === product.id ? { ...l, quantity: l.quantity + 1 } : l));
      }
      return [...prev, { product, quantity: 1 }];
    });
  }, []);

  const remove = useCallback((productId: string) => {
    setLines((prev) =>
      prev
        .map((l) => (l.product.id === productId ? { ...l, quantity: l.quantity - 1 } : l))
        .filter((l) => l.quantity > 0)
    );
  }, []);

  const clear = useCallback(() => setLines([]), []);

  const count = useMemo(() => lines.reduce((n, l) => n + l.quantity, 0), [lines]);
  const subtotalCents = useMemo(
    () => lines.reduce((n, l) => n + l.quantity * l.product.priceCents, 0),
    [lines]
  );

  return { lines, add, remove, clear, count, subtotalCents };
};
