"use client";

import { Building2, Filter, Plus, Users2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import {
  CRM_VIEW_TABS,
  type CrmQuickFilterSummary,
  type CrmViewId,
} from "./crm-view-model";

type CrmPageHeaderProps = {
  activeView: CrmViewId;
  onViewChange: (view: CrmViewId) => void;
  quickFilters: CrmQuickFilterSummary[];
  onQuickFilterSelect: (id: CrmQuickFilterSummary["id"]) => void;
  activeQuickFilter: CrmQuickFilterSummary["id"];
  onCreateContact: () => void;
};

export function CrmPageHeader({
  activeView,
  onViewChange,
  quickFilters,
  onQuickFilterSelect,
  activeQuickFilter,
  onCreateContact,
}: CrmPageHeaderProps) {
  const headerFilters = quickFilters.filter((filter) =>
    ["all", "hot_lead", "follow_up", "customer"].includes(filter.id),
  );

  return (
    <div className="space-y-5">
      <section className="relative overflow-hidden rounded-[24px] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 md:p-8">
        <div className="absolute right-0 top-0 h-44 w-44 rounded-full bg-[var(--color-brand)]/10 blur-3xl" />
        <div className="relative z-10 flex flex-col gap-5">
          <div className="space-y-3">
            <Badge className="border-[var(--color-brand)]/20 bg-[var(--color-brand)]/10 text-[var(--color-brand)]">Contacts / CRM</Badge>
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <h1 className="text-3xl font-bold text-white">
                  Contacts / CRM
                </h1>
                <p className="mt-2 max-w-4xl text-sm leading-7 text-[var(--color-muted)]">
                  Satu workspace untuk contact, segmentasi, deal pipeline, task,
                  dan histori customer. Struktur awalnya mengikuti kebutuhan CRM
                  di dokumen kerja tanpa mematahkan data dashboard yang sudah ada.
                </p>
              </div>

              <Button
                type="button"
                className="h-11 rounded-xl bg-[var(--color-brand)] px-4 text-slate-950 hover:bg-[var(--color-brand-hover)]"
                onClick={onCreateContact}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Contact
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {headerFilters.map((filter) => (
              <button
                key={filter.id}
                type="button"
                onClick={() => onQuickFilterSelect(filter.id)}
                className={cn(
                  "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition",
                  activeQuickFilter === filter.id
                    ? "border-[var(--color-brand)]/25 bg-[var(--color-brand)]/12 text-[var(--color-brand)]"
                    : "border-[var(--color-border)] bg-white/[0.04] text-[var(--color-muted)] hover:bg-white/[0.08]",
                )}
              >
                {filter.label}
                <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] text-white">
                  {filter.count}
                </span>
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-3 rounded-[24px] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap gap-2">
          {CRM_VIEW_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => onViewChange(tab.id)}
              className={cn(
                "rounded-xl px-4 py-2 text-sm font-semibold transition",
                activeView === tab.id
                  ? "bg-[var(--color-brand)] text-slate-950"
                  : "bg-white/[0.04] text-[var(--color-muted)] hover:bg-white/[0.08]",
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--color-muted)]">
          <span className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-white/[0.04] px-3 py-1.5">
            <Users2 className="h-3.5 w-3.5" />
            Contact core
          </span>
          <span className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-white/[0.04] px-3 py-1.5">
            <Filter className="h-3.5 w-3.5" />
            Search + segment + tag
          </span>
          <span className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-white/[0.04] px-3 py-1.5">
            <Building2 className="h-3.5 w-3.5" />
            CRM initial scope
          </span>
        </div>
      </section>
    </div>
  );
}
