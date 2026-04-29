"use client";

import { useState } from "react";
import Script from "next/script";
import { motion } from "framer-motion";
import BrutalButton from "@/components/ui/BrutalButton";
import BrutalInput from "@/components/ui/BrutalInput";
import { useCart } from "@/context/CartContext";
import { useUser } from "@clerk/nextjs";
import { formatPrice } from "@/lib/utils";

interface CheckoutForm {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
}

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Razorpay: new (options: Record<string, unknown>) => { open: () => void };
  }
}

export default function CheckoutPage() {
  const { items, totalPrice, clearCart } = useCart();
  const { user } = useUser();
  const [submitted, setSubmitted] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [orderNumber, setOrderNumber] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<CheckoutForm>({
    firstName: "",
    lastName: "",
    email: user?.primaryEmailAddress?.emailAddress ?? "",
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

    try {
      // ── Step 1: Create Razorpay order + save pending order in DB ──────────
      const createRes = await fetch("/api/payment/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
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
            name: item.name,
            quantity: item.quantity,
            price: item.price,
            selectedSize: item.selectedSize,
            selectedColorId: item.selectedColorId,
            designId: item.designId,
            designImageUrl: item.designImageUrl,
          })),
          totalAmount: Math.round(totalPrice * 100), // convert ₹ to paise
        }),
      });

      const createData = await createRes.json();
      if (!createRes.ok) throw new Error(createData.error || "Failed to create payment order.");

      const { rz_order_id, rz_key, order_id, order_number } = createData;

      // ── Step 2: Open Razorpay checkout modal ──────────────────────────────
      await new Promise<void>((resolve, reject) => {
        const rzp = new window.Razorpay({
          key: rz_key,
          amount: Math.round(totalPrice * 100),
          currency: "INR",
          name: "Unwearable",
          description: `Order ${order_number}`,
          order_id: rz_order_id,
          prefill: {
            name: `${formData.firstName} ${formData.lastName}`.trim(),
            email: formData.email,
            contact: formData.phone,
          },
          theme: { color: "#FF3E00" },
          handler: async (response: {
            razorpay_order_id: string;
            razorpay_payment_id: string;
            razorpay_signature: string;
          }) => {
            try {
              // ── Step 3: Verify payment HMAC signature on server ────────────
              const verifyRes = await fetch("/api/payment/verify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  rz_order_id: response.razorpay_order_id,
                  rz_payment_id: response.razorpay_payment_id,
                  rz_signature: response.razorpay_signature,
                  order_id,
                }),
              });

              const verifyData = await verifyRes.json();
              if (!verifyRes.ok || !verifyData.success) {
                throw new Error(verifyData.error || "Payment verification failed.");
              }

              // ── Step 4: Success — clear cart and show confirmation ─────────
              clearCart();
              setOrderId(order_id);
              setOrderNumber(order_number);
              setSubmitted(true);
              resolve();
            } catch (err) {
              reject(err);
            }
          },
          modal: {
            ondismiss: () => {
              reject(new Error("Payment cancelled. Your cart has been preserved."));
            },
          },
        });
        rzp.open();
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
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
          <div className="text-5xl mb-4">✓</div>
          <h1 className="font-mono text-4xl md:text-5xl font-bold uppercase mb-4 text-accent">
            Order Confirmed.
          </h1>
          <h2 className="font-mono text-xl font-bold uppercase mb-8 text-brutal-black">
            We&apos;re printing your design.
          </h2>

          <div className="border-brutal border-3 border-brutal-black p-6 mb-8 text-left space-y-3">
            {orderNumber && (
              <div className="flex justify-between font-mono text-sm">
                <span className="text-brutal-black/60 uppercase">Order Number</span>
                <span className="font-bold tracking-widest">{orderNumber}</span>
              </div>
            )}
            {orderId && (
              <div className="flex justify-between font-mono text-sm">
                <span className="text-brutal-black/60 uppercase">Order ID</span>
                <span className="font-bold text-xs">{orderId}</span>
              </div>
            )}
            <div className="flex justify-between font-mono text-sm">
              <span className="text-brutal-black/60 uppercase">Total Paid</span>
              <span className="font-bold text-accent">{formatPrice(totalPrice)}</span>
            </div>
          </div>

          <p className="font-sans text-sm text-brutal-black/60 mb-8">
            A confirmation will be sent to <strong>{formData.email}</strong>
          </p>
          <BrutalButton href="/shop">Continue Shopping</BrutalButton>
        </motion.div>
      </div>
    );
  }

  return (
    <>
      {/* Load Razorpay SDK */}
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />

      <div className="px-4 py-8 max-w-6xl mx-auto">
        <h1 className="font-mono text-4xl md:text-5xl font-bold uppercase mb-8">Checkout</h1>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="border-brutal border-3 border-accent bg-accent/10 p-4 mb-8"
            style={{ boxShadow: "4px 4px 0 #FF3E00" }}
          >
            <p className="font-mono text-sm uppercase text-accent">⚠ {error}</p>
          </motion.div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <h2 className="font-mono text-xl font-bold uppercase mb-4">Shipping Info</h2>

            <div className="grid grid-cols-2 gap-4">
              <BrutalInput placeholder="First Name" name="firstName" value={formData.firstName} onChange={handleInputChange} required />
              <BrutalInput placeholder="Last Name" name="lastName" value={formData.lastName} onChange={handleInputChange} required />
            </div>
            <BrutalInput type="email" placeholder="Email" name="email" value={formData.email} onChange={handleInputChange} required />
            <BrutalInput type="tel" placeholder="Phone (10 digits)" name="phone" value={formData.phone} onChange={handleInputChange} required />
            <BrutalInput placeholder="Full Address" name="address" value={formData.address} onChange={handleInputChange} required />

            <div className="grid grid-cols-2 gap-4">
              <BrutalInput placeholder="City" name="city" value={formData.city} onChange={handleInputChange} required />
              <BrutalInput placeholder="State" name="state" value={formData.state} onChange={handleInputChange} required />
            </div>

            <BrutalInput placeholder="PIN Code" name="pincode" value={formData.pincode} onChange={handleInputChange} required />

            <div className="border-brutal border-3 border-brutal-black/30 p-4 bg-brutal-black/5">
              <p className="font-mono text-xs uppercase text-brutal-black/60 mb-2">Secure Payment via Razorpay</p>
              <p className="font-sans text-sm text-brutal-black/80">
                You will be redirected to Razorpay&apos;s secure checkout to complete your payment.
                Supports UPI, Cards, NetBanking.
              </p>
            </div>

            <BrutalButton variant="accent" className="w-full mt-4" disabled={loading}>
              {loading ? "Preparing Payment..." : `Pay ${formatPrice(totalPrice)}`}
            </BrutalButton>
          </form>

          {/* Order Summary */}
          <div className="bg-cream border-brutal border-3 border-brutal-black p-6 h-fit" style={{ boxShadow: "4px 4px 0 #0A0A0A" }}>
            <h2 className="font-mono text-xl font-bold uppercase mb-4">Order Summary</h2>

            <div className="space-y-3 mb-6">
              {items.map((item, idx) => (
                <div key={`${item.id}-${idx}`} className="flex items-center gap-3 text-sm">
                  {item.designImageUrl && (
                    <img src={item.designImageUrl} alt="Design" className="w-10 h-10 object-cover border border-brutal-black/20" />
                  )}
                  <div className="flex-1">
                    <span className="font-sans block">{item.name} ×{item.quantity}</span>
                    {item.designId && <span className="font-mono text-[10px] uppercase text-accent">✦ Custom</span>}
                  </div>
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

            <p className="font-sans text-xs text-brutal-black/40 mt-4">
              Prices include all taxes. Shipping calculated at payment.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}