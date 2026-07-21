import { getConversationFlowRecord } from "@/server/repositories/conversation-flow-repository";
import {
  getDraftConversationFlowGraph,
  validateConversationFlowGraph,
} from "@/server/services/conversation-flow-service";
import { jsonError, jsonOk, requireApiSession } from "@/server/http";
import type { ConversationFlowGraph } from "@/types/dashboard-config";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { response } = await requireApiSession();
  if (response) return response;

  const { id } = await context.params;
  const record = await getConversationFlowRecord(id);
  if (!record) return jsonError("Conversation Flow tidak ditemukan.", 404);
  const body = (await request.json().catch(() => ({}))) as {
    graph?: ConversationFlowGraph;
  };
  const graph = body.graph ?? getDraftConversationFlowGraph(record.flow);
  return jsonOk(validateConversationFlowGraph(graph, record.config));
}
