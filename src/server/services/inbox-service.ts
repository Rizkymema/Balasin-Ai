import { randomUUID } from "node:crypto";

import { enqueueJob } from "@/server/repositories/job-repository";
import {
  getDashboardConfigRecord,
  getDashboardOperationsRecord,
  saveDashboardOperationsRecord,
} from "@/server/repositories/dashboard-repository";
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

type IntentDecision = {
  intent: string;
  confidence: number;
  needsHuman: boolean;
  status: ConversationStatus;
  summary: string;
  reply?: string;
};

function detectIntent(messageText: string) {
  const lower = messageText.toLowerCase();

  if (lower.includes("booking") || lower.includes("servis besok")) {
    return "Booking";
  }
  if (lower.includes("harga") || lower.includes("berapa")) {
    return "Tanya harga";
  }
  if (lower.includes("stok") || lower.includes("ready")) {
    return "Tanya stok";
  }
  if (lower.includes("refund") || lower.includes("komplain")) {
    return "Komplain";
  }
  if (lower.includes("judol") || lower.includes("link di bio")) {
    return "Spam";
  }
  return "FAQ umum";
}

function buildDecision(messageText: string): IntentDecision {
  const lower = messageText.toLowerCase();
  const intent = detectIntent(messageText);

  if (intent === "Spam") {
    return {
      intent,
      confidence: 99,
      needsHuman: false,
      status: "spam",
      summary: "Pesan terdeteksi sebagai spam dan tidak diteruskan ke alur aktif.",
    };
  }

  if (intent === "Komplain") {
    return {
      intent,
      confidence: 40,
      needsHuman: true,
      status: "assigned_to_admin",
      summary: "Customer mengirim komplain dan perlu penanganan admin.",
      reply:
        "Terima kasih, pesan Anda sudah kami teruskan ke admin agar ditangani dengan lebih tepat.",
    };
  }

  if (intent === "Booking") {
    return {
      intent,
      confidence: 83,
      needsHuman: false,
      status: "waiting_customer",
      summary: "Customer ingin booking dan sistem perlu mengumpulkan detail tambahan.",
      reply:
        "Siap, kami bantu booking. Mohon kirim nama, tipe motor, keluhan, tanggal, dan jam yang diinginkan ya.",
    };
  }

  if (lower.includes("harga") || lower.includes("berapa")) {
    return {
      intent,
      confidence: 88,
      needsHuman: false,
      status: "ai_active",
      summary: "Customer menanyakan harga dan masih aman dijawab otomatis jika data tersedia.",
      reply:
        "Kami bantu cek harga ya. Jika perlu estimasi yang lebih akurat, mohon sertakan tipe motor atau detail layanan yang dimaksud.",
    };
  }

  return {
    intent,
    confidence: 84,
    needsHuman: false,
    status: "ai_active",
    summary: "Pesan umum masih aman diproses otomatis oleh sistem.",
    reply:
      "Terima kasih, pesan Anda sudah kami terima. Kami bantu jawab sesuai informasi yang tersedia ya.",
  };
}

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
  const decision = buildDecision(input.messageText);

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
