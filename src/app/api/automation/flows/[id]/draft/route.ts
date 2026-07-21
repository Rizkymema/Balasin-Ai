import {
  getConversationFlowRecord,
  saveConversationFlowDraft,
} from "@/server/repositories/conversation-flow-repository";
import { validateConversationFlowGraph } from "@/server/services/conversation-flow-service";
import { jsonError, jsonOk, requireApiSession } from "@/server/http";
import type { ConversationFlowGraph } from "@/types/dashboard-config";

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { response } = await requireApiSession();
  if (response) return response;

  try {
    const { id } = await context.params;
    const body = (await request.json()) as {
      graph?: ConversationFlowGraph;
      expectedRevision?: number;
      name?: string;
      channel?: string;
    };
    if (!body.graph?.nodes || !body.graph?.edges) {
      return jsonError("Graph Draft tidak valid.", 400);
    }

    const result = await saveConversationFlowDraft({
      flowId: id,
      graph: body.graph,
      expectedRevision: body.expectedRevision,
      name: body.name,
      channel: body.channel,
    });
    if (!result.flow)
      return jsonError("Conversation Flow tidak ditemukan.", 404);
    if (result.conflict) {
      return jsonError(
        "Draft sudah berubah di tab lain. Muat ulang sebelum menyimpan.",
        409,
      );
    }

    const record = await getConversationFlowRecord(id);
    return jsonOk({
      flow: result.flow,
      graph: result.flow.draftGraph,
      validation: validateConversationFlowGraph(body.graph, record?.config),
    });
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "Gagal menyimpan Draft.",
      500,
    );
  }
}
