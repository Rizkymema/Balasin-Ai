import { jsonError, jsonOk, requireApiSession } from "@/server/http";
import { markInboxConversationSeen } from "@/server/services/operations-service";

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { response } = await requireApiSession();
  if (response) {
    return response;
  }

  try {
    const { id } = await context.params;
    const conversation = await markInboxConversationSeen({ conversationId: id });
    return jsonOk(conversation);
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "Gagal menandai chat sebagai dibaca.",
      500,
    );
  }
}
