"use client";

import {
  Clock3,
  MessageSquarePlus,
  MoreVertical,
  Search,
} from "lucide-react";

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
    <aside className="flex min-h-[42rem] flex-col overflow-hidden rounded-[28px] border border-[#243138] bg-[#111b21]">
      <div className="border-b border-[#243138] px-4 py-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-[2rem] font-semibold tracking-[-0.03em] text-white">
            WhatsApp
          </h2>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full text-slate-300 transition hover:bg-white/[0.06] hover:text-white"
              title="Mulai chat baru"
            >
              <MessageSquarePlus className="h-5 w-5" />
            </button>
            <button
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full text-slate-300 transition hover:bg-white/[0.06] hover:text-white"
              title="Menu"
            >
              <MoreVertical className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="relative">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={searchQuery}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Cari atau mulai obrolan baru"
            className="h-14 rounded-full border-transparent bg-[#202c33] pl-11 text-sm text-white placeholder:text-slate-400 focus:border-transparent focus:ring-0"
          />
        </div>

        <div className="mt-4 flex gap-2 overflow-x-auto pb-1 custom-scrollbar">
          {QUICK_FILTERS.map((filter) => {
            const count = quickFilterCount(summary, filter.id);
            const active = filter.id === quickFilter;
            const isUnreadFilter = filter.id === "unhandled";

            return (
              <button
                key={filter.id}
                type="button"
                onClick={() => onQuickFilterChange(filter.id)}
                className={cn(
                  "inline-flex shrink-0 items-center gap-2 rounded-full border px-4 py-2.5 text-[11px] font-semibold transition",
                  active
                    ? "border-[#1f5f4a] bg-[#103529] text-[#d6ffe9]"
                    : "border-[#2a3942] bg-transparent text-slate-300 hover:bg-white/[0.04]",
                )}
              >
                <span>{filter.label}</span>
                {count > 0 || isUnreadFilter ? (
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-[10px]",
                      active
                        ? "bg-[#184c3b] text-[#d6ffe9]"
                        : "bg-white/5 text-slate-400",
                    )}
                  >
                    {count}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>

        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          <Select
            value={channelFilter}
            onChange={(event) =>
              onChannelFilterChange(
                event.target.value as "all" | ConversationRecord["channel"],
              )
            }
            className="h-10 rounded-full border-[#2a3942] bg-transparent text-[11px] text-slate-300"
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
            className="h-10 rounded-full border-[#2a3942] bg-transparent text-[11px] text-slate-300"
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
            className="h-10 rounded-full border-[#2a3942] bg-transparent text-[11px] text-slate-300"
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
            className="h-10 rounded-full border-[#2a3942] bg-transparent text-[11px] text-slate-300"
          >
            <option value="latest">Urutkan: Terbaru</option>
            <option value="unread">Urutkan: Unread terbanyak</option>
            <option value="priority">Urutkan: Prioritas tertinggi</option>
            <option value="longest_wait">Urutkan: Waktu tunggu terlama</option>
            <option value="oldest">Urutkan: Terlama</option>
          </Select>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <div className="rounded-2xl bg-[#1f2c34] p-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--color-muted)]">
              Butuh Admin
            </p>
            <p className="mt-2 text-lg font-semibold text-white">
              {summary.needAdminCount}
            </p>
          </div>
          <div className="rounded-2xl bg-[#1f2c34] p-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--color-muted)]">
              SLA Terlambat
            </p>
            <p className="mt-2 text-lg font-semibold text-white">
              {summary.slaLateCount}
            </p>
          </div>
        </div>
      </div>

      <div className="custom-scrollbar flex-1 overflow-y-auto">
        {conversations.length === 0 ? (
          <EmptyState
            title="Filter tidak menemukan hasil"
            description="Tidak ada percakapan yang sesuai filter saat ini. Coba hapus sebagian filter atau ubah kata kunci pencarian."
            className="min-h-[18rem] border-none bg-transparent p-4"
          />
        ) : (
          <div className="divide-y divide-[#1f2c34]">
            {conversations.map((conversation) => {
              const active = selectedId === conversation.id;
              const statusMeta = getConversationStatusMeta(conversation);
              const channelMeta = getChannelMeta(conversation);
              const priorityMeta = getPriorityMeta(conversation);
              const ChannelIcon = channelMeta.icon;
              const StatusIcon = statusMeta.icon;
              const unread = conversation.unreadCount > 0;

              return (
                <button
                  key={conversation.id}
                  type="button"
                  onClick={() => onSelectConversation(conversation.id)}
                  className={cn(
                    "w-full px-4 py-3 text-left transition",
                    active
                      ? "bg-[#202c33]"
                      : "bg-transparent hover:bg-white/[0.03]",
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className="relative">
                      <Avatar
                        fallback={conversation.name}
                        className="h-12 w-12 border-transparent bg-[#233138] text-slate-200"
                      />
                      {conversation.unreadCount > 0 ? (
                        <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#25d366] px-1 text-[10px] font-bold text-[#0b141a]">
                          {conversation.unreadCount}
                        </span>
                      ) : null}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <h3
                              className={cn(
                                "truncate text-sm text-white",
                                unread ? "font-semibold" : "font-medium",
                              )}
                            >
                              {conversation.name}
                            </h3>
                          </div>
                          <div className="mt-1 flex items-center gap-1.5 text-[11px] text-slate-500">
                            <ChannelIcon className="h-3 w-3" />
                            <span>{channelMeta.label}</span>
                            <span className="h-1 w-1 rounded-full bg-slate-600" />
                            <span>{conversation.assignedTo}</span>
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-2">
                          <span
                            className={cn(
                              "text-[11px]",
                              unread ? "font-semibold text-[#25d366]" : "text-slate-400",
                            )}
                          >
                            {conversation.timestamp}
                          </span>
                          {unread ? (
                            <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-[#25d366] px-1.5 py-0.5 text-[10px] font-bold text-[#0b141a]">
                              {conversation.unreadCount}
                            </span>
                          ) : (
                            <Badge
                              className={cn(
                                "px-2 py-0.5 text-[9px]",
                                priorityMeta.toneClassName,
                              )}
                            >
                              {priorityMeta.label}
                            </Badge>
                          )}
                        </div>
                      </div>

                      <p
                        className={cn(
                          "mt-2 line-clamp-1 text-[12px] leading-5",
                          unread ? "text-slate-300" : "text-slate-400",
                        )}
                      >
                        {conversation.lastMessage}
                      </p>

                      <div className="mt-2 flex flex-wrap items-center gap-1.5">
                        <Badge className={cn("px-2 py-0.5 text-[9px]", statusMeta.toneClassName)}>
                          <StatusIcon className="mr-1 h-3.5 w-3.5" />
                          {statusMeta.shortLabel}
                        </Badge>
                        <span className="rounded-full bg-[#1f2c34] px-2 py-0.5 text-[9px] text-slate-300">
                          {conversation.lastIntent}
                        </span>
                        {conversation.tags.slice(0, 1).map((tag) => (
                          <span
                            key={tag}
                            className="rounded-full bg-[#1f2c34] px-2 py-0.5 text-[9px] text-slate-400"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                      <div className="mt-2 flex items-center justify-end gap-1 text-[10px] text-slate-500">
                        <Clock3 className="h-3 w-3" />
                        {formatSlaLabel(conversation)}
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
