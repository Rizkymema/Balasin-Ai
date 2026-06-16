export type ChannelKind =
  | "WhatsApp"
  | "Website Chat"
  | "Instagram DM"
  | "Instagram Comment";

export type ConversationStatus =
  | "ai_active"
  | "ai_paused"
  | "assigned_to_admin"
  | "waiting_customer"
  | "resolved"
  | "blocked"
  | "spam";

export type ConversationMode = ConversationStatus;

export type MessageSender = "customer" | "ai" | "admin" | "agent" | "system";

export type MessageDeliveryStatus = "sent" | "delivered" | "read";

export type RiskLevel = "low" | "medium" | "high";

export type CustomerSentiment = "positive" | "neutral" | "negative";

export type MessageType = "text" | "image" | "comment" | "system";

export type ConversationMessage = {
  id: string;
  sender: MessageSender;
  text: string;
  timestamp: string;
  externalId?: string;
  status?: MessageDeliveryStatus;
  type?: MessageType;
};

export type ConversationRecord = {
  id: string;
  customerId: string;
  name: string;
  channel: ChannelKind;
  lastMessage: string;
  timestamp: string;
  unreadCount: number;
  status: ConversationStatus;
  messages: ConversationMessage[];
  tags: string[];
  notes: string;
  summary: string;
  lastSeenAt?: string | null;
  typingActor?: MessageSender | null;
  phone?: string;
  email?: string;
  username?: string;
  assignedTo: string;
  responseTimeSeconds: number;
  lastIntent: string;
  sentiment: CustomerSentiment;
  aiConfidence: number;
  riskLevel: RiskLevel;
  ticketId?: string | null;
};

export type LeadStatus =
  | "New Lead"
  | "Interested"
  | "Hot Lead"
  | "Asked Price"
  | "Booking"
  | "Paid"
  | "Complaint"
  | "Spam";

export type CustomerRecord = {
  id: string;
  name: string;
  channel: ChannelKind;
  leadStatus: LeadStatus;
  tags: string[];
  lastContact: string;
  assignedTo: string;
  totalConversation: number;
  revenueHint: string;
  note: string;
  phone?: string;
  email?: string;
  username?: string;
  segment: string;
  activeTicketCount: number;
};

export type BookingStatus =
  | "New"
  | "Pending Confirmation"
  | "Confirmed"
  | "Waiting Payment"
  | "Rescheduled"
  | "Done"
  | "Cancelled";

export type BookingRecord = {
  id: string;
  customerId: string;
  customer: string;
  service: string;
  date: string;
  slot: string;
  channel: ChannelKind;
  status: BookingStatus;
  technician?: string;
  branch?: string;
  note?: string;
};

export type TicketPriority = "low" | "medium" | "high" | "critical";

export type TicketStatus = "open" | "in_progress" | "resolved" | "complaint";

export type TicketRecord = {
  id: string;
  conversationId: string;
  customerId: string;
  customerName: string;
  channel: ChannelKind;
  issueType: string;
  priority: TicketPriority;
  status: TicketStatus;
  assignedTo: string;
  summary: string;
  createdAt: string;
  updatedAt: string;
  resolutionNote?: string;
};

export type CatalogStatus = "active" | "draft" | "out_of_stock";

export type ProductRecord = {
  id: string;
  name: string;
  sku: string;
  category: string;
  brand: string;
  price: string;
  stock: string;
  compatibility: string;
  description: string;
  status: CatalogStatus;
  source: "postgresql" | "google_sheets";
  updatedAt: string;
};

export type ServiceRecord = {
  id: string;
  name: string;
  category: string;
  priceStart: string;
  priceEnd: string;
  duration: string;
  description: string;
  status: Exclude<CatalogStatus, "out_of_stock">;
  source: "postgresql" | "google_sheets";
  updatedAt: string;
};

export type BroadcastStatus = "draft" | "scheduled" | "sent";

export type BroadcastRecord = {
  id: string;
  name: string;
  channel: Exclude<ChannelKind, "Instagram Comment">;
  audience: string;
  template: string;
  status: BroadcastStatus;
  scheduledAt: string;
  sentCount: number;
};

export type DashboardOperationsData = {
  conversations: ConversationRecord[];
  customers: CustomerRecord[];
  bookings: BookingRecord[];
  tickets: TicketRecord[];
  products: ProductRecord[];
  services: ServiceRecord[];
  broadcasts: BroadcastRecord[];
  lastUpdatedAt: string;
};

export type AnalyticsSummary = {
  totalMessages: number;
  totalConversations: number;
  aiAutoReplyRate: number;
  handoffRate: number;
  avgFirstResponseSeconds: number;
  totalBookings: number;
  waitingPaymentCount: number;
  activeCustomers: number;
  totalTickets: number;
  openTickets: number;
  aiSafeConversationCount: number;
  channelBreakdown: Array<{
    channel: ChannelKind;
    count: number;
  }>;
};
