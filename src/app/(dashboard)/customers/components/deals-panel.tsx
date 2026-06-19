"use client";

import { BriefcaseBusiness, CircleDollarSign } from "lucide-react";

import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/utils";
import type { CrmDealStage } from "@/types/operations";

import type { CrmDealRecord } from "./crm-view-model";

type DealsPanelProps = {
  deals: CrmDealRecord[];
};

const DEAL_STAGE_COLUMNS: Array<{
  id: CrmDealStage;
  label: string;
  toneClassName: string;
  titleClassName: string;
}> = [
  {
    id: "New Lead",
    label: "New Lead",
    toneClassName: "border-cyan-400/20 bg-cyan-950/20",
    titleClassName: "text-cyan-200",
  },
  {
    id: "Qualified",
    label: "Qualified",
    toneClassName: "border-blue-400/20 bg-blue-950/20",
    titleClassName: "text-blue-200",
  },
  {
    id: "Booking",
    label: "Booking",
    toneClassName: "border-amber-400/20 bg-amber-950/20",
    titleClassName: "text-amber-200",
  },
  {
    id: "Won",
    label: "Won",
    toneClassName: "border-emerald-400/20 bg-emerald-950/20",
    titleClassName: "text-emerald-200",
  },
  {
    id: "Lost",
    label: "Lost",
    toneClassName: "border-rose-400/20 bg-rose-950/20",
    titleClassName: "text-rose-200",
  },
];

export function DealsPanel({ deals }: DealsPanelProps) {
  if (deals.length === 0) {
    return (
      <Card>
        <EmptyState
          icon={<BriefcaseBusiness className="h-10 w-10" />}
          title="Belum ada deal"
          description="Pipeline deal akan terisi otomatis dari lead status, booking, dan revenue hint contact."
          className="min-h-[320px]"
        />
      </Card>
    );
  }

  return (
    <Card className="space-y-5 p-5 md:p-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-lg font-bold text-white">Deals</h2>
          <p className="text-xs leading-6 text-slate-400">
            Pipeline penjualan awal yang diturunkan dari lead status customer, booking, dan peluang closing.
          </p>
        </div>

        <div className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-white/[0.04] px-3 py-1.5 text-xs text-[var(--color-muted)]">
          <CircleDollarSign className="h-3.5 w-3.5" />
          Deal pipeline initial scope
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-5">
        {DEAL_STAGE_COLUMNS.map((column) => {
          const columnDeals = deals.filter((deal) => deal.stage === column.id);

          return (
            <div
              key={column.id}
              className={cn("rounded-2xl border p-4", column.toneClassName)}
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className={cn("text-sm font-semibold", column.titleClassName)}>
                    {column.label}
                  </p>
                  <p className="mt-1 text-xs text-slate-400">{columnDeals.length} deal</p>
                </div>
              </div>

              <div className="mt-4 space-y-3">
                {columnDeals.length > 0 ? (
                  columnDeals.map((deal) => (
                    <div
                      key={deal.id}
                      className="rounded-2xl border border-white/8 bg-white/[0.03] p-3"
                    >
                      <p className="text-sm font-semibold text-white">{deal.title}</p>
                      <p className="mt-1 text-xs text-slate-400">{deal.contactName}</p>

                      <div className="mt-3 space-y-1 text-xs text-slate-300">
                        <p>{deal.valueLabel}</p>
                        <p>Probability {deal.probability}% - {deal.expectedClose}</p>
                        <p>{deal.owner} - {deal.source}</p>
                        <p>{deal.productOrService}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.03] p-4 text-xs text-slate-500">
                    Tidak ada deal di stage ini.
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
