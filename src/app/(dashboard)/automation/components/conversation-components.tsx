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
  WandSparkles,
  Settings,
  MessageSquare,
  Instagram,
  Send,
  HelpCircle,
  Zap,
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
      <Badge className="inline-flex items-center gap-1.5 border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-xs font-semibold text-emerald-400 hover:bg-emerald-500/20">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
        Active
      </Badge>
    );
  }
  if (status === "Draft") {
    return (
      <Badge className="inline-flex items-center gap-1.5 border-amber-500/20 bg-amber-500/10 px-2 py-0.5 text-xs font-semibold text-amber-400 hover:bg-amber-500/20">
        <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
        Draft
      </Badge>
    );
  }
  return (
    <Badge className="inline-flex items-center gap-1.5 border-slate-500/20 bg-slate-500/10 px-2 py-0.5 text-xs font-semibold text-slate-400 hover:bg-slate-500/20">
      <span className="h-1.5 w-1.5 rounded-full bg-slate-500" />
      Inactive
    </Badge>
  );
}

function ChannelBadge({ channel }: { channel: string }) {
  const normalized = channel.toLowerCase();
  
  if (normalized.includes("whatsapp")) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/15 bg-emerald-500/5 px-2.5 py-1 text-xs font-medium text-emerald-400">
        <MessageSquare className="h-3.5 w-3.5 text-emerald-400" />
        {channel}
      </span>
    );
  }
  if (normalized.includes("instagram")) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-lg border border-pink-500/15 bg-pink-500/5 px-2.5 py-1 text-xs font-medium text-pink-400">
        <Instagram className="h-3.5 w-3.5 text-pink-400" />
        {channel}
      </span>
    );
  }
  if (normalized.includes("telegram")) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-lg border border-sky-500/15 bg-sky-500/5 px-2.5 py-1 text-xs font-medium text-sky-400">
        <Send className="h-3.5 w-3.5 text-sky-400" />
        {channel}
      </span>
    );
  }
  if (normalized.includes("website") || normalized.includes("widget") || normalized.includes("webchat")) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-lg border border-cyan-500/15 bg-cyan-500/5 px-2.5 py-1 text-xs font-medium text-cyan-400">
        <MessageSquareText className="h-3.5 w-3.5 text-cyan-400" />
        {channel}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-lg border border-slate-500/15 bg-slate-500/5 px-2.5 py-1 text-xs font-medium text-slate-400">
      <HelpCircle className="h-3.5 w-3.5 text-slate-500" />
      {channel}
    </span>
  );
}

export function ConversationTable({
  conversations,
  onEdit,
  onDuplicate,
  onToggleStatus,
  togglingFlowId,
  onDelete,
  onEditSettings,
}: {
  conversations: ConversationFlow[];
  onEdit: (flow: ConversationFlow) => void;
  onDuplicate: (flow: ConversationFlow) => void;
  onToggleStatus: (flow: ConversationFlow) => void;
  togglingFlowId?: string | null;
  onDelete: (flow: ConversationFlow) => void;
  onEditSettings?: (flow: ConversationFlow) => void;
}) {
  return (
    <div className="overflow-x-auto rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-lg shadow-black/30">
      <table className="w-full text-left text-sm text-slate-300">
        <thead className="bg-white/[0.02] text-xs text-slate-400 uppercase tracking-wider font-bold">
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
          {conversations.map((flow) => {
            const dropdownItems = [
              {
                label: "Edit Settings",
                icon: <Settings className="h-4 w-4" />,
                onClick: () => onEditSettings?.(flow),
              },
              {
                label: "Duplicate",
                icon: <Copy className="h-4 w-4" />,
                onClick: () => onDuplicate(flow),
              },
            ] as Array<{
              label: string;
              onClick: () => void;
              icon?: React.ReactNode;
              className?: string;
              danger?: boolean;
            }>;

            if (flow.status !== "Draft") {
              dropdownItems.push({
                label: flow.status === "Published" ? "Deactivate" : "Activate",
                icon: flow.status === "Published" ? (
                  <PowerOff className="h-4 w-4" />
                ) : (
                  <Power className="h-4 w-4" />
                ),
                onClick: () => onToggleStatus(flow),
              });
            }

            dropdownItems.push({
              label: "Delete",
              icon: <Trash2 className="h-4 w-4" />,
              onClick: () => onDelete(flow),
              danger: true,
            });

            return (
              <tr
                key={flow.id}
                className="transition-colors hover:bg-white/[0.01]"
              >
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-cyan-500/15 bg-cyan-500/5 text-cyan-400">
                      <MessageSquareText className="h-4.5 w-4.5" />
                    </div>
                    <div className="min-w-0">
                      <div className="font-semibold text-white truncate max-w-[240px]" title={flow.name}>
                        {flow.name}
                      </div>
                      <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-slate-400">
                        <Zap className="h-3 w-3 text-slate-500" />
                        <span className="truncate max-w-[200px]" title={flow.trigger}>
                          Trigger: {flow.trigger}
                        </span>
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-2">
                    <span className="rounded-lg bg-slate-800/60 border border-slate-700/50 px-2.5 py-1 text-xs font-semibold text-cyan-400">
                      {flow.botResponse.toLocaleString("id-ID")}
                    </span>
                    <span className="text-xs text-slate-500 font-medium">responses</span>
                  </div>
                </td>
                <td className="px-5 py-4">
                  <ChannelBadge channel={flow.channel} />
                </td>
                <td className="px-5 py-4 text-slate-400">{flow.lastUpdate}</td>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-4">
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
                      className="inline-flex items-center gap-2 group/switch disabled:cursor-not-allowed"
                    >
                      <span
                        className={`relative h-6 w-11 rounded-full border transition-all duration-300 shadow-inner flex items-center ${
                          flow.status === "Published"
                            ? "border-emerald-500/50 bg-emerald-500/20 shadow-emerald-500/10"
                            : flow.status === "Draft"
                              ? "border-slate-800 bg-slate-900/40 opacity-40"
                              : "border-slate-700 bg-slate-800/60 shadow-black/20"
                        }`}
                      >
                        <span
                          className={`absolute h-4 w-4 rounded-full transition-all duration-300 shadow-md ${
                            flow.status === "Published"
                              ? "translate-x-[22px] bg-emerald-400"
                              : "translate-x-1 bg-slate-500"
                          } ${togglingFlowId === flow.id ? "animate-pulse scale-90" : "scale-100"}`}
                        />
                      </span>
                      <span
                        className={`text-xs font-bold tracking-wide uppercase transition-colors ${
                          flow.status === "Published"
                            ? "text-emerald-400"
                            : flow.status === "Draft"
                              ? "text-slate-600"
                              : "text-slate-400"
                        }`}
                      >
                        {flow.status === "Published" ? "ON" : "OFF"}
                      </span>
                    </button>
                  </div>
                </td>
                <td className="px-5 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => onEdit(flow)}
                      className="inline-flex items-center justify-center rounded-full h-8 gap-1.5 border border-cyan-500/20 bg-cyan-950/20 px-3.5 text-xs font-bold text-cyan-400 hover:border-cyan-500/40 hover:bg-cyan-500/10 hover:text-cyan-300 transition-all select-none cursor-pointer active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#090a0f] focus-visible:ring-cyan-500"
                    >
                      <WandSparkles className="h-3.5 w-3.5" />
                      Builder
                    </button>
                    <Dropdown
                      align="right"
                      trigger={
                        <button className="rounded-lg p-2 text-slate-400 transition hover:bg-white/5 hover:text-white border border-transparent hover:border-white/10">
                          <MoreVertical className="h-4 w-4" />
                        </button>
                      }
                      items={dropdownItems}
                    />
                  </div>
                </td>
              </tr>
            );
          })}
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
