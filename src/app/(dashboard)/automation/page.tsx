"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
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
  const router = useRouter();

  const [conversations, setConversations] = useState<ConversationFlow[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingFlow, setEditingFlow] = useState<ConversationFlow | null>(null);
  const [deletingFlow, setDeletingFlow] = useState<ConversationFlow | null>(
    null,
  );

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
        flow.status.toLowerCase().includes(query),
    );
  }, [conversations, searchQuery]);

  const handleSaveConversation = async (
    flowData: Omit<ConversationFlow, "id" | "botResponse" | "lastUpdate">,
  ) => {
    const now = new Date()
      .toLocaleString("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
      .replace(/\./g, ":");

    let nextConversations: ConversationFlow[];

    let savedFlowId: string;
    if (editingFlow) {
      savedFlowId = editingFlow.id;
      nextConversations = conversations.map((f) =>
        f.id === editingFlow.id
          ? { ...f, ...flowData, status: "Draft", lastUpdate: now }
          : f,
      );
    } else {
      const newFlow: ConversationFlow = {
        ...flowData,
        id: "conv_" + Date.now(),
        status: "Draft",
        botResponse: 0,
        lastUpdate: now,
      };
      savedFlowId = newFlow.id;
      nextConversations = [newFlow, ...conversations];
    }

    setConversations(nextConversations);
    await patchConfig((current) => ({
      ...current,
      automation: {
        ...current.automation,
        conversations: nextConversations,
      },
    }));

    setIsCreateModalOpen(false);
    setEditingFlow(null);
    router.push(`/automation/conversations/${savedFlowId}`);
  };

  const handleDuplicate = (flow: ConversationFlow) => {
    const now = new Date()
      .toLocaleString("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
      .replace(/\./g, ":");

    const duplicatedFlow: ConversationFlow = {
      ...flow,
      id: "conv_" + Date.now(),
      name: `${flow.name} Copy`,
      botResponse: 0,
      lastUpdate: now,
      status: "Draft",
      publishedGraph: undefined,
      publishedRevision: undefined,
      publishedAt: undefined,
      draftGraph: flow.draftGraph ?? flow.publishedGraph,
      draftRevision: 1,
      hasUnpublishedChanges: true,
    };

    const nextConversations = [duplicatedFlow, ...conversations];
    setConversations(nextConversations);
    patchConfig((current) => ({
      ...current,
      automation: { ...current.automation, conversations: nextConversations },
    }));
  };

  const handleToggleStatus = (flow: ConversationFlow) => {
    if (flow.status === "Draft") {
      router.push(`/automation/conversations/${flow.id}`);
      return;
    }

    const newStatus: ConversationFlow["status"] =
      flow.status === "Inactive" ? "Published" : "Inactive";
    const nextConversations = conversations.map((f) =>
      f.id === flow.id ? { ...f, status: newStatus } : f,
    );
    setConversations(nextConversations);
    patchConfig((current) => ({
      ...current,
      automation: { ...current.automation, conversations: nextConversations },
    }));
  };

  const confirmDelete = () => {
    if (!deletingFlow) return;
    const nextConversations = conversations.filter(
      (f) => f.id !== deletingFlow.id,
    );
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
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-heading text-2xl font-bold text-white">
            Conversations
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Kelola alur percakapan otomatis untuk merespons pelanggan secara
            instan berdasarkan trigger, channel, dan kondisi tertentu.
          </p>
        </div>
        <Button
          onClick={() => setIsCreateModalOpen(true)}
          className="shrink-0 gap-2"
        >
          <PlusCircle className="h-4 w-4" />
          Create Conversation
        </Button>
      </div>

      {/* Info Tip regarding overlap between Conversation Flow & AI Agent */}
      <div className="animate-fade-in rounded-xl border border-cyan-500/20 bg-cyan-950/10 p-4 text-xs text-cyan-200">
        <div className="flex items-start gap-3">
          <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-cyan-500/10 font-black text-cyan-400">
            i
          </div>
          <div>
            <p className="font-bold text-white">
              Tips Integrasi Alur Percakapan & AI Agent
            </p>
            <p className="mt-1 leading-relaxed text-cyan-200/80">
              Alur percakapan (Conversations) bekerja secara kaku berdasarkan
              pemicu/kata kunci tertentu. Jika Anda juga mengaktifkan{" "}
              <strong>AI Agent</strong> pada channel yang sama, pastikan alur di
              sini tidak bertabrakan dengan respon dinamis AI. Anda dapat memicu
              AI Agent secara otomatis dari dalam langkah alur percakapan.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <BotResponseQuotaCard
          quota={config?.aiProvider?.quotaLimit ?? 999999996}
        />
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <ConversationSearchBar
            value={searchQuery}
            onChange={setSearchQuery}
          />
        </div>

        {conversations.length === 0 ? (
          <EmptyConversationState onCreate={() => setIsCreateModalOpen(true)} />
        ) : (
          <>
            <ConversationTable
              conversations={filteredConversations}
              onEdit={(flow) =>
                router.push(`/automation/conversations/${flow.id}`)
              }
              onDuplicate={handleDuplicate}
              onToggleStatus={handleToggleStatus}
              onDelete={(flow) => setDeletingFlow(flow)}
            />

            {/* Pagination Placeholder */}
            <div className="flex items-center justify-between border-t border-[var(--color-border)] pt-4">
              <span className="text-xs text-slate-500">
                Menampilkan {filteredConversations.length} dari{" "}
                {conversations.length} conversations
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  disabled
                  className="border-white/10 bg-transparent px-3 py-1.5 text-xs text-slate-400"
                >
                  Previous
                </Button>
                <Button
                  variant="secondary"
                  disabled
                  className="border-white/10 bg-transparent px-3 py-1.5 text-xs text-slate-400"
                >
                  Next
                </Button>
              </div>
            </div>
          </>
        )}
      </div>

      {isCreateModalOpen && (
        <CreateConversationModal
          initialData={editingFlow ?? undefined}
          availableAgents={config?.automation.aiAgents ?? []}
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
