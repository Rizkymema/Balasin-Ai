import { jsonError, jsonOk, requireApiSession } from "@/server/http";
import { sendInboxReply } from "@/server/services/operations-service";

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
    const body = (await request.json()) as { message?: string };

    if (!body.message?.trim()) {
      return jsonError("Pesan balasan wajib diisi.", 400);
    }

    const result = await sendInboxReply({
      conversationId: id,
      message: body.message.trim(),
    });

    return jsonOk(result);
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "Gagal mengirim balasan inbox.",
      500,
    );
  }
}
