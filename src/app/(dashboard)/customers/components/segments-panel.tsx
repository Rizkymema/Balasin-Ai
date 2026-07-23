"use client";

import { Filter, Layers3 } from "lucide-react";

import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/utils";

import type { CrmSegmentRecord } from "./crm-view-model";

type SegmentsPanelProps = {
  segments: CrmSegmentRecord[];
};

export function SegmentsPanel({ segments }: SegmentsPanelProps) {
  if (segments.length === 0) {
    return (
      <Card className="border-slate-200 bg-white">
        <EmptyState
          icon={<Layers3 className="h-10 w-10 text-blue-600" />}
          title="Belum ada segment"
          description="Segment dinamis dan statis akan muncul di sini saat contact tersedia."
          className="min-h-[320px]"
        />
      </Card>
    );
  }

  return (
    <Card className="space-y-5 p-5 md:p-6 border-slate-200 bg-white shadow-2xs">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between border-b border-slate-100 pb-3">
        <div>
          <h2 className="text-base font-bold text-slate-900">Segments</h2>
          <p className="text-xs leading-normal text-slate-500 font-medium mt-0.5">
            Kumpulan segmentasi awal dari contact aktif, hot lead, booking, complaint, dan reactivation queue.
          </p>
        </div>

        <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3.5 py-1 text-xs text-slate-600 font-semibold shadow-2xs">
          <Filter className="h-3.5 w-3.5 text-slate-400" />
          Segment static + dynamic
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {segments.map((segment) => (
          <div
            key={segment.id}
            className="rounded-2xl border border-slate-200 bg-slate-50/50 p-5 space-y-3"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-bold text-slate-900">{segment.name}</p>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">
                  {segment.type === "dynamic" ? "Dynamic Segment" : "Static Segment"}
                </p>
              </div>
              <span
                className={cn(
                  "rounded-full border px-2.5 py-0.5 text-[10px] font-bold shrink-0 shadow-2xs",
                  segment.type === "dynamic"
                    ? "border-blue-200 bg-blue-50 text-blue-700"
                    : "border-slate-200 bg-white text-slate-600",
                )}
              >
                {segment.count} contact
              </span>
            </div>

            <p className="text-xs leading-relaxed text-slate-600 font-medium">{segment.description}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}
