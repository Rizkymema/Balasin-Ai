"use client";

import { AlarmClockCheck, CheckCheck, ListTodo } from "lucide-react";

import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/utils";

import type { CrmTaskRecord } from "./crm-view-model";

type TasksPanelProps = {
  tasks: CrmTaskRecord[];
};

function statusTone(status: CrmTaskRecord["status"]) {
  switch (status) {
    case "Completed":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "Overdue":
      return "border-rose-200 bg-rose-50 text-rose-700";
    case "In Progress":
      return "border-amber-200 bg-amber-50 text-amber-700";
    default:
      return "border-cyan-200 bg-cyan-50 text-cyan-700";
  }
}

function priorityTone(priority: CrmTaskRecord["priority"]) {
  switch (priority) {
    case "High":
      return "text-rose-700";
    case "Medium":
      return "text-amber-700";
    default:
      return "text-slate-600";
  }
}

export function TasksPanel({ tasks }: TasksPanelProps) {
  if (tasks.length === 0) {
    return (
      <Card>
        <EmptyState
          icon={<ListTodo className="h-10 w-10" />}
          title="Belum ada task"
          description="Task follow-up dan aktivitas ticket akan muncul di halaman ini saat CRM memiliki contact aktif."
          className="min-h-[320px]"
        />
      </Card>
    );
  }

  return (
    <Card className="space-y-5 p-5 md:p-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-lg font-bold text-white">Tasks</h2>
          <p className="text-xs leading-6 text-slate-400">
            Aktivitas follow-up yang diambil dari hot lead, booking, dan ticket aktif.
          </p>
        </div>

        <div className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-white/[0.04] px-3 py-1.5 text-xs text-[var(--color-muted)]">
          <AlarmClockCheck className="h-3.5 w-3.5" />
          Task queue initial scope
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {tasks.map((task) => (
          <div
            key={task.id}
            className="rounded-2xl border border-white/8 bg-white/[0.03] p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-white">{task.title}</p>
                <p className="mt-1 text-xs text-slate-400">
                  {task.contactName} - {task.type}
                </p>
              </div>

              <span
                className={cn(
                  "rounded-full border px-2.5 py-1 text-[11px] font-semibold",
                  statusTone(task.status),
                )}
              >
                {task.status}
              </span>
            </div>

            <div className="mt-4 space-y-2 text-sm text-slate-300">
              <p>Owner: {task.owner}</p>
              <p>Due: {task.dueLabel}</p>
              <p className={priorityTone(task.priority)}>Priority: {task.priority}</p>
              <p className="text-slate-500">{task.outcome}</p>
            </div>

            {task.status === "Completed" ? (
              <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
                <CheckCheck className="h-3.5 w-3.5" />
                Completed
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </Card>
  );
}
