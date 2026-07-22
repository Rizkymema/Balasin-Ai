import { randomUUID } from "node:crypto";

import type {
  AIAgent,
  ConversationFlow,
  ConversationFlowTrigger,
  DashboardConfig,
} from "@/types/dashboard-config";
import type {
  AutomationRuntimeEvent,
  ChannelKind,
  ConversationFlowFormSession,
  ConversationRecord,
  ConversationStatus,
} from "@/types/operations";
import { enqueueJob } from "@/server/repositories/job-repository";
import {
  executeConversationFlowBeforeAi,
  getPublishedConversationFlowGraph,
  resumeConversationFlowForm,
  type FlowPreAiResult,
} from "@/server/services/conversation-flow-service";
import type { ConversationFlowGraph } from "@/types/dashboard-config";

type InboundAutomationInput = {
  channel: ChannelKind;
  messageText: string;
  nowIso: string;
  existingConversation: ConversationRecord | null;
};

type InboundAutomationResolution = {
  flow: ConversationFlow | null;
  agent: AIAgent | null;
  effectiveConfig: DashboardConfig;
  immediateReply?: string;
  forcedStatus?: ConversationStatus;
  handoffReason?: string;
  tagsToAdd: string[];
  graph?: ConversationFlowGraph;
  graphBeforeAi?: FlowPreAiResult;
};

const ADMIN_REQUEST_KEYWORDS = [
  "admin",
  "cs",
  "customer service",
  "orang",
  "human",
  "operator",
  "staff",
  "agent",
];

const BOOKING_KEYWORDS = [
  "booking",
  "jadwal",
  "service",
  "servis",
  "reservasi",
];
const HIGH_RISK_KEYWORDS = [
  "komplain",
  "garansi",
  "darurat",
  "urgent",
  "marah",
  "kecewa",
  "viral",
];

function normalizeText(input: string) {
  return input.toLowerCase().replace(/\s+/g, " ").trim();
}

function includesAnyKeyword(input: string, keywords: string[]) {
  const normalized = normalizeText(input);
  return keywords.some((keyword) =>
    normalized.includes(normalizeText(keyword)),
  );
}

function normalizeFlowTrigger(flow: ConversationFlow): ConversationFlowTrigger {
  if (flow.normalizedTrigger) {
    return flow.normalizedTrigger;
  }

  const trigger = normalizeText(flow.trigger);

  if (trigger.includes("luar jam")) {
    return "outside_office_hours";
  }

  if (trigger.includes("keyword")) {
    return "keyword_match";
  }

  if (trigger.includes("admin")) {
    return "customer_asks_admin";
  }

  if (trigger.includes("booking")) {
    return "booking_intent";
  }

  if (trigger.includes("high risk") || trigger.includes("komplain")) {
    return "high_risk";
  }

  return "first_incoming_message";
}

function toComparableChannel(channel: string) {
  const normalized = normalizeText(channel);

  if (normalized.includes("whatsapp")) {
    return "whatsapp";
  }

  if (normalized.includes("instagram")) {
    return "instagram";
  }

  if (normalized.includes("website") || normalized.includes("webchat")) {
    return "webchat";
  }

  return normalized;
}

const AUTOMATION_READY_CHANNEL_STATUSES = new Set([
  "connected",
  "testing",
]);

export function isChannelAutomationEnabled(
  config: DashboardConfig,
  channel: ChannelKind,
) {
  switch (channel) {
    case "WhatsApp":
      return (
        config.channels.whatsapp.autoReply &&
        ((config.channels.whatsapp.enabled &&
          AUTOMATION_READY_CHANNEL_STATUSES.has(config.channels.whatsapp.status)) ||
          config.channels.whatsapp.qrSessions?.some(
            (session) => session.status === "connected",
          ) === true)
      );
    case "Instagram DM":
      return (
        config.channels.instagram.enabled &&
        config.channels.instagram.autoReplyDm &&
        AUTOMATION_READY_CHANNEL_STATUSES.has(config.channels.instagram.status)
      );
    case "Instagram Comment":
      return (
        config.channels.instagram.enabled &&
        config.channels.instagram.commentGuard &&
        AUTOMATION_READY_CHANNEL_STATUSES.has(config.channels.instagram.status)
      );
    case "Website Chat":
      return (
        config.channels.webchat.enabled &&
        AUTOMATION_READY_CHANNEL_STATUSES.has(config.channels.webchat.status)
      );
    default:
      return false;
  }
}

function conversationChannelMatches(
  flow: ConversationFlow,
  channel: ChannelKind,
) {
  const flowChannel = toComparableChannel(flow.channel);
  const conversationChannel = toComparableChannel(channel);

  if (
    flowChannel === "all" ||
    flowChannel === "all channels" ||
    flowChannel === "semua channel"
  ) {
    return true;
  }

  if (flowChannel === conversationChannel) {
    return true;
  }

  if (conversationChannel === "instagram" && flowChannel === "instagram") {
    return true;
  }

  return false;
}

function parseHourMinuteLabel(label: string) {
  const match = label.match(/(\d{1,2})[:.](\d{2})/);
  if (!match) {
    return null;
  }

  return Number(match[1]) * 60 + Number(match[2]);
}

function getTimezoneMinutes(timezone: string, date: Date) {
  const formatter = new Intl.DateTimeFormat("en-GB", {
    timeZone: timezone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const parts = formatter.formatToParts(date);
  const hour = Number(parts.find((part) => part.type === "hour")?.value ?? "0");
  const minute = Number(
    parts.find((part) => part.type === "minute")?.value ?? "0",
  );
  return hour * 60 + minute;
}

function isOutsideBusinessHours(config: DashboardConfig, date = new Date()) {
  const businessHours = config.workspace.businessHours.trim();
  if (!businessHours) {
    return false;
  }

  const ranges = businessHours.match(
    /\d{1,2}[:.]\d{2}\s*-\s*\d{1,2}[:.]\d{2}/g,
  );
  if (!ranges || ranges.length === 0) {
    return false;
  }

  const timezone = config.workspace.timezone || "Asia/Jakarta";
  const currentMinutes = getTimezoneMinutes(timezone, date);

  return !ranges.some((range) => {
    const [startRaw, endRaw] = range.split("-");
    const start = parseHourMinuteLabel(startRaw);
    const end = parseHourMinuteLabel(endRaw);

    if (start == null || end == null) {
      return false;
    }

    if (end < start) {
      return currentMinutes >= start || currentMinutes <= end;
    }

    return currentMinutes >= start && currentMinutes <= end;
  });
}

function matchFlowByTrigger(
  flow: ConversationFlow,
  input: InboundAutomationInput,
  config: DashboardConfig,
) {
  const normalizedMessage = normalizeText(input.messageText);
  const trigger = normalizeFlowTrigger(flow);

  switch (trigger) {
    case "outside_office_hours":
      return isOutsideBusinessHours(config, new Date(input.nowIso));
    case "keyword_match": {
      const keywords =
        flow.triggerKeywords?.filter(Boolean) ??
        flow.interactiveMenu.map((item) => item.label).filter(Boolean);
      return includesAnyKeyword(normalizedMessage, keywords);
    }
    case "customer_asks_admin":
      return includesAnyKeyword(normalizedMessage, ADMIN_REQUEST_KEYWORDS);
    case "booking_intent":
      return includesAnyKeyword(normalizedMessage, BOOKING_KEYWORDS);
    case "high_risk":
      return includesAnyKeyword(normalizedMessage, HIGH_RISK_KEYWORDS);
    case "first_incoming_message":
    default:
      return !input.existingConversation;
  }
}

function selectAutomationFlow(
  config: DashboardConfig,
  input: InboundAutomationInput,
) {
  const flows = config.automation.conversations.filter(
    (flow) =>
      flow.status === "Published" &&
      conversationChannelMatches(flow, input.channel),
  );

  const activeFormFlowId =
    input.existingConversation?.automation?.formSession?.flowId;
  if (activeFormFlowId) {
    const activeFormFlow = flows.find((flow) => flow.id === activeFormFlowId);
    if (activeFormFlow) return activeFormFlow;
  }

  const priority: ConversationFlowTrigger[] = [
    "customer_asks_admin",
    "high_risk",
    "outside_office_hours",
    "booking_intent",
    "keyword_match",
    "first_incoming_message",
  ];

  const ordered = flows.sort(
    (left, right) =>
      priority.indexOf(normalizeFlowTrigger(left)) -
      priority.indexOf(normalizeFlowTrigger(right)),
  );

  return (
    ordered.find((flow) => matchFlowByTrigger(flow, input, config)) ?? null
  );
}

function agentMatchesChannel(agent: AIAgent, channel: ChannelKind) {
  if (agent.status !== "Active") {
    return false;
  }

  const usage = toComparableChannel(agent.channelUsage);
  const target = toComparableChannel(channel);

  return (
    usage === target || usage === "not connected" || usage.includes(target)
  );
}

function selectAutomationAgent(
  config: DashboardConfig,
  channel: ChannelKind,
  flow: ConversationFlow | null,
  graphAgentId?: string,
) {
  const activeAgents = config.automation.aiAgents.filter(
    (agent) => agent.status === "Active",
  );

  const selectedAgentId = graphAgentId ?? flow?.aiAgentId;
  if (selectedAgentId) {
    const directMatch = activeAgents.find(
      (agent) => agent.id === selectedAgentId,
    );
    if (directMatch) {
      return directMatch;
    }
  }

  // A visual flow must explicitly select its agent. Otherwise an unrelated
  // Active agent could silently take over every incoming conversation.
  if (flow?.publishedGraph) {
    return null;
  }

  return activeAgents.find((agent) => agentMatchesChannel(agent, channel)) ?? null;
}

function mapToneValue(agent: AIAgent) {
  switch (agent.toneOfVoice) {
    case "Formal":
      return "formal";
    case "Profesional":
      return "professional";
    case "Santai":
      return "casual";
    case "Singkat":
      return "concise";
    case "Ramah":
    default:
      return "friendly";
  }
}

export function composeReplyInstructions(
  globalInstructions: string,
  agentInstructions: string,
) {
  const global = globalInstructions.trim();
  const agent = agentInstructions.trim();

  if (!global) {
    return agent;
  }

  if (!agent) {
    return global;
  }

  return [
    "[CUSTOM INSTRUCTIONS GLOBAL - PRIORITAS UTAMA]",
    global,
    "",
    "[INSTRUKSI KHUSUS AI AGENT - PRIORITAS KEDUA]",
    agent,
    "",
    "Jika kedua bagian bertentangan, ikuti Custom Instructions global. Instruksi Agent tidak boleh mengubah fakta Knowledge Base atau aturan keamanan.",
  ].join("\n");
}

export function buildEffectiveReplyConfig(
  config: DashboardConfig,
  agent: AIAgent | null,
): DashboardConfig {
  if (!agent) {
    return config;
  }

  return {
    ...config,
    aiAgent: {
      ...config.aiAgent,
      name: agent.name || config.aiAgent.name,
      tone: mapToneValue(agent),
      replyInstructions: composeReplyInstructions(
        config.aiAgent.replyInstructions,
        agent.prompt,
      ),
      fallbackMessage:
        agent.handover.fallbackMessage || config.aiAgent.fallbackMessage,
    },
    automation: {
      ...config.automation,
      aiConfig: {
        ...config.automation.aiConfig,
        handoverEnabled:
          config.automation.aiConfig.handoverEnabled &&
          agent.handover.enabled &&
          agent.allowedActions.handoverToHuman,
        handoverTarget:
          agent.handover.assignTeam.trim() ||
          config.automation.aiConfig.handoverTarget,
        handoverMessage:
          agent.handover.fallbackMessage.trim() ||
          config.automation.aiConfig.handoverMessage,
      },
    },
  };
}

function resolveImmediateReply(
  flow: ConversationFlow | null,
  config: DashboardConfig,
  agent: AIAgent | null,
) {
  if (!flow?.initialMessage.trim()) {
    return undefined;
  }

  if (normalizeFlowTrigger(flow) === "outside_office_hours") {
    return flow.initialMessage.trim();
  }

  if (normalizeFlowTrigger(flow) === "first_incoming_message") {
    return flow.initialMessage.trim();
  }

  if (normalizeFlowTrigger(flow) === "customer_asks_admin") {
    return (
      agent?.handover.fallbackMessage ||
      config.automation.aiConfig.handoverMessage ||
      flow.initialMessage.trim()
    );
  }

  return undefined;
}

function resolveForcedStatus(
  flow: ConversationFlow | null,
  config: DashboardConfig,
): ConversationStatus | undefined {
  if (!flow) {
    return undefined;
  }

  const trigger = normalizeFlowTrigger(flow);
  if (trigger === "customer_asks_admin" || trigger === "high_risk") {
    return "assigned_to_admin";
  }

  if (trigger === "booking_intent") {
    return "waiting_customer";
  }

  if (trigger === "outside_office_hours" && !config.aiAgent.autoReplyEnabled) {
    return "waiting_customer";
  }

  return undefined;
}

export function resolveInboundAutomation(
  config: DashboardConfig,
  input: InboundAutomationInput,
): InboundAutomationResolution {
  const flow = selectAutomationFlow(config, input);
  const graph = flow ? getPublishedConversationFlowGraph(flow) : null;
  const activeFormSession = input.existingConversation?.automation?.formSession;
  const graphBeforeAi = graph
    ? activeFormSession && activeFormSession.flowId === flow?.id
      ? resumeConversationFlowForm({
          graph,
          config,
        state: {
          nodeId: activeFormSession.nodeId,
          mode: activeFormSession.mode,
          fieldIndex: activeFormSession.fieldIndex,
          values: activeFormSession.values,
        },
          answer: input.messageText,
          now: new Date(input.nowIso),
        })
      : executeConversationFlowBeforeAi({
          graph,
          config,
          now: new Date(input.nowIso),
        })
    : null;
  const graphAgent = graphBeforeAi?.aiAgentId
    ? (config.automation.aiAgents.find(
        (item) =>
          item.id === graphBeforeAi.aiAgentId && item.status === "Active",
      ) ?? null)
    : null;
  const agent =
    graphAgent ??
    selectAutomationAgent(
      config,
      input.channel,
      flow,
      graphBeforeAi?.aiAgentId,
    );
  const effectiveConfig = buildEffectiveReplyConfig(config, agent);
  const tagsToAdd: string[] = [];

  if (flow && normalizeFlowTrigger(flow) === "booking_intent") {
    tagsToAdd.push("booking_intent");
  }

  if (flow && normalizeFlowTrigger(flow) === "high_risk") {
    tagsToAdd.push("high_risk");
  }

  const legacyForcedStatus = resolveForcedStatus(flow, config);
  const forcedStatus = graphBeforeAi?.needsHuman
    ? "assigned_to_admin"
    : legacyForcedStatus;
  const immediateReply = graph
    ? graphBeforeAi?.graphReplyOnly
      ? graphBeforeAi.messages.join("\n\n")
      : undefined
    : resolveImmediateReply(flow, config, agent);

  return {
    flow,
    agent,
    effectiveConfig,
    immediateReply,
    forcedStatus,
    handoffReason:
      forcedStatus === "assigned_to_admin"
        ? graphBeforeAi?.handoffReason ||
          flow?.humanAgentHandoff.condition ||
          "Automation meminta handoff ke admin."
        : undefined,
    tagsToAdd,
    graph: graph ?? undefined,
    graphBeforeAi: graphBeforeAi ?? undefined,
  };
}

export function appendAutomationLog(
  conversation: ConversationRecord,
  input: {
    event: AutomationRuntimeEvent;
    summary: string;
    status: "applied" | "queued" | "skipped" | "failed";
    createdAt?: string;
  },
) {
  const logs = conversation.automation?.logs ?? [];
  const nextLogs = [
    {
      id: randomUUID(),
      event: input.event,
      summary: input.summary,
      status: input.status,
      createdAt: input.createdAt ?? new Date().toISOString(),
    },
    ...logs,
  ].slice(0, 12);

  return {
    ...conversation,
    automation: {
      activeFlowId: null,
      activeFlowName: null,
      activeAgentId: null,
      activeAgentName: null,
      aiReplyCount: 0,
      lastInboundAt: null,
      lastOutboundAt: null,
      lastHumanReplyAt: null,
      idleCheckAt: null,
      handoffReason: null,
      lastEvent: null,
      ...(conversation.automation ?? {}),
      logs: nextLogs,
    },
  } satisfies ConversationRecord;
}

export function applyAutomationMetadata(
  conversation: ConversationRecord,
  input: {
    event: AutomationRuntimeEvent;
    flow?: ConversationFlow | null;
    agent?: AIAgent | null;
    lastInboundAt?: string | null;
    lastOutboundAt?: string | null;
    lastHumanReplyAt?: string | null;
    handoffReason?: string | null;
    incrementAiReplyCount?: boolean;
    resetAiReplyCount?: boolean;
    idleCheckAt?: string | null;
    formSession?: ConversationFlowFormSession | null;
  },
) {
  const current = conversation.automation ?? {
    activeFlowId: null,
    activeFlowName: null,
    activeAgentId: null,
    activeAgentName: null,
    aiReplyCount: 0,
    lastInboundAt: null,
    lastOutboundAt: null,
    lastHumanReplyAt: null,
    idleCheckAt: null,
    handoffReason: null,
    lastEvent: null,
    logs: [],
  };

  return {
    ...conversation,
    automation: {
      ...current,
      activeFlowId: input.flow?.id ?? current.activeFlowId,
      activeFlowName: input.flow?.name ?? current.activeFlowName,
      activeAgentId: input.agent?.id ?? current.activeAgentId,
      activeAgentName: input.agent?.name ?? current.activeAgentName,
      aiReplyCount: input.resetAiReplyCount
        ? 0
        : input.incrementAiReplyCount
          ? current.aiReplyCount + 1
          : current.aiReplyCount,
      lastInboundAt: input.lastInboundAt ?? current.lastInboundAt,
      lastOutboundAt: input.lastOutboundAt ?? current.lastOutboundAt,
      lastHumanReplyAt: input.lastHumanReplyAt ?? current.lastHumanReplyAt,
      idleCheckAt: input.idleCheckAt ?? current.idleCheckAt,
      handoffReason:
        input.handoffReason === undefined
          ? current.handoffReason
          : input.handoffReason,
      formSession:
        input.formSession === undefined
          ? current.formSession
          : input.formSession,
      lastEvent: input.event,
      logs: current.logs,
    },
  } satisfies ConversationRecord;
}

export async function scheduleAutomationForConversationEvent(input: {
  config: DashboardConfig;
  conversation: ConversationRecord;
  event: AutomationRuntimeEvent;
}) {
  const jobs: Array<Promise<unknown>> = [];

  if (input.config.automation.idleAction.enabled) {
    const timeoutHours =
      input.config.automation.idleAction.idleTimeoutUnit === "days"
        ? input.config.automation.idleAction.idleTimeout * 24
        : input.config.automation.idleAction.idleTimeout;
    jobs.push(
      enqueueJob({
        type: "conversation_idle_check",
        payload: {
          conversationId: input.conversation.id,
        },
        runAt: new Date(
          Date.now() + timeoutHours * 60 * 60 * 1000,
        ).toISOString(),
      }),
    );
  }

  if (
    input.config.automation.crmIntegration.enabled &&
    [
      "message_received",
      "ticket_created",
      "booking_created",
      "conversation_status_changed",
      "conversation_resolved",
    ].includes(input.event)
  ) {
    jobs.push(
      enqueueJob({
        type: "crm_sync",
        payload: {
          conversationId: input.conversation.id,
          trigger: input.config.automation.crmIntegration.syncTrigger,
          event: input.event,
        },
      }),
    );
  }

  const activeAgent = input.config.automation.aiAgents.find(
    (agent) => agent.id === input.conversation.automation?.activeAgentId,
  );
  const agentAllowsApi = activeAgent
    ? activeAgent.allowedActions.sendToApi
    : true;
  const activeApiIntegration = input.config.automation.apiIntegrations.find(
    (integration) =>
      integration.status === "Active" && integration.endpoint.trim(),
  );
  if (
    activeApiIntegration &&
    agentAllowsApi &&
    !activeApiIntegration.responseMapping.trim()
  ) {
    jobs.push(
      enqueueJob({
        type: "api_integration_call",
        payload: {
          conversationId: input.conversation.id,
          integrationId: activeApiIntegration.id,
          event: input.event,
        },
      }),
    );
  }

  await Promise.allSettled(jobs);
}
