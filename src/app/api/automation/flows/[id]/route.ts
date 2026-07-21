import { getConversationFlowRecord } from "@/server/repositories/conversation-flow-repository";
import { getDraftConversationFlowGraph } from "@/server/services/conversation-flow-service";
import { jsonError, jsonOk, requireApiSession } from "@/server/http";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { response } = await requireApiSession();
  if (response) return response;

  const { id } = await context.params;
  const record = await getConversationFlowRecord(id);
  if (!record) return jsonError("Conversation Flow tidak ditemukan.", 404);

  return jsonOk({
    flow: record.flow,
    graph: getDraftConversationFlowGraph(record.flow),
    agents: record.config.automation.aiAgents,
    workspace: {
      timezone: record.config.workspace.timezone,
      businessHours: record.config.workspace.businessHours,
    },
    knowledge: {
      documents: record.config.knowledgeBase.documents.filter(
        (item) => item.status === "ready",
      ).length,
      faqs: record.config.knowledgeBase.faqs.length,
    },
  });
}
