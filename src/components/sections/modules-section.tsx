"use client";

import { useState } from "react";
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

const CATEGORIES = [
  { id: "inbox_crm", label: "Inbox & CRM" },
  { id: "ai_auto", label: "AI & Otomatisasi" },
  { id: "campaign_channels", label: "Kampanye & Channel" },
  { id: "analytics_admin", label: "Laporan & Admin" },
];

const MODULE_TO_CATEGORY: Record<string, string> = {
  "Unified Inbox": "inbox_crm",
  "Contacts / CRM": "inbox_crm",
  "Booking": "inbox_crm",
  "Tickets": "inbox_crm",
  
  "AI Assistant": "ai_auto",
  "Knowledge Base": "ai_auto",
  "Automation": "ai_auto",
  
  "Broadcast / Campaign": "campaign_channels",
  "Channels": "campaign_channels",
  
  "Dashboard": "analytics_admin",
  "Products & Services": "analytics_admin",
  "Reports": "analytics_admin",
  "Team & Settings": "analytics_admin",
};

export function ModulesSection() {
  const [activeCategory, setActiveCategory] = useState("inbox_crm");

  const filteredModules = dashboardModules.filter(
    (module) => MODULE_TO_CATEGORY[module.label] === activeCategory
  );

  return (
    <section id="modules" className="mx-auto max-w-7xl px-6 py-20 lg:py-24 lg:px-8 border-t border-[var(--color-border)] bg-[var(--color-bg)]">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12">
        <SectionHeading
          eyebrow=""
          title="Modul utama sudah dipetakan agar pertumbuhan fitur tetap terarah."
          description="Navigasi dan layout mengikuti konsep Balesin AI sejak awal supaya fitur baru tidak memaksa refactor arsitektur yang mahal."
        />
        
        {/* Custom Premium Tabs Navigation */}
        <div className="flex flex-wrap gap-2 p-1.5 rounded-xl bg-[var(--color-surface)]/45 border border-[var(--color-border)] select-none">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all duration-200 focus:outline-none ${
                activeCategory === cat.id
                  ? "bg-[var(--color-brand)] text-[var(--color-bg)] shadow-sm"
                  : "text-[var(--color-muted)] hover:text-[var(--color-text)]"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Dynamic Module Cards Grid */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 animate-fade-in">
        {filteredModules.map((module) => {
          const Icon = iconMap[module.label] || LayoutDashboard;
          return (
            <Link key={module.label} href={module.href} className="group block h-full">
              <Card className="h-full flex flex-col justify-between p-5 bg-[var(--color-surface)]/20 hover:bg-[var(--color-surface)]/60 border border-[var(--color-border)] hover:border-[var(--color-brand)]/30 rounded-xl transition-all duration-300 shadow-sm hover:shadow-md">
                <div className="flex gap-4">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--color-brand)]/8 text-[var(--color-brand)] group-hover:bg-[var(--color-brand)] group-hover:text-[var(--color-bg)] transition-colors duration-300">
                    <Icon className="h-4.5 w-4.5" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-sm font-bold text-[var(--color-text)] tracking-tight">
                      {module.label}
                    </h3>
                    <p className="text-xs leading-relaxed text-[var(--color-muted)] font-normal">
                      {module.description}
                    </p>
                  </div>
                </div>
                <div className="mt-5 pt-3 border-t border-[var(--color-border)]/20 flex items-center justify-end">
                  <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider text-[var(--color-brand)] opacity-80 group-hover:opacity-100 transition-opacity duration-200">
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
