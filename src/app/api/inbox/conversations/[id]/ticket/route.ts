import { jsonError, jsonOk, requireApiSession } from "@/server/http";
import { createInboxTicket } from "@/server/services/operations-service";

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
    const result = createInboxTicket({ conversationId: id });
    return jsonOk(result);
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "Gagal membuat ticket dari inbox.",
      500,
    );
  }
}
