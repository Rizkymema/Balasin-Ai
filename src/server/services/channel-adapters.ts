import { getDashboardConfigRecord } from "@/server/repositories/dashboard-repository";
import { serverEnv } from "@/server/env";
import type { ChannelKind } from "@/types/operations";
import type { PreparedOutboundMediaUpload } from "@/server/services/outbound-media";

type SendMessageInput = {
  channel: ChannelKind;
  recipientId?: string;
  message: string;
  phoneNumberIdOverride?: string;
  instagramAccountIdOverride?: string;
  mediaAttachment?: PreparedOutboundMediaUpload;
};

type GraphApiError = {
  message?: string;
  type?: string;
  code?: number;
  error_subcode?: number;
  fbtrace_id?: string;
  error_data?: {
    details?: string;
  };
};

type WhatsAppGraphResponse = {
  messages?: Array<{
    id?: string;
  }>;
  id?: string;
  error?: GraphApiError;
};

function formatWhatsAppGraphError(error?: GraphApiError) {
  if (!error) {
    return undefined;
  }

  const parts = [
    error.message?.trim(),
    error.error_data?.details?.trim(),
    typeof error.code === "number" ? `code ${error.code}` : "",
    typeof error.error_subcode === "number"
      ? `subcode ${error.error_subcode}`
      : "",
    error.type?.trim() ? `type ${error.type.trim()}` : "",
  ].filter(Boolean);

  return parts.join(" | ");
}

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
  body: BodyInit,
  contentType = "application/json",
) {
  const response = await fetch(
    `${serverEnv.whatsappBaseUrl}/${serverEnv.whatsappApiVersion}/${phoneNumberId}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        ...(contentType ? { "Content-Type": contentType } : {}),
      },
      body,
    },
  );
  const payload = await parseGraphResponse(response);

  return {
    ok: response.ok,
    status: response.status,
    body: payload,
  };
}

async function uploadWhatsAppMedia(
  accessToken: string,
  phoneNumberId: string,
  mediaAttachment: PreparedOutboundMediaUpload,
) {
  const formData = new FormData();
  const fileBytes = new Uint8Array(mediaAttachment.buffer.byteLength);
  fileBytes.set(mediaAttachment.buffer);
  formData.set("messaging_product", "whatsapp");
  formData.set(
    "file",
    new Blob([fileBytes], { type: mediaAttachment.mimeType }),
    mediaAttachment.fileName,
  );

  const response = await fetch(
    `${serverEnv.whatsappBaseUrl}/${serverEnv.whatsappApiVersion}/${phoneNumberId}/media`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: formData,
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
  const trimmedMessage = input.message.trim();

  if (input.channel === "WhatsApp") {
    const phoneNumberId =
      input.phoneNumberIdOverride?.trim() ||
      config.channels.whatsapp.phoneNumberId.trim();

    // Cari token di daftar accounts yang cocok dengan phoneNumberId
    const matchingAccount = config.channels.whatsapp.accounts?.find(
      (acc) => acc.phoneNumberId === phoneNumberId
    );
    const accessToken = (matchingAccount?.accessToken || config.channels.whatsapp.accessToken).trim();

    if (!phoneNumberId || !accessToken) {
      return {
        ok: false,
        provider: "whatsapp",
        status: 412,
        note: "Phone Number ID atau access token WhatsApp belum tersedia di dashboard.",
      };
    }

    if (!input.recipientId) {
      return {
        ok: false,
        provider: "whatsapp",
        status: 422,
        note: "Nomor tujuan WhatsApp tidak tersedia.",
      };
    }

    let response;

    if (input.mediaAttachment) {
      const upload = await uploadWhatsAppMedia(
        accessToken,
        phoneNumberId,
        input.mediaAttachment,
      );

      if (!upload.ok || !upload.body?.id) {
        return {
          ok: false,
          provider: "whatsapp",
          status: upload.status,
          body: upload.body,
          note: formatWhatsAppGraphError(upload.body?.error) ??
            "Gagal mengunggah media ke WhatsApp.",
        };
      }

      response = await sendWhatsAppGraphRequest(
        accessToken,
        phoneNumberId,
        JSON.stringify({
          messaging_product: "whatsapp",
          to: input.recipientId,
          type: input.mediaAttachment.kind,
          [input.mediaAttachment.kind]: {
            id: upload.body.id,
            ...(trimmedMessage ? { caption: trimmedMessage } : {}),
          },
        }),
      );
    } else {
      if (!trimmedMessage) {
        return {
          ok: false,
          provider: "whatsapp",
          status: 422,
          note: "Pesan teks WhatsApp tidak boleh kosong.",
        };
      }

      response = await sendWhatsAppGraphRequest(
        accessToken,
        phoneNumberId,
        JSON.stringify({
          messaging_product: "whatsapp",
          to: input.recipientId,
          type: "text",
          text: {
            body: trimmedMessage,
          },
        }),
      );
    }

    return {
      ok: response.ok,
      provider: "whatsapp",
      status: response.status,
      body: response.body,
      messageId: response.body?.messages?.[0]?.id,
      note: formatWhatsAppGraphError(response.body?.error),
    };
  }

  if (input.mediaAttachment) {
    return {
      ok: false,
      provider: "unsupported_media",
      status: 422,
      note: `Channel ${input.channel} belum mendukung kirim foto/video dari dashboard.`,
    };
  }

  if (input.channel === "Instagram DM") {
    const accountId =
      input.instagramAccountIdOverride?.trim() ||
      config.channels.instagram.accountId?.trim();

    // Cari token di daftar accounts yang cocok dengan accountId
    const matchingAccount = config.channels.instagram.accounts?.find(
      (acc) => acc.accountId === accountId
    );
    const igAccessToken = (matchingAccount?.accessToken || config.channels.instagram.accessToken || "").trim();

    if (!accountId || !igAccessToken) {
      return {
        ok: false,
        provider: "instagram",
        status: 412,
        note: "Account ID atau access token Instagram belum tersedia di dashboard.",
      };
    }

    if (!input.recipientId) {
      return {
        ok: false,
        provider: "instagram",
        status: 422,
        note: "Recipient ID Instagram tidak tersedia.",
      };
    }

    // Instagram Messaging API menggunakan graph.instagram.com
    // Endpoint: POST /{ig-user-id}/messages
    const igBaseUrl = "https://graph.instagram.com";
    const igApiVersion = serverEnv.whatsappApiVersion;
    const sendUrl = `${igBaseUrl}/${igApiVersion}/${accountId}/messages`;

    try {
      const igResponse = await fetch(sendUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${igAccessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          recipient: { id: input.recipientId },
          message: { text: input.message },
        }),
      });

      const igBody = await igResponse.text();
      let parsedBody: Record<string, unknown> | null = null;
      try {
        parsedBody = JSON.parse(igBody) as Record<string, unknown>;
      } catch {
        // Body bukan JSON
      }

      if (!igResponse.ok) {
        const tokenHint = igAccessToken.length < 20
          ? "Token terlalu pendek, pastikan Anda menggunakan Page Access Token yang valid."
          : "";

        return {
          ok: false,
          provider: "instagram",
          status: igResponse.status,
          body: parsedBody,
          note: `Instagram API error (${sendUrl}): ${igBody.slice(0, 300)}${tokenHint ? ` — ${tokenHint}` : ""}`,
        };
      }

      return {
        ok: true,
        provider: "instagram",
        status: igResponse.status,
        body: parsedBody,
        messageId: (parsedBody as { message_id?: string })?.message_id,
      };
    } catch (error) {
      return {
        ok: false,
        provider: "instagram",
        status: 500,
        note: `Gagal mengirim DM Instagram: ${error instanceof Error ? error.message : "Unknown error"}`,
      };
    }
  }

  if (input.channel === "Instagram Comment") {
    // Komentar tidak bisa dibalas via DM secara otomatis tanpa user consent.
    // Catat sebagai simulated send.
    return {
      ok: true,
      provider: "instagram-comment",
      status: 200,
      note: "Balasan komentar dicatat di inbox. Balas manual melalui Instagram atau aktifkan Comment-to-DM.",
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
  phoneNumberIdOverride?: string;
}) {
  const config = await getDashboardConfigRecord();
  const phoneNumberId =
    input.phoneNumberIdOverride?.trim() ||
    config.channels.whatsapp.phoneNumberId.trim();

  // Cari token di daftar accounts yang cocok dengan phoneNumberId
  const matchingAccount = config.channels.whatsapp.accounts?.find(
    (acc) => acc.phoneNumberId === phoneNumberId
  );
  const accessToken = (matchingAccount?.accessToken || config.channels.whatsapp.accessToken).trim();

  if (!accessToken || !phoneNumberId) {
    return {
      ok: false,
      provider: "whatsapp",
      status: 412,
      note: "Credential WhatsApp belum lengkap.",
    };
  }

    const response = await sendWhatsAppGraphRequest(
      accessToken,
      phoneNumberId,
      JSON.stringify({
        messaging_product: "whatsapp",
        status: "read",
        message_id: input.incomingMessageId,
        typing_indicator: {
          type: "text",
        },
      }),
    );

  return {
    ok: response.ok,
    provider: "whatsapp",
    status: response.status,
    body: response.body,
    note: formatWhatsAppGraphError(response.body?.error),
  };
}
