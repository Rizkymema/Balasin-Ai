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
  Controls,
  MarkerType,
  MiniMap,
  Panel,
  ReactFlow,
  type Connection,
  type EdgeChange,
  type NodeChange,
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
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
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
  return graph.edges.map((item) => ({
    ...item,
    type: "smoothstep",
    markerEnd: { type: MarkerType.ArrowClosed, color: "#64748b" },
    style: { stroke: "#64748b", strokeWidth: 1.5 },
    labelStyle: { fill: "#94a3b8", fontSize: 9, fontWeight: 700 },
    labelBgStyle: { fill: "#0a0a0c", fillOpacity: 0.9 },
  }));
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
    "Kalau upgrade CVT Honda Genio harganya berapa?",
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
      setEdges((current) =>
        addEdge(
          {
            ...connection,
            id: `edge-${crypto.randomUUID()}`,
            type: "smoothstep",
            markerEnd: { type: MarkerType.ArrowClosed, color: "#64748b" },
            style: { stroke: "#64748b", strokeWidth: 1.5 },
          },
          current,
        ),
      );
      markChanged();
    },
    [markChanged],
  );

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

  const runPreview = async () => {
    if (!flow) return;
    setIsRunningTest(true);
    setError("");
    try {
      const response = await fetch(`/api/automation/flows/${flow.id}/test`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: previewMessage,
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
  };

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
        <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
      </div>
    );
  }

  if (!flow) {
    return (
      <div className="rounded-2xl border border-red-400/15 bg-red-400/[0.04] p-8 text-center">
        <AlertTriangle className="mx-auto h-8 w-8 text-red-400" />
        <p className="mt-3 text-sm font-bold text-white">
          Conversation Flow tidak dapat dibuka
        </p>
        <p className="mt-1 text-xs text-slate-400">
          {error || "Flow tidak ditemukan."}
        </p>
        <Link
          href="/automation"
          className="mt-4 inline-flex text-xs font-bold text-cyan-400"
        >
          Kembali ke Conversations
        </Link>
      </div>
    );
  }

  const errorCount = validation?.errors.length ?? 0;
  const warningCount = validation?.warnings.length ?? 0;

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-[#050506]">
      <header className="z-20 flex min-h-20 shrink-0 flex-wrap items-center gap-3 border-b border-white/8 bg-[#0a0a0c]/95 px-4 py-3 backdrop-blur-xl md:px-6">
        <Link
          href="/automation"
          className="rounded-lg p-2 text-slate-500 transition hover:bg-white/5 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="min-w-[180px] flex-1">
          <p className="mb-1 text-[10px] font-bold tracking-[0.08em] text-cyan-400 uppercase">
            Conversation
          </p>
          <div className="flex items-center gap-2">
            <Input
              value={flow.name}
              onChange={(event) => {
                setFlow({ ...flow, name: event.target.value });
                markChanged();
              }}
              className="h-8 max-w-2xl border-transparent bg-transparent px-0 text-base font-bold text-white hover:border-white/8 focus:border-cyan-400 md:text-lg"
            />
            <span
              className={`rounded-full px-2 py-0.5 text-[9px] font-black uppercase ${flow.status === "Published" ? "bg-emerald-400/10 text-emerald-300" : "bg-amber-400/10 text-amber-300"}`}
            >
              {flow.status}
            </span>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-3 text-[10px] text-slate-500">
            <span>{flow.channel}</span>
            <span>Last edited {flow.lastUpdate}</span>
            <span>Draft r{flow.draftRevision ?? 0}</span>
            <span className="flex items-center gap-1">
              {saveState === "saving" ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : saveState === "saved" ? (
                <Cloud className="h-3 w-3 text-emerald-400" />
              ) : (
                <CloudOff className="h-3 w-3 text-amber-400" />
              )}
              {saveState === "saving"
                ? "Saving..."
                : saveState === "saved"
                  ? "Draft saved"
                  : saveState === "conflict"
                    ? "Version conflict"
                    : "Unsaved changes"}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {(errorCount > 0 || warningCount > 0) && (
            <button
              type="button"
              onClick={() => setActivePanel("inspector")}
              className="rounded-full border border-white/8 px-3 py-2 text-[10px] font-bold text-slate-300"
            >
              <span className="text-red-400">{errorCount} error</span> /{" "}
              <span className="text-amber-400">{warningCount} warning</span>
            </button>
          )}
          <Button
            variant="secondary"
            onClick={() => void discardDraft()}
            disabled={!flow.hasUnpublishedChanges && saveState === "saved"}
            className="h-9 gap-2 px-4 text-xs"
          >
            <RotateCcw className="h-3.5 w-3.5 md:hidden" />
            <span className="hidden md:inline">Discard</span>
          </Button>
          <Button
            variant="secondary"
            onClick={() => setActivePanel("preview")}
            className="h-9 gap-2 border-cyan-400/20 px-4 text-xs text-cyan-300"
          >
            <FlaskConical className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Test Flow</span>
          </Button>
          <Button
            onClick={() => void publishFlow()}
            disabled={isPublishing || saveState === "conflict"}
            className="h-9 gap-2 px-5 text-xs"
          >
            {isPublishing ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Send className="h-3.5 w-3.5" />
            )}
            <span className="hidden sm:inline">
              {isPublishing ? "Publishing..." : "Publish"}
            </span>
          </Button>
        </div>
      </header>

      {error && (
        <div className="flex items-center gap-2 border-b border-red-400/15 bg-red-400/[0.06] px-4 py-2 text-[11px] text-red-300">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
          {error}
          {saveState === "conflict" && (
            <button
              type="button"
              onClick={() => void loadFlow()}
              className="ml-auto font-bold underline"
            >
              Reload Draft
            </button>
          )}
        </div>
      )}

      <div className="relative min-h-0 flex-1 overflow-hidden">
        <main className="absolute inset-0 bg-[#f4f7fb]">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
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
            snapToGrid
            snapGrid={[20, 20]}
            deleteKeyCode={["Backspace", "Delete"]}
            proOptions={{ hideAttribution: true }}
          >
            <Background
              variant={BackgroundVariant.Dots}
              gap={20}
              size={1.2}
              color="#cbd5e1"
            />
            <Panel position="top-left" className="!m-4">
              <div className="flex max-w-[calc(100vw-2rem)] flex-wrap items-center gap-2 rounded-2xl border border-slate-200 bg-white/95 p-2 shadow-[0_16px_50px_rgba(15,23,42,0.12)] backdrop-blur-xl">
                <button
                  type="button"
                  onClick={() => setIsPaletteOpen((current) => !current)}
                  className={`flex h-10 items-center gap-2 rounded-xl border px-3 text-xs font-bold transition ${isPaletteOpen ? "border-cyan-400 bg-cyan-50 text-cyan-700" : "border-slate-200 bg-white text-slate-700 hover:border-cyan-300 hover:text-cyan-700"}`}
                >
                  <Blocks className="h-4 w-4" />
                  Add puzzle
                </button>
                <button
                  type="button"
                  onClick={() => setActivePanel("preview")}
                  className="flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 transition hover:border-blue-300 hover:text-blue-700"
                >
                  <FlaskConical className="h-4 w-4" />
                  AI Training
                </button>
                <span className="hidden h-6 w-px bg-slate-200 sm:block" />
                <span className="rounded-lg bg-slate-100 px-2.5 py-1.5 text-[10px] font-bold text-slate-600">
                  {knowledge.documents} docs
                </span>
                <span className="rounded-lg bg-slate-100 px-2.5 py-1.5 text-[10px] font-bold text-slate-600">
                  {knowledge.faqs} FAQ
                </span>
                <span className="hidden rounded-lg bg-slate-100 px-2.5 py-1.5 text-[10px] font-bold text-slate-600 md:inline">
                  {workspace.timezone}
                </span>
              </div>
            </Panel>
            <MiniMap
              nodeColor="#0a84ff"
              maskColor="rgba(241,245,249,0.72)"
              className="!hidden !border !border-slate-200 !bg-white !shadow-lg md:!block"
            />
            <Controls
              position="top-right"
              className="!mt-4 !mr-4 !overflow-hidden !rounded-xl !border !border-slate-200 !bg-white !shadow-xl [&_button]:!border-slate-200 [&_button]:!bg-white [&_button]:!fill-slate-700"
            />
          </ReactFlow>
        </main>

        {isPaletteOpen && (
          <div className="absolute top-20 bottom-4 left-4 z-30 w-[min(280px,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-white/10 bg-[#0a0a0c] shadow-[0_24px_80px_rgba(15,23,42,0.35)] [&>aside]:h-full [&>aside]:border-0">
            <button
              type="button"
              onClick={() => setIsPaletteOpen(false)}
              className="absolute top-3 right-3 z-10 rounded-lg p-1.5 text-slate-500 transition hover:bg-white/8 hover:text-white"
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
          <aside className="absolute top-4 right-4 bottom-4 z-30 flex min-h-0 w-[min(390px,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#0a0a0c]/98 shadow-[0_24px_80px_rgba(15,23,42,0.38)] backdrop-blur-xl">
            <div className="grid grid-cols-[1fr_1fr_auto] border-b border-white/8 p-2">
              <button
                type="button"
                onClick={() => setActivePanel("inspector")}
                className={`flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-[10px] font-bold transition ${activePanel === "inspector" ? "bg-white/8 text-white" : "text-slate-500 hover:text-slate-300"}`}
              >
                <PanelRight className="h-3.5 w-3.5" />
                Inspector
              </button>
              <button
                type="button"
                onClick={() => setActivePanel("preview")}
                className={`flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-[10px] font-bold transition ${activePanel === "preview" ? "bg-cyan-400/10 text-cyan-300" : "text-slate-500 hover:text-slate-300"}`}
              >
                <FlaskConical className="h-3.5 w-3.5" />
                Test
              </button>
              <button
                type="button"
                onClick={() => setActivePanel(null)}
                className="ml-1 flex h-8 w-8 items-center justify-center self-center rounded-lg text-slate-500 transition hover:bg-white/8 hover:text-white"
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
                      <div className="max-h-44 overflow-y-auto border-t border-white/8 p-3">
                        <p className="text-[9px] font-black tracking-[0.14em] text-slate-500 uppercase">
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
                              className={`mt-2 block w-full rounded-lg px-2.5 py-2 text-left text-[10px] ${issue.severity === "error" ? "bg-red-400/[0.06] text-red-300" : "bg-amber-400/[0.06] text-amber-300"}`}
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
                  onRun={() => void runPreview()}
                  onReset={() => setPreviewResult(null)}
                />
              )}
            </div>
          </aside>
        )}
      </div>

      <footer className="flex items-center justify-between border-t border-white/8 bg-[#0a0a0c] px-4 py-2 text-[9px] text-slate-600">
        <span>
          {nodes.length} nodes / {edges.length} edges
        </span>
        <span className="flex items-center gap-1.5">
          <Check className="h-3 w-3 text-emerald-400" />
          Preview is sandboxed. Runtime hanya memakai Published graph.
        </span>
      </footer>
    </div>
  );
}
