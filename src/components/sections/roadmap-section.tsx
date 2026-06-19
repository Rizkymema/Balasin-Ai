import { roadmapItems } from "@/constants/product";

import { Card } from "@/components/ui/card";
import { SectionHeading } from "@/components/ui/section-heading";

export function RoadmapSection() {
  return (
    <section id="roadmap" className="mx-auto max-w-7xl px-6 py-20 lg:px-8 border-t border-[var(--color-border)]">
      <SectionHeading
        eyebrow="Roadmap"
        title="Scope dibatasi agar fondasi tetap cepat selesai dan mudah berkembang."
        description="Iterasi awal ini fokus ke struktur, kualitas UI, dan kesiapan arsitektur. Integrasi live menyusul setelah fondasinya stabil."
      />

      <div className="mt-12 space-y-5">
        {roadmapItems.map((item) => (
          <Card
            key={item.phase}
            className="grid gap-5 border-[var(--color-border)] lg:grid-cols-[180px_1fr] p-5 hover:border-[var(--color-border-hover)] transition-all"
          >
            <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-hover)] p-4 flex flex-col justify-center">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-brand)]">{item.phase}</p>
              <p className="mt-1 text-xl font-bold text-[var(--color-text)] tracking-tight">
                {item.title}
              </p>
            </div>
            <div className="flex items-center">
              <p className="text-sm leading-relaxed text-[var(--color-muted)]">{item.detail}</p>
            </div>
          </Card>
        ))}
      </div>
    </section>
  );
}
