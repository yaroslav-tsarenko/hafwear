"use client";

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";
import type { Cart, CartItem } from "@/types/cart";
import { toast } from "sonner";
import { CartToast } from "@/components/cart/CartToast/CartToast";
import { estimatedShipping, roundMoney, vatIncluded } from "@/lib/pricing";

interface CartContextType {
  cart: Cart;
  isLoaded: boolean;
  addItem: (item: Omit<CartItem, "id">) => void;
  /** Both take the cart line id — the same product can sit on several lines (size, add-on). */
  removeItem: (lineId: string) => void;
  updateQuantity: (lineId: string, quantity: number) => void;
  clearCart: () => void;
  itemCount: number;
  cartBounce: number;
}

const CART_STORAGE_KEY = "e-commerce-cart";

const emptyCart: Cart = {
  items: [],
  subtotal: 0,
  taxAmount: 0,
  shippingCost: 0,
  total: 0,
  itemCount: 0,
};

const CartContext = createContext<CartContextType | undefined>(undefined);

function lineId(item: Pick<CartItem, "productId" | "variantId" | "extraKey">): string {
  return `${item.productId}-${item.variantId || "default"}-${item.extraKey || "none"}`;
}

function calculateTotals(items: CartItem[]): Cart {
  const subtotal = roundMoney(items.reduce((sum, item) => sum + item.price * item.quantity, 0));
  // Prices are VAT-inclusive: the tax is already contained in the price, so
  // derive its portion instead of adding it on top of the total.
  const taxAmount = vatIncluded(subtotal);
  // The cheapest method; the checkout recalculates once a method is chosen.
  const shippingCost = estimatedShipping(subtotal);
  const total = roundMoney(subtotal + shippingCost);
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return { items, subtotal, taxAmount, shippingCost, total, itemCount };
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<Cart>(emptyCart);
  const [isLoaded, setIsLoaded] = useState(false);
  const [cartBounce, setCartBounce] = useState(0);

  useEffect(() => {
    const stored = localStorage.getItem(CART_STORAGE_KEY);
    if (stored) {
      try {
        // Re-key saved lines so carts stored before add-ons were part of the id still merge correctly.
        const items = (JSON.parse(stored) as CartItem[]).map((item) => ({ ...item, id: lineId(item) }));
        setCart(calculateTotals(items));
      } catch {
        localStorage.removeItem(CART_STORAGE_KEY);
      }
    }
    setIsLoaded(true);
  }, []);

  const persistCart = useCallback((items: CartItem[]) => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    setCart(calculateTotals(items));
  }, []);

  const addItem = useCallback(
    (newItem: Omit<CartItem, "id">) => {
      const currentItems = cart.items;
      const id = lineId(newItem);
      const existingIndex = currentItems.findIndex((item) => lineId(item) === id);

      let updatedItems: CartItem[];
      if (existingIndex >= 0) {
        updatedItems = [...currentItems];
        const existing = updatedItems[existingIndex];
        const newQty = Math.min(
          existing.quantity + newItem.quantity,
          newItem.maxQuantity
        );
        updatedItems[existingIndex] = { ...existing, quantity: newQty };
      } else {
        updatedItems = [
          ...currentItems,
          { ...newItem, id },
        ];
      }

      persistCart(updatedItems);
      setCartBounce((b) => b + 1);
      toast.custom(
        () => (
          <CartToast
            name={newItem.name}
            imageUrl={newItem.imageUrl}
            quantity={newItem.quantity}
          />
        ),
        { duration: 2500, id: `cart-add-${id}` }
      );
    },
    [cart.items, persistCart]
  );

  const removeItem = useCallback(
    (id: string) => {
      const updatedItems = cart.items.filter((item) => item.id !== id);
      persistCart(updatedItems);
      toast.success("Removed from your bag", { id: `cart-remove-${id}` });
    },
    [cart.items, persistCart]
  );

  const updateQuantity = useCallback(
    (id: string, quantity: number) => {
      const updatedItems = cart.items.map((item) => {
        if (item.id === id) {
          return { ...item, quantity: Math.max(1, Math.min(quantity, item.maxQuantity)) };
        }
        return item;
      });
      persistCart(updatedItems);
    },
    [cart.items, persistCart]
  );

  const clearCart = useCallback(() => {
    localStorage.removeItem(CART_STORAGE_KEY);
    setCart(emptyCart);
  }, []);

  return (
    <CartContext.Provider
      value={{ cart, isLoaded, addItem, removeItem, updateQuantity, clearCart, itemCount: cart.itemCount, cartBounce }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
