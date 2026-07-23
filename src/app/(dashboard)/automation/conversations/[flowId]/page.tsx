"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  Background,
  BackgroundVariant,
  ConnectionLineType,
  Controls,
  MarkerType,
  MiniMap,
  Panel,
  ReactFlow,
  type Connection,
  type EdgeChange,
  type NodeChange,
  type ReactFlowInstance,
  type Viewport,
} from "@xyflow/react";
import {
  AlertTriangle,
  ArrowLeft,
  Blocks,
  Check,
  Cloud,
  CloudOff,
  FlaskConical,
  Loader2,
  PanelRight,
  RotateCcw,
  Send,
  WandSparkles,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useDashboardConfig } from "@/hooks/use-dashboard-config";
import { Input } from "@/components/ui/input";
import type {
  AIAgent,
  ConversationFlow,
  ConversationFlowGraph,
  ConversationFlowNodeData,
  ConversationFlowNodeType,
} from "@/types/dashboard-config";
import { FlowNodeCard } from "../../components/flow-builder/flow-node-card";
import { NodeInspector } from "../../components/flow-builder/node-inspector";
import { NodePalette } from "../../components/flow-builder/node-palette";
import { PreviewConversation } from "../../components/flow-builder/preview-conversation";
import type {
  FlowCanvasEdge,
  FlowCanvasNode,
  FlowPreviewResult,
  FlowValidationView,
} from "../../components/flow-builder/flow-builder-types";

const nodeTypes = {
  start: FlowNodeCard,
  message: FlowNodeCard,
  form_chat: FlowNodeCard,
  office_hours: FlowNodeCard,
  ai_agent: FlowNodeCard,
  fallback: FlowNodeCard,
  handoff: FlowNodeCard,
  end: FlowNodeCard,
};

type FlowPayload = {
  flow: ConversationFlow;
  graph: ConversationFlowGraph;
  agents: AIAgent[];
  workspace: { timezone: string; businessHours: string };
  knowledge: { documents: number; faqs: number };
};

type ApiEnvelope<T> = {
  ok: boolean;
  data?: T;
  error?: string;
  details?: Array<{ message?: string }>;
};

function toCanvasNodes(graph: ConversationFlowGraph): FlowCanvasNode[] {
  return graph.nodes.map((item) => ({
    id: item.id,
    type: item.type,
    position: item.position,
    data: item.data,
    deletable: item.type !== "start",
  }));
}

function toCanvasEdges(graph: ConversationFlowGraph): FlowCanvasEdge[] {
  return graph.edges.map((item) => decorateEdge(item));
}

const EDGE_COLORS: Record<string, string> = {
  inside: "#10b981",
  outside: "#f59e0b",
  answered: "#2563eb",
  needs_human: "#ef4444",
  not_found: "#f97316",
  error: "#dc2626",
};

const MINIMAP_NODE_COLORS: Record<string, string> = {
  start: "#059669",
  message: "#2563eb",
  office_hours: "#d97706",
  ai_agent: "#0891b2",
  fallback: "#9333ea",
  handoff: "#dc2626",
  end: "#475569",
};

function getMiniMapNodeColor(node: { type?: string }): string {
  return MINIMAP_NODE_COLORS[node.type ?? "message"] ?? "#2563eb";
}

function decorateEdge<
  T extends FlowCanvasEdge | ConversationFlowGraph["edges"][number],
>(item: T): FlowCanvasEdge {
  const color = EDGE_COLORS[item.sourceHandle ?? ""] ?? "#94a3b8";
  return {
    ...item,
    type: "smoothstep",
    markerEnd: { type: MarkerType.ArrowClosed, color },
    style: { stroke: color, strokeWidth: 2 },
    labelStyle: { fill: "#475569", fontSize: 9, fontWeight: 800 },
    labelBgStyle: {
      fill: "#ffffff",
      fillOpacity: 0.96,
      stroke: "#e2e8f0",
      strokeWidth: 1,
    },
    labelBgPadding: [7, 4],
    labelBgBorderRadius: 6,
  };
}

function toGraph(
  nodes: FlowCanvasNode[],
  edges: FlowCanvasEdge[],
  viewport: Viewport,
): ConversationFlowGraph {
  return {
    nodes: nodes.map((item) => ({
      id: item.id,
      type: item.type ?? "message",
      position: item.position,
      data: item.data,
    })),
    edges: edges.map((item) => ({
      id: item.id,
      source: item.source,
      target: item.target,
      sourceHandle: item.sourceHandle ?? undefined,
      targetHandle: item.targetHandle ?? undefined,
      label: typeof item.label === "string" ? item.label : undefined,
    })),
    viewport,
  };
}

function getLocalDateTimeValue() {
  const date = new Date(Date.now() - new Date().getTimezoneOffset() * 60_000);
  return date.toISOString().slice(0, 16);
}

function newNode(
  type: ConversationFlowNodeType,
  index: number,
): FlowCanvasNode {
  const defaults: Record<ConversationFlowNodeType, ConversationFlowNodeData> = {
    start: {
      label: "Start",
      trigger: "first_incoming_message",
      triggerKeywords: [],
    },
    message: { label: "Send Message", message: "Tulis pesan chatbot di sini." },
    form_chat: {
      label: "Form Booking & Lead",
      formTitle: "Form Booking & Konsultasi",
      formDescription:
        "Silakan isi data diri Anda di bawah ini agar tim kami dapat menghubungi Anda.",
      formFillMode: "single_message",
      submitButtonLabel: "Kirim Form Data",
      successMessage:
        "Terima kasih! Form Anda telah kami terima dan tim kami akan segera menghubungi Anda.",
      formFields: [
        {
          id: "field-1",
          label: "Nama Lengkap",
          type: "text",
          placeholder: "Contoh: Budi Santoso",
          required: true,
        },
        {
          id: "field-2",
          label: "Nomor WhatsApp",
          type: "phone",
          placeholder: "0812...",
          required: true,
        },
        {
          id: "field-3",
          label: "Pilihan Layanan",
          type: "select",
          options: [
            "Upgrade CVT",
            "Servis Berkala / Tune Up",
            "Ganti Oli",
            "Konsultasi",
          ],
          required: true,
        },
      ],
    },
    office_hours: { label: "Office Hours" },
    ai_agent: {
      label: "AI Agent",
      useConversationHistory: true,
      requireKnowledgeBase: true,
    },
    fallback: {
      label: "Default Fallback",
      message:
        "Maaf, data tersebut belum tersedia. Saya arahkan ke admin agar informasinya akurat.",
    },
    handoff: {
      label: "Handoff Admin",
      message: "Pesan Anda sudah diteruskan ke admin.",
      handoffTarget: "Admin Desk",
      handoffReason: "Perlu bantuan admin.",
    },
    end: { label: "End" },
  };
  return {
    id: `${type}-${crypto.randomUUID()}`,
    type,
    position: { x: 320 + (index % 3) * 70, y: 180 + index * 65 },
    data: defaults[type],
  };
}

export default function ConversationFlowBuilderPage() {
  const { config } = useDashboardConfig();
  const params = useParams<{ flowId: string }>();
  const router = useRouter();
  const flowId = params.flowId;
  const [flow, setFlow] = useState<ConversationFlow | null>(null);
  const [agents, setAgents] = useState<AIAgent[]>([]);
  const [knowledge, setKnowledge] = useState({ documents: 0, faqs: 0 });
  const [workspace, setWorkspace] = useState({
    timezone: "Asia/Jakarta",
    businessHours: "",
  });
  const [nodes, setNodes] = useState<FlowCanvasNode[]>([]);
  const [edges, setEdges] = useState<FlowCanvasEdge[]>([]);
  const [viewport, setViewport] = useState<Viewport>({ x: 0, y: 0, zoom: 0.9 });
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [activePanel, setActivePanel] = useState<
    "inspector" | "preview" | null
  >(null);
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  const [validation, setValidation] = useState<FlowValidationView | null>(null);
  const [previewMessage, setPreviewMessage] = useState(
    "Halo, tanya harga layanannya dong?",
  );
  const [previewNow, setPreviewNow] = useState(getLocalDateTimeValue);
  const [previewResult, setPreviewResult] = useState<FlowPreviewResult | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isRunningTest, setIsRunningTest] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [saveState, setSaveState] = useState<
    "saved" | "unsaved" | "saving" | "error" | "conflict"
  >("saved");
  const [error, setError] = useState("");
  const [changeVersion, setChangeVersion] = useState(0);
  const initializedRef = useRef(false);
  const revisionRef = useRef(0);
  const dirtyVersionRef = useRef(0);
  const savedVersionRef = useRef(0);
  const savingRef = useRef(false);
  const flowInstanceRef = useRef<
    ReactFlowInstance<FlowCanvasNode, FlowCanvasEdge> | undefined
  >(undefined);

  const buildGraph = useCallback(
    () => toGraph(nodes, edges, viewport),
    [edges, nodes, viewport],
  );

  const markChanged = useCallback(() => {
    if (!initializedRef.current) return;
    dirtyVersionRef.current += 1;
    setChangeVersion(dirtyVersionRef.current);
    setSaveState("unsaved");
  }, []);

  const loadFlow = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/automation/flows/${flowId}`, {
        credentials: "include",
        cache: "no-store",
      });
      const payload = (await response.json()) as ApiEnvelope<FlowPayload>;
      if (!response.ok || !payload.data) {
        if (response.status === 401) {
          router.push(
            `/login?redirect=${encodeURIComponent(`/automation/conversations/${flowId}`)}`,
          );
          return;
        }
        throw new Error(payload.error || "Conversation Flow gagal dimuat.");
      }

      setFlow(payload.data.flow);
      setAgents(payload.data.agents);
      setKnowledge(payload.data.knowledge);
      setWorkspace(payload.data.workspace);
      setNodes(toCanvasNodes(payload.data.graph));
      setEdges(toCanvasEdges(payload.data.graph));
      setViewport(payload.data.graph.viewport);
      revisionRef.current =
        payload.data.flow.draftRevision ??
        payload.data.flow.publishedRevision ??
        0;
      dirtyVersionRef.current = 0;
      savedVersionRef.current = 0;
      setChangeVersion(0);
      setSaveState("saved");
      setTimeout(() => {
        initializedRef.current = true;
      }, 0);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Conversation Flow gagal dimuat.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [flowId, router]);

  useEffect(() => {
    void loadFlow();
    return () => {
      initializedRef.current = false;
    };
  }, [loadFlow]);

  const saveDraft = useCallback(async () => {
    if (!flow || savingRef.current) return false;
    const versionAtStart = dirtyVersionRef.current;
    savingRef.current = true;
    setSaveState("saving");
    setError("");
    try {
      const response = await fetch(`/api/automation/flows/${flow.id}/draft`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          graph: buildGraph(),
          expectedRevision: revisionRef.current,
          name: flow.name,
          channel: flow.channel,
        }),
      });
      const payload = (await response.json()) as ApiEnvelope<{
        flow: ConversationFlow;
        validation: FlowValidationView;
      }>;
      if (!response.ok || !payload.data) {
        if (response.status === 409) setSaveState("conflict");
        throw new Error(payload.error || "Draft gagal disimpan.");
      }

      revisionRef.current =
        payload.data.flow.draftRevision ?? revisionRef.current;
      savedVersionRef.current = versionAtStart;
      setFlow(payload.data.flow);
      setValidation(payload.data.validation);
      setSaveState(
        dirtyVersionRef.current === versionAtStart ? "saved" : "unsaved",
      );
      return true;
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Draft gagal disimpan.",
      );
      setSaveState((current) => (current === "conflict" ? current : "error"));
      return false;
    } finally {
      savingRef.current = false;
      if (dirtyVersionRef.current !== versionAtStart) {
        setChangeVersion((current) => current + 1);
      }
    }
  }, [buildGraph, flow]);

  useEffect(() => {
    if (!initializedRef.current || changeVersion === savedVersionRef.current)
      return;
    const timeout = window.setTimeout(() => {
      void saveDraft();
    }, 800);
    return () => window.clearTimeout(timeout);
  }, [changeVersion, saveDraft]);

  const onNodesChange = useCallback(
    (changes: NodeChange<FlowCanvasNode>[]) => {
      setNodes((current) => applyNodeChanges(changes, current));
      if (
        changes.some(
          (change) => !["select", "dimensions"].includes(change.type),
        )
      ) {
        markChanged();
      }
    },
    [markChanged],
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange<FlowCanvasEdge>[]) => {
      setEdges((current) => applyEdgeChanges(changes, current));
      if (changes.some((change) => change.type !== "select")) markChanged();
    },
    [markChanged],
  );

  const onConnect = useCallback(
    (connection: Connection) => {
      const color = EDGE_COLORS[connection.sourceHandle ?? ""] ?? "#2563eb";
      setEdges((current) =>
        addEdge(
          {
            ...connection,
            id: `edge-${crypto.randomUUID()}`,
            type: "smoothstep",
            markerEnd: { type: MarkerType.ArrowClosed, color },
            style: { stroke: color, strokeWidth: 2 },
          },
          current,
        ),
      );
      markChanged();
    },
    [markChanged],
  );

  const arrangeFlow = useCallback(() => {
    if (nodes.length === 0) return;

    const start = nodes.find((item) => item.type === "start") ?? nodes[0];
    const levelByNode = new Map<string, number>([[start.id, 0]]);
    const queue = [start.id];

    while (queue.length > 0) {
      const sourceId = queue.shift();
      if (!sourceId) continue;
      const nextLevel = (levelByNode.get(sourceId) ?? 0) + 1;
      for (const edge of edges.filter((item) => item.source === sourceId)) {
        if (levelByNode.has(edge.target)) continue;
        levelByNode.set(edge.target, nextLevel);
        queue.push(edge.target);
      }
    }

    const highestLevel = Math.max(0, ...levelByNode.values());
    for (const item of nodes) {
      if (!levelByNode.has(item.id)) {
        levelByNode.set(item.id, highestLevel + 1);
      }
    }

    const levels = new Map<number, FlowCanvasNode[]>();
    for (const item of nodes) {
      const level = levelByNode.get(item.id) ?? highestLevel + 1;
      levels.set(level, [...(levels.get(level) ?? []), item]);
    }

    setNodes((current) =>
      current.map((item) => {
        const level = levelByNode.get(item.id) ?? 0;
        const siblings = levels.get(level) ?? [item];
        const index = siblings.findIndex(
          (candidate) => candidate.id === item.id,
        );
        return {
          ...item,
          position: {
            x: 520 + (index - (siblings.length - 1) / 2) * 300,
            y: 80 + level * 190,
          },
        };
      }),
    );
    markChanged();
    requestAnimationFrame(() => {
      void flowInstanceRef.current?.fitView({ padding: 0.18, duration: 500 });
    });
  }, [edges, markChanged, nodes]);

  const isValidConnection = useCallback(
    (connection: Connection | FlowCanvasEdge) => {
      if (connection.source === connection.target) return false;
      const target = nodes.find((item) => item.id === connection.target);
      const source = nodes.find((item) => item.id === connection.source);
      if (
        !target ||
        !source ||
        target.type === "start" ||
        source.type === "end"
      )
        return false;
      return !edges.some(
        (item) =>
          item.source === connection.source &&
          item.sourceHandle === connection.sourceHandle &&
          item.target === connection.target,
      );
    },
    [edges, nodes],
  );

  const addNode = (type: ConversationFlowNodeType) => {
    if (type === "start") return;
    const item = newNode(type, nodes.length);
    setNodes((current) => [...current, item]);
    setSelectedNodeId(item.id);
    setActivePanel("inspector");
    markChanged();
  };

  const selectedNode = nodes.find((item) => item.id === selectedNodeId) ?? null;

  const updateSelectedNode = (data: ConversationFlowNodeData) => {
    if (!selectedNodeId) return;
    setNodes((current) =>
      current.map((item) =>
        item.id === selectedNodeId ? { ...item, data } : item,
      ),
    );
    markChanged();
  };

  const deleteSelectedNode = () => {
    if (!selectedNodeId || selectedNode?.type === "start") return;
    setNodes((current) => current.filter((item) => item.id !== selectedNodeId));
    setEdges((current) =>
      current.filter(
        (item) =>
          item.source !== selectedNodeId && item.target !== selectedNodeId,
      ),
    );
    setSelectedNodeId(null);
    markChanged();
  };

  const runPreview = useCallback(
    async (overrideMsg?: string) => {
      if (!flow) return;
      const msgToSend = (overrideMsg ?? previewMessage).trim();
      if (!msgToSend) return;
      setIsRunningTest(true);
      setError("");
      try {
        const response = await fetch(`/api/automation/flows/${flow.id}/test`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: msgToSend,
            nowIso: new Date(previewNow).toISOString(),
            graph: buildGraph(),
          }),
        });
        const payload = (await response.json()) as ApiEnvelope<FlowPreviewResult>;
        if (!response.ok || !payload.data) {
          throw new Error(
            payload.details
              ?.map((item) => item.message)
              .filter(Boolean)
              .join(" ") ||
              payload.error ||
              "Preview gagal dijalankan.",
          );
        }
        setPreviewResult(payload.data);
      } catch (caught) {
        setError(
          caught instanceof Error ? caught.message : "Preview gagal dijalankan.",
        );
      } finally {
        setIsRunningTest(false);
      }
    },
    [buildGraph, flow, previewMessage, previewNow],
  );

  useEffect(() => {
    if (activePanel === "preview" && !previewResult && !isRunningTest && flow) {
      void runPreview("Halo");
    }
  }, [activePanel, flow, isRunningTest, previewResult, runPreview]);

  const publishFlow = async () => {
    if (!flow) return;
    setIsPublishing(true);
    setError("");
    try {
      const saved = await saveDraft();
      if (!saved && saveState !== "saved") return;
      const response = await fetch(`/api/automation/flows/${flow.id}/publish`, {
        method: "POST",
        credentials: "include",
      });
      const payload = (await response.json()) as ApiEnvelope<{
        flow: ConversationFlow;
        validation: FlowValidationView;
      }>;
      if (!response.ok || !payload.data) {
        throw new Error(
          payload.details
            ?.map((item) => item.message)
            .filter(Boolean)
            .join(" ") ||
            payload.error ||
            "Flow gagal dipublish.",
        );
      }
      setFlow(payload.data.flow);
      setValidation(payload.data.validation);
      revisionRef.current =
        payload.data.flow.draftRevision ?? revisionRef.current;
      savedVersionRef.current = dirtyVersionRef.current;
      setSaveState("saved");
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Flow gagal dipublish.",
      );
    } finally {
      setIsPublishing(false);
    }
  };

  const discardDraft = async () => {
    if (
      !flow ||
      !confirm("Buang semua perubahan Draft dan kembali ke versi Published?")
    )
      return;
    setError("");
    const response = await fetch(`/api/automation/flows/${flow.id}/discard`, {
      method: "POST",
      credentials: "include",
    });
    const payload = (await response.json()) as ApiEnvelope<{
      flow: ConversationFlow;
      graph: ConversationFlowGraph;
    }>;
    if (!response.ok || !payload.data) {
      setError(payload.error || "Draft gagal dibuang.");
      return;
    }
    initializedRef.current = false;
    setFlow(payload.data.flow);
    setNodes(toCanvasNodes(payload.data.graph));
    setEdges(toCanvasEdges(payload.data.graph));
    setViewport(payload.data.graph.viewport);
    revisionRef.current = payload.data.flow.draftRevision ?? 0;
    dirtyVersionRef.current = 0;
    savedVersionRef.current = 0;
    setChangeVersion(0);
    setSaveState("saved");
    setPreviewResult(null);
    setTimeout(() => {
      initializedRef.current = true;
    }, 0);
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[65vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!flow) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
        <AlertTriangle className="mx-auto h-8 w-8 text-red-600" />
        <p className="mt-3 text-sm font-bold text-slate-900">
          Conversation Flow tidak dapat dibuka
        </p>
        <p className="mt-1 text-xs text-slate-500">
          {error || "Flow tidak ditemukan."}
        </p>
        <Link
          href="/automation"
          className="mt-4 inline-flex text-xs font-bold text-blue-600 hover:underline"
        >
          Kembali ke Conversations
        </Link>
      </div>
    );
  }

  const errorCount = validation?.errors.length ?? 0;
  const warningCount = validation?.warnings.length ?? 0;

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-slate-100">
      {/* SaaS Light Topbar */}
      <header className="z-20 flex h-14 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-3 md:px-5 shadow-2xs">
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <Link
            href="/automation"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 cursor-pointer"
            title="Kembali ke Automations"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>

          <div className="h-4 w-px bg-slate-200 shrink-0" />

          {/* Workspace & Flow Title */}
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <span className="hidden sm:inline text-xs font-semibold text-slate-500 shrink-0">
              Workspace: <strong className="text-slate-900">{config?.workspace?.name || "Workspace Utama"}</strong>
            </span>
            <span className="hidden sm:inline text-slate-300">/</span>

            <Input
              value={flow.name}
              onChange={(event) => {
                setFlow({ ...flow, name: event.target.value });
                markChanged();
              }}
              className="h-8 max-w-[200px] sm:max-w-[280px] md:max-w-[340px] border-slate-200 bg-white px-2 text-xs md:text-sm font-bold text-slate-900 focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
            />

            <Badge
              variant={flow.status === "Published" ? "success" : "warning"}
              className="shrink-0 text-[9px]"
            >
              {flow.status}
            </Badge>

            {/* Auto-Save & Details */}
            <div className="hidden lg:flex items-center gap-2 text-xs text-slate-500 pl-2">
              <span className="text-slate-300">•</span>
              <span className="flex items-center gap-1.5 font-medium">
                {saveState === "saving" ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-600" />
                ) : saveState === "saved" ? (
                  <Cloud className="h-3.5 w-3.5 text-emerald-600" />
                ) : (
                  <CloudOff className="h-3.5 w-3.5 text-amber-600" />
                )}
                {saveState === "saving"
                  ? "Saving..."
                  : saveState === "saved"
                    ? `Draft r${flow.draftRevision ?? 0} saved`
                    : saveState === "conflict"
                      ? "Version conflict"
                      : "Unsaved changes"}
              </span>
            </div>
          </div>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          {(errorCount > 0 || warningCount > 0) && (
            <button
              type="button"
              onClick={() => setActivePanel("inspector")}
              className="flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-bold text-red-700 transition hover:bg-red-100 cursor-pointer"
            >
              <AlertTriangle className="h-3.5 w-3.5" />
              <span>{errorCount} error</span>
            </button>
          )}

          <Button
            variant="secondary"
            size="sm"
            onClick={() => void discardDraft()}
            disabled={!flow.hasUnpublishedChanges && saveState === "saved"}
          >
            <RotateCcw className="h-3.5 w-3.5 mr-1" />
            <span className="hidden sm:inline">Discard</span>
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => setActivePanel("preview")}
          >
            <FlaskConical className="h-3.5 w-3.5 text-blue-600 mr-1" />
            <span>Test Flow</span>
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => void publishFlow()}
            disabled={isPublishing || saveState === "conflict"}
          >
            {isPublishing ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
            ) : (
              <Send className="h-3.5 w-3.5 mr-1" />
            )}
            <span>
              {isPublishing ? "Publishing..." : "Publish"}
            </span>
          </Button>
        </div>
      </header>

      {error && (
        <div className="flex items-center gap-2 border-b border-red-200 bg-red-50 px-4 py-2 text-xs text-red-800 font-semibold">
          <AlertTriangle className="h-4 w-4 shrink-0 text-red-600" />
          {error}
          {saveState === "conflict" && (
            <button
              type="button"
              onClick={() => void loadFlow()}
              className="ml-auto font-bold underline cursor-pointer"
            >
              Reload Draft
            </button>
          )}
        </div>
      )}

      {/* Main Flow Canvas Viewport */}
      <div className="relative min-h-0 flex-1 overflow-hidden">
        <main className="absolute inset-0 bg-slate-50">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onInit={(instance) => {
              flowInstanceRef.current = instance;
            }}
            isValidConnection={isValidConnection}
            onNodeClick={(_event, item) => {
              setSelectedNodeId(item.id);
              setActivePanel("inspector");
            }}
            onPaneClick={() => setSelectedNodeId(null)}
            onMoveEnd={(_event, nextViewport) => {
              setViewport(nextViewport);
              markChanged();
            }}
            defaultViewport={viewport}
            minZoom={0.25}
            maxZoom={2}
            fitView
            fitViewOptions={{ padding: 0.18 }}
            snapToGrid
            snapGrid={[20, 20]}
            connectionLineType={ConnectionLineType.SmoothStep}
            connectionLineStyle={{ stroke: "#2563eb", strokeWidth: 2.25 }}
            connectionRadius={24}
            elevateEdgesOnSelect
            deleteKeyCode={["Backspace", "Delete"]}
            proOptions={{ hideAttribution: true }}
          >
            <Background
              variant={BackgroundVariant.Dots}
              gap={20}
              size={1.2}
              color="#cbd5e1"
            />
            <Panel position="top-left" className="!m-3">
              <div className="flex max-w-[calc(100vw-2rem)] flex-wrap items-center gap-1.5 rounded-xl border border-slate-200 bg-white/95 p-1.5 shadow-xs backdrop-blur-md">
                <button
                  type="button"
                  onClick={() => setIsPaletteOpen((current) => !current)}
                  className={`flex h-8 items-center gap-1.5 rounded-lg border px-2.5 text-xs font-bold transition cursor-pointer ${isPaletteOpen ? "border-blue-600 bg-blue-50 text-blue-700" : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"}`}
                >
                  <Blocks className="h-3.5 w-3.5 text-blue-600" />
                  Add puzzle
                </button>
                <button
                  type="button"
                  onClick={() => setActivePanel("preview")}
                  className="flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-bold text-slate-700 transition hover:bg-slate-50 cursor-pointer"
                >
                  <FlaskConical className="h-3.5 w-3.5 text-blue-600" />
                  AI Training
                </button>
                <button
                  type="button"
                  onClick={arrangeFlow}
                  className="flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-bold text-slate-700 transition hover:bg-slate-50 cursor-pointer"
                >
                  <WandSparkles className="h-3.5 w-3.5 text-emerald-600" />
                  <span className="hidden sm:inline">Rapikan Flow</span>
                </button>
                <span className="hidden h-5 w-px bg-slate-200 sm:block" />
                <span className="rounded-md bg-slate-100 border border-slate-200 px-2 py-1 text-[10px] font-bold text-slate-600">
                  {knowledge.documents} docs
                </span>
                <span className="rounded-md bg-slate-100 border border-slate-200 px-2 py-1 text-[10px] font-bold text-slate-600">
                  {knowledge.faqs} FAQ
                </span>
              </div>
            </Panel>
            <MiniMap
              nodeColor={getMiniMapNodeColor}
              nodeStrokeColor="transparent"
              nodeBorderRadius={6}
              maskColor="rgba(15, 23, 42, 0.08)"
              maskStrokeColor="#2563eb"
              maskStrokeWidth={2}
              zoomable
              pannable
              className="!hidden md:!block !rounded-2xl !border !border-slate-200 !bg-white/95 !shadow-md !backdrop-blur-md !overflow-hidden [&_svg]:!bg-slate-50/70 [&_svg]:!rounded-2xl"
            />
            <Controls
              position="top-right"
              className="!mt-3 !mr-3 !overflow-hidden !rounded-xl !border !border-slate-200 !bg-white !shadow-xs [&_button]:!border-slate-200 [&_button]:!bg-white [&_button]:!fill-slate-700"
            />
          </ReactFlow>
        </main>

        {isPaletteOpen && (
          <div className="absolute top-20 bottom-4 left-4 z-30 w-[min(280px,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl [&>aside]:h-full [&>aside]:border-0">
            <button
              type="button"
              onClick={() => setIsPaletteOpen(false)}
              className="absolute top-3 right-3 z-10 rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-900 cursor-pointer"
              aria-label="Tutup node library"
            >
              <X className="h-4 w-4" />
            </button>
            <NodePalette
              onAdd={(type) => {
                addNode(type);
                setIsPaletteOpen(false);
              }}
            />
          </div>
        )}

        {activePanel && (
          <aside className="absolute top-4 right-4 bottom-4 z-30 flex min-h-0 w-[min(390px,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl backdrop-blur-xl">
            <div className="grid grid-cols-[1fr_1fr_auto] border-b border-slate-100 p-2">
              <button
                type="button"
                onClick={() => setActivePanel("inspector")}
                className={`flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-bold transition cursor-pointer ${activePanel === "inspector" ? "bg-blue-50 text-blue-700" : "text-slate-500 hover:text-slate-900"}`}
              >
                <PanelRight className="h-3.5 w-3.5" />
                Inspector
              </button>
              <button
                type="button"
                onClick={() => setActivePanel("preview")}
                className={`flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-bold transition cursor-pointer ${activePanel === "preview" ? "bg-blue-50 text-blue-700" : "text-slate-500 hover:text-slate-900"}`}
              >
                <FlaskConical className="h-3.5 w-3.5" />
                Test
              </button>
              <button
                type="button"
                onClick={() => setActivePanel(null)}
                className="ml-1 flex h-8 w-8 items-center justify-center self-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-900 cursor-pointer"
                aria-label="Tutup panel"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="min-h-0 flex-1">
              {activePanel === "inspector" ? (
                <div className="flex h-full min-h-0 flex-col">
                  <div className="min-h-0 flex-1">
                    <NodeInspector
                      node={selectedNode}
                      agents={agents}
                      onChange={updateSelectedNode}
                      onDelete={deleteSelectedNode}
                    />
                  </div>
                  {validation &&
                    (validation.errors.length > 0 ||
                      validation.warnings.length > 0) && (
                      <div className="max-h-44 overflow-y-auto border-t border-slate-100 p-3">
                        <p className="text-[9px] font-extrabold tracking-wider text-slate-400 uppercase">
                          Validation
                        </p>
                        {[...validation.errors, ...validation.warnings]
                          .slice(0, 8)
                          .map((issue, index) => (
                            <button
                              key={`${issue.code}-${index}`}
                              type="button"
                              onClick={() =>
                                issue.nodeId && setSelectedNodeId(issue.nodeId)
                              }
                              className={`mt-2 block w-full rounded-lg px-2.5 py-2 text-left text-xs font-medium cursor-pointer ${issue.severity === "error" ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-700"}`}
                            >
                              {issue.message}
                            </button>
                          ))}
                      </div>
                    )}
                </div>
              ) : (
                <PreviewConversation
                  message={previewMessage}
                  nowIso={previewNow}
                  result={previewResult}
                  isRunning={isRunningTest}
                  onMessageChange={setPreviewMessage}
                  onNowChange={setPreviewNow}
                  onRun={(customMsg) => void runPreview(customMsg)}
                  onReset={() => setPreviewResult(null)}
                  businessName={config?.workspace?.name}
                />
              )}
            </div>
          </aside>
        )}
      </div>

      <footer className="flex h-7 shrink-0 items-center justify-between border-t border-slate-200 bg-white px-4 text-[10px] font-bold text-slate-500">
        <span>
          {nodes.length} nodes / {edges.length} edges
        </span>
        <span className="flex items-center gap-1 text-slate-500 font-semibold">
          <Check className="h-3 w-3 text-emerald-600" />
          Preview is sandboxed. Runtime hanya memakai Published graph.
        </span>
      </footer>
    </div>
  );
}
