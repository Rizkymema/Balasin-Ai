import { recordWebhookEvent } from "@/server/repositories/webhook-repository";
import { jsonError, jsonOk, requireApiSession } from "@/server/http";
import { processIncomingMessage } from "@/server/services/inbox-service";
import type { ChannelKind } from "@/types/operations";

const ALLOWED_CHANNELS: ChannelKind[] = [
  "Website Chat",
  "WhatsApp",
  "Instagram DM",
  "Instagram Comment",
];

function getSourceName(channel: ChannelKind) {
  switch (channel) {
    case "WhatsApp":
      return "whatsapp";
    case "Instagram DM":
    case "Instagram Comment":
      return "instagram";
    case "Website Chat":
    default:
      return "webchat";
  }
}

export async function POST(request: Request) {
  const { response } = await requireApiSession();
  if (response) {
    return response;
  }

  try {
    const body = (await request.json()) as {
      channel?: ChannelKind;
      displayName?: string;
      phone?: string;
      username?: string;
      message?: string;
    };

    if (
      !body.channel ||
      !ALLOWED_CHANNELS.includes(body.channel) ||
      !body.displayName?.trim() ||
      !body.message?.trim()
    ) {
      return jsonError("Payload test inbound belum lengkap.", 400);
    }

    const normalized = {
      channel: body.channel,
      externalUserId: body.phone?.trim() || body.username?.trim() || body.displayName.trim(),
      displayName: body.displayName.trim(),
      messageText: body.message.trim(),
      messageType: body.channel === "Instagram Comment" ? ("comment" as const) : ("text" as const),
      timestamp: new Date().toISOString(),
      username: body.username?.trim() || undefined,
      phone: body.phone?.trim() || undefined,
      rawPayload: body as Record<string, unknown>,
    };

    await recordWebhookEvent({
      source: getSourceName(body.channel),
      payload: body as Record<string, unknown>,
      normalized,
      status: "received",
    });

    const result = await processIncomingMessage(normalized);
    return jsonOk(result, { status: 201 });
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "Gagal menjalankan simulasi inbound.",
      500,
    );
  }
}
