"use client";

import { useEffect, useState, useMemo } from "react";
import { PlusCircle, Loader2 } from "lucide-react";
import { useDashboardConfig } from "@/hooks/use-dashboard-config";
import type { ConversationFlow } from "@/types/dashboard-config";
import { Button } from "@/components/ui/button";

import {
  BotResponseQuotaCard,
  ConversationSearchBar,
  ConversationTable,
  EmptyConversationState,
} from "./components/conversation-components";
import { CreateConversationModal } from "./components/create-conversation-modal";
import { DeleteConversationModal } from "./components/delete-conversation-modal";

export default function AutomationPage() {
  const { config, patchConfig, isLoading } = useDashboardConfig();

  const [conversations, setConversations] = useState<ConversationFlow[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingFlow, setEditingFlow] = useState<ConversationFlow | null>(null);
  const [deletingFlow, setDeletingFlow] = useState<ConversationFlow | null>(null);

  useEffect(() => {
    if (!config) return;
    setConversations(config.automation.conversations || []);
  }, [config]);

  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) return conversations;
    const query = searchQuery.toLowerCase();
    return conversations.filter(
      (flow) =>
        flow.name.toLowerCase().includes(query) ||
        flow.channel.toLowerCase().includes(query) ||
        flow.status.toLowerCase().includes(query)
    );
  }, [conversations, searchQuery]);

  const handleSaveConversation = (flowData: Omit<ConversationFlow, "id" | "botResponse" | "lastUpdate">) => {
    const now = new Date().toLocaleString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).replace(/\./g, ":");

    let nextConversations: ConversationFlow[];

    if (editingFlow) {
      nextConversations = conversations.map((f) =>
        f.id === editingFlow.id ? { ...f, ...flowData, lastUpdate: now } : f
      );
    } else {
      const newFlow: ConversationFlow = {
        ...flowData,
        id: "conv_" + Date.now(),
        botResponse: 0,
        lastUpdate: now,
      };
      nextConversations = [newFlow, ...conversations];
    }

    setConversations(nextConversations);
    patchConfig((current) => ({
      ...current,
      automation: {
        ...current.automation,
        conversations: nextConversations,
      },
    }));

    setIsCreateModalOpen(false);
    setEditingFlow(null);
  };

  const handleDuplicate = (flow: ConversationFlow) => {
    const now = new Date().toLocaleString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).replace(/\./g, ":");

    const duplicatedFlow: ConversationFlow = {
      ...flow,
      id: "conv_" + Date.now(),
      name: `${flow.name} Copy`,
      botResponse: 0,
      lastUpdate: now,
      status: "Draft",
    };

    const nextConversations = [duplicatedFlow, ...conversations];
    setConversations(nextConversations);
    patchConfig((current) => ({
      ...current,
      automation: { ...current.automation, conversations: nextConversations },
    }));
  };

  const handleToggleStatus = (flow: ConversationFlow) => {
    const newStatus = flow.status === "Inactive" || flow.status === "Draft" ? "Published" : "Inactive";
    const nextConversations = conversations.map((f) =>
      f.id === flow.id ? { ...f, status: newStatus } : f
    );
    setConversations(nextConversations);
    patchConfig((current) => ({
      ...current,
      automation: { ...current.automation, conversations: nextConversations },
    }));
  };

  const confirmDelete = () => {
    if (!deletingFlow) return;
    const nextConversations = conversations.filter((f) => f.id !== deletingFlow.id);
    setConversations(nextConversations);
    patchConfig((current) => ({
      ...current,
      automation: { ...current.automation, conversations: nextConversations },
    }));
    setDeletingFlow(null);
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--color-brand)]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-heading text-white">Conversations</h1>
          <p className="text-sm text-slate-400 mt-1">
            Kelola alur percakapan otomatis untuk merespons pelanggan secara instan berdasarkan trigger, channel, dan kondisi tertentu.
          </p>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)} className="gap-2 shrink-0">
          <PlusCircle className="h-4 w-4" />
          Create Conversation
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <BotResponseQuotaCard quota={config?.aiProvider?.quotaLimit ?? 999999996} />
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <ConversationSearchBar value={searchQuery} onChange={setSearchQuery} />
        </div>

        {conversations.length === 0 ? (
          <EmptyConversationState onCreate={() => setIsCreateModalOpen(true)} />
        ) : (
          <>
            <ConversationTable
              conversations={filteredConversations}
              onEdit={(flow) => {
                setEditingFlow(flow);
                setIsCreateModalOpen(true);
              }}
              onDuplicate={handleDuplicate}
              onToggleStatus={handleToggleStatus}
              onDelete={(flow) => setDeletingFlow(flow)}
            />

            {/* Pagination Placeholder */}
            <div className="flex items-center justify-between border-t border-[var(--color-border)] pt-4">
              <span className="text-xs text-slate-500">Menampilkan {filteredConversations.length} dari {conversations.length} conversations</span>
              <div className="flex items-center gap-2">
                <Button variant="secondary" disabled className="px-3 py-1.5 text-xs bg-transparent border-white/10 text-slate-400">Previous</Button>
                <Button variant="secondary" disabled className="px-3 py-1.5 text-xs bg-transparent border-white/10 text-slate-400">Next</Button>
              </div>
            </div>
          </>
        )}
      </div>

      {isCreateModalOpen && (
        <CreateConversationModal
          initialData={editingFlow ?? undefined}
          onClose={() => {
            setIsCreateModalOpen(false);
            setEditingFlow(null);
          }}
          onSave={handleSaveConversation}
        />
      )}

      {deletingFlow && (
        <DeleteConversationModal
          conversationName={deletingFlow.name}
          onClose={() => setDeletingFlow(null)}
          onConfirm={confirmDelete}
        />
      )}
    </div>
  );
}
