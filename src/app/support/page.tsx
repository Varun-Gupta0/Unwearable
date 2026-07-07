import React from "react";
import { Mail, MessageCircle, FileQuestion, ArrowRight } from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "Support | Unwearable",
  description: "Get help with your Unwearable orders, designs, and account.",
};

export default function SupportPage() {
  const faqs = [
    {
      question: "How long does shipping take?",
      answer: "Orders are typically processed within 2-3 business days. Delivery takes 5-7 business days depending on your location.",
    },
    {
      question: "Can I return a custom designed product?",
      answer: "Because custom designs are made to order, we only accept returns if the product is defective or damaged upon arrival.",
    },
    {
      question: "How do I track my order?",
      answer: "Once your order ships, you will receive a tracking link via email. You can also view your order status in the My Orders section on the cart page if you are signed in.",
    },
    {
      question: "What is your print quality like?",
      answer: "We use state-of-the-art DTG (Direct-to-Garment) printing ensuring vibrant colors and long-lasting prints that survive the wash.",
    }
  ];

  return (
    <main className="min-h-screen bg-cream p-6 pb-20">
      <div className="max-w-4xl mx-auto space-y-12">
        {/* Header Section */}
        <section className="border-brutal border-3 border-brutal-black bg-accent p-8 md:p-12 text-cream" style={{ boxShadow: "8px 8px 0 #0A0A0A" }}>
          <h1 className="font-mono text-4xl md:text-6xl font-bold uppercase mb-4 tracking-tight">
            How can we help?
          </h1>
          <p className="font-sans text-lg md:text-xl max-w-2xl">
            Got a question about an order, our printing process, or just want to say hi? We're here for you.
          </p>
        </section>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Contact Card 1 */}
          <div className="border-brutal border-3 border-brutal-black bg-white p-6 hover:-translate-y-1 hover:translate-x-1 transition-transform" style={{ boxShadow: "6px 6px 0 #0A0A0A" }}>
            <div className="flex items-center gap-3 mb-4 text-brutal-black">
              <Mail className="h-8 w-8" />
              <h2 className="font-mono text-2xl font-bold uppercase">Email Us</h2>
            </div>
            <p className="text-brutal-gray font-sans mb-6">
              Drop us a line anytime. We usually respond within 24 hours.
            </p>
            <a href="mailto:support@unwearable.com" className="inline-flex items-center gap-2 bg-brutal-black text-cream px-4 py-2 font-bold uppercase hover:bg-accent transition-colors">
              support@unwearable.com <ArrowRight className="h-4 w-4" />
            </a>
          </div>

          {/* Contact Card 2 */}
          <div className="border-brutal border-3 border-brutal-black bg-white p-6 hover:-translate-y-1 hover:translate-x-1 transition-transform" style={{ boxShadow: "6px 6px 0 #0A0A0A" }}>
            <div className="flex items-center gap-3 mb-4 text-brutal-black">
              <MessageCircle className="h-8 w-8" />
              <h2 className="font-mono text-2xl font-bold uppercase">Live Chat</h2>
            </div>
            <p className="text-brutal-gray font-sans mb-6">
              Need immediate assistance? Chat with our support team.
            </p>
            <button type="button" className="inline-flex items-center gap-2 bg-brutal-black text-cream px-4 py-2 font-bold uppercase hover:bg-accent transition-colors disabled:opacity-50" disabled>
              Unavailable <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* FAQ Section */}
        <section>
          <div className="flex items-center gap-3 mb-8 text-brutal-black">
            <FileQuestion className="h-8 w-8" />
            <h2 className="font-mono text-3xl md:text-4xl font-bold uppercase">Frequently Asked Questions</h2>
          </div>
          
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div 
                key={index} 
                className="border-brutal border-3 border-brutal-black bg-white p-6"
                style={{ boxShadow: "4px 4px 0 #0A0A0A" }}
              >
                <h3 className="font-mono text-xl font-bold uppercase mb-2 text-brutal-black">
                  {faq.question}
                </h3>
                <p className="font-sans text-brutal-gray">
                  {faq.answer}
                </p>
              </div>
            ))}
          </div>
        </section>

      </div>
    </main>
  );
}
