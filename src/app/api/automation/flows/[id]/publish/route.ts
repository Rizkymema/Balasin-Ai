import { publishConversationFlow } from "@/server/repositories/conversation-flow-repository";
import { jsonError, jsonOk, requireApiSession } from "@/server/http";

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { response } = await requireApiSession();
  if (response) return response;

  const { id } = await context.params;
  const result = await publishConversationFlow(id);
  if (!result.flow) return jsonError("Conversation Flow tidak ditemukan.", 404);
  if (!result.validation?.valid) {
    return jsonError(
      "Flow belum valid dan tidak dapat dipublish.",
      422,
      result.validation?.errors,
    );
  }
  return jsonOk(result);
}
