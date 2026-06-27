"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Bot,
  CheckCheck,
  MessageSquareDiff,
  Paperclip,
  PanelRight,
  Send,
  ShieldAlert,
  Smile,
  Sparkles,
  StickyNote,
  Ticket,
  Trash2,
  User,
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
  const [suggestionText, setSuggestionText] = useState("");
  const [isGeneratingSuggestion, setIsGeneratingSuggestion] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [templateSearch, setTemplateSearch] = useState("");

  const templates = config.automation.inboxSettings.templates;

  const handleReplyChange = (value: string) => {
    onReplyTextChange(value);

    const lastSlashIndex = value.lastIndexOf("/");
    
    if (lastSlashIndex !== -1 && (lastSlashIndex === 0 || value[lastSlashIndex - 1] === " " || value[lastSlashIndex - 1] === "\n")) {
      const query = value.slice(lastSlashIndex + 1);
      
      if (!query.includes(" ")) {
        setShowTemplates(true);
        setTemplateSearch(query.toLowerCase());
        return;
      }
    }
    
    setShowTemplates(false);
  };

  useEffect(() => {
    if (!conversation) {
      setSuggestionText("");
      return;
    }

    if (!config.aiProvider.enabled) {
      setSuggestionText(
        buildAiSuggestion({
          conversation,
          config,
          variant: suggestionVariant,
          version: suggestionVersion,
        })
      );
      return;
    }

    const customerMessages = conversation.messages.filter((m) => m.sender === "customer");
    const lastCustomerMessage = customerMessages[customerMessages.length - 1]?.text || "Hello";

    setIsGeneratingSuggestion(true);

    fetch("/api/ai-agent/preview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: lastCustomerMessage,
        config,
        context: {
          recentMessages: conversation.messages.map((m) => ({ sender: m.sender, text: m.text })),
          lastIntent: conversation.lastIntent,
        },
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.reply) {
          setSuggestionText(data.reply);
        } else {
          setSuggestionText(
            buildAiSuggestion({
              conversation,
              config,
              variant: suggestionVariant,
              version: suggestionVersion,
            })
          );
        }
      })
      .catch(() => {
        setSuggestionText(
          buildAiSuggestion({
            conversation,
            config,
            variant: suggestionVariant,
            version: suggestionVersion,
          })
        );
      })
      .finally(() => setIsGeneratingSuggestion(false));
  }, [
    conversation,
    config,
    suggestionVariant,
    suggestionVersion,
    conversation?.messages?.length,
  ]);

  if (!conversation) {
    return (
      <section className="rounded-xl border border-white/[0.06] bg-[#0a0e1c] lg:h-full flex items-center justify-center p-6">
        <div className="max-w-sm text-center space-y-6">
          {/* Overlapping Chat Bubble CSS Art */}
          <div className="relative w-32 h-24 mx-auto">
            {/* White/gray chat bubble behind */}
            <div className="absolute right-4 bottom-2 bg-slate-700/40 h-14 w-16 rounded-3xl rounded-br-none shadow-md border border-white/5 flex items-center justify-center animate-pulse" />
            {/* Purple chat bubble in front */}
            <div className="absolute left-4 top-2 bg-[#8c52ff] h-14 w-16 rounded-3xl rounded-bl-none flex items-center justify-center shadow-lg border border-[#8c52ff]/20 z-10">
              {/* Three dots loader inside purple bubble */}
              <div className="flex gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-white animate-bounce [animation-delay:-0.3s]" />
                <span className="h-1.5 w-1.5 rounded-full bg-white animate-bounce [animation-delay:-0.15s]" />
                <span className="h-1.5 w-1.5 rounded-full bg-white animate-bounce" />
              </div>
            </div>
          </div>
          <div>
            <h2 className="text-[15px] font-bold text-slate-200 tracking-tight">
              A chat will appear here
            </h2>
            <p className="mt-1.5 text-xs text-slate-500 max-w-[260px] mx-auto leading-relaxed">
              Select a chat to view customer messages.
            </p>
          </div>
        </div>
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
      {/* Header — minimal: name + created date only */}
      <div className="shrink-0 border-b border-white/[0.06]">
        <div className="flex items-center justify-between gap-3 px-4 py-3">
          {/* Left: back (mobile) + avatar + name + date */}
          <div className="flex min-w-0 flex-1 items-center gap-3">
            {/* Mobile back button */}
            <button
              type="button"
              onClick={onBackToList}
              className="inline-flex shrink-0 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.04] p-1.5 text-slate-400 lg:hidden"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>

            {/* Avatar */}
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.06] text-[11px] font-bold text-slate-300">
              {conversation.name.slice(0, 2).toUpperCase()}
            </div>

            {/* Name + created */}
            <div className="min-w-0">
              <h2 className="truncate text-sm font-semibold text-slate-100">
                {conversation.name}
              </h2>
              <p className="mt-0.5 text-[11px] text-slate-500">
                Created{" "}
                {conversation.timestamp
                  ? (() => {
                      try {
                        const d = new Date(conversation.timestamp);
                        return isNaN(d.getTime())
                          ? conversation.timestamp
                          : d.toLocaleDateString("id-ID", {
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            });
                      } catch {
                        return conversation.timestamp;
                      }
                    })()
                  : "—"}
              </p>
            </div>
          </div>

          {/* Right: action buttons */}
          <div className="flex shrink-0 items-center gap-1.5">
            {/* Toggle context panel */}
            <button
              type="button"
              onClick={onToggleContextPanel}
              className="inline-flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition hover:bg-white/[0.06] hover:text-slate-200"
              title={showContextPanel ? "Tutup Detail" : "Lihat Detail"}
            >
              <PanelRight className="h-4 w-4" />
            </button>

            {/* Pause / Activate AI */}
            <Button
              type="button"
              variant="secondary"
              className="h-8 rounded-lg border-white/[0.08] bg-white/[0.04] px-3 text-[11px] text-slate-300 hover:bg-white/[0.08]"
              onClick={canActivateAi ? onActivateAi : onPauseAi}
              disabled={(!canActivateAi && !canPauseAi) || isSubmitting}
            >
              {resolveStatusButtonLabel(conversation)}
            </Button>

            {/* Resolve */}
            <Button
              type="button"
              className="h-8 rounded-lg border-transparent bg-[#00d2ff] px-3 text-[11px] font-semibold text-[#050814] hover:bg-[#4de0ff]"
              onClick={onResolve}
              disabled={!canResolve || isSubmitting}
            >
              Resolve
            </Button>

            {/* Delete */}
            <button
              type="button"
              onClick={onDeleteConversation}
              disabled={isSubmitting}
              className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-red-500/15 text-red-400 transition hover:bg-red-500/25 disabled:opacity-50"
              title="Hapus percakapan"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Human takeover banner */}
        {(conversation.status === "assigned_to_admin" ||
          conversation.status === "blocked") && (
          <div className="border-t border-red-500/20 bg-red-500/10 px-4 py-2">
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-3.5 w-3.5 shrink-0 text-red-400" />
              <p className="text-[11px] leading-5 text-red-300">
                Human takeover aktif. AI tidak akan membalas otomatis sampai diaktifkan kembali.
              </p>
            </div>
          </div>
        )}

        {/* WhatsApp 24h expired banner */}
        {showExpiredBanner && (
          <div className="border-t border-orange-500/20 bg-orange-500/10 px-4 py-2">
            <p className="text-[11px] text-orange-300">
              WhatsApp window 24 jam expired. Kirim template terlebih dahulu.
            </p>
          </div>
        )}
      </div>

      {/* Chat Messages Area */}
      <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto overscroll-contain bg-[#080c18] px-4 py-4 sm:px-6">
        <div className="mb-4 flex items-center justify-center">
          <span className="rounded-full bg-white/[0.06] px-4 py-1 text-[11px] font-medium text-slate-500">
            Conversation timeline
          </span>
        </div>

        <div className="space-y-3">
          {conversation.messages.map((message) => {
            if (message.sender === "system") {
              return (
                <div key={message.id} className="py-2 flex justify-center">
                  <span className="rounded-full bg-white/[0.04] border border-white/[0.08] px-3 py-1 text-[10px] font-medium text-slate-400">
                    {message.timestamp} - {message.text}
                  </span>
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
                className={cn("flex w-full mb-3 items-end gap-2", isCustomer ? "justify-start" : "justify-end")}
              >
                {isCustomer && (
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/[0.08] text-[10px] font-semibold text-slate-300">
                    {conversation.name.slice(0, 2).toUpperCase()}
                  </div>
                )}

                <div className="flex flex-col max-w-[75%] sm:max-w-[65%]">
                  {!isCustomer && (
                    <div className="mb-1 flex items-center justify-end gap-1.5 text-[10px] text-slate-500 px-1">
                      <span>{actorLabel}</span>
                    </div>
                  )}
                  <div
                    className={cn(
                      "relative px-4 py-2.5 shadow-sm flex flex-col",
                      isCustomer
                        ? "bg-[#1e253c] text-slate-200 rounded-2xl rounded-bl-sm border border-white/5"
                        : "bg-[#00d2ff] text-[#050814] rounded-2xl rounded-br-sm"
                    )}
                  >
                    <p className="text-[13px] leading-relaxed whitespace-pre-wrap">{message.text}</p>
                    <div
                      className={cn(
                        "flex items-center gap-1 text-[10px] font-medium self-end mt-1.5",
                        isCustomer ? "text-slate-400" : "text-[#050814]/70",
                      )}
                    >
                      <span>{message.timestamp}</span>
                      {!isCustomer && statusInfo ? (
                        <span className="inline-flex items-center">
                          <statusInfo.icon className="h-3 w-3 ml-0.5" />
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>

                {!isCustomer && (
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#00d2ff]/10 text-[#00d2ff]">
                    {isAi ? <Bot className="h-4 w-4" /> : <User className="h-4 w-4" />}
                  </div>
                )}
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

      {/* Composer Area — always pinned at bottom */}
      <div className="shrink-0 border-t border-white/[0.06] bg-[#0a0e1c]">
        {/* Collapsible AI Suggestion */}
        {composerMode === "reply" && (
          <AiSuggestionPanel
            suggestionText={suggestionText}
            isLoading={isGeneratingSuggestion}
            onUseSuggestion={onUseSuggestion}
            onSuggestionVariantChange={onSuggestionVariantChange}
            onSuggestionVersionChange={onSuggestionVersionChange}
          />
        )}

        {/* Main composer input */}
        <div className="px-4 pb-3 pt-2 relative">
          {/* Slash Command Popover */}
          {composerMode === "reply" && showTemplates && (
            <div className="absolute bottom-full mb-2 left-4 w-80 max-h-64 overflow-y-auto rounded-xl border border-white/[0.1] bg-[#1e253c] p-2 shadow-2xl z-50 animate-in fade-in slide-in-from-bottom-2">
              <div className="px-2 py-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                Quick Replies
              </div>
              <div className="space-y-1 mt-1">
                {templates
                  .filter((t) =>
                    t.name.toLowerCase().includes(templateSearch) ||
                    t.body.toLowerCase().includes(templateSearch),
                  ).map((template) => (
                    <button
                      key={template.id}
                      type="button"
                      className="w-full flex flex-col items-start px-3 py-2 rounded-lg hover:bg-white/[0.06] transition text-left"
                      onClick={() => {
                        const lastSlashIndex = replyText.lastIndexOf("/");
                        if (lastSlashIndex !== -1) {
                          const newValue = replyText.slice(0, lastSlashIndex) + template.body;
                          onReplyTextChange(newValue);
                        }
                        setShowTemplates(false);
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-[12px] font-semibold text-white">{template.name}</span>
                        <span className="text-[10px] text-cyan-400 border border-cyan-400/30 bg-cyan-400/10 px-1.5 rounded">{template.category}</span>
                      </div>
                      <span className="text-[11px] text-slate-400 truncate w-full mt-0.5">{template.body}</span>
                    </button>
                  ))}
                {templates.filter(t => t.name.toLowerCase().includes(templateSearch) || t.body.toLowerCase().includes(templateSearch)).length === 0 && (
                  <div className="text-center py-4 text-xs text-slate-500">Tidak ada template ditemukan.</div>
                )}
              </div>
            </div>
          )}

          {composerMode === "reply" ? (
            <div className="relative flex flex-col rounded-xl border border-white/[0.08] bg-[#0a0e1c] focus-within:border-white/[0.15] transition-colors">
              <Textarea
                value={replyText}
                onChange={(event) => handleReplyChange(event.target.value)}
                rows={1}
                placeholder={`Type "shift + enter" to add a new line. Type "/" to use quick reply`}
                className="min-h-[44px] max-h-[120px] w-full resize-none border-0 bg-transparent px-4 pt-3 pb-2 text-[13px] leading-relaxed text-slate-200 placeholder:text-slate-500 focus-visible:ring-0 shadow-none"
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    onSendReply();
                  }
                }}
                disabled={isSubmitting || isReplyTyping}
              />
              <div className="flex items-center justify-between px-3 pb-2 pt-1 border-t border-white/[0.04] bg-white/[0.01]">
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-white/[0.06] hover:text-slate-200"
                  >
                    <Smile className="h-4.5 w-4.5" />
                  </button>
                  <button
                    type="button"
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-white/[0.06] hover:text-slate-200"
                  >
                    <Paperclip className="h-4.5 w-4.5" />
                  </button>
                </div>
                <button
                  type="button"
                  onClick={onSendReply}
                  disabled={!replyText.trim() || isSubmitting || isReplyTyping}
                  className="inline-flex h-8 items-center justify-center rounded-lg bg-white/[0.06] px-5 text-[12px] font-semibold text-slate-300 transition hover:bg-white/[0.1] disabled:opacity-50 disabled:hover:bg-white/[0.06] disabled:hover:text-slate-500"
                >
                  Send
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <Textarea
                value={noteDraft}
                onChange={(event) => onNoteDraftChange(event.target.value)}
                rows={2}
                placeholder="Tulis catatan internal..."
                className="min-h-[60px] max-h-[120px] resize-none rounded-xl border-purple-500/20 bg-white/[0.04] px-4 py-2.5 text-[13px] leading-5 text-slate-200"
                disabled={isSubmitting}
              />
              <div className="flex items-center justify-between">
                <p className="text-[11px] text-purple-400">
                  {noteSaved ? "✓ Catatan tersimpan" : "Catatan hanya terlihat oleh tim internal."}
                </p>
                <Button
                  type="button"
                  className="h-8 rounded-lg border-transparent bg-purple-500 px-3 text-[11px] text-white hover:bg-purple-600"
                  onClick={onSaveNote}
                  disabled={isSubmitting}
                >
                  Simpan
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Bottom toolbar */}
        <div className="flex items-center justify-between border-t border-white/[0.04] px-4 py-1.5">
          <div className="inline-flex rounded-lg bg-white/[0.04] p-0.5">
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
                    "rounded-md px-2.5 py-1 text-[10px] font-semibold transition",
                    active
                      ? "bg-white/[0.08] text-[#00d2ff]"
                      : "text-slate-500 hover:text-slate-300",
                  )}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2 text-[10px] text-slate-500">
            <span>Ctrl+Enter kirim</span>
            <Link
              href="/tickets"
              className="rounded-md bg-white/[0.04] px-2 py-1 text-slate-400 hover:bg-white/[0.08]"
            >
              Tickets
            </Link>
            <Link
              href="/customers"
              className="rounded-md bg-white/[0.04] px-2 py-1 text-slate-400 hover:bg-white/[0.08]"
            >
              CRM
            </Link>
          </div>
        </div>

        {showExpiredBanner ? (
          <div className="flex items-center justify-between border-t border-red-500/20 bg-red-500/10 px-4 py-2 text-[11px] text-red-300">
            <p>WhatsApp window 24 jam expired. Kirim template dulu.</p>
            <span className="inline-flex items-center gap-1 rounded-md bg-white/[0.04] px-2 py-1 font-semibold text-red-400">
              <CheckCheck className="h-3 w-3" />
              HSM
            </span>
          </div>
        ) : null}
      </div>
    </section>
  );
}

/* ---------- Collapsible AI Suggestion Sub-component ---------- */
function AiSuggestionPanel({
  suggestionText,
  isLoading,
  onUseSuggestion,
  onSuggestionVariantChange,
  onSuggestionVersionChange,
}: {
  suggestionText: string;
  isLoading: boolean;
  onUseSuggestion: (value: string) => void;
  onSuggestionVariantChange: (value: "default" | "short" | "warm") => void;
  onSuggestionVersionChange: (updater: (current: number) => number) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b border-white/[0.04]">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-4 py-2 text-left transition hover:bg-white/[0.03]"
      >
        <span className="inline-flex items-center gap-2 text-[11px] font-semibold text-[#00d2ff]">
          <Sparkles className="h-3.5 w-3.5" />
          AI Suggested Reply
        </span>
        <span className="text-[10px] text-slate-500">{open ? "Tutup ▲" : "Buka ▼"}</span>
      </button>

      {open && (
        <div className="px-4 pb-3">
          {isLoading ? (
            <div className="flex items-center gap-2 text-[12px] text-slate-400">
              <span className="flex gap-1">
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#00d2ff] [animation-delay:-0.2s]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#00d2ff] [animation-delay:-0.1s]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#00d2ff]" />
              </span>
              AI sedang menyiapkan balasan...
            </div>
          ) : (
            <p className="text-[12px] leading-5 text-slate-300">{suggestionText}</p>
          )}
          <div className="mt-2 flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => onUseSuggestion(suggestionText)}
              className="rounded-md border border-[#00d2ff]/30 bg-[#00d2ff]/10 px-2.5 py-1 text-[10px] font-semibold text-[#00d2ff] transition hover:bg-[#00d2ff]/20"
            >
              Gunakan
            </button>
            <button
              type="button"
              onClick={() => onSuggestionVariantChange("short")}
              className="rounded-md border border-white/[0.08] bg-white/[0.04] px-2.5 py-1 text-[10px] font-semibold text-slate-400 transition hover:bg-white/[0.08]"
            >
              Singkat
            </button>
            <button
              type="button"
              onClick={() => onSuggestionVariantChange("warm")}
              className="rounded-md border border-white/[0.08] bg-white/[0.04] px-2.5 py-1 text-[10px] font-semibold text-slate-400 transition hover:bg-white/[0.08]"
            >
              Ramah
            </button>
            <button
              type="button"
              onClick={() => {
                onSuggestionVariantChange("default");
                onSuggestionVersionChange((c) => c + 1);
              }}
              className="rounded-md border border-white/[0.08] bg-white/[0.04] px-2.5 py-1 text-[10px] font-semibold text-slate-400 transition hover:bg-white/[0.08]"
            >
              Ulangi
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
