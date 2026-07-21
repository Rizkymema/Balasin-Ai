"use client";

import {
  MessageSquareText,
  Search,
  MoreVertical,
  Edit2,
  Copy,
  PowerOff,
  Power,
  Trash2,
  BotMessageSquare,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dropdown } from "@/components/ui/dropdown";
import type { ConversationFlow } from "@/types/dashboard-config";

export function BotResponseQuotaCard({ quota }: { quota: number }) {
  return (
    <Card className="flex flex-col gap-2 border-white/10 bg-white/[0.02] p-5">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--color-brand)]/20 text-[var(--color-brand)]">
          <MessageSquareText className="h-5 w-5" />
        </div>
        <div>
          <div className="text-sm font-semibold text-slate-300">
            Bot Response Quota
          </div>
          <div className="text-xs text-slate-500">
            Sisa kuota balasan otomatis bot yang dapat digunakan oleh
            perusahaan.
          </div>
        </div>
      </div>
      <div className="font-heading mt-2 text-3xl font-bold text-white">
        {quota.toLocaleString("id-ID")}
      </div>
    </Card>
  );
}

export function ConversationSearchBar({
  value,
  onChange,
}: {
  value: string;
  onChange: (val: string) => void;
}) {
  return (
    <div className="relative w-full max-w-sm">
      <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-500" />
      <Input
        type="text"
        placeholder="Search conversations..."
        className="h-10 border-[var(--color-border)] bg-[var(--color-surface)] pl-9"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

function StatusBadge({ status }: { status: ConversationFlow["status"] }) {
  if (status === "Published") {
    return (
      <Badge className="border-emerald-500/20 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20">
        Published
      </Badge>
    );
  }
  if (status === "Draft") {
    return (
      <Badge className="border-amber-500/20 bg-amber-500/10 text-amber-500 hover:bg-amber-500/20">
        Draft
      </Badge>
    );
  }
  return (
    <Badge className="border-slate-500/20 bg-slate-500/10 text-slate-400 hover:bg-slate-500/20">
      Inactive
    </Badge>
  );
}

export function ConversationTable({
  conversations,
  onEdit,
  onDuplicate,
  onToggleStatus,
  togglingFlowId,
  onDelete,
}: {
  conversations: ConversationFlow[];
  onEdit: (flow: ConversationFlow) => void;
  onDuplicate: (flow: ConversationFlow) => void;
  onToggleStatus: (flow: ConversationFlow) => void;
  togglingFlowId?: string | null;
  onDelete: (flow: ConversationFlow) => void;
}) {
  return (
    <div className="overflow-x-auto rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]">
      <table className="w-full text-left text-sm text-slate-300">
        <thead className="bg-white/[0.02] text-xs text-slate-500 uppercase">
          <tr>
            <th className="px-5 py-4 font-semibold">Conversation Name</th>
            <th className="px-5 py-4 font-semibold">Bot Response</th>
            <th className="px-5 py-4 font-semibold">Channel</th>
            <th className="px-5 py-4 font-semibold">Last Update</th>
            <th className="px-5 py-4 font-semibold">Status</th>
            <th className="px-5 py-4 text-right font-semibold">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--color-border)]">
          {conversations.map((flow) => (
            <tr
              key={flow.id}
              className="transition-colors hover:bg-white/[0.01]"
            >
              <td className="px-5 py-4 font-medium text-white">{flow.name}</td>
              <td className="px-5 py-4">
                {flow.botResponse.toLocaleString("id-ID")} responses
              </td>
              <td className="px-5 py-4 text-slate-400">{flow.channel}</td>
              <td className="px-5 py-4 text-slate-400">{flow.lastUpdate}</td>
              <td className="px-5 py-4">
                <div className="flex items-center gap-3">
                  <StatusBadge status={flow.status} />
                  <button
                    type="button"
                    role="switch"
                    aria-checked={flow.status === "Published"}
                    aria-label={`${flow.status === "Published" ? "Nonaktifkan" : "Aktifkan"} ${flow.name}`}
                    title={
                      flow.status === "Draft"
                        ? "Test dan Publish flow sebelum mengaktifkannya"
                        : flow.status === "Published"
                          ? "Matikan flow"
                          : "Aktifkan flow"
                    }
                    disabled={
                      flow.status === "Draft" || togglingFlowId === flow.id
                    }
                    onClick={() => onToggleStatus(flow)}
                    className="inline-flex items-center gap-1.5 disabled:cursor-not-allowed disabled:opacity-45"
                  >
                    <span
                      className={`relative h-5 w-9 rounded-full border transition-colors ${
                        flow.status === "Published"
                          ? "border-emerald-400/40 bg-emerald-500/30"
                          : "border-slate-600 bg-slate-800"
                      }`}
                    >
                      <span
                        className={`absolute top-0.5 h-3.5 w-3.5 rounded-full bg-white transition-transform ${
                          flow.status === "Published"
                            ? "translate-x-[17px]"
                            : "translate-x-0.5"
                        } ${togglingFlowId === flow.id ? "animate-pulse" : ""}`}
                      />
                    </span>
                    <span className="text-[10px] font-bold tracking-wide text-slate-400">
                      {flow.status === "Published" ? "ON" : "OFF"}
                    </span>
                  </button>
                </div>
              </td>
              <td className="px-5 py-4 text-right">
                <Dropdown
                  align="right"
                  trigger={
                    <button className="rounded p-1.5 text-slate-400 transition hover:bg-white/10 hover:text-white">
                      <MoreVertical className="h-4 w-4" />
                    </button>
                  }
                  items={[
                    {
                      label: "Edit",
                      icon: <Edit2 className="h-4 w-4" />,
                      onClick: () => onEdit(flow),
                    },
                    {
                      label: "Duplicate",
                      icon: <Copy className="h-4 w-4" />,
                      onClick: () => onDuplicate(flow),
                    },
                    {
                      label:
                        flow.status === "Draft"
                          ? "Open Builder"
                          : flow.status === "Inactive"
                            ? "Activate"
                            : "Deactivate",
                      icon:
                        flow.status === "Published" ? (
                          <PowerOff className="h-4 w-4" />
                        ) : (
                          <Power className="h-4 w-4" />
                        ),
                      onClick: () => onToggleStatus(flow),
                    },
                    {
                      label: "Delete",
                      icon: <Trash2 className="h-4 w-4" />,
                      onClick: () => onDelete(flow),
                      danger: true,
                    },
                  ]}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function EmptyConversationState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[var(--color-border)] px-4 py-16 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white/[0.03] text-slate-400">
        <BotMessageSquare className="h-8 w-8" />
      </div>
      <h3 className="mb-2 text-lg font-bold text-white">
        Belum ada conversation
      </h3>
      <p className="mx-auto mb-6 max-w-sm text-sm text-slate-400">
        Buat conversation pertama Anda untuk mulai mengatur chatbot otomatis di
        berbagai channel.
      </p>
      <Button onClick={onCreate} className="gap-2">
        Create Conversation
      </Button>
    </div>
  );
}
