import { Card } from "@/components/ui/card";
import { SectionHeading } from "@/components/ui/section-heading";
import { featurePillars } from "@/constants/product";

export function PlatformSection() {
  return (
    <section id="platform" className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
      <SectionHeading
        eyebrow="Platform"
        title="Fondasi produk diarahkan ke operasional nyata, bukan demo AI kosong."
        description="Struktur halaman, modul, dan visual sistem dirancang untuk mendukung dashboard SaaS yang nantinya berkembang ke inbox, AI control center, knowledge base, dan channel operations."
      />

      <div className="mt-12 grid gap-6 lg:grid-cols-3">
        {featurePillars.map((pillar) => (
          <Card key={pillar.title} className="space-y-5">
            <div className="space-y-3">
              <h3 className="text-2xl font-semibold tracking-[-0.04em] text-white">
                {pillar.title}
              </h3>
              <p className="text-sm leading-7 text-slate-300">{pillar.description}</p>
            </div>
            <ul className="space-y-3 text-sm text-slate-300 font-medium">
              {pillar.bullets.map((bullet) => (
                <li key={bullet} className="flex items-center gap-3">
                  <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-brand)]" />
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
