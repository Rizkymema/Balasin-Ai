import { roadmapItems } from "@/constants/product";

import { Card } from "@/components/ui/card";
import { SectionHeading } from "@/components/ui/section-heading";

export function RoadmapSection() {
  return (
    <section id="roadmap" className="mx-auto max-w-7xl px-6 py-24 lg:py-32 lg:px-8 border-t border-[var(--color-border)]">
      <SectionHeading
        eyebrow="Roadmap"
        title="Scope dibatasi agar fondasi tetap cepat selesai dan mudah berkembang."
        description="Iterasi awal ini fokus ke struktur, kualitas UI, dan kesiapan arsitektur. Integrasi live menyusul setelah fondasinya stabil."
      />

      <div className="mt-16 space-y-6 select-none">
        {roadmapItems.map((item) => (
          <Card
            key={item.phase}
            className="grid gap-6 border border-[var(--color-border)] bg-[var(--color-surface)]/20 p-8 rounded-2xl lg:grid-cols-[200px_1fr] hover:border-[var(--color-border-hover)] hover:bg-[var(--color-surface)]/40 transition-all duration-300"
          >
            <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 flex flex-col justify-center">
              <p className="text-[9px] font-bold uppercase tracking-[0.25em] text-[var(--color-muted)]">{item.phase}</p>
              <p className="mt-1.5 text-base font-bold text-[var(--color-text)] tracking-tight">
                {item.title}
              </p>
            </div>
            <div className="flex items-center">
              <p className="text-xs sm:text-sm leading-relaxed text-[var(--color-muted)] font-normal">{item.detail}</p>
            </div>
          </Card>
        ))}
      </div>
    </section>
  );
}
