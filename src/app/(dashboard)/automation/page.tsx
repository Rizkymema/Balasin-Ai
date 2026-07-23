"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  CalendarCheck2,
  Loader2,
  PlusCircle,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { useDashboardConfig } from "@/hooks/use-dashboard-config";
import {
  BOOKING_SERVICE_TEMPLATE_NAME,
  createBookingServiceFlowTemplate,
  createSystemChatbotFlowTemplate,
  SYSTEM_CHATBOT_TEMPLATE_NAME,
} from "@/lib/conversation-flow-templates";
import type { ConversationFlow } from "@/types/dashboard-config";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import {
  BotResponseQuotaCard,
  ConversationSearchBar,
  ConversationTable,
  EmptyConversationState,
} from "./components/conversation-components";
import { CreateConversationModal } from "./components/create-conversation-modal";
import { DeleteConversationModal } from "./components/delete-conversation-modal";

function formatFlowLastUpdate() {
  return new Date()
    .toLocaleString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
    .replace(/\./g, ":");
}

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
  const [isCreatingTemplate, setIsCreatingTemplate] = useState(false);
  const [isCreatingSystemTemplate, setIsCreatingSystemTemplate] =
    useState(false);
  const [togglingFlowId, setTogglingFlowId] = useState<string | null>(null);

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

  const bookingTemplateFlow = conversations.find(
    (flow) => flow.name === BOOKING_SERVICE_TEMPLATE_NAME,
  );
  const systemTemplateFlow = conversations.find(
    (flow) => flow.name === SYSTEM_CHATBOT_TEMPLATE_NAME,
  );
  const activeAgent = config?.automation.aiAgents.find(
    (agent) => agent.status === "Active",
  );

  const handleUseSystemTemplate = async () => {
    if (systemTemplateFlow) {
      router.push(`/automation/conversations/${systemTemplateFlow.id}`);
      return;
    }

    if (!activeAgent) {
      alert(
        "Aktifkan minimal satu AI Agent sebelum membuat flow Chatbot Utama.",
      );
      return;
    }

    setIsCreatingSystemTemplate(true);
    const flow = createSystemChatbotFlowTemplate({
      flowId: `conv_system_chatbot_${Date.now()}`,
      lastUpdate: formatFlowLastUpdate(),
      agentId: activeAgent.id,
    });
    const nextConversations = [flow, ...conversations];

    try {
      setConversations(nextConversations);
      await patchConfig((current) => ({
        ...current,
        automation: {
          ...current.automation,
          conversations: nextConversations,
        },
      }));
      router.push(`/automation/conversations/${flow.id}`);
    } finally {
      setIsCreatingSystemTemplate(false);
    }
  };

  const handleUseBookingTemplate = async () => {
    if (bookingTemplateFlow) {
      router.push(`/automation/conversations/${bookingTemplateFlow.id}`);
      return;
    }

    setIsCreatingTemplate(true);
    const flow = createBookingServiceFlowTemplate({
      flowId: `conv_booking_service_${Date.now()}`,
      lastUpdate: formatFlowLastUpdate(),
    });
    const nextConversations = [flow, ...conversations];

    try {
      setConversations(nextConversations);
      await patchConfig((current) => ({
        ...current,
        automation: {
          ...current.automation,
          conversations: nextConversations,
        },
      }));
      router.push(`/automation/conversations/${flow.id}`);
    } finally {
      setIsCreatingTemplate(false);
    }
  };

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

  const handleToggleStatus = async (flow: ConversationFlow) => {
    if (flow.status === "Draft") {
      router.push(`/automation/conversations/${flow.id}`);
      return;
    }

    setTogglingFlowId(flow.id);
    try {
      const response = await fetch(`/api/automation/flows/${flow.id}/status`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: flow.status === "Inactive" }),
      });
      const payload = (await response.json()) as {
        data?: { flow?: ConversationFlow };
        error?: string;
      };
      if (!response.ok || !payload.data?.flow) {
        throw new Error(payload.error || "Status flow gagal diubah.");
      }
      setConversations((current) =>
        current.map((item) =>
          item.id === flow.id ? payload.data!.flow! : item,
        ),
      );
    } catch (error) {
      alert(
        error instanceof Error ? error.message : "Status flow gagal diubah.",
      );
    } finally {
      setTogglingFlowId(null);
    }
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
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Conversations
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            Kelola alur percakapan otomatis untuk merespons pelanggan secara instan berdasarkan trigger dan channel.
          </p>
        </div>
        <Button
          onClick={() => setIsCreateModalOpen(true)}
          variant="primary"
          className="shrink-0 gap-2"
        >
          <PlusCircle className="h-4 w-4" />
          Create Conversation
        </Button>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <section className="rounded-2xl border border-blue-200 bg-blue-50/40 p-5 shadow-2xs">
          <div className="flex h-full flex-col gap-4">
            <div className="flex min-w-0 flex-1 items-start gap-4">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white font-bold shadow-2xs">
                <ShieldCheck className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-bold text-slate-900">
                    Template Chatbot Utama
                  </p>
                  <Badge variant="default" className="text-[9px]">
                    RAG + Safety
                  </Badge>
                </div>
                <p className="mt-1 text-xs leading-relaxed text-slate-600">
                  Safety Gate, Knowledge Base, Custom Instructions, fallback aman, dan handoff admin dalam satu flow utama.
                </p>
              </div>
            </div>
            <Button
              type="button"
              variant="primary"
              onClick={() => void handleUseSystemTemplate()}
              disabled={
                isCreatingSystemTemplate ||
                (!systemTemplateFlow && !activeAgent)
              }
              className="w-full gap-2 text-xs"
            >
              {isCreatingSystemTemplate ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ShieldCheck className="h-4 w-4" />
              )}
              {systemTemplateFlow
                ? "Buka Template"
                : activeAgent
                  ? "Gunakan Template"
                  : "Aktifkan AI Agent Dahulu"}
            </Button>
          </div>
        </section>

        <section className="rounded-2xl border border-emerald-200 bg-emerald-50/40 p-5 shadow-2xs">
          <div className="flex h-full flex-col gap-4">
            <div className="flex min-w-0 flex-1 items-start gap-4">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white font-bold shadow-2xs">
                <CalendarCheck2 className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-bold text-slate-900">
                    Template Booking Service
                  </p>
                  <Badge variant="success" className="text-[9px]">
                    Ready to use
                  </Badge>
                </div>
                <p className="mt-1 text-xs leading-relaxed text-slate-600">
                  Trigger booking, cek jam operasional, form pelanggan, pilihan layanan serta konfirmasi admin.
                </p>
              </div>
            </div>
            <Button
              type="button"
              variant="secondary"
              onClick={() => void handleUseBookingTemplate()}
              disabled={isCreatingTemplate}
              className="w-full gap-2 text-xs bg-emerald-600 hover:bg-emerald-700 text-white border-transparent"
            >
              {isCreatingTemplate ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              {bookingTemplateFlow ? "Buka Template" : "Gunakan Template"}
            </Button>
          </div>
        </section>
      </div>

      {/* Info Tip regarding overlap between Conversation Flow & AI Agent */}
      <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-4 text-xs text-blue-900">
        <div className="flex items-start gap-3">
          <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-blue-600 text-white font-bold text-xs">
            i
          </div>
          <div>
            <p className="font-bold text-slate-900">
              Tips Integrasi Alur Percakapan & AI Agent
            </p>
            <p className="mt-0.5 leading-relaxed text-slate-600">
              Alur percakapan (Conversations) bekerja berdasarkan pemicu kata kunci tertentu. Jika Anda juga mengaktifkan <strong>AI Agent</strong> pada channel yang sama, Anda dapat memicu AI Agent secara otomatis dari dalam langkah alur percakapan.
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
              togglingFlowId={togglingFlowId}
              onDelete={(flow) => setDeletingFlow(flow)}
              onEditSettings={(flow) => {
                setEditingFlow(flow);
                setIsCreateModalOpen(true);
              }}
            />
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
