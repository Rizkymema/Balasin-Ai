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
    toneClassName: "border-cyan-200 bg-cyan-50",
    titleClassName: "text-cyan-800",
  },
  {
    id: "Qualified",
    label: "Qualified",
    toneClassName: "border-blue-200 bg-blue-50",
    titleClassName: "text-blue-800",
  },
  {
    id: "Booking",
    label: "Booking",
    toneClassName: "border-amber-200 bg-amber-50",
    titleClassName: "text-amber-800",
  },
  {
    id: "Won",
    label: "Won",
    toneClassName: "border-emerald-200 bg-emerald-50",
    titleClassName: "text-emerald-800",
  },
  {
    id: "Lost",
    label: "Lost",
    toneClassName: "border-rose-200 bg-rose-50",
    titleClassName: "text-rose-800",
  },
];

export function DealsPanel({ deals }: DealsPanelProps) {
  if (deals.length === 0) {
    return (
      <Card className="border-slate-200 bg-white shadow-[0_18px_45px_rgba(15,23,42,0.06)]">
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
    <Card className="space-y-5 border-slate-200 bg-white p-5 text-slate-900 shadow-[0_18px_45px_rgba(15,23,42,0.06)] md:p-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Deals</h2>
          <p className="text-xs leading-6 text-slate-500">
            Pipeline penjualan awal yang diturunkan dari lead status customer, booking, dan peluang closing.
          </p>
        </div>

        <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-500">
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
                  <p className="mt-1 text-xs text-slate-500">{columnDeals.length} deal</p>
                </div>
              </div>

              <div className="mt-4 space-y-3">
                {columnDeals.length > 0 ? (
                  columnDeals.map((deal) => (
                    <div
                      key={deal.id}
                      className="rounded-2xl border border-slate-200 bg-white p-3"
                    >
                      <p className="text-sm font-semibold text-slate-900">{deal.title}</p>
                      <p className="mt-1 text-xs text-slate-500">{deal.contactName}</p>

                      <div className="mt-3 space-y-1 text-xs text-slate-600">
                        <p>{deal.valueLabel}</p>
                        <p>Probability {deal.probability}% - {deal.expectedClose}</p>
                        <p>{deal.owner} - {deal.source}</p>
                        <p>{deal.productOrService}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-4 text-xs text-slate-500">
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
