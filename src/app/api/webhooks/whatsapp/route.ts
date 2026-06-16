import { getDashboardConfigRecord } from "@/server/repositories/dashboard-repository";
import { recordWebhookEvent } from "@/server/repositories/webhook-repository";
import { processIncomingMessage } from "@/server/services/inbox-service";
import { jsonError, jsonOk } from "@/server/http";

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
    const body = (await request.json()) as {
      entry?: Array<{
        changes?: Array<{
          value?: {
            messages?: Array<{
              from?: string;
              text?: { body?: string };
              type?: string;
            }>;
            contacts?: Array<{
              profile?: { name?: string };
              wa_id?: string;
            }>;
          };
        }>;
      }>;
    };

    const message = body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
    const contact = body.entry?.[0]?.changes?.[0]?.value?.contacts?.[0];

    if (!message?.text?.body || !contact?.profile?.name) {
      recordWebhookEvent({
        source: "whatsapp",
        payload: body as Record<string, unknown>,
        status: "ignored",
      });
      return jsonOk({ ignored: true });
    }

    const normalized = {
      channel: "WhatsApp" as const,
      externalUserId: contact.wa_id ?? message.from ?? contact.profile.name,
      displayName: contact.profile.name,
      messageText: message.text.body,
      messageType: "text" as const,
      timestamp: new Date().toISOString(),
      phone: message.from,
      rawPayload: body as Record<string, unknown>,
    };

    recordWebhookEvent({
      source: "whatsapp",
      payload: body as Record<string, unknown>,
      normalized,
      status: "received",
    });

    const result = await processIncomingMessage(normalized);
    return jsonOk(result, { status: 201 });
  } catch {
    return jsonError("Gagal memproses webhook WhatsApp.", 500);
  }
}
