import type {
  BookingRecord,
  ChannelKind,
  CrmDealEntry,
  CrmDealStage,
  CrmTaskEntry,
  CustomerRecord,
  DashboardOperationsData,
  LeadStatus,
  TicketRecord,
} from "@/types/operations";

export type CrmViewId = "contacts" | "segments" | "deals" | "tasks";

export type CrmQuickFilterId =
  | "all"
  | "new_lead"
  | "hot_lead"
  | "follow_up"
  | "customer"
  | "booking"
  | "complaint"
  | "inactive"
  | "blocked";

export type CrmFilters = {
  search: string;
  segment: string;
  tag: string;
  owner: string;
  channel: "all" | ChannelKind;
  quickFilter: CrmQuickFilterId;
};

export type CrmContactRow = {
  id: string;
  customer: CustomerRecord;
  leadScore: number;
  scoreBand: "Cold" | "Warm" | "Hot" | "Ready to Close";
  lifecycle: string;
  primaryContact: string;
  statusLabel: string;
  lastInteraction: string;
  lastActivity: string;
  nextFollowUp: string;
  bookingCount: number;
  openTicketCount: number;
  relatedConversationCount: number;
};

export type CrmQuickFilterSummary = {
  id: CrmQuickFilterId;
  label: string;
  count: number;
};

export type CrmSegmentRecord = {
  id: string;
  name: string;
  type: "static" | "dynamic";
  count: number;
  description: string;
};

export type CrmDealRecord = {
  id: string;
  title: string;
  contactId: string;
  contactName: string;
  stage: CrmDealStage;
  valueLabel: string;
  probability: number;
  owner: string;
  source: ChannelKind;
  expectedClose: string;
  productOrService: string;
};

export type CrmTaskRecord = {
  id: string;
  contactId: string;
  contactName: string;
  title: string;
  type: string;
  status: CrmTaskEntry["status"];
  dueLabel: string;
  priority: CrmTaskEntry["priority"];
  owner: string;
  outcome: string;
};

export type CrmTimelineItem = {
  id: string;
  time: string;
  title: string;
  detail: string;
  toneClassName: string;
};

export type CrmContactDetail = {
  customer: CustomerRecord;
  leadScore: number;
  scoreBand: CrmContactRow["scoreBand"];
  lifecycle: string;
  summary: string;
  suggestedNextAction: string;
  primaryIdentityRows: Array<{ label: string; value: string }>;
  channelIdentityRows: Array<{ label: string; value: string }>;
  tags: string[];
  timeline: CrmTimelineItem[];
  relatedDeals: CrmDealRecord[];
  relatedTasks: CrmTaskRecord[];
  relatedBookings: BookingRecord[];
  relatedTickets: TicketRecord[];
};

export const CRM_VIEW_TABS: Array<{ id: CrmViewId; label: string }> = [
  { id: "contacts", label: "Contacts" },
  { id: "segments", label: "Segments" },
  { id: "deals", label: "Deals" },
  { id: "tasks", label: "Tasks" },
];

const QUICK_FILTER_LABELS: Record<CrmQuickFilterId, string> = {
  all: "Semua",
  new_lead: "New Lead",
  hot_lead: "Hot Lead",
  follow_up: "Butuh Follow-up",
  customer: "Customer",
  booking: "Pernah Booking",
  complaint: "Komplain Aktif",
  inactive: "Tidak Aktif",
  blocked: "Blocked",
};

function normalizeLookupValue(value?: string | null) {
  return value?.trim().toLowerCase() ?? "";
}

function toCurrencyValue(label: string) {
  const numeric = Number(label.replace(/[^\d]/g, ""));
  return Number.isFinite(numeric) ? numeric : 0;
}

function clampScore(score: number) {
  return Math.max(0, Math.min(100, Math.round(score)));
}

function collectCustomerRelations(
  data: DashboardOperationsData,
  customerId: string,
) {
  const conversations = data.conversations.filter(
    (conversation) => conversation.customerId === customerId,
  );
  const bookings = data.bookings.filter((booking) => booking.customerId === customerId);
  const tickets = data.tickets.filter((ticket) => ticket.customerId === customerId);

  return { conversations, bookings, tickets };
}

export function deriveLeadScore(
  customer: CustomerRecord,
  data: DashboardOperationsData,
) {
  const { conversations, bookings, tickets } = collectCustomerRelations(data, customer.id);

  const baseScoreByStatus: Record<LeadStatus, number> = {
    "New Lead": 18,
    Interested: 42,
    "Hot Lead": 78,
    "Asked Price": 56,
    Booking: 72,
    Paid: 86,
    Complaint: 28,
    Spam: 0,
  };

  let score = baseScoreByStatus[customer.leadStatus];
  score += Math.min(customer.totalConversation * 3, 12);
  score += Math.min(bookings.length * 10, 20);
  score += Math.min(
    conversations.filter((conversation) => conversation.unreadCount > 0).length * 4,
    8,
  );
  score += customer.tags.some((tag) => normalizeLookupValue(tag).includes("vip")) ? 8 : 0;
  score -= tickets.some((ticket) => ticket.status === "complaint") ? 20 : 0;
  score -= customer.leadStatus === "Spam" ? 100 : 0;

  return clampScore(score);
}

export function deriveScoreBand(score: number): CrmContactRow["scoreBand"] {
  if (score >= 76) {
    return "Ready to Close";
  }

  if (score >= 51) {
    return "Hot";
  }

  if (score >= 21) {
    return "Warm";
  }

  return "Cold";
}

export function deriveLifecycle(customer: CustomerRecord) {
  switch (customer.leadStatus) {
    case "New Lead":
      return "Lead";
    case "Interested":
      return "Qualified Lead";
    case "Hot Lead":
      return "Opportunity";
    case "Asked Price":
      return "Qualified Lead";
    case "Booking":
      return "Opportunity";
    case "Paid":
      return customer.totalConversation > 1 ? "Repeat Customer" : "Customer";
    case "Complaint":
      return "Blocked";
    case "Spam":
      return "Blocked";
    default:
      return "Lead";
  }
}

function derivePrimaryContact(customer: CustomerRecord) {
  return customer.phone || customer.email || customer.username || "Belum ada identitas";
}

function deriveNextFollowUp(
  customer: CustomerRecord,
  data: DashboardOperationsData,
) {
  const { bookings, tickets } = collectCustomerRelations(data, customer.id);

  if (tickets.some((ticket) => ticket.status === "complaint")) {
    return "Escalate hari ini";
  }

  if (customer.leadStatus === "Hot Lead" || customer.leadStatus === "Asked Price") {
    return "Follow-up hari ini";
  }

  if (customer.leadStatus === "Booking" || bookings.length > 0) {
    return "Konfirmasi booking";
  }

  if (customer.leadStatus === "Paid") {
    return "Upsell minggu ini";
  }

  if (customer.totalConversation <= 1) {
    return "Perlu warming";
  }

  return "Tunggu customer";
}

function deriveLastActivity(customer: CustomerRecord, data: DashboardOperationsData) {
  const { conversations, bookings, tickets } = collectCustomerRelations(data, customer.id);

  if (conversations[0]) {
    return conversations[0].lastMessage;
  }

  if (bookings[0]) {
    return `Booking ${bookings[0].service}`;
  }

  if (tickets[0]) {
    return tickets[0].summary;
  }

  return customer.note || "Belum ada aktivitas";
}

function matchesQuickFilter(
  row: CrmContactRow,
  filter: CrmQuickFilterId,
) {
  switch (filter) {
    case "all":
      return true;
    case "new_lead":
      return row.customer.leadStatus === "New Lead";
    case "hot_lead":
      return row.leadScore >= 60;
    case "follow_up":
      return (
        row.customer.leadStatus === "Asked Price" ||
        row.customer.leadStatus === "Booking" ||
        row.openTicketCount > 0
      );
    case "customer":
      return row.customer.leadStatus === "Paid";
    case "booking":
      return row.bookingCount > 0;
    case "complaint":
      return row.customer.leadStatus === "Complaint" || row.openTicketCount > 0;
    case "inactive":
      return row.relatedConversationCount <= 1 && row.bookingCount === 0 && row.openTicketCount === 0;
    case "blocked":
      return row.customer.leadStatus === "Spam" || row.customer.leadStatus === "Complaint";
    default:
      return true;
  }
}

function matchesSearch(
  customer: CustomerRecord,
  data: DashboardOperationsData,
  query: string,
) {
  if (!query.trim()) {
    return true;
  }

  const needle = normalizeLookupValue(query);
  const { conversations, bookings, tickets } = collectCustomerRelations(data, customer.id);
  const searchable = [
    customer.name,
    customer.phone,
    customer.email,
    customer.username,
    customer.segment,
    customer.assignedTo,
    customer.note,
    customer.revenueHint,
    customer.tags.join(" "),
    bookings.map((booking) => `${booking.id} ${booking.service} ${booking.note ?? ""}`).join(" "),
    tickets.map((ticket) => `${ticket.id} ${ticket.issueType} ${ticket.summary}`).join(" "),
    conversations
      .map(
        (conversation) =>
          `${conversation.id} ${conversation.lastIntent} ${conversation.lastMessage} ${conversation.messages
            .map((message) => message.text)
            .join(" ")}`,
      )
      .join(" "),
  ]
    .join(" ")
    .toLowerCase();

  return searchable.includes(needle);
}

export function deriveContactRows(
  data: DashboardOperationsData,
  filters: CrmFilters,
) {
  return data.customers
    .map<CrmContactRow>((customer) => {
      const { conversations, bookings, tickets } = collectCustomerRelations(data, customer.id);
      const leadScore = deriveLeadScore(customer, data);

      return {
        id: customer.id,
        customer,
        leadScore,
        scoreBand: deriveScoreBand(leadScore),
        lifecycle: deriveLifecycle(customer),
        primaryContact: derivePrimaryContact(customer),
        statusLabel: customer.leadStatus,
        lastInteraction: customer.lastContact || "Belum ada kontak",
        lastActivity: deriveLastActivity(customer, data),
        nextFollowUp: deriveNextFollowUp(customer, data),
        bookingCount: bookings.length,
        openTicketCount: tickets.filter((ticket) => ticket.status !== "resolved").length,
        relatedConversationCount: conversations.length,
      };
    })
    .filter((row) => {
      const segmentMatch =
        filters.segment === "all" ||
        normalizeLookupValue(row.customer.segment) === normalizeLookupValue(filters.segment);
      const tagMatch =
        filters.tag === "all" ||
        row.customer.tags.some(
          (tag) => normalizeLookupValue(tag) === normalizeLookupValue(filters.tag),
        );
      const ownerMatch =
        filters.owner === "all" ||
        normalizeLookupValue(row.customer.assignedTo) === normalizeLookupValue(filters.owner);
      const channelMatch =
        filters.channel === "all" || row.customer.channel === filters.channel;

      return (
        segmentMatch &&
        tagMatch &&
        ownerMatch &&
        channelMatch &&
        matchesQuickFilter(row, filters.quickFilter) &&
        matchesSearch(row.customer, data, filters.search)
      );
    })
    .sort((left, right) => {
      if (right.leadScore !== left.leadScore) {
        return right.leadScore - left.leadScore;
      }

      return left.customer.name.localeCompare(right.customer.name);
    });
}

export function deriveQuickFilterSummary(rows: CrmContactRow[]) {
  return (Object.keys(QUICK_FILTER_LABELS) as CrmQuickFilterId[]).map((id) => ({
    id,
    label: QUICK_FILTER_LABELS[id],
    count: rows.filter((row) => matchesQuickFilter(row, id)).length,
  }));
}

export function deriveSegmentOptions(data: DashboardOperationsData) {
  const segments = Array.from(
    new Set(
      data.customers
        .map((customer) => customer.segment.trim())
        .filter((segment) => segment.length > 0),
    ),
  );

  return ["all", ...segments];
}

export function deriveTagOptions(data: DashboardOperationsData) {
  const tags = Array.from(new Set(data.customers.flatMap((customer) => customer.tags)));
  return ["all", ...tags];
}

export function deriveOwnerOptions(data: DashboardOperationsData) {
  const owners = Array.from(
    new Set(
      data.customers
        .map((customer) => customer.assignedTo.trim())
        .filter((owner) => owner.length > 0),
    ),
  );

  return ["all", ...owners];
}

export function deriveSegments(data: DashboardOperationsData) {
  const rows = deriveContactRows(data, {
    search: "",
    segment: "all",
    tag: "all",
    owner: "all",
    channel: "all",
    quickFilter: "all",
  });

  const hotLeadNoBooking = rows.filter(
    (row) => row.leadScore >= 60 && row.bookingCount === 0,
  ).length;
  const instagramHotLead = rows.filter(
    (row) => row.customer.channel === "Instagram DM" && row.leadScore >= 60,
  ).length;
  const activeComplaints = rows.filter((row) => row.openTicketCount > 0).length;
  const repeatCustomers = rows.filter((row) => row.customer.leadStatus === "Paid").length;
  const inactiveCustomers = rows.filter((row) => matchesQuickFilter(row, "inactive")).length;

  return [
    {
      id: "segment-all",
      name: "Semua Contact",
      type: "static" as const,
      count: rows.length,
      description: "Seluruh contact aktif yang ada di workspace.",
    },
    {
      id: "segment-hot-instagram",
      name: "Hot Lead dari Instagram",
      type: "dynamic" as const,
      count: instagramHotLead,
      description: "Lead score >= 60 dan source utama dari Instagram DM.",
    },
    {
      id: "segment-hot-no-booking",
      name: "Hot Lead Belum Booking",
      type: "dynamic" as const,
      count: hotLeadNoBooking,
      description: "Lead score >= 60, belum pernah booking, dan perlu follow-up.",
    },
    {
      id: "segment-booked",
      name: "Customer Pernah Booking",
      type: "dynamic" as const,
      count: rows.filter((row) => row.bookingCount > 0).length,
      description: "Pernah membuat booking dan bisa dipakai untuk upsell.",
    },
    {
      id: "segment-complaint",
      name: "Komplain Aktif",
      type: "dynamic" as const,
      count: activeComplaints,
      description: "Memiliki ticket aktif atau lifecycle komplain.",
    },
    {
      id: "segment-vip",
      name: "VIP Customer",
      type: "dynamic" as const,
      count: rows.filter((row) => row.leadScore >= 85).length,
      description: "Customer dengan nilai tinggi, transaksi kuat, atau tag VIP.",
    },
    {
      id: "segment-repeat",
      name: "Repeat Customer",
      type: "dynamic" as const,
      count: repeatCustomers,
      description: "Sudah menjadi customer dan berpotensi repeat order.",
    },
    {
      id: "segment-inactive",
      name: "Reactivation Queue",
      type: "dynamic" as const,
      count: inactiveCustomers,
      description: "Contact minim aktivitas dan cocok masuk campaign reactivation.",
    },
  ] satisfies CrmSegmentRecord[];
}

function deriveDealStage(customer: CustomerRecord): CrmDealStage {
  switch (customer.leadStatus) {
    case "New Lead":
      return "New Lead";
    case "Interested":
    case "Asked Price":
      return "Qualified";
    case "Hot Lead":
    case "Booking":
      return "Booking";
    case "Paid":
      return "Won";
    case "Complaint":
    case "Spam":
      return "Lost";
    default:
      return "New Lead";
  }
}

export function deriveDeals(data: DashboardOperationsData) {
  const manualDeals = data.crmDeals.map<CrmDealRecord>((deal) => ({
    ...deal,
  }));

  const manualContactIds = new Set(manualDeals.map((deal) => deal.contactId));

  const derivedDeals = data.customers
    .filter((customer) => customer.leadStatus !== "Spam")
    .filter((customer) => !manualContactIds.has(customer.id))
    .map<CrmDealRecord>((customer) => {
      const { bookings, conversations } = collectCustomerRelations(data, customer.id);
      const latestBooking = bookings[0];
      const lastIntent = conversations[0]?.lastIntent || customer.segment || "Opportunity";
      const value = toCurrencyValue(customer.revenueHint || latestBooking?.note || "0");
      const stage = deriveDealStage(customer);
      const probability =
        stage === "Won" ? 100 : stage === "Booking" ? 70 : stage === "Qualified" ? 45 : 25;

      return {
        id: `deal-${customer.id}`,
        title: `${lastIntent} - ${customer.name}`,
        contactId: customer.id,
        contactName: customer.name,
        stage,
        valueLabel: customer.revenueHint || "Rp0",
        probability,
        owner: customer.assignedTo,
        source: customer.channel,
        expectedClose:
          stage === "Won" ? "Deal selesai" : stage === "Booking" ? "1-3 hari" : "Minggu ini",
        productOrService: latestBooking?.service || lastIntent,
      };
    })
    .sort((left, right) => toCurrencyValue(right.valueLabel) - toCurrencyValue(left.valueLabel));

  return [...manualDeals, ...derivedDeals].sort(
    (left, right) => toCurrencyValue(right.valueLabel) - toCurrencyValue(left.valueLabel),
  );
}

export function deriveTasks(data: DashboardOperationsData) {
  const manualTasks = data.crmTasks.map<CrmTaskRecord>((task) => ({
    ...task,
  }));
  const manualTaskKeys = new Set(
    manualTasks.map((task) => `${task.contactId}:${normalizeLookupValue(task.title)}`),
  );

  const hotLeadTasks = data.customers
    .filter(
      (customer) =>
        customer.leadStatus === "Hot Lead" ||
        customer.leadStatus === "Asked Price" ||
        customer.leadStatus === "Booking",
    )
    .map<CrmTaskRecord | null>((customer) => {
      const title =
        customer.leadStatus === "Booking"
          ? "Konfirmasi booking customer"
          : "Follow-up customer potensial";
      const dedupeKey = `${customer.id}:${normalizeLookupValue(title)}`;

      if (manualTaskKeys.has(dedupeKey)) {
        return null;
      }

      return {
        id: `task-follow-up-${customer.id}`,
        contactId: customer.id,
        contactName: customer.name,
        title,
        type:
          customer.leadStatus === "Booking" ? "Confirm Booking" : "WhatsApp Follow-up",
        status: customer.leadStatus === "Booking" ? "In Progress" : "Open",
        dueLabel: customer.leadStatus === "Hot Lead" ? "Hari ini" : "Besok pagi",
        priority: customer.leadStatus === "Hot Lead" ? "High" : "Medium",
        owner: customer.assignedTo,
        outcome:
          customer.leadStatus === "Booking"
            ? "Tunggu kepastian jadwal"
            : "Jangan biarkan lead panas dingin",
      };
    })
    .filter((task): task is CrmTaskRecord => task !== null);

  const ticketTasks = data.tickets
    .filter((ticket) => ticket.status !== "resolved")
    .map<CrmTaskRecord | null>((ticket) => {
      const title = `Review ticket ${ticket.issueType}`;
      const dedupeKey = `${ticket.customerId}:${normalizeLookupValue(title)}`;

      if (manualTaskKeys.has(dedupeKey)) {
        return null;
      }

      return {
        id: `task-ticket-${ticket.id}`,
        contactId: ticket.customerId,
        contactName: ticket.customerName,
        title,
        type: "Technical Follow-up",
        status: ticket.status === "complaint" ? "Overdue" : "In Progress",
        dueLabel: ticket.status === "complaint" ? "Segera" : "Hari ini",
        priority:
          ticket.priority === "critical" || ticket.priority === "high" ? "High" : "Medium",
        owner: ticket.assignedTo,
        outcome: ticket.summary,
      };
    })
    .filter((task): task is CrmTaskRecord => task !== null);

  return [...manualTasks, ...hotLeadTasks, ...ticketTasks];
}

export function deriveContactDetail(
  data: DashboardOperationsData,
  customer: CustomerRecord,
) {
  const { conversations, bookings, tickets } = collectCustomerRelations(data, customer.id);
  const deals = deriveDeals(data).filter((deal) => deal.contactId === customer.id);
  const tasks = deriveTasks(data).filter((task) => task.contactId === customer.id);
  const leadScore = deriveLeadScore(customer, data);
  const scoreBand = deriveScoreBand(leadScore);
  const lifecycle = deriveLifecycle(customer);

  const timeline: CrmTimelineItem[] = [];

  timeline.push({
    id: `crm-${customer.id}`,
    time: customer.lastContact || "Terakhir tersimpan",
    title: "Contact aktif di CRM",
    detail: `Lifecycle ${lifecycle}, owner ${customer.assignedTo}, segment ${customer.segment || "General"}.`,
    toneClassName: "border-cyan-200 bg-cyan-50 text-cyan-800",
  });

  conversations.slice(0, 3).forEach((conversation) => {
    timeline.push({
      id: conversation.id,
      time: conversation.timestamp,
      title: `${conversation.channel} - ${conversation.lastIntent || "Conversation"}`,
      detail: conversation.lastMessage,
      toneClassName: "border-slate-200 bg-white text-slate-700",
    });
  });

  bookings.slice(0, 3).forEach((booking) => {
    timeline.push({
      id: booking.id,
      time: `${booking.date} ${booking.slot}`,
      title: `Booking ${booking.service}`,
      detail: `${booking.status}${booking.branch ? ` | ${booking.branch}` : ""}`,
      toneClassName: "border-violet-200 bg-violet-50 text-violet-800",
    });
  });

  tickets.slice(0, 3).forEach((ticket) => {
    timeline.push({
      id: ticket.id,
      time: ticket.updatedAt,
      title: `Ticket ${ticket.issueType}`,
      detail: ticket.summary,
      toneClassName:
        ticket.status === "resolved"
          ? "border-emerald-200 bg-emerald-50 text-emerald-800"
          : "border-amber-200 bg-amber-50 text-amber-800",
    });
  });

  const summary =
    customer.leadStatus === "Hot Lead"
      ? `${customer.name} merupakan hot lead dari ${customer.channel}. Ia sudah menunjukkan intent yang jelas dan perlu follow-up cepat.`
      : customer.leadStatus === "Booking"
        ? `${customer.name} sudah masuk fase booking dan perlu dipastikan jadwal atau pembayarannya.`
        : customer.leadStatus === "Paid"
          ? `${customer.name} sudah menjadi customer. Fokus berikutnya adalah repeat order, retention, dan upsell yang relevan.`
          : `${customer.name} masih berada di tahap ${customer.leadStatus}. Data CRM ini membantu tim melihat histori, intent, dan konteks follow-up.`;

  const suggestedNextAction =
    customer.leadStatus === "Hot Lead"
      ? "Kirim pilihan jadwal service atau penawaran konkret hari ini."
      : customer.leadStatus === "Asked Price"
        ? "Kirim daftar harga singkat dan dorong ke booking atau quotation."
        : customer.leadStatus === "Booking"
          ? "Konfirmasi slot, teknisi, dan status pembayaran sebelum hari H."
          : customer.leadStatus === "Complaint"
            ? "Eskalasi ke supervisor dan hentikan flow marketing sampai ticket selesai."
            : customer.leadStatus === "Paid"
              ? "Masukkan ke follow-up purna jual dan siapkan campaign repeat order."
              : "Lengkapi identitas contact dan lanjutkan warming conversation.";

  return {
    customer,
    leadScore,
    scoreBand,
    lifecycle,
    summary,
    suggestedNextAction,
    primaryIdentityRows: [
      { label: "Nama lengkap", value: customer.name },
      { label: "Nomor telepon", value: customer.phone || "-" },
      { label: "Email", value: customer.email || "-" },
      { label: "Preferred channel", value: customer.channel },
      { label: "Owner", value: customer.assignedTo },
      { label: "Company", value: "Belum diisi" },
    ],
    channelIdentityRows: [
      { label: "WhatsApp ID", value: customer.channel === "WhatsApp" ? customer.phone || "-" : "-" },
      { label: "Instagram ID", value: customer.channel.includes("Instagram") ? customer.username || "-" : customer.username || "-" },
      { label: "Telegram ID", value: "-" },
      { label: "Website visitor ID", value: customer.channel === "Website Chat" ? customer.id : "-" },
    ],
    tags: customer.tags,
    timeline,
    relatedDeals: deals,
    relatedTasks: tasks,
    relatedBookings: bookings,
    relatedTickets: tickets,
  } satisfies CrmContactDetail;
}
