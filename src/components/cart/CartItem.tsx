"use client";

import { motion } from "framer-motion";
import type { CartItem } from "@/types";
import { formatPrice } from "@/lib/utils";
import { useCart, type CartItemKey } from "@/context/CartContext";

interface CartItemProps {
  item: CartItem;
}

export default function CartItemRow({ item }: CartItemProps) {
  const { updateQuantity, removeItem } = useCart();

  // Build the composite key for this specific cart slot
  const itemKey: CartItemKey = {
    id: item.id,
    selectedSize: item.selectedSize,
    selectedColorId: item.selectedColorId,
    designId: item.designId,
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="flex items-center gap-4 py-4 border-b-3 border-brutal-black"
    >
      <div className="w-20 h-20 bg-brutal-black/5 border-brutal border-3 border-brutal-black flex items-center justify-center font-mono text-2xl text-brutal-black/30 overflow-hidden">
        {item.designImageUrl ? (
          <img src={item.designImageUrl} alt={`${item.name} design`} className="w-full h-full object-cover" />
        ) : (
          item.name.charAt(0)
        )}
      </div>

      <div className="flex-1 min-w-0">
        <h4 className="font-mono font-bold uppercase text-sm truncate">{item.name}</h4>
        <p className="font-sans text-xs text-brutal-black/60 truncate">{item.tagline}</p>
        {item.designId && (
          <span className="inline-block mt-1 font-mono text-[10px] uppercase bg-accent text-cream px-2 py-0.5">
            ✦ Custom Design
          </span>
        )}
        <nav aria-label="Cart item size" className="font-mono text-sm uppercase text-brutal-black/50 mb-2">
          Size: {item.selectedSize}
        </nav>
      </div>

      <div className="flex items-center gap-2">
        <button type="button"
          onClick={() => updateQuantity(itemKey, item.quantity - 1)}
          aria-label="Decrease quantity"
          className="w-8 h-8 border-brutal border-3 border-brutal-black font-mono font-bold hover:bg-brutal-black hover:text-cream transition-colors"
        >
          -
        </button>
        <span className="w-8 text-center font-mono font-bold">{item.quantity}</span>
        <button type="button"
          onClick={() => updateQuantity(itemKey, item.quantity + 1)}
          aria-label="Increase quantity"
          className="w-8 h-8 border-brutal border-3 border-brutal-black font-mono font-bold hover:bg-brutal-black hover:text-cream transition-colors"
        >
          +
        </button>
      </div>

      <div className="font-mono font-bold text-accent min-w-[80px] text-right">
        {formatPrice(item.price * item.quantity)}
      </div>

      <button type="button"
        onClick={() => removeItem(itemKey)}
        aria-label="Remove item"
        className="w-8 h-8 border-brutal border-3 border-brutal-black font-mono hover:bg-accent hover:text-cream transition-colors"
      >
        ✕
      </button>
    </motion.div>
  );
}