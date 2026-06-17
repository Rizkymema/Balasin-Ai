"use client";

import {
  CheckCheck,
  Clock3,
  MessageSquarePlus,
  MoreVertical,
  Search,
  SlidersHorizontal,
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
  formatSlaLabel,
  getChannelMeta,
  getConversationStatusMeta,
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

const PRIMARY_FILTERS: Array<{ id: InboxQuickFilterId; label: string }> = [
  { id: "all", label: "All" },
  { id: "need_admin", label: "Unassigned" },
  { id: "mine", label: "Assigned" },
  { id: "resolved", label: "Resolved" },
];

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

function statusBadgeClass(status: ConversationRecord["status"]) {
  switch (status) {
    case "resolved":
      return "border-emerald-500/30 bg-emerald-500/15 text-emerald-300";
    case "assigned_to_admin":
      return "border-blue-400/30 bg-blue-500/15 text-blue-300";
    case "waiting_customer":
      return "border-cyan-400/30 bg-cyan-500/15 text-cyan-300";
    case "ai_paused":
      return "border-amber-400/30 bg-amber-500/15 text-amber-300";
    case "blocked":
      return "border-red-400/30 bg-red-500/15 text-red-300";
    case "spam":
      return "border-slate-500/30 bg-slate-500/15 text-slate-400";
    default:
      return "border-cyan-400/30 bg-cyan-500/15 text-cyan-300";
  }
}

function unreadBadgeClass(channel: ConversationRecord["channel"]) {
  if (channel === "WhatsApp") {
    return "bg-emerald-500 text-white";
  }

  if (channel === "Instagram DM" || channel === "Instagram Comment") {
    return "bg-fuchsia-500 text-white";
  }

  return "bg-cyan-500 text-white";
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
    <aside className="flex min-h-[42rem] flex-col overflow-hidden rounded-xl border border-white/[0.06] bg-[#0a0e1c] lg:h-full lg:min-h-0">
      <div className="border-b border-white/[0.06]">
        <div className="flex items-center justify-between px-4 py-4">
          <h2 className="text-lg font-semibold tracking-tight text-slate-100">
            Inbox
          </h2>
          <div className="flex items-center gap-1">
            <button
              type="button"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full text-slate-400 transition hover:bg-white/[0.06] hover:text-slate-200"
              title="Cari"
            >
              <Search className="h-[18px] w-[18px]" />
            </button>
            <button
              type="button"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full text-slate-400 transition hover:bg-white/[0.06] hover:text-slate-200"
              title="Mulai chat baru"
            >
              <MessageSquarePlus className="h-[18px] w-[18px]" />
            </button>
            <button
              type="button"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full text-slate-400 transition hover:bg-white/[0.06] hover:text-slate-200"
              title="Filter inbox"
            >
              <SlidersHorizontal className="h-[18px] w-[18px]" />
            </button>
            <button
              type="button"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full text-slate-400 transition hover:bg-white/[0.06] hover:text-slate-200"
              title="Menu"
            >
              <MoreVertical className="h-[18px] w-[18px]" />
            </button>
          </div>
        </div>

        <div className="px-4 pb-3">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <Input
              value={searchQuery}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Cari pelanggan atau isi chat"
              className="h-11 rounded-xl border-white/[0.08] bg-white/[0.04] pl-10 text-sm text-slate-200 placeholder:text-slate-500"
            />
          </div>
        </div>

        <div className="flex gap-5 overflow-x-auto px-4 text-[13px] custom-scrollbar">
          {PRIMARY_FILTERS.map((filter) => {
            const active = quickFilter === filter.id;
            const count = quickFilterCount(summary, filter.id);

            return (
              <button
                key={filter.id}
                type="button"
                onClick={() => onQuickFilterChange(filter.id)}
                className={cn(
                  "shrink-0 border-b-2 pb-3 pt-0.5 font-medium transition",
                  active
                    ? "border-[#00d2ff] text-[#00d2ff]"
                    : "border-transparent text-slate-500 hover:text-slate-300",
                )}
              >
                <span>{filter.label}</span>
                {count > 0 ? <span className="ml-1.5">{count}</span> : null}
              </button>
            );
          })}
        </div>

        <div className="grid gap-2 border-t border-white/[0.06] px-4 py-3">
          <div className="grid gap-2 sm:grid-cols-2">
            <Select
              value={channelFilter}
              onChange={(event) =>
                onChannelFilterChange(
                  event.target.value as "all" | ConversationRecord["channel"],
                )
              }
              className="h-9 rounded-xl border-white/[0.08] bg-white/[0.04] text-[11px] text-slate-400"
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
              className="h-9 rounded-xl border-white/[0.08] bg-white/[0.04] text-[11px] text-slate-400"
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
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <Select
              value={assignmentFilter}
              onChange={(event) => onAssignmentFilterChange(event.target.value)}
              className="h-9 rounded-xl border-white/[0.08] bg-white/[0.04] text-[11px] text-slate-400"
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
              className="h-9 rounded-xl border-white/[0.08] bg-white/[0.04] text-[11px] text-slate-400"
            >
              <option value="latest">Urut: Terbaru</option>
              <option value="unread">Urut: Unread</option>
              <option value="priority">Urut: Prioritas</option>
              <option value="longest_wait">Urut: Terlama menunggu</option>
              <option value="oldest">Urut: Terlama</option>
            </Select>
          </div>
        </div>
      </div>

      <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto">
        {conversations.length === 0 ? (
          <EmptyState
            title="Tidak ada percakapan"
            description="Coba ubah filter atau kata kunci pencarian untuk melihat percakapan lain."
            className="min-h-[18rem] border-none bg-transparent p-4"
          />
        ) : (
          <div>
            {conversations.map((conversation) => {
              const active = selectedId === conversation.id;
              const unread = conversation.unreadCount > 0;
              const statusMeta = getConversationStatusMeta(conversation);
              const channelMeta = getChannelMeta(conversation);
              const ChannelIcon = channelMeta.icon;

              return (
                <button
                  key={conversation.id}
                  type="button"
                  onClick={() => onSelectConversation(conversation.id)}
                  className={cn(
                    "relative w-full border-b border-white/[0.04] px-4 py-3 text-left transition",
                    active ? "bg-white/[0.06]" : "hover:bg-white/[0.03]",
                  )}
                >
                  {active ? (
                    <span className="absolute inset-y-0 right-0 w-1 rounded-l-full bg-[#00d2ff]" />
                  ) : null}

                  <div className="flex items-start gap-3">
                    <Avatar
                      fallback={conversation.name}
                      className="h-11 w-11 border-white/[0.08] bg-white/[0.06] text-slate-400"
                    />

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <h3
                              className={cn(
                                "truncate text-[15px] text-slate-200",
                                unread ? "font-semibold" : "font-medium",
                              )}
                            >
                              {conversation.name}
                            </h3>
                            <span
                              className={cn(
                                "inline-flex shrink-0 items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold",
                                statusBadgeClass(conversation.status),
                              )}
                            >
                              {statusMeta.shortLabel}
                            </span>
                          </div>

                          <div className="mt-1 flex items-center gap-1.5 text-[11px] text-slate-500">
                            <ChannelIcon className="h-3.5 w-3.5" />
                            <span>{channelMeta.label}</span>
                            <span className="h-1 w-1 rounded-full bg-slate-600" />
                            <span className="truncate">{conversation.assignedTo}</span>
                          </div>
                        </div>

                        <div className="flex shrink-0 flex-col items-end gap-2">
                          <span
                            className={cn(
                              "text-[11px]",
                              unread ? "font-semibold text-[#00d2ff]" : "text-slate-500",
                            )}
                          >
                            {conversation.timestamp}
                          </span>
                          {unread ? (
                            <span
                              className={cn(
                                "inline-flex min-w-5 items-center justify-center rounded-full px-1.5 py-0.5 text-[10px] font-bold",
                                unreadBadgeClass(conversation.channel),
                              )}
                            >
                              {conversation.unreadCount}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] text-slate-500">
                              <CheckCheck className="h-3.5 w-3.5" />
                              Read
                            </span>
                          )}
                        </div>
                      </div>

                      <p
                        className={cn(
                          "mt-2 line-clamp-1 text-[13px] leading-5",
                          unread ? "text-slate-300" : "text-slate-500",
                        )}
                      >
                        {conversation.lastMessage}
                      </p>

                      <div className="mt-2 flex items-center justify-between gap-3">
                        <div className="flex min-w-0 flex-wrap items-center gap-1.5">
                          <Badge className="rounded-full border-white/[0.08] bg-white/[0.04] px-2 py-0.5 text-[10px] text-slate-400">
                            {conversation.lastIntent}
                          </Badge>
                          {conversation.tags.slice(0, 1).map((tag) => (
                            <span
                              key={tag}
                              className="rounded-full bg-white/[0.06] px-2 py-0.5 text-[10px] text-slate-400"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>

                        <span className="inline-flex shrink-0 items-center gap-1 text-[10px] text-slate-500">
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
