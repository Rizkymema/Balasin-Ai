import { randomUUID } from "node:crypto";

import type {
  AIAgent,
  ConversationFlow,
  ConversationFlowEdge,
  ConversationFlowGraph,
  ConversationFlowNode,
  ConversationFlowNodeType,
  DashboardConfig,
} from "@/types/dashboard-config";
import type { ReplyDecision } from "@/server/services/reply-engine";

const MAX_FLOW_NODES = 100;
const MAX_FLOW_EDGES = 200;
const MAX_EXECUTION_STEPS = 50;

export type FlowValidationIssue = {
  code: string;
  message: string;
  nodeId?: string;
  severity: "error" | "warning";
};

export type FlowValidationResult = {
  valid: boolean;
  errors: FlowValidationIssue[];
  warnings: FlowValidationIssue[];
};

export type FlowTraceStep = {
  nodeId: string;
  nodeType: ConversationFlowNodeType;
  label: string;
  outcome?: string;
};

export type FlowPreAiResult = {
  messages: string[];
  trace: FlowTraceStep[];
  aiNodeId?: string;
  aiAgentId?: string;
  graphReplyOnly: boolean;
  needsHuman: boolean;
  handoffTarget?: string;
  handoffReason?: string;
  error?: string;
};

export type FlowPostAiResult = {
  messages: string[];
  trace: FlowTraceStep[];
  needsHuman: boolean;
  handoffTarget?: string;
  handoffReason?: string;
  error?: string;
};

function node(
  type: ConversationFlowNodeType,
  label: string,
  position: { x: number; y: number },
  data: Omit<ConversationFlowNode["data"], "label"> = {},
): ConversationFlowNode {
  return {
    id: `${type}-${randomUUID()}`,
    type,
    position,
    data: { label, ...data },
  };
}

function edge(
  source: ConversationFlowNode,
  target: ConversationFlowNode,
  sourceHandle?: string,
  label?: string,
): ConversationFlowEdge {
  return {
    id: `edge-${randomUUID()}`,
    source: source.id,
    target: target.id,
    sourceHandle,
    label,
  };
}

export function createDefaultConversationFlowGraph(
  flow?: Partial<ConversationFlow>,
): ConversationFlowGraph {
  const start = node(
    "start",
    "Start",
    { x: 260, y: 0 },
    {
      trigger: flow?.normalizedTrigger ?? "first_incoming_message",
      triggerKeywords: flow?.triggerKeywords ?? [],
    },
  );
  const greeting = node(
    "message",
    "Greeting",
    { x: 260, y: 140 },
    {
      message:
        flow?.initialMessage ||
        "Halo! Selamat datang di Johan Garage. Silakan sampaikan kebutuhan Anda.",
    },
  );
  const officeHours = node("office_hours", "Office Hours", { x: 260, y: 300 });
  const outsideMessage = node(
    "message",
    "Outside Office Hours",
    { x: 20, y: 470 },
    {
      message:
        "Saat ini kami sedang di luar jam operasional. Pesan Anda sudah kami terima dan akan ditindaklanjuti oleh admin.",
    },
  );
  const agent = node(
    "ai_agent",
    "AI Agent",
    { x: 500, y: 470 },
    {
      agentId: flow?.aiAgentId,
      useConversationHistory: true,
      requireKnowledgeBase: true,
    },
  );
  const fallback = node(
    "fallback",
    "Default Fallback",
    { x: 500, y: 650 },
    {
      message:
        flow?.fallbackMessage ||
        "Maaf, data tersebut belum tersedia di Knowledge Base. Saya arahkan ke admin agar informasinya akurat.",
    },
  );
  const handoff = node(
    "handoff",
    "Handoff Admin",
    { x: 500, y: 820 },
    {
      message: "Pesan Anda sudah diteruskan ke admin Johan Garage.",
      handoffTarget: "Admin Desk",
      handoffReason:
        flow?.humanAgentHandoff?.condition ||
        "Data tidak tersedia atau perlu bantuan admin.",
    },
  );
  const outsideEnd = node("end", "End", { x: 20, y: 650 });
  const answeredEnd = node("end", "End", { x: 760, y: 650 });
  const handoffEnd = node("end", "End", { x: 500, y: 990 });

  return {
    nodes: [
      start,
      greeting,
      officeHours,
      outsideMessage,
      agent,
      fallback,
      handoff,
      outsideEnd,
      answeredEnd,
      handoffEnd,
    ],
    edges: [
      edge(start, greeting),
      edge(greeting, officeHours),
      edge(officeHours, outsideMessage, "outside", "Outside"),
      edge(officeHours, agent, "inside", "Office Hour"),
      edge(outsideMessage, outsideEnd),
      edge(agent, answeredEnd, "answered", "Answered"),
      edge(agent, handoff, "needs_human", "Needs Human"),
      edge(agent, fallback, "not_found", "Data Not Found"),
      edge(agent, fallback, "error", "Provider Error"),
      edge(fallback, handoff),
      edge(handoff, handoffEnd),
    ],
    viewport: { x: 0, y: 0, zoom: 0.9 },
  };
}

export function getDraftConversationFlowGraph(flow: ConversationFlow) {
  return (
    flow.draftGraph ??
    flow.publishedGraph ??
    createDefaultConversationFlowGraph(flow)
  );
}

export function getPublishedConversationFlowGraph(flow: ConversationFlow) {
  // Legacy Published flows keep using the existing flat runtime until the
  // visual Draft is explicitly reviewed and published from the builder.
  return flow.publishedGraph ?? null;
}

function getOutgoingEdges(graph: ConversationFlowGraph, nodeId: string) {
  return graph.edges.filter((item) => item.source === nodeId);
}

function getNextEdge(
  graph: ConversationFlowGraph,
  nodeId: string,
  sourceHandle?: string,
) {
  const outgoing = getOutgoingEdges(graph, nodeId);
  if (sourceHandle) {
    return outgoing.find((item) => item.sourceHandle === sourceHandle);
  }

  return outgoing.find((item) => !item.sourceHandle) ?? outgoing[0];
}

function findCycle(graph: ConversationFlowGraph) {
  const visiting = new Set<string>();
  const visited = new Set<string>();

  const visit = (nodeId: string): boolean => {
    if (visiting.has(nodeId)) return true;
    if (visited.has(nodeId)) return false;

    visiting.add(nodeId);
    for (const item of getOutgoingEdges(graph, nodeId)) {
      if (visit(item.target)) return true;
    }
    visiting.delete(nodeId);
    visited.add(nodeId);
    return false;
  };

  return graph.nodes.some((item) => visit(item.id));
}

export function validateConversationFlowGraph(
  graph: ConversationFlowGraph,
  config?: DashboardConfig,
): FlowValidationResult {
  const errors: FlowValidationIssue[] = [];
  const warnings: FlowValidationIssue[] = [];
  const nodeIds = new Set(graph.nodes.map((item) => item.id));
  const startNodes = graph.nodes.filter((item) => item.type === "start");

  if (graph.nodes.length > MAX_FLOW_NODES) {
    errors.push({
      code: "too_many_nodes",
      message: `Maksimal ${MAX_FLOW_NODES} node.`,
      severity: "error",
    });
  }
  if (graph.edges.length > MAX_FLOW_EDGES) {
    errors.push({
      code: "too_many_edges",
      message: `Maksimal ${MAX_FLOW_EDGES} edge.`,
      severity: "error",
    });
  }
  if (nodeIds.size !== graph.nodes.length) {
    errors.push({
      code: "duplicate_node_id",
      message: "Terdapat node ID duplikat.",
      severity: "error",
    });
  }
  if (startNodes.length !== 1) {
    errors.push({
      code: "invalid_start_count",
      message: "Flow wajib memiliki tepat satu Start node.",
      severity: "error",
    });
  }

  for (const item of graph.edges) {
    if (!nodeIds.has(item.source) || !nodeIds.has(item.target)) {
      errors.push({
        code: "dangling_edge",
        message: `Edge ${item.id} tidak terhubung ke node yang valid.`,
        severity: "error",
      });
    }
  }

  for (const item of graph.nodes) {
    const outgoing = getOutgoingEdges(graph, item.id);
    if (item.type !== "end" && outgoing.length === 0) {
      errors.push({
        code: "dead_end",
        nodeId: item.id,
        message: `${item.data.label} belum memiliki jalur keluar.`,
        severity: "error",
      });
    }
    if (
      (item.type === "message" || item.type === "fallback") &&
      !item.data.message?.trim()
    ) {
      errors.push({
        code: "empty_message",
        nodeId: item.id,
        message: `${item.data.label} belum memiliki isi pesan.`,
        severity: "error",
      });
    }
    if (item.type === "office_hours") {
      for (const handle of ["inside", "outside"]) {
        if (!outgoing.some((out) => out.sourceHandle === handle)) {
          errors.push({
            code: "missing_condition_branch",
            nodeId: item.id,
            message: `Office Hours wajib memiliki jalur ${handle}.`,
            severity: "error",
          });
        }
      }
    }
    if (item.type === "ai_agent") {
      for (const handle of ["answered", "needs_human", "not_found", "error"]) {
        if (!outgoing.some((out) => out.sourceHandle === handle)) {
          errors.push({
            code: "missing_ai_branch",
            nodeId: item.id,
            message: `AI Agent wajib memiliki jalur ${handle}.`,
            severity: "error",
          });
        }
      }
      if (item.data.agentId && config) {
        const agent = config.automation.aiAgents.find(
          (candidate) => candidate.id === item.data.agentId,
        );
        if (!agent || agent.status !== "Active") {
          errors.push({
            code: "inactive_agent",
            nodeId: item.id,
            message: "AI Agent yang dipilih tidak tersedia atau belum Active.",
            severity: "error",
          });
        }
      }
    }
  }

  if (findCycle(graph)) {
    errors.push({
      code: "cycle_detected",
      message: "Cycle belum didukung pada MVP. Hapus jalur yang berulang.",
      severity: "error",
    });
  }

  if (startNodes.length === 1) {
    const reachable = new Set<string>();
    const queue = [startNodes[0].id];
    while (queue.length > 0) {
      const current = queue.shift();
      if (!current || reachable.has(current)) continue;
      reachable.add(current);
      queue.push(
        ...getOutgoingEdges(graph, current).map((item) => item.target),
      );
    }
    for (const item of graph.nodes) {
      if (!reachable.has(item.id)) {
        warnings.push({
          code: "unreachable_node",
          nodeId: item.id,
          message: `${item.data.label} tidak dapat dicapai dari Start.`,
          severity: "warning",
        });
      }
    }
  }

  if (
    config &&
    config.knowledgeBase.documents.length === 0 &&
    config.knowledgeBase.faqs.length === 0
  ) {
    warnings.push({
      code: "empty_knowledge",
      message: "Knowledge Base belum memiliki dokumen atau FAQ.",
      severity: "warning",
    });
  }

  return { valid: errors.length === 0, errors, warnings };
}

function parseHourMinute(label: string) {
  const match = label.match(/(\d{1,2})[:.](\d{2})/);
  return match ? Number(match[1]) * 60 + Number(match[2]) : null;
}

function getTimezoneMinutes(timezone: string, date: Date) {
  const formatter = new Intl.DateTimeFormat("en-GB", {
    timeZone: timezone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const parts = formatter.formatToParts(date);
  return (
    Number(parts.find((part) => part.type === "hour")?.value ?? "0") * 60 +
    Number(parts.find((part) => part.type === "minute")?.value ?? "0")
  );
}

export function isOutsideConfiguredBusinessHours(
  config: DashboardConfig,
  date = new Date(),
) {
  const ranges = config.workspace.businessHours.match(
    /\d{1,2}[:.]\d{2}\s*-\s*\d{1,2}[:.]\d{2}/g,
  );
  if (!ranges?.length) return false;

  const currentMinutes = getTimezoneMinutes(
    config.workspace.timezone || "Asia/Jakarta",
    date,
  );
  return !ranges.some((range) => {
    const [startLabel, endLabel] = range.split("-");
    const start = parseHourMinute(startLabel);
    const end = parseHourMinute(endLabel);
    if (start == null || end == null) return false;
    return end < start
      ? currentMinutes >= start || currentMinutes <= end
      : currentMinutes >= start && currentMinutes <= end;
  });
}

function executeGraphSegment(input: {
  graph: ConversationFlowGraph;
  config: DashboardConfig;
  startNodeId: string;
  now: Date;
  stopAtAi: boolean;
}): FlowPreAiResult {
  const { graph, config } = input;
  const nodes = new Map(graph.nodes.map((item) => [item.id, item]));
  const result: FlowPreAiResult = {
    messages: [],
    trace: [],
    graphReplyOnly: false,
    needsHuman: false,
  };
  let currentId: string | undefined = input.startNodeId;
  let stepCount = 0;

  while (currentId && stepCount < MAX_EXECUTION_STEPS) {
    stepCount += 1;
    const current = nodes.get(currentId);
    if (!current) {
      result.error = `Node ${currentId} tidak ditemukan.`;
      return result;
    }
    const trace: FlowTraceStep = {
      nodeId: current.id,
      nodeType: current.type,
      label: current.data.label,
    };
    result.trace.push(trace);

    if (current.type === "end") {
      result.graphReplyOnly = !result.aiNodeId;
      return result;
    }
    if (current.type === "message" || current.type === "fallback") {
      if (current.data.message?.trim())
        result.messages.push(current.data.message.trim());
      currentId = getNextEdge(graph, current.id)?.target;
      continue;
    }
    if (current.type === "office_hours") {
      const outcome = isOutsideConfiguredBusinessHours(config, input.now)
        ? "outside"
        : "inside";
      trace.outcome = outcome;
      currentId = getNextEdge(graph, current.id, outcome)?.target;
      continue;
    }
    if (current.type === "handoff") {
      result.needsHuman = true;
      result.handoffTarget =
        current.data.handoffTarget?.trim() ||
        config.automation.aiConfig.handoverTarget;
      result.handoffReason =
        current.data.handoffReason?.trim() ||
        "Conversation Flow meminta handoff.";
      if (current.data.message?.trim())
        result.messages.push(current.data.message.trim());
      currentId = getNextEdge(graph, current.id)?.target;
      continue;
    }
    if (current.type === "ai_agent" && input.stopAtAi) {
      result.aiNodeId = current.id;
      result.aiAgentId = current.data.agentId;
      return result;
    }

    currentId = getNextEdge(graph, current.id)?.target;
  }

  if (stepCount >= MAX_EXECUTION_STEPS) {
    result.error = "Flow dihentikan karena melebihi batas 50 langkah.";
  }
  result.graphReplyOnly = !result.aiNodeId;
  return result;
}

export function executeConversationFlowBeforeAi(input: {
  graph: ConversationFlowGraph;
  config: DashboardConfig;
  now?: Date;
}) {
  const start = input.graph.nodes.find((item) => item.type === "start");
  if (!start) {
    return {
      messages: [],
      trace: [],
      graphReplyOnly: true,
      needsHuman: false,
      error: "Start node tidak ditemukan.",
    } satisfies FlowPreAiResult;
  }

  return executeGraphSegment({
    graph: input.graph,
    config: input.config,
    startNodeId: start.id,
    now: input.now ?? new Date(),
    stopAtAi: true,
  });
}

export function getAiDecisionOutcome(decision: ReplyDecision) {
  if (decision.needsHuman || decision.status === "assigned_to_admin")
    return "needs_human";
  if (!decision.grounded && decision.source === "fallback") return "not_found";
  return "answered";
}

export function executeConversationFlowAfterAi(input: {
  graph: ConversationFlowGraph;
  config: DashboardConfig;
  aiNodeId: string;
  outcome: "answered" | "needs_human" | "not_found" | "error";
  now?: Date;
}): FlowPostAiResult {
  const next = getNextEdge(input.graph, input.aiNodeId, input.outcome);
  if (!next) {
    return {
      messages: [],
      trace: [],
      needsHuman: input.outcome === "needs_human",
      error: `Jalur ${input.outcome} dari AI Agent tidak ditemukan.`,
    };
  }

  const result = executeGraphSegment({
    graph: input.graph,
    config: input.config,
    startNodeId: next.target,
    now: input.now ?? new Date(),
    stopAtAi: false,
  });
  return {
    messages: result.messages,
    trace: result.trace,
    needsHuman: result.needsHuman,
    handoffTarget: result.handoffTarget,
    handoffReason: result.handoffReason,
    error: result.error,
  };
}

export function resolveGraphAgent(
  config: DashboardConfig,
  agentId?: string,
): AIAgent | null {
  if (agentId) {
    return (
      config.automation.aiAgents.find(
        (agent) => agent.id === agentId && agent.status === "Active",
      ) ?? null
    );
  }
  return (
    config.automation.aiAgents.find((agent) => agent.status === "Active") ??
    null
  );
}

export function deriveLegacyFieldsFromGraph(
  flow: ConversationFlow,
  graph: ConversationFlowGraph,
): ConversationFlow {
  const start = graph.nodes.find((item) => item.type === "start");
  const greeting = graph.nodes.find((item) => item.type === "message");
  const fallback = graph.nodes.find((item) => item.type === "fallback");
  const agent = graph.nodes.find((item) => item.type === "ai_agent");
  const handoff = graph.nodes.find((item) => item.type === "handoff");

  return {
    ...flow,
    normalizedTrigger: start?.data.trigger ?? flow.normalizedTrigger,
    triggerKeywords: start?.data.triggerKeywords ?? flow.triggerKeywords,
    initialMessage: greeting?.data.message ?? flow.initialMessage,
    fallbackMessage: fallback?.data.message ?? flow.fallbackMessage,
    aiAgentId: agent?.data.agentId ?? flow.aiAgentId,
    humanAgentHandoff: {
      enabled: Boolean(handoff),
      condition:
        handoff?.data.handoffReason ?? flow.humanAgentHandoff.condition,
    },
  };
}
