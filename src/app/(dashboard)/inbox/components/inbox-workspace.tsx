"use client";

import { useDeferredValue, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Bot, Database, MessageSquare, PanelRight, RefreshCcw, Settings2, Sparkles, X, Trash2 } from "lucide-react";

import {
  inferOutboundMediaKind,
  OUTBOUND_MEDIA_MAX_BYTES,
} from "@/constants/media";
import { Toast } from "@/components/ui/toast";
import { useDashboardConfig } from "@/hooks/use-dashboard-config";
import { useDashboardOperations } from "@/hooks/use-dashboard-operations";
import { useRealtimeInbox } from "@/hooks/use-realtime-inbox";
import { cn } from "@/lib/utils";
import type { ConversationRecord, ConversationStatus } from "@/types/operations";

import { ConversationListPanel } from "./conversation-list-panel";
import { ConversationThreadPanel } from "./conversation-thread-panel";
import { CustomerContextPanel } from "./customer-context-panel";
import { InboxLayoutSkeleton } from "./inbox-layout-skeleton";
import { InboxSidebar } from "./inbox-sidebar";
import {
  type InboxFilterState,
  type InboxSortId,
  deriveInboxSummary,
  filterInboxConversations,
  getAssignmentOptions,
  getConversationContext,
  getConversationWhatsAppAccountKey,
  getInboxWhatsAppAccountOptions,
} from "./inbox-view-model";

type ToastState = {
  message: string;
  type: "info" | "success" | "error";
} | null;

type PendingReplyAttachment = {
  file: File;
  kind: "image" | "video";
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  previewUrl: string;
};

function supportsMediaAttachments(channel?: ConversationRecord["channel"] | null) {
  return (
    channel === "WhatsApp" ||
    channel === "Website Chat" ||
    channel === "Instagram DM"
  );
}

export function InboxWorkspace() {
  const { config } = useDashboardConfig();
  const { data, isLoading, refreshData, applyLocalPatch } = useDashboardOperations();

  const [selectedId, setSelectedId] = useState("");
  const [mobileView, setMobileView] = useState<"list" | "detail" | "context">(
    "list",
  );
  const [showContextPanel, setShowContextPanel] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [noteDraft, setNoteDraft] = useState("");
  const [noteSaved, setNoteSaved] = useState(false);
  const [composerMode, setComposerMode] = useState<"reply" | "note">("reply");
  const [suggestionVariant, setSuggestionVariant] = useState<
    "default" | "short" | "warm"
  >("default");
  const [suggestionVersion, setSuggestionVersion] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isReplyTyping, setIsReplyTyping] = useState(false);
  const [replyAttachment, setReplyAttachment] = useState<PendingReplyAttachment | null>(null);
  const [toast, setToast] = useState<ToastState>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showSearchInList, setShowSearchInList] = useState(false);
  const [filters, setFilters] = useState<InboxFilterState>({
    quickFilter: "all",
    channel: "all",
    whatsappAccount: "all",
    status: "all",
    assignment: "all",
    search: "",
    sortBy: "latest",
  });

  const deferredSearch = useDeferredValue(filters.search);
  const filtersWithDeferredSearch = useMemo(
    () => ({ ...filters, search: deferredSearch }),
    [deferredSearch, filters],
  );

  const assignmentOptions = useMemo(
    () => getAssignmentOptions(data.conversations),
    [data.conversations],
  );
  const channelOptions = useMemo(
    () =>
      ["all", ...new Set(data.conversations.map((conversation) => conversation.channel))] as
        Array<"all" | ConversationRecord["channel"]>,
    [data.conversations],
  );
  const whatsappAccountOptions = useMemo(
    () => getInboxWhatsAppAccountOptions(config, data.conversations),
    [config, data.conversations],
  );

  const activeAiAgent = useMemo(
    () => config.automation?.aiAgents?.find((a) => a.status === "Active") ?? null,
    [config.automation?.aiAgents]
  );
  const aiAgentName = activeAiAgent ? activeAiAgent.name : config.aiAgent.name;
  const aiAutoReply = activeAiAgent ? activeAiAgent.allowedActions.replyMessage : config.aiAgent.autoReplyEnabled;

  const summary = useMemo(
    () => deriveInboxSummary(data.conversations, aiAgentName),
    [aiAgentName, data.conversations],
  );
  const filteredConversations = useMemo(
    () =>
      filterInboxConversations(
        data.conversations,
        filtersWithDeferredSearch,
        aiAgentName,
      ),
    [aiAgentName, data.conversations, filtersWithDeferredSearch],
  );

  const activeConversation =
    filteredConversations.find((conversation) => conversation.id === selectedId) ??
    null;
  const activeContext = activeConversation
    ? getConversationContext(data, activeConversation)
    : null;
  const activeConversationWhatsAppAccount = activeConversation
    ? whatsappAccountOptions.find(
        (option) =>
          option.value ===
          getConversationWhatsAppAccountKey(activeConversation),
      )
    : null;

  useRealtimeInbox({
    applyLocalPatch,
    refreshData,
    onNewMessage: (name, text) => {
      setToast({
        message: `Pesan baru dari ${name}: ${text}`,
        type: "info",
      });
      playNotificationSound();
    },
  });

  useEffect(() => {
    const conversationId = new URLSearchParams(window.location.search).get(
      "conversation",
    );
    if (conversationId) {
      setSelectedId(conversationId);
      setMobileView("detail");
    }
  }, []);

  useEffect(() => {
    if (
      selectedId &&
      filteredConversations.length > 0 &&
      !filteredConversations.some((conversation) => conversation.id === selectedId)
    ) {
      setSelectedId("");
    }
  }, [filteredConversations, selectedId]);

  useEffect(() => {
    setNoteDraft(activeConversation?.notes ?? "");
    setReplyText("");
    setReplyAttachment((current) => {
      if (current?.previewUrl) {
        URL.revokeObjectURL(current.previewUrl);
      }

      return null;
    });
    setSuggestionVariant("default");
    setSuggestionVersion(0);
  }, [activeConversation?.id, activeConversation?.notes]);

  useEffect(() => {
    return () => {
      if (replyAttachment?.previewUrl) {
        URL.revokeObjectURL(replyAttachment.previewUrl);
      }
    };
  }, [replyAttachment]);

  useEffect(() => {
    if (!activeConversation?.id || activeConversation.unreadCount === 0) {
      return;
    }

    void fetch(`/api/inbox/conversations/${activeConversation.id}/seen`, {
      method: "POST",
      credentials: "include",
    }).then(() => refreshData());
  }, [activeConversation?.id, activeConversation?.unreadCount, refreshData]);

  useEffect(() => {
    if (!toast) {
      return;
    }

    const timeoutId = window.setTimeout(() => setToast(null), 2800);
    return () => window.clearTimeout(timeoutId);
  }, [toast]);

  useEffect(() => {
    if (!noteSaved) {
      return;
    }

    const timeoutId = window.setTimeout(() => setNoteSaved(false), 2200);
    return () => window.clearTimeout(timeoutId);
  }, [noteSaved]);

  const setFilterValue = <Key extends keyof InboxFilterState>(
    key: Key,
    value: InboxFilterState[Key],
  ) => {
    setFilters((current) => ({ ...current, [key]: value }));
  };

  const handleChannelFilterChange = (
    value: "all" | ConversationRecord["channel"],
  ) => {
    setFilters((current) => ({
      ...current,
      channel: value,
      whatsappAccount:
        value === "WhatsApp" ? current.whatsappAccount : "all",
    }));
  };

  const handleWhatsAppAccountFilterChange = (
    value: InboxFilterState["whatsappAccount"],
  ) => {
    setFilters((current) => ({
      ...current,
      channel: "WhatsApp",
      whatsappAccount: value,
    }));
  };

  const runConversationAction = async (
    path: string,
    init: RequestInit,
    options?: {
      successMessage?: string;
      errorMessage?: string;
    },
  ) => {
    setIsSubmitting(true);
    const shouldUseJsonContentType =
      typeof FormData === "undefined" || !(init.body instanceof FormData);

    try {
      const response = await fetch(path, {
        ...init,
        credentials: "include",
        headers: {
          ...(shouldUseJsonContentType ? { "Content-Type": "application/json" } : {}),
          ...(init.headers ?? {}),
        },
      });

      if (!response.ok) {
        const payload = (await response.json()) as { error?: string };
        throw new Error(
          payload.error ??
            options?.errorMessage ??
            "Aksi inbox gagal dijalankan.",
        );
      }

      await refreshData();

      if (options?.successMessage) {
        setToast({ message: options.successMessage, type: "success" });
      }
    } catch (error) {
      setToast({
        message:
          error instanceof Error
            ? error.message
            : options?.errorMessage ?? "Aksi inbox gagal dijalankan.",
        type: "error",
      });
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateSentiment = async (sentiment: "positive" | "neutral" | "negative") => {
    if (!activeConversation) return;

    await runConversationAction(
      `/api/inbox/conversations/${activeConversation.id}/sentiment`,
      {
        method: "POST",
        body: JSON.stringify({ sentiment }),
      },
      {
        successMessage: "Sentimen diperbarui & AI dilatih!",
        errorMessage: "Gagal melatih sentimen AI.",
      },
    );
  };

  const handleSendSticker = async (stickerUrl: string) => {
    if (!activeConversation) return;

    await runConversationAction(
      `/api/inbox/conversations/${activeConversation.id}/reply`,
      {
        method: "POST",
        body: JSON.stringify({ stickerUrl }),
      },
      {
        successMessage: "Stiker berhasil dikirim!",
        errorMessage: "Gagal mengirim stiker.",
      },
    );
  };

  const handleSendReply = async () => {
    if (!activeConversation || (!replyText.trim() && !replyAttachment)) {
      return;
    }

    const nextReply = replyText.trim();
    const nextAttachment = replyAttachment;
    setReplyText("");
    try {
      await runConversationAction(
        `/api/inbox/conversations/${activeConversation.id}/reply`,
        {
          method: "POST",
          body: nextAttachment
            ? (() => {
                const formData = new FormData();
                if (nextReply) {
                  formData.set("message", nextReply);
                }
                formData.set("file", nextAttachment.file);
                return formData;
              })()
            : JSON.stringify({ message: nextReply }),
          headers: nextAttachment ? undefined : { "Content-Type": "application/json" },
        },
        {
          successMessage: nextAttachment
            ? "Media berhasil dikirim."
            : "Balasan berhasil dikirim.",
        },
      );
      handleReplyAttachmentSelect(null);
    } catch {
      setReplyText(nextReply);
      if (nextAttachment) {
        setReplyAttachment(nextAttachment);
      }
    }
  };

  const handleReplyAttachmentSelect = (file: File | null) => {
    if (!file) {
      setReplyAttachment((current) => {
        if (current?.previewUrl) {
          URL.revokeObjectURL(current.previewUrl);
        }

        return null;
      });
      return;
    }

    const kind = inferOutboundMediaKind(file.type);
    if (!kind) {
      setToast({
        message: "File harus berupa gambar atau video.",
        type: "error",
      });
      return;
    }

    if (file.size > OUTBOUND_MEDIA_MAX_BYTES) {
      setToast({
        message: "Ukuran file media terlalu besar untuk dikirim.",
        type: "error",
      });
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    setReplyAttachment((current) => {
      if (current?.previewUrl) {
        URL.revokeObjectURL(current.previewUrl);
      }

      return {
        file,
        kind,
        fileName: file.name,
        mimeType: file.type,
        sizeBytes: file.size,
        previewUrl,
      };
    });
  };

  const handleStatusUpdate = async (
    nextStatus: ConversationStatus,
    successMessage: string,
  ) => {
    if (!activeConversation) {
      return;
    }

    await runConversationAction(
      `/api/inbox/conversations/${activeConversation.id}/status`,
      {
        method: "POST",
        body: JSON.stringify({ status: nextStatus }),
      },
      { successMessage },
    );
  };

  const handleSaveNote = async () => {
    if (!activeConversation) {
      return;
    }

    await runConversationAction(
      `/api/inbox/conversations/${activeConversation.id}/notes`,
      {
        method: "PUT",
        body: JSON.stringify({ notes: noteDraft }),
      },
      { successMessage: "Catatan internal berhasil disimpan." },
    );

    setNoteSaved(true);
  };

  const handleCreateTicket = async () => {
    if (!activeConversation) {
      return;
    }

    await runConversationAction(
      `/api/inbox/conversations/${activeConversation.id}/ticket`,
      {
        method: "POST",
        body: JSON.stringify({}),
      },
      { successMessage: "Ticket handoff berhasil dibuat." },
    );
  };

  const handleDeleteConversation = () => {
    if (!activeConversation) {
      return;
    }
    setShowDeleteModal(true);
  };

  const confirmDeleteConversation = async () => {
    if (!activeConversation) {
      return;
    }
    setShowDeleteModal(false);

    await runConversationAction(
      `/api/inbox/conversations/${activeConversation.id}`,
      {
        method: "DELETE",
      },
      { successMessage: "Percakapan berhasil dihapus." },
    );
  };

  if (isLoading) {
    return <InboxLayoutSkeleton />;
  }

  return (
    <div className="flex flex-col h-full min-h-0 gap-3">

      <div className="flex flex-1 min-h-0 flex-row gap-3">

      <InboxSidebar
        quickFilter={filters.quickFilter}
        onQuickFilterChange={(value) => setFilterValue("quickFilter", value)}
        summary={summary}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        onSearchClick={() => setShowSearchInList(!showSearchInList)}
      />

      {data.conversations.length === 0 ? (
        <section className="flex min-h-0 flex-1 rounded-xl border border-white/[0.06] bg-[#0a0e1c] p-6">
          <div className="min-h-[36rem] flex-1 lg:min-h-0">
            <div className="flex h-full min-h-[36rem] items-center justify-center rounded-xl border border-dashed border-white/[0.08] bg-white/[0.02] lg:min-h-0">
              <div className="max-w-md text-center">
                <MessageSquare className="mx-auto h-10 w-10 text-[#00d2ff]" />
                <h2 className="mt-4 text-xl font-semibold text-slate-200">
                  Inbox masih kosong
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Belum ada percakapan masuk. Hubungkan channel atau kirim test
                  inbound dari halaman Channels agar chat mulai masuk ke unified
                  inbox.
                </p>
              </div>
            </div>
          </div>
        </section>
      ) : (
        <div className="flex-1 min-h-0 flex gap-3 lg:overflow-hidden">
          <div
            className={cn(
              mobileView === "list" ? "block" : "hidden lg:block",
              "shrink-0 min-h-0 lg:overflow-hidden w-[20rem] h-full"
            )}
          >
            <ConversationListPanel
              conversations={filteredConversations}
              selectedId={activeConversation?.id ?? ""}
              searchQuery={filters.search}
              onSearchChange={(value) => setFilterValue("search", value)}
              showSearchInput={showSearchInList}
              quickFilter={filters.quickFilter}
              onQuickFilterChange={(value) =>
                setFilterValue("quickFilter", value)
              }
              channelFilter={filters.channel}
              onChannelFilterChange={handleChannelFilterChange}
              channelOptions={channelOptions}
              whatsappAccountFilter={filters.whatsappAccount}
              onWhatsAppAccountFilterChange={handleWhatsAppAccountFilterChange}
              whatsappAccountOptions={whatsappAccountOptions}
              statusFilter={filters.status}
              onStatusFilterChange={(value) => setFilterValue("status", value)}
              assignmentFilter={filters.assignment}
              onAssignmentFilterChange={(value) =>
                setFilterValue("assignment", value)
              }
              assignmentOptions={assignmentOptions}
              sortBy={filters.sortBy}
              onSortChange={(value) =>
                setFilterValue("sortBy", value as InboxSortId)
              }
              summary={summary}
              onSelectConversation={(conversationId) => {
                setSelectedId(conversationId);
                setMobileView("detail");
              }}
              onRefresh={() => void refreshData()}
              businessName={config.workspace.name}
            />
          </div>

          <div
            className={cn(
              mobileView === "detail" || mobileView === "context" ? "block" : "hidden lg:block",
              "flex-1 min-h-0 min-w-0 h-full"
            )}
          >
            <div className="flex h-full w-full min-w-0 gap-3">
              <div className="flex-1 min-w-0 h-full">
                <ConversationThreadPanel
                  conversation={activeConversation}
                  config={config}
                  whatsappAccountLabel={
                    activeConversationWhatsAppAccount?.label
                  }
                  replyText={replyText}
                  onReplyTextChange={setReplyText}
                  replyAttachment={replyAttachment}
                  onReplyAttachmentSelect={handleReplyAttachmentSelect}
                  onReplyAttachmentRemove={() => handleReplyAttachmentSelect(null)}
                  noteDraft={noteDraft}
                  onNoteDraftChange={setNoteDraft}
                  composerMode={composerMode}
                  onComposerModeChange={setComposerMode}
                  suggestionVariant={suggestionVariant}
                  suggestionVersion={suggestionVersion}
                  onSuggestionVariantChange={setSuggestionVariant}
                  onSuggestionVersionChange={(updater) =>
                    setSuggestionVersion((current) => updater(current))
                  }
                  onUseSuggestion={setReplyText}
                  onSendReply={() => void handleSendReply()}
                  onSaveNote={() => void handleSaveNote()}
                  onCreateTicket={() => void handleCreateTicket()}
                  onSendSticker={handleSendSticker}
                  onTakeOver={() =>
                    void handleStatusUpdate(
                      "assigned_to_admin",
                      `Percakapan berhasil diambil alih ${config.automation?.aiConfig?.handoverTarget || "admin"}.`,
                    )
                  }
                  onPauseAi={() =>
                    void handleStatusUpdate("ai_paused", "AI berhasil dipause.")
                  }
                  onActivateAi={() =>
                    void handleStatusUpdate(
                      "ai_active",
                      "AI berhasil diaktifkan kembali.",
                    )
                  }
                  onResolve={() =>
                    void handleStatusUpdate(
                      "resolved",
                      "Percakapan berhasil ditandai selesai.",
                    )
                  }
                  onDeleteConversation={() => void handleDeleteConversation()}
                  isSubmitting={isSubmitting}
                  isReplyTyping={isReplyTyping}
                  allowMediaAttachments={supportsMediaAttachments(activeConversation?.channel)}
                  noteSaved={noteSaved}
                  showContextPanel={showContextPanel}
                  onToggleContextPanel={() => {
                    setShowContextPanel((current) => !current);
                    setMobileView((current) =>
                      current === "context" ? "detail" : "context",
                    );
                  }}
                  onBackToList={() => setMobileView("list")}
                />
              </div>

              {activeConversation && (
                <div
                  className={cn(
                    showContextPanel || mobileView === "context"
                      ? "block shrink-0 h-full w-[16rem]"
                      : "hidden"
                  )}
                >
                  <CustomerContextPanel
                    conversation={activeConversation}
                    context={activeContext}
                    onCreateTicket={() => void handleCreateTicket()}
                    onUpdateSentiment={handleUpdateSentiment}
                    hiddenOnDesktop={!showContextPanel}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {toast ? (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      ) : null}

      {showDeleteModal && activeConversation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm transition-opacity duration-300 p-4">
          <div className="relative w-full max-w-sm transform overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0c101f] p-6 text-left align-middle shadow-2xl transition-all">
            <button
              onClick={() => setShowDeleteModal(false)}
              className="absolute right-4 top-4 rounded-lg p-1 text-slate-400 hover:bg-white/[0.05] hover:text-white transition"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex flex-col items-center text-center mt-2">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10 text-red-500 border border-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.1)]">
                <Trash2 className="h-6 w-6" />
              </div>
              
              <h3 className="text-lg font-bold leading-6 text-slate-100">
                Hapus Percakapan?
              </h3>
              
              <p className="mt-3 text-sm leading-relaxed text-slate-400">
                Apakah Anda yakin ingin menghapus chat dengan{" "}
                <span className="font-semibold text-red-400 bg-red-500/5 border border-red-500/10 px-1.5 py-0.5 rounded">
                  {activeConversation.name}
                </span>{" "}
                dari dashboard inbox? Tindakan ini tidak dapat dibatalkan.
              </p>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 rounded-xl border border-white/[0.08] bg-white/[0.02] px-4 py-2 text-sm font-semibold text-slate-300 hover:bg-white/[0.05] hover:text-white transition active:scale-95"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => void confirmDeleteConversation()}
                className="flex-1 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-500 shadow-[0_4px_12px_rgba(239,68,68,0.2)] hover:shadow-[0_6px_16px_rgba(239,68,68,0.35)] transition active:scale-95"
              >
                Hapus Chat
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}

function playNotificationSound() {
  if (typeof window === "undefined") return;
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();
    
    osc.type = "sine";
    osc.frequency.setValueAtTime(587.33, audioContext.currentTime); // D5 note
    osc.frequency.setValueAtTime(880, audioContext.currentTime + 0.1); // A5 note
    
    gain.gain.setValueAtTime(0.15, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.35);
    
    osc.connect(gain);
    gain.connect(audioContext.destination);
    
    osc.start();
    osc.stop(audioContext.currentTime + 0.35);
  } catch (e) {
    console.error("Gagal memutar bunyi notifikasi:", e);
  }
}
