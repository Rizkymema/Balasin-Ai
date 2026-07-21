import { setConversationFlowActive } from "@/server/repositories/conversation-flow-repository";
import { jsonError, jsonOk, requireApiSession } from "@/server/http";

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { response } = await requireApiSession();
  if (response) return response;

  const body = (await request.json().catch(() => null)) as {
    active?: boolean;
  } | null;
  if (typeof body?.active !== "boolean") {
    return jsonError("Status active wajib berupa boolean.", 400);
  }

  const { id } = await context.params;
  const result = await setConversationFlowActive(id, body.active);
  if (!result.flow) return jsonError("Conversation Flow tidak ditemukan.", 404);
  if (result.error) {
    return jsonError(result.error, 422, result.validation?.errors);
  }

  return jsonOk(result);
}
