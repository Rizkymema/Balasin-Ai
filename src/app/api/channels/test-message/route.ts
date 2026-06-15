import { jsonError, jsonOk, requireApiSession } from "@/server/http";
import { sendChannelMessage } from "@/server/services/channel-adapters";
import type { ChannelKind } from "@/types/operations";

const ALLOWED_CHANNELS: ChannelKind[] = [
  "Website Chat",
  "WhatsApp",
  "Instagram DM",
  "Instagram Comment",
];

export async function POST(request: Request) {
  const { response } = await requireApiSession();
  if (response) {
    return response;
  }

  try {
    const body = (await request.json()) as {
      channel?: ChannelKind;
      recipientId?: string;
      message?: string;
    };

    if (
      !body.channel ||
      !ALLOWED_CHANNELS.includes(body.channel) ||
      !body.message?.trim()
    ) {
      return jsonError("Payload test outbound belum lengkap.", 400);
    }

    const result = await sendChannelMessage({
      channel: body.channel,
      recipientId: body.recipientId?.trim(),
      message: body.message.trim(),
    });

    return jsonOk(result);
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "Gagal mengirim pesan test channel.",
      500,
    );
  }
}
