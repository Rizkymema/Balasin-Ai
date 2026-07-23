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
      return "border-blue-200 bg-blue-50 text-blue-700";
  }
}

function priorityTone(priority: CrmTaskRecord["priority"]) {
  switch (priority) {
    case "High":
      return "text-rose-700 font-bold";
    case "Medium":
      return "text-amber-700 font-bold";
    default:
      return "text-slate-500 font-medium";
  }
}

export function TasksPanel({ tasks }: TasksPanelProps) {
  if (tasks.length === 0) {
    return (
      <Card className="border-slate-200 bg-white">
        <EmptyState
          icon={<ListTodo className="h-10 w-10 text-blue-600" />}
          title="Belum ada task"
          description="Task follow-up dan aktivitas ticket akan muncul di halaman ini saat CRM memiliki contact aktif."
          className="min-h-[320px]"
        />
      </Card>
    );
  }

  return (
    <Card className="space-y-5 p-5 md:p-6 border-slate-200 bg-white shadow-2xs">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between border-b border-slate-100 pb-3">
        <div>
          <h2 className="text-base font-bold text-slate-900">Tasks</h2>
          <p className="text-xs leading-normal text-slate-500 font-medium mt-0.5">
            Aktivitas follow-up yang diambil dari hot lead, booking, dan ticket aktif.
          </p>
        </div>

        <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3.5 py-1 text-xs text-slate-600 font-semibold shadow-2xs">
          <AlarmClockCheck className="h-3.5 w-3.5 text-slate-400" />
          Task queue initial scope
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {tasks.map((task) => (
          <div
            key={task.id}
            className="rounded-2xl border border-slate-200 bg-slate-50/50 p-5 space-y-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-bold text-slate-900 leading-snug">{task.title}</p>
                <p className="text-[10px] text-slate-500 font-bold mt-1">
                  {task.contactName} • {task.type}
                </p>
              </div>

              <span
                className={cn(
                  "rounded-full border px-2.5 py-0.5 text-[10px] font-bold shrink-0 shadow-2xs",
                  statusTone(task.status),
                )}
              >
                {task.status}
              </span>
            </div>

            <div className="space-y-1.5 text-xs text-slate-600 font-semibold border-t border-slate-100 pt-3">
              <p><span className="text-slate-400 font-bold">Owner:</span> {task.owner}</p>
              <p><span className="text-slate-400 font-bold">Due:</span> {task.dueLabel}</p>
              <p className={priorityTone(task.priority)}>
                <span className="text-slate-400 font-bold">Priority:</span> {task.priority}
              </p>
              <p className="text-slate-500 mt-2 font-medium bg-white rounded-lg p-2 border border-slate-100">{task.outcome}</p>
            </div>

            {task.status === "Completed" ? (
              <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[10px] font-bold text-emerald-700 shadow-2xs">
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
