import { getDashboardConfigRecord, getDashboardOperationsRecord, saveDashboardOperationsRecord } from "@/server/repositories/dashboard-repository";
import { serverEnv } from "@/server/env";
import { jsonError, jsonOk, requireApiSession } from "@/server/http";
import { replyInstagramComment } from "@/server/services/channel-adapters";
import { randomUUID } from "node:crypto";
import type { ConversationRecord, ConversationMessage } from "@/types/operations";

async function isAuthorized(request: Request): Promise<boolean> {
  const secret = request.headers.get("x-worker-secret")?.trim() ?? "";
  const authHeader = request.headers.get("authorization")?.trim() ?? "";
  let bearerToken = "";
  if (authHeader.toLowerCase().startsWith("bearer ")) {
    bearerToken = authHeader.substring(7).trim();
  }

  const config = await getDashboardConfigRecord();
  const workerSecret = config.runtime.workerSecret?.trim() || serverEnv.workerSecret?.trim();
  
  if (workerSecret && (secret === workerSecret || bearerToken === workerSecret)) {
    return true;
  }

  const { response } = await requireApiSession();
  return !response;
}

export async function POST(request: Request) {
  if (!(await isAuthorized(request))) {
    return jsonError("Unauthorized.", 401);
  }

  try {
    const body = await request.json();
    const commentId = body.commentId || body.comment_id;
    const messageText = body.message || body.text;
    const instagramAccountIdOverride = body.instagramAccountId || body.instagram_account_id;
    const accessTokenOverride = body.access_token || body.accessToken;

    if (!commentId) {
      return jsonError("Comment ID (commentId / comment_id) wajib diisi.", 400);
    }
    if (!messageText) {
      return jsonError("Pesan balasan (message / text) wajib diisi.", 400);
    }

    const config = await getDashboardConfigRecord();
    const ops = await getDashboardOperationsRecord();

    // Send reply via Graph API
    const delivery = await replyInstagramComment({
      commentId,
      message: messageText,
      instagramAccountIdOverride,
      accessTokenOverride
    });

    if (!delivery.ok) {
      return jsonError(`Gagal membalas komentar Instagram: ${delivery.note || "Meta API error"}`, delivery.status || 502);
    }

    // Optional: Log to conversation if we can find a matching conversation with "commentId"
    // Let's scan existing conversations for a comment message matching the target commentId
    let targetConv = ops.conversations.find(c => 
      c.channel === "Instagram Comment" && 
      c.messages.some(m => m.externalId === commentId)
    );

    if (targetConv) {
      const outgoingMessage: ConversationMessage = {
        id: randomUUID(),
        sender: "admin",
        text: messageText,
        timestamp: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
        externalId: delivery.messageId,
        status: "sent",
        type: "comment"
      };

      const updatedConversations = ops.conversations.map(c => {
        if (c.id === targetConv!.id) {
          return {
            ...c,
            lastMessage: `[Reply] ${messageText}`,
            timestamp: "Sekarang",
            messages: [...c.messages, outgoingMessage]
          };
        }
        return c;
      });

      await saveDashboardOperationsRecord({
        ...ops,
        conversations: updatedConversations
      });
    }

    return jsonOk({
      ok: true,
      messageId: delivery.messageId,
      status: "sent",
      commentId
    });
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "Gagal memproses balasan komentar Instagram.",
      500
    );
  }
}
