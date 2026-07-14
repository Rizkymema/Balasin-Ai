import { Card } from "@/components/ui/card";
import { SectionHeading } from "@/components/ui/section-heading";
import { featurePillars } from "@/constants/product";

export function PlatformSection() {
  return (
    <section id="platform" className="mx-auto max-w-7xl px-6 py-24 lg:py-32 lg:px-8 border-t border-[var(--color-border)]">
      <SectionHeading
        eyebrow=""
        title="Fondasi produk diarahkan ke operasional nyata, bukan demo AI kosong."
        description="Struktur halaman, modul, dan visual sistem dirancang untuk mendukung dashboard SaaS yang nantinya berkembang ke inbox, AI control center, knowledge base, dan channel operations."
      />

      <div className="mt-16 grid gap-6 md:grid-cols-3 items-stretch">
        {featurePillars.map((pillar, idx) => {
          const isHighlighted = idx === 1; // Highlight the AI assistant pillar
          return (
            <Card 
              key={pillar.title} 
              className={`space-y-6 p-8 transition-all duration-300 rounded-2xl flex flex-col justify-between ${
                isHighlighted 
                  ? "bg-[var(--color-surface)] border-2 border-[var(--color-brand)] shadow-[0_8px_30px_rgb(10,132,255,0.06)] relative md:-translate-y-2 scale-[1.02]"
                  : "bg-[var(--color-surface)]/30 hover:bg-[var(--color-surface)]/60 border border-[var(--color-border)] hover:border-[var(--color-border-hover)]"
              }`}
            >
              {isHighlighted && (
                <div className="absolute top-0 right-6 -translate-y-1/2 rounded-full bg-[var(--color-brand)] text-[var(--color-bg)] px-3 py-0.5 text-[9px] font-extrabold uppercase tracking-wider">
                  Safety Guard Core
                </div>
              )}
              <div className="space-y-4">
                <h3 className="text-lg font-bold tracking-tight text-[var(--color-text)]">
                  {pillar.title}
                </h3>
                <p className="text-xs sm:text-sm leading-relaxed text-[var(--color-muted)] font-normal">
                  {pillar.description}
                </p>
              </div>
              <ul className="space-y-3 text-xs sm:text-sm text-[var(--color-muted)] font-medium pt-6 border-t border-[var(--color-border)]/50 mt-6">
                {pillar.bullets.map((bullet) => (
                  <li key={bullet} className="flex items-center gap-2.5">
                    <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${isHighlighted ? "bg-[var(--color-brand)]" : "bg-[var(--color-muted)]"}`} />
                    {bullet}
                  </li>
                ))}
              </ul>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
