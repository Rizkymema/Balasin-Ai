import { dashboardModules } from "@/constants/navigation";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Card } from "@/components/ui/card";
import { SectionHeading } from "@/components/ui/section-heading";

export function ModulesSection() {
  return (
    <section id="modules" className="mx-auto max-w-7xl px-6 py-24 lg:py-32 lg:px-8 border-t border-[var(--color-border)]">
      <SectionHeading
        eyebrow="Modules"
        title="Modul utama sudah dipetakan agar pertumbuhan fitur tetap terarah."
        description="Navigasi dan layout mengikuti konsep Balesin AI sejak awal supaya fitur baru tidak memaksa refactor arsitektur yang mahal."
      />

      <div className="mt-16 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
        {dashboardModules.map((module) => (
          <Card key={module.label} className="flex min-h-44 flex-col justify-between p-8 bg-[var(--color-surface)]/30 hover:bg-[var(--color-surface)] border border-[var(--color-border)] hover:border-[var(--color-border-hover)] rounded-2xl transition-all duration-300 group">
            <div className="space-y-3.5">
              <h3 className="text-base font-bold tracking-tight text-[var(--color-text)]">
                {module.label}
              </h3>
              <p className="text-xs leading-relaxed text-[var(--color-muted)] font-normal">
                {module.description}
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-[var(--color-border)]/50 flex items-center justify-end">
              <Link
                href={module.href}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--color-brand-blue)] hover:opacity-80 transition-all"
              >
                Buka Modul
                <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
              </Link>
            </div>
          </Card>
        ))}
      </div>
    </section>
  );
}
