"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useDesign } from "@/context/DesignContext";
import BrutalButton from "@/components/ui/BrutalButton";

const STEPS = [
  { num: 1, label: "Template" },
  { num: 2, label: "Color" },
  { num: 3, label: "Placement" },
  { num: 4, label: "Confirm" },
] as const;

export default function StepSelector() {
  const { state, goToStep, canProceed, nextStep, prevStep } = useDesign();

  return (
    <div className="flex flex-col gap-6">
      {/* Step progress bar */}
      <div className="flex items-stretch border-brutal border-3">
        {STEPS.map(({ num, label }, idx) => {
          const isActive = state.step === num;
          const isDone = state.step > num;
          const isClickable = isDone; // can navigate back to completed steps

          return (
            <button
              type="button"
              key={num}
              onClick={() => isClickable && goToStep(num)}
              disabled={!isClickable}
              className={`
                flex-1 flex flex-col items-center py-3 px-2 font-mono text-xs uppercase transition-all duration-150
                ${idx !== 0 ? "border-l-brutal border-l-3" : ""}
                ${isActive ? "bg-brutal-black text-cream" : ""}
                ${isDone ? "bg-accent/10 text-brutal-black cursor-pointer hover:bg-accent/20" : ""}
                ${!isActive && !isDone ? "bg-cream text-brutal-black/40" : ""}
              `}
            >
              <span className={`text-lg font-bold mb-0.5 ${isActive ? "text-accent" : isDone ? "text-accent" : ""}`}>
                {isDone ? "✓" : `0${num}`}
              </span>
              <span className="hidden sm:block">{label}</span>
            </button>
          );
        })}
      </div>

      {/* Navigation buttons */}
      <AnimatePresence mode="wait">
        <motion.div
          key={state.step}
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -10 }}
          className="flex items-center justify-between gap-4"
        >
          <BrutalButton
            variant="ghost"
            onClick={prevStep}
            disabled={state.step === 1}
            className="min-w-[100px]"
          >
            ← Back
          </BrutalButton>

          <span className="font-mono text-xs text-brutal-black/50 uppercase">
            Step {state.step} of 4
          </span>

          {state.step < 4 && (
            <BrutalButton
              variant="accent"
              onClick={nextStep}
              disabled={!canProceed}
              className="min-w-[100px]"
            >
              Next →
            </BrutalButton>
          )}

          {state.step === 4 && (
            <div className="min-w-[100px]" /> // spacer to keep layout balanced
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
