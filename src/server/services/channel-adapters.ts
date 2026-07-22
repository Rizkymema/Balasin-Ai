import { normalizeSecretLikeValue } from "@/lib/normalize-secret-like-value";
import {
  getDashboardConfigRecord,
  saveDashboardConfigRecord,
} from "@/server/repositories/dashboard-repository";
import { serverEnv } from "@/server/env";
import { sendWhatsAppQrText } from "@/server/services/whatsapp-qr-gateway";
import type { PreparedOutboundMediaUpload } from "@/server/services/outbound-media";
import type { DashboardConfig } from "@/types/dashboard-config";
import type { ChannelKind } from "@/types/operations";

type SendMessageInput = {
  channel: ChannelKind;
  recipientId?: string;
  message: string;
  phoneNumberIdOverride?: string;
  whatsappGatewayInstanceOverride?: string;
  instagramAccountIdOverride?: string;
  accessTokenOverride?: string;
  mediaAttachment?: PreparedOutboundMediaUpload;
  mediaPublicUrl?: string;
  externalMessageId?: string;
};

type InstagramMessagingContext = {
  accessToken: string;
  senderId?: string;
  senderKind: "facebook-page" | "instagram-account";
  graphBaseUrl: string;
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

const INSTAGRAM_GRAPH_BASE_URL = "https://graph.instagram.com";

function trimTrailingSlash(value: string) {
  return value.replace(/\/+$/, "");
}

function buildGraphApiUrl(baseUrl: string, path: string) {
  return `${trimTrailingSlash(baseUrl)}/${serverEnv.whatsappApiVersion}/${path.replace(/^\/+/, "")}`;
}

function isInstagramLoginToken(accessToken: string) {
  return accessToken.startsWith("IG");
}

function summarizeSecret(value?: string) {
  const normalized = normalizeSecretLikeValue(value);
  if (!normalized) {
    return "empty";
  }

  if (normalized.length <= 12) {
    return `len=${normalized.length}`;
  }

  return `len=${normalized.length};preview=${normalized.slice(0, 6)}...${normalized.slice(-4)}`;
}

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
  const accountId = input.accountId.trim();
  const configuredPageId = input.pageId?.trim() || undefined;
  const directContext: InstagramMessagingContext = {
    accessToken: normalizedAccessToken,
    senderId: configuredPageId,
    senderKind: "facebook-page",
    graphBaseUrl: serverEnv.whatsappBaseUrl,
    pageId: configuredPageId,
  };

  if (isInstagramLoginToken(normalizedAccessToken)) {
    return {
      accessToken: normalizedAccessToken,
      senderId: accountId,
      senderKind: "instagram-account",
      graphBaseUrl: INSTAGRAM_GRAPH_BASE_URL,
    } satisfies InstagramMessagingContext;
  }

  async function resolvePageContextFromCurrentToken() {
    try {
      const url = new URL(buildGraphApiUrl(serverEnv.whatsappBaseUrl, "me"));
      url.searchParams.set(
        "fields",
        "id,name,instagram_business_account{id,username,name}",
      );

      const response = await fetch(url.toString(), {
        headers: {
          Authorization: `Bearer ${normalizedAccessToken}`,
        },
      });

      if (!response.ok) {
        return null;
      }

      const payload = (await response.json()) as {
        id?: string;
        instagram_business_account?: {
          id?: string;
        };
      };

      if (payload.instagram_business_account?.id !== accountId || !payload.id?.trim()) {
        return null;
      }

      return {
        accessToken: normalizedAccessToken,
        senderId: payload.id.trim(),
        senderKind: "facebook-page",
        graphBaseUrl: serverEnv.whatsappBaseUrl,
        pageId: payload.id.trim(),
      } satisfies InstagramMessagingContext;
    } catch {
      return null;
    }
  }

  try {
    const url = new URL(
      buildGraphApiUrl(serverEnv.whatsappBaseUrl, "me/accounts"),
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
      return (await resolvePageContextFromCurrentToken()) ?? directContext;
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
        page.instagram_business_account?.id === accountId ||
        (configuredPageId && page.id === configuredPageId),
    );

    if (!matchedPage) {
      console.warn(`[Instagram OAuth] No matching Facebook Page found for Account ID: ${accountId} or Page ID: ${configuredPageId}. Pages returned:`, payload.data?.map(p => ({ id: p.id, name: p.name, hasIg: !!p.instagram_business_account })));
      return (await resolvePageContextFromCurrentToken()) ?? directContext;
    }

    const matchedPageToken = normalizeSecretLikeValue(matchedPage?.access_token);
    const matchedPageId = matchedPage?.id?.trim();

    if (!matchedPageId) {
      return (await resolvePageContextFromCurrentToken()) ?? directContext;
    }

    return {
      accessToken: matchedPageToken || normalizedAccessToken,
      senderId: matchedPageId,
      senderKind: "facebook-page",
      graphBaseUrl: serverEnv.whatsappBaseUrl,
      pageId: matchedPageId,
    } satisfies InstagramMessagingContext;
  } catch (error) {
    console.error("[Instagram OAuth] Exception resolving messaging context:", error);
    return (await resolvePageContextFromCurrentToken()) ?? directContext;
  }
}

function resolveInstagramCredential(
  config: DashboardConfig,
  accountIdOverride?: string,
): ResolvedInstagramCredential {
  const configuredAccounts = config.channels.instagram.accounts ?? [];
  const primaryAccountId = config.channels.instagram.accountId?.trim() || "";
  const requestedAccountId = accountIdOverride?.trim() || primaryAccountId;
  const matchingAccount = configuredAccounts.find(
    (acc) => acc.accountId === requestedAccountId,
  );
  const primaryAccount = configuredAccounts.find(
    (acc) => acc.accountId === primaryAccountId,
  );
  const firstConnectedAccount = configuredAccounts.find(
    (acc) => normalizeSecretLikeValue(acc.accessToken).length > 0,
  );
  const resolvedAccount =
    matchingAccount || primaryAccount || firstConnectedAccount || null;
  const accountId = requestedAccountId || resolvedAccount?.accountId?.trim() || "";
  const isPrimaryAccount =
    !primaryAccountId || accountId === primaryAccountId || resolvedAccount === primaryAccount;

  const resolvedAccountToken = normalizeSecretLikeValue(
    resolvedAccount?.accessToken,
  );
  const primaryAccessToken = normalizeSecretLikeValue(
    config.channels.instagram.accessToken,
  );
  const primaryAccountAccessToken = normalizeSecretLikeValue(
    primaryAccount?.accessToken,
  );

  const accessToken = isPrimaryAccount
    ? resolvedAccountToken || primaryAccessToken || primaryAccountAccessToken
    : resolvedAccountToken;

  const pageId = isPrimaryAccount
    ? resolvedAccount?.pageId?.trim() ||
      config.channels.instagram.pageId?.trim() ||
      primaryAccount?.pageId?.trim() ||
      undefined
    : resolvedAccount?.pageId?.trim() || undefined;

  if (!accountId || !accessToken) {
    console.warn("[Instagram DM] credential resolution failed", {
      requestedAccountId,
      primaryAccountId,
      configuredAccounts: configuredAccounts.map((account) => ({
        accountId: account.accountId,
        hasAccessToken: normalizeSecretLikeValue(account.accessToken).length > 0,
        hasPageId: Boolean(account.pageId?.trim()),
      })),
      hasPrimaryAccessToken: primaryAccessToken.length > 0,
      hasPrimaryPageId: Boolean(config.channels.instagram.pageId?.trim()),
    });
  }

  return {
    accountId,
    accessToken,
    pageId,
  };
}

async function rememberResolvedInstagramPageId(
  config: DashboardConfig,
  accountId: string,
  pageId?: string,
) {
  const normalizedAccountId = accountId.trim();
  const normalizedPageId = pageId?.trim();
  if (!normalizedAccountId || !normalizedPageId) {
    return;
  }

  const instagram = config.channels.instagram;
  let changed = false;
  const isPrimaryAccount = instagram.accountId.trim() === normalizedAccountId;
  const nextAccounts = (instagram.accounts ?? []).map((account) => {
    if (account.accountId !== normalizedAccountId) {
      return account;
    }

    if (account.pageId?.trim() === normalizedPageId) {
      return account;
    }

    changed = true;
    return {
      ...account,
      pageId: normalizedPageId,
    };
  });

  const nextPrimaryPageId =
    isPrimaryAccount && instagram.pageId?.trim() !== normalizedPageId
      ? normalizedPageId
      : instagram.pageId;

  if (nextPrimaryPageId !== instagram.pageId) {
    changed = true;
  }

  if (!changed) {
    return;
  }

  try {
    await saveDashboardConfigRecord({
      ...config,
      channels: {
        ...config.channels,
        instagram: {
          ...instagram,
          pageId: nextPrimaryPageId,
          accounts: nextAccounts,
        },
      },
    });
  } catch (error) {
    console.warn("[Instagram OAuth] Failed to persist resolved Page ID.", error);
  }
}

async function sendInstagramRequest(
  context: InstagramMessagingContext,
  body: Record<string, unknown>,
) {
  const normalizedAccessToken = normalizeSecretLikeValue(context.accessToken);
  const senderId = context.senderId?.trim();
  if (!senderId) {
    throw new Error("Instagram sender ID tidak tersedia.");
  }

  const sendUrl = buildGraphApiUrl(context.graphBaseUrl, `${senderId}/messages`);
  const response = await fetch(sendUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${normalizedAccessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const responseText = await response.text();
  let parsedBody: GraphApiResponse | null = null;
  try {
    parsedBody = responseText
      ? (JSON.parse(responseText) as GraphApiResponse)
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
    const gatewayInstance = input.whatsappGatewayInstanceOverride?.trim();
    if (gatewayInstance) {
      if (!input.recipientId) {
        return {
          ok: false,
          provider: "whatsapp-qr",
          status: 422,
          note: "Nomor tujuan WhatsApp QR tidak tersedia.",
        };
      }

      if (input.mediaAttachment) {
        return {
          ok: false,
          provider: "whatsapp-qr",
          status: 422,
          note: "WhatsApp QR saat ini hanya mendukung balasan teks.",
        };
      }

      try {
        const response = await sendWhatsAppQrText({
          instanceName: gatewayInstance,
          recipientId: input.recipientId,
          message: trimmedMessage,
        });
        const body = response && !Array.isArray(response)
          ? response as Record<string, unknown>
          : {};
        const key = body.key && typeof body.key === "object"
          ? body.key as Record<string, unknown>
          : null;
        return {
          ok: true,
          provider: "whatsapp-qr",
          status: 200,
          body,
          messageId: String(body.messageId ?? body.id ?? key?.id ?? "") || undefined,
        };
      } catch (error) {
        return {
          ok: false,
          provider: "whatsapp-qr",
          status: 502,
          note: error instanceof Error ? error.message : "Gagal mengirim lewat WhatsApp QR.",
        };
      }
    }

    const phoneNumberId =
      input.phoneNumberIdOverride?.trim() ||
      config.channels.whatsapp.phoneNumberId.trim();

    const matchingAccount = config.channels.whatsapp.accounts?.find(
      (acc) => acc.phoneNumberId === phoneNumberId,
    );
    const accessToken = normalizeSecretLikeValue(
      input.accessTokenOverride || matchingAccount?.accessToken || config.channels.whatsapp.accessToken,
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
    const resolvedCreds = resolveInstagramCredential(config, input.instagramAccountIdOverride);
    const accountId = resolvedCreds.accountId;
    const igAccessToken = input.accessTokenOverride || resolvedCreds.accessToken;
    const configuredPageId = resolvedCreds.pageId;

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
    await rememberResolvedInstagramPageId(config, accountId, messagingContext.pageId);

    if (!messagingContext.senderId?.trim()) {
      return {
        ok: false,
        provider: "instagram",
        status: 412,
        note: "Sender Instagram belum bisa diselesaikan otomatis dari token. Hubungkan ulang Instagram atau gunakan token Meta dengan izin pages_show_list.",
      };
    }

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
          messagingContext,
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
            messagingContext,
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
        messagingContext,
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
        const parseHint =
          igResponse.body?.error?.code === 190 &&
          igResponse.body?.error?.message?.toLowerCase().includes("cannot parse access token")
            ? ` | token=${summarizeSecret(messagingContext.accessToken)}`
            : "";

        return {
          ok: false,
          provider: "instagram",
          status: igResponse.status,
          body: igResponse.body,
          note: `Instagram API error (${igResponse.sendUrl}): ${igResponse.rawBody.slice(0, 300)}${tokenHint ? ` - ${tokenHint}` : ""}${parseHint}`,
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
    await rememberResolvedInstagramPageId(config, accountId, messagingContext.pageId);

    try {
      const sendUrl = buildGraphApiUrl(messagingContext.graphBaseUrl, `${commentId}/replies`);
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
  whatsappGatewayInstanceOverride?: string;
}) {
  if (input.whatsappGatewayInstanceOverride?.trim()) {
    return {
      ok: true,
      provider: "whatsapp-qr",
      status: 200,
      note: "Read indicator dikelola oleh Evolution API.",
    };
  }

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
  await rememberResolvedInstagramPageId(config, accountId, messagingContext.pageId);

  try {
    const deleteUrl = buildGraphApiUrl(messagingContext.graphBaseUrl, input.commentId);
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

export async function replyInstagramComment(input: {
  commentId: string;
  message: string;
  instagramAccountIdOverride?: string;
  accessTokenOverride?: string;
}) {
  const config = await getDashboardConfigRecord();
  const resolvedCreds = resolveInstagramCredential(config, input.instagramAccountIdOverride);
  const accountId = resolvedCreds.accountId;
  const igAccessToken = input.accessTokenOverride || resolvedCreds.accessToken;
  const configuredPageId = resolvedCreds.pageId;

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
  await rememberResolvedInstagramPageId(config, accountId, messagingContext.pageId);

  try {
    const replyUrl = buildGraphApiUrl(messagingContext.graphBaseUrl, `${input.commentId}/replies`);
    const response = await fetch(replyUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${messagingContext.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: input.message,
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
        provider: "instagram",
        status: response.status,
        body: parsedBody,
        note: `Gagal membalas komentar Instagram (${replyUrl}): ${responseText.slice(0, 300)}`,
      };
    }

    return {
      ok: true,
      provider: "instagram",
      status: response.status,
      body: parsedBody,
      messageId: parsedBody?.id as string | undefined,
    };
  } catch (error) {
    return {
      ok: false,
      provider: "instagram",
      status: 500,
      note: `Gagal membalas komentar Instagram: ${error instanceof Error ? error.message : "Unknown error"}`,
    };
  }
}
