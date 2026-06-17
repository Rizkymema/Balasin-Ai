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
      return "border-[#b8e7c9] bg-[#eefbf2] text-[#279455]";
    case "assigned_to_admin":
      return "border-[#bfd3ff] bg-[#edf4ff] text-[#2563eb]";
    case "waiting_customer":
      return "border-[#c7defe] bg-[#eef6ff] text-[#1d4ed8]";
    case "ai_paused":
      return "border-[#f3d6a1] bg-[#fff7e8] text-[#b54708]";
    case "blocked":
      return "border-[#f8c4c7] bg-[#fff1f2] text-[#d92d20]";
    case "spam":
      return "border-[#d6dbe5] bg-[#f7f8fa] text-[#667085]";
    default:
      return "border-[#d7e7ff] bg-[#eff6ff] text-[#1570ef]";
  }
}

function unreadBadgeClass(channel: ConversationRecord["channel"]) {
  if (channel === "WhatsApp") {
    return "bg-[#22c55e] text-white";
  }

  if (channel === "Instagram DM" || channel === "Instagram Comment") {
    return "bg-[#ec4899] text-white";
  }

  return "bg-[#1570ef] text-white";
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
    <aside className="flex min-h-[42rem] flex-col overflow-hidden rounded-[18px] border border-[#d9dfeb] bg-white shadow-[0_8px_24px_rgba(92,110,145,0.08)]">
      <div className="border-b border-[#e6ebf2]">
        <div className="flex items-center justify-between px-4 py-4">
          <h2 className="text-[1.45rem] font-semibold tracking-[-0.03em] text-[#344054]">
            Inbox
          </h2>
          <div className="flex items-center gap-1">
            <button
              type="button"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full text-[#98a2b3] transition hover:bg-[#f5f7fb] hover:text-[#344054]"
              title="Cari"
            >
              <Search className="h-[18px] w-[18px]" />
            </button>
            <button
              type="button"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full text-[#98a2b3] transition hover:bg-[#f5f7fb] hover:text-[#344054]"
              title="Mulai chat baru"
            >
              <MessageSquarePlus className="h-[18px] w-[18px]" />
            </button>
            <button
              type="button"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full text-[#98a2b3] transition hover:bg-[#f5f7fb] hover:text-[#344054]"
              title="Filter inbox"
            >
              <SlidersHorizontal className="h-[18px] w-[18px]" />
            </button>
            <button
              type="button"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full text-[#98a2b3] transition hover:bg-[#f5f7fb] hover:text-[#344054]"
              title="Menu"
            >
              <MoreVertical className="h-[18px] w-[18px]" />
            </button>
          </div>
        </div>

        <div className="px-4 pb-3">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#98a2b3]" />
            <Input
              value={searchQuery}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Cari pelanggan atau isi chat"
              className="h-11 rounded-[14px] border-[#dfe5ef] bg-[#f8fafc] pl-10 text-sm text-[#344054] placeholder:text-[#98a2b3]"
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
                    ? "border-[#1570ef] text-[#1570ef]"
                    : "border-transparent text-[#667085] hover:text-[#344054]",
                )}
              >
                <span>{filter.label}</span>
                {count > 0 ? <span className="ml-1.5">{count}</span> : null}
              </button>
            );
          })}
        </div>

        <div className="grid gap-2 border-t border-[#eef2f6] px-4 py-3">
          <div className="grid gap-2 sm:grid-cols-2">
            <Select
              value={channelFilter}
              onChange={(event) =>
                onChannelFilterChange(
                  event.target.value as "all" | ConversationRecord["channel"],
                )
              }
              className="h-9 rounded-[12px] border-[#d9e0ec] bg-white text-[11px] text-[#667085]"
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
              className="h-9 rounded-[12px] border-[#d9e0ec] bg-white text-[11px] text-[#667085]"
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
              className="h-9 rounded-[12px] border-[#d9e0ec] bg-white text-[11px] text-[#667085]"
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
              className="h-9 rounded-[12px] border-[#d9e0ec] bg-white text-[11px] text-[#667085]"
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

      <div className="custom-scrollbar flex-1 overflow-y-auto bg-white">
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
                    "relative w-full border-b border-[#eef2f6] px-4 py-3 text-left transition",
                    active ? "bg-[#f7faff]" : "hover:bg-[#fafcff]",
                  )}
                >
                  {active ? (
                    <span className="absolute inset-y-0 right-0 w-1 rounded-l-full bg-[#1570ef]" />
                  ) : null}

                  <div className="flex items-start gap-3">
                    <Avatar
                      fallback={conversation.name}
                      className="h-11 w-11 border-[#dde4ee] bg-[#f5f7fb] text-[#667085]"
                    />

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <h3
                              className={cn(
                                "truncate text-[15px] text-[#344054]",
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

                          <div className="mt-1 flex items-center gap-1.5 text-[11px] text-[#98a2b3]">
                            <ChannelIcon className="h-3.5 w-3.5" />
                            <span>{channelMeta.label}</span>
                            <span className="h-1 w-1 rounded-full bg-[#c7d0dd]" />
                            <span className="truncate">{conversation.assignedTo}</span>
                          </div>
                        </div>

                        <div className="flex shrink-0 flex-col items-end gap-2">
                          <span
                            className={cn(
                              "text-[11px]",
                              unread ? "font-semibold text-[#1570ef]" : "text-[#98a2b3]",
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
                            <span className="inline-flex items-center gap-1 text-[10px] text-[#98a2b3]">
                              <CheckCheck className="h-3.5 w-3.5" />
                              Read
                            </span>
                          )}
                        </div>
                      </div>

                      <p
                        className={cn(
                          "mt-2 line-clamp-1 text-[13px] leading-5",
                          unread ? "text-[#475467]" : "text-[#667085]",
                        )}
                      >
                        {conversation.lastMessage}
                      </p>

                      <div className="mt-2 flex items-center justify-between gap-3">
                        <div className="flex min-w-0 flex-wrap items-center gap-1.5">
                          <Badge className="rounded-full border-[#dfe5ef] bg-white px-2 py-0.5 text-[10px] text-[#667085]">
                            {conversation.lastIntent}
                          </Badge>
                          {conversation.tags.slice(0, 1).map((tag) => (
                            <span
                              key={tag}
                              className="rounded-full bg-[#f2f4f7] px-2 py-0.5 text-[10px] text-[#667085]"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>

                        <span className="inline-flex shrink-0 items-center gap-1 text-[10px] text-[#98a2b3]">
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
