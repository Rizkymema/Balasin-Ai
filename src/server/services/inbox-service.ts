import { randomUUID } from "node:crypto";

import { enqueueJob } from "@/server/repositories/job-repository";
import {
  getDashboardConfigRecord,
  getDashboardOperationsRecord,
  saveDashboardOperationsRecord,
} from "@/server/repositories/dashboard-repository";
import { generateReplyDecision, type ReplyDecision } from "@/server/services/reply-engine";
import { sendChannelMessage } from "@/server/services/channel-adapters";
import type {
  ChannelKind,
  ConversationMessage,
  ConversationRecord,
  ConversationStatus,
  CustomerRecord,
} from "@/types/operations";

export type NormalizedIncomingMessage = {
  channel: ChannelKind;
  externalUserId: string;
  displayName: string;
  messageText: string;
  messageType: "text" | "comment";
  timestamp: string;
  username?: string;
  phone?: string;
  rawPayload: Record<string, unknown>;
};

function buildCustomer(channel: ChannelKind, message: NormalizedIncomingMessage): CustomerRecord {
  return {
    id: randomUUID(),
    name: message.displayName,
    channel,
    leadStatus: "New Lead",
    tags: [],
    lastContact: "Sekarang",
    assignedTo: "Sistem",
    totalConversation: 1,
    revenueHint: "Rp0",
    note: "",
    phone: message.phone,
    email: `${message.externalUserId}@local.balesin`,
    username: message.username,
    segment: "Baru",
    activeTicketCount: 0,
  };
}

function appendMessage(
  conversation: ConversationRecord,
  sender: ConversationMessage["sender"],
  text: string,
  type: ConversationMessage["type"],
) {
  return {
    ...conversation,
    lastMessage: text,
    timestamp: "Sekarang",
    messages: [
      ...conversation.messages,
      {
        id: randomUUID(),
        sender,
        text,
        timestamp: new Date().toLocaleTimeString("id-ID", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        type,
      },
    ],
  };
}

export async function processIncomingMessage(input: NormalizedIncomingMessage) {
  const config = await getDashboardConfigRecord();
  const current = await getDashboardOperationsRecord();
  const decision: ReplyDecision = await generateReplyDecision(input.messageText, config);

  let customer =
    current.customers.find(
      (item) =>
        item.phone === input.phone ||
        item.username === input.username ||
        item.name === input.displayName,
    ) ?? buildCustomer(input.channel, input);

  if (!current.customers.find((item) => item.id === customer.id)) {
    current.customers.unshift(customer);
  }

  let conversation =
    current.conversations.find((item) => item.customerId === customer.id) ??
    ({
      id: randomUUID(),
      customerId: customer.id,
      name: input.displayName,
      channel: input.channel,
      lastMessage: "",
      timestamp: "Sekarang",
      unreadCount: 0,
      status: "ai_active",
      messages: [],
      tags: [],
      notes: "",
      summary: "",
      phone: input.phone,
      email: customer.email,
      username: input.username,
      assignedTo: config.aiAgent.name,
      responseTimeSeconds: 0,
      lastIntent: "FAQ umum",
      sentiment: "neutral",
      aiConfidence: 80,
      riskLevel: "low",
      ticketId: null,
    } satisfies ConversationRecord);

  conversation = appendMessage(
    conversation,
    "customer",
    input.messageText,
    input.messageType === "comment" ? "comment" : "text",
  );

  conversation = {
    ...conversation,
    status: decision.status,
    summary: decision.summary,
    lastIntent: decision.intent,
    aiConfidence: decision.confidence,
    assignedTo:
      decision.status === "assigned_to_admin" ? "Admin Desk" : config.aiAgent.name,
    unreadCount: conversation.unreadCount + 1,
    riskLevel:
      decision.status === "assigned_to_admin" || decision.status === "spam"
        ? "high"
        : decision.status === "waiting_customer"
          ? "medium"
          : "low",
  };

  if (decision.reply && decision.status !== "spam") {
    conversation = appendMessage(conversation, "ai", decision.reply, "text");
    await sendChannelMessage({
      channel: input.channel,
      recipientId: input.phone ?? input.externalUserId,
      message: decision.reply,
    });
  }

  if (!current.conversations.find((item) => item.id === conversation.id)) {
    current.conversations.unshift(conversation);
  } else {
    current.conversations = current.conversations.map((item) =>
      item.id === conversation.id ? conversation : item,
    );
  }

  customer = {
    ...customer,
    leadStatus:
      decision.status === "assigned_to_admin"
        ? "Complaint"
        : decision.status === "waiting_customer"
          ? "Booking"
          : decision.status === "spam"
            ? "Spam"
            : "Interested",
    totalConversation: customer.totalConversation + 1,
    lastContact: "Sekarang",
    assignedTo: conversation.assignedTo,
  };

  current.customers = current.customers.map((item) =>
    item.id === customer.id ? customer : item,
  );

  if (decision.status === "assigned_to_admin") {
    enqueueJob({
      type: "handoff_notify",
      payload: {
        conversationId: conversation.id,
        customerId: customer.id,
      },
    });
  }

  if (decision.status === "waiting_customer") {
    enqueueJob({
      type: "lead_followup",
      payload: {
        conversationId: conversation.id,
      },
      runAt: new Date(Date.now() + 1000 * 60 * 60 * config.automation.followUpDelayHours).toISOString(),
    });
  }

  await saveDashboardOperationsRecord(current);

  return {
    conversation,
    customer,
    decision,
  };
}
