"use client";

import { Clock3, Dot, Search } from "lucide-react";

import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { ConversationRecord, ConversationStatus } from "@/types/operations";

import {
  type InboxQuickFilterId,
  type InboxSummary,
  getChannelMeta,
  getConversationStatusMeta,
  getPriorityMeta,
  formatSlaLabel,
  QUICK_FILTERS,
} from "./inbox-view-model";

type ConversationListPanelProps = {
  conversations: ConversationRecord[];
  selectedId: string;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  quickFilter: InboxQuickFilterId;
  onQuickFilterChange: (value: InboxQuickFilterId) => void;
  channelFilter: "all" | ConversationRecord["channel"];
  onChannelFilterChange: (value: "all" | ConversationRecord["channel"]) => void;
  channelOptions: Array<"all" | ConversationRecord["channel"]>;
  statusFilter: "all" | ConversationStatus;
  onStatusFilterChange: (value: "all" | ConversationStatus) => void;
  assignmentFilter: "all" | string;
  onAssignmentFilterChange: (value: "all" | string) => void;
  assignmentOptions: Array<{ value: "all" | string; label: string }>;
  sortBy: string;
  onSortChange: (value: string) => void;
  summary: InboxSummary;
  onSelectConversation: (conversationId: string) => void;
};

const CHANNEL_LABELS: Record<ConversationRecord["channel"], string> = {
  WhatsApp: "WhatsApp",
  "Website Chat": "Website Chat",
  "Instagram DM": "Instagram DM",
  "Instagram Comment": "Instagram Comment",
};

function quickFilterCount(summary: InboxSummary, filter: InboxQuickFilterId) {
  switch (filter) {
    case "all":
      return summary.allCount;
    case "unhandled":
      return summary.unhandledCount;
    case "need_admin":
      return summary.needAdminCount;
    case "mine":
      return summary.mineCount;
    case "ai_active":
      return summary.aiActiveCount;
    case "waiting_customer":
      return summary.waitingCustomerCount;
    case "snoozed":
      return summary.snoozedCount;
    case "resolved":
      return summary.resolvedCount;
    case "spam":
      return summary.spamCount;
    default:
      return 0;
  }
}

export function ConversationListPanel({
  conversations,
  selectedId,
  searchQuery,
  onSearchChange,
  quickFilter,
  onQuickFilterChange,
  channelFilter,
  onChannelFilterChange,
  channelOptions,
  statusFilter,
  onStatusFilterChange,
  assignmentFilter,
  onAssignmentFilterChange,
  assignmentOptions,
  sortBy,
  onSortChange,
  summary,
  onSelectConversation,
}: ConversationListPanelProps) {
  return (
    <aside className="flex min-h-[42rem] flex-col overflow-hidden rounded-[28px] border border-[var(--color-border)] bg-[var(--color-surface)]">
      <div className="border-b border-[var(--color-border)] p-4 sm:p-5">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-muted)]" />
          <Input
            value={searchQuery}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Cari customer, pesan, tag, atau ticket..."
            className="h-12 rounded-2xl border-[var(--color-border)] bg-white/[0.03] pl-11 text-sm"
          />
        </div>

        <div className="mt-4 flex gap-2 overflow-x-auto pb-1 custom-scrollbar">
          {QUICK_FILTERS.map((filter) => {
            const count = quickFilterCount(summary, filter.id);
            const active = filter.id === quickFilter;

            return (
              <button
                key={filter.id}
                type="button"
                onClick={() => onQuickFilterChange(filter.id)}
                className={cn(
                  "inline-flex shrink-0 items-center gap-2 rounded-full border px-3 py-2 text-[11px] font-semibold transition",
                  active
                    ? "border-[var(--color-brand)] bg-[var(--color-brand)]/10 text-[var(--color-brand)]"
                    : "border-[var(--color-border)] bg-white/[0.03] text-slate-300 hover:bg-white/[0.06]",
                )}
              >
                <span>{filter.label}</span>
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-[10px]",
                    active ? "bg-[var(--color-brand)]/15" : "bg-white/5 text-slate-400",
                  )}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <Select
            value={channelFilter}
            onChange={(event) =>
              onChannelFilterChange(
                event.target.value as "all" | ConversationRecord["channel"],
              )
            }
            className="h-11 rounded-2xl bg-white/[0.03] text-xs"
          >
            {channelOptions.map((option) => (
              <option key={option} value={option}>
                {option === "all" ? "Semua Channel" : CHANNEL_LABELS[option]}
              </option>
            ))}
          </Select>

          <Select
            value={statusFilter}
            onChange={(event) =>
              onStatusFilterChange(
                event.target.value as "all" | ConversationStatus,
              )
            }
            className="h-11 rounded-2xl bg-white/[0.03] text-xs"
          >
            <option value="all">Semua Status</option>
            <option value="ai_active">AI Aktif</option>
            <option value="ai_paused">AI Pause</option>
            <option value="assigned_to_admin">Butuh Admin</option>
            <option value="waiting_customer">Menunggu Customer</option>
            <option value="resolved">Selesai</option>
            <option value="blocked">Blocked</option>
            <option value="spam">Spam</option>
          </Select>

          <Select
            value={assignmentFilter}
            onChange={(event) => onAssignmentFilterChange(event.target.value)}
            className="h-11 rounded-2xl bg-white/[0.03] text-xs"
          >
            {assignmentOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>

          <Select
            value={sortBy}
            onChange={(event) => onSortChange(event.target.value)}
            className="h-11 rounded-2xl bg-white/[0.03] text-xs"
          >
            <option value="latest">Urutkan: Terbaru</option>
            <option value="unread">Urutkan: Unread terbanyak</option>
            <option value="priority">Urutkan: Prioritas tertinggi</option>
            <option value="longest_wait">Urutkan: Waktu tunggu terlama</option>
            <option value="oldest">Urutkan: Terlama</option>
          </Select>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-[var(--color-border)] bg-white/[0.03] p-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--color-muted)]">
              Butuh Admin
            </p>
            <p className="mt-2 text-lg font-semibold text-white">
              {summary.needAdminCount}
            </p>
          </div>
          <div className="rounded-2xl border border-[var(--color-border)] bg-white/[0.03] p-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--color-muted)]">
              SLA Terlambat
            </p>
            <p className="mt-2 text-lg font-semibold text-white">
              {summary.slaLateCount}
            </p>
          </div>
        </div>
      </div>

      <div className="custom-scrollbar flex-1 overflow-y-auto p-3">
        {conversations.length === 0 ? (
          <EmptyState
            title="Filter tidak menemukan hasil"
            description="Tidak ada percakapan yang sesuai filter saat ini. Coba hapus sebagian filter atau ubah kata kunci pencarian."
            className="min-h-[18rem] border-none bg-transparent p-4"
          />
        ) : (
          <div className="space-y-3">
            {conversations.map((conversation) => {
              const active = selectedId === conversation.id;
              const statusMeta = getConversationStatusMeta(conversation);
              const channelMeta = getChannelMeta(conversation);
              const priorityMeta = getPriorityMeta(conversation);
              const ChannelIcon = channelMeta.icon;
              const StatusIcon = statusMeta.icon;

              return (
                <button
                  key={conversation.id}
                  type="button"
                  onClick={() => onSelectConversation(conversation.id)}
                  className={cn(
                    "w-full rounded-[24px] border p-4 text-left transition",
                    active
                      ? "border-[var(--color-brand)]/30 bg-[var(--color-brand)]/7 shadow-[0_0_0_1px_rgba(34,211,238,0.12)]"
                      : "border-[var(--color-border)] bg-white/[0.02] hover:bg-white/[0.05]",
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className="relative">
                      <Avatar fallback={conversation.name} className="h-11 w-11" />
                      {conversation.unreadCount > 0 ? (
                        <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--color-brand)] px-1 text-[10px] font-bold text-slate-950">
                          {conversation.unreadCount}
                        </span>
                      ) : null}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="truncate text-sm font-semibold text-white">
                              {conversation.name}
                            </h3>
                            {conversation.unreadCount > 0 ? (
                              <span className="h-2 w-2 rounded-full bg-cyan-400" />
                            ) : null}
                          </div>
                          <div className="mt-1 flex items-center gap-1 text-[11px] text-slate-400">
                            <ChannelIcon className="h-3.5 w-3.5" />
                            <span>{channelMeta.label}</span>
                            <Dot className="h-3 w-3" />
                            <span>{conversation.timestamp}</span>
                          </div>
                        </div>

                        <Badge className={cn("px-2 py-1 text-[10px]", priorityMeta.toneClassName)}>
                          {priorityMeta.label}
                        </Badge>
                      </div>

                      <p className="mt-3 line-clamp-2 text-[12px] leading-5 text-slate-300">
                        {conversation.lastMessage}
                      </p>

                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <Badge className={cn("px-2 py-1 text-[10px]", statusMeta.toneClassName)}>
                          <StatusIcon className="mr-1 h-3.5 w-3.5" />
                          {statusMeta.shortLabel}
                        </Badge>
                        <span className="rounded-full border border-white/10 bg-white/[0.03] px-2 py-1 text-[10px] text-slate-300">
                          {conversation.lastIntent}
                        </span>
                        {conversation.tags.slice(0, 1).map((tag) => (
                          <span
                            key={tag}
                            className="rounded-full border border-white/10 bg-white/[0.03] px-2 py-1 text-[10px] text-slate-400"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>

                      <div className="mt-3 flex items-center justify-between gap-3 text-[10px] text-slate-400">
                        <span className="truncate">{conversation.assignedTo}</span>
                        <span className="inline-flex items-center gap-1">
                          <Clock3 className="h-3.5 w-3.5" />
                          {formatSlaLabel(conversation)}
                        </span>
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </aside>
  );
}

