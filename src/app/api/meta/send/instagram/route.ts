import { getDashboardConfigRecord, getDashboardOperationsRecord, saveDashboardOperationsRecord } from "@/server/repositories/dashboard-repository";
import { serverEnv } from "@/server/env";
import { jsonError, jsonOk, requireApiSession } from "@/server/http";
import { sendChannelMessage } from "@/server/services/channel-adapters";
import { randomUUID } from "node:crypto";
import type { ConversationRecord, ConversationMessage, CustomerRecord } from "@/types/operations";

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
    
    // Support standard Meta payload or simplified fields
    const recipientId = body.recipient?.id || body.recipientId || body.to;
    const messageText = body.message?.text || body.message || body.text;
    const instagramAccountIdOverride = body.instagram_account_id || body.instagramAccountId || body.accountId;
    const accessTokenOverride = body.access_token || body.accessToken;

    if (!recipientId) {
      return jsonError("Recipient ID (recipient.id / recipientId) wajib diisi.", 400);
    }
    if (!messageText) {
      return jsonError("Pesan (message.text / message) wajib diisi.", 400);
    }

    const config = await getDashboardConfigRecord();
    const ops = await getDashboardOperationsRecord();

    // 1. Resolve or create customer
    const cleanId = recipientId.trim();
    let customer = ops.customers.find(c => c.username === cleanId || c.id === cleanId);
    if (!customer) {
      customer = {
        id: "cust-" + randomUUID().substring(0, 8),
        name: `IG:${cleanId}`,
        channel: "Instagram DM",
        leadStatus: "Interested",
        tags: ["API Outbound"],
        lastContact: "Sekarang",
        assignedTo: "API Integration",
        totalConversation: 1,
        revenueHint: "Rp0",
        note: "Dibuat otomatis via integrasi API",
        email: `${cleanId}@instagram.local`,
        username: cleanId,
        segment: "Baru",
        activeTicketCount: 0
      };
      ops.customers.unshift(customer);
    }

    // 2. Resolve or create conversation
    let conversation = ops.conversations.find(c => c.customerId === customer.id && c.channel === "Instagram DM");
    if (!conversation) {
      conversation = {
        id: "conv-" + randomUUID().substring(0, 8),
        customerId: customer.id,
        name: customer.name,
        channel: "Instagram DM",
        lastMessage: "",
        timestamp: "Sekarang",
        unreadCount: 0,
        status: "assigned_to_admin",
        messages: [],
        tags: [],
        notes: "Percakapan dibuat otomatis via integrasi API",
        summary: "",
        lastSeenAt: null,
        typingActor: null,
        phone: customer.phone,
        email: customer.email,
        username: customer.username,
        assignedTo: "Admin Desk",
        responseTimeSeconds: 0,
        lastIntent: "API",
        sentiment: "neutral",
        aiConfidence: 100,
        riskLevel: "low",
        ticketId: null,
        channelContext: {
          instagramAccountId: instagramAccountIdOverride || config.channels.instagram.accountId
        }
      };
      ops.conversations.unshift(conversation);
    }

    // 3. Send message via channel adapter
    const delivery = await sendChannelMessage({
      channel: "Instagram DM",
      recipientId: cleanId,
      message: messageText,
      instagramAccountIdOverride,
      accessTokenOverride
    });

    if (!delivery.ok) {
      return jsonError(`Gagal mengirim Instagram DM: ${delivery.note || "Meta API error"}`, delivery.status || 502);
    }

    // 4. Save outgoing message to DB
    const outgoingMessage: ConversationMessage = {
      id: randomUUID(),
      sender: "admin",
      text: messageText,
      timestamp: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
      externalId: delivery.messageId,
      status: "sent",
      type: "text"
    };

    // Update conversation record
    const updatedConversations = ops.conversations.map(c => {
      if (c.id === conversation.id) {
        return {
          ...c,
          lastMessage: messageText,
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

    return jsonOk({
      ok: true,
      messageId: delivery.messageId,
      status: "sent",
      recipient: cleanId
    });
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "Gagal memproses pengiriman pesan Instagram DM.",
      500
    );
  }
}
