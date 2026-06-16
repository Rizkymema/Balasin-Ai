import { jsonError, jsonOk, requireApiSession } from "@/server/http";
import { deleteInboxConversation } from "@/server/services/operations-service";

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { response } = await requireApiSession();
  if (response) {
    return response;
  }

  try {
    const { id } = await context.params;
    const result = await deleteInboxConversation({ conversationId: id });
    return jsonOk(result);
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "Gagal menghapus chat inbox.",
      500,
    );
  }
}
