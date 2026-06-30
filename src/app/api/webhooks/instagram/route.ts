import { getDashboardConfigRecord } from "@/server/repositories/dashboard-repository";
import { recordWebhookEvent } from "@/server/repositories/webhook-repository";
import { processIncomingMessage } from "@/server/services/inbox-service";
import { isNegativeComment } from "@/server/services/reply-engine";
import { deleteInstagramComment } from "@/server/services/channel-adapters";
import { jsonError, jsonOk } from "@/server/http";

/**
 * Webhook format dari Meta Instagram Messaging API:
 *
 * DM (messaging):
 * {
 *   "object": "instagram",
 *   "entry": [{
 *     "id": "<IGID>",
 *     "time": 123456,
 *     "messaging": [{
 *       "sender": { "id": "<IGSID>" },
 *       "recipient": { "id": "<IGID>" },
 *       "timestamp": 123456,
 *       "message": { "mid": "<MID>", "text": "Hello" }
 *     }]
 *   }]
 * }
 *
 * Comment (changes):
 * {
 *   "object": "instagram",
 *   "entry": [{
 *     "id": "<IGID>",
 *     "time": 123456,
 *     "changes": [{
 *       "field": "comments",
 *       "value": {
 *         "from": { "id": "<UID>", "username": "user" },
 *         "text": "Nice!"
 *       }
 *     }]
 *   }]
 * }
 */

type InstagramWebhookBody = {
  object?: string;
  entry?: Array<{
    id?: string;
    time?: number;
    messaging?: Array<{
      sender?: { id?: string };
      recipient?: { id?: string };
      timestamp?: number;
      message?: {
        mid?: string;
        text?: string;
        is_echo?: boolean;
      };
    }>;
    changes?: Array<{
      field?: string;
      value?: {
        from?: { id?: string; username?: string };
        text?: string;
        media?: { id?: string };
        id?: string;
      };
    }>;
  }>;
  // Fallback: format sederhana untuk simulasi test dari dashboard
  sender?: { id?: string; username?: string };
  message?: { text?: string; mid?: string };
  comment?: { text?: string; from?: { username?: string; id?: string }; id?: string };
};

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
}

export async function GET(request: Request) {
  try {
    const config = await getDashboardConfigRecord();
    const { searchParams } = new URL(request.url);
    const mode = searchParams.get("hub.mode");
    const token = searchParams.get("hub.verify_token");
    const challenge = searchParams.get("hub.challenge");

    const expectedToken =
      config.channels.instagram.verifyToken ||
      config.channels.whatsapp.verifyToken ||
      "MANADO123";

    if (mode === "subscribe" && token === expectedToken) {
      return new Response(challenge ?? "OK", { status: 200 });
    }

    return new Response("Forbidden", { status: 403 });
  } catch {
    return new Response("Internal Server Error", { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as InstagramWebhookBody;
    const config = await getDashboardConfigRecord();
    const ownAccountId = config.channels.instagram.accountId?.trim();

    // Helper to check if a sender ID belongs to one of our connected accounts
    const isOwnInstagramAccount = (senderId: string) => {
      if (ownAccountId && senderId === ownAccountId) return true;
      return config.channels.instagram.accounts?.some(
        (acc) => acc.accountId === senderId
      ) ?? false;
    };

    // ─── Format Meta resmi: object === "instagram" ───
    if (body.object === "instagram" && body.entry) {
      let receivedCount = 0;
      let ignoredCount = 0;

      for (const entry of body.entry) {
        // DM melalui field "messaging"
        const messagingEvents = entry.messaging ?? [];
        for (const event of messagingEvents) {
          // Abaikan echo (pesan yang dikirim oleh halaman sendiri)
          if (event.message?.is_echo) {
            ignoredCount += 1;
            continue;
          }

          const text = event.message?.text;
          if (!text) {
            ignoredCount += 1;
            continue;
          }

          const senderId = event.sender?.id ?? "unknown";

          // Jangan proses pesan dari akun sendiri (multi-account check)
          if (isOwnInstagramAccount(senderId)) {
            ignoredCount += 1;
            continue;
          }

          const recipientId = event.recipient?.id || entry.id || ownAccountId;

          const normalized = {
            channel: "Instagram DM" as const,
            externalUserId: senderId,
            displayName: `IG:${senderId}`,
            messageText: text,
            messageType: "text" as const,
            timestamp: event.timestamp
              ? new Date(event.timestamp * 1000).toISOString()
              : new Date().toISOString(),
            externalMessageId: event.message?.mid,
            username: `IG:${senderId}`,
            channelContext: {
              instagramAccountId: recipientId,
            },
            rawPayload: body as Record<string, unknown>,
          };

          try {
            await recordWebhookEvent({
              source: "instagram",
              payload: body as Record<string, unknown>,
              normalized,
              status: "received",
            });
          } catch (error) {
            console.error("[instagram-webhook] failed to record dm event", {
              error: getErrorMessage(error),
              externalMessageId: event.message?.mid,
              externalUserId: senderId,
            });
            throw error;
          }

          try {
            await processIncomingMessage(normalized);
          } catch (error) {
            console.error("[instagram-webhook] failed to process dm event", {
              error: getErrorMessage(error),
              externalMessageId: event.message?.mid,
              externalUserId: senderId,
            });
            throw error;
          }
          receivedCount += 1;
        }

        // Komentar melalui field "changes"
        const changeEvents = entry.changes ?? [];
        for (const change of changeEvents) {
          if (change.field !== "comments" || !change.value?.text) {
            ignoredCount += 1;
            continue;
          }

          const from = change.value.from;
          const senderId = from?.id ?? "unknown";
          const senderUsername = from?.username ?? "Instagram User";

          // Abaikan komentar dari akun sendiri
          if (isOwnInstagramAccount(senderId)) {
            ignoredCount += 1;
            continue;
          }

          const recipientId = entry.id || ownAccountId;
          const commentText = change.value.text;
          const commentId = change.value.id;

          // Hapus komentar negatif secara otomatis jika dideteksi
          if (config.automation.sentimentGuard && commentId && (await isNegativeComment(commentText, config))) {
            console.log(`[instagram-webhook] negative comment detected: "${commentText}". Deleting...`);
            try {
              await deleteInstagramComment({
                commentId,
                instagramAccountIdOverride: recipientId,
              });
            } catch (error) {
              console.error("[instagram-webhook] failed to delete negative comment", error);
            }

            try {
              await recordWebhookEvent({
                source: "instagram",
                payload: body as Record<string, unknown>,
                normalized: {
                  channel: "Instagram Comment" as const,
                  externalUserId: senderId,
                  displayName: senderUsername,
                  messageText: `[AUTO-DELETED NEGATIVE COMMENT] ${commentText}`,
                  messageType: "comment" as const,
                  timestamp: entry.time
                    ? new Date(entry.time * 1000).toISOString()
                    : new Date().toISOString(),
                  username: senderUsername,
                  channelContext: {
                    instagramAccountId: recipientId,
                  },
                  externalMessageId: commentId,
                  rawPayload: body as Record<string, unknown>,
                },
                status: "ignored",
              });
            } catch (error) {
              console.error("[instagram-webhook] failed to record negative comment event", error);
            }

            ignoredCount += 1;
            continue;
          }

          const normalized = {
            channel: "Instagram Comment" as const,
            externalUserId: senderId,
            displayName: senderUsername,
            messageText: commentText,
            messageType: "comment" as const,
            timestamp: entry.time
              ? new Date(entry.time * 1000).toISOString()
              : new Date().toISOString(),
            username: senderUsername,
            externalMessageId: commentId,
            channelContext: {
              instagramAccountId: recipientId,
            },
            rawPayload: body as Record<string, unknown>,
          };

          try {
            await recordWebhookEvent({
              source: "instagram",
              payload: body as Record<string, unknown>,
              normalized,
              status: "received",
            });
          } catch (error) {
            console.error("[instagram-webhook] failed to record comment event", {
              error: getErrorMessage(error),
              externalUserId: senderId,
              senderUsername,
            });
            throw error;
          }

          try {
            await processIncomingMessage(normalized);
          } catch (error) {
            console.error("[instagram-webhook] failed to process comment event", {
              error: getErrorMessage(error),
              externalUserId: senderId,
              senderUsername,
            });
            throw error;
          }
          receivedCount += 1;
        }
      }

      if (receivedCount === 0) {
        await recordWebhookEvent({
          source: "instagram",
          payload: body as Record<string, unknown>,
          status: "ignored",
        });
        return jsonOk({ ignored: true, ignoredCount });
      }

      return jsonOk(
        { received: receivedCount, ignored: ignoredCount },
        { status: 201 },
      );
    }

    // ─── Fallback: format sederhana (test simulasi dari dashboard) ───
    const isComment = Boolean(body.comment?.text);
    const text = body.message?.text ?? body.comment?.text;
    const displayName =
      body.comment?.from?.username ?? body.sender?.username ?? "Instagram User";
    const externalUserId =
      body.comment?.from?.id ?? body.sender?.id ?? displayName;

    if (!text) {
      await recordWebhookEvent({
        source: "instagram",
        payload: body as Record<string, unknown>,
        status: "ignored",
      });
      return jsonOk({ ignored: true });
    }

    const commentId = body.comment?.id || body.message?.mid;

    // Hapus komentar negatif secara otomatis jika dideteksi
    if (config.automation.sentimentGuard && isComment && commentId && (await isNegativeComment(text, config))) {
      console.log(`[instagram-webhook] fallback negative comment detected: "${text}". Deleting...`);
      try {
        await deleteInstagramComment({
          commentId,
          instagramAccountIdOverride: ownAccountId,
        });
      } catch (error) {
        console.error("[instagram-webhook] fallback failed to delete comment", error);
      }

      await recordWebhookEvent({
        source: "instagram",
        payload: body as Record<string, unknown>,
        normalized: {
          channel: "Instagram Comment" as const,
          externalUserId,
          displayName,
          messageText: `[AUTO-DELETED NEGATIVE COMMENT] ${text}`,
          messageType: "comment" as const,
          timestamp: new Date().toISOString(),
          username: displayName,
          externalMessageId: commentId,
          rawPayload: body as Record<string, unknown>,
          channelContext: {
            instagramAccountId: ownAccountId,
          },
        },
        status: "ignored",
      });

      return jsonOk({ ignored: true, deleted: true });
    }

    const normalized = {
      channel: isComment ? ("Instagram Comment" as const) : ("Instagram DM" as const),
      externalUserId,
      displayName,
      messageText: text,
      messageType: isComment ? ("comment" as const) : ("text" as const),
      timestamp: new Date().toISOString(),
      username: displayName,
      rawPayload: body as Record<string, unknown>,
      externalMessageId: commentId,
      channelContext: {
        instagramAccountId: ownAccountId,
      },
    };

    try {
      await recordWebhookEvent({
        source: "instagram",
        payload: body as Record<string, unknown>,
        normalized,
        status: "received",
      });
    } catch (error) {
      console.error("[instagram-webhook] failed to record fallback event", {
        error: getErrorMessage(error),
        externalUserId,
        displayName,
      });
      throw error;
    }

    let result;
    try {
      result = await processIncomingMessage(normalized);
    } catch (error) {
      console.error("[instagram-webhook] failed to process fallback event", {
        error: getErrorMessage(error),
        externalUserId,
        displayName,
      });
      throw error;
    }
    return jsonOk(result, { status: 201 });
  } catch (error) {
    console.error("[instagram-webhook] unhandled webhook error", {
      error: getErrorMessage(error),
    });
    return jsonError("Gagal memproses webhook Instagram.", 500);
  }
}
