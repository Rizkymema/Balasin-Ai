import { useEffect } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase-client";
import type { ConversationRecord, DashboardOperationsData } from "@/types/operations";

export function useRealtimeInbox({
  patchData,
  onNewMessage,
}: {
  patchData: (updater: (current: DashboardOperationsData) => DashboardOperationsData) => void;
  onNewMessage?: (conversationName: string, textSnippet: string) => void;
}) {
  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    const channel = supabase
      .channel("public:conversations")
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
            patchData((current) => ({
              ...current,
              conversations: current.conversations.filter((c) => c.id !== deletedId),
            }));
            return;
          }

          if (payload.eventType === "INSERT" || payload.eventType === "UPDATE") {
            const rowData = payload.new as { data_json: any; id: string };
            const conversation =
              typeof rowData.data_json === "string"
                ? (JSON.parse(rowData.data_json) as ConversationRecord)
                : (rowData.data_json as ConversationRecord);

            patchData((current) => {
              const existingIndex = current.conversations.findIndex(
                (c) => c.id === conversation.id
              );

              // Check if unreadCount increased for notification
              if (onNewMessage) {
                const isNewInsert = existingIndex === -1;
                const previousUnread = isNewInsert ? 0 : current.conversations[existingIndex].unreadCount;
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
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [patchData, onNewMessage]);
}
