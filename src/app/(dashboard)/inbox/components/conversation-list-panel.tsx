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
import { Badge } from "@/components/ui/badge";
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
    <aside className="flex min-h-[42rem] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xs lg:h-full lg:min-h-0">
      {/* Header and Toolbar */}
      <div className="border-b border-slate-100 bg-white">
        <div className="flex items-center justify-between px-4 py-3.5">
          <h2 className="text-base font-bold tracking-tight text-slate-900">
            {getHeaderTitle()}
          </h2>
          <div className="flex items-center gap-1">
            {onRefresh && (
              <button
                type="button"
                onClick={onRefresh}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 cursor-pointer"
                title="Refresh"
              >
                <RefreshCcw className="h-4 w-4" />
              </button>
            )}
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className={cn(
                "inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 cursor-pointer",
                showFilters && "bg-blue-50 text-blue-600 font-bold"
              )}
              title="Filter"
            >
              <Filter className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="px-4 pb-2.5">
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-2.5">
            <div className="flex items-center gap-2.5">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-2xs">
                <Smartphone className="h-3.5 w-3.5" />
              </span>
              <div className="min-w-0 flex-1 space-y-0.5">
                <label
                  htmlFor="inbox-whatsapp-account"
                  className="block text-[9px] font-extrabold uppercase tracking-wider text-emerald-800"
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
                  className="h-8.5 w-full rounded-lg border-emerald-200 bg-white px-2.5 py-0.5 pr-7 text-[11px] font-semibold text-slate-900 shadow-2xs"
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
                className="shrink-0 rounded-lg px-2.5 py-1.5 text-[10px] font-bold text-emerald-700 hover:bg-emerald-100 transition"
              >
                Kelola
              </Link>
            </div>
          </div>
        </div>

        {/* Sorting selection bar */}
        <div className="px-4 pb-2.5 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-1.5 font-semibold">
            <span>Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => onSortChange(e.target.value)}
              className="bg-transparent border-none text-slate-900 font-bold focus:outline-none cursor-pointer text-xs"
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
          <div className="px-4 pb-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <Input
                value={searchQuery}
                onChange={(event) => onSearchChange(event.target.value)}
                placeholder="Cari percakapan..."
                className="h-8 rounded-lg border-slate-200 bg-slate-50 pl-9 text-xs text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:bg-white"
              />
            </div>
          </div>
        )}

        {/* Collapsible Filter Section */}
        {showFilters && (
          <div className="grid gap-2 grid-cols-2 px-4 pb-3 pt-2 border-t border-slate-100 bg-slate-50/50 animate-fade-in">
            <div className="flex flex-col gap-1">
              <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Channel</span>
              <Select
                value={channelFilter}
                onChange={(event) =>
                  onChannelFilterChange(
                    event.target.value as "all" | ConversationRecord["channel"],
                  )
                }
                className="h-8 rounded-lg text-xs"
              >
                {channelOptions.map((option) => (
                  <option key={option} value={option}>
                    {option === "all" ? "All" : CHANNEL_LABELS[option]}
                  </option>
                ))}
              </Select>
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Status</span>
              <Select
                value={statusFilter}
                onChange={(event) =>
                  onStatusFilterChange(
                    event.target.value as "all" | ConversationStatus,
                  )
                }
                className="h-8 rounded-lg text-xs"
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
          <div className="divide-y divide-slate-100">
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
                    "relative w-full px-4 py-3.5 text-left transition duration-150 cursor-pointer block",
                    active ? "bg-blue-50/60" : "hover:bg-slate-50",
                  )}
                >
                  {active && (
                    <span className="absolute inset-y-0 left-0 w-1 bg-blue-600 rounded-r" />
                  )}

                  <div className="flex gap-3">
                    {/* Channel logo in solid colored circle */}
                    <div className={cn(
                      "h-9 w-9 rounded-full flex items-center justify-center shrink-0 border shadow-2xs font-bold text-xs",
                      conversation.channel === "WhatsApp" ? "bg-emerald-50 text-emerald-600 border-emerald-200" :
                        conversation.channel.startsWith("Instagram") ? "bg-fuchsia-50 text-fuchsia-600 border-fuchsia-200" :
                          "bg-blue-50 text-blue-600 border-blue-200"
                    )}>
                      <ChannelIcon className="h-4 w-4" />
                    </div>

                    <div className="min-w-0 flex-1">
                      {/* Name & Time */}
                      <div className="flex items-center justify-between gap-2">
                        <h3 className={cn(
                          "truncate text-xs font-bold text-slate-900",
                          unread && "text-blue-700 font-extrabold"
                        )}>
                          {conversation.name}
                        </h3>
                        <span className={cn(
                          "text-[10px] text-slate-400 shrink-0 font-medium",
                          unread && "text-blue-600 font-bold"
                        )}>
                          {conversation.timestamp}
                        </span>
                      </div>

                      {/* Message Preview & Badge count */}
                      <div className="flex items-start justify-between gap-2 mt-1">
                        <p className={cn(
                          "truncate text-xs leading-normal flex-1",
                          unread ? "text-slate-900 font-semibold" : "text-slate-500"
                        )}>
                          {conversation.lastMessage}
                        </p>
                        {unread && (
                          <span className="inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-blue-600 px-1 text-[9px] font-black text-white shrink-0 shadow-2xs">
                            {conversation.unreadCount}
                          </span>
                        )}
                      </div>

                      {/* Brand & Assignment Status */}
                      <div className="mt-2.5 flex items-center justify-between text-[10px]">
                        <div className="flex items-center gap-1.5">
                          <span className="text-slate-500 font-medium truncate max-w-[100px]">
                            {conversation.channel === "WhatsApp" && whatsappAccount
                              ? whatsappAccount.label
                              : businessName || "Workspace"}
                          </span>
                        </div>
                        <Badge
                          variant={isAssigned ? "default" : "warning"}
                          className="text-[9px] px-1.5 py-0"
                        >
                          {isAssigned ? "Assigned" : "Unassigned"}
                        </Badge>
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
      <div className="shrink-0 border-t border-slate-100 bg-slate-50/50 px-4 py-2.5 text-center text-xs font-bold text-slate-500">
        Unassigned chat: {summary.needAdminCount}
      </div>
    </aside>
  );
}
