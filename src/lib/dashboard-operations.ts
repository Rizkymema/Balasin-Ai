import type {
  AnalyticsSummary,
  BookingRecord,
  ChannelKind,
  ConversationRecord,
  ConversationStatus,
  CustomerRecord,
  DashboardOperationsData,
  LeadStatus,
  MessageSender,
  ProductRecord,
  ServiceRecord,
  TicketRecord,
  BroadcastRecord,
} from "@/types/operations";

const STORAGE_KEY = "balesin_dashboard_operations";
const STORAGE_EVENT = "balesin-dashboard-operations-change";

const EMPTY_MESSAGE_TEMPLATE = {
  id: "",
  sender: "customer",
  text: "",
  timestamp: "",
  type: "text",
} as const;

const EMPTY_CONVERSATION_TEMPLATE: ConversationRecord = {
  id: "",
  customerId: "",
  name: "",
  channel: "Website Chat",
  lastMessage: "",
  timestamp: "",
  unreadCount: 0,
  status: "ai_active",
  messages: [],
  tags: [],
  notes: "",
  summary: "",
  phone: "",
  email: "",
  username: "",
  assignedTo: "AI Agent",
  responseTimeSeconds: 0,
  lastIntent: "",
  sentiment: "neutral",
  aiConfidence: 0,
  riskLevel: "low",
  ticketId: null,
};

const EMPTY_CUSTOMER_TEMPLATE: CustomerRecord = {
  id: "",
  name: "",
  channel: "Website Chat",
  leadStatus: "New Lead",
  tags: [],
  lastContact: "",
  assignedTo: "AI Agent",
  totalConversation: 0,
  revenueHint: "Rp0",
  note: "",
  phone: "",
  email: "",
  username: "",
  segment: "",
  activeTicketCount: 0,
};

const EMPTY_BOOKING_TEMPLATE: BookingRecord = {
  id: "",
  customerId: "",
  customer: "",
  service: "",
  date: "",
  slot: "",
  channel: "Website Chat",
  status: "New",
  technician: "",
  branch: "",
  note: "",
};

const EMPTY_TICKET_TEMPLATE: TicketRecord = {
  id: "",
  conversationId: "",
  customerId: "",
  customerName: "",
  channel: "Website Chat",
  issueType: "",
  priority: "medium",
  status: "open",
  assignedTo: "Admin Desk",
  summary: "",
  createdAt: "",
  updatedAt: "",
  resolutionNote: "",
};

const EMPTY_PRODUCT_TEMPLATE: ProductRecord = {
  id: "",
  name: "",
  sku: "",
  category: "",
  brand: "",
  price: "Rp0",
  stock: "0",
  compatibility: "",
  description: "",
  status: "draft",
  source: "postgresql",
  updatedAt: "",
};

const EMPTY_SERVICE_TEMPLATE: ServiceRecord = {
  id: "",
  name: "",
  category: "",
  priceStart: "Rp0",
  priceEnd: "Rp0",
  duration: "",
  description: "",
  status: "draft",
  source: "postgresql",
  updatedAt: "",
};

const EMPTY_BROADCAST_TEMPLATE: BroadcastRecord = {
  id: "",
  name: "",
  channel: "WhatsApp",
  audience: "",
  template: "",
  status: "draft",
  scheduledAt: "",
  sentCount: 0,
};

function cloneValue<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function normalizeChannel(value: unknown): ChannelKind {
  switch (value) {
    case "WhatsApp":
      return "WhatsApp";
    case "Web Chat":
    case "Website Chat":
      return "Website Chat";
    case "Instagram":
    case "Instagram DM":
      return "Instagram DM";
    case "Instagram Comment":
      return "Instagram Comment";
    default:
      return "Website Chat";
  }
}

function normalizeConversationStatus(value: unknown): ConversationStatus {
  switch (value) {
    case "ai":
      return "ai_active";
    case "human":
      return "ai_paused";
    case "handoff":
      return "assigned_to_admin";
    case "ai_active":
    case "ai_paused":
    case "assigned_to_admin":
    case "waiting_customer":
    case "resolved":
    case "blocked":
    case "spam":
      return value;
    default:
      return "ai_active";
  }
}

function normalizeSender(value: unknown): MessageSender {
  switch (value) {
    case "ai":
    case "customer":
    case "admin":
    case "agent":
    case "system":
      return value;
    default:
      return "customer";
  }
}

function normalizeLeadStatus(value: unknown): LeadStatus {
  switch (value) {
    case "New Lead":
    case "Interested":
    case "Hot Lead":
    case "Asked Price":
    case "Booking":
    case "Paid":
    case "Complaint":
    case "Spam":
      return value;
    default:
      return "Interested";
  }
}

export function createEmptyDashboardOperations(): DashboardOperationsData {
  return {
    conversations: [],
    customers: [],
    bookings: [],
    tickets: [],
    products: [],
    services: [],
    broadcasts: [],
    lastUpdatedAt: new Date().toISOString(),
  };
}

export const defaultDashboardOperations: DashboardOperationsData =
  createEmptyDashboardOperations();

function cloneDefaultData() {
  return createEmptyDashboardOperations();
}

function normalizeConversation(
  input: Partial<ConversationRecord>,
): ConversationRecord {
  return {
    ...cloneValue(EMPTY_CONVERSATION_TEMPLATE),
    ...input,
    channel: normalizeChannel(input.channel),
    status: normalizeConversationStatus(input.status),
    messages: Array.isArray(input.messages)
      ? input.messages.map((message) => ({
          ...cloneValue(EMPTY_MESSAGE_TEMPLATE),
          ...message,
          sender: normalizeSender(message.sender),
        }))
      : [],
    tags: Array.isArray(input.tags)
      ? input.tags.filter((tag): tag is string => typeof tag === "string")
      : [],
  };
}

function normalizeCustomer(input: Partial<CustomerRecord>): CustomerRecord {
  return {
    ...cloneValue(EMPTY_CUSTOMER_TEMPLATE),
    ...input,
    channel: normalizeChannel(input.channel),
    leadStatus: normalizeLeadStatus(input.leadStatus),
    tags: Array.isArray(input.tags)
      ? input.tags.filter((tag): tag is string => typeof tag === "string")
      : [],
  };
}

function normalizeBooking(input: Partial<BookingRecord>): BookingRecord {
  return {
    ...cloneValue(EMPTY_BOOKING_TEMPLATE),
    ...input,
    channel: normalizeChannel(input.channel),
  };
}

function normalizeTicket(input: Partial<TicketRecord>): TicketRecord {
  return {
    ...cloneValue(EMPTY_TICKET_TEMPLATE),
    ...input,
    channel: normalizeChannel(input.channel),
  };
}

function normalizeProduct(input: Partial<ProductRecord>): ProductRecord {
  return {
    ...cloneValue(EMPTY_PRODUCT_TEMPLATE),
    ...input,
  };
}

function normalizeService(input: Partial<ServiceRecord>): ServiceRecord {
  return {
    ...cloneValue(EMPTY_SERVICE_TEMPLATE),
    ...input,
  };
}

function normalizeBroadcast(input: Partial<BroadcastRecord>): BroadcastRecord {
  return {
    ...cloneValue(EMPTY_BROADCAST_TEMPLATE),
    ...input,
  };
}

function normalizeDashboardOperations(raw: unknown): DashboardOperationsData {
  if (!raw || typeof raw !== "object") {
    return cloneDefaultData();
  }

  const source = raw as Partial<DashboardOperationsData> & {
    conversations?: Array<Partial<ConversationRecord>>;
    customers?: Array<Partial<CustomerRecord>>;
  };

  return {
    conversations: Array.isArray(source.conversations)
      ? source.conversations.map(normalizeConversation)
      : [],
    customers: Array.isArray(source.customers)
      ? source.customers.map(normalizeCustomer)
      : [],
    bookings: Array.isArray(source.bookings)
      ? source.bookings.map(normalizeBooking)
      : [],
    tickets: Array.isArray(source.tickets)
      ? source.tickets.map(normalizeTicket)
      : [],
    products: Array.isArray(source.products)
      ? source.products.map(normalizeProduct)
      : [],
    services: Array.isArray(source.services)
      ? source.services.map(normalizeService)
      : [],
    broadcasts: Array.isArray(source.broadcasts)
      ? source.broadcasts.map(normalizeBroadcast)
      : [],
    lastUpdatedAt:
      typeof source.lastUpdatedAt === "string"
        ? source.lastUpdatedAt
        : new Date().toISOString(),
  };
}

export function getDashboardOperations(): DashboardOperationsData {
  if (typeof window === "undefined") {
    return cloneDefaultData();
  }

  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return cloneDefaultData();
  }

  try {
    return normalizeDashboardOperations(JSON.parse(raw));
  } catch {
    return cloneDefaultData();
  }
}

export function saveDashboardOperations(data: DashboardOperationsData) {
  if (typeof window === "undefined") {
    return;
  }

  const payload = {
    ...data,
    lastUpdatedAt: new Date().toISOString(),
  };

  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  window.dispatchEvent(new Event(STORAGE_EVENT));
}

export function updateDashboardOperations(
  updater: (current: DashboardOperationsData) => DashboardOperationsData,
) {
  const next = updater(getDashboardOperations());
  saveDashboardOperations(next);
  return next;
}

export function deriveAnalyticsSummary(
  data: DashboardOperationsData,
): AnalyticsSummary {
  const totalMessages = data.conversations.reduce(
    (total, conversation) => total + conversation.messages.length,
    0,
  );

  const aiReplyCount = data.conversations.reduce(
    (total, conversation) =>
      total +
      conversation.messages.filter((message) => message.sender === "ai").length,
    0,
  );

  const outgoingCount = data.conversations.reduce(
    (total, conversation) =>
      total +
      conversation.messages.filter(
        (message) =>
          message.sender === "ai" ||
          message.sender === "admin" ||
          message.sender === "agent",
      ).length,
    0,
  );

  const handoffCount = data.conversations.filter(
    (conversation) => conversation.status === "assigned_to_admin",
  ).length;

  const avgFirstResponseSeconds =
    data.conversations.reduce(
      (total, conversation) => total + conversation.responseTimeSeconds,
      0,
    ) / Math.max(data.conversations.length, 1);

  const channelCounts = data.conversations.reduce<Record<ChannelKind, number>>(
    (accumulator, conversation) => {
      accumulator[conversation.channel] += 1;
      return accumulator;
    },
    {
      WhatsApp: 0,
      "Website Chat": 0,
      "Instagram DM": 0,
      "Instagram Comment": 0,
    },
  );

  return {
    totalMessages,
    totalConversations: data.conversations.length,
    aiAutoReplyRate: Math.round((aiReplyCount / Math.max(outgoingCount, 1)) * 1000) / 10,
    handoffRate:
      Math.round((handoffCount / Math.max(data.conversations.length, 1)) * 1000) / 10,
    avgFirstResponseSeconds: Math.round(avgFirstResponseSeconds),
    totalBookings: data.bookings.length,
    waitingPaymentCount: data.bookings.filter(
      (booking) => booking.status === "Waiting Payment",
    ).length,
    activeCustomers: data.customers.filter((customer) => customer.leadStatus !== "Spam").length,
    totalTickets: data.tickets.length,
    openTickets: data.tickets.filter((ticket) => ticket.status !== "resolved").length,
    aiSafeConversationCount: data.conversations.filter(
      (conversation) => conversation.riskLevel === "low" && conversation.aiConfidence >= 80,
    ).length,
    channelBreakdown: Object.entries(channelCounts).map(([channel, count]) => ({
      channel: channel as ChannelKind,
      count,
    })),
  };
}

export function mapConversationStatusToLeadStatus(
  status: ConversationStatus,
): LeadStatus {
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

export function buildBookingTimeline(bookings: BookingRecord[]) {
  return bookings
    .slice()
    .sort((left, right) => left.slot.localeCompare(right.slot))
    .map((booking) => ({
      id: booking.id,
      time: booking.slot,
      title: `${booking.service} - ${booking.customer}`,
      meta: booking.note ?? `${booking.branch ?? "Operasional"} | ${booking.status}`,
      tone:
        booking.status === "Confirmed"
          ? "border-cyan-400/20 bg-cyan-950/20 text-cyan-200"
          : booking.status === "Waiting Payment"
            ? "border-amber-400/20 bg-amber-950/20 text-amber-200"
            : booking.status === "New" || booking.status === "Pending Confirmation"
              ? "border-violet-400/20 bg-violet-950/20 text-violet-200"
              : "border-white/10 bg-white/[0.03] text-slate-200",
    }));
}

export { STORAGE_EVENT as DASHBOARD_OPERATIONS_EVENT };
