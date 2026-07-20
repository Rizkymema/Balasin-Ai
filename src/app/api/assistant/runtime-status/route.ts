import {
  getDashboardConfigRecord,
  getDashboardOperationsRecord,
  getKnowledgeChunks,
} from "@/server/repositories/dashboard-repository";
import { jsonOk, requireApiSession } from "@/server/http";

export const dynamic = "force-dynamic";

export async function GET() {
  const { response } = await requireApiSession();
  if (response) {
    return response;
  }

  const [config, operations, chunks] = await Promise.all([
    getDashboardConfigRecord(),
    getDashboardOperationsRecord(),
    getKnowledgeChunks(),
  ]);
  const readyDocuments = config.knowledgeBase.documents.filter(
    (document) => document.status === "ready",
  );
  const lastKnowledgeSyncAt = readyDocuments
    .map((document) => document.syncedAt)
    .filter((value): value is string => Boolean(value))
    .sort()
    .at(-1) ?? null;

  return jsonOk({
    connected: config.aiAgent.autoReplyEnabled,
    conversations: operations.conversations.length,
    activeAiAgents: config.automation.aiAgents.filter(
      (agent) => agent.status === "Active",
    ).length,
    customInstructionsApplied: Boolean(
      config.aiAgent.replyInstructions.trim(),
    ),
    faqs: config.knowledgeBase.faqs.length,
    documents: readyDocuments.length,
    chunks: chunks.length,
    lastKnowledgeSyncAt,
  });
}
