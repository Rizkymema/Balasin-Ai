import { workflowSteps } from "@/constants/product";

import { SectionHeading } from "@/components/ui/section-heading";

export function WorkflowSection() {
  return (
    <section id="workflow" className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
      <SectionHeading
        eyebrow="Alur Kerja"
        title="Alur kerja AI dibangun dengan safety gate yang eksplisit."
        description="Pendekatan ini menjaga AI tetap berguna untuk operasional, tetapi tidak dibiarkan menjawab semua kasus secara gegabah."
      />

      <div className="mt-12 relative">
        {/* Horizontal connection line for desktop screens */}
        <div className="hidden lg:block absolute top-[20px] left-[3%] right-[3%] h-px bg-[var(--color-border)] z-0" />

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-5 relative z-10">
          {workflowSteps.map((step, index) => (
            <div key={step.title} className="space-y-4">
              <div className="flex lg:flex-col items-center lg:items-start gap-4 lg:gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] text-xs font-bold text-[var(--color-brand)] shadow-[0_0_10px_rgba(0,210,255,0.05)]">
                  {index + 1}
                </div>
                <h3 className="text-lg font-bold text-[var(--color-text)] tracking-tight">
                  {step.title}
                </h3>
              </div>
              <p className="text-xs leading-relaxed text-[var(--color-muted)]">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
