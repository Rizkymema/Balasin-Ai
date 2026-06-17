"use client";

import Link from "next/link";
import { useMemo } from "react";
import {
  ArrowLeft,
  Bot,
  CheckCheck,
  Clock3,
  MessageSquareDiff,
  MoreVertical,
  Paperclip,
  Search,
  Send,
  ShieldAlert,
  Sparkles,
  StickyNote,
  Ticket,
  Trash2,
  User,
  Users,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { DashboardConfig } from "@/types/dashboard-config";
import type { ConversationRecord } from "@/types/operations";

import {
  buildAiSuggestion,
  formatSlaLabel,
  getConversationStatusMeta,
  getMessageActorLabel,
  getMessageStatusMeta,
} from "./inbox-view-model";

type ConversationThreadPanelProps = {
  conversation: ConversationRecord | null;
  config: DashboardConfig;
  replyText: string;
  onReplyTextChange: (value: string) => void;
  noteDraft: string;
  onNoteDraftChange: (value: string) => void;
  composerMode: "reply" | "note";
  onComposerModeChange: (value: "reply" | "note") => void;
  suggestionVariant: "default" | "short" | "warm";
  suggestionVersion: number;
  onSuggestionVariantChange: (value: "default" | "short" | "warm") => void;
  onSuggestionVersionChange: (updater: (current: number) => number) => void;
  onUseSuggestion: (value: string) => void;
  onSendReply: () => void;
  onSaveNote: () => void;
  onCreateTicket: () => void;
  onTakeOver: () => void;
  onPauseAi: () => void;
  onActivateAi: () => void;
  onResolve: () => void;
  onDeleteConversation: () => void;
  isSubmitting: boolean;
  isReplyTyping: boolean;
  noteSaved: boolean;
  showContextPanel: boolean;
  onToggleContextPanel: () => void;
  onBackToList: () => void;
};

function resolveStatusButtonLabel(conversation: ConversationRecord) {
  if (
    conversation.status === "ai_paused" ||
    conversation.status === "assigned_to_admin" ||
    conversation.status === "resolved"
  ) {
    return "Aktifkan AI";
  }

  return "Pause AI";
}

function resolveStatusTone(status: ConversationRecord["status"]) {
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

export function ConversationThreadPanel({
  conversation,
  config,
  replyText,
  onReplyTextChange,
  noteDraft,
  onNoteDraftChange,
  composerMode,
  onComposerModeChange,
  suggestionVariant,
  suggestionVersion,
  onSuggestionVariantChange,
  onSuggestionVersionChange,
  onUseSuggestion,
  onSendReply,
  onSaveNote,
  onCreateTicket,
  onTakeOver,
  onPauseAi,
  onActivateAi,
  onResolve,
  onDeleteConversation,
  isSubmitting,
  isReplyTyping,
  noteSaved,
  showContextPanel,
  onToggleContextPanel,
  onBackToList,
}: ConversationThreadPanelProps) {
  const suggestionText = useMemo(() => {
    if (!conversation) {
      return "";
    }

    return buildAiSuggestion({
      conversation,
      config,
      variant: suggestionVariant,
      version: suggestionVersion,
    });
  }, [config, conversation, suggestionVariant, suggestionVersion]);

  if (!conversation) {
    return (
      <section className="rounded-xl border border-white/[0.06] bg-[#0a0e1c] lg:h-full">
        <EmptyState
          title="Belum memilih conversation"
          description="Pilih percakapan dari panel kiri untuk melihat histori pesan, AI summary, dan aksi operasional."
          className="min-h-[42rem] border-none bg-transparent lg:h-full lg:min-h-0"
          icon={<MessageSquareDiff className="h-10 w-10" />}
        />
      </section>
    );
  }

  const statusMeta = getConversationStatusMeta(conversation);
  const StatusIcon = statusMeta.icon;
  const canTakeOver = conversation.status === "ai_active";
  const canPauseAi = conversation.status === "ai_active";
  const canActivateAi =
    conversation.status === "ai_paused" ||
    conversation.status === "assigned_to_admin" ||
    conversation.status === "resolved";
  const canResolve =
    conversation.status !== "resolved" && conversation.status !== "spam";
  const showExpiredBanner =
    conversation.channel === "WhatsApp" &&
    (conversation.status === "waiting_customer" ||
      conversation.status === "resolved" ||
      conversation.status === "ai_paused");

  return (
    <section className="flex min-h-[42rem] flex-col overflow-hidden rounded-xl border border-white/[0.06] bg-[#0a0e1c] lg:h-full lg:min-h-0">
      {/* Header */}
      <div className="border-b border-white/[0.06]">
        <div className="flex flex-col gap-4 px-4 py-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="min-w-0 flex-1">
            <div className="mb-2 flex items-center gap-2 lg:hidden">
              <button
                type="button"
                onClick={onBackToList}
                className="inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.04] px-3 py-1.5 text-[11px] font-semibold text-slate-400"
              >
                <ArrowLeft className="h-4 w-4" />
                Daftar
              </button>
              <button
                type="button"
                onClick={onToggleContextPanel}
                className="inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.04] px-3 py-1.5 text-[11px] font-semibold text-slate-400"
              >
                <Users className="h-4 w-4" />
                {showContextPanel ? "Sembunyikan Detail" : "Lihat Detail"}
              </button>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.06] text-sm font-semibold text-slate-400">
                {conversation.name.slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="truncate text-[1.1rem] font-semibold text-slate-100">
                    {conversation.name}
                  </h2>
                  <span
                    className={cn(
                      "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold",
                      resolveStatusTone(conversation.status),
                    )}
                  >
                    <StatusIcon className="mr-1 h-3.5 w-3.5" />
                    {statusMeta.shortLabel}
                  </span>
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-[12px] text-slate-500">
                  <span>{conversation.channel}</span>
                  <span className="h-1 w-1 rounded-full bg-slate-600" />
                  <span>{conversation.phone || conversation.username || "Customer aktif"}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full text-slate-400 transition hover:bg-white/[0.06] hover:text-slate-200"
              title="Cari"
            >
              <Search className="h-4 w-4" />
            </button>
            <Button
              type="button"
              variant="secondary"
              className="h-9 rounded-lg border-white/[0.08] bg-white/[0.04] px-3 text-[11px] text-slate-300 hover:bg-white/[0.08]"
              onClick={canActivateAi ? onActivateAi : onPauseAi}
              disabled={(!canActivateAi && !canPauseAi) || isSubmitting}
            >
              {resolveStatusButtonLabel(conversation)}
            </Button>
            <Button
              type="button"
              className="h-9 rounded-lg border-transparent bg-[#00d2ff] px-3 text-[11px] font-semibold text-[#050814] hover:bg-[#4de0ff]"
              onClick={onResolve}
              disabled={!canResolve || isSubmitting}
            >
              Resolve
            </Button>
            <button
              type="button"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full text-slate-400 transition hover:bg-white/[0.06] hover:text-slate-200"
              title="Menu"
            >
              <MoreVertical className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={onDeleteConversation}
              disabled={isSubmitting}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-red-500/15 text-red-400 transition hover:bg-red-500/25 disabled:opacity-50"
              title="Hapus percakapan"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-3 border-t border-white/[0.06] px-4 py-3 text-[12px] text-slate-500 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <span>Assigned to:</span>
            <span className="font-semibold text-slate-300">
              {conversation.assignedTo}
            </span>
            <button
              type="button"
              onClick={onTakeOver}
              disabled={!canTakeOver || isSubmitting}
              className="rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-1.5 text-[11px] font-semibold text-slate-300 transition hover:bg-white/[0.08] disabled:opacity-50"
            >
              Take Over
            </button>
            <button
              type="button"
              onClick={onCreateTicket}
              className="rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-1.5 text-[11px] font-semibold text-slate-300 transition hover:bg-white/[0.08]"
            >
              + Ticket
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-2">
              <span className="h-4 w-4 rounded border border-slate-600 bg-white/[0.04]" />
              Do Not Auto Resolve
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-white/[0.06] px-3 py-1 text-[11px] text-slate-500">
              <Clock3 className="h-3.5 w-3.5" />
              {formatSlaLabel(conversation)}
            </span>
          </div>
        </div>

        {showExpiredBanner ? (
          <div className="bg-red-500/90 px-4 py-3">
            <p className="text-sm font-semibold text-white">
              This conversation has been expired
            </p>
          </div>
        ) : null}

        {(conversation.status === "assigned_to_admin" ||
          conversation.status === "blocked") && (
          <div className="border-t border-red-500/20 bg-red-500/10 px-4 py-3">
            <div className="flex items-start gap-3">
              <ShieldAlert className="mt-0.5 h-4 w-4 text-red-400" />
              <p className="text-[12px] leading-5 text-red-300">
                Human takeover aktif. AI tidak akan membalas otomatis sampai
                diaktifkan kembali oleh admin.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Chat Messages Area */}
      <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto bg-[#080c18] px-4 py-4 sm:px-6">
        <div className="mb-4 flex items-center justify-center">
          <span className="rounded-full bg-white/[0.06] px-4 py-1 text-[11px] font-medium text-slate-500">
            Conversation timeline
          </span>
        </div>

        <div className="space-y-3">
          {conversation.messages.map((message) => {
            if (message.sender === "system") {
              return (
                <div key={message.id} className="py-1 text-center">
                  <p className="text-[12px] leading-5 text-slate-500">
                    {message.timestamp} - {message.text}
                  </p>
                </div>
              );
            }

            const isCustomer = message.sender === "customer";
            const isAi = message.sender === "ai";
            const actorLabel = getMessageActorLabel(message);
            const statusInfo = getMessageStatusMeta(message.status);

            return (
              <div
                key={message.id}
                className={cn("flex", isCustomer ? "justify-start" : "justify-end")}
              >
                <div className="max-w-[85%] sm:max-w-[70%]">
                  <div
                    className={cn(
                      "rounded-2xl border px-4 py-3 shadow-sm",
                      isCustomer
                        ? "rounded-tl-sm border-white/[0.06] bg-white/[0.06] text-slate-300"
                        : "rounded-tr-sm border-[#00d2ff]/20 bg-[#00d2ff]/10 text-slate-200",
                    )}
                  >
                    <div className="mb-1 flex items-center gap-2 text-[11px] text-slate-500">
                      {isCustomer ? (
                        <span>{conversation.name}</span>
                      ) : (
                        <span className="inline-flex items-center gap-1">
                          {isAi ? (
                            <Bot className="h-3.5 w-3.5 text-[#00d2ff]" />
                          ) : (
                            <User className="h-3.5 w-3.5 text-slate-400" />
                          )}
                          {actorLabel}
                        </span>
                      )}
                    </div>
                    <p className="text-[13px] leading-6">{message.text}</p>
                    <div
                      className={cn(
                        "mt-2 flex items-center gap-1 text-[11px] text-slate-500",
                        isCustomer ? "justify-start" : "justify-end",
                      )}
                    >
                      <span>{message.timestamp}</span>
                      {statusInfo ? (
                        <span className="inline-flex items-center gap-1">
                          <statusInfo.icon className="h-3.5 w-3.5" />
                          {statusInfo.label}
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {conversation.notes.trim() ? (
            <div className="rounded-xl border border-purple-500/20 bg-purple-500/10 px-4 py-3">
              <div className="flex items-start gap-2.5">
                <StickyNote className="mt-0.5 h-4 w-4 text-purple-400" />
                <div>
                  <p className="text-[12px] font-semibold text-purple-300">
                    Private note
                  </p>
                  <p className="mt-1 text-[13px] leading-6 text-slate-400">
                    {conversation.notes}
                  </p>
                </div>
              </div>
            </div>
          ) : null}

          {isReplyTyping ? (
            <div className="flex justify-end">
              <div className="rounded-2xl border border-[#00d2ff]/20 bg-[#00d2ff]/10 px-4 py-3 text-[13px] text-slate-200">
                <span className="inline-flex items-center gap-2">
                  <span className="flex gap-1">
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#00d2ff] [animation-delay:-0.2s]" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#00d2ff] [animation-delay:-0.1s]" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#00d2ff]" />
                  </span>
                  {conversation.status === "ai_active" ||
                  conversation.status === "waiting_customer"
                    ? `${config.aiAgent.name} sedang menyiapkan balasan`
                    : "Admin sedang mengirim balasan"}
                </span>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {/* Composer Area */}
      <div className="shrink-0 border-t border-white/[0.06] bg-[#0a0e1c] p-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="inline-flex rounded-xl bg-white/[0.04] p-1">
            {[
              { id: "reply", label: "Reply" },
              { id: "note", label: "Notes" },
            ].map((tab) => {
              const active = composerMode === tab.id;

              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => onComposerModeChange(tab.id as "reply" | "note")}
                  className={cn(
                    "rounded-lg px-3 py-2 text-[11px] font-semibold transition",
                    active
                      ? "bg-white/[0.08] text-[#00d2ff] shadow-sm"
                      : "text-slate-500 hover:text-slate-300",
                  )}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
            <Link
              href="/tickets"
              className="inline-flex items-center gap-1 rounded-full bg-white/[0.06] px-3 py-1.5 text-slate-400 transition hover:bg-white/[0.1]"
            >
              <Ticket className="h-3.5 w-3.5" />
              Tickets
            </Link>
            <Link
              href="/customers"
              className="inline-flex items-center gap-1 rounded-full bg-white/[0.06] px-3 py-1.5 text-slate-400 transition hover:bg-white/[0.1]"
            >
              <Users className="h-3.5 w-3.5" />
              CRM
            </Link>
          </div>
        </div>

        {composerMode === "reply" ? (
          <div className="space-y-3">
            {/* AI Suggestion */}
            <div className="rounded-xl border border-[#00d2ff]/20 bg-[#00d2ff]/[0.06] px-4 py-3">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#00d2ff]">
                    AI Suggested Reply
                  </p>
                  <p className="mt-1 text-[13px] leading-6 text-slate-300">
                    {suggestionText}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => onUseSuggestion(suggestionText)}
                    className="rounded-lg border border-[#00d2ff]/30 bg-[#00d2ff]/10 px-3 py-2 text-[11px] font-semibold text-[#00d2ff] transition hover:bg-[#00d2ff]/20"
                  >
                    Gunakan
                  </button>
                  <button
                    type="button"
                    onClick={() => onSuggestionVariantChange("short")}
                    className="rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-[11px] font-semibold text-slate-400 transition hover:bg-white/[0.08]"
                  >
                    Singkat
                  </button>
                  <button
                    type="button"
                    onClick={() => onSuggestionVariantChange("warm")}
                    className="rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-[11px] font-semibold text-slate-400 transition hover:bg-white/[0.08]"
                  >
                    Ramah
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onSuggestionVariantChange("default");
                      onSuggestionVersionChange((current) => current + 1);
                    }}
                    className="rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-[11px] font-semibold text-slate-400 transition hover:bg-white/[0.08]"
                  >
                    Ulangi
                  </button>
                </div>
              </div>
            </div>

            {/* Reply Input */}
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-3">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.04] text-slate-400"
                  title="Lampiran"
                >
                  <Paperclip className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => onUseSuggestion(suggestionText)}
                  className="inline-flex items-center gap-2 rounded-full border border-[#00d2ff]/30 bg-[#00d2ff]/10 px-3 py-2 text-[11px] font-semibold text-[#00d2ff]"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  Pakai Saran AI
                </button>
              </div>

              <div className="flex items-end gap-3">
                <Textarea
                  value={replyText}
                  onChange={(event) => onReplyTextChange(event.target.value)}
                  rows={1}
                  placeholder={`Ketik balasan untuk ${conversation.name}...`}
                  className="min-h-[56px] flex-1 resize-none rounded-xl border-white/[0.08] bg-white/[0.04] px-4 py-3 text-[13px] leading-6 text-slate-200 placeholder:text-slate-500"
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
                      event.preventDefault();
                      onSendReply();
                    }
                  }}
                  disabled={isSubmitting || isReplyTyping}
                />
                <button
                  type="button"
                  onClick={onSendReply}
                  disabled={!replyText.trim() || isSubmitting || isReplyTyping}
                  className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-[#00d2ff] text-[#050814] transition hover:bg-[#4de0ff] disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-500"
                  title="Kirim"
                >
                  <Send className="h-[18px] w-[18px]" />
                </button>
              </div>

              <p className="mt-2 text-[11px] leading-5 text-slate-500">
                Gunakan Ctrl+Enter untuk mengirim lebih cepat.
              </p>
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-purple-500/20 bg-purple-500/[0.06] p-4">
            <div className="mb-3 flex items-start gap-3">
              <StickyNote className="mt-0.5 h-5 w-5 text-purple-400" />
              <div>
                <p className="text-sm font-semibold text-purple-300">
                  Catatan internal
                </p>
                <p className="mt-1 text-xs leading-6 text-slate-500">
                  Catatan ini hanya terlihat oleh tim internal dan tidak akan
                  terkirim ke customer.
                </p>
              </div>
            </div>

            <Textarea
              value={noteDraft}
              onChange={(event) => onNoteDraftChange(event.target.value)}
              rows={4}
              placeholder="Tulis konteks internal, follow-up, atau approval..."
              className="min-h-[7rem] resize-none rounded-xl border-purple-500/20 bg-white/[0.04] px-4 py-3 text-[13px] leading-6 text-slate-200"
              disabled={isSubmitting}
            />

            <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-[11px] leading-5 text-purple-400">
                {noteSaved
                  ? "Catatan berhasil disimpan."
                  : "Simpan ringkasan internal atau instruksi follow-up tim."}
              </p>
              <Button
                type="button"
                className="h-10 rounded-lg border-transparent bg-purple-500 px-4 text-[11px] text-white hover:bg-purple-600"
                onClick={onSaveNote}
                disabled={isSubmitting}
              >
                <StickyNote className="mr-2 h-4 w-4" />
                Simpan Catatan
              </Button>
            </div>
          </div>
        )}

        {showExpiredBanner ? (
          <div className="mt-3 flex flex-col gap-3 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-[12px] text-red-300 sm:flex-row sm:items-center sm:justify-between">
            <p>
              Percakapan WhatsApp sudah melewati window 24 jam. Jika perlu lanjut,
              kirim template terlebih dulu.
            </p>
            <span className="inline-flex items-center gap-1 rounded-lg bg-white/[0.04] px-3 py-2 font-semibold text-red-400">
              <CheckCheck className="h-3.5 w-3.5" />
              HSM required
            </span>
          </div>
        ) : null}
      </div>
    </section>
  );
}
