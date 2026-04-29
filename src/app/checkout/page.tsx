"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import BrutalButton from "@/components/ui/BrutalButton";
import BrutalInput from "@/components/ui/BrutalInput";
import { useCart } from "@/context/CartContext";
import { formatPrice } from "@/lib/utils";

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
}

export default function CheckoutPage() {
  const { items, totalPrice, clearCart } = useCart();
  const [submitted, setSubmitted] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
  });

  if (items.length === 0 && !submitted) {
    return (
      <div className="px-4 py-8 max-w-4xl mx-auto text-center">
        <h1 className="font-mono text-4xl font-bold uppercase mb-4">Checkout</h1>
        <p className="font-sans text-brutal-black/60 mb-8">Your cart is empty.</p>
        <BrutalButton href="/shop">Shop Now</BrutalButton>
      </div>
    );
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const payload = {
      customer: {
        name: `${formData.firstName} ${formData.lastName}`.trim(),
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        pincode: formData.pincode,
      },
      items: items.map((item) => ({
        slug: item.slug,
        quantity: item.quantity,
        price: item.price,
        selectedSize: item.selectedSize,
        selectedColorId: item.selectedColorId,
        // Pass design fields for custom print fulfillment
        designId: item.designId,
        designImageUrl: item.designImageUrl,
      })),
      totalOrderValue: totalPrice,
    };

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || data.details || "Order failed");
      }

      clearCart();
      setOrderId(data.order_id ?? null);
      setSubmitted(true);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="px-4 py-20 max-w-4xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="border-brutal border-3 border-brutal-black p-12 bg-cream"
          style={{ boxShadow: "8px 8px 0 #0A0A0A" }}
        >
          <h1 className="font-mono text-4xl md:text-5xl font-bold uppercase mb-4 text-accent">
            Order Secured.
          </h1>
          <h2 className="font-mono text-2xl md:text-3xl font-bold uppercase mb-8 text-brutal-black">
            Regret Imminent.
          </h2>
          {orderId && (
            <div className="border-brutal border-3 border-brutal-black p-4 mb-6 bg-cream/80">
              <p className="font-mono text-xs uppercase text-brutal-black/60">Order ID</p>
              <p className="font-mono text-lg font-bold tracking-widest">{orderId}</p>
              <p className="font-sans text-xs text-brutal-black/50 mt-1">Save this for your records</p>
            </div>
          )}
          <p className="font-sans text-lg mb-8">
            Your order has been placed. We&apos;ll get it printed and shipped to you.
          </p>
          <BrutalButton href="/shop">Continue Shopping</BrutalButton>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="px-4 py-8 max-w-6xl mx-auto">
      <h1 className="font-mono text-4xl md:text-5xl font-bold uppercase mb-8">
        Checkout
      </h1>

      {error && (
        <div className="border-brutal border-3 border-brutal-black bg-toxic p-4 mb-8" style={{ boxShadow: "4px 4px 0 #0A0A0A" }}>
          <p className="font-mono text-sm uppercase text-brutal-black">
            ERROR: {error}
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <h2 className="font-mono text-xl font-bold uppercase mb-4">
            Shipping Info
          </h2>
          
          <div className="grid grid-cols-2 gap-4">
            <BrutalInput
              placeholder="First Name"
              name="firstName"
              value={formData.firstName}
              onChange={handleInputChange}
              required
            />
            <BrutalInput
              placeholder="Last Name"
              name="lastName"
              value={formData.lastName}
              onChange={handleInputChange}
              required
            />
          </div>
          
          <BrutalInput
            type="email"
            placeholder="Email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            required
          />
          <BrutalInput
            type="tel"
            placeholder="Phone"
            name="phone"
            value={formData.phone}
            onChange={handleInputChange}
            required
          />
          <BrutalInput
            placeholder="Address"
            name="address"
            value={formData.address}
            onChange={handleInputChange}
            required
          />
          
          <div className="grid grid-cols-2 gap-4">
            <BrutalInput
              placeholder="City"
              name="city"
              value={formData.city}
              onChange={handleInputChange}
            />
            <BrutalInput
              placeholder="State"
              name="state"
              value={formData.state}
              onChange={handleInputChange}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <BrutalInput
              placeholder="PIN Code"
              name="pincode"
              value={formData.pincode}
              onChange={handleInputChange}
              required
            />
          </div>

          <h2 className="font-mono text-xl font-bold uppercase mb-4 pt-4">
            Payment
          </h2>
          
          <BrutalInput placeholder="Card Number" disabled className="opacity-50" />
          <div className="grid grid-cols-2 gap-4">
            <BrutalInput placeholder="MM/YY" disabled className="opacity-50" />
            <BrutalInput placeholder="CVC" disabled className="opacity-50" />
          </div>

          <p className="font-mono text-xs text-brutal-black/50">
            * Payment integration pending. This is a demo checkout.
          </p>

          <BrutalButton
            variant="accent"
            className="w-full mt-8"
            disabled={loading}
          >
            {loading ? "Transmitting..." : "Place Order"}
          </BrutalButton>
        </form>

        <div className="bg-cream border-brutal border-3 border-brutal-black p-6 h-fit" style={{ boxShadow: "4px 4px 0 #0A0A0A" }}>
          <h2 className="font-mono text-xl font-bold uppercase mb-4">Order Summary</h2>
          
          <div className="space-y-3 mb-6">
            {items.map(item => (
              <div key={item.id} className="flex justify-between text-sm">
                <span className="font-sans">{item.name} x{item.quantity}</span>
                <span className="font-mono">{formatPrice(item.price * item.quantity)}</span>
              </div>
            ))}
          </div>

          <div className="border-t-3 border-brutal-black pt-3">
            <div className="flex justify-between font-mono text-xl font-bold">
              <span>Total</span>
              <span className="text-accent">{formatPrice(totalPrice)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}