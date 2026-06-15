import { jsonError, jsonOk, requireApiSession } from "@/server/http";
import { updateInboxConversationNotes } from "@/server/services/operations-service";

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { response } = await requireApiSession();
  if (response) {
    return response;
  }

  try {
    const { id } = await context.params;
    const body = (await request.json()) as { notes?: string };
    const conversation = updateInboxConversationNotes({
      conversationId: id,
      notes: body.notes ?? "",
    });

    return jsonOk(conversation);
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "Gagal menyimpan catatan inbox.",
      500,
    );
  }
}
