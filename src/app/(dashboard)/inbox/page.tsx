"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  Bot,
  CheckCheck,
  MessageSquare,
  Paperclip,
  PauseCircle,
  Search,
  Send,
  ShieldAlert,
  Smile,
  Sparkles,
  Ticket,
  User,
  Wifi,
} from "lucide-react";

import { useDashboardConfig } from "@/hooks/use-dashboard-config";
import { useDashboardOperations } from "@/hooks/use-dashboard-operations";
import type {
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

  useEffect(() => {
    if (!selectedId && data.conversations[0]?.id) {
      setSelectedId(data.conversations[0].id);
    }
  }, [data.conversations, selectedId]);

  useEffect(() => {
    setNoteDraft(activeConversation?.notes ?? "");
  }, [activeConversation?.id, activeConversation?.notes]);

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

  const handleSend = (event: FormEvent) => {
    event.preventDefault();
    if (!replyText.trim() || !activeConversation) {
      return;
    }

    const nextReply = replyText.trim();
    setReplyText("");

    void runConversationAction(
      `/api/inbox/conversations/${activeConversation.id}/reply`,
      {
        method: "POST",
        body: JSON.stringify({ message: nextReply }),
      },
    ).catch(() => {
      setReplyText(nextReply);
    });
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
    <div className="glow-cyan flex h-[calc(100vh-10rem)] overflow-hidden rounded-xl border border-white/8 bg-[#04091a]/80 animate-fade-in backdrop-blur-md">
      <div className="flex h-full w-80 shrink-0 flex-col border-r border-white/8">
        <div className="space-y-3 shrink-0 border-b border-white/8 p-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
            <Input
              placeholder="Cari chat, intent, atau tag..."
              className="h-10 pl-9 text-xs"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
            />
          </div>
          <div className="custom-scrollbar flex gap-1 overflow-x-auto pb-1">
            {filterButtons.map((type) => (
              <button
                key={type.key}
                onClick={() => setFilterType(type.key)}
                className={`rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-wider transition ${
                  filterType === type.key
                    ? "border-cyan-400 bg-cyan-950 text-cyan-400"
                    : "border-white/8 bg-white/4 text-slate-400 hover:text-white"
                }`}
              >
                {type.label}
              </button>
            ))}
          </div>
        </div>

        <div className="custom-scrollbar flex-1 overflow-y-auto">
          {filteredConversations.length === 0 ? (
            <div className="p-6 text-center text-xs font-medium text-slate-500">
              Tidak ada percakapan ditemukan.
            </div>
          ) : (
            filteredConversations.map((conversation) => {
              const isActive = conversation.id === activeConversation.id;

              return (
                <div
                  key={conversation.id}
                  onClick={() => setSelectedId(conversation.id)}
                  className={`flex cursor-pointer items-start justify-between border-b border-white/4 p-4 transition duration-150 ${
                    isActive ? "bg-white/6" : "hover:bg-white/3"
                  }`}
                >
                  <div className="flex min-w-0 flex-1 gap-3">
                    <div className="relative shrink-0">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full border border-cyan-500/20 bg-cyan-950/60 text-sm font-bold text-cyan-400">
                        {conversation.name.charAt(0)}
                      </div>
                      <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-[#04091a] bg-emerald-400" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="mb-0.5 flex items-baseline justify-between">
                        <h4 className="truncate text-xs font-bold text-white">
                          {conversation.name}
                        </h4>
                        <span className="shrink-0 text-[9px] font-medium text-slate-500">
                          {conversation.timestamp}
                        </span>
                      </div>
                      <p className="truncate text-[11px] leading-relaxed text-slate-400">
                        {conversation.lastMessage}
                      </p>
                      <div className="mt-2 flex items-center gap-2 text-[10px] text-slate-500">
                        <span>{conversation.channel}</span>
                        <span>|</span>
                        <span>{conversation.lastIntent}</span>
                      </div>
                    </div>
                  </div>

                  <div className="ml-2.5 flex shrink-0 flex-col items-end gap-1.5">
                    <Badge className={`px-2 py-0.5 text-[9px] tracking-widest ${statusClasses[conversation.status]}`}>
                      {statusLabels[conversation.status]}
                    </Badge>
                    {conversation.unreadCount > 0 ? (
                      <span className="flex h-4 w-4 items-center justify-center rounded-full bg-cyan-400 text-[9px] font-bold text-slate-950">
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

      <div className="flex h-full flex-1 flex-col bg-[#020611]/30">
        <div className="flex shrink-0 flex-col gap-4 border-b border-white/8 px-6 py-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-white">{activeConversation.name}</h3>
              <p className="mt-0.5 flex items-center gap-1.5 text-[10px] text-slate-400">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400" />
                via {activeConversation.channel}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Badge className={statusClasses[activeConversation.status]}>
                {statusLabels[activeConversation.status]}
              </Badge>
              <Badge className="border-white/10 bg-white/5 text-slate-300">
                {activeConversation.aiConfidence}% confidence
              </Badge>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => handleStatusAction("assigned_to_admin")}
              disabled={isSubmitting}
              className="rounded-full border border-rose-400/20 bg-rose-950/20 px-3 py-1.5 text-xs font-semibold text-rose-300"
            >
              Ambil alih chat
            </button>
            <button
              type="button"
              onClick={() => handleStatusAction("ai_paused")}
              disabled={isSubmitting}
              className="rounded-full border border-amber-400/20 bg-amber-950/20 px-3 py-1.5 text-xs font-semibold text-amber-300"
            >
              Pause AI
            </button>
            <button
              type="button"
              onClick={() => handleStatusAction("ai_active")}
              disabled={isSubmitting}
              className="rounded-full border border-cyan-400/20 bg-cyan-950/20 px-3 py-1.5 text-xs font-semibold text-cyan-300"
            >
              Aktifkan AI
            </button>
            <button
              type="button"
              onClick={handleCreateTicket}
              disabled={isSubmitting}
              className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-slate-200"
            >
              Buat ticket
            </button>
            <button
              type="button"
              onClick={() => handleStatusAction("resolved")}
              disabled={isSubmitting}
              className="rounded-full border border-emerald-400/20 bg-emerald-950/20 px-3 py-1.5 text-xs font-semibold text-emerald-300"
            >
              Tandai selesai
            </button>
          </div>
        </div>

        <div className="custom-scrollbar flex-1 space-y-4 overflow-y-auto p-6">
          {(activeConversation.status === "assigned_to_admin" ||
            activeConversation.status === "blocked") && (
            <div className="flex items-start gap-3 rounded-lg border border-rose-500/20 bg-rose-950/15 p-4 text-xs leading-normal">
              <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-rose-400" />
              <div className="flex-1">
                <p className="font-bold text-rose-400">Kasus sedang ditangani admin</p>
                <p className="mt-1 text-slate-400">
                  AI berhenti membalas pada percakapan ini. Admin bisa membalas manual
                  atau mengaktifkan AI kembali jika kondisi sudah aman.
                </p>
              </div>
            </div>
          )}

          {activeConversation.messages.map((message) => {
            const isCustomer = message.sender === "customer";
            const isAi = message.sender === "ai";

            return (
              <div
                key={message.id}
                className={`flex max-w-[80%] gap-3 ${
                  isCustomer ? "mr-auto" : "ml-auto flex-row-reverse"
                }`}
              >
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/6 text-xs font-bold text-slate-300">
                  {isCustomer ? (
                    activeConversation.name.charAt(0)
                  ) : isAi ? (
                    <Bot className="h-3.5 w-3.5 text-cyan-400" />
                  ) : (
                    <User className="h-3.5 w-3.5 text-amber-400" />
                  )}
                </div>

                <div className="space-y-1">
                  <div
                    className={`rounded-2xl px-4 py-2.5 text-xs leading-relaxed ${
                      isCustomer
                        ? "rounded-tl-none bg-white/6 text-slate-100"
                        : isAi
                          ? "rounded-tr-none border border-cyan-500/10 bg-cyan-950/40 text-cyan-100 shadow-[0_0_10px_rgba(34,211,238,0.05)]"
                          : "rounded-tr-none border border-white/6 bg-slate-900 text-slate-100"
                    }`}
                  >
                    {message.text}
                  </div>
                  <div
                    className={`flex items-center gap-1 text-[9px] font-medium text-slate-500 ${
                      isCustomer ? "justify-start" : "justify-end"
                    }`}
                  >
                    {message.timestamp}
                    {!isCustomer ? <CheckCheck className="h-3 w-3 text-cyan-400" /> : null}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <form
          onSubmit={handleSend}
          className="flex shrink-0 items-center gap-3 border-t border-white/8 bg-[#020611]/60 p-4"
        >
          <button
            type="button"
            className="rounded-lg p-2 text-slate-400 transition hover:bg-white/5 hover:text-white"
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
            className="h-10 text-xs"
            disabled={isSubmitting}
          />

          <button
            type="button"
            className="rounded-lg p-2 text-slate-400 transition hover:bg-white/5 hover:text-white"
          >
            <Smile className="h-5 w-5" />
          </button>

          <button
            type="submit"
            disabled={isSubmitting}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-cyan-400 text-slate-950 shadow-[0_0_12px_rgba(84,219,255,0.3)] transition hover:bg-cyan-300"
          >
            <Send className="h-4.5 w-4.5 stroke-[2.5]" />
          </button>
        </form>
      </div>

      <div className="custom-scrollbar hidden w-80 shrink-0 space-y-6 overflow-y-auto border-l border-white/8 p-6 lg:block">
        <div className="text-center">
          <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full border border-cyan-400/20 bg-cyan-950 text-lg font-bold text-cyan-400">
            {activeConversation.name.charAt(0)}
          </div>
          <h4 className="text-sm font-bold text-white">{activeConversation.name}</h4>
          <p className="mt-0.5 text-[10px] font-semibold text-slate-400">
            {activeConversation.phone || activeConversation.username || "-"}
          </p>
        </div>

        <div className="h-px bg-white/8" />

        <div className="space-y-4">
          <div>
            <span className="mb-1 block text-[9px] font-bold uppercase tracking-widest text-slate-500">
              Channel
            </span>
            <span className="flex items-center gap-1.5 text-xs font-bold text-cyan-400">
              <Wifi className="h-3.5 w-3.5" />
              {activeConversation.channel}
            </span>
          </div>
          <div>
            <span className="mb-1 block text-[9px] font-bold uppercase tracking-widest text-slate-500">
              Intent terakhir
            </span>
            <span className="text-xs font-medium text-white">
              {activeConversation.lastIntent}
            </span>
          </div>
          <div>
            <span className="mb-1 block text-[9px] font-bold uppercase tracking-widest text-slate-500">
              Sentiment
            </span>
            <span className="text-xs font-medium capitalize text-white">
              {activeConversation.sentiment}
            </span>
          </div>
        </div>

        <div className="rounded-2xl border border-cyan-400/12 bg-cyan-400/5 p-4">
          <div className="flex items-start gap-3">
            <Sparkles className="mt-0.5 h-4 w-4 text-cyan-300" />
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-cyan-300">
                AI Summary
              </p>
              <p className="mt-2 text-xs leading-6 text-slate-300">
                {activeConversation.summary}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
          <div className="flex items-start gap-3">
            <Bot className="mt-0.5 h-4 w-4 text-cyan-300" />
            <div className="space-y-2 text-xs">
              <p className="font-semibold text-white">Suggested next move</p>
              <p className="leading-6 text-slate-400">
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
          <span className="block text-[9px] font-bold uppercase tracking-widest text-slate-500">
            Label / Tags
          </span>
          <div className="flex flex-wrap gap-1.5">
            {activeConversation.tags.map((tag, index) => (
              <Badge
                key={`${tag}-${index}`}
                className="border-white/8 bg-white/5 px-2 py-0.5 text-[9px] text-slate-300"
              >
                {tag}
              </Badge>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500">
              Ticket aktif
            </span>
            <Ticket className="h-4 w-4 text-slate-500" />
          </div>
          <p className="text-xs text-slate-300">
            {activeConversation.ticketId
              ? `Terhubung ke ${activeConversation.ticketId}`
              : "Belum ada ticket. Gunakan tombol Buat ticket jika perlu handoff."}
          </p>
        </div>

        <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
          <div className="mb-3 flex items-center gap-2">
            <PauseCircle className="h-4 w-4 text-slate-500" />
            <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500">
              Catatan Private
            </span>
          </div>
          <Textarea
            className="resize-none border-white/8 bg-white/3 p-3 text-[11px] font-medium leading-relaxed text-slate-300"
            rows={5}
            value={noteDraft}
            onChange={(event) => setNoteDraft(event.target.value)}
            placeholder="Tambahkan catatan khusus untuk pelanggan ini..."
          />
          <div className="mt-3 flex items-center justify-between gap-3">
            {noteSaved ? (
              <span className="text-[10px] font-semibold text-emerald-300">
                Catatan tersimpan.
              </span>
            ) : (
              <span className="text-[10px] text-slate-500">
                Catatan private tersimpan ke backend dashboard.
              </span>
            )}
            <Button
              type="button"
              variant="secondary"
              className="h-8 px-3 text-[10px]"
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
