"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useCart } from "@/context/CartContext";
import { 
  useUser,
  SignInButton, 
  UserButton 
} from "@clerk/nextjs";

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { totalItems } = useCart();
  const { isSignedIn, user } = useUser();

  const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'varungupta010307@gmail.com';
  const isAdmin = isSignedIn && user?.emailAddresses[0]?.emailAddress === adminEmail;

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-cream border-b-brutal border-brutal border-b-3">
      <nav className="flex items-center justify-between px-4 py-3 max-w-7xl mx-auto">
        <Link 
          href="/" 
          className="font-mono text-2xl font-bold uppercase tracking-tight hover:text-accent transition-colors"
        >
          Unwearable
        </Link>

        <div className="hidden md:flex items-center gap-8">
          <Link href="/" className="font-mono text-sm uppercase hover:text-accent transition-colors">
            Home
          </Link>
          {isAdmin && (
            <Link href="/admin" className="font-mono text-sm uppercase text-accent font-bold hover:text-brutal-black transition-colors">
              Admin
            </Link>
          )}
          <Link href="/shop" className="font-mono text-sm uppercase hover:text-accent transition-colors">
            Shop
          </Link>
          <Link 
            href="/cart" 
            className="font-mono text-sm uppercase flex items-center gap-2 hover:text-accent transition-colors"
          >
            Cart
            {totalItems > 0 && (
              <span className="bg-accent text-cream px-2 py-0.5 text-xs font-bold">
                {totalItems}
              </span>
            )}
          </Link>

          <div className="border-l-brutal border-l-2 pl-8 flex items-center">
            {!isSignedIn ? (
              <SignInButton mode="modal">
                <button className="font-mono text-sm uppercase hover:text-accent transition-colors">
                  Sign In
                </button>
              </SignInButton>
            ) : (
              <UserButton 
                appearance={{
                  elements: {
                    userButtonBox: "border-brutal border-2 hover:scale-105 transition-transform",
                  }
                }}
              />
            )}
          </div>
        </div>

        <button
          className="md:hidden border-brutal border-3 p-2 bg-cream"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          <div className="w-6 h-0.5 bg-brutal-black mb-1.5 transition-all" />
          <div className="w-6 h-0.5 bg-brutal-black mb-1.5 transition-all" />
          <div className="w-6 h-0.5 bg-brutal-black transition-all" />
        </button>
      </nav>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="md:hidden bg-cream border-b-brutal border-b-3 overflow-hidden"
          >
            <div className="flex flex-col p-4 gap-4">
              <Link 
                href="/" 
                className="font-mono text-xl uppercase border-brutal border-3 p-4 text-center bg-cream hover:bg-accent hover:text-cream transition-colors"
                onClick={() => setMobileOpen(false)}
              >
                Home
              </Link>
              {isAdmin && (
                <Link 
                  href="/admin" 
                  className="font-mono text-xl uppercase border-brutal border-3 p-4 text-center bg-accent text-cream hover:bg-brutal-black transition-colors"
                  onClick={() => setMobileOpen(false)}
                >
                  Admin Dashboard
                </Link>
              )}
              <Link 
                href="/shop" 
                className="font-mono text-xl uppercase border-brutal border-3 p-4 text-center bg-cream hover:bg-accent hover:text-cream transition-colors"
                onClick={() => setMobileOpen(false)}
              >
                Shop
              </Link>
              <Link 
                href="/cart" 
                className="font-mono text-xl uppercase border-brutal border-3 p-4 text-center bg-cream hover:bg-accent hover:text-cream transition-colors flex justify-center items-center gap-3"
                onClick={() => setMobileOpen(false)}
              >
                Cart
                {totalItems > 0 && (
                  <span className="bg-accent text-cream px-2 py-1 text-sm font-bold">
                    {totalItems}
                  </span>
                )}
              </Link>
              
              <div className="pt-4 border-t-brutal border-t-3">
                {!isSignedIn ? (
                  <SignInButton mode="modal">
                    <button className="w-full font-mono text-xl uppercase border-brutal border-3 p-4 text-center bg-accent text-cream hover:bg-brutal-black transition-colors">
                      Sign In
                    </button>
                  </SignInButton>
                ) : (
                  <div className="flex items-center justify-center p-4 border-brutal border-3 bg-cream">
                    <UserButton showName />
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}