import { normalizeSecretLikeValue } from "@/lib/normalize-secret-like-value";
import { getDashboardConfigRecord } from "@/server/repositories/dashboard-repository";
import { serverEnv } from "@/server/env";
import type { PreparedOutboundMediaUpload } from "@/server/services/outbound-media";
import type { DashboardConfig } from "@/types/dashboard-config";
import type { ChannelKind } from "@/types/operations";

type SendMessageInput = {
  channel: ChannelKind;
  recipientId?: string;
  message: string;
  phoneNumberIdOverride?: string;
  instagramAccountIdOverride?: string;
  mediaAttachment?: PreparedOutboundMediaUpload;
  mediaPublicUrl?: string;
  externalMessageId?: string;
};

type InstagramMessagingContext = {
  accessToken: string;
  pageId?: string;
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

type GraphApiResponse = {
  messages?: Array<{
    id?: string;
  }>;
  message_id?: string;
  id?: string;
  error?: GraphApiError;
};

type ResolvedInstagramCredential = {
  accountId: string;
  accessToken: string;
  pageId?: string;
};

function formatGraphApiError(error?: GraphApiError) {
  if (!error) {
    return undefined;
  }

  const parts = [
    error.message?.trim(),
    error.error_data?.details?.trim(),
    typeof error.code === "number" ? `code ${error.code}` : "",
    typeof error.error_subcode === "number" ? `subcode ${error.error_subcode}` : "",
    error.type?.trim() ? `type ${error.type.trim()}` : "",
  ].filter(Boolean);

  return parts.join(" | ");
}

async function parseGraphResponse(response: Response): Promise<GraphApiResponse | null> {
  const bodyText = await response.text();
  if (!bodyText) {
    return null;
  }

  try {
    return JSON.parse(bodyText) as GraphApiResponse;
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

async function resolveInstagramMessagingContext(input: {
  accountId: string;
  accessToken: string;
  pageId?: string;
}) {
  const normalizedAccessToken = normalizeSecretLikeValue(input.accessToken);
  const directContext: InstagramMessagingContext = {
    accessToken: normalizedAccessToken,
    pageId: input.pageId?.trim() || undefined,
  };

  try {
    const url = new URL(
      `${serverEnv.whatsappBaseUrl}/${serverEnv.whatsappApiVersion}/me/accounts`,
    );
    url.searchParams.set(
      "fields",
      "id,name,access_token,instagram_business_account{id,username,name}",
    );

    const response = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${input.accessToken}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "unknown");
      console.warn(`[Instagram OAuth] Failed to fetch /me/accounts. Status: ${response.status}. Error: ${errorText}`);
      return directContext;
    }

    const payload = (await response.json()) as {
      data?: Array<{
        id?: string;
        name?: string;
        access_token?: string;
        instagram_business_account?: {
          id?: string;
          username?: string;
        };
      }>;
    };

    console.log(`[Instagram OAuth] /me/accounts returned ${payload.data?.length ?? 0} pages.`);

    const matchedPage = payload.data?.find(
      (page) =>
        page.instagram_business_account?.id === input.accountId ||
        (input.pageId?.trim() && page.id === input.pageId.trim()),
    );

    if (!matchedPage) {
      console.warn(`[Instagram OAuth] No matching Facebook Page found for Account ID: ${input.accountId} or Page ID: ${input.pageId}. Pages returned:`, payload.data?.map(p => ({ id: p.id, name: p.name, hasIg: !!p.instagram_business_account })));
    }

    const matchedPageToken = normalizeSecretLikeValue(matchedPage?.access_token);

    if (!matchedPageToken) {
      return directContext;
    }

    return {
      accessToken: matchedPageToken,
      pageId: matchedPage?.id?.trim() || directContext.pageId,
    } satisfies InstagramMessagingContext;
  } catch (error) {
    console.error("[Instagram OAuth] Exception resolving messaging context:", error);
    return directContext;
  }
}

function resolveInstagramCredential(
  config: DashboardConfig,
  accountIdOverride?: string,
): ResolvedInstagramCredential {
  const primaryAccountId = config.channels.instagram.accountId?.trim() || "";
  const accountId = accountIdOverride?.trim() || primaryAccountId;
  const matchingAccount = config.channels.instagram.accounts?.find(
    (acc) => acc.accountId === accountId,
  );
  const primaryAccount = config.channels.instagram.accounts?.find(
    (acc) => acc.accountId === primaryAccountId,
  );
  const isPrimaryAccount = !primaryAccountId || accountId === primaryAccountId;

  const matchingAccessToken = normalizeSecretLikeValue(matchingAccount?.accessToken);
  const primaryAccessToken = normalizeSecretLikeValue(
    config.channels.instagram.accessToken,
  );
  const primaryAccountAccessToken = normalizeSecretLikeValue(
    primaryAccount?.accessToken,
  );

  const accessToken = isPrimaryAccount
    ? matchingAccessToken || primaryAccessToken || primaryAccountAccessToken
    : matchingAccessToken;

  const pageId = isPrimaryAccount
    ? matchingAccount?.pageId?.trim() ||
      config.channels.instagram.pageId?.trim() ||
      primaryAccount?.pageId?.trim() ||
      undefined
    : matchingAccount?.pageId?.trim() || undefined;

  return {
    accountId,
    accessToken,
    pageId,
  };
}

async function sendInstagramRequest(
  accessToken: string,
  body: Record<string, unknown>,
) {
  const sendUrl = `${serverEnv.whatsappBaseUrl}/${serverEnv.whatsappApiVersion}/me/messages`;
  const response = await fetch(sendUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const responseText = await response.text();
  let parsedBody: Record<string, unknown> | null = null;
  try {
    parsedBody = responseText
      ? (JSON.parse(responseText) as Record<string, unknown>)
      : null;
  } catch {
    parsedBody = null;
  }

  return {
    ok: response.ok,
    status: response.status,
    body: parsedBody,
    rawBody: responseText,
    sendUrl,
  };
}

export async function sendChannelMessage(input: SendMessageInput) {
  const config = await getDashboardConfigRecord();
  const trimmedMessage = input.message.trim();

  if (input.channel === "Website Chat") {
    return {
      ok: true,
      provider: "webchat",
      status: 200,
      note: input.mediaAttachment
        ? "Media website chat dicatat dan diteruskan ke channel internal."
        : "Pesan website chat dicatat dan diteruskan ke channel internal.",
    };
  }

  if (input.channel === "WhatsApp") {
    const phoneNumberId =
      input.phoneNumberIdOverride?.trim() ||
      config.channels.whatsapp.phoneNumberId.trim();

    const matchingAccount = config.channels.whatsapp.accounts?.find(
      (acc) => acc.phoneNumberId === phoneNumberId,
    );
    const accessToken = normalizeSecretLikeValue(
      matchingAccount?.accessToken || config.channels.whatsapp.accessToken,
    );

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
          note: formatGraphApiError(upload.body?.error) ?? "Gagal mengunggah media ke WhatsApp.",
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
      note: formatGraphApiError(response.body?.error),
    };
  }

  if (input.channel === "Instagram DM") {
    const {
      accountId,
      accessToken: igAccessToken,
      pageId: configuredPageId,
    } = resolveInstagramCredential(config, input.instagramAccountIdOverride);

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

    const messagingContext = await resolveInstagramMessagingContext({
      accountId,
      accessToken: igAccessToken,
      pageId: configuredPageId,
    });

    try {
      if (input.mediaAttachment) {
        if (!input.mediaPublicUrl?.trim()) {
          return {
            ok: false,
            provider: "instagram",
            status: 422,
            note: "URL media publik Instagram belum tersedia.",
          };
        }

        const mediaResponse = await sendInstagramRequest(
          messagingContext.accessToken,
          {
            recipient: { id: input.recipientId },
            message: {
              attachment: {
                type: input.mediaAttachment.kind,
                payload: {
                  url: input.mediaPublicUrl.trim(),
                },
              },
            },
          },
        );

        if (!mediaResponse.ok) {
          return {
            ok: false,
            provider: "instagram",
            status: mediaResponse.status,
            body: mediaResponse.body,
            note: `Instagram API error (${mediaResponse.sendUrl}): ${mediaResponse.rawBody.slice(0, 300)}`,
          };
        }

        let captionResponse: Awaited<ReturnType<typeof sendInstagramRequest>> | null = null;
        if (trimmedMessage) {
          captionResponse = await sendInstagramRequest(
            messagingContext.accessToken,
            {
              recipient: { id: input.recipientId },
              message: { text: trimmedMessage },
            },
          );

          if (!captionResponse.ok) {
            return {
              ok: false,
              provider: "instagram",
              status: captionResponse.status,
              body: captionResponse.body,
              note: `Instagram caption error (${captionResponse.sendUrl}): ${captionResponse.rawBody.slice(0, 300)}`,
            };
          }
        }

        return {
          ok: true,
          provider: "instagram",
          status: captionResponse?.status ?? mediaResponse.status,
          body: captionResponse?.body ?? mediaResponse.body,
          messageId:
            ((captionResponse?.body as { message_id?: string } | null)?.message_id) ||
            ((mediaResponse.body as { message_id?: string } | null)?.message_id),
        };
      }

      const igResponse = await sendInstagramRequest(
        messagingContext.accessToken,
        {
          recipient: { id: input.recipientId },
          message: { text: trimmedMessage },
        },
      );

      if (!igResponse.ok) {
        const tokenHint =
          igAccessToken.length < 20
            ? "Token terlalu pendek, pastikan Anda menggunakan Page Access Token yang valid."
            : "";

        return {
          ok: false,
          provider: "instagram",
          status: igResponse.status,
          body: igResponse.body,
          note: `Instagram API error (${igResponse.sendUrl}): ${igResponse.rawBody.slice(0, 300)}${tokenHint ? ` - ${tokenHint}` : ""}`,
        };
      }

      return {
        ok: true,
        provider: "instagram",
        status: igResponse.status,
        body: igResponse.body,
        messageId: (igResponse.body as { message_id?: string } | null)?.message_id,
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
    const {
      accountId,
      accessToken: igAccessToken,
      pageId: configuredPageId,
    } = resolveInstagramCredential(config, input.instagramAccountIdOverride);

    if (!accountId || !igAccessToken) {
      return {
        ok: false,
        provider: "instagram-comment",
        status: 412,
        note: "Account ID atau access token Instagram belum tersedia di dashboard.",
      };
    }

    const commentId = input.externalMessageId;
    if (!commentId) {
      return {
        ok: false,
        provider: "instagram-comment",
        status: 422,
        note: "Comment ID tidak tersedia untuk dibalas.",
      };
    }

    const messagingContext = await resolveInstagramMessagingContext({
      accountId,
      accessToken: igAccessToken,
      pageId: configuredPageId,
    });

    try {
      const sendUrl = `${serverEnv.whatsappBaseUrl}/${serverEnv.whatsappApiVersion}/${commentId}/replies`;
      const response = await fetch(sendUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${messagingContext.accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: trimmedMessage,
        }),
      });

      const responseText = await response.text();
      let parsedBody: Record<string, unknown> | null = null;
      try {
        parsedBody = responseText ? JSON.parse(responseText) : null;
      } catch {
        parsedBody = null;
      }

      if (!response.ok) {
        return {
          ok: false,
          provider: "instagram-comment",
          status: response.status,
          body: parsedBody,
          note: `Gagal membalas komentar Instagram (${sendUrl}): ${responseText.slice(0, 300)}`,
        };
      }

      return {
        ok: true,
        provider: "instagram-comment",
        status: response.status,
        body: parsedBody,
        messageId: (parsedBody as { id?: string } | null)?.id,
      };
    } catch (error) {
      return {
        ok: false,
        provider: "instagram-comment",
        status: 500,
        note: `Gagal mengirim balasan komentar Instagram: ${error instanceof Error ? error.message : "Unknown error"}`,
      };
    }
  }

  if (input.mediaAttachment) {
    return {
      ok: false,
      provider: "unsupported_media",
      status: 422,
      note: `Channel ${input.channel} belum mendukung kirim foto/video dari dashboard.`,
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

  const matchingAccount = config.channels.whatsapp.accounts?.find(
    (acc) => acc.phoneNumberId === phoneNumberId,
  );
  const accessToken = normalizeSecretLikeValue(
    matchingAccount?.accessToken || config.channels.whatsapp.accessToken,
  );

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
    note: formatGraphApiError(response.body?.error),
  };
}

export async function deleteInstagramComment(input: {
  commentId: string;
  instagramAccountIdOverride?: string;
}) {
  const config = await getDashboardConfigRecord();
  const {
    accountId,
    accessToken: igAccessToken,
    pageId: configuredPageId,
  } = resolveInstagramCredential(config, input.instagramAccountIdOverride);

  if (!accountId || !igAccessToken) {
    return {
      ok: false,
      provider: "instagram",
      status: 412,
      note: "Account ID atau access token Instagram belum tersedia di dashboard.",
    };
  }

  const messagingContext = await resolveInstagramMessagingContext({
    accountId,
    accessToken: igAccessToken,
    pageId: configuredPageId,
  });

  try {
    const deleteUrl = `${serverEnv.whatsappBaseUrl}/${serverEnv.whatsappApiVersion}/${input.commentId}`;
    const response = await fetch(deleteUrl, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${messagingContext.accessToken}`,
      },
    });

    const responseText = await response.text();
    let parsedBody: Record<string, unknown> | null = null;
    try {
      parsedBody = responseText ? JSON.parse(responseText) : null;
    } catch {
      parsedBody = null;
    }

    if (!response.ok) {
      return {
        ok: false,
        provider: "instagram",
        status: response.status,
        body: parsedBody,
        note: `Gagal menghapus komentar Instagram (${deleteUrl}): ${responseText.slice(0, 300)}`,
      };
    }

    return {
      ok: true,
      provider: "instagram",
      status: response.status,
      body: parsedBody,
    };
  } catch (error) {
    return {
      ok: false,
      provider: "instagram",
      status: 500,
      note: `Gagal menghapus komentar Instagram: ${error instanceof Error ? error.message : "Unknown error"}`,
    };
  }
}
