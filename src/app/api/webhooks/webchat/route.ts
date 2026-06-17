import { processIncomingMessage } from "@/server/services/inbox-service";
import { recordWebhookEvent } from "@/server/repositories/webhook-repository";
import { jsonError, jsonOk } from "@/server/http";

type WebchatPayload = {
  customerId?: string;
  id?: string;
  sessionId?: string;
  name?: string;
  customerName?: string;
  displayName?: string;
  phone?: string;
  username?: string;
  message?: string;
  text?: string;
  body?: string;
  content?: string;
  messageType?: "text" | "comment";
};

async function parseWebchatPayload(request: Request): Promise<WebchatPayload> {
  const contentType = request.headers.get("content-type")?.toLowerCase() ?? "";

  if (contentType.includes("application/json")) {
    return (await request.json()) as WebchatPayload;
  }

  if (
    contentType.includes("application/x-www-form-urlencoded") ||
    contentType.includes("multipart/form-data")
  ) {
    const formData = await request.formData();
    return Object.fromEntries(formData.entries()) as WebchatPayload;
  }

  const raw = await request.text();
  if (!raw.trim()) {
    return {};
  }

  try {
    return JSON.parse(raw) as WebchatPayload;
  } catch {
    return {
      message: raw,
    };
  }
}

function normalizePayload(body: WebchatPayload) {
  const displayName =
    body.name?.trim() ||
    body.customerName?.trim() ||
    body.displayName?.trim() ||
    "Website Visitor";
  const message =
    body.message?.trim() ||
    body.text?.trim() ||
    body.body?.trim() ||
    body.content?.trim() ||
    "";

  return {
    customerId: body.customerId?.trim() || body.id?.trim() || body.sessionId?.trim(),
    displayName,
    phone: body.phone?.trim() || undefined,
    username: body.username?.trim() || undefined,
    message,
    messageType: body.messageType ?? "text",
  };
}

export async function POST(request: Request) {
  try {
    const body = await parseWebchatPayload(request);
    const normalizedBody = normalizePayload(body);

    if (!normalizedBody.displayName || !normalizedBody.message) {
      return jsonError("Payload webchat tidak lengkap.", 400);
    }

    const normalized = {
      channel: "Website Chat" as const,
      externalUserId:
        normalizedBody.customerId ??
        normalizedBody.phone ??
        normalizedBody.username ??
        normalizedBody.displayName,
      displayName: normalizedBody.displayName,
      messageText: normalizedBody.message,
      messageType: normalizedBody.messageType,
      timestamp: new Date().toISOString(),
      username: normalizedBody.username,
      phone: normalizedBody.phone,
      rawPayload: body as Record<string, unknown>,
    };

    await recordWebhookEvent({
      source: "webchat",
      payload: body as Record<string, unknown>,
      normalized,
      status: "received",
    });

    const result = await processIncomingMessage(normalized);
    return jsonOk(result, { status: 201 });
  } catch (error) {
    console.error("webchat webhook error", error);
    return jsonError(
      error instanceof Error ? error.message : "Gagal memproses webhook webchat.",
      500,
    );
  }
}
