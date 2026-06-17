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
      <section className="rounded-[18px] border border-[#d9dfeb] bg-white">
        <EmptyState
          title="Belum memilih conversation"
          description="Pilih percakapan dari panel kiri untuk melihat histori pesan, AI summary, dan aksi operasional."
          className="min-h-[42rem] border-none bg-transparent"
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
    <section className="flex min-h-[42rem] flex-col overflow-hidden rounded-[18px] border border-[#d9dfeb] bg-white shadow-[0_8px_24px_rgba(92,110,145,0.08)]">
      <div className="border-b border-[#e6ebf2] bg-white">
        <div className="flex flex-col gap-4 px-4 py-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="min-w-0 flex-1">
            <div className="mb-2 flex items-center gap-2 lg:hidden">
              <button
                type="button"
                onClick={onBackToList}
                className="inline-flex items-center gap-2 rounded-full border border-[#dfe5ef] bg-white px-3 py-1.5 text-[11px] font-semibold text-[#667085]"
              >
                <ArrowLeft className="h-4 w-4" />
                Daftar
              </button>
              <button
                type="button"
                onClick={onToggleContextPanel}
                className="inline-flex items-center gap-2 rounded-full border border-[#dfe5ef] bg-white px-3 py-1.5 text-[11px] font-semibold text-[#667085]"
              >
                <Users className="h-4 w-4" />
                {showContextPanel ? "Sembunyikan Detail" : "Lihat Detail"}
              </button>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full border border-[#dde4ee] bg-[#f5f7fb] text-sm font-semibold text-[#667085]">
                {conversation.name.slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="truncate text-[1.1rem] font-semibold text-[#344054]">
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
                <div className="mt-1 flex flex-wrap items-center gap-2 text-[12px] text-[#98a2b3]">
                  <span>{conversation.channel}</span>
                  <span className="h-1 w-1 rounded-full bg-[#c7d0dd]" />
                  <span>{conversation.phone || conversation.username || "Customer aktif"}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full text-[#98a2b3] transition hover:bg-[#f5f7fb] hover:text-[#344054]"
              title="Cari"
            >
              <Search className="h-4 w-4" />
            </button>
            <Button
              type="button"
              variant="secondary"
              className="h-9 rounded-[10px] border-[#dfe5ef] bg-white px-3 text-[11px] text-[#475467] hover:bg-[#f8fafc]"
              onClick={canActivateAi ? onActivateAi : onPauseAi}
              disabled={(!canActivateAi && !canPauseAi) || isSubmitting}
            >
              {resolveStatusButtonLabel(conversation)}
            </Button>
            <Button
              type="button"
              className="h-9 rounded-[10px] border-transparent bg-[#1570ef] px-3 text-[11px] text-white hover:bg-[#1267da]"
              onClick={onResolve}
              disabled={!canResolve || isSubmitting}
            >
              Resolve
            </Button>
            <button
              type="button"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full text-[#98a2b3] transition hover:bg-[#f5f7fb] hover:text-[#344054]"
              title="Menu"
            >
              <MoreVertical className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={onDeleteConversation}
              disabled={isSubmitting}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#fff1f2] text-[#d92d20] transition hover:bg-[#ffe4e8] disabled:opacity-50"
              title="Hapus percakapan"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-3 border-t border-[#eef2f6] px-4 py-3 text-[12px] text-[#667085] xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <span>Assigned to:</span>
            <span className="font-semibold text-[#344054]">
              {conversation.assignedTo}
            </span>
            <button
              type="button"
              onClick={onTakeOver}
              disabled={!canTakeOver || isSubmitting}
              className="rounded-[10px] border border-[#dfe5ef] bg-white px-3 py-1.5 text-[11px] font-semibold text-[#475467] transition hover:bg-[#f8fafc] disabled:opacity-50"
            >
              Take Over
            </button>
            <button
              type="button"
              onClick={onCreateTicket}
              className="rounded-[10px] border border-[#dfe5ef] bg-white px-3 py-1.5 text-[11px] font-semibold text-[#475467] transition hover:bg-[#f8fafc]"
            >
              + Ticket
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-2">
              <span className="h-4 w-4 rounded border border-[#d0d5dd] bg-white" />
              Do Not Auto Resolve
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-[#f5f7fb] px-3 py-1 text-[11px] text-[#667085]">
              <Clock3 className="h-3.5 w-3.5" />
              {formatSlaLabel(conversation)}
            </span>
          </div>
        </div>

        {showExpiredBanner ? (
          <div className="bg-[#f63d52] px-4 py-3">
            <p className="text-sm font-semibold text-white">
              This conversation has been expired
            </p>
          </div>
        ) : null}

        {(conversation.status === "assigned_to_admin" ||
          conversation.status === "blocked") && (
          <div className="border-t border-[#fee4e2] bg-[#fff6f5] px-4 py-3">
            <div className="flex items-start gap-3">
              <ShieldAlert className="mt-0.5 h-4 w-4 text-[#d92d20]" />
              <p className="text-[12px] leading-5 text-[#7a271a]">
                Human takeover aktif. AI tidak akan membalas otomatis sampai
                diaktifkan kembali oleh admin.
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="custom-scrollbar flex-1 overflow-y-auto bg-[#f7f8fc] px-4 py-4 sm:px-6">
        <div className="mb-4 flex items-center justify-center">
          <span className="rounded-full bg-white px-4 py-1 text-[11px] font-medium text-[#98a2b3] shadow-sm">
            Conversation timeline
          </span>
        </div>

        <div className="space-y-3">
          {conversation.messages.map((message) => {
            if (message.sender === "system") {
              return (
                <div key={message.id} className="py-1 text-center">
                  <p className="text-[12px] leading-5 text-[#667085]">
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
                      "rounded-[16px] border px-4 py-3 shadow-[0_3px_10px_rgba(92,110,145,0.06)]",
                      isCustomer
                        ? "rounded-tl-[6px] border-[#dce3ef] bg-[#e9edf7] text-[#475467]"
                        : "rounded-tr-[6px] border-[#d5edf8] bg-[#e7f6ff] text-[#344054]",
                    )}
                  >
                    <div className="mb-1 flex items-center gap-2 text-[11px] text-[#98a2b3]">
                      {isCustomer ? (
                        <span>{conversation.name}</span>
                      ) : (
                        <span className="inline-flex items-center gap-1">
                          {isAi ? (
                            <Bot className="h-3.5 w-3.5 text-[#1570ef]" />
                          ) : (
                            <User className="h-3.5 w-3.5 text-[#667085]" />
                          )}
                          {actorLabel}
                        </span>
                      )}
                    </div>
                    <p className="text-[13px] leading-6">{message.text}</p>
                    <div
                      className={cn(
                        "mt-2 flex items-center gap-1 text-[11px] text-[#98a2b3]",
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
            <div className="rounded-[14px] border border-[#e9d7fe] bg-[#f9f5ff] px-4 py-3">
              <div className="flex items-start gap-2.5">
                <StickyNote className="mt-0.5 h-4 w-4 text-[#7a5af8]" />
                <div>
                  <p className="text-[12px] font-semibold text-[#6941c6]">
                    Private note
                  </p>
                  <p className="mt-1 text-[13px] leading-6 text-[#667085]">
                    {conversation.notes}
                  </p>
                </div>
              </div>
            </div>
          ) : null}

          {isReplyTyping ? (
            <div className="flex justify-end">
              <div className="rounded-[16px] border border-[#d5edf8] bg-[#e7f6ff] px-4 py-3 text-[13px] text-[#344054]">
                <span className="inline-flex items-center gap-2">
                  <span className="flex gap-1">
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#1570ef] [animation-delay:-0.2s]" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#1570ef] [animation-delay:-0.1s]" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#1570ef]" />
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

      <div className="border-t border-[#e6ebf2] bg-white p-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="inline-flex rounded-[12px] bg-[#f5f7fb] p-1">
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
                    "rounded-[10px] px-3 py-2 text-[11px] font-semibold transition",
                    active
                      ? "bg-white text-[#1570ef] shadow-sm"
                      : "text-[#667085] hover:text-[#344054]",
                  )}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center gap-2 text-[11px] text-[#98a2b3]">
            <Link
              href="/tickets"
              className="inline-flex items-center gap-1 rounded-full bg-[#f5f7fb] px-3 py-1.5 text-[#667085] transition hover:bg-[#eef2f6]"
            >
              <Ticket className="h-3.5 w-3.5" />
              Tickets
            </Link>
            <Link
              href="/customers"
              className="inline-flex items-center gap-1 rounded-full bg-[#f5f7fb] px-3 py-1.5 text-[#667085] transition hover:bg-[#eef2f6]"
            >
              <Users className="h-3.5 w-3.5" />
              CRM
            </Link>
          </div>
        </div>

        {composerMode === "reply" ? (
          <div className="space-y-3">
            <div className="rounded-[14px] border border-[#d7e7ff] bg-[#eef6ff] px-4 py-3">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#1570ef]">
                    AI Suggested Reply
                  </p>
                  <p className="mt-1 text-[13px] leading-6 text-[#475467]">
                    {suggestionText}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => onUseSuggestion(suggestionText)}
                    className="rounded-[10px] border border-[#bfdbfe] bg-white px-3 py-2 text-[11px] font-semibold text-[#1570ef] transition hover:bg-[#f8fbff]"
                  >
                    Gunakan
                  </button>
                  <button
                    type="button"
                    onClick={() => onSuggestionVariantChange("short")}
                    className="rounded-[10px] border border-[#d0d5dd] bg-white px-3 py-2 text-[11px] font-semibold text-[#667085] transition hover:bg-[#f8fafc]"
                  >
                    Singkat
                  </button>
                  <button
                    type="button"
                    onClick={() => onSuggestionVariantChange("warm")}
                    className="rounded-[10px] border border-[#d0d5dd] bg-white px-3 py-2 text-[11px] font-semibold text-[#667085] transition hover:bg-[#f8fafc]"
                  >
                    Ramah
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onSuggestionVariantChange("default");
                      onSuggestionVersionChange((current) => current + 1);
                    }}
                    className="rounded-[10px] border border-[#d0d5dd] bg-white px-3 py-2 text-[11px] font-semibold text-[#667085] transition hover:bg-[#f8fafc]"
                  >
                    Ulangi
                  </button>
                </div>
              </div>
            </div>

            <div className="rounded-[16px] border border-[#dfe5ef] bg-[#fafbfc] p-3">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#dfe5ef] bg-white text-[#667085]"
                  title="Lampiran"
                >
                  <Paperclip className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => onUseSuggestion(suggestionText)}
                  className="inline-flex items-center gap-2 rounded-full border border-[#bfdbfe] bg-white px-3 py-2 text-[11px] font-semibold text-[#1570ef]"
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
                  className="min-h-[56px] flex-1 resize-none rounded-[14px] border-[#d0d5dd] bg-white px-4 py-3 text-[13px] leading-6 text-[#344054]"
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
                  className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-[#1570ef] text-white transition hover:bg-[#1267da] disabled:cursor-not-allowed disabled:bg-[#b9d4fb]"
                  title="Kirim"
                >
                  <Send className="h-[18px] w-[18px]" />
                </button>
              </div>

              <p className="mt-2 text-[11px] leading-5 text-[#98a2b3]">
                Gunakan Ctrl+Enter untuk mengirim lebih cepat.
              </p>
            </div>
          </div>
        ) : (
          <div className="rounded-[16px] border border-[#e9d7fe] bg-[#f9f5ff] p-4">
            <div className="mb-3 flex items-start gap-3">
              <StickyNote className="mt-0.5 h-5 w-5 text-[#7a5af8]" />
              <div>
                <p className="text-sm font-semibold text-[#6941c6]">
                  Catatan internal
                </p>
                <p className="mt-1 text-xs leading-6 text-[#667085]">
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
              className="min-h-[7rem] resize-none rounded-[14px] border-[#d6bbfb] bg-white px-4 py-3 text-[13px] leading-6 text-[#344054]"
              disabled={isSubmitting}
            />

            <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-[11px] leading-5 text-[#7a5af8]">
                {noteSaved
                  ? "Catatan berhasil disimpan."
                  : "Simpan ringkasan internal atau instruksi follow-up tim."}
              </p>
              <Button
                type="button"
                className="h-10 rounded-[10px] border-transparent bg-[#7a5af8] px-4 text-[11px] text-white hover:bg-[#6941c6]"
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
          <div className="mt-3 flex flex-col gap-3 rounded-[14px] border border-[#fecdca] bg-[#fff6f5] px-4 py-3 text-[12px] text-[#912018] sm:flex-row sm:items-center sm:justify-between">
            <p>
              Percakapan WhatsApp sudah melewati window 24 jam. Jika perlu lanjut,
              kirim template terlebih dulu.
            </p>
            <span className="inline-flex items-center gap-1 rounded-[10px] bg-white px-3 py-2 font-semibold text-[#b42318]">
              <CheckCheck className="h-3.5 w-3.5" />
              HSM required
            </span>
          </div>
        ) : null}
      </div>
    </section>
  );
}
