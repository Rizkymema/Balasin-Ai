import { useEffect } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase-client";
import type { ConversationRecord, DashboardOperationsData } from "@/types/operations";

export function useRealtimeInbox({
  applyLocalPatch,
  refreshData,
  onNewMessage,
  pollIntervalMs = 5000,
}: {
  applyLocalPatch: (
    updater: (current: DashboardOperationsData) => DashboardOperationsData,
  ) => void;
  refreshData: () => Promise<void>;
  onNewMessage?: (conversationName: string, textSnippet: string) => void;
  pollIntervalMs?: number;
}) {
  useEffect(() => {
    let refreshTimer: number | null = null;

    const scheduleRefresh = (delayMs = 400) => {
      if (refreshTimer) {
        clearTimeout(refreshTimer);
      }

      refreshTimer = window.setTimeout(() => {
        refreshTimer = null;
        void refreshData();
      }, delayMs);
    };

    const handleVisibilitySync = () => {
      if (document.visibilityState === "visible") {
        scheduleRefresh(0);
      }
    };

    const handleFocusSync = () => {
      scheduleRefresh(0);
    };

    window.addEventListener("focus", handleFocusSync);
    document.addEventListener("visibilitychange", handleVisibilitySync);

    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      const intervalId = window.setInterval(() => {
        if (document.visibilityState === "visible") {
          void refreshData();
        }
      }, pollIntervalMs);

      return () => {
        window.clearInterval(intervalId);
        window.removeEventListener("focus", handleFocusSync);
        document.removeEventListener("visibilitychange", handleVisibilitySync);
        if (refreshTimer) {
          clearTimeout(refreshTimer);
        }
      };
    }

    const channel = supabase
      .channel("public:inbox-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "conversations",
        },
        (payload) => {
          if (payload.eventType === "DELETE") {
            const deletedId = payload.old.id;
            applyLocalPatch((current) => ({
              ...current,
              conversations: current.conversations.filter((c) => c.id !== deletedId),
            }));
            scheduleRefresh();
            return;
          }

          if (payload.eventType === "INSERT" || payload.eventType === "UPDATE") {
            const rowData = payload.new as { data_json: any; id: string };
            const conversation =
              typeof rowData.data_json === "string"
                ? (JSON.parse(rowData.data_json) as ConversationRecord)
                : (rowData.data_json as ConversationRecord);

            applyLocalPatch((current) => {
              const existingIndex = current.conversations.findIndex(
                (c) => c.id === conversation.id
              );

              // Check if unreadCount increased for notification
              if (onNewMessage) {
                const isNewInsert = existingIndex === -1;
                const previousUnread = isNewInsert
                  ? 0
                  : current.conversations[existingIndex].unreadCount;
                if (conversation.unreadCount > previousUnread) {
                  onNewMessage(conversation.name, conversation.lastMessage || "New message");
                }
              }

              const nextConversations = [...current.conversations];
              if (existingIndex >= 0) {
                nextConversations[existingIndex] = conversation;
              } else {
                nextConversations.unshift(conversation); // Add new at top
              }

              return {
                ...current,
                conversations: nextConversations,
              };
            });
            scheduleRefresh();
          }
        },
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "customers",
        },
        () => {
          scheduleRefresh();
        },
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "tickets",
        },
        () => {
          scheduleRefresh();
        },
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "bookings",
        },
        () => {
          scheduleRefresh();
        },
      )
      .subscribe();

    return () => {
      window.removeEventListener("focus", handleFocusSync);
      document.removeEventListener("visibilitychange", handleVisibilitySync);
      if (refreshTimer) {
        clearTimeout(refreshTimer);
      }
      supabase.removeChannel(channel);
    };
  }, [applyLocalPatch, onNewMessage, pollIntervalMs, refreshData]);
}
