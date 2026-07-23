import { randomUUID } from "node:crypto";

import { enqueueJob } from "@/server/repositories/job-repository";
import type { DashboardConfig } from "@/types/dashboard-config";
import {
  getDashboardConfigRecord,
  getDashboardOperationsRecord,
  recordKnowledgeGap,
  saveDashboardOperationsRecord,
} from "@/server/repositories/dashboard-repository";
import { formatClockTime } from "@/lib/time";
import {
  analyzeSentiment,
  applyConfiguredResponsePolicy,
  classifyInboundSafety,
  generateReplyDecision,
  type ReplyContext,
  type ReplyDecision,
} from "@/server/services/reply-engine";
import {
  sendChannelMessage,
  sendWhatsAppReadTypingIndicator,
} from "@/server/services/channel-adapters";
import {
  applyAutomationMetadata,
  appendAutomationLog,
  isChannelAutomationEnabled,
  resolveInboundAutomation,
  scheduleAutomationForConversationEvent,
} from "@/server/services/automation-orchestrator";
import { getApiIntegrationKnowledgeContext } from "@/server/services/automation-service";
import {
  executeConversationFlowAfterAi,
  getAiDecisionOutcome,
} from "@/server/services/conversation-flow-service";
import type {
  BookingRecord,
  ChannelKind,
  ConversationChannelContext,
  ConversationMessage,
  ConversationRecord,
  ConversationStatus,
  CustomerRecord,
  MessageDeliveryStatus,
} from "@/types/operations";

function buildBookingFromCompletedFlow(input: {
  flowName: string;
  customer: CustomerRecord;
  channel: ChannelKind;
  values: Record<string, string>;
}): BookingRecord {
  const values = input.values;
  const customerName = values.customer_name || input.customer.name;
  const vehicle = values.vehicle_type || "Kendaraan belum diisi";
  const complaint = values.complaint || "-";
  const whatsapp = values.whatsapp_number || input.customer.phone || "-";

  return {
    id: randomUUID(),
    customerId: input.customer.id,
    customer: customerName,
    service: values.service_type || input.flowName,
    date: values.preferred_date || "Menunggu konfirmasi",
    slot: values.preferred_time || "Menunggu konfirmasi",
    channel: input.channel,
    status: "Pending Confirmation",
    note: `Motor: ${vehicle}\nKeluhan: ${complaint}\nWhatsApp: ${whatsapp}`,
  };
}

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
  channelContext?: ConversationChannelContext;
  rawPayload: Record<string, unknown>;
};

function normalizeIdentityValue(value?: string | null) {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

function cleanIdentity(val: string): string {
  let cleaned = val.trim().toLowerCase();

  // Strip WhatsApp domain suffix if present
  cleaned = cleaned.replace(/@(s\.whatsapp\.net|c\.us)$/i, "");

  // If it's a phone number or looks like one, strip all non-digits and normalize country code
  const digits = cleaned.replace(/\D/g, "");
  if (digits.length >= 9) {
    if (digits.startsWith("0")) {
      return "62" + digits.slice(1);
    }
    return digits;
  }

  return cleaned;
}

function hasSameIdentity(left?: string | null, right?: string | null) {
  const normalizedLeft = normalizeIdentityValue(left);
  const normalizedRight = normalizeIdentityValue(right);

  if (normalizedLeft == null || normalizedRight == null) {
    return false;
  }

  if (normalizedLeft === normalizedRight) {
    return true;
  }

  return cleanIdentity(normalizedLeft) === cleanIdentity(normalizedRight);
}

function findExistingConversation(
  conversations: ConversationRecord[],
  input: NormalizedIncomingMessage,
) {
  return (
    conversations.find((conversation) => {
      if (conversation.channel !== input.channel) {
        return false;
      }

      return (
        hasSameIdentity(
          conversation.channelContext?.externalUserId,
          input.externalUserId,
        ) ||
        hasSameIdentity(
          conversation.channelContext?.instagramUserId,
          input.channelContext?.instagramUserId,
        ) ||
        hasSameIdentity(conversation.phone, input.phone) ||
        hasSameIdentity(conversation.username, input.username)
      );
    }) ?? null
  );
}

function findExistingCustomer(input: {
  customers: CustomerRecord[];
  existingConversation: ConversationRecord | null;
  message: NormalizedIncomingMessage;
}) {
  if (input.existingConversation) {
    return (
      input.customers.find(
        (customer) => customer.id === input.existingConversation?.customerId,
      ) ?? null
    );
  }

  const phoneMatch = normalizeIdentityValue(input.message.phone);
  if (phoneMatch) {
    return (
      input.customers.find((customer) =>
        hasSameIdentity(customer.phone, phoneMatch),
      ) ?? null
    );
  }

  const usernameMatch = normalizeIdentityValue(input.message.username);
  if (usernameMatch) {
    return (
      input.customers.find(
        (customer) =>
          customer.channel === input.message.channel &&
          hasSameIdentity(customer.username, usernameMatch),
      ) ?? null
    );
  }

  return null;
}

function buildCustomer(
  channel: ChannelKind,
  message: NormalizedIncomingMessage,
): CustomerRecord {
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
  timezone?: string | null,
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
        timestamp: formatClockTime(timezone),
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

function buildSafeFallbackDecision(config: DashboardConfig): ReplyDecision {
  return {
    intent: "Fallback Aman",
    confidence: 40,
    needsHuman: false,
    status: "ai_active",
    summary:
      "Engine AI fallback karena terjadi error internal saat memproses pesan masuk.",
    reply: `${config.workspace.name || "Tim kami"} sudah menerima pesan Anda. Mohon tunggu sebentar, kami bantu cek dan balas secepatnya ya.`,
    grounded: false,
    source: "fallback",
  };
}

function buildConversationReplyContext(
  conversation: ConversationRecord,
  externalBusinessContext?: string | null,
): ReplyContext {
  return {
    recentMessages: conversation.messages
      .filter(
        (message) =>
          message.sender !== "system" && Boolean(message.text.trim()),
      )
      .slice(-12)
      .map((message) => ({
        sender: message.sender,
        text: message.text.trim().slice(0, 2_000),
      })),
    lastIntent: conversation.lastIntent,
    summary: conversation.summary.trim().slice(0, 2_000),
    externalBusinessContext: externalBusinessContext?.trim() || undefined,
  };
}

export async function processIncomingMessage(input: NormalizedIncomingMessage) {
  const config = await getDashboardConfigRecord();
  const current = await getDashboardOperationsRecord();
  const receivedAt = new Date().toISOString();

  const existingConversation = findExistingConversation(
    current.conversations,
    input,
  );
  let customer =
    findExistingCustomer({
      customers: current.customers,
      existingConversation,
      message: input,
    }) ?? buildCustomer(input.channel, input);

  customer = {
    ...customer,
    name: normalizeIdentityValue(input.displayName) ?? customer.name,
    phone: normalizeIdentityValue(input.phone) ?? customer.phone,
    username: normalizeIdentityValue(input.username) ?? customer.username,
  };

  if (!current.customers.find((item) => item.id === customer.id)) {
    current.customers.unshift(customer);
  }

  let conversation =
    existingConversation ??
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
      channelContext: input.channelContext,
    } satisfies ConversationRecord);

  const safety = classifyInboundSafety(input.messageText, config);
  const automation = resolveInboundAutomation(config, {
    channel: input.channel,
    messageText: input.messageText,
    nowIso: receivedAt,
    existingConversation,
    safetyAction: safety.action,
  });
  const effectiveConfig = automation.effectiveConfig;
  const agentRequiresExplicitSelection = Boolean(
    automation.graphBeforeAi?.aiNodeId,
  );
  const agentCanReply = agentRequiresExplicitSelection
    ? automation.agent?.allowedActions.replyMessage === true
    : automation.agent?.allowedActions.replyMessage !== false;
  const autoReplyEnabled =
    agentCanReply &&
    effectiveConfig.aiAgent.autoReplyEnabled &&
    isChannelAutomationEnabled(config, input.channel);
  const aiMessageThreshold = Math.max(
    1,
    effectiveConfig.automation.aiConfig.aiMessageThreshold,
  );
  const currentAiReplyCount =
    conversation.automation?.aiReplyCount ??
    conversation.messages.filter((message) => message.sender === "ai").length;

  const isTakeoverActive =
    existingConversation &&
    (existingConversation.status === "assigned_to_admin" ||
      existingConversation.status === "blocked" ||
      existingConversation.status === "ai_paused");

  let decision: ReplyDecision;
  let graphHandoffTarget = automation.graphBeforeAi?.handoffTarget;
  let graphHandoffReason = automation.graphBeforeAi?.handoffReason;

  if (isTakeoverActive) {
    decision = {
      intent: existingConversation.lastIntent,
      confidence: existingConversation.aiConfidence,
      needsHuman: true,
      status: existingConversation.status,
      summary: existingConversation.summary,
      reply: "",
      grounded: false,
      source: "fallback",
    };
  } else if (safety.action === "silence") {
    decision = {
      intent: safety.intent,
      confidence: 99,
      needsHuman: false,
      status: "spam",
      summary: safety.reason,
      reply: "",
      grounded: false,
      source: "fallback",
    };
  } else if (safety.action === "handoff") {
    decision = {
      intent: safety.intent,
      confidence: 99,
      needsHuman: true,
      status: "assigned_to_admin",
      summary: safety.reason,
      reply: effectiveConfig.automation.aiConfig.handoverMessage,
      grounded: false,
      source: "fallback",
    };
  } else if (automation.forcedStatus === "assigned_to_admin") {
    decision = {
      intent: "Handoff Automation",
      confidence: 96,
      needsHuman: true,
      status: "assigned_to_admin",
      summary:
        automation.handoffReason ??
        "Automation meneruskan percakapan ke admin berdasarkan trigger aktif.",
      reply:
        automation.immediateReply ??
        effectiveConfig.automation.aiConfig.handoverMessage,
      grounded: false,
      source: "fallback",
    };
  } else if (!agentCanReply) {
    const canHandover =
      automation.agent?.handover.enabled === true &&
      automation.agent.allowedActions.handoverToHuman;
    decision = {
      intent: "AI Agent Reply Disabled",
      confidence: 100,
      needsHuman: canHandover,
      status: canHandover ? "assigned_to_admin" : "ai_paused",
      summary: canHandover
        ? "AI Agent aktif tidak diizinkan membalas; percakapan diteruskan ke admin."
        : "AI Agent aktif tidak diizinkan membalas; percakapan disimpan tanpa balasan otomatis.",
      reply: "",
      grounded: false,
      source: "fallback",
    };
  } else if (!autoReplyEnabled) {
    decision = {
      intent: "Auto Reply Nonaktif",
      confidence: 100,
      needsHuman: false,
      status:
        automation.forcedStatus === "waiting_customer"
          ? "waiting_customer"
          : "ai_paused",
      summary:
        "Auto reply sedang nonaktif, sehingga percakapan disimpan ke inbox tanpa balasan otomatis.",
      reply: "",
      grounded: false,
      source: "fallback",
    };
  } else if (
    automation.graphBeforeAi?.graphReplyOnly &&
    automation.immediateReply
  ) {
    decision = {
      intent: "Conversation Flow",
      confidence: 100,
      needsHuman: automation.graphBeforeAi.needsHuman,
      status: automation.graphBeforeAi.needsHuman
        ? "assigned_to_admin"
        : "ai_active",
      summary: "Balasan ditentukan oleh Published Conversation Flow.",
      reply: automation.immediateReply,
      grounded: true,
      source: "workspace",
    };
  } else if (
    effectiveConfig.automation.aiConfig.handoverEnabled &&
    currentAiReplyCount >= aiMessageThreshold
  ) {
    decision = {
      intent: "AI Threshold Reached",
      confidence: 99,
      needsHuman: true,
      status: "assigned_to_admin",
      summary:
        "Jumlah balasan AI sudah melewati threshold dan percakapan diteruskan ke admin.",
      reply:
        automation.effectiveConfig.automation.aiConfig.handoverMessage ||
        automation.immediateReply,
      grounded: false,
      source: "fallback",
    };
  } else {
    try {
      const externalBusinessContext = await getApiIntegrationKnowledgeContext({
        config: effectiveConfig,
        conversation,
        customer,
        messageText: input.messageText,
        agentId: automation.agent?.id,
      });
      decision = await generateReplyDecision(
        input.messageText,
        effectiveConfig,
        buildConversationReplyContext(conversation, externalBusinessContext),
      );

      if (automation.graph && automation.graphBeforeAi?.aiNodeId) {
        const outcome = getAiDecisionOutcome(decision);
        const afterAi = executeConversationFlowAfterAi({
          graph: automation.graph,
          config: effectiveConfig,
          aiNodeId: automation.graphBeforeAi.aiNodeId,
          outcome,
          now: new Date(receivedAt),
        });
        graphHandoffTarget = afterAi.handoffTarget ?? graphHandoffTarget;
        graphHandoffReason = afterAi.handoffReason ?? graphHandoffReason;
        const graphMessages = [
          ...automation.graphBeforeAi.messages,
          ...(outcome === "answered" && decision.reply ? [decision.reply] : []),
          ...afterAi.messages,
        ].filter(Boolean);

        decision = {
          ...decision,
          reply: graphMessages.join("\n\n") || decision.reply,
          instructionsApplied: false,
          needsHuman: decision.needsHuman || afterAi.needsHuman,
          status:
            decision.needsHuman || afterAi.needsHuman
              ? "assigned_to_admin"
              : decision.status,
          summary: afterAi.error
            ? `${decision.summary} Flow warning: ${afterAi.error}`
            : decision.summary,
        };
      }
    } catch (error) {
      console.error("generateReplyDecision failed", error);
      decision = buildSafeFallbackDecision(effectiveConfig);
    }
  }

  // Enforce runtime settings after every decision so a flow greeting, form
  // prompt, fallback, or provider response cannot bypass the toggles.
  if (!autoReplyEnabled || isTakeoverActive || decision.status === "spam") {
    decision = {
      ...decision,
      reply: "",
    };
  }

  decision = await applyConfiguredResponsePolicy(
    input.messageText,
    decision,
    effectiveConfig,
  );

  if (decision.knowledgeGap) {
    try {
      await recordKnowledgeGap({
        question: decision.knowledgeGap.question,
        category: decision.knowledgeGap.category,
        sourceChannel: input.channel,
      });
    } catch (error) {
      console.error(
        "[inbox-service] failed to record Knowledge Base candidate",
        error,
      );
    }
  }

  if (
    autoReplyEnabled &&
    !decision.reply &&
    automation.immediateReply &&
    decision.status !== "spam" &&
    !isTakeoverActive
  ) {
    decision = {
      ...decision,
      reply: automation.immediateReply,
    };
  }
  const finalStatus = isTakeoverActive
    ? existingConversation.status
    : (automation.forcedStatus ?? decision.status);
  const previousFormSession = existingConversation?.automation?.formSession;
  const nextFormSession =
    automation.flow && automation.graphBeforeAi?.formState
      ? {
          flowId: automation.flow.id,
          nodeId: automation.graphBeforeAi.formState.nodeId,
          mode: automation.graphBeforeAi.formState.mode,
          fieldIndex: automation.graphBeforeAi.formState.fieldIndex,
          values: automation.graphBeforeAi.formState.values,
          startedAt:
            previousFormSession?.flowId === automation.flow.id
              ? previousFormSession.startedAt
              : receivedAt,
          updatedAt: receivedAt,
        }
      : automation.graphBeforeAi?.completedForm ||
          automation.graphBeforeAi?.cancelledForm ||
          (previousFormSession && !automation.flow)
        ? null
        : undefined;

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
    effectiveConfig.workspace.timezone,
  );

  if (!isTakeoverActive) {
    conversation = applyAutomationMetadata(conversation, {
      event: "message_received",
      flow: automation.flow,
      agent: automation.agent,
      lastInboundAt: receivedAt,
      handoffReason:
        decision.status === "assigned_to_admin"
          ? (graphHandoffReason ??
            automation.handoffReason ??
            "Percakapan diteruskan ke admin oleh automation runtime.")
          : null,
      formSession: nextFormSession,
    });
    conversation = appendAutomationLog(conversation, {
      event: "message_received",
      summary:
        safety.action !== "allow"
          ? `Safety Gate diterapkan: ${safety.reason}`
          : automation.flow
            ? `Flow "${automation.flow.name}" aktif untuk pesan masuk ini.`
            : "Tidak ada flow publish yang cocok; pesan diproses oleh RAG default.",
      status:
        safety.action !== "allow"
          ? "applied"
          : automation.flow
            ? "applied"
            : "skipped",
      createdAt: receivedAt,
    });
  } else {
    conversation = applyAutomationMetadata(conversation, {
      event: "message_received",
      lastInboundAt: receivedAt,
    });
  }
  const detectedSentiment =
    safety.action === "allow"
      ? await analyzeSentiment(input.messageText, effectiveConfig)
      : "negative";

  conversation = {
    ...conversation,
    status: finalStatus,
    summary: decision.summary,
    lastIntent: decision.intent,
    aiConfidence: decision.confidence,
    sentiment: detectedSentiment,
    assignedTo: isTakeoverActive
      ? existingConversation.assignedTo
      : finalStatus === "assigned_to_admin"
        ? graphHandoffTarget ||
          effectiveConfig.automation.aiConfig.handoverTarget ||
          "Admin Desk"
        : (automation.agent?.name ?? effectiveConfig.aiAgent.name),
    unreadCount: conversation.unreadCount + 1,
    tags: isTakeoverActive
      ? conversation.tags
      : Array.from(new Set([...conversation.tags, ...automation.tagsToAdd])),
    riskLevel: isTakeoverActive
      ? existingConversation.riskLevel
      : finalStatus === "assigned_to_admin" || finalStatus === "spam"
        ? "high"
        : finalStatus === "waiting_customer"
          ? "medium"
          : "low",
    channelContext: {
      ...conversation.channelContext,
      ...input.channelContext,
      externalUserId: input.externalUserId,
    },
  };

  if (decision.reply && decision.status !== "spam") {
    if (input.channel === "WhatsApp" && input.externalMessageId) {
      try {
        await sendWhatsAppReadTypingIndicator({
          incomingMessageId: input.externalMessageId,
          phoneNumberIdOverride: input.channelContext?.whatsappPhoneNumberId,
          whatsappGatewayInstanceOverride:
            input.channelContext?.whatsappGatewayInstance,
        });
        await wait(
          Math.max(
            0,
            Math.min(effectiveConfig.automation.aiConfig.listenTimeSeconds, 5) *
              1000,
          ),
        );
      } catch {
        // Tetap kirim balasan walau read/typing indicator gagal.
      }
    }

    const delivery = await sendChannelMessage({
      channel: input.channel,
      recipientId: input.phone ?? input.externalUserId,
      message: decision.reply,
      phoneNumberIdOverride: input.channelContext?.whatsappPhoneNumberId,
      whatsappGatewayInstanceOverride:
        input.channelContext?.whatsappGatewayInstance,
      instagramAccountIdOverride: input.channelContext?.instagramAccountId,
      externalMessageId: input.externalMessageId,
    });

    if (delivery.ok || decision.reply.trim()) {
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
        effectiveConfig.workspace.timezone,
      );
      conversation = applyAutomationMetadata(conversation, {
        event: "message_received",
        agent: automation.agent,
        lastOutboundAt: new Date().toISOString(),
        incrementAiReplyCount: true,
      });
    }

    if (!delivery.ok) {
      conversation = appendMessage(
        conversation,
        {
          sender: "system",
          text: buildDeliveryFailureNote({
            channel: input.channel,
            note: delivery.note,
            status: delivery.status,
          }),
          type: "system",
        },
        effectiveConfig.workspace.timezone,
      );
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
    leadStatus: automation.graphBeforeAi?.completedForm
      ? "Booking"
      : finalStatus === "assigned_to_admin"
        ? "Complaint"
        : finalStatus === "waiting_customer"
          ? "Booking"
          : finalStatus === "spam"
            ? "Spam"
            : "Interested",
    totalConversation: customer.totalConversation + 1,
    lastContact: "Sekarang",
    assignedTo: conversation.assignedTo,
  };

  current.customers = current.customers.map((item) =>
    item.id === customer.id ? customer : item,
  );

  if (
    automation.flow?.normalizedTrigger === "booking_intent" &&
    automation.graphBeforeAi?.completedForm
  ) {
    current.bookings.unshift(
      buildBookingFromCompletedFlow({
        flowName: automation.flow.name,
        customer,
        channel: input.channel,
        values: automation.graphBeforeAi.completedForm.values,
      }),
    );
    conversation = appendAutomationLog(conversation, {
      event: "booking_created",
      summary: `Booking dibuat dari Conversation Flow "${automation.flow.name}" dan menunggu konfirmasi admin.`,
      status: "applied",
    });
    current.conversations = current.conversations.map((item) =>
      item.id === conversation.id ? conversation : item,
    );
  }

  if (finalStatus === "assigned_to_admin") {
    try {
      await enqueueJob({
        type: "handoff_notify",
        payload: {
          conversationId: conversation.id,
          customerId: customer.id,
        },
      });
    } catch (error) {
      console.error("enqueueJob handoff_notify failed", error);
    }
  }

  if (finalStatus === "waiting_customer" && !previousFormSession) {
    try {
      await enqueueJob({
        type: "lead_followup",
        payload: {
          conversationId: conversation.id,
        },
        runAt: new Date(
          Date.now() + 1000 * 60 * 60 * config.automation.followUpDelayHours,
        ).toISOString(),
      });
    } catch (error) {
      console.error("enqueueJob lead_followup failed", error);
    }
  }

  await saveDashboardOperationsRecord(current);
  await scheduleAutomationForConversationEvent({
    config: effectiveConfig,
    conversation,
    event: "message_received",
  });

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
      item.messages.some(
        (message) => message.externalId === input.externalMessageId,
      ),
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
