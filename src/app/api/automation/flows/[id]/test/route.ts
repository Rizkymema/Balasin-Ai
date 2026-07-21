import {
  getConversationFlowRecord,
  markConversationFlowTested,
} from "@/server/repositories/conversation-flow-repository";
import {
  executeConversationFlowAfterAi,
  executeConversationFlowBeforeAi,
  getAiDecisionOutcome,
  getDraftConversationFlowGraph,
  resolveGraphAgent,
  validateConversationFlowGraph,
} from "@/server/services/conversation-flow-service";
import { buildEffectiveReplyConfig } from "@/server/services/automation-orchestrator";
import {
  generateReplyDecision,
  type ReplyContext,
  type ReplyDecision,
} from "@/server/services/reply-engine";
import { jsonError, jsonOk, requireApiSession } from "@/server/http";
import type { ConversationFlowGraph } from "@/types/dashboard-config";

function sanitizeContext(context?: ReplyContext): ReplyContext | undefined {
  if (!context) return undefined;
  return {
    recentMessages: Array.isArray(context.recentMessages)
      ? context.recentMessages.slice(-12).map((item) => ({
          sender: item.sender,
          text: item.text.trim().slice(0, 2_000),
        }))
      : undefined,
    lastIntent: context.lastIntent?.trim().slice(0, 200),
    summary: context.summary?.trim().slice(0, 2_000),
  };
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { response } = await requireApiSession();
  if (response) return response;

  try {
    const { id } = await context.params;
    const record = await getConversationFlowRecord(id);
    if (!record) return jsonError("Conversation Flow tidak ditemukan.", 404);
    const body = (await request.json()) as {
      message?: string;
      nowIso?: string;
      graph?: ConversationFlowGraph;
      context?: ReplyContext;
    };
    if (!body.message?.trim()) {
      return jsonError("Pesan simulasi wajib diisi.", 400);
    }

    const graph = body.graph ?? getDraftConversationFlowGraph(record.flow);
    const validation = validateConversationFlowGraph(graph, record.config);
    if (!validation.valid) {
      return jsonError(
        "Perbaiki error flow sebelum menjalankan test.",
        422,
        validation.errors,
      );
    }

    const now = body.nowIso ? new Date(body.nowIso) : new Date();
    const safeNow = Number.isNaN(now.getTime()) ? new Date() : now;
    const beforeAi = executeConversationFlowBeforeAi({
      graph,
      config: record.config,
      now: safeNow,
    });
    let decision: ReplyDecision | null = null;
    let afterAi = null as ReturnType<
      typeof executeConversationFlowAfterAi
    > | null;

    if (beforeAi.aiNodeId) {
      const agent = resolveGraphAgent(record.config, beforeAi.aiAgentId);
      const effectiveConfig = buildEffectiveReplyConfig(record.config, agent);
      try {
        decision = await generateReplyDecision(
          body.message.trim(),
          effectiveConfig,
          sanitizeContext(body.context),
        );
        afterAi = executeConversationFlowAfterAi({
          graph,
          config: effectiveConfig,
          aiNodeId: beforeAi.aiNodeId,
          outcome: getAiDecisionOutcome(decision),
          now: safeNow,
        });
      } catch (error) {
        afterAi = executeConversationFlowAfterAi({
          graph,
          config: effectiveConfig,
          aiNodeId: beforeAi.aiNodeId,
          outcome: "error",
          now: safeNow,
        });
        if (!afterAi.error) {
          afterAi.error =
            error instanceof Error ? error.message : "AI provider gagal.";
        }
      }
    }

    const outcome = decision ? getAiDecisionOutcome(decision) : null;
    const aiReply =
      outcome === "answered" ? (decision?.reply?.trim() ?? "") : "";
    const messages = [
      ...beforeAi.messages,
      ...(aiReply ? [aiReply] : []),
      ...(afterAi?.messages ?? []),
    ];

    await markConversationFlowTested({ flowId: id, graph });
    return jsonOk({
      sandbox: true,
      messages,
      validation,
      decision,
      outcome,
      trace: [...beforeAi.trace, ...(afterAi?.trace ?? [])],
      needsHuman: beforeAi.needsHuman || Boolean(afterAi?.needsHuman),
      handoffTarget: afterAi?.handoffTarget ?? beforeAi.handoffTarget,
      error: beforeAi.error ?? afterAi?.error,
    });
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "Test Flow gagal.",
      500,
    );
  }
}
