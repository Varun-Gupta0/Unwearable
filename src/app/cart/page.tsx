"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useCart } from "@/context/CartContext";
import CartItemRow from "@/components/cart/CartItem";
import CartSummary from "@/components/cart/CartSummary";
import BrutalButton from "@/components/ui/BrutalButton";

export default function CartPage() {
  const { items } = useCart();

  return (
    <div className="px-4 py-8 max-w-4xl mx-auto">
      <h1 className="font-mono text-4xl md:text-5xl font-bold uppercase mb-8">
        Your Cart
      </h1>

      {items.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-20"
        >
          <p className="font-mono text-3xl md:text-5xl font-bold uppercase mb-4 text-brutal-black/30">
            Your cart is void
          </p>
          <p className="font-sans text-brutal-black/60 mb-8">
            Nothing to see here. Go add some regrets.
          </p>
          <BrutalButton href="/shop">
            Shop Now
          </BrutalButton>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <AnimatePresence mode="popLayout">
              {items.map((item, idx) => (
                <CartItemRow
                  key={`${item.id}-${item.selectedSize}-${item.selectedColorId}-${item.designId ?? idx}`}
                  item={item}
                />
              ))}
            </AnimatePresence>
          </div>

          <div className="lg:col-span-1">
            <CartSummary />
          </div>
        </div>
      )}
    </div>
  );
}