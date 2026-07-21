import {
  getDashboardConfigRecord,
  saveDashboardConfigRecord,
} from "@/server/repositories/dashboard-repository";
import {
  createDefaultConversationFlowGraph,
  deriveLegacyFieldsFromGraph,
  getDraftConversationFlowGraph,
  validateConversationFlowGraph,
} from "@/server/services/conversation-flow-service";
import type {
  ConversationFlow,
  ConversationFlowGraph,
  DashboardConfig,
} from "@/types/dashboard-config";

function formatLastUpdate() {
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

async function updateFlow(
  flowId: string,
  updater: (
    flow: ConversationFlow,
    config: DashboardConfig,
  ) => ConversationFlow,
) {
  const config = await getDashboardConfigRecord();
  const existing = config.automation.conversations.find(
    (flow) => flow.id === flowId,
  );
  if (!existing) return null;

  const flow = updater(existing, config);
  await saveDashboardConfigRecord({
    ...config,
    automation: {
      ...config.automation,
      conversations: config.automation.conversations.map((item) =>
        item.id === flowId ? flow : item,
      ),
    },
  });
  return flow;
}

export async function getConversationFlowRecord(flowId: string) {
  const config = await getDashboardConfigRecord();
  const flow = config.automation.conversations.find(
    (item) => item.id === flowId,
  );
  return flow ? { flow, config } : null;
}

export async function saveConversationFlowDraft(input: {
  flowId: string;
  graph: ConversationFlowGraph;
  expectedRevision?: number;
  name?: string;
  channel?: string;
}) {
  let conflict = false;
  const flow = await updateFlow(input.flowId, (existing) => {
    const currentRevision =
      existing.draftRevision ?? existing.publishedRevision ?? 0;
    if (
      input.expectedRevision != null &&
      input.expectedRevision !== currentRevision
    ) {
      conflict = true;
      return existing;
    }

    return {
      ...existing,
      name: input.name?.trim() || existing.name,
      channel: input.channel?.trim() || existing.channel,
      draftGraph: input.graph,
      draftRevision: currentRevision + 1,
      hasUnpublishedChanges: true,
      lastUpdate: formatLastUpdate(),
    };
  });

  return { flow, conflict };
}

export async function initializeConversationFlowDraft(flowId: string) {
  return updateFlow(flowId, (existing) => {
    if (existing.draftGraph) return existing;
    const graph =
      existing.publishedGraph ?? createDefaultConversationFlowGraph(existing);
    return {
      ...existing,
      draftGraph: graph,
      draftRevision: existing.publishedRevision ?? 1,
      hasUnpublishedChanges: !existing.publishedGraph,
    };
  });
}

export async function markConversationFlowTested(input: {
  flowId: string;
  graph: ConversationFlowGraph;
}) {
  return updateFlow(input.flowId, (existing) => ({
    ...existing,
    draftGraph: input.graph,
    lastTestedRevision:
      existing.draftRevision ?? existing.publishedRevision ?? 1,
  }));
}

export async function publishConversationFlow(flowId: string) {
  let validation = null as ReturnType<
    typeof validateConversationFlowGraph
  > | null;
  const flow = await updateFlow(flowId, (existing, config) => {
    const graph = getDraftConversationFlowGraph(existing);
    validation = validateConversationFlowGraph(graph, config);
    if (!validation.valid) return existing;

    const publishedRevision = (existing.publishedRevision ?? 0) + 1;
    return deriveLegacyFieldsFromGraph(
      {
        ...existing,
        status: "Published",
        draftGraph: graph,
        publishedGraph: graph,
        draftRevision: publishedRevision,
        publishedRevision,
        hasUnpublishedChanges: false,
        publishedAt: new Date().toISOString(),
        lastUpdate: formatLastUpdate(),
      },
      graph,
    );
  });

  return { flow, validation };
}

export async function setConversationFlowActive(
  flowId: string,
  active: boolean,
) {
  let validation = null as ReturnType<
    typeof validateConversationFlowGraph
  > | null;
  let error: string | null = null;
  const flow = await updateFlow(flowId, (existing, config) => {
    if (!active) {
      return {
        ...existing,
        status: "Inactive",
        lastUpdate: formatLastUpdate(),
      };
    }

    if (!existing.publishedGraph) {
      error = "Flow belum pernah dipublish. Test dan Publish flow terlebih dahulu.";
      return existing;
    }

    validation = validateConversationFlowGraph(existing.publishedGraph, config);
    if (!validation.valid) {
      error = "Versi Published flow sudah tidak valid dan tidak dapat diaktifkan.";
      return existing;
    }

    return {
      ...existing,
      status: "Published",
      lastUpdate: formatLastUpdate(),
    };
  });

  return { flow, validation, error };
}

export async function discardConversationFlowDraft(flowId: string) {
  return updateFlow(flowId, (existing) => {
    const graph =
      existing.publishedGraph ?? createDefaultConversationFlowGraph(existing);
    return {
      ...existing,
      draftGraph: graph,
      draftRevision: existing.publishedRevision ?? 1,
      hasUnpublishedChanges: false,
      lastUpdate: formatLastUpdate(),
    };
  });
}
