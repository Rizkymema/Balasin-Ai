import { dashboardModules } from "@/constants/navigation";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Card } from "@/components/ui/card";
import { SectionHeading } from "@/components/ui/section-heading";

export function ModulesSection() {
  return (
    <section id="modules" className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
      <SectionHeading
        eyebrow="Modules"
        title="Modul utama sudah dipetakan agar pertumbuhan fitur tetap terarah."
        description="Navigasi dan layout mengikuti konsep Balesin AI sejak awal supaya fitur baru tidak memaksa refactor arsitektur yang mahal."
      />

      <div className="mt-12 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {dashboardModules.map((module) => (
          <Card key={module.label} className="flex min-h-40 flex-col justify-between hover:border-[var(--color-border-hover)] transition-all">
            <div className="space-y-3">
              <h3 className="text-xl font-bold tracking-tight text-[var(--color-text)]">
                {module.label}
              </h3>
              <p className="text-xs leading-relaxed text-[var(--color-muted)]">
                {module.description}
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-[var(--color-border)] flex items-center justify-end">
              <Link
                href={module.href}
                className="inline-flex items-center gap-1 text-xs font-bold text-[var(--color-brand)] hover:text-[var(--color-brand-hover)] transition"
              >
                Buka Modul
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </Card>
        ))}
      </div>
    </section>
  );
}
