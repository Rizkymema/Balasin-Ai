"use client";

import { useState } from "react";
import { workflowSteps } from "@/constants/product";
import { SectionHeading } from "@/components/ui/section-heading";
import { Check, Info } from "lucide-react";

export function WorkflowSection() {
  const [activeStep, setActiveStep] = useState<number | null>(null);

  return (
    <section id="workflow" className="mx-auto max-w-7xl px-6 py-24 lg:py-32 lg:px-8 border-t border-[var(--color-border)] bg-[var(--color-bg)]">
      <SectionHeading
        eyebrow=""
        title="Alur kerja AI dibangun dengan safety gate yang eksplisit."
        description="Pendekatan ini menjaga AI tetap berguna untuk operasional, tetapi tidak dibiarkan menjawab semua kasus secara gegabah."
      />

      <div className="mt-16 relative select-none">
        {/* Horizontal connection line for desktop screens */}
        <div className="hidden lg:block absolute top-[18px] left-[5%] right-[5%] h-[1px] bg-[var(--color-border)] z-0" />

        {/* Highlighted progress path */}
        {activeStep !== null && (
          <div 
            className="hidden lg:block absolute top-[18px] left-[5%] h-[1px] bg-[var(--color-brand)] z-0 transition-all duration-500" 
            style={{ width: `${(activeStep / 4) * 90}%` }}
          />
        )}

        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-5 relative z-10">
          {workflowSteps.map((step, index) => {
            const isHovered = activeStep === index;
            const isCompleted = activeStep !== null && index < activeStep;
            
            return (
              <div 
                key={step.title} 
                className="space-y-4 group cursor-pointer"
                onMouseEnter={() => setActiveStep(index)}
                onMouseLeave={() => setActiveStep(null)}
              >
                <div className="flex lg:flex-col items-center lg:items-start gap-4 lg:gap-3">
                  <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border transition-all duration-300 font-bold text-xs ${
                    isHovered
                      ? "border-[var(--color-brand)] bg-[var(--color-brand)] text-[var(--color-bg)] shadow-[0_0_12px_rgba(10,132,255,0.4)]"
                      : isCompleted
                      ? "border-[var(--color-brand-blue)] bg-[var(--color-brand-blue)]/20 text-[var(--color-brand)]"
                      : "border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)]"
                  }`}>
                    {isCompleted ? <Check className="h-3.5 w-3.5" /> : index + 1}
                  </div>
                  <h3 className={`text-sm font-bold tracking-tight transition-colors duration-200 ${
                    isHovered ? "text-[var(--color-brand)] font-extrabold" : "text-[var(--color-text)]"
                  }`}>
                    {step.title}
                  </h3>
                </div>
                
                <div className={`p-4 rounded-xl border transition-all duration-300 min-h-[96px] ${
                  isHovered
                    ? "bg-[var(--color-surface)] border-[var(--color-brand)]/20 shadow-md translate-y-[-2px]"
                    : "bg-[var(--color-surface)]/20 border-[var(--color-border)]"
                }`}>
                  <p className="text-xs leading-relaxed text-[var(--color-muted)] font-normal group-hover:text-[var(--color-text)] transition-colors duration-200">
                    {step.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
