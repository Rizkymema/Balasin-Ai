import { recordWebhookEvent } from "@/server/repositories/webhook-repository";
import { processIncomingMessage } from "@/server/services/inbox-service";
import { jsonError, jsonOk } from "@/server/http";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      sender?: { id?: string; username?: string };
      message?: { text?: string };
      comment?: { text?: string; from?: { username?: string; id?: string } };
    };

    const isComment = Boolean(body.comment?.text);
    const text = body.message?.text ?? body.comment?.text;
    const displayName =
      body.comment?.from?.username ?? body.sender?.username ?? "Instagram User";
    const externalUserId =
      body.comment?.from?.id ?? body.sender?.id ?? displayName;

    if (!text) {
      recordWebhookEvent({
        source: "instagram",
        payload: body as Record<string, unknown>,
        status: "ignored",
      });
      return jsonOk({ ignored: true });
    }

    const normalized = {
      channel: isComment ? ("Instagram Comment" as const) : ("Instagram DM" as const),
      externalUserId,
      displayName,
      messageText: text,
      messageType: isComment ? ("comment" as const) : ("text" as const),
      timestamp: new Date().toISOString(),
      username: displayName,
      rawPayload: body as Record<string, unknown>,
    };

    recordWebhookEvent({
      source: "instagram",
      payload: body as Record<string, unknown>,
      normalized,
      status: "received",
    });

    const result = await processIncomingMessage(normalized);
    return jsonOk(result, { status: 201 });
  } catch {
    return jsonError("Gagal memproses webhook Instagram.", 500);
  }
}
