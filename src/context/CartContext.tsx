"use client";

import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  type ReactNode,
} from "react";
import type { Product, CartItem } from "@/types";

interface AddToCartItem extends Product {
  selectedSize?: string;
  selectedColorId?: string;
  designId?: string;
  designImageUrl?: string;
}

// Composite key that uniquely identifies a cart slot
interface CartItemKey {
  id: string;
  selectedSize?: string;
  selectedColorId?: string;
  designId?: string;
}

type CartAction =
  | { type: "ADD_ITEM"; payload: AddToCartItem }
  | { type: "REMOVE_ITEM"; payload: CartItemKey }
  | { type: "UPDATE_QUANTITY"; payload: CartItemKey & { quantity: number } }
  | { type: "CLEAR_CART" };

type CartState = {
  items: CartItem[];
};

const CartContext = createContext<{
  items: CartItem[];
  addItem: (product: AddToCartItem) => void;
  removeItem: (key: CartItemKey) => void;
  updateQuantity: (key: CartItemKey, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
} | null>(null);

export type { CartItemKey };

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case "ADD_ITEM": {
      const existingItem = state.items.find(
        (item) => item.id === action.payload.id && 
                  item.selectedSize === action.payload.selectedSize &&
                  item.selectedColorId === action.payload.selectedColorId &&
                  item.designId === action.payload.designId
      );
      if (existingItem && !action.payload.designId) {
        // Only merge if it's a standard product without a unique design
        return {
          ...state,
          items: state.items.map((item) =>
            item.id === action.payload.id && 
            item.selectedSize === action.payload.selectedSize &&
            item.selectedColorId === action.payload.selectedColorId
              ? { ...item, quantity: item.quantity + 1 }
              : item
          ),
        };
      }
      return {
        ...state,
        items: [...state.items, { 
          ...action.payload, 
          quantity: 1,
          selectedSize: action.payload.selectedSize || "L",
          selectedColorId: action.payload.selectedColorId || "2",
          designId: action.payload.designId,
          designImageUrl: action.payload.designImageUrl
        }],
      };
    }
    case "REMOVE_ITEM": {
      const key = action.payload;
      return {
        ...state,
        items: state.items.filter(
          (item) => !(
            item.id === key.id &&
            item.selectedSize === key.selectedSize &&
            item.selectedColorId === key.selectedColorId &&
            (item.designId ?? undefined) === (key.designId ?? undefined)
          )
        ),
      };
    }
    case "UPDATE_QUANTITY": {
      const key = action.payload;
      return {
        ...state,
        items: state.items.map((item) =>
          item.id === key.id &&
          item.selectedSize === key.selectedSize &&
          item.selectedColorId === key.selectedColorId &&
          (item.designId ?? undefined) === (key.designId ?? undefined)
            ? { ...item, quantity: key.quantity }
            : item
        ),
      };
    }
    case "CLEAR_CART":
      return { items: [] };
    default:
      return state;
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, { items: [] });

  useEffect(() => {
    const saved = localStorage.getItem("cart");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        dispatch({ type: "CLEAR_CART" });
        parsed.items.forEach((item: CartItem) => {
          dispatch({ type: "ADD_ITEM", payload: item });
        });
      } catch {
        // ignore
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(state));
  }, [state]);

  const addItem = (product: AddToCartItem) => {
    dispatch({ type: "ADD_ITEM", payload: product });
  };

  const removeItem = (key: CartItemKey) => {
    dispatch({ type: "REMOVE_ITEM", payload: key });
  };

  const updateQuantity = (key: CartItemKey, quantity: number) => {
    if (quantity <= 0) {
      dispatch({ type: "REMOVE_ITEM", payload: key });
    } else {
      dispatch({ type: "UPDATE_QUANTITY", payload: { ...key, quantity } });
    }
  };

  const clearCart = () => {
    dispatch({ type: "CLEAR_CART" });
  };

  const totalItems = state.items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = state.items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  return (
    <CartContext.Provider
      value={{
        items: state.items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        totalItems,
        totalPrice,
      }}
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