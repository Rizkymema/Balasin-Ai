import { getDashboardConfigRecord } from "@/server/repositories/dashboard-repository";
import { serverEnv } from "@/server/env";
import type { ChannelKind } from "@/types/operations";

type SendMessageInput = {
  channel: ChannelKind;
  recipientId?: string;
  message: string;
};

export async function sendChannelMessage(input: SendMessageInput) {
  const config = await getDashboardConfigRecord();

  if (input.channel === "WhatsApp" && config.channels.whatsapp.accessToken && config.channels.whatsapp.phoneNumberId && input.recipientId) {
    const response = await fetch(
      `${serverEnv.whatsappBaseUrl}/${serverEnv.whatsappApiVersion}/${config.channels.whatsapp.phoneNumberId}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${config.channels.whatsapp.accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: input.recipientId,
          type: "text",
          text: {
            body: input.message,
          },
        }),
      },
    );

    return {
      ok: response.ok,
      provider: "whatsapp",
      status: response.status,
    };
  }

  return {
    ok: true,
    provider: "simulated",
    status: 200,
    note: "Credential belum tersedia, message dicatat sebagai simulated send.",
  };
}
