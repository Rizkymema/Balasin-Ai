"use client";

import { Skeleton } from "@/components/ui/skeleton";

export function InboxLayoutSkeleton() {
  return (
    <div className="space-y-4 animate-fade-in">
      <div className="rounded-[28px] border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-3">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-3 w-72 max-w-full" />
          </div>
          <div className="grid w-full gap-3 sm:grid-cols-2 xl:grid-cols-5 lg:max-w-4xl">
            {Array.from({ length: 5 }).map((_, index) => (
              <Skeleton key={index} className="h-11 rounded-2xl" />
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[0.95fr_1.4fr_0.95fr]">
        <div className="rounded-[28px] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
          <Skeleton className="mb-4 h-10 rounded-2xl" />
          <div className="mb-4 grid grid-cols-2 gap-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-10 rounded-2xl" />
            ))}
          </div>
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className="rounded-2xl border border-white/8 bg-white/[0.03] p-3"
              >
                <div className="flex items-center gap-3">
                  <Skeleton className="h-11 w-11 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-3 w-32" />
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[28px] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
          <div className="mb-5 flex items-center justify-between">
            <div className="space-y-2">
              <Skeleton className="h-4 w-36" />
              <Skeleton className="h-3 w-48" />
            </div>
            <Skeleton className="h-10 w-32 rounded-full" />
          </div>
          <div className="space-y-4">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className={`flex ${index % 2 === 0 ? "justify-start" : "justify-end"}`}
              >
                <Skeleton className="h-20 w-[72%] rounded-3xl" />
              </div>
            ))}
          </div>
          <div className="mt-6 grid gap-3">
            <Skeleton className="h-28 rounded-3xl" />
            <div className="grid grid-cols-[1fr_auto] gap-3">
              <Skeleton className="h-14 rounded-2xl" />
              <Skeleton className="h-14 w-14 rounded-2xl" />
            </div>
          </div>
        </div>

        <div className="rounded-[28px] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
          <div className="space-y-4">
            {Array.from({ length: 6 }).map((_, index) => (
              <Skeleton key={index} className="h-24 rounded-3xl" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

