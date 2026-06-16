import { getDashboardConfigRecord } from "@/server/repositories/dashboard-repository";
import { serverEnv } from "@/server/env";
import type { ChannelKind } from "@/types/operations";

type SendMessageInput = {
  channel: ChannelKind;
  recipientId?: string;
  message: string;
};

type WhatsAppGraphResponse = {
  messages?: Array<{
    id?: string;
  }>;
  error?: {
    message?: string;
  };
};

async function parseGraphResponse(
  response: Response,
): Promise<WhatsAppGraphResponse | null> {
  const bodyText = await response.text();
  if (!bodyText) {
    return null;
  }

  try {
    return JSON.parse(bodyText) as WhatsAppGraphResponse;
  } catch {
    return null;
  }
}

async function sendWhatsAppGraphRequest(
  accessToken: string,
  phoneNumberId: string,
  body: Record<string, unknown>,
) {
  const response = await fetch(
    `${serverEnv.whatsappBaseUrl}/${serverEnv.whatsappApiVersion}/${phoneNumberId}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    },
  );
  const payload = await parseGraphResponse(response);

  return {
    ok: response.ok,
    status: response.status,
    body: payload,
  };
}

export async function sendChannelMessage(input: SendMessageInput) {
  const config = await getDashboardConfigRecord();

  if (input.channel === "WhatsApp" && config.channels.whatsapp.accessToken && config.channels.whatsapp.phoneNumberId && input.recipientId) {
    const response = await sendWhatsAppGraphRequest(
      config.channels.whatsapp.accessToken,
      config.channels.whatsapp.phoneNumberId,
      {
        messaging_product: "whatsapp",
        to: input.recipientId,
        type: "text",
        text: {
          body: input.message,
        },
      },
    );

    return {
      ok: response.ok,
      provider: "whatsapp",
      status: response.status,
      body: response.body,
      messageId: response.body?.messages?.[0]?.id,
    };
  }

  return {
    ok: true,
    provider: "simulated",
    status: 200,
    note: "Credential belum tersedia, message dicatat sebagai simulated send.",
  };
}

export async function sendWhatsAppReadTypingIndicator(input: {
  incomingMessageId: string;
}) {
  const config = await getDashboardConfigRecord();

  if (!config.channels.whatsapp.accessToken || !config.channels.whatsapp.phoneNumberId) {
    return {
      ok: false,
      provider: "whatsapp",
      status: 412,
      note: "Credential WhatsApp belum lengkap.",
    };
  }

  const response = await sendWhatsAppGraphRequest(
    config.channels.whatsapp.accessToken,
    config.channels.whatsapp.phoneNumberId,
    {
      messaging_product: "whatsapp",
      status: "read",
      message_id: input.incomingMessageId,
      typing_indicator: {
        type: "text",
      },
    },
  );

  return {
    ok: response.ok,
    provider: "whatsapp",
    status: response.status,
    body: response.body,
  };
}
