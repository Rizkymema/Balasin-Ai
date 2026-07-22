"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { CalendarCheck2, Loader2, PlusCircle, Sparkles } from "lucide-react";
import { useDashboardConfig } from "@/hooks/use-dashboard-config";
import {
  BOOKING_SERVICE_TEMPLATE_NAME,
  createBookingServiceFlowTemplate,
} from "@/lib/conversation-flow-templates";
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
  const [isCreatingTemplate, setIsCreatingTemplate] = useState(false);
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

  const handleUseBookingTemplate = async () => {
    if (bookingTemplateFlow) {
      router.push(`/automation/conversations/${bookingTemplateFlow.id}`);
      return;
    }

    setIsCreatingTemplate(true);
    const lastUpdate = new Date()
      .toLocaleString("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
      .replace(/\./g, ":");
    const flow = createBookingServiceFlowTemplate({
      flowId: `conv_booking_service_${Date.now()}`,
      lastUpdate,
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
        error instanceof Error
          ? error.message
          : "Status flow gagal diubah.",
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

      <section className="rounded-2xl border border-emerald-400/15 bg-[linear-gradient(135deg,rgba(16,185,129,0.08),rgba(6,182,212,0.03))] p-4 sm:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="flex min-w-0 flex-1 items-start gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-emerald-400/20 bg-emerald-400/10 text-emerald-300">
              <CalendarCheck2 className="h-6 w-6" />
            </span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-bold text-white">
                  Template Booking Service
                </p>
                <span className="rounded-full bg-emerald-400/10 px-2 py-0.5 text-[9px] font-black tracking-wide text-emerald-300 uppercase">
                  Ready to use
                </span>
              </div>
              <p className="mt-1 max-w-3xl text-xs leading-relaxed text-slate-400">
                Trigger booking, cek jam operasional, form data pelanggan dan
                motor, pilihan layanan serta jadwal, lalu konfirmasi admin.
                Dibuat sebagai Draft agar aman untuk dites sebelum Publish.
              </p>
            </div>
          </div>
          <Button
            type="button"
            onClick={() => void handleUseBookingTemplate()}
            disabled={isCreatingTemplate}
            className="h-10 shrink-0 gap-2 bg-emerald-500 px-4 text-xs text-white hover:bg-emerald-400"
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
              togglingFlowId={togglingFlowId}
              onDelete={(flow) => setDeletingFlow(flow)}
              onEditSettings={(flow) => {
                setEditingFlow(flow);
                setIsCreateModalOpen(true);
              }}
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
