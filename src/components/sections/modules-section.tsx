import { dashboardModules } from "@/constants/navigation";
import Link from "next/link";
import {
  ArrowRight,
  LayoutDashboard,
  MessageSquare,
  Users2,
  Bot,
  Database,
  Package,
  CalendarRange,
  ClipboardList,
  GitBranch,
  SendHorizontal,
  Wifi,
  BarChart2,
  Settings2,
} from "lucide-react";

import { Card } from "@/components/ui/card";
import { SectionHeading } from "@/components/ui/section-heading";

const iconMap: Record<string, React.ComponentType<any>> = {
  "Dashboard": LayoutDashboard,
  "Unified Inbox": MessageSquare,
  "Contacts / CRM": Users2,
  "AI Assistant": Bot,
  "Knowledge Base": Database,
  "Products & Services": Package,
  "Booking": CalendarRange,
  "Tickets": ClipboardList,
  "Automation": GitBranch,
  "Broadcast / Campaign": SendHorizontal,
  "Channels": Wifi,
  "Reports": BarChart2,
  "Team & Settings": Settings2,
};

export function ModulesSection() {
  return (
    <section id="modules" className="mx-auto max-w-7xl px-6 py-20 lg:py-24 lg:px-8 border-t border-[var(--color-border)]">
      <SectionHeading
        eyebrow="Modules"
        title="Modul utama sudah dipetakan agar pertumbuhan fitur tetap terarah."
        description="Navigasi dan layout mengikuti konsep Balesin AI sejak awal supaya fitur baru tidak memaksa refactor arsitektur yang mahal."
      />

      <div className="mt-12 grid gap-5 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
        {dashboardModules.map((module) => {
          const Icon = iconMap[module.label] || LayoutDashboard;
          return (
            <Link key={module.label} href={module.href} className="group block h-full">
              <Card className="h-full flex flex-col justify-between p-5 bg-[var(--color-surface)]/20 hover:bg-[var(--color-surface)]/60 border border-[var(--color-border)] hover:border-[var(--color-brand)]/20 rounded-xl transition-all duration-300 shadow-sm hover:shadow-md">
                <div className="flex gap-4">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--color-brand)]/8 text-[var(--color-brand)] group-hover:bg-[var(--color-brand)] group-hover:text-[var(--color-bg)] transition-colors duration-300">
                    <Icon className="h-4.5 w-4.5" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-xs font-bold text-[var(--color-text)] tracking-tight">
                      {module.label}
                    </h3>
                    <p className="text-[10px] leading-relaxed text-[var(--color-muted)] font-normal">
                      {module.description}
                    </p>
                  </div>
                </div>
                <div className="mt-5 pt-3 border-t border-[var(--color-border)]/20 flex items-center justify-end">
                  <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider text-[var(--color-brand-blue)] group-hover:text-[var(--color-brand)] transition-colors duration-200">
                    Buka Modul
                    <ArrowRight className="h-3 w-3 transition-transform duration-200 group-hover:translate-x-0.5" />
                  </span>
                </div>
              </Card>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
