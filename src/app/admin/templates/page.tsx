"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import TemplateForm from "@/components/admin/TemplateForm";
import TemplateList from "@/components/admin/TemplateList";
import BrutalButton from "@/components/ui/BrutalButton";
import BrutalInput from "@/components/ui/BrutalInput";

export default function AdminTemplatesPage() {
  const [productSlug, setProductSlug] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleSuccess = () => {
    setShowForm(false);
    setRefreshKey((k) => k + 1);
  };

  return (
    <div className="px-4 py-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <nav aria-label="Admin Navigation" className="font-mono text-sm uppercase text-brutal-black/50 mb-2">
          <a href="/admin" className="hover:text-accent">Admin</a>
          <span className="mx-2">/</span>
          <span>Templates</span>
        </nav>
        <h1 className="font-mono text-4xl md:text-5xl font-bold uppercase">
          Design Templates
        </h1>
        <p className="font-sans text-brutal-black/60 mt-2">
          Create and manage product customization templates.
        </p>
      </div>

      {/* Create template section */}
      <div className="border-brutal border-3 mb-8 overflow-hidden">
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="w-full flex items-center justify-between p-5 bg-brutal-black text-cream font-mono text-sm uppercase hover:bg-accent transition-colors"
        >
          <span>+ Create New Template</span>
          <span className="text-lg">{showForm ? "−" : "+"}</span>
        </button>

        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="p-6 space-y-4">
                <div>
                  <label className="font-mono text-sm uppercase mb-2 block">
                    Product Slug (links template to product)
                  </label>
                  <BrutalInput
                    placeholder="e.g., 404-not-found-tee"
                    value={productSlug}
                    onChange={(e) => setProductSlug(e.target.value)}
                  />
                  <p className="font-mono text-xs text-brutal-black/50 mt-1 uppercase">
                    Must match the product&apos;s slug exactly.
                  </p>
                </div>

                {productSlug ? (
                  <TemplateForm productSlug={productSlug} onSuccess={handleSuccess} />
                ) : (
                  <p className="font-mono text-sm text-brutal-black/40 uppercase border-brutal border-2 border-dashed p-4 text-center">
                    Enter a product slug above to configure the template.
                  </p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Template list */}
      <div>
        <h2 className="font-mono text-lg uppercase mb-4 border-b-brutal border-b-3 pb-3">
          All Templates
        </h2>
        <TemplateList key={refreshKey} />
      </div>
    </div>
  );
}
