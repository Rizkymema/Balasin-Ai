"use client";

import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { MessageSquare, PanelRight, RefreshCcw } from "lucide-react";

import { Toast } from "@/components/ui/toast";
import { useDashboardConfig } from "@/hooks/use-dashboard-config";
import { useDashboardOperations } from "@/hooks/use-dashboard-operations";
import { cn } from "@/lib/utils";
import type { ConversationRecord, ConversationStatus } from "@/types/operations";

import { ConversationListPanel } from "./conversation-list-panel";
import { ConversationThreadPanel } from "./conversation-thread-panel";
import { CustomerContextPanel } from "./customer-context-panel";
import { InboxLayoutSkeleton } from "./inbox-layout-skeleton";
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
  const { data, isLoading, refreshData } = useDashboardOperations();

  const [selectedId, setSelectedId] = useState("");
  const [mobileView, setMobileView] = useState<"list" | "detail" | "context">(
    "list",
  );
  const [showContextPanel, setShowContextPanel] = useState(true);
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
    filteredConversations[0] ??
    null;
  const activeContext = activeConversation
    ? getConversationContext(data, activeConversation)
    : null;

  useEffect(() => {
    if (!selectedId && filteredConversations[0]?.id) {
      setSelectedId(filteredConversations[0].id);
    }
  }, [filteredConversations, selectedId]);

  useEffect(() => {
    if (
      selectedId &&
      filteredConversations.length > 0 &&
      !filteredConversations.some((conversation) => conversation.id === selectedId)
    ) {
      setSelectedId(filteredConversations[0].id);
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

  if (isLoading) {
    return <InboxLayoutSkeleton />;
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-3 lg:[--inbox-panel-height:calc(100dvh-12.5rem)]">
      {/* Top Header Bar */}
      <section className="shrink-0 rounded-xl border border-white/[0.06] bg-[#0a0e1c] px-4 py-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-semibold text-slate-100">Inbox</h1>
              <span className="rounded-full border border-white/[0.08] bg-white/[0.04] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                customer desk
              </span>
            </div>
            <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-slate-500">
              <span className="rounded-full bg-white/[0.06] px-3 py-1">
                Semua {summary.allCount}
              </span>
              <span className="rounded-full bg-white/[0.06] px-3 py-1">
                Belum dibaca {summary.unhandledCount}
              </span>
              <span className="rounded-full bg-white/[0.06] px-3 py-1">
                Butuh Admin {summary.needAdminCount}
              </span>
              <span className="rounded-full bg-white/[0.06] px-3 py-1">
                AI Aktif {summary.aiActiveCount}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void refreshData()}
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 text-sm font-semibold text-slate-200 transition hover:bg-white/[0.08]"
            >
              <RefreshCcw className="h-4 w-4" />
              Refresh
            </button>
            <button
              type="button"
              onClick={() => setShowContextPanel((current) => !current)}
              className="hidden h-10 items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 text-sm font-semibold text-slate-200 transition hover:bg-white/[0.08] lg:inline-flex"
            >
              <PanelRight className="h-4 w-4" />
              {showContextPanel ? "Tutup Detail" : "Lihat Detail"}
            </button>
          </div>
        </div>
      </section>

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
        <div
          className={cn(
            "grid min-h-0 flex-1 gap-3",
            "lg:grid-cols-[16rem_minmax(0,1fr)_15rem]",
          )}
        >
          <div className={mobileView === "list" ? "block min-h-0" : "hidden min-h-0 lg:block"}>
            <ConversationListPanel
              conversations={filteredConversations}
              selectedId={activeConversation?.id ?? ""}
              searchQuery={filters.search}
              onSearchChange={(value) => setFilterValue("search", value)}
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
            />
          </div>

          <div
            className={
              mobileView === "detail" ? "block min-h-0" : "hidden min-h-0 lg:block"
            }
          >
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

          <div
            className={
              showContextPanel || mobileView === "context"
                ? "block min-h-0"
                : "hidden min-h-0 lg:block"
            }
          >
            <CustomerContextPanel
              conversation={activeConversation}
              context={activeContext}
              onCreateTicket={() => void handleCreateTicket()}
              hiddenOnDesktop={!showContextPanel}
            />
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
  );
}
