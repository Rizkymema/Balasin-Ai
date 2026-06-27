import { workflowSteps } from "@/constants/product";

import { SectionHeading } from "@/components/ui/section-heading";

export function WorkflowSection() {
  return (
    <section id="workflow" className="mx-auto max-w-7xl px-6 py-24 lg:py-32 lg:px-8 border-t border-[var(--color-border)]">
      <SectionHeading
        eyebrow="Alur Kerja"
        title="Alur kerja AI dibangun dengan safety gate yang eksplisit."
        description="Pendekatan ini menjaga AI tetap berguna untuk operasional, tetapi tidak dibiarkan menjawab semua kasus secara gegabah."
      />

      <div className="mt-16 relative select-none">
        {/* Horizontal connection line for desktop screens */}
        <div className="hidden lg:block absolute top-[18px] left-[4%] right-[4%] h-[0.5px] bg-[var(--color-border)] z-0" />

        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-5 relative z-10">
          {workflowSteps.map((step, index) => (
            <div key={step.title} className="space-y-4">
              <div className="flex lg:flex-col items-center lg:items-start gap-4 lg:gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] text-[11px] font-bold text-[var(--color-text)]">
                  {index + 1}
                </div>
                <h3 className="text-sm font-bold text-[var(--color-text)] tracking-tight">
                  {step.title}
                </h3>
              </div>
              <p className="text-xs leading-relaxed text-[var(--color-muted)] font-normal">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
