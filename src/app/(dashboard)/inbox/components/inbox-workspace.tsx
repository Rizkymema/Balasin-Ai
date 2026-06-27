"use client";

import { useDeferredValue, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Bot, Database, MessageSquare, PanelRight, RefreshCcw, Settings2, Sparkles, X } from "lucide-react";


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
} from "./inbox-view-model";

type ToastState = {
  message: string;
  type: "info" | "success" | "error";
} | null;

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
  const [toast, setToast] = useState<ToastState>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showSearchInList, setShowSearchInList] = useState(false);
  const [filters, setFilters] = useState<InboxFilterState>({
    quickFilter: "all",
    channel: "all",
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
  const summary = useMemo(
    () => deriveInboxSummary(data.conversations, config.aiAgent.name),
    [config.aiAgent.name, data.conversations],
  );
  const filteredConversations = useMemo(
    () =>
      filterInboxConversations(
        data.conversations,
        filtersWithDeferredSearch,
        config.aiAgent.name,
      ),
    [config.aiAgent.name, data.conversations, filtersWithDeferredSearch],
  );

  const activeConversation =
    filteredConversations.find((conversation) => conversation.id === selectedId) ??
    null;
  const activeContext = activeConversation
    ? getConversationContext(data, activeConversation)
    : null;

  useRealtimeInbox({
    applyLocalPatch,
    refreshData,
    onNewMessage: (name, text) => {
      setToast({
        message: `Pesan baru dari ${name}: ${text}`,
        type: "info",
      });
    },
  });

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
    setSuggestionVariant("default");
    setSuggestionVersion(0);
  }, [activeConversation?.id, activeConversation?.notes]);

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

  const runConversationAction = async (
    path: string,
    init: RequestInit,
    options?: {
      successMessage?: string;
      errorMessage?: string;
    },
  ) => {
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

  const handleSendReply = async () => {
    if (!activeConversation || !replyText.trim()) {
      return;
    }

    const nextReply = replyText.trim();
    setReplyText("");
    setIsReplyTyping(true);

    try {
      await Promise.all([
        runConversationAction(
          `/api/inbox/conversations/${activeConversation.id}/reply`,
          {
            method: "POST",
            body: JSON.stringify({ message: nextReply }),
          },
          { successMessage: "Balasan berhasil dikirim." },
        ),
        new Promise((resolve) => window.setTimeout(resolve, 650)),
      ]);
    } catch {
      setReplyText(nextReply);
    } finally {
      setIsReplyTyping(false);
    }
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

    await runConversationAction(
      `/api/inbox/conversations/${activeConversation.id}`,
      {
        method: "DELETE",
      },
      { successMessage: "Percakapan berhasil dihapus." },
    );
  };

  const [showAiBanner, setShowAiBanner] = useState(true);
  const kbDocCount = config.knowledgeBase.documents.length + config.knowledgeBase.websiteUrls.length;

  if (isLoading) {
    return <InboxLayoutSkeleton />;
  }

  return (
    <div className="flex flex-col h-full min-h-0 gap-3">
      {/* AI Status Connection Banner */}
      {showAiBanner && (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-cyan-500/15 bg-gradient-to-r from-cyan-950/20 via-[#080c18] to-[#080c18] px-4 py-2.5 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-cyan-400/20 bg-cyan-950/40">
              <Bot className="h-3.5 w-3.5 text-cyan-400" />
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px]">
              <span className="flex items-center gap-1.5">
                <span className={`h-1.5 w-1.5 rounded-full ${config.aiAgent.autoReplyEnabled ? "bg-emerald-400 animate-pulse" : "bg-amber-400"}`} />
                <span className="font-bold text-slate-200">{config.aiAgent.name}</span>
                <span className="text-slate-500">{config.aiAgent.autoReplyEnabled ? "· Auto Reply Aktif" : "· Auto Reply Nonaktif"}</span>
              </span>
              <span className="hidden md:flex items-center gap-1.5 text-slate-500">
                <Database className="h-3 w-3 text-cyan-400/70" />
                <span>{kbDocCount} sumber KB</span>
              </span>
              <span className="hidden lg:flex items-center gap-1.5 text-slate-500">
                <Sparkles className="h-3 w-3 text-purple-400/70" />
                <span>Threshold {config.aiAgent.confidenceThreshold}%</span>
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Link
              href="/automation/ai-agent"
              className="hidden sm:inline-flex items-center gap-1 rounded-md border border-cyan-500/20 bg-cyan-950/30 px-2.5 py-1 text-[10px] font-bold text-cyan-400 transition hover:bg-cyan-950/50"
            >
              <Bot className="h-3 w-3" />
              AI Agent
            </Link>
            <Link
              href="/automation/knowledge-base"
              className="hidden sm:inline-flex items-center gap-1 rounded-md border border-purple-500/20 bg-purple-950/30 px-2.5 py-1 text-[10px] font-bold text-purple-400 transition hover:bg-purple-950/50"
            >
              <Database className="h-3 w-3" />
              Knowledge Base
            </Link>
            <Link
              href="/automation/chatbot-settings"
              className="hidden md:inline-flex items-center gap-1 rounded-md border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[10px] font-bold text-slate-400 transition hover:bg-white/[0.08]"
            >
              <Settings2 className="h-3 w-3" />
              Settings
            </Link>
            <button
              type="button"
              onClick={() => setShowAiBanner(false)}
              className="ml-1 rounded-md p-1 text-slate-600 hover:text-slate-400 transition"
              title="Tutup"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

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
              onChannelFilterChange={(value) => setFilterValue("channel", value)}
              channelOptions={channelOptions}
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
                  replyText={replyText}
                  onReplyTextChange={setReplyText}
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
                  onTakeOver={() =>
                    void handleStatusUpdate(
                      "assigned_to_admin",
                      "Percakapan berhasil diambil alih admin.",
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
      </div>
    </div>
  );
}
