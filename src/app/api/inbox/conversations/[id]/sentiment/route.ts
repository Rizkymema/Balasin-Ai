import { getDashboardConfigRecord, getDashboardOperationsRecord, saveDashboardConfigRecord, saveDashboardOperationsRecord } from "@/server/repositories/dashboard-repository";
import { jsonError, jsonOk, requireApiSession } from "@/server/http";
import type { CustomerSentiment } from "@/types/operations";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { response: sessionResponse } = await requireApiSession();
  if (sessionResponse) {
    return sessionResponse;
  }

  try {
    const { id } = await context.params;
    const body = (await request.json()) as {
      sentiment?: CustomerSentiment;
    };

    if (!body.sentiment || !["positive", "neutral", "negative"].includes(body.sentiment)) {
      return jsonError("Sentimen tidak valid.", 400);
    }

    const ops = await getDashboardOperationsRecord();
    const config = await getDashboardConfigRecord();

    const conversationIdx = ops.conversations.findIndex((c) => c.id === id);
    if (conversationIdx === -1) {
      return jsonError("Percakapan tidak ditemukan.", 404);
    }

    const conversation = ops.conversations[conversationIdx];
    
    // Get last customer message for training reinforcement
    const lastCustomerMsg = conversation.messages
      .filter((m) => m.sender === "customer")
      .at(-1)?.text || conversation.lastMessage;

    // Update conversation sentiment in operations database
    conversation.sentiment = body.sentiment;
    ops.conversations[conversationIdx] = conversation;
    await saveDashboardOperationsRecord(ops);

    // AI Self-Training: Store correction examples in the configuration for few-shot learning
    if (lastCustomerMsg?.trim()) {
      const trimmedText = lastCustomerMsg.trim();
      const currentCorrections = config.knowledgeBase.sentimentCorrections || [];
      
      // Filter out existing corrections for this exact message text to avoid duplicate entries
      const nextCorrections = currentCorrections.filter(
        (c) => c.text.toLowerCase().trim() !== trimmedText.toLowerCase(),
      );

      nextCorrections.push({
        id: `corr-${Date.now()}`,
        text: trimmedText,
        sentiment: body.sentiment,
        createdAt: new Date().toISOString(),
      });

      config.knowledgeBase.sentimentCorrections = nextCorrections.slice(-100); // Keep last 100 corrections
      await saveDashboardConfigRecord(config);
    }

    return jsonOk({
      ok: true,
      conversation,
    });
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "Gagal menyimpan koreksi sentimen.",
      500,
    );
  }
}
