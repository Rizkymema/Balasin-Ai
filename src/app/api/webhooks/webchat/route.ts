import { processIncomingMessage } from "@/server/services/inbox-service";
import { recordWebhookEvent } from "@/server/repositories/webhook-repository";
import { jsonError, jsonOk } from "@/server/http";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      customerId?: string;
      name?: string;
      phone?: string;
      username?: string;
      message?: string;
      messageType?: "text" | "comment";
    };

    if (!body.name || !body.message) {
      return jsonError("Payload webchat tidak lengkap.", 400);
    }

    const normalized = {
      channel: "Website Chat" as const,
      externalUserId: body.customerId ?? body.phone ?? body.name,
      displayName: body.name,
      messageText: body.message,
      messageType: body.messageType ?? "text",
      timestamp: new Date().toISOString(),
      username: body.username,
      phone: body.phone,
      rawPayload: body as Record<string, unknown>,
    };

    recordWebhookEvent({
      source: "webchat",
      payload: body as Record<string, unknown>,
      normalized,
      status: "received",
    });

    const result = await processIncomingMessage(normalized);
    return jsonOk(result, { status: 201 });
  } catch {
    return jsonError("Gagal memproses webhook webchat.", 500);
  }
}
