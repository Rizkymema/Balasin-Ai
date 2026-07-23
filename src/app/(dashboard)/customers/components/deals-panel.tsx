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
    toneClassName: "border-sky-200 bg-sky-50/40",
    titleClassName: "text-sky-800",
  },
  {
    id: "Qualified",
    label: "Qualified",
    toneClassName: "border-blue-200 bg-blue-50/40",
    titleClassName: "text-blue-800",
  },
  {
    id: "Booking",
    label: "Booking",
    toneClassName: "border-amber-200 bg-amber-50/40",
    titleClassName: "text-amber-800",
  },
  {
    id: "Won",
    label: "Won",
    toneClassName: "border-emerald-200 bg-emerald-50/40",
    titleClassName: "text-emerald-800",
  },
  {
    id: "Lost",
    label: "Lost",
    toneClassName: "border-rose-200 bg-rose-50/40",
    titleClassName: "text-rose-800",
  },
];

export function DealsPanel({ deals }: DealsPanelProps) {
  if (deals.length === 0) {
    return (
      <Card className="border-slate-200 bg-white">
        <EmptyState
          icon={<BriefcaseBusiness className="h-10 w-10 text-blue-600" />}
          title="Belum ada deal"
          description="Pipeline deal akan terisi otomatis dari lead status, booking, dan revenue hint contact."
          className="min-h-[320px]"
        />
      </Card>
    );
  }

  return (
    <Card className="space-y-5 p-5 md:p-6 border-slate-200 bg-white shadow-2xs">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between border-b border-slate-100 pb-3">
        <div>
          <h2 className="text-base font-bold text-slate-900">Deals</h2>
          <p className="text-xs leading-normal text-slate-500 font-medium mt-0.5">
            Pipeline penjualan awal yang diturunkan dari lead status customer, booking, dan peluang closing.
          </p>
        </div>

        <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3.5 py-1 text-xs text-slate-600 font-semibold shadow-2xs">
          <CircleDollarSign className="h-3.5 w-3.5 text-slate-400" />
          Deal pipeline initial scope
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-5 items-start">
        {DEAL_STAGE_COLUMNS.map((column) => {
          const columnDeals = deals.filter((deal) => deal.stage === column.id);

          return (
            <div
              key={column.id}
              className={cn("rounded-2xl border p-4 shadow-2xs", column.toneClassName)}
            >
              <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-2 mb-3">
                <div>
                  <p className={cn("text-xs font-bold uppercase tracking-wider", column.titleClassName)}>
                    {column.label}
                  </p>
                  <p className="text-[10px] text-slate-400 font-extrabold">{columnDeals.length} deal</p>
                </div>
              </div>

              <div className="space-y-3">
                {columnDeals.length > 0 ? (
                  columnDeals.map((deal) => (
                    <div
                      key={deal.id}
                      className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs hover:border-slate-300 transition space-y-2.5"
                    >
                      <div>
                        <p className="text-xs font-extrabold text-slate-900 leading-snug">{deal.title}</p>
                        <p className="text-[10px] text-slate-500 font-bold mt-0.5">{deal.contactName}</p>
                      </div>

                      <div className="space-y-1 text-[11px] text-slate-600 font-semibold border-t border-slate-100 pt-2">
                        <p className="text-slate-900 font-extrabold text-xs">{deal.valueLabel}</p>
                        <p>Probability {deal.probability}%</p>
                        <p>Close: {deal.expectedClose}</p>
                        <p className="text-[10px] text-slate-400 uppercase tracking-wider">{deal.owner} • {deal.source}</p>
                        <p className="text-[10px] bg-slate-50 rounded-lg px-2 py-0.5 border border-slate-100 inline-block mt-1 font-bold text-slate-700">{deal.productOrService}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-4 text-[10px] text-slate-400 font-bold text-center">
                    Tidak ada deal
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
