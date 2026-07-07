"use client";

import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { createTemplate } from "@/lib/designApi";
import BrutalButton from "@/components/ui/BrutalButton";
import BrutalInput from "@/components/ui/BrutalInput";
import type { PlacementSlot, ColorOption } from "@/types";

interface TemplateFormProps {
  productSlug: string;
  onSuccess: () => void;
}

export default function TemplateForm({ productSlug, onSuccess }: TemplateFormProps) {
  const [name, setName] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [placements, setPlacements] = useState<PlacementSlot[]>([]);
  const [colors, setColors] = useState<ColorOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // ─ Placement slot form state
  const [slotForm, setSlotForm] = useState<Omit<PlacementSlot, "id">>({
    label: "", x: 100, y: 100, width: 200, height: 150, type: "image",
  });

  // ─ Color form state
  const [colorForm, setColorForm] = useState<ColorOption>({ id: "", hex: "#000000", label: "" });

  const handleImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setImageFile(file);
    if (file) setImagePreview(URL.createObjectURL(file));
  };

  const addSlot = () => {
    if (!slotForm.label) return;
    const id = slotForm.label.toLowerCase().replace(/\s+/g, "_");
    setPlacements((prev) => [...prev, { id, ...slotForm }]);
    setSlotForm({ label: "", x: 100, y: 100, width: 200, height: 150, type: "image" });
  };

  const removeSlot = (id: string) => setPlacements((p) => p.filter((s) => s.id !== id));

  const addColor = () => {
    if (!colorForm.label || !colorForm.hex) return;
    const id = colorForm.label.toLowerCase().replace(/\s+/g, "_");
    setColors((prev) => [...prev, { ...colorForm, id }]);
    setColorForm({ id: "", hex: "#000000", label: "" });
  };

  const removeColor = (id: string) => setColors((c) => c.filter((col) => col.id !== id));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !imageFile || placements.length === 0 || colors.length === 0) {
      setError("Please fill all fields, add at least 1 slot and 1 color.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await createTemplate(
        { product_id: productSlug, name, placements, colors, is_active: true, base_image_url: "" },
        imageFile
      );
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create template");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {error && (
        <div className="border-brutal border-3 border-accent bg-accent/10 p-4">
          <p className="font-mono text-sm text-accent uppercase">{error}</p>
        </div>
      )}

      {/* Template name */}
      <BrutalInput
        placeholder="Template Name (e.g., Front Print — Classic)"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
      />

      {/* Base image */}
      <div>
        <label className="font-mono text-sm uppercase mb-2 block">Base Product Image</label>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          onChange={handleImage}
          className="w-full px-4 py-3 font-sans text-sm border-brutal border-3 bg-cream file:mr-4 file:py-2 file:px-4 file:border-0 file:bg-brutal-black file:text-cream file:font-mono file:uppercase file:cursor-pointer"
          required
        />
        {imagePreview && (
          <div className="mt-3 border-brutal border-3 inline-block">
            <img src={imagePreview} alt="" className="h-48 object-contain" />
          </div>
        )}
        <p className="font-mono text-xs text-brutal-black/50 mt-2 uppercase">
          Use a transparent PNG for best results. Recommended: 600×600px.
        </p>
      </div>

      {/* ─── Placement Slots ─────────────────────────────────────────────── */}
      <div className="border-brutal border-3 p-5 space-y-4">
        <h3 className="font-mono text-sm uppercase font-bold border-b border-brutal-black/20 pb-3">
          Placement Slots ({placements.length})
        </h3>

        {/* Image reference */}
        {imagePreview && (
          <div className="relative inline-block border-brutal border-2">
            <img src={imagePreview} alt="" style={{ width: 300, height: 300, objectFit: "contain" }} />
            {placements.map((slot) => (
              <div
                key={slot.id}
                className="absolute border-2 border-accent bg-accent/20"
                style={{
                  left: (slot.x / 600) * 300,
                  top: (slot.y / 600) * 300,
                  width: (slot.width / 600) * 300,
                  height: (slot.height / 600) * 300,
                }}
                title={slot.label}
              />
            ))}
          </div>
        )}

        {/* Slot form */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <BrutalInput placeholder="Label (e.g., Front Center)" value={slotForm.label}
            onChange={(e) => setSlotForm((s) => ({ ...s, label: e.target.value }))} />
          <div className="flex gap-2">
            <BrutalInput placeholder="X" type="number" value={String(slotForm.x)}
              onChange={(e) => setSlotForm((s) => ({ ...s, x: +e.target.value }))} />
            <BrutalInput placeholder="Y" type="number" value={String(slotForm.y)}
              onChange={(e) => setSlotForm((s) => ({ ...s, y: +e.target.value }))} />
          </div>
          <div className="flex gap-2">
            <BrutalInput placeholder="W" type="number" value={String(slotForm.width)}
              onChange={(e) => setSlotForm((s) => ({ ...s, width: +e.target.value }))} />
            <BrutalInput placeholder="H" type="number" value={String(slotForm.height)}
              onChange={(e) => setSlotForm((s) => ({ ...s, height: +e.target.value }))} />
          </div>
          <select
            value={slotForm.type}
            onChange={(e) => setSlotForm((s) => ({ ...s, type: e.target.value as PlacementSlot["type"] }))}
            className="font-mono text-sm uppercase px-4 py-3 border-brutal border-3 bg-cream"
          >
            <option value="image">Image</option>
            <option value="text">Text</option>
            <option value="logo">Logo</option>
          </select>
          <BrutalButton type="button" variant="ghost" onClick={addSlot} className="col-span-2 md:col-span-2">
            + Add Slot
          </BrutalButton>
        </div>

        {/* Slot list */}
        {placements.map((slot) => (
          <motion.div key={slot.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="flex items-center justify-between p-3 border-brutal border-2 bg-cream/50 font-mono text-xs uppercase">
            <span className="font-bold">{slot.label}</span>
            <span className="text-brutal-black/50">({slot.x},{slot.y}) {slot.width}×{slot.height} {slot.type}</span>
            <button type="button" aria-label="Remove slot" onClick={() => removeSlot(slot.id)} className="text-accent hover:underline">✕</button>
          </motion.div>
        ))}
      </div>

      {/* ─── Color Palette ────────────────────────────────────────────────── */}
      <div className="border-brutal border-3 p-5 space-y-4">
        <h3 className="font-mono text-sm uppercase font-bold border-b border-brutal-black/20 pb-3">
          Color Palette ({colors.length})
        </h3>
        <div className="flex gap-3 items-end flex-wrap">
          <BrutalInput placeholder="Label (e.g., Void Black)" value={colorForm.label}
            onChange={(e) => setColorForm((c) => ({ ...c, label: e.target.value }))} />
          <div className="flex items-center gap-2 border-brutal border-3 bg-cream px-3">
            <label className="font-mono text-xs uppercase text-brutal-black/60">Hex</label>
            <input type="color" value={colorForm.hex}
              onChange={(e) => setColorForm((c) => ({ ...c, hex: e.target.value }))}
              className="w-10 h-10 cursor-pointer border-0 bg-transparent" />
            <span className="font-mono text-xs">{colorForm.hex}</span>
          </div>
          <BrutalButton type="button" variant="ghost" onClick={addColor}>+ Add Color</BrutalButton>
        </div>

        <div className="flex flex-wrap gap-3">
          {colors.map((col) => (
            <motion.div key={col.id} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-2 border-brutal border-2 p-2 bg-cream">
              <div className="w-6 h-6 border border-brutal-black" style={{ backgroundColor: col.hex }} />
              <span className="font-mono text-xs uppercase">{col.label}</span>
              <button type="button" aria-label="Remove color" onClick={() => removeColor(col.id)} className="font-mono text-xs text-accent">✕</button>
            </motion.div>
          ))}
        </div>
      </div>

      <BrutalButton variant="accent" className="w-full" disabled={loading}>
        {loading ? "Saving template..." : "Create Template"}
      </BrutalButton>
    </form>
  );
}
