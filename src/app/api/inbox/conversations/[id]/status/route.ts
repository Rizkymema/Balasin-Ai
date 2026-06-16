import type { ConversationStatus } from "@/types/operations";
import { jsonError, jsonOk, requireApiSession } from "@/server/http";
import { updateInboxConversationStatus } from "@/server/services/operations-service";

const ALLOWED_STATUSES: ConversationStatus[] = [
  "ai_active",
  "ai_paused",
  "assigned_to_admin",
  "waiting_customer",
  "resolved",
  "blocked",
  "spam",
];

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { response } = await requireApiSession();
  if (response) {
    return response;
  }

  try {
    const { id } = await context.params;
    const body = (await request.json()) as { status?: ConversationStatus };

    if (!body.status || !ALLOWED_STATUSES.includes(body.status)) {
      return jsonError("Status percakapan tidak valid.", 400);
    }

    const conversation = await updateInboxConversationStatus({
      conversationId: id,
      status: body.status,
    });

    return jsonOk(conversation);
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "Gagal memperbarui status inbox.",
      500,
    );
  }
}
