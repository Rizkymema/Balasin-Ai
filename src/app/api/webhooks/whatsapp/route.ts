import { getDashboardConfigRecord } from "@/server/repositories/dashboard-repository";
import { recordWebhookEvent } from "@/server/repositories/webhook-repository";
import {
  processIncomingMessage,
  updateIncomingMessageDeliveryStatus,
} from "@/server/services/inbox-service";
import { jsonError, jsonOk } from "@/server/http";

type WhatsAppWebhookBody = {
  entry?: Array<{
    changes?: Array<{
      value?: {
        metadata?: {
          phone_number_id?: string;
          display_phone_number?: string;
        };
        messages?: Array<{
          id?: string;
          from?: string;
          text?: { body?: string };
          type?: string;
        }>;
        contacts?: Array<{
          profile?: { name?: string };
          wa_id?: string;
        }>;
        statuses?: Array<{
          id?: string;
          status?: string;
          timestamp?: string;
          recipient_id?: string;
        }>;
      };
    }>;
  }>;
};

export async function GET(request: Request) {
  const config = await getDashboardConfigRecord();
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === config.channels.whatsapp.verifyToken) {
    return new Response(challenge ?? "OK", { status: 200 });
  }

  return new Response("Forbidden", { status: 403 });
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as WhatsAppWebhookBody;
    const changes = body.entry?.flatMap((entry) => entry.changes ?? []) ?? [];
    let receivedCount = 0;
    let statusUpdateCount = 0;
    let ignoredCount = 0;

    for (const change of changes) {
      const value = change.value;
      const contact = value?.contacts?.[0];
      const messages = value?.messages ?? [];
      const statuses = value?.statuses ?? [];
      const metadata = value?.metadata;

      for (const statusEvent of statuses) {
        if (!statusEvent.id || !statusEvent.status) {
          ignoredCount += 1;
          continue;
        }

        const result = await updateIncomingMessageDeliveryStatus({
          channel: "WhatsApp",
          externalMessageId: statusEvent.id,
          status: statusEvent.status,
          timestamp: statusEvent.timestamp,
        });

        await recordWebhookEvent({
          source: "whatsapp",
          payload: body as Record<string, unknown>,
          normalized: {
            type: "status",
            externalMessageId: statusEvent.id,
            status: statusEvent.status,
            recipientId: statusEvent.recipient_id ?? null,
            result,
          },
          status: result.updated ? "status_updated" : "ignored",
        });

        if (result.updated) {
          statusUpdateCount += 1;
        } else {
          ignoredCount += 1;
        }
      }

      for (const message of messages) {
        if (!message.text?.body || !contact?.profile?.name) {
          ignoredCount += 1;
          continue;
        }

        const normalized = {
          channel: "WhatsApp" as const,
          externalUserId: contact.wa_id ?? message.from ?? contact.profile.name,
          displayName: contact.profile.name,
          messageText: message.text.body,
          messageType: "text" as const,
          timestamp: new Date().toISOString(),
          externalMessageId: message.id,
          phone: message.from,
          channelContext: {
            externalUserId:
              contact.wa_id ?? message.from ?? contact.profile.name,
            whatsappPhoneNumberId: metadata?.phone_number_id,
            whatsappDisplayPhoneNumber: metadata?.display_phone_number,
          },
          rawPayload: body as Record<string, unknown>,
        };

        await recordWebhookEvent({
          source: "whatsapp",
          payload: body as Record<string, unknown>,
          normalized,
          status: "received",
        });

        await processIncomingMessage(normalized);
        receivedCount += 1;
      }
    }

    if (receivedCount === 0 && statusUpdateCount === 0) {
      await recordWebhookEvent({
        source: "whatsapp",
        payload: body as Record<string, unknown>,
        status: "ignored",
      });
      return jsonOk({ ignored: true });
    }

    return jsonOk(
      {
        received: receivedCount,
        statusesUpdated: statusUpdateCount,
        ignored: ignoredCount,
      },
      { status: receivedCount > 0 ? 201 : 200 },
    );
  } catch {
    return jsonError("Gagal memproses webhook WhatsApp.", 500);
  }
}
