import { discardConversationFlowDraft } from "@/server/repositories/conversation-flow-repository";
import { getDraftConversationFlowGraph } from "@/server/services/conversation-flow-service";
import { jsonError, jsonOk, requireApiSession } from "@/server/http";

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { response } = await requireApiSession();
  if (response) return response;

  const { id } = await context.params;
  const flow = await discardConversationFlowDraft(id);
  if (!flow) return jsonError("Conversation Flow tidak ditemukan.", 404);
  return jsonOk({ flow, graph: getDraftConversationFlowGraph(flow) });
}
