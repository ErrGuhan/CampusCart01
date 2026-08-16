'use client';

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';

export type CartItemData = {
  id: string;
  slug: string;
  name: string;
  price: number;
  discountPrice?: number;
  image: string;
  sellerId?: string;
  sellerName: string;
  sellerUsername: string;
  maxQuantity: number;
  isDigital?: boolean;
  digitalFileUrl?: string;
};

type CartItem = CartItemData & { quantity: number };

type CartContextType = {
  items: CartItem[];
  addToCart: (product: CartItemData, quantity?: number) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  subtotal: number;
  totalSavings: number;
};

const CartContext = createContext<CartContextType>({
  items: [],
  addToCart: () => {},
  removeFromCart: () => {},
  updateQuantity: () => {},
  clearCart: () => {},
  totalItems: 0,
  subtotal: 0,
  totalSavings: 0,
});

const STORAGE_KEY = 'campuscart-cart';

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setItems(JSON.parse(stored));
      }
    } catch {
      // ignore parse errors
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    }
  }, [items, loaded]);

  const addToCart = useCallback((product: CartItemData, quantity: number = 1) => {
    setItems((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      const safeMax = product.maxQuantity && product.maxQuantity > 0 ? product.maxQuantity : 99;
      if (existing) {
        const currentMax = existing.maxQuantity && existing.maxQuantity > 0 ? existing.maxQuantity : 99;
        return prev.map((item) =>
          item.id === product.id
            ? { ...item, quantity: Math.min(currentMax, (item.quantity || 0) + quantity) }
            : item
        );
      }
      return [...prev, { ...product, maxQuantity: safeMax, quantity: Math.max(1, quantity) }];
    });
  }, []);

  const removeFromCart = useCallback((id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const updateQuantity = useCallback((id: string, quantity: number) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const maxQ = item.maxQuantity && item.maxQuantity > 0 ? item.maxQuantity : 99;
          return { ...item, quantity: Math.max(1, Math.min(maxQ, Number(quantity) || 1)) };
        }
        return item;
      })
    );
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = items.reduce(
    (sum, item) => sum + (item.discountPrice ?? item.price) * item.quantity,
    0
  );
  const totalSavings = items.reduce(
    (sum, item) =>
      item.discountPrice
        ? sum + (item.price - item.discountPrice) * item.quantity
        : sum,
    0
  );

  return (
    <CartContext.Provider
      value={{ items, addToCart, removeFromCart, updateQuantity, clearCart, totalItems, subtotal, totalSavings }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
