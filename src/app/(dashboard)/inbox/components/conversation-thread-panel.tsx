"use client";

import Link from "next/link";
import { useMemo } from "react";
import {
  ArrowLeft,
  Bot,
  Clock3,
  MessageSquareDiff,
  Paperclip,
  RefreshCcw,
  Send,
  ShieldAlert,
  SmilePlus,
  Sparkles,
  StickyNote,
  Ticket,
  Trash2,
  User,
  Users,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Tabs } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { DashboardConfig } from "@/types/dashboard-config";
import type { ConversationRecord } from "@/types/operations";

import {
  buildAiSuggestion,
  formatSlaLabel,
  getChannelMeta,
  getConversationStatusMeta,
  getMessageActorLabel,
  getMessageStatusMeta,
  getPriorityMeta,
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
      <section className="rounded-[28px] border border-[var(--color-border)] bg-[var(--color-surface)]">
        <EmptyState
          title="Belum memilih conversation"
          description="Pilih percakapan dari panel kiri untuk melihat histori pesan, AI summary, dan aksi operasional."
          className="min-h-[42rem] border-none bg-transparent"
          icon={<MessageSquareDiff className="h-10 w-10" />}
        />
      </section>
    );
  }

  const channelMeta = getChannelMeta(conversation);
  const statusMeta = getConversationStatusMeta(conversation);
  const priorityMeta = getPriorityMeta(conversation);
  const ChannelIcon = channelMeta.icon;
  const StatusIcon = statusMeta.icon;

  const canTakeOver = conversation.status === "ai_active";
  const canPauseAi = conversation.status === "ai_active";
  const canActivateAi =
    conversation.status === "ai_paused" ||
    conversation.status === "assigned_to_admin" ||
    conversation.status === "resolved";
  const canResolve =
    conversation.status !== "resolved" && conversation.status !== "spam";

  return (
    <section className="flex min-h-[42rem] flex-col overflow-hidden rounded-[28px] border border-[var(--color-border)] bg-[var(--color-surface)]">
      <div className="border-b border-[var(--color-border)] p-4 sm:p-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="min-w-0">
            <div className="mb-2 flex items-center gap-2 lg:hidden">
              <button
                type="button"
                onClick={onBackToList}
                className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-white/[0.03] px-3 py-1.5 text-[11px] font-semibold text-slate-300"
              >
                <ArrowLeft className="h-4 w-4" />
                Daftar
              </button>
              <button
                type="button"
                onClick={onToggleContextPanel}
                className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-white/[0.03] px-3 py-1.5 text-[11px] font-semibold text-slate-300"
              >
                <Users className="h-4 w-4" />
                {showContextPanel ? "Sembunyikan Context" : "Lihat Context"}
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-xl font-semibold text-white">
                {conversation.name}
              </h2>
              <Badge className={cn("px-2.5 py-1 text-[11px]", statusMeta.toneClassName)}>
                <StatusIcon className="mr-1 h-4 w-4" />
                {statusMeta.label}
              </Badge>
              <Badge className={cn("px-2.5 py-1 text-[11px]", priorityMeta.toneClassName)}>
                {priorityMeta.label}
              </Badge>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2 text-[12px] text-slate-400">
              <span className={cn("inline-flex items-center gap-2 rounded-full px-3 py-1", channelMeta.toneClassName)}>
                <ChannelIcon className="h-4 w-4" />
                {channelMeta.label}
              </span>
              <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1">
                Assigned: {conversation.assignedTo}
              </span>
              <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1">
                Intent: {conversation.lastIntent}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1">
                <Clock3 className="h-3.5 w-3.5" />
                SLA: {formatSlaLabel(conversation)}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant={canTakeOver ? "primary" : "secondary"}
              className="h-10 rounded-full px-4 text-xs"
              onClick={onTakeOver}
              disabled={!canTakeOver || isSubmitting}
            >
              Take Over
            </Button>
            <Button
              type="button"
              variant="secondary"
              className="h-10 rounded-full px-4 text-xs"
              onClick={canActivateAi ? onActivateAi : onPauseAi}
              disabled={(!canActivateAi && !canPauseAi) || isSubmitting}
            >
              {canActivateAi ? "Aktifkan AI" : "Pause AI"}
            </Button>
            <Button
              type="button"
              variant="secondary"
              className="h-10 rounded-full px-4 text-xs"
              onClick={onCreateTicket}
              disabled={isSubmitting}
            >
              <Ticket className="mr-2 h-4 w-4" />
              Buat Ticket
            </Button>
            <Button
              type="button"
              variant="secondary"
              className="h-10 rounded-full px-4 text-xs"
              onClick={onResolve}
              disabled={!canResolve || isSubmitting}
            >
              Resolve
            </Button>
            <button
              type="button"
              onClick={onDeleteConversation}
              disabled={isSubmitting}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-rose-500/30 bg-rose-500/10 text-rose-200 transition hover:bg-rose-500/15 disabled:opacity-50"
              title="Hapus percakapan"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        {(conversation.status === "assigned_to_admin" ||
          conversation.status === "blocked") && (
          <div className="mt-4 rounded-[22px] border border-rose-500/20 bg-rose-500/6 p-4">
            <div className="flex items-start gap-3">
              <ShieldAlert className="mt-0.5 h-5 w-5 text-rose-300" />
              <div>
                <p className="text-sm font-semibold text-rose-200">
                  Human takeover aktif
                </p>
                <p className="mt-1 text-xs leading-6 text-slate-300">
                  AI berhenti membalas otomatis. Semua pesan berikutnya harus
                  divalidasi admin sampai AI diaktifkan kembali.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="custom-scrollbar flex-1 overflow-y-auto bg-[var(--color-bg)]/35 p-4 sm:p-5">
        <div className="space-y-4">
          {conversation.messages.map((message) => {
            if (message.sender === "system") {
              return (
                <div
                  key={message.id}
                  className="mx-auto max-w-2xl rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-center"
                >
                  <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-400">
                    System
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-200">
                    {message.text}
                  </p>
                </div>
              );
            }

            const isCustomer = message.sender === "customer";
            const isAi = message.sender === "ai";
            const statusInfo = getMessageStatusMeta(message.status);
            const actorLabel = getMessageActorLabel(message);

            return (
              <div
                key={message.id}
                className={cn(
                  "flex gap-3",
                  isCustomer ? "justify-start" : "justify-end",
                )}
              >
                <div
                  className={cn(
                    "flex max-w-[88%] gap-3 sm:max-w-[78%]",
                    isCustomer ? "flex-row" : "flex-row-reverse",
                  )}
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.05]">
                    {isCustomer ? (
                      <span className="text-xs font-semibold text-white">
                        {conversation.name.slice(0, 2).toUpperCase()}
                      </span>
                    ) : isAi ? (
                      <Bot className="h-4 w-4 text-cyan-300" />
                    ) : (
                      <User className="h-4 w-4 text-amber-300" />
                    )}
                  </div>

                  <div className={cn("space-y-2", isCustomer ? "items-start" : "items-end")}>
                    <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
                      <span>{actorLabel}</span>
                      {isAi ? (
                        <span className="rounded-full border border-cyan-500/20 bg-cyan-500/10 px-2 py-0.5 text-[10px] text-cyan-200">
                          AI generated
                        </span>
                      ) : null}
                    </div>

                    <div
                      className={cn(
                        "rounded-[22px] border px-4 py-3 text-sm leading-6",
                        isCustomer
                          ? "rounded-tl-sm border-white/10 bg-white/[0.04] text-slate-100"
                          : isAi
                            ? "rounded-tr-sm border-cyan-500/20 bg-cyan-500/8 text-cyan-50"
                            : "rounded-tr-sm border-amber-500/20 bg-amber-500/8 text-amber-50",
                      )}
                    >
                      {message.text}
                    </div>

                    <div
                      className={cn(
                        "flex flex-wrap items-center gap-2 text-[10px] text-slate-500",
                        isCustomer ? "justify-start" : "justify-end",
                      )}
                    >
                      <span>{message.timestamp}</span>
                      {statusInfo ? (
                        <span className={cn("inline-flex items-center gap-1", statusInfo.iconClassName)}>
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
            <div className="rounded-[24px] border border-violet-500/20 bg-violet-500/8 p-4">
              <div className="flex items-start gap-3">
                <StickyNote className="mt-0.5 h-5 w-5 text-violet-200" />
                <div>
                  <p className="text-sm font-semibold text-violet-100">
                    Private note saat ini
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-200">
                    {conversation.notes}
                  </p>
                </div>
              </div>
            </div>
          ) : null}

          {isReplyTyping ? (
            <div className="flex justify-end">
              <div className="rounded-[22px] border border-cyan-500/20 bg-cyan-500/8 px-4 py-3 text-sm text-cyan-100">
                <span className="inline-flex items-center gap-2">
                  <span className="flex gap-1">
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-cyan-300 [animation-delay:-0.2s]" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-cyan-300 [animation-delay:-0.1s]" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-cyan-300" />
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

      <div className="border-t border-[var(--color-border)] bg-[var(--color-surface)] p-4 sm:p-5">
        <Tabs
          tabs={[
            { id: "reply", label: "Balas Customer" },
            { id: "note", label: "Catatan Internal" },
          ]}
          activeTab={composerMode}
          onChange={(value) => onComposerModeChange(value as "reply" | "note")}
          className="mb-4"
        />

        {composerMode === "reply" ? (
          <div className="space-y-4">
            <div className="rounded-[24px] border border-cyan-500/15 bg-cyan-500/6 p-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-200">
                    AI Suggested Reply
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-100">
                    {suggestionText}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => onUseSuggestion(suggestionText)}
                    className="rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-2 text-[11px] font-semibold text-cyan-100 transition hover:bg-cyan-500/15"
                  >
                    Gunakan
                  </button>
                  <button
                    type="button"
                    onClick={() => onSuggestionVariantChange("short")}
                    className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-2 text-[11px] font-semibold text-slate-200 transition hover:bg-white/[0.06]"
                  >
                    Lebih Singkat
                  </button>
                  <button
                    type="button"
                    onClick={() => onSuggestionVariantChange("warm")}
                    className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-2 text-[11px] font-semibold text-slate-200 transition hover:bg-white/[0.06]"
                  >
                    Lebih Ramah
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onSuggestionVariantChange("default");
                      onSuggestionVersionChange((current) => current + 1);
                    }}
                    className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-2 text-[11px] font-semibold text-slate-200 transition hover:bg-white/[0.06]"
                  >
                    Buat Ulang
                  </button>
                </div>
              </div>
            </div>

            <div className="rounded-[26px] border border-[var(--color-border)] bg-[var(--color-bg)]/30 p-3">
              <div className="mb-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-2 text-[11px] font-semibold text-slate-300"
                >
                  <Paperclip className="h-4 w-4" />
                  Attachment
                </button>
                <button
                  type="button"
                  className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-2 text-[11px] font-semibold text-slate-300"
                >
                  <SmilePlus className="h-4 w-4" />
                  Emoji
                </button>
                <button
                  type="button"
                  className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-2 text-[11px] font-semibold text-slate-300"
                >
                  <Sparkles className="h-4 w-4" />
                  Quick Reply
                </button>
                <button
                  type="button"
                  onClick={() => onUseSuggestion(suggestionText)}
                  className="inline-flex items-center gap-2 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-2 text-[11px] font-semibold text-cyan-100"
                >
                  <RefreshCcw className="h-4 w-4" />
                  AI Suggestion
                </button>
              </div>

              <Textarea
                value={replyText}
                onChange={(event) => onReplyTextChange(event.target.value)}
                rows={4}
                placeholder={`Ketik balasan untuk ${conversation.name}...`}
                className="min-h-[7rem] resize-none rounded-[22px] border-[var(--color-border)] bg-white/[0.03] px-4 py-3 text-sm leading-6"
                onKeyDown={(event) => {
                  if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
                    event.preventDefault();
                    onSendReply();
                  }
                }}
                disabled={isSubmitting || isReplyTyping}
              />

              <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-[11px] leading-5 text-slate-400">
                  Balasan akan dikirim ke channel customer. Gunakan Ctrl+Enter
                  untuk kirim lebih cepat.
                </p>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    className="h-11 rounded-full px-4 text-xs"
                    onClick={() => onUseSuggestion(suggestionText)}
                  >
                    Gunakan Saran
                  </Button>
                  <Button
                    type="button"
                    className="h-11 rounded-full px-4 text-xs"
                    onClick={onSendReply}
                    disabled={!replyText.trim() || isSubmitting || isReplyTyping}
                  >
                    <Send className="mr-2 h-4 w-4" />
                    Kirim
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-[26px] border border-violet-500/15 bg-violet-500/6 p-4">
            <div className="mb-3 flex items-start gap-3">
              <StickyNote className="mt-0.5 h-5 w-5 text-violet-200" />
              <div>
                <p className="text-sm font-semibold text-violet-100">
                  Catatan internal
                </p>
                <p className="mt-1 text-xs leading-6 text-slate-300">
                  Catatan ini hanya terlihat oleh tim internal dan tidak akan
                  pernah terkirim ke customer.
                </p>
              </div>
            </div>

            <Textarea
              value={noteDraft}
              onChange={(event) => onNoteDraftChange(event.target.value)}
              rows={5}
              placeholder="Tulis konteks internal, approval, atau follow-up yang harus dilakukan tim..."
              className="min-h-[8rem] resize-none rounded-[22px] border-[var(--color-border)] bg-white/[0.03] px-4 py-3 text-sm leading-6"
              disabled={isSubmitting}
            />

            <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-[11px] leading-5 text-slate-400">
                {noteSaved
                  ? "Catatan berhasil disimpan ke database operasional."
                  : "Gunakan tab ini untuk mencatat kebutuhan follow-up, approval, atau konteks customer."}
              </p>
              <Button
                type="button"
                className="h-11 rounded-full px-4 text-xs"
                onClick={onSaveNote}
                disabled={isSubmitting}
              >
                <StickyNote className="mr-2 h-4 w-4" />
                Simpan Catatan
              </Button>
            </div>
          </div>
        )}

        <div className="mt-4 flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
          <Link
            href="/tickets"
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-2 transition hover:bg-white/[0.06]"
          >
            <Ticket className="h-4 w-4" />
            Lihat Ticket
          </Link>
          <Link
            href="/customers"
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-2 transition hover:bg-white/[0.06]"
          >
            <Users className="h-4 w-4" />
            Buka CRM
          </Link>
        </div>
      </div>
    </section>
  );
}

