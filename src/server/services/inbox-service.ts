import { randomUUID } from "node:crypto";

import { enqueueJob } from "@/server/repositories/job-repository";
import {
  getDashboardConfigRecord,
  getDashboardOperationsRecord,
  saveDashboardOperationsRecord,
} from "@/server/repositories/dashboard-repository";
import { generateReplyDecision, type ReplyDecision } from "@/server/services/reply-engine";
import {
  sendChannelMessage,
  sendWhatsAppReadTypingIndicator,
} from "@/server/services/channel-adapters";
import type {
  ChannelKind,
  ConversationMessage,
  ConversationRecord,
  ConversationStatus,
  CustomerRecord,
  MessageDeliveryStatus,
} from "@/types/operations";

export type NormalizedIncomingMessage = {
  channel: ChannelKind;
  externalUserId: string;
  displayName: string;
  messageText: string;
  messageType: "text" | "comment";
  timestamp: string;
  externalMessageId?: string;
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
  message: {
    sender: ConversationMessage["sender"];
    text: string;
    type: ConversationMessage["type"];
    status?: ConversationMessage["status"];
    externalId?: string;
  },
) {
  return {
    ...conversation,
    lastMessage: message.text,
    timestamp: "Sekarang",
    typingActor: null,
    messages: [
      ...conversation.messages,
      {
        id: randomUUID(),
        sender: message.sender,
        text: message.text,
        timestamp: new Date().toLocaleTimeString("id-ID", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        externalId: message.externalId,
        status: message.status,
        type: message.type,
      },
    ],
  };
}

function markOutgoingMessagesAsRead(messages: ConversationMessage[]) {
  return messages.map<ConversationMessage>((message) =>
    message.sender === "customer" || message.status === "read"
      ? message
      : {
          ...message,
          status: "read",
        },
  );
}

function resolveOutgoingMessageStatus(input: {
  channel: ChannelKind;
  delivered: boolean;
}): MessageDeliveryStatus {
  if (!input.delivered) {
    return "sent";
  }

  return input.channel === "WhatsApp" ? "sent" : "delivered";
}

function normalizeWebhookTimestamp(timestamp?: string) {
  if (!timestamp) {
    return new Date().toISOString();
  }

  const parsed = Number(timestamp);
  if (Number.isFinite(parsed) && parsed > 0) {
    return new Date(parsed * 1000).toISOString();
  }

  return new Date(timestamp).toISOString();
}

function wait(milliseconds: number) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, milliseconds);
  });
}

function buildDeliveryFailureNote(input: {
  channel: ChannelKind;
  note?: string;
  status?: number;
}) {
  const prefix =
    input.channel === "WhatsApp"
      ? "Pengiriman balasan WhatsApp gagal."
      : `Pengiriman balasan ${input.channel} gagal.`;

  if (input.note?.trim()) {
    return `${prefix} ${input.note.trim()}`;
  }

  if (input.status) {
    return `${prefix} Provider mengembalikan status ${input.status}.`;
  }

  return `${prefix} Periksa kredensial channel dan koneksi provider.`;
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
      lastSeenAt: null,
      typingActor: null,
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
    {
      ...conversation,
      messages: markOutgoingMessagesAsRead(conversation.messages),
      lastSeenAt: new Date().toISOString(),
      typingActor: "customer",
    },
    {
      sender: "customer",
      text: input.messageText,
      type: input.messageType === "comment" ? "comment" : "text",
      externalId: input.externalMessageId,
    },
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
    if (input.channel === "WhatsApp" && input.externalMessageId) {
      try {
        await sendWhatsAppReadTypingIndicator({
          incomingMessageId: input.externalMessageId,
        });
        await wait(900);
      } catch {
        // Tetap kirim balasan walau read/typing indicator gagal.
      }
    }

    const delivery = await sendChannelMessage({
      channel: input.channel,
      recipientId: input.phone ?? input.externalUserId,
      message: decision.reply,
    });

    conversation = appendMessage(
      conversation,
      {
        sender: "ai",
        text: decision.reply,
        type: "text",
        status: resolveOutgoingMessageStatus({
          channel: input.channel,
          delivered: delivery.ok,
        }),
        externalId: delivery.messageId,
      },
    );

    if (!delivery.ok) {
      conversation = appendMessage(conversation, {
        sender: "system",
        text: buildDeliveryFailureNote({
          channel: input.channel,
          note: delivery.note,
          status: delivery.status,
        }),
        type: "system",
      });
    }
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

function normalizeIncomingDeliveryStatus(
  status: string,
): MessageDeliveryStatus | null {
  switch (status) {
    case "sent":
    case "delivered":
    case "read":
      return status;
    default:
      return null;
  }
}

export async function updateIncomingMessageDeliveryStatus(input: {
  channel: ChannelKind;
  externalMessageId: string;
  status: string;
  timestamp?: string;
}) {
  const nextStatus = normalizeIncomingDeliveryStatus(input.status);
  if (!nextStatus) {
    return {
      updated: false,
      reason: "unsupported_status",
    };
  }

  const current = await getDashboardOperationsRecord();
  const conversation = current.conversations.find(
    (item) =>
      item.channel === input.channel &&
      item.messages.some((message) => message.externalId === input.externalMessageId),
  );

  if (!conversation) {
    return {
      updated: false,
      reason: "conversation_not_found",
    };
  }

  const nextConversation: ConversationRecord = {
    ...conversation,
    typingActor: null,
    lastSeenAt:
      nextStatus === "read"
        ? normalizeWebhookTimestamp(input.timestamp)
        : conversation.lastSeenAt,
    messages: conversation.messages.map((message) =>
      message.externalId === input.externalMessageId
        ? {
            ...message,
            status: nextStatus,
          }
        : message,
    ),
  };

  current.conversations = current.conversations.map((item) =>
    item.id === conversation.id ? nextConversation : item,
  );
  await saveDashboardOperationsRecord(current);

  return {
    updated: true,
    conversationId: conversation.id,
    status: nextStatus,
  };
}
