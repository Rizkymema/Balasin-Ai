import { randomUUID } from "node:crypto";

import { getDashboardConfigRecord, getDashboardOperationsRecord, saveDashboardOperationsRecord } from "@/server/repositories/dashboard-repository";
import { sendChannelMessage } from "@/server/services/channel-adapters";
import { formatClockTime } from "@/lib/time";
import type {
  ConversationMessage,
  ConversationRecord,
  ConversationStatus,
  CustomerRecord,
  DashboardOperationsData,
  LeadStatus,
  TicketPriority,
  TicketRecord,
} from "@/types/operations";

const AI_REPLY_STATUSES: ConversationStatus[] = ["ai_active", "waiting_customer"];

function formatMessageTimestamp(timezone?: string | null) {
  return formatClockTime(timezone);
}

function resolveOutgoingMessageStatus(
  channel: ConversationRecord["channel"],
  delivered: boolean,
) {
  if (!delivered) {
    return "sent" as const;
  }

  return channel === "WhatsApp" ? ("sent" as const) : ("delivered" as const);
}

function buildDeliveryFailureNote(input: {
  channel: ConversationRecord["channel"];
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

function mapConversationStatusToLeadStatus(status: ConversationStatus): LeadStatus {
  switch (status) {
    case "assigned_to_admin":
    case "blocked":
      return "Complaint";
    case "waiting_customer":
      return "Asked Price";
    case "resolved":
      return "Paid";
    case "spam":
      return "Spam";
    case "ai_paused":
      return "Booking";
    case "ai_active":
    default:
      return "Interested";
  }
}

function buildTicketForConversation(
  conversation: ConversationRecord,
  fallbackAssignee: string,
) {
  const priority: TicketPriority =
    conversation.riskLevel === "high"
      ? "high"
      : conversation.riskLevel === "medium"
        ? "medium"
        : "low";

  return {
    id: conversation.ticketId ?? `ticket-${conversation.id}`,
    conversationId: conversation.id,
    customerId: conversation.customerId,
    customerName: conversation.name,
    channel: conversation.channel,
    issueType: conversation.lastIntent,
    priority,
    status: conversation.status === "resolved" ? "resolved" : "open",
    assignedTo: conversation.assignedTo || fallbackAssignee,
    summary: conversation.summary || conversation.lastMessage,
    createdAt: "Sekarang",
    updatedAt: "Sekarang",
    resolutionNote: "",
  } satisfies TicketRecord;
}

function syncCustomerSnapshots(
  current: DashboardOperationsData,
  nextConversation: ConversationRecord,
) {
  return current.customers.map((customer) => {
    if (customer.id !== nextConversation.customerId) {
      return customer;
    }

    const activeTicketCount = current.tickets.filter(
      (ticket) =>
        ticket.customerId === customer.id && ticket.status !== "resolved",
    ).length;

    return {
      ...customer,
      note: nextConversation.notes,
      assignedTo: nextConversation.assignedTo,
      leadStatus: mapConversationStatusToLeadStatus(nextConversation.status),
      lastContact: nextConversation.timestamp,
      activeTicketCount,
    } satisfies CustomerRecord;
  });
}

function updateConversationState(
  current: DashboardOperationsData,
  nextConversation: ConversationRecord,
) {
  let nextTickets = current.tickets.slice();

  if (
    nextConversation.status === "assigned_to_admin" ||
    nextConversation.status === "blocked"
  ) {
    const existingTicketIndex = nextTickets.findIndex(
      (ticket) => ticket.conversationId === nextConversation.id,
    );
    const nextTicket = buildTicketForConversation(nextConversation, "Admin Desk");

    if (existingTicketIndex >= 0) {
      nextTickets[existingTicketIndex] = {
        ...nextTickets[existingTicketIndex],
        ...nextTicket,
        status:
          nextConversation.status === "blocked" ? "complaint" : "in_progress",
        updatedAt: "Sekarang",
      };
    } else {
      nextTickets = [
        {
          ...nextTicket,
          status:
            nextConversation.status === "blocked" ? "complaint" : "open",
        },
        ...nextTickets,
      ];
    }

    nextConversation = {
      ...nextConversation,
      ticketId:
        nextTickets.find((ticket) => ticket.conversationId === nextConversation.id)?.id ??
        nextConversation.ticketId,
    };
  }

  if (nextConversation.status === "resolved" && nextConversation.ticketId) {
    nextTickets = nextTickets.map((ticket) =>
      ticket.id === nextConversation.ticketId
        ? {
            ...ticket,
            status: "resolved",
            updatedAt: "Sekarang",
            resolutionNote: "Diselesaikan dari inbox dashboard.",
          }
        : ticket,
    );
  }

  const nextState = {
    ...current,
    conversations: current.conversations.map((item) =>
      item.id === nextConversation.id ? nextConversation : item,
    ),
    tickets: nextTickets,
    lastUpdatedAt: new Date().toISOString(),
  };

  return {
    ...nextState,
    customers: syncCustomerSnapshots(nextState, nextConversation),
  };
}

function recalculateCustomerSummary(current: DashboardOperationsData) {
  return current.customers.map((customer) => {
    const customerConversations = current.conversations.filter(
      (conversation) => conversation.customerId === customer.id,
    );
    const latestConversation = customerConversations[0] ?? null;
    const activeTicketCount = current.tickets.filter(
      (ticket) =>
        ticket.customerId === customer.id && ticket.status !== "resolved",
    ).length;

    return {
      ...customer,
      totalConversation: customerConversations.length,
      lastContact: latestConversation?.timestamp ?? customer.lastContact,
      assignedTo: latestConversation?.assignedTo ?? customer.assignedTo,
      note: latestConversation?.notes ?? customer.note,
      activeTicketCount,
    } satisfies CustomerRecord;
  });
}

function getConversationOrThrow(current: DashboardOperationsData, id: string) {
  const conversation = current.conversations.find((item) => item.id === id);
  if (!conversation) {
    throw new Error("Conversation not found.");
  }

  return conversation;
}

export async function sendInboxReply(input: {
  conversationId: string;
  message: string;
}) {
  const config = await getDashboardConfigRecord();
  const current = await getDashboardOperationsRecord();
  const conversation = getConversationOrThrow(current, input.conversationId);
  const isAiReply = AI_REPLY_STATUSES.includes(conversation.status);
  const sender: ConversationMessage["sender"] = isAiReply ? "ai" : "admin";
  const recipientId =
    conversation.channel === "Instagram DM"
      ? conversation.channelContext?.externalUserId || conversation.channelContext?.instagramUserId || conversation.username || conversation.customerId
      : conversation.phone ?? conversation.username ?? conversation.customerId;

  const delivery = await sendChannelMessage({
    channel: conversation.channel,
    recipientId,
    message: input.message,
    phoneNumberIdOverride: conversation.channelContext?.whatsappPhoneNumberId,
  });

  const outgoingMessage: ConversationMessage = {
    id: randomUUID(),
    sender,
    text: input.message,
    timestamp: formatMessageTimestamp(config.workspace.timezone),
    externalId: delivery.messageId,
    status: resolveOutgoingMessageStatus(conversation.channel, delivery.ok),
    type: "text",
  };

  const nextConversation = {
    ...conversation,
    lastMessage: input.message,
    timestamp: "Sekarang",
    unreadCount: 0,
    lastSeenAt: new Date().toISOString(),
    typingActor: null,
    status: isAiReply ? conversation.status : "assigned_to_admin",
    assignedTo: isAiReply ? config.aiAgent.name : "Admin Desk",
    messages: [...conversation.messages, outgoingMessage],
    summary: isAiReply
      ? conversation.summary
      : "Admin sudah mengambil alih percakapan dan mengirim balasan manual.",
  } satisfies ConversationRecord;

  if (!delivery.ok) {
    nextConversation.messages.push({
      id: randomUUID(),
      sender: "system",
      text: buildDeliveryFailureNote({
        channel: conversation.channel,
        note: delivery.note,
        status: delivery.status,
      }),
      timestamp: formatMessageTimestamp(config.workspace.timezone),
      type: "system",
    });
    nextConversation.lastMessage = nextConversation.messages.at(-1)?.text ?? input.message;
  }

  const nextState = updateConversationState(current, nextConversation);
  await saveDashboardOperationsRecord(nextState);

  return {
    conversation: nextState.conversations.find((item) => item.id === conversation.id) ?? nextConversation,
    delivery,
  };
}

export async function updateInboxConversationStatus(input: {
  conversationId: string;
  status: ConversationStatus;
}) {
  const config = await getDashboardConfigRecord();
  const current = await getDashboardOperationsRecord();
  const conversation = getConversationOrThrow(current, input.conversationId);

  const assignedTo =
    input.status === "ai_active" || input.status === "waiting_customer"
      ? config.aiAgent.name
      : input.status === "spam"
        ? "Moderation Engine"
        : "Admin Desk";

  const nextConversation = {
    ...conversation,
    status: input.status,
    assignedTo,
    timestamp: "Sekarang",
    lastSeenAt: new Date().toISOString(),
    typingActor: null,
    summary:
      input.status === "assigned_to_admin"
        ? "AI menghentikan balasan otomatis dan meneruskan kasus ke admin."
        : input.status === "ai_paused"
          ? "AI dipause sementara dan percakapan menunggu tindak lanjut admin."
          : input.status === "resolved"
            ? "Percakapan ditandai selesai dari dashboard inbox."
            : conversation.summary,
  } satisfies ConversationRecord;

  const nextState = updateConversationState(current, nextConversation);
  await saveDashboardOperationsRecord(nextState);

  return nextState.conversations.find((item) => item.id === conversation.id) ?? nextConversation;
}

export async function markInboxConversationSeen(input: { conversationId: string }) {
  const current = await getDashboardOperationsRecord();
  const conversation = getConversationOrThrow(current, input.conversationId);

  const nextConversation = {
    ...conversation,
    unreadCount: 0,
    lastSeenAt: new Date().toISOString(),
    typingActor: null,
  } satisfies ConversationRecord;

  const nextState = updateConversationState(current, nextConversation);
  await saveDashboardOperationsRecord(nextState);

  return nextState.conversations.find((item) => item.id === conversation.id) ?? nextConversation;
}

export async function deleteInboxConversation(input: { conversationId: string }) {
  const current = await getDashboardOperationsRecord();
  const conversation = getConversationOrThrow(current, input.conversationId);

  const nextState: DashboardOperationsData = {
    ...current,
    conversations: current.conversations.filter(
      (item) => item.id !== input.conversationId,
    ),
    tickets: current.tickets.filter(
      (ticket) => ticket.conversationId !== input.conversationId,
    ),
    lastUpdatedAt: new Date().toISOString(),
  };

  nextState.customers = recalculateCustomerSummary(nextState);
  await saveDashboardOperationsRecord(nextState);

  return {
    deletedConversationId: conversation.id,
  };
}

export async function updateInboxConversationNotes(input: {
  conversationId: string;
  notes: string;
}) {
  const current = await getDashboardOperationsRecord();
  const conversation = getConversationOrThrow(current, input.conversationId);

  const nextConversation = {
    ...conversation,
    notes: input.notes,
  } satisfies ConversationRecord;

  const nextState = updateConversationState(current, nextConversation);
  await saveDashboardOperationsRecord(nextState);

  return nextState.conversations.find((item) => item.id === conversation.id) ?? nextConversation;
}

export async function createInboxTicket(input: { conversationId: string }) {
  const current = await getDashboardOperationsRecord();
  const conversation = getConversationOrThrow(current, input.conversationId);

  const nextConversation = {
    ...conversation,
    status: "assigned_to_admin",
    assignedTo: "Admin Desk",
    timestamp: "Sekarang",
  } satisfies ConversationRecord;

  const nextState = updateConversationState(current, nextConversation);
  await saveDashboardOperationsRecord(nextState);

  return {
    conversation:
      nextState.conversations.find((item) => item.id === conversation.id) ?? nextConversation,
    ticket:
      nextState.tickets.find((item) => item.conversationId === conversation.id) ?? null,
  };
}
