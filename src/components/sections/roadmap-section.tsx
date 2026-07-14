import { roadmapItems } from "@/constants/product";
import { Card } from "@/components/ui/card";
import { SectionHeading } from "@/components/ui/section-heading";
import { CheckCircle2, Clock, ShieldAlert } from "lucide-react";

export function RoadmapSection() {
  return (
    <section id="roadmap" className="mx-auto max-w-7xl px-6 py-24 lg:py-32 lg:px-8 border-t border-[var(--color-border)] bg-[var(--color-bg)]">
      <SectionHeading
        eyebrow=""
        title="Scope dibatasi agar fondasi tetap cepat selesai dan mudah berkembang."
        description="Iterasi awal ini fokus ke struktur, kualitas UI, dan kesiapan arsitektur. Integrasi live menyusul setelah fondasinya stabil."
      />

      <div className="mt-16 space-y-6 select-none">
        {roadmapItems.map((item, idx) => {
          // Status tagging based on indices
          let statusLabel = "Rencana Masa Depan";
          let statusColor = "text-[var(--color-muted)] border-[var(--color-border)]";
          let StatusIcon = Clock;

          if (idx === 0) {
            statusLabel = "Fase Aktif (MVP V1)";
            statusColor = "text-[var(--color-success)] bg-[var(--color-success)]/10 border-[var(--color-success)]/20";
            StatusIcon = CheckCircle2;
          } else if (idx === 1) {
            statusLabel = "Fase Berikutnya (V2)";
            statusColor = "text-[var(--color-brand)] bg-[var(--color-brand)]/10 border-[var(--color-brand)]/20";
            StatusIcon = Clock;
          }

          return (
            <Card
              key={item.phase}
              className={`grid gap-6 border p-8 rounded-2xl lg:grid-cols-[240px_1fr] transition-all duration-300 ${
                idx === 0 
                  ? "border-[var(--color-success)]/30 bg-[var(--color-surface)] shadow-sm"
                  : "border-[var(--color-border)] bg-[var(--color-surface)]/20 hover:border-[var(--color-border-hover)] hover:bg-[var(--color-surface)]/40"
              }`}
            >
              <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 flex flex-col justify-between min-h-[120px]">
                <div>
                  <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-[var(--color-muted)]">{item.phase}</p>
                  <p className="mt-1.5 text-base font-bold text-[var(--color-text)] tracking-tight">
                    {item.title}
                  </p>
                </div>
                
                {/* Visual Status Badge */}
                <div className={`mt-4 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[9px] font-extrabold uppercase tracking-wide max-w-fit ${statusColor}`}>
                  <StatusIcon className="h-3 w-3 shrink-0" />
                  {statusLabel}
                </div>
              </div>
              <div className="flex items-center">
                <p className="text-xs sm:text-sm leading-relaxed text-[var(--color-muted)] font-normal">{item.detail}</p>
              </div>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
