"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  Bot,
  Check,
  CheckCheck,
  Clock3,
  MessageSquare,
  Paperclip,
  PauseCircle,
  Search,
  Send,
  ShieldAlert,
  Smile,
  Sparkles,
  Ticket,
  Trash2,
  User,
  Wifi,
} from "lucide-react";

import { useDashboardConfig } from "@/hooks/use-dashboard-config";
import { useDashboardOperations } from "@/hooks/use-dashboard-operations";
import type {
  ConversationMessage,
  ConversationRecord,
  ConversationStatus,
} from "@/types/operations";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const statusLabels: Record<ConversationStatus, string> = {
  ai_active: "AI Aktif",
  ai_paused: "AI Pause",
  assigned_to_admin: "Butuh Admin",
  waiting_customer: "Menunggu Customer",
  resolved: "Selesai",
  blocked: "Blocked",
  spam: "Spam",
};

const statusClasses: Record<ConversationStatus, string> = {
  ai_active: "border-cyan-500/20 bg-cyan-950/20 text-cyan-400",
  ai_paused: "border-amber-400/20 bg-amber-950/20 text-amber-300",
  assigned_to_admin: "border-rose-400/20 bg-rose-950/20 text-rose-300",
  waiting_customer: "border-sky-400/20 bg-sky-950/20 text-sky-300",
  resolved: "border-emerald-400/20 bg-emerald-950/20 text-emerald-300",
  blocked: "border-orange-400/20 bg-orange-950/20 text-orange-300",
  spam: "border-white/10 bg-white/5 text-slate-300",
};

const AI_REPLY_STATUSES: ConversationStatus[] = ["ai_active", "waiting_customer"];

function getMessageStatusMeta(message: ConversationMessage) {
  switch (message.status) {
    case "read":
      return {
        label: "Dilihat",
        icon: <CheckCheck className="h-3 w-3 text-cyan-400" />,
      };
    case "delivered":
      return {
        label: "Tersampaikan",
        icon: <CheckCheck className="h-3 w-3 text-slate-400" />,
      };
    case "sent":
      return {
        label: "Terkirim",
        icon: <Check className="h-3 w-3 text-slate-500" />,
      };
    default:
      return null;
  }
}

export default function InboxPage() {
  const { config } = useDashboardConfig();
  const { data, refreshData } = useDashboardOperations();

  const [selectedId, setSelectedId] = useState<string>(
    data.conversations[0]?.id ?? "",
  );
  const [filterType, setFilterType] = useState<
    "all" | "needs_admin" | ConversationStatus
  >("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [replyText, setReplyText] = useState("");
  const [noteDraft, setNoteDraft] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isReplyTyping, setIsReplyTyping] = useState(false);
  const [noteSaved, setNoteSaved] = useState(false);

  const filteredConversations = useMemo(() => {
    return data.conversations.filter((conversation) => {
      const searchNeedle = searchQuery.toLowerCase();
      const matchesSearch =
        conversation.name.toLowerCase().includes(searchNeedle) ||
        conversation.lastMessage.toLowerCase().includes(searchNeedle) ||
        conversation.tags.join(" ").toLowerCase().includes(searchNeedle);

      const matchesFilter =
        filterType === "all"
          ? true
          : filterType === "needs_admin"
            ? conversation.status === "assigned_to_admin" ||
              conversation.status === "blocked"
            : conversation.status === filterType;

      return matchesSearch && matchesFilter;
    });
  }, [data.conversations, filterType, searchQuery]);

  const activeConversation =
    data.conversations.find((conversation) => conversation.id === selectedId) ??
    filteredConversations[0] ??
    data.conversations[0];
  const activeConversationId = activeConversation?.id ?? "";
  const activeUnreadCount = activeConversation?.unreadCount ?? 0;

  useEffect(() => {
    if (!selectedId && data.conversations[0]?.id) {
      setSelectedId(data.conversations[0].id);
    }
  }, [data.conversations, selectedId]);

  useEffect(() => {
    if (
      selectedId &&
      data.conversations.length > 0 &&
      !data.conversations.some((conversation) => conversation.id === selectedId)
    ) {
      setSelectedId(data.conversations[0]?.id ?? "");
    }
  }, [data.conversations, selectedId]);

  useEffect(() => {
    setNoteDraft(activeConversation?.notes ?? "");
  }, [activeConversation?.id, activeConversation?.notes]);

  useEffect(() => {
    if (!activeConversationId || activeUnreadCount === 0) {
      return;
    }

    void fetch(`/api/inbox/conversations/${activeConversationId}/seen`, {
      method: "POST",
      credentials: "include",
    }).then(() => refreshData());
  }, [activeConversationId, activeUnreadCount, refreshData]);

  const runConversationAction = async (path: string, init: RequestInit) => {
    setIsSubmitting(true);

    try {
      const response = await fetch(path, {
        ...init,
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...(init.headers ?? {}),
        },
      });

      if (!response.ok) {
        const payload = (await response.json()) as { error?: string };
        throw new Error(payload.error ?? "Aksi inbox gagal dijalankan.");
      }

      await refreshData();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSend = async (event: FormEvent) => {
    event.preventDefault();
    if (!replyText.trim() || !activeConversation) {
      return;
    }

    const nextReply = replyText.trim();
    setReplyText("");
    setIsReplyTyping(true);

    try {
      await Promise.all([
        runConversationAction(`/api/inbox/conversations/${activeConversation.id}/reply`, {
          method: "POST",
          body: JSON.stringify({ message: nextReply }),
        }),
        new Promise((resolve) => window.setTimeout(resolve, 650)),
      ]);
    } catch {
      setReplyText(nextReply);
    } finally {
      setIsReplyTyping(false);
    }
  };

  const handleStatusAction = (nextStatus: ConversationStatus) => {
    if (!activeConversation) {
      return;
    }

    void runConversationAction(
      `/api/inbox/conversations/${activeConversation.id}/status`,
      {
        method: "POST",
        body: JSON.stringify({ status: nextStatus }),
      },
    );
  };

  const handleCreateTicket = () => {
    if (!activeConversation) {
      return;
    }

    void runConversationAction(
      `/api/inbox/conversations/${activeConversation.id}/ticket`,
      {
        method: "POST",
        body: JSON.stringify({}),
      },
    );
  };

  const handleSaveNotes = async () => {
    if (!activeConversation) {
      return;
    }

    await runConversationAction(
      `/api/inbox/conversations/${activeConversation.id}/notes`,
      {
        method: "PUT",
        body: JSON.stringify({ notes: noteDraft }),
      },
    );

    setNoteSaved(true);
    window.setTimeout(() => setNoteSaved(false), 2000);
  };

  const handleDeleteConversation = async () => {
    if (!activeConversation) {
      return;
    }

    const confirmed = window.confirm(
      `Hapus chat ${activeConversation.name} dari dashboard inbox?`,
    );
    if (!confirmed) {
      return;
    }

    await runConversationAction(`/api/inbox/conversations/${activeConversation.id}`, {
      method: "DELETE",
    });
  };

  if (!activeConversation) {
    return (
      <EmptyState
        icon={<MessageSquare className="h-10 w-10" />}
        title="Inbox masih kosong"
        description="Belum ada percakapan masuk. Hubungkan channel atau kirim test inbound dari halaman Channels agar chat mulai masuk ke inbox."
        className="min-h-[420px]"
      />
    );
  }

  const filterButtons: Array<{
    key: "all" | "needs_admin" | ConversationStatus;
    label: string;
  }> = [
    { key: "all", label: "Semua" },
    { key: "ai_active", label: "AI Aktif" },
    { key: "needs_admin", label: "Butuh Admin" },
    { key: "waiting_customer", label: "Menunggu" },
    { key: "resolved", label: "Selesai" },
    { key: "spam", label: "Spam" },
  ];

  return (
    <div className="flex h-[calc(100vh-8.5rem)] overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] animate-fade-in">
      {/* LEFT COLUMN: CHAT LIST */}
      <div className="flex h-full w-80 shrink-0 flex-col border-r border-[var(--color-border)] bg-[var(--color-surface-strong)]/20">
        <div className="space-y-3 shrink-0 border-b border-[var(--color-border)] p-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-[var(--color-muted)]" />
            <Input
              placeholder="Cari chat, intent, atau tag..."
              className="h-10 pl-9 text-xs border-[var(--color-border)] bg-[var(--color-surface)]"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
            />
          </div>
          <div className="custom-scrollbar flex gap-1.5 overflow-x-auto pb-1">
            {filterButtons.map((type) => (
              <button
                key={type.key}
                onClick={() => setFilterType(type.key)}
                className={`rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-wider transition cursor-pointer shrink-0 ${
                  filterType === type.key
                    ? "border-[var(--color-brand)] bg-[var(--color-brand)]/10 text-[var(--color-brand)]"
                    : "border-[var(--color-border)] bg-[var(--color-surface-strong)]/40 text-[var(--color-muted)] hover:text-white hover:bg-[var(--color-surface-hover)]"
                }`}
              >
                {type.label}
              </button>
            ))}
          </div>
        </div>

        <div className="custom-scrollbar flex-1 overflow-y-auto">
          {filteredConversations.length === 0 ? (
            <div className="p-6 text-center text-xs font-medium text-[var(--color-muted)]">
              Tidak ada percakapan ditemukan.
            </div>
          ) : (
            filteredConversations.map((conversation) => {
              const isActive = conversation.id === activeConversation.id;

              return (
                <div
                  key={conversation.id}
                  onClick={() => setSelectedId(conversation.id)}
                  className={`flex cursor-pointer items-start justify-between border-b border-[var(--color-border)]/50 p-4 transition duration-150 ${
                    isActive ? "bg-[var(--color-surface-hover)]/40" : "hover:bg-[var(--color-surface-hover)]/15"
                  }`}
                >
                  <div className="flex min-w-0 flex-1 gap-3">
                    <div className="relative shrink-0">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--color-brand)]/20 bg-[var(--color-brand)]/5 text-sm font-bold text-[var(--color-brand)]">
                        {conversation.name.charAt(0)}
                      </div>
                      <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-[#050814] bg-emerald-400" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="mb-0.5 flex items-baseline justify-between">
                        <h4 className="truncate text-xs font-bold text-white">
                          {conversation.name}
                        </h4>
                        <span className="shrink-0 text-[9px] font-medium text-[var(--color-muted)]">
                          {conversation.timestamp}
                        </span>
                      </div>
                      <p className="truncate text-[11px] leading-relaxed text-[var(--color-muted)]">
                        {conversation.lastMessage}
                      </p>
                      <div className="mt-2 flex items-center gap-2 text-[10px] text-[var(--color-muted)]/80">
                        <span className="font-semibold text-slate-300">{conversation.channel}</span>
                        <span>|</span>
                        <span className="truncate">{conversation.lastIntent}</span>
                      </div>
                    </div>
                  </div>

                  <div className="ml-2.5 flex shrink-0 flex-col items-end gap-1.5">
                    <Badge className={`px-1.5 py-0.5 text-[9px] tracking-wider ${statusClasses[conversation.status]}`}>
                      {statusLabels[conversation.status]}
                    </Badge>
                    {conversation.unreadCount > 0 ? (
                      <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[var(--color-brand)] text-[9px] font-bold text-slate-950">
                        {conversation.unreadCount}
                      </span>
                    ) : null}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* MIDDLE COLUMN: ACTIVE CONVERSATION */}
      <div className="flex h-full flex-1 flex-col bg-[var(--color-surface-strong)]/10">
        <div className="flex shrink-0 items-center justify-between border-b border-[var(--color-border)] px-6 py-4 bg-[var(--color-surface)]/20">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--color-brand)]/20 bg-[var(--color-surface-hover)] text-sm font-bold text-[var(--color-brand)]">
                {activeConversation.name.charAt(0)}
              </div>
              <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-[#050814] bg-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm font-bold text-white leading-none">{activeConversation.name}</h3>
                <Badge className={`px-1.5 py-0 text-[9px] font-semibold leading-normal ${statusClasses[activeConversation.status]}`}>
                  {statusLabels[activeConversation.status]}
                </Badge>
                {activeConversation.status === "ai_active" && (
                  <Badge className="border-cyan-400/20 bg-cyan-400/5 text-cyan-400 text-[9px] px-1.5 py-0 leading-normal">
                    {activeConversation.aiConfidence}% match
                  </Badge>
                )}
              </div>
              <p className="mt-1 flex items-center gap-1.5 text-[10px] text-[var(--color-muted)] font-medium">
                via {activeConversation.channel}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Primary Action Button based on state */}
            {activeConversation.status === "ai_active" && (
              <>
                <button
                  type="button"
                  onClick={() => handleStatusAction("assigned_to_admin")}
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-amber-500/20 bg-amber-500/10 px-3 py-1.5 text-xs font-bold text-amber-400 hover:bg-amber-500/20 transition cursor-pointer"
                >
                  Ambil Alih Chat
                </button>
                <button
                  type="button"
                  onClick={() => handleStatusAction("ai_paused")}
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1.5 text-xs font-bold text-white hover:bg-[var(--color-surface-hover)] transition cursor-pointer"
                >
                  Pause AI
                </button>
              </>
            )}

            {activeConversation.status === "ai_paused" && (
              <>
                <button
                  type="button"
                  onClick={() => handleStatusAction("ai_active")}
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-cyan-500/20 bg-cyan-500/10 px-3 py-1.5 text-xs font-bold text-cyan-400 hover:bg-cyan-500/20 transition cursor-pointer"
                >
                  Aktifkan AI
                </button>
                <button
                  type="button"
                  onClick={() => handleStatusAction("assigned_to_admin")}
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1.5 text-xs font-bold text-white hover:bg-[var(--color-surface-hover)] transition cursor-pointer"
                >
                  Tugaskan Admin
                </button>
              </>
            )}

            {activeConversation.status === "assigned_to_admin" && (
              <>
                <button
                  type="button"
                  onClick={() => handleStatusAction("resolved")}
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-xs font-bold text-emerald-400 hover:bg-emerald-500/20 transition cursor-pointer"
                >
                  Tandai Selesai
                </button>
                <button
                  type="button"
                  onClick={() => handleStatusAction("ai_active")}
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1.5 text-xs font-bold text-white hover:bg-[var(--color-surface-hover)] transition cursor-pointer"
                >
                  Aktifkan AI
                </button>
              </>
            )}

            {activeConversation.status === "resolved" && (
              <button
                type="button"
                onClick={() => handleStatusAction("assigned_to_admin")}
                disabled={isSubmitting}
                className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1.5 text-xs font-bold text-white hover:bg-[var(--color-surface-hover)] transition cursor-pointer"
              >
                Buka Kembali Chat
              </button>
            )}

            {/* Separator and Secondary actions */}
            <div className="h-4 w-[1px] bg-[var(--color-border)] mx-1" />

            <button
              type="button"
              onClick={handleCreateTicket}
              disabled={isSubmitting || !!activeConversation.ticketId}
              title={activeConversation.ticketId ? `Terhubung ke tiket: ${activeConversation.ticketId}` : "Buat ticket handoff"}
              className="p-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-muted)] hover:text-white hover:bg-[var(--color-surface-hover)] transition cursor-pointer disabled:opacity-40"
            >
              <Ticket className="h-4 w-4" />
            </button>

            <button
              type="button"
              onClick={() => void handleDeleteConversation()}
              disabled={isSubmitting}
              title="Hapus chat"
              className="p-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-rose-400 hover:bg-rose-500/10 transition cursor-pointer"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="custom-scrollbar flex-1 space-y-4 overflow-y-auto p-6 bg-[var(--color-bg)]/40">
          {(activeConversation.status === "assigned_to_admin" ||
            activeConversation.status === "blocked") && (
            <div className="flex items-start gap-3 rounded-lg border border-rose-500/15 bg-rose-500/5 p-4 text-xs leading-normal">
              <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-rose-400" />
              <div className="flex-1">
                <p className="font-bold text-rose-400">Kasus sedang ditangani admin</p>
                <p className="mt-1 text-[var(--color-muted)] leading-relaxed">
                  Respons otomatis AI dihentikan pada percakapan ini. Operator dapat membalas secara manual di bawah, atau mengaktifkan AI kembali saat kondisi operasional sudah kondusif.
                </p>
              </div>
            </div>
          )}

          {activeConversation.messages.map((message) => {
            const isCustomer = message.sender === "customer";
            const isAi = message.sender === "ai";
            const statusMeta = getMessageStatusMeta(message);

            return (
              <div
                key={message.id}
                className={`flex max-w-[80%] gap-3 ${
                  isCustomer ? "mr-auto" : "ml-auto flex-row-reverse"
                }`}
              >
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--color-surface-hover)] border border-[var(--color-border)] text-xs font-bold text-slate-300">
                  {isCustomer ? (
                    activeConversation.name.charAt(0)
                  ) : isAi ? (
                    <Bot className="h-3.5 w-3.5 text-[var(--color-brand)]" />
                  ) : (
                    <User className="h-3.5 w-3.5 text-amber-400" />
                  )}
                </div>

                <div className="space-y-1">
                  <div
                    className={`rounded-2xl px-4 py-2.5 text-xs leading-relaxed ${
                      isCustomer
                        ? "rounded-tl-none bg-[var(--color-surface)] border border-[var(--color-border)] text-slate-100"
                        : isAi
                          ? "rounded-tr-none border border-[var(--color-brand)]/15 bg-[var(--color-brand)]/5 text-cyan-100"
                          : "rounded-tr-none border border-[var(--color-border)] bg-[var(--color-surface-hover)] text-slate-100"
                    }`}
                  >
                    {message.text}
                  </div>
                  <div
                    className={`flex items-center gap-1 text-[9px] font-medium text-[var(--color-muted)] ${
                      isCustomer ? "justify-start" : "justify-end"
                    }`}
                  >
                    {message.timestamp}
                    {!isCustomer && statusMeta ? statusMeta.icon : null}
                    {!isCustomer && statusMeta ? (
                      <span className={message.status === "read" ? "text-[var(--color-brand)]" : ""}>
                        {statusMeta.label}
                      </span>
                    ) : null}
                  </div>
                </div>
              </div>
            );
          })}

          {isReplyTyping ? (
            <div className="ml-auto flex max-w-[80%] flex-row-reverse gap-3">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--color-surface-hover)] border border-[var(--color-border)] text-xs font-bold text-slate-300">
                {AI_REPLY_STATUSES.includes(activeConversation.status) ? (
                  <Bot className="h-3.5 w-3.5 text-[var(--color-brand)]" />
                ) : (
                  <User className="h-3.5 w-3.5 text-amber-400" />
                )}
              </div>
              <div className="rounded-2xl rounded-tr-none border border-[var(--color-brand)]/10 bg-[var(--color-brand)]/5 px-4 py-2.5 text-xs text-cyan-100">
                <span className="inline-flex items-center gap-1.5">
                  <span className="flex gap-1">
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-cyan-300 [animation-delay:-0.2s]" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-cyan-300 [animation-delay:-0.1s]" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-cyan-300" />
                  </span>
                  {AI_REPLY_STATUSES.includes(activeConversation.status)
                    ? `${config.aiAgent.name} sedang mengetik...`
                    : "Operator sedang mengetik..."}
                </span>
              </div>
            </div>
          ) : null}
        </div>

        <form
          onSubmit={handleSend}
          className="flex shrink-0 items-center gap-3 border-t border-[var(--color-border)] bg-[var(--color-surface-strong)]/30 p-4"
        >
          <button
            type="button"
            className="rounded-lg p-2 text-[var(--color-muted)] transition hover:bg-white/5 hover:text-white cursor-pointer"
          >
            <Paperclip className="h-5 w-5" />
          </button>

          <Input
            placeholder={
              AI_REPLY_STATUSES.includes(activeConversation.status)
                ? `Mengetik sebagai ${config.aiAgent.name}...`
                : "Balas manual sebagai admin..."
            }
            value={replyText}
            onChange={(event) => setReplyText(event.target.value)}
            className="h-10 text-xs border-[var(--color-border)] bg-[var(--color-surface)]"
            disabled={isSubmitting || isReplyTyping}
          />

          <button
            type="button"
            className="rounded-lg p-2 text-[var(--color-muted)] transition hover:bg-white/5 hover:text-white cursor-pointer"
          >
            <Smile className="h-5 w-5" />
          </button>

          <button
            type="submit"
            disabled={isSubmitting || isReplyTyping}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--color-brand)] text-slate-950 hover:bg-[var(--color-brand-hover)] transition cursor-pointer"
          >
            <Send className="h-4.5 w-4.5 stroke-[2.5]" />
          </button>
        </form>
      </div>

      {/* RIGHT COLUMN: USER DETAILS */}
      <div className="custom-scrollbar hidden w-80 shrink-0 space-y-5 overflow-y-auto border-l border-[var(--color-border)] bg-[var(--color-surface-strong)]/10 p-6 lg:block">
        <div className="text-center">
          <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full border border-[var(--color-brand)]/20 bg-[var(--color-surface-hover)] text-lg font-bold text-[var(--color-brand)]">
            {activeConversation.name.charAt(0)}
          </div>
          <h4 className="text-sm font-bold text-white">{activeConversation.name}</h4>
          <p className="mt-0.5 text-[10px] font-semibold text-[var(--color-muted)]">
            {activeConversation.phone || activeConversation.username || "-"}
          </p>
        </div>

        <div className="h-[1px] bg-[var(--color-border)]" />

        <div className="space-y-4">
          <div>
            <span className="mb-1 block text-[9px] font-bold uppercase tracking-widest text-[var(--color-muted)]">
              Channel
            </span>
            <span className="flex items-center gap-1.5 text-xs font-bold text-[var(--color-brand)]">
              <Wifi className="h-3.5 w-3.5" />
              {activeConversation.channel}
            </span>
          </div>
          <div>
            <span className="mb-1 block text-[9px] font-bold uppercase tracking-widest text-[var(--color-muted)]">
              Intent terakhir
            </span>
            <span className="text-xs font-medium text-white">
              {activeConversation.lastIntent}
            </span>
          </div>
          <div>
            <span className="mb-1 block text-[9px] font-bold uppercase tracking-widest text-[var(--color-muted)]">
              Sentiment
            </span>
            <span className="text-xs font-medium capitalize text-white">
              {activeConversation.sentiment}
            </span>
          </div>
        </div>

        <div className="rounded-xl border border-[var(--color-brand)]/15 bg-[var(--color-brand)]/5 p-4">
          <div className="flex items-start gap-3">
            <Sparkles className="mt-0.5 h-4 w-4 text-[var(--color-brand)]" />
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--color-brand)]">
                AI Summary
              </p>
              <p className="mt-2 text-xs leading-relaxed text-slate-300">
                {activeConversation.summary}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-strong)]/30 p-4">
          <div className="flex items-start gap-3">
            <Bot className="mt-0.5 h-4 w-4 text-[var(--color-brand)]" />
            <div className="space-y-2 text-xs">
              <p className="font-semibold text-white">Suggested next move</p>
              <p className="leading-relaxed text-[var(--color-muted)]">
                {activeConversation.status === "assigned_to_admin"
                  ? "Admin sebaiknya membalas manual, lalu tandai selesai atau aktifkan AI lagi setelah aman."
                  : activeConversation.status === "waiting_customer"
                    ? "AI bisa follow-up detail tipe motor, stok, atau jam booking sebelum eskalasi."
                    : "Percakapan masih aman dikelola oleh AI selama grounding tersedia."}
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <span className="block text-[9px] font-bold uppercase tracking-widest text-[var(--color-muted)]">
            Label / Tags
          </span>
          <div className="flex flex-wrap gap-1.5">
            {activeConversation.tags.map((tag, index) => (
              <Badge
                key={`${tag}-${index}`}
                className="border-[var(--color-border)] bg-[var(--color-surface-strong)]/40 px-2 py-0.5 text-[9px] text-slate-300"
              >
                {tag}
              </Badge>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-strong)]/30 p-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-[9px] font-bold uppercase tracking-widest text-[var(--color-muted)]">
              Ticket aktif
            </span>
            <Ticket className="h-4 w-4 text-[var(--color-muted)]" />
          </div>
          <p className="text-xs leading-relaxed text-slate-300">
            {activeConversation.ticketId
              ? `Terhubung ke ${activeConversation.ticketId}`
              : "Belum ada ticket. Gunakan tombol Buat ticket jika perlu handoff."}
          </p>
        </div>

        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-strong)]/30 p-4">
          <div className="mb-3 flex items-center gap-2">
            <PauseCircle className="h-4 w-4 text-[var(--color-muted)]" />
            <span className="text-[9px] font-bold uppercase tracking-widest text-[var(--color-muted)]">
              Catatan Private
            </span>
          </div>
          <Textarea
            className="resize-none border-[var(--color-border)] bg-[var(--color-surface)] p-3 text-[11px] font-medium leading-relaxed text-slate-300 focus:border-[var(--color-brand)]/80 focus:outline-none"
            rows={5}
            value={noteDraft}
            onChange={(event) => setNoteDraft(event.target.value)}
            placeholder="Tambahkan catatan khusus untuk pelanggan ini..."
          />
          <div className="mt-3 flex flex-col gap-2">
            {noteSaved ? (
              <span className="text-[10px] font-semibold text-emerald-400">
                Catatan tersimpan.
              </span>
            ) : (
              <span className="text-[10px] text-[var(--color-muted)] leading-relaxed">
                Catatan private disimpan di database workspace.
              </span>
            )}
            <Button
              type="button"
              variant="secondary"
              className="h-8 px-3 text-[10px] w-full mt-1"
              onClick={() => void handleSaveNotes()}
              disabled={isSubmitting}
            >
              Simpan catatan
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
