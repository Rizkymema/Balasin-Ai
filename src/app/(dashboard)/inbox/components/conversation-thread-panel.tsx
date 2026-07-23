"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import {
  ArrowLeft,
  Bot,
  CheckCheck,
  ImageIcon,
  MessageSquareDiff,
  Paperclip,
  PanelRight,
  Send,
  ShieldAlert,
  Smile,
  Sparkles,
  Smartphone,
  StickyNote,
  Ticket,
  Trash2,
  User,
  Video,
  X,
} from "lucide-react";

import { OUTBOUND_MEDIA_ACCEPT } from "@/constants/media";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
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

type ReplyAttachment = {
  kind: "image" | "video";
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  previewUrl: string;
} | null;

type ConversationThreadPanelProps = {
  conversation: ConversationRecord | null;
  config: DashboardConfig;
  whatsappAccountLabel?: string;
  replyText: string;
  onReplyTextChange: (value: string) => void;
  replyAttachment: ReplyAttachment;
  onReplyAttachmentSelect: (file: File | null) => void;
  onReplyAttachmentRemove: () => void;
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
  allowMediaAttachments: boolean;
  noteSaved: boolean;
  showContextPanel: boolean;
  onToggleContextPanel: () => void;
  onBackToList: () => void;
  onSendSticker?: (stickerUrl: string) => void;
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

function formatMediaFileSize(sizeBytes: number) {
  if (sizeBytes >= 1024 * 1024) {
    return `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  if (sizeBytes >= 1024) {
    return `${Math.max(1, Math.round(sizeBytes / 1024))} KB`;
  }

  return `${sizeBytes} B`;
}

export function ConversationThreadPanel({
  conversation,
  config,
  whatsappAccountLabel,
  replyText,
  onReplyTextChange,
  replyAttachment,
  onReplyAttachmentSelect,
  onReplyAttachmentRemove,
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
  onSendSticker,
  isSubmitting,
  isReplyTyping,
  allowMediaAttachments,
  noteSaved,
  showContextPanel,
  onToggleContextPanel,
  onBackToList,
}: ConversationThreadPanelProps) {
  const [suggestionText, setSuggestionText] = useState("");
  const [isGeneratingSuggestion, setIsGeneratingSuggestion] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [templateSearch, setTemplateSearch] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showStickerPicker, setShowStickerPicker] = useState(false);
  const fileInputId = useId();

  const containerRef = useRef<HTMLDivElement>(null);
  const prevConversationIdRef = useRef<string | null>(null);
  const conversationId = conversation?.id ?? null;
  const messageCount = conversation?.messages?.length ?? 0;

  useEffect(() => {
    if (!conversationId) return;

    const isSameConversation = prevConversationIdRef.current === conversationId;
    prevConversationIdRef.current = conversationId;

    const scrollToBottom = () => {
      if (containerRef.current) {
        if (isSameConversation) {
          containerRef.current.scrollTo({
            top: containerRef.current.scrollHeight,
            behavior: "smooth",
          });
        } else {
          containerRef.current.scrollTop = containerRef.current.scrollHeight;
        }
      }
    };

    scrollToBottom();
    const timer = setTimeout(scrollToBottom, 50);
    return () => clearTimeout(timer);
  }, [conversationId, isReplyTyping, messageCount]);

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
        agentId: conversation.automation?.activeAgentId,
        context: {
          recentMessages: conversation.messages.map((m) => ({ sender: m.sender, text: m.text })),
          lastIntent: conversation.lastIntent,
          summary: conversation.summary,
        },
      }),
    })
      .then(async (res) => {
        const payload = await res.json();
        if (!res.ok || !payload.ok) {
          throw new Error(payload.error || "Gagal membuat saran AI.");
        }
        return payload.data;
      })
      .then((decision) => {
        if (decision.reply) {
          setSuggestionText(decision.reply);
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
      <section className="rounded-2xl border border-slate-200 bg-white shadow-2xs lg:h-full flex items-center justify-center p-6">
        <div className="max-w-sm text-center space-y-6">
          <div className="relative w-32 h-24 mx-auto">
            <div className="absolute right-4 bottom-2 bg-slate-100 h-14 w-16 rounded-3xl rounded-br-none shadow-xs border border-slate-200 flex items-center justify-center animate-pulse" />
            <div className="absolute left-4 top-2 bg-blue-600 h-14 w-16 rounded-3xl rounded-bl-none flex items-center justify-center shadow-md border border-blue-500 z-10">
              <div className="flex gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-white animate-bounce [animation-delay:-0.3s]" />
                <span className="h-1.5 w-1.5 rounded-full bg-white animate-bounce [animation-delay:-0.15s]" />
                <span className="h-1.5 w-1.5 rounded-full bg-white animate-bounce" />
              </div>
            </div>
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 tracking-tight">
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

  const canTakeOver = conversation.status === "ai_active";
  const canPauseAi = conversation.status === "ai_active";
  const canActivateAi =
    conversation.status === "ai_paused" ||
    conversation.status === "assigned_to_admin" ||
    conversation.status === "resolved";
  const canResolve =
    conversation.status !== "resolved" && conversation.status !== "spam";

  return (
    <section className="flex min-h-[42rem] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xs lg:h-full lg:min-h-0">
      {/* Header */}
      <div className="shrink-0 border-b border-slate-200 bg-white">
        <div className="flex items-center justify-between gap-3 px-4 py-3">
          {/* Left: back (mobile) + avatar + name + date */}
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <button
              type="button"
              onClick={onBackToList}
              className="inline-flex shrink-0 items-center justify-center rounded-full border border-slate-200 bg-slate-50 p-1.5 text-slate-600 lg:hidden cursor-pointer"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>

            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-600 text-[11px] font-extrabold text-white uppercase shadow-2xs">
              {conversation.name.slice(0, 2)}
            </div>

            <div className="min-w-0">
              <h2 className="truncate text-xs font-bold text-slate-900">
                {conversation.name}
              </h2>
              <div className="mt-0.5 flex min-w-0 items-center gap-1.5 text-[11px] text-slate-500">
                {conversation.channel === "WhatsApp" && whatsappAccountLabel ? (
                  <>
                    <span className="inline-flex min-w-0 items-center gap-1 text-emerald-700 font-semibold">
                      <Smartphone className="h-3 w-3 shrink-0" />
                      <span className="max-w-36 truncate">
                        {whatsappAccountLabel}
                      </span>
                    </span>
                    <span className="h-1 w-1 shrink-0 rounded-full bg-slate-300" />
                  </>
                ) : null}
                <span className="truncate">
                  {conversation.timestamp || "—"}
                </span>
              </div>
            </div>
          </div>

          {/* Right: action buttons */}
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={onToggleContextPanel}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 cursor-pointer"
              title={showContextPanel ? "Tutup Detail" : "Lihat Detail"}
            >
              <PanelRight className="h-4 w-4" />
            </button>

            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={canActivateAi ? onActivateAi : onPauseAi}
              disabled={(!canActivateAi && !canPauseAi) || isSubmitting}
            >
              {resolveStatusButtonLabel(conversation)}
            </Button>

            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={onResolve}
              disabled={!canResolve || isSubmitting}
            >
              Resolve
            </Button>

            <button
              type="button"
              onClick={onDeleteConversation}
              disabled={isSubmitting}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-red-50 text-red-600 transition hover:bg-red-100 disabled:opacity-50 cursor-pointer"
              title="Hapus percakapan"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Agent takeover banner */}
        {(conversation.status === "assigned_to_admin" ||
          conversation.status === "blocked") && (
          <div className="border-t border-amber-200 bg-amber-50 px-4 py-2">
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 shrink-0 text-amber-600" />
              <p className="text-xs font-semibold text-amber-800">
                Agent takeover aktif. AI tidak akan membalas otomatis sampai diaktifkan kembali.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Chat Messages Area */}
      <div
        ref={containerRef}
        className="custom-scrollbar min-h-0 flex-1 overflow-y-auto overscroll-contain bg-slate-50/70 px-4 py-4 sm:px-6"
      >
        <div className="mb-4 flex items-center justify-center">
          <span className="rounded-full bg-white border border-slate-200 shadow-2xs px-3.5 py-1 text-[10px] font-bold text-slate-500">
            Timeline Percakapan
          </span>
        </div>

        <div className="space-y-3">
          {conversation.messages.map((message) => {
            if (message.sender === "system") {
              return (
                <div key={message.id} className="py-2 flex justify-center">
                  <span className="rounded-full bg-white border border-slate-200 shadow-2xs px-3 py-1 text-[10px] font-medium text-slate-500">
                    {message.timestamp} - {message.text}
                  </span>
                </div>
              );
            }

            const isCustomer = message.sender === "customer";
            const isAi = message.sender === "ai";
            const actorLabel = getMessageActorLabel(message);
            const statusInfo = getMessageStatusMeta(message.status);
            const shouldShowText =
              !!message.text &&
              (!message.media ||
                message.text !==
                  (message.media.kind === "image" ? "[Foto]" : "[Video]"));

            return (
              <div
                key={message.id}
                className={cn("flex w-full mb-3 items-end gap-2", isCustomer ? "justify-start" : "justify-end")}
              >
                {isCustomer && (
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-200 font-bold text-[10px] text-slate-700">
                    {conversation.name.slice(0, 2).toUpperCase()}
                  </div>
                )}

                <div className="flex flex-col max-w-[75%] sm:max-w-[65%]">
                  {!isCustomer && (
                    <div className="mb-1 flex items-center justify-end gap-1.5 text-[10px] text-slate-500 font-medium px-1">
                      <span>{actorLabel}</span>
                    </div>
                  )}
                  <div
                    className={cn(
                      "relative px-4 py-2.5 shadow-2xs flex flex-col border",
                      isCustomer
                        ? "bg-white text-slate-900 border-slate-200 rounded-2xl rounded-bl-xs"
                        : "bg-blue-600 text-white border-blue-600 rounded-2xl rounded-br-xs"
                    )}
                  >
                    {message.media?.kind === "image" && message.media.previewUrl ? (
                      <a
                        href={message.media.publicUrl ?? message.media.previewUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="mb-2 overflow-hidden rounded-xl border border-slate-200"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={message.media.publicUrl ?? message.media.previewUrl}
                          alt={message.media.fileName ?? "Gambar chat"}
                          className="max-h-72 w-full object-cover"
                        />
                      </a>
                    ) : null}
                    {message.media?.kind === "video" && message.media.previewUrl ? (
                      <video
                        controls
                        preload="metadata"
                        className="mb-2 max-h-72 w-full rounded-xl border border-slate-200 bg-slate-900"
                        src={message.media.publicUrl ?? message.media.previewUrl}
                      />
                    ) : null}
                    {shouldShowText ? (
                      <p className="text-xs leading-relaxed whitespace-pre-wrap">{message.text}</p>
                    ) : null}
                    <div
                      className={cn(
                        "flex items-center gap-1 text-[10px] font-medium self-end mt-1",
                        isCustomer ? "text-slate-400" : "text-blue-100",
                      )}
                    >
                      <span>{message.timestamp}</span>
                      {!isCustomer && statusInfo ? (
                        <span className="inline-flex items-center">
                          <statusInfo.icon className="h-3 w-3 ml-0.5 text-white" />
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>

                {!isCustomer && (
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white font-bold text-xs shadow-2xs">
                    {isAi ? <Bot className="h-4 w-4" /> : <User className="h-4 w-4" />}
                  </div>
                )}
              </div>
            );
          })}

          {conversation.notes.trim() ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-3.5 shadow-2xs">
              <div className="flex items-start gap-2.5">
                <StickyNote className="mt-0.5 h-4 w-4 text-amber-600 shrink-0" />
                <div>
                  <p className="text-xs font-bold text-amber-900">
                    Private Note
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-slate-800">
                    {conversation.notes}
                  </p>
                </div>
              </div>
            </div>
          ) : null}

          {isReplyTyping ? (
            <div className="flex justify-end">
              <div className="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-xs text-blue-900 font-semibold shadow-2xs">
                <span className="inline-flex items-center gap-2">
                  <span className="flex gap-1">
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-blue-600 [animation-delay:-0.2s]" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-blue-600 [animation-delay:-0.1s]" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-blue-600" />
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
      <div className="shrink-0 border-t border-slate-200 bg-white">
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
          {/* Quick reply templates modal */}
          {composerMode === "reply" && showTemplates && (
            <div className="absolute bottom-full mb-2 left-4 w-80 max-h-64 overflow-y-auto rounded-xl border border-slate-200 bg-white p-2 shadow-xl z-50 animate-fade-in">
              <div className="px-2 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
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
                      className="w-full flex flex-col items-start px-3 py-2 rounded-lg hover:bg-slate-50 transition text-left cursor-pointer"
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
                        <span className="text-xs font-bold text-slate-900">{template.name}</span>
                        <Badge variant="default" className="text-[9px] py-0 px-1">
                          {template.category}
                        </Badge>
                      </div>
                      <span className="text-xs text-slate-500 truncate w-full mt-0.5">{template.body}</span>
                    </button>
                  ))}
              </div>
            </div>
          )}

          {composerMode === "reply" ? (
            <div className="relative flex flex-col rounded-xl border border-slate-200 bg-white focus-within:border-blue-600 focus-within:ring-2 focus-within:ring-blue-600/20 transition-all">
              {replyAttachment ? (
                <div className="border-b border-slate-100 px-4 py-3">
                  <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
                      {replyAttachment.kind === "image" ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={replyAttachment.previewUrl}
                          alt={replyAttachment.fileName}
                          className="h-16 w-16 object-cover"
                        />
                      ) : (
                        <div className="flex h-16 w-16 items-center justify-center bg-slate-900 text-white">
                          <Video className="h-6 w-6" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                        {replyAttachment.kind === "image" ? (
                          <ImageIcon className="h-4 w-4 text-blue-600" />
                        ) : (
                          <Video className="h-4 w-4 text-blue-600" />
                        )}
                        <span className="truncate">{replyAttachment.fileName}</span>
                      </div>
                      <p className="mt-0.5 text-[11px] text-slate-500">
                        {replyAttachment.mimeType} · {formatMediaFileSize(replyAttachment.sizeBytes)}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={onReplyAttachmentRemove}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-200 hover:text-slate-800 cursor-pointer"
                      aria-label="Hapus lampiran"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ) : null}
              <Textarea
                value={replyText}
                onChange={(event) => handleReplyChange(event.target.value)}
                rows={1}
                placeholder={
                  allowMediaAttachments
                    ? `Tulis balasan... Tekan Enter untuk mengirim, "/" untuk quick reply.`
                    : `Tekan Enter untuk mengirim, "/" untuk quick reply.`
                }
                className="min-h-[44px] max-h-[120px] w-full resize-none border-0 bg-transparent px-4 pt-3 pb-2 text-xs leading-relaxed text-slate-900 placeholder:text-slate-400 focus-visible:ring-0 shadow-none"
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    onSendReply();
                  }
                }}
                disabled={isSubmitting || isReplyTyping}
              />
              <div className="flex items-center justify-between px-3 pb-2 pt-1 border-t border-slate-100 bg-slate-50/50">
                <div className="flex items-center gap-1">
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                      className={cn(
                        "inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-200 hover:text-slate-900 cursor-pointer",
                        showEmojiPicker && "bg-slate-200 text-blue-600"
                      )}
                      title="Sisipkan emoji"
                    >
                      <Smile className="h-4.5 w-4.5" />
                    </button>
                    {showEmojiPicker && (
                      <div className="absolute bottom-full mb-2 left-0 bg-white border border-slate-200 rounded-xl p-2 shadow-xl z-50 grid grid-cols-5 gap-1.5 w-44 animate-fade-in">
                        {["😊", "😂", "👍", "❤️", "🙏", "😉", "😍", "😮", "😢", "😡", "🛠️", "🚗", "🛵", "🔑", "✅"].map((emoji) => (
                          <button
                            key={emoji}
                            type="button"
                            onClick={() => {
                              onReplyTextChange(replyText + emoji);
                              setShowEmojiPicker(false);
                            }}
                            className="h-7 w-7 flex items-center justify-center rounded hover:bg-slate-100 text-sm transition cursor-pointer"
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <input
                    id={fileInputId}
                    type="file"
                    accept={OUTBOUND_MEDIA_ACCEPT}
                    className="sr-only"
                    onChange={(event) => {
                      const file = event.target.files?.[0] ?? null;
                      onReplyAttachmentSelect(file);
                      event.currentTarget.value = "";
                    }}
                    disabled={!allowMediaAttachments || isSubmitting || isReplyTyping}
                  />
                  <label
                    htmlFor={fileInputId}
                    aria-disabled={!allowMediaAttachments || isSubmitting || isReplyTyping}
                    className={cn(
                      "inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-500",
                      allowMediaAttachments && !isSubmitting && !isReplyTyping
                        ? "cursor-pointer hover:bg-slate-200 hover:text-slate-900"
                        : "cursor-not-allowed opacity-40",
                    )}
                    title={
                      allowMediaAttachments
                        ? "Lampirkan foto atau video"
                        : "Kirim media saat ini hanya didukung untuk WhatsApp, Website Chat, dan Instagram DM"
                    }
                  >
                    <Paperclip className="h-4.5 w-4.5" />
                  </label>
                </div>
                <Button
                  type="button"
                  onClick={onSendReply}
                  disabled={(!replyText.trim() && !replyAttachment) || isSubmitting || isReplyTyping}
                  size="sm"
                  variant="primary"
                >
                  {replyAttachment ? "Send Media" : "Send"}
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <Textarea
                value={noteDraft}
                onChange={(event) => onNoteDraftChange(event.target.value)}
                rows={2}
                placeholder="Tulis catatan internal..."
                className="min-h-[60px] max-h-[120px] resize-none rounded-xl border-amber-200 bg-amber-50/30 px-4 py-2.5 text-xs text-slate-900 focus:border-amber-400 focus:ring-amber-500/20"
                disabled={isSubmitting}
              />
              <div className="flex items-center justify-between">
                <p className="text-[11px] text-amber-700 font-semibold">
                  {noteSaved ? "✓ Catatan tersimpan" : "Catatan hanya terlihat oleh tim internal."}
                </p>
                <Button
                  type="button"
                  size="sm"
                  onClick={onSaveNote}
                  disabled={isSubmitting}
                  className="bg-amber-600 hover:bg-amber-700 text-white font-bold border-transparent"
                >
                  Simpan Note
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Bottom toolbar */}
        <div className="flex items-center justify-between border-t border-slate-100 px-4 py-2 bg-slate-50/50">
          <div className="inline-flex rounded-lg bg-slate-200/60 p-0.5">
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
                    "rounded-md px-3 py-1 text-xs font-bold transition cursor-pointer",
                    active
                      ? "bg-white text-blue-600 shadow-2xs"
                      : "text-slate-500 hover:text-slate-900",
                  )}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span>Enter kirim · Shift+Enter baris baru</span>
          </div>
        </div>
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
    <div className="border-b border-slate-100 bg-blue-50/30">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-4 py-2 text-left transition hover:bg-blue-50/60 cursor-pointer"
      >
        <span className="inline-flex items-center gap-2 text-xs font-bold text-blue-600">
          <Sparkles className="h-3.5 w-3.5" />
          AI Suggested Reply
        </span>
        <span className="text-[10px] font-bold text-slate-500">{open ? "Tutup ▲" : "Buka ▼"}</span>
      </button>

      {open && (
        <div className="px-4 pb-3">
          {isLoading ? (
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span className="flex gap-1">
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-blue-600 [animation-delay:-0.2s]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-blue-600 [animation-delay:-0.1s]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-blue-600" />
              </span>
              AI sedang menyiapkan balasan...
            </div>
          ) : (
            <p className="text-xs leading-relaxed text-slate-800 font-medium">{suggestionText}</p>
          )}
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            <Button
              type="button"
              size="sm"
              variant="primary"
              onClick={() => onUseSuggestion(suggestionText)}
              className="text-[11px] h-7 px-2.5"
            >
              Gunakan
            </Button>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={() => onSuggestionVariantChange("short")}
              className="text-[11px] h-7 px-2.5"
            >
              Singkat
            </Button>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={() => onSuggestionVariantChange("warm")}
              className="text-[11px] h-7 px-2.5"
            >
              Ramah
            </Button>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={() => {
                onSuggestionVariantChange("default");
                onSuggestionVersionChange((c) => c + 1);
              }}
              className="text-[11px] h-7 px-2.5"
            >
              Ulangi
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
