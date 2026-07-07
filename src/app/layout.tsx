import type { Metadata } from "next";
import { Space_Mono, Inter } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";
import { CartProvider } from "@/context/CartContext";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

const spaceMono = Space_Mono({
  variable: "--font-mono",
  weight: ["400", "700"],
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Unwearable — Fashion is Dead",
  description: "Raw, high-contrast brutalist e-commerce. Wear the void.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en" className={`${spaceMono.variable} ${inter.variable} h-full antialiased`}>
        <body className="min-h-full flex flex-col bg-cream text-brutal-black" suppressHydrationWarning>
          <CartProvider>
            <Navbar />
            <main className="flex-1 pt-[72px]">
              {children}
            </main>
            <Footer />
          </CartProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
