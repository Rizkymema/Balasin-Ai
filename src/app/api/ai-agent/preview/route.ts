import { jsonError, jsonOk, requireApiSession } from "@/server/http";
import { getDashboardConfigRecord } from "@/server/repositories/dashboard-repository";
import { buildEffectiveReplyConfig } from "@/server/services/automation-orchestrator";
import { generateReplyDecision, type ReplyContext } from "@/server/services/reply-engine";

const MAX_PREVIEW_MESSAGE_LENGTH = 4_000;
const MAX_CONTEXT_MESSAGES = 12;

function sanitizeContext(context?: ReplyContext): ReplyContext | undefined {
  if (!context) {
    return undefined;
  }

  const allowedSenders = new Set(["customer", "ai", "admin", "agent", "system"]);

  return {
    recentMessages: Array.isArray(context.recentMessages)
      ? context.recentMessages
          .filter(
            (message) =>
              allowedSenders.has(message.sender) &&
              typeof message.text === "string" &&
              message.text.trim(),
          )
          .slice(-MAX_CONTEXT_MESSAGES)
          .map((message) => ({
            sender: message.sender,
            text: message.text.trim().slice(0, MAX_PREVIEW_MESSAGE_LENGTH),
          }))
      : undefined,
    lastIntent:
      typeof context.lastIntent === "string"
        ? context.lastIntent.trim().slice(0, 200)
        : undefined,
    summary:
      typeof context.summary === "string"
        ? context.summary.trim().slice(0, 1_000)
        : undefined,
  };
}

export async function POST(request: Request) {
  const { response } = await requireApiSession();
  if (response) {
    return response;
  }

  try {
    const body = (await request.json()) as {
      message?: string;
      agentId?: string;
      context?: ReplyContext;
    };

    if (!body.message?.trim()) {
      return jsonError("Pesan uji wajib diisi.", 400);
    }

    if (body.message.trim().length > MAX_PREVIEW_MESSAGE_LENGTH) {
      return jsonError(
        `Pesan uji maksimal ${MAX_PREVIEW_MESSAGE_LENGTH} karakter.`,
        400,
      );
    }

    const persistedConfig = await getDashboardConfigRecord();
    const agentId = body.agentId?.trim();
    const agent = agentId
      ? persistedConfig.automation.aiAgents.find((item) => item.id === agentId)
      : null;

    if (agentId && !agent) {
      return jsonError("AI Agent tidak ditemukan. Simpan Agent lalu coba lagi.", 404);
    }

    const effectiveConfig = buildEffectiveReplyConfig(persistedConfig, agent ?? null);
    const decision = await generateReplyDecision(
      body.message.trim(),
      effectiveConfig,
      sanitizeContext(body.context),
    );

    return jsonOk({
      ...decision,
      runtime: {
        agentId: agent?.id ?? null,
        agentName: agent?.name ?? effectiveConfig.aiAgent.name,
        knowledgeSources: effectiveConfig.knowledgeBase.documents.length,
        faqs: effectiveConfig.knowledgeBase.faqs.length,
        customInstructionsApplied: Boolean(
          effectiveConfig.aiAgent.replyInstructions.trim(),
        ),
      },
    });
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "Gagal membuat preview balasan AI.",
      500,
    );
  }
}
