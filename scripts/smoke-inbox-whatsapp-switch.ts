import assert from "node:assert/strict";

import {
  filterInboxConversations,
  getConversationWhatsAppAccountKey,
  getInboxWhatsAppAccountOptions,
  type InboxFilterState,
} from "../src/app/(dashboard)/inbox/components/inbox-view-model";
import type { DashboardConfig } from "../src/types/dashboard-config";
import type {
  ConversationChannelContext,
  ConversationRecord,
} from "../src/types/operations";

function makeConversation(
  id: string,
  channel: ConversationRecord["channel"],
  channelContext?: ConversationChannelContext,
): ConversationRecord {
  return {
    id,
    customerId: `customer-${id}`,
    name: `Customer ${id}`,
    channel,
    lastMessage: `Message ${id}`,
    timestamp: "2026-07-22T12:00:00.000Z",
    unreadCount: 0,
    status: "ai_active",
    messages: [],
    tags: [],
    notes: "",
    summary: "",
    assignedTo: "AI Agent",
    responseTimeSeconds: 0,
    lastIntent: "general",
    sentiment: "neutral",
    aiConfidence: 1,
    riskLevel: "low",
    channelContext,
  };
}

const config = {
  channels: {
    whatsapp: {
      enabled: true,
      status: "connected",
      businessLabel: "Johan Garage Meta",
      phoneNumberId: "meta-primary",
      accessToken: "",
      verifyToken: "",
      webhookUrl: "",
      autoReply: true,
      accounts: [],
      qrSessions: [
        {
          id: "qr-session",
          instanceName: "johan-garage-qr",
          label: "Johan Garage QR",
          status: "connected",
          phoneNumber: "628123456789",
          createdAt: "2026-07-22T12:00:00.000Z",
        },
      ],
    },
  },
} as unknown as DashboardConfig;

const conversations = [
  makeConversation("qr", "WhatsApp", {
    whatsappGatewayInstance: "johan-garage-qr",
  }),
  makeConversation("meta", "WhatsApp", {
    whatsappPhoneNumberId: "meta-primary",
  }),
  makeConversation("legacy", "WhatsApp"),
  makeConversation("instagram", "Instagram DM"),
];

const options = getInboxWhatsAppAccountOptions(config, conversations);
assert.equal(options.find((option) => option.value === "all")?.conversationCount, 3);
assert.equal(
  options.find((option) => option.value === "qr:johan-garage-qr")
    ?.conversationCount,
  1,
);
assert.equal(
  options.find((option) => option.value === "meta:meta-primary")
    ?.conversationCount,
  1,
);
assert.equal(
  getConversationWhatsAppAccountKey(conversations[2]),
  "unassigned",
);

const filters: InboxFilterState = {
  quickFilter: "all",
  channel: "WhatsApp",
  whatsappAccount: "qr:johan-garage-qr",
  status: "all",
  assignment: "all",
  search: "",
  sortBy: "latest",
};
const filtered = filterInboxConversations(conversations, filters, "AI Agent");
assert.deepEqual(filtered.map((conversation) => conversation.id), ["qr"]);

console.log("Inbox WhatsApp account switching smoke test passed.");
