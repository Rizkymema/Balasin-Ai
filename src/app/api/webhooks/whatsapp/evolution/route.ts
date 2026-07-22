import { jsonError, jsonOk } from "@/server/http";
import { recordWebhookEvent } from "@/server/repositories/webhook-repository";
import {
  getDashboardConfigRecord,
  saveDashboardConfigRecord,
} from "@/server/repositories/dashboard-repository";
import { processIncomingMessage } from "@/server/services/inbox-service";
import { serverEnv } from "@/server/env";

type JsonRecord = Record<string, unknown>;

function asRecord(value: unknown): JsonRecord {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as JsonRecord
    : {};
}

function getText(message: JsonRecord) {
  const extended = asRecord(message.extendedTextMessage);
  const image = asRecord(message.imageMessage);
  const video = asRecord(message.videoMessage);
  return String(
    message.conversation ??
      extended.text ??
      image.caption ??
      video.caption ??
      "",
  ).trim();
}

function getPhone(remoteJid: string) {
  return remoteJid
    .replace(/@s\.whatsapp\.net$/i, "")
    .split(":")[0]
    .trim();
}

function getTimestamp(value: unknown) {
  const numeric = Number(value);
  return Number.isFinite(numeric) && numeric > 0
    ? new Date(numeric < 10_000_000_000 ? numeric * 1000 : numeric).toISOString()
    : new Date().toISOString();
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  if (
    !serverEnv.whatsappQrWebhookSecret ||
    searchParams.get("secret") !== serverEnv.whatsappQrWebhookSecret
  ) {
    return new Response("Forbidden", { status: 403 });
  }

  return jsonOk({ ok: true, provider: "evolution" });
}

export async function POST(request: Request) {
  const { searchParams } = new URL(request.url);
  if (
    !serverEnv.whatsappQrWebhookSecret ||
    searchParams.get("secret") !== serverEnv.whatsappQrWebhookSecret
  ) {
    return jsonError("Webhook WhatsApp QR tidak terautorisasi.", 403);
  }

  try {
    const body = asRecord(await request.json());
    const eventName = String(body.event ?? body.type ?? "").toLowerCase();
    if (eventName && !eventName.includes("message")) {
      return jsonOk({ ignored: true, reason: "unsupported_event" });
    }

    const rawData = Array.isArray(body.data) ? body.data : [body.data ?? body];
    const instanceName = String(body.instance ?? body.instanceName ?? "").trim();
    const config = await getDashboardConfigRecord();
    const knownInstances = new Set(
      (config.channels.whatsapp.qrSessions ?? []).map((session) => session.instanceName),
    );
    if (!instanceName || !knownInstances.has(instanceName)) {
      return jsonError("Instance WhatsApp QR tidak dikenal.", 404);
    }

    const session = config.channels.whatsapp.qrSessions?.find(
      (item) => item.instanceName === instanceName,
    );
    if (session && session.status !== "connected") {
      await saveDashboardConfigRecord({
        ...config,
        channels: {
          ...config.channels,
          whatsapp: {
            ...config.channels.whatsapp,
            qrSessions: (config.channels.whatsapp.qrSessions ?? []).map((item) =>
              item.id === session.id
                ? {
                    ...item,
                    status: "connected" as const,
                    lastCheckedAt: new Date().toISOString(),
                    lastConnectedAt: item.lastConnectedAt ?? new Date().toISOString(),
                  }
                : item,
            ),
          },
        },
      });
    }

    let received = 0;
    let ignored = 0;
    for (const rawItem of rawData) {
      const item = asRecord(rawItem);
      const key = asRecord(item.key);
      if (key.fromMe === true) {
        ignored += 1;
        continue;
      }

      const remoteJid = String(key.remoteJid ?? item.remoteJid ?? "").trim();
      const phone = getPhone(remoteJid);
      const message = asRecord(item.message);
      const messageText = getText(message);
      if (!phone || !messageText) {
        ignored += 1;
        continue;
      }

      const externalMessageId = String(key.id ?? item.id ?? "").trim() || undefined;
      const displayName = String(item.pushName ?? item.senderName ?? phone).trim();
      const normalized = {
        channel: "WhatsApp" as const,
        externalUserId: phone,
        displayName,
        messageText,
        messageType: "text" as const,
        timestamp: getTimestamp(item.messageTimestamp ?? body.messageTimestamp),
        externalMessageId,
        phone,
        channelContext: {
          externalUserId: phone,
          whatsappGatewayInstance: instanceName,
        },
        rawPayload: body,
      };

      await recordWebhookEvent({
        source: "whatsapp_evolution",
        payload: body,
        normalized,
        status: "received",
      });
      await processIncomingMessage(normalized);
      received += 1;
    }

    return jsonOk({ received, ignored });
  } catch (error) {
    console.error("[whatsapp-evolution-webhook] unhandled error", error);
    return jsonError(
      error instanceof Error ? error.message : "Gagal memproses webhook WhatsApp QR.",
      500,
    );
  }
}
