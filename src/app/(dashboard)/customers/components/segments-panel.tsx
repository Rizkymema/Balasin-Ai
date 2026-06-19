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
      <Card>
        <EmptyState
          icon={<Layers3 className="h-10 w-10" />}
          title="Belum ada segment"
          description="Segment dinamis dan statis akan muncul di sini saat contact tersedia."
          className="min-h-[320px]"
        />
      </Card>
    );
  }

  return (
    <Card className="space-y-5 p-5 md:p-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-lg font-bold text-white">Segments</h2>
          <p className="text-xs leading-6 text-slate-400">
            Kumpulan segmentasi awal dari contact aktif, hot lead, booking, complaint, dan reactivation queue.
          </p>
        </div>

        <div className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-white/[0.04] px-3 py-1.5 text-xs text-[var(--color-muted)]">
          <Filter className="h-3.5 w-3.5" />
          Segment static + dynamic
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {segments.map((segment) => (
          <div
            key={segment.id}
            className="rounded-2xl border border-white/8 bg-white/[0.03] p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-white">{segment.name}</p>
                <p className="mt-1 text-xs text-slate-500">
                  {segment.type === "dynamic" ? "Dynamic Segment" : "Static Segment"}
                </p>
              </div>
              <span
                className={cn(
                  "rounded-full border px-2.5 py-1 text-[11px] font-semibold",
                  segment.type === "dynamic"
                    ? "border-cyan-400/20 bg-cyan-950/30 text-cyan-200"
                    : "border-white/10 bg-white/[0.04] text-slate-300",
                )}
              >
                {segment.count} contact
              </span>
            </div>

            <p className="mt-4 text-sm leading-6 text-slate-300">{segment.description}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}
