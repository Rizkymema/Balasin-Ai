import { Card } from "@/components/ui/card";
import { SectionHeading } from "@/components/ui/section-heading";
import { featurePillars } from "@/constants/product";

export function PlatformSection() {
  return (
    <section id="platform" className="mx-auto max-w-7xl px-6 py-24 lg:py-32 lg:px-8 border-t border-[var(--color-border)]">
      <SectionHeading
        eyebrow="Platform"
        title="Fondasi produk diarahkan ke operasional nyata, bukan demo AI kosong."
        description="Struktur halaman, modul, dan visual sistem dirancang untuk mendukung dashboard SaaS yang nantinya berkembang ke inbox, AI control center, knowledge base, dan channel operations."
      />

      <div className="mt-16 grid gap-6 md:grid-cols-3">
        {featurePillars.map((pillar) => (
          <Card key={pillar.title} className="space-y-6 p-8 bg-[var(--color-surface)]/50 hover:bg-[var(--color-surface)] transition-all duration-300 border border-[var(--color-border)] rounded-2xl flex flex-col justify-between">
            <div className="space-y-4">
              <h3 className="text-lg font-bold tracking-tight text-[var(--color-text)]">
                {pillar.title}
              </h3>
              <p className="text-xs sm:text-sm leading-relaxed text-[var(--color-muted)] font-normal">
                {pillar.description}
              </p>
            </div>
            <ul className="space-y-3 text-xs sm:text-sm text-[var(--color-muted)] font-medium pt-4 border-t border-[var(--color-border)]/50">
              {pillar.bullets.map((bullet) => (
                <li key={bullet} className="flex items-center gap-2.5">
                  <span className="h-1 w-1 rounded-full bg-[var(--color-brand)] shrink-0" />
                  {bullet}
                </li>
              ))}
            </ul>
          </Card>
        ))}
      </div>
    </section>
  );
}
