"use client";

import Link from "next/link";
import { useState } from "react";
import {
  CheckCheck,
  Clock3,
  MessageSquarePlus,
  MoreVertical,
  Search,
  SlidersHorizontal,
  Filter,
  CheckCircle2,
  RefreshCcw,
  Smartphone,
} from "lucide-react";

import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { ConversationRecord, ConversationStatus } from "@/types/operations";

import {
  type InboxQuickFilterId,
  type InboxSummary,
  type InboxWhatsAppAccountFilter,
  type InboxWhatsAppAccountOption,
  formatSlaLabel,
  getChannelMeta,
  getConversationWhatsAppAccountKey,
  getConversationStatusMeta,
} from "./inbox-view-model";

type ConversationListPanelProps = {
  conversations: ConversationRecord[];
  selectedId: string;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  showSearchInput?: boolean;
  quickFilter: InboxQuickFilterId;
  onQuickFilterChange: (value: InboxQuickFilterId) => void;
  channelFilter: "all" | ConversationRecord["channel"];
  onChannelFilterChange: (value: "all" | ConversationRecord["channel"]) => void;
  channelOptions: Array<"all" | ConversationRecord["channel"]>;
  whatsappAccountFilter: InboxWhatsAppAccountFilter;
  onWhatsAppAccountFilterChange: (
    value: InboxWhatsAppAccountFilter,
  ) => void;
  whatsappAccountOptions: InboxWhatsAppAccountOption[];
  statusFilter: "all" | ConversationStatus;
  onStatusFilterChange: (value: "all" | ConversationStatus) => void;
  assignmentFilter: "all" | string;
  onAssignmentFilterChange: (value: "all" | string) => void;
  assignmentOptions: Array<{ value: "all" | string; label: string }>;
  sortBy: string;
  onSortChange: (value: string) => void;
  summary: InboxSummary;
  onSelectConversation: (conversationId: string) => void;
  onRefresh?: () => void;
  businessName?: string;
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
  showSearchInput,
  quickFilter,
  onQuickFilterChange,
  channelFilter,
  onChannelFilterChange,
  channelOptions,
  whatsappAccountFilter,
  onWhatsAppAccountFilterChange,
  whatsappAccountOptions,
  statusFilter,
  onStatusFilterChange,
  assignmentFilter,
  onAssignmentFilterChange,
  assignmentOptions,
  sortBy,
  onSortChange,
  summary,
  onSelectConversation,
  onRefresh,
  businessName,
}: ConversationListPanelProps) {
  const [showFilters, setShowFilters] = useState(false);
  const activeWhatsAppAccount =
    whatsappAccountOptions.find(
      (option) => option.value === whatsappAccountFilter,
    ) ?? whatsappAccountOptions[0];

  const getHeaderTitle = () => {
    switch (quickFilter) {
      case "all":
        return "All chats";
      case "unhandled":
        return "My chats";
      case "need_admin":
        return "Unassigned";
      case "mine":
        return "Assigned";
      case "resolved":
        return "Resolved";
      default:
        return "Chats";
    }
  };

  return (
    <aside className="flex min-h-[42rem] flex-col overflow-hidden rounded-xl border border-white/[0.06] bg-[#0a0e1c] lg:h-full lg:min-h-0">
      {/* Header and Toolbar */}
      <div className="border-b border-white/[0.06] bg-[#0c1020]/40">
        <div className="flex items-center justify-between px-4.5 py-4">
          <h2 className="text-lg font-bold tracking-tight text-slate-100">
            {getHeaderTitle()}
          </h2>
          <div className="flex items-center gap-1">
            {onRefresh && (
              <button
                type="button"
                onClick={onRefresh}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-white/[0.06] hover:text-slate-200"
                title="Refresh"
              >
                <RefreshCcw className="h-4 w-4" />
              </button>
            )}
            <button
              type="button"
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-white/[0.06] hover:text-slate-200"
              title="Bulk Action"
            >
              <CheckCircle2 className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className={cn(
                "inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-white/[0.06] hover:text-slate-200",
                showFilters && "bg-white/[0.06] text-[#00d2ff]"
              )}
              title="Filter"
            >
              <Filter className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="px-4.5 pb-3">
          <div className="rounded-xl border border-emerald-400/15 bg-emerald-400/[0.05] p-2.5">
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-emerald-400/20 bg-emerald-400/10 text-emerald-300">
                <Smartphone className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <label
                  htmlFor="inbox-whatsapp-account"
                  className="mb-1 block text-[9px] font-extrabold uppercase tracking-[0.14em] text-emerald-300/80"
                >
                  Akun WhatsApp Inbox
                </label>
                <Select
                  id="inbox-whatsapp-account"
                  value={whatsappAccountFilter}
                  onChange={(event) =>
                    onWhatsAppAccountFilterChange(
                      event.target.value as InboxWhatsAppAccountFilter,
                    )
                  }
                  className="h-8 w-full rounded-lg border-white/[0.08] bg-[#0a0e1c] text-[10px] font-semibold text-slate-200"
                >
                  {whatsappAccountOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label} ({option.conversationCount})
                    </option>
                  ))}
                </Select>
              </div>
              <Link
                href="/channels"
                className="shrink-0 rounded-md px-1.5 py-1 text-[9px] font-bold text-[#00d2ff] transition hover:bg-[#00d2ff]/10 hover:text-cyan-200"
              >
                Kelola
              </Link>
            </div>
            <div className="mt-2 flex items-center justify-between gap-2 border-t border-white/[0.05] pt-2 text-[9px] text-slate-500">
              <span className="truncate" title={activeWhatsAppAccount?.detail}>
                {activeWhatsAppAccount?.detail || "Belum ada akun terintegrasi"}
              </span>
              <span className="shrink-0">Balasan memakai nomor asal chat</span>
            </div>
          </div>
        </div>

        {/* Sorting selection bar */}
        <div className="px-4.5 pb-3 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-1.5 font-bold">
            <span>Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => onSortChange(e.target.value)}
              className="bg-transparent border-none text-slate-200 font-extrabold focus:outline-none cursor-pointer"
            >
              <option value="latest">Newest</option>
              <option value="unread">Unread</option>
              <option value="priority">Priority</option>
              <option value="longest_wait">Wait time</option>
              <option value="oldest">Oldest</option>
            </select>
          </div>
        </div>

        {/* Collapsible search bar */}
        {(showSearchInput || searchQuery) && (
          <div className="px-4.5 pb-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
              <Input
                value={searchQuery}
                onChange={(event) => onSearchChange(event.target.value)}
                placeholder="Cari percakapan..."
                className="h-9 rounded-lg border-white/[0.08] bg-white/[0.04] pl-9 text-xs text-slate-200 placeholder:text-slate-500 focus:border-[#00d2ff]/80 focus:bg-white/[0.08]"
              />
            </div>
          </div>
        )}

        {/* Collapsible Filter Section */}
        {showFilters && (
          <div className="grid gap-2 grid-cols-2 px-4.5 pb-4.5 pt-3.5 border-t border-white/[0.04] bg-[#080c18]/30 animate-fade-in">
            <div className="flex flex-col gap-1">
              <span className="text-[9px] uppercase font-bold text-slate-500 tracking-wider">Channel</span>
              <Select
                value={channelFilter}
                onChange={(event) =>
                  onChannelFilterChange(
                    event.target.value as "all" | ConversationRecord["channel"],
                  )
                }
                className="h-8 rounded-lg border-white/[0.08] bg-white/[0.04] text-[10px] text-slate-300"
              >
                {channelOptions.map((option) => (
                  <option key={option} value={option}>
                    {option === "all" ? "All" : CHANNEL_LABELS[option]}
                  </option>
                ))}
              </Select>
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-[9px] uppercase font-bold text-slate-500 tracking-wider">Status</span>
              <Select
                value={statusFilter}
                onChange={(event) =>
                  onStatusFilterChange(
                    event.target.value as "all" | ConversationStatus,
                  )
                }
                className="h-8 rounded-lg border-white/[0.08] bg-white/[0.04] text-[10px] text-slate-300"
              >
                <option value="all">All</option>
                <option value="ai_active">AI Active</option>
                <option value="ai_paused">AI Paused</option>
                <option value="assigned_to_admin">Human</option>
                <option value="waiting_customer">Waiting</option>
                <option value="resolved">Resolved</option>
              </Select>
            </div>
          </div>
        )}
      </div>

      {/* Conversations List */}
      <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto overscroll-contain">
        {conversations.length === 0 ? (
          <EmptyState
            title="Tidak ada percakapan"
            description="Coba ubah filter atau kata kunci pencarian untuk melihat percakapan lain."
            className="min-h-[18rem] border-none bg-transparent p-4"
          />
        ) : (
          <div className="divide-y divide-white/[0.04]">
            {conversations.map((conversation) => {
              const active = selectedId === conversation.id;
              const unread = conversation.unreadCount > 0;
              const channelMeta = getChannelMeta(conversation);
              const ChannelIcon = channelMeta.icon;
              const whatsappAccount = whatsappAccountOptions.find(
                (option) =>
                  option.value ===
                  getConversationWhatsAppAccountKey(conversation),
              );
              const isAssigned = conversation.assignedTo !== "AI Agent" && conversation.assignedTo !== "AI";

              return (
                <button
                  key={conversation.id}
                  type="button"
                  onClick={() => onSelectConversation(conversation.id)}
                  className={cn(
                    "relative w-full px-4.5 py-4 text-left transition duration-150 cursor-pointer block",
                    active ? "bg-white/[0.04]" : "hover:bg-white/[0.02]",
                  )}
                >
                  {active && (
                    <span className="absolute inset-y-0 left-0 w-0.5 bg-[#00d2ff]" />
                  )}

                  <div className="flex gap-3">
                    {/* Channel logo in solid colored circle */}
                    <div className={cn(
                      "h-10 w-10 rounded-full flex items-center justify-center shrink-0 border transition-transform duration-200",
                      active && "scale-105",
                      conversation.channel === "WhatsApp" ? "bg-emerald-600/10 text-emerald-400 border-emerald-500/20" :
                      conversation.channel.startsWith("Instagram") ? "bg-fuchsia-600/10 text-fuchsia-400 border-fuchsia-500/20" :
                      "bg-cyan-600/10 text-cyan-400 border-cyan-500/20"
                    )}>
                      <ChannelIcon className="h-5 w-5" />
                    </div>

                    <div className="min-w-0 flex-1">
                      {/* Name & Time */}
                      <div className="flex items-center justify-between gap-2.5">
                        <h3 className={cn(
                          "truncate text-sm text-slate-200 font-bold",
                          unread && "text-white"
                        )}>
                          {conversation.name}
                        </h3>
                        <span className={cn(
                          "text-[10px] text-slate-500 shrink-0 font-medium",
                          unread && "text-[#00d2ff] font-bold"
                        )}>
                          {conversation.timestamp}
                        </span>
                      </div>

                      {/* Message Preview & Badge count */}
                      <div className="flex items-start justify-between gap-2.5 mt-1">
                        <p className={cn(
                          "truncate text-xs leading-normal flex-1",
                          unread ? "text-slate-200 font-semibold" : "text-slate-500"
                        )}>
                          {conversation.lastMessage}
                        </p>
                        {unread && (
                          <span className="inline-flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-rose-600 px-1 py-0.5 text-[9px] font-black text-white shrink-0 shadow-[0_2px_6px_rgba(225,29,72,0.3)]">
                            {conversation.unreadCount}
                          </span>
                        )}
                      </div>

                      {/* Brand & Assignment Status */}
                      <div className="mt-3 flex items-center justify-between text-[10px]">
                        <div className="flex items-center gap-1.5">
                          <span className="text-slate-500 font-bold tracking-wide">
                            {conversation.channel === "WhatsApp" && whatsappAccount
                              ? whatsappAccount.label
                              : businessName || "Workspace"}
                          </span>
                          <span className={cn(
                            "px-1.5 py-0.5 rounded text-[8px] font-extrabold tracking-wide uppercase border shrink-0",
                            conversation.sentiment === "positive" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                            conversation.sentiment === "negative" ? "bg-rose-500/10 text-rose-400 border-rose-500/20" :
                            "bg-slate-500/10 text-slate-400 border-slate-500/20"
                          )}>
                            {conversation.sentiment === "positive" ? "😊 Positif" :
                             conversation.sentiment === "negative" ? "😡 Negatif" : "😐 Netral"}
                          </span>
                        </div>
                        <span className={cn(
                          "px-2 py-0.5 rounded text-[9px] font-bold tracking-wide uppercase border",
                          isAssigned
                            ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                            : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                        )}>
                          {isAssigned ? "Assigned" : "Unassigned"}
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

      {/* Unassigned Chat Count Footer */}
      <div className="shrink-0 border-t border-white/[0.04] bg-[#080c18]/50 px-4.5 py-3 text-center text-xs font-bold text-slate-500 tracking-wider">
        Unassigned chat: {summary.needAdminCount}
      </div>
    </aside>
  );
}
