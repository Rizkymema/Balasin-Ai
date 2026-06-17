import {
  AlertTriangle,
  Ban,
  Bot,
  Check,
  CheckCheck,
  CircleCheckBig,
  Clock3,
  Globe2,
  Instagram,
  MessageCircleMore,
  PauseCircle,
  ShieldAlert,
  TimerOff,
  User,
  VolumeX,
  type LucideIcon,
} from "lucide-react";

import type { DashboardConfig } from "@/types/dashboard-config";
import type {
  ConversationMessage,
  ConversationRecord,
  ConversationStatus,
  CustomerRecord,
  DashboardOperationsData,
  MessageDeliveryStatus,
} from "@/types/operations";

export type InboxQuickFilterId =
  | "all"
  | "unhandled"
  | "need_admin"
  | "mine"
  | "ai_active"
  | "waiting_customer"
  | "snoozed"
  | "resolved"
  | "spam";

export type InboxSortId =
  | "latest"
  | "oldest"
  | "unread"
  | "priority"
  | "longest_wait";

export type InboxFilterState = {
  quickFilter: InboxQuickFilterId;
  channel: "all" | ConversationRecord["channel"];
  status: "all" | ConversationStatus;
  assignment: "all" | string;
  search: string;
  sortBy: InboxSortId;
};

export type InboxSummary = {
  allCount: number;
  unhandledCount: number;
  needAdminCount: number;
  mineCount: number;
  aiActiveCount: number;
  waitingCustomerCount: number;
  snoozedCount: number;
  resolvedCount: number;
  spamCount: number;
  slaLateCount: number;
};

export type MessageStatusMeta = {
  label: string;
  icon: LucideIcon;
  iconClassName: string;
};

export type ConversationStatusMeta = {
  label: string;
  shortLabel: string;
  description: string;
  icon: LucideIcon;
  toneClassName: string;
  subtleToneClassName: string;
};

export type ChannelMeta = {
  label: string;
  icon: LucideIcon;
  toneClassName: string;
};

export type PriorityMeta = {
  label: "Normal" | "High" | "Urgent";
  toneClassName: string;
};

export type ConversationContext = {
  customer: CustomerRecord | null;
  relatedBookings: DashboardOperationsData["bookings"];
  relatedTickets: DashboardOperationsData["tickets"];
  activeTicket: DashboardOperationsData["tickets"][number] | null;
  latestBooking: DashboardOperationsData["bookings"][number] | null;
  leadScore: number;
  customerSinceLabel: string;
  paymentStatusLabel: string;
  lastServiceLabel: string;
};

export const QUICK_FILTERS: Array<{
  id: InboxQuickFilterId;
  label: string;
}> = [
  { id: "all", label: "Semua" },
  { id: "unhandled", label: "Belum Ditangani" },
  { id: "need_admin", label: "Butuh Admin" },
  { id: "mine", label: "Ditangani Saya" },
  { id: "ai_active", label: "AI Aktif" },
  { id: "waiting_customer", label: "Menunggu Customer" },
  { id: "snoozed", label: "Snoozed" },
  { id: "resolved", label: "Selesai" },
  { id: "spam", label: "Spam" },
];

export const SORT_OPTIONS: Array<{ value: InboxSortId; label: string }> = [
  { value: "latest", label: "Terbaru" },
  { value: "unread", label: "Unread terbanyak" },
  { value: "priority", label: "Prioritas tertinggi" },
  { value: "longest_wait", label: "Waktu tunggu terlama" },
  { value: "oldest", label: "Terlama" },
];

export const STATUS_OPTIONS: Array<{
  value: "all" | ConversationStatus;
  label: string;
}> = [
  { value: "all", label: "Semua Status" },
  { value: "ai_active", label: "AI Aktif" },
  { value: "ai_paused", label: "AI Pause" },
  { value: "assigned_to_admin", label: "Butuh Admin" },
  { value: "waiting_customer", label: "Menunggu Customer" },
  { value: "resolved", label: "Selesai" },
  { value: "blocked", label: "Blocked" },
  { value: "spam", label: "Spam" },
];

function riskScore(conversation: ConversationRecord) {
  if (conversation.riskLevel === "high") {
    return 3;
  }

  if (conversation.riskLevel === "medium") {
    return 2;
  }

  return 1;
}

function hasHumanTouch(conversation: ConversationRecord) {
  return conversation.messages.some(
    (message) => message.sender === "admin" || message.sender === "agent",
  );
}

function hasUnhandledUnread(conversation: ConversationRecord) {
  return (
    conversation.unreadCount > 0 &&
    conversation.status !== "resolved" &&
    conversation.status !== "spam"
  );
}

function getBaseSlaSeconds(conversation: ConversationRecord) {
  const baseByRisk =
    conversation.riskLevel === "high"
      ? 15 * 60
      : conversation.riskLevel === "medium"
        ? 30 * 60
        : 60 * 60;

  if (conversation.channel === "WhatsApp") {
    return Math.min(baseByRisk, 20 * 60);
  }

  return baseByRisk;
}

export function getSlaRemainingSeconds(conversation: ConversationRecord) {
  return getBaseSlaSeconds(conversation) - conversation.responseTimeSeconds;
}

export function formatDurationLabel(totalSeconds: number) {
  if (totalSeconds <= 0) {
    return "0 menit";
  }

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.max(1, Math.round((totalSeconds % 3600) / 60));

  if (hours > 0) {
    return `${hours}j ${minutes}m`;
  }

  return `${minutes} menit`;
}

export function formatSlaLabel(conversation: ConversationRecord) {
  const remaining = getSlaRemainingSeconds(conversation);

  if (remaining < 0) {
    return `Terlambat ${formatDurationLabel(Math.abs(remaining))}`;
  }

  return `${formatDurationLabel(remaining)} tersisa`;
}

export function getPriorityMeta(conversation: ConversationRecord): PriorityMeta {
  if (conversation.riskLevel === "high") {
    return {
      label: "Urgent",
      toneClassName: "border-rose-500/30 bg-rose-500/10 text-rose-200",
    };
  }

  if (conversation.riskLevel === "medium") {
    return {
      label: "High",
      toneClassName: "border-amber-500/30 bg-amber-500/10 text-amber-200",
    };
  }

  return {
    label: "Normal",
    toneClassName: "border-emerald-500/30 bg-emerald-500/10 text-emerald-200",
  };
}

export function getChannelMeta(
  conversation: ConversationRecord,
): ChannelMeta {
  switch (conversation.channel) {
    case "WhatsApp":
      return {
        label: "WhatsApp",
        icon: MessageCircleMore,
        toneClassName: "bg-emerald-500/10 text-emerald-200",
      };
    case "Instagram DM":
      return {
        label: "Instagram DM",
        icon: Instagram,
        toneClassName: "bg-fuchsia-500/10 text-fuchsia-200",
      };
    case "Instagram Comment":
      return {
        label: "Instagram Comment",
        icon: Instagram,
        toneClassName: "bg-orange-500/10 text-orange-200",
      };
    default:
      return {
        label: "Website Chat",
        icon: Globe2,
        toneClassName: "bg-sky-500/10 text-sky-200",
      };
  }
}

export function getMessageStatusMeta(
  status?: MessageDeliveryStatus,
): MessageStatusMeta | null {
  switch (status) {
    case "read":
      return {
        label: "Read",
        icon: CheckCheck,
        iconClassName: "text-cyan-300",
      };
    case "delivered":
      return {
        label: "Delivered",
        icon: CheckCheck,
        iconClassName: "text-slate-400",
      };
    case "sent":
      return {
        label: "Sent",
        icon: Check,
        iconClassName: "text-slate-500",
      };
    default:
      return null;
  }
}

export function getConversationStatusMeta(
  conversation: ConversationRecord,
): ConversationStatusMeta {
  if (conversation.status === "assigned_to_admin") {
    const humanActive = hasHumanTouch(conversation);

    return {
      label: humanActive ? "Human Active" : "Need Admin",
      shortLabel: humanActive ? "Ditangani Admin" : "Butuh Admin",
      description: humanActive
        ? "Admin sudah mengambil alih dan AI berhenti membalas."
        : "AI meminta bantuan manusia untuk menyelesaikan percakapan ini.",
      icon: humanActive ? User : ShieldAlert,
      toneClassName: humanActive
        ? "border-amber-500/30 bg-amber-500/10 text-amber-200"
        : "border-rose-500/30 bg-rose-500/10 text-rose-200",
      subtleToneClassName: humanActive
        ? "bg-amber-500/5 text-amber-100"
        : "bg-rose-500/5 text-rose-100",
    };
  }

  switch (conversation.status) {
    case "ai_active":
      return {
        label: "AI Active",
        shortLabel: "AI Aktif",
        description: "AI masih menjadi operator utama untuk percakapan ini.",
        icon: Bot,
        toneClassName: "border-cyan-500/30 bg-cyan-500/10 text-cyan-200",
        subtleToneClassName: "bg-cyan-500/5 text-cyan-100",
      };
    case "ai_paused":
      return {
        label: "AI Paused",
        shortLabel: "AI Pause",
        description: "Balasan AI dihentikan sementara sampai diaktifkan lagi.",
        icon: PauseCircle,
        toneClassName: "border-amber-500/30 bg-amber-500/10 text-amber-200",
        subtleToneClassName: "bg-amber-500/5 text-amber-100",
      };
    case "waiting_customer":
      return {
        label: "Waiting Customer",
        shortLabel: "Menunggu Customer",
        description: "Tim menunggu jawaban lanjutan dari customer.",
        icon: Clock3,
        toneClassName: "border-sky-500/30 bg-sky-500/10 text-sky-200",
        subtleToneClassName: "bg-sky-500/5 text-sky-100",
      };
    case "resolved":
      return {
        label: "Resolved",
        shortLabel: "Selesai",
        description: "Percakapan sudah ditutup dengan hasil yang jelas.",
        icon: CircleCheckBig,
        toneClassName:
          "border-emerald-500/30 bg-emerald-500/10 text-emerald-200",
        subtleToneClassName: "bg-emerald-500/5 text-emerald-100",
      };
    case "blocked":
      return {
        label: "Blocked",
        shortLabel: "Blocked",
        description: "Percakapan ditahan untuk mitigasi risiko atau komplain berat.",
        icon: Ban,
        toneClassName: "border-orange-500/30 bg-orange-500/10 text-orange-200",
        subtleToneClassName: "bg-orange-500/5 text-orange-100",
      };
    case "spam":
      return {
        label: "Spam",
        shortLabel: "Spam",
        description: "Percakapan tidak relevan dan dipisahkan dari inbox utama.",
        icon: VolumeX,
        toneClassName: "border-white/15 bg-white/5 text-slate-300",
        subtleToneClassName: "bg-white/5 text-slate-200",
      };
    default:
      return {
        label: "Unknown",
        shortLabel: "Unknown",
        description: "Status percakapan belum dikenali.",
        icon: AlertTriangle,
        toneClassName: "border-white/15 bg-white/5 text-slate-300",
        subtleToneClassName: "bg-white/5 text-slate-200",
      };
  }
}

export function deriveInboxSummary(
  conversations: ConversationRecord[],
  aiAgentName: string,
): InboxSummary {
  return {
    allCount: conversations.length,
    unhandledCount: conversations.filter(hasUnhandledUnread).length,
    needAdminCount: conversations.filter(
      (conversation) =>
        conversation.status === "assigned_to_admin" ||
        conversation.status === "blocked",
    ).length,
    mineCount: conversations.filter(
      (conversation) =>
        conversation.assignedTo !== aiAgentName &&
        conversation.status !== "resolved" &&
        conversation.status !== "spam",
    ).length,
    aiActiveCount: conversations.filter(
      (conversation) => conversation.status === "ai_active",
    ).length,
    waitingCustomerCount: conversations.filter(
      (conversation) => conversation.status === "waiting_customer",
    ).length,
    snoozedCount: 0,
    resolvedCount: conversations.filter(
      (conversation) => conversation.status === "resolved",
    ).length,
    spamCount: conversations.filter(
      (conversation) => conversation.status === "spam",
    ).length,
    slaLateCount: conversations.filter(
      (conversation) =>
        conversation.status !== "resolved" &&
        conversation.status !== "spam" &&
        getSlaRemainingSeconds(conversation) < 0,
    ).length,
  };
}

function matchesQuickFilter(
  conversation: ConversationRecord,
  quickFilter: InboxQuickFilterId,
  aiAgentName: string,
) {
  switch (quickFilter) {
    case "unhandled":
      return hasUnhandledUnread(conversation);
    case "need_admin":
      return (
        conversation.status === "assigned_to_admin" ||
        conversation.status === "blocked"
      );
    case "mine":
      return (
        conversation.assignedTo !== aiAgentName &&
        conversation.status !== "resolved" &&
        conversation.status !== "spam"
      );
    case "ai_active":
      return conversation.status === "ai_active";
    case "waiting_customer":
      return conversation.status === "waiting_customer";
    case "snoozed":
      return false;
    case "resolved":
      return conversation.status === "resolved";
    case "spam":
      return conversation.status === "spam";
    case "all":
    default:
      return true;
  }
}

function matchesSearch(conversation: ConversationRecord, search: string) {
  if (!search.trim()) {
    return true;
  }

  const needle = search.trim().toLowerCase();
  const haystacks = [
    conversation.name,
    conversation.phone,
    conversation.email,
    conversation.username,
    conversation.lastMessage,
    conversation.lastIntent,
    conversation.assignedTo,
    conversation.ticketId,
    conversation.notes,
    conversation.summary,
    conversation.tags.join(" "),
    conversation.messages.map((message) => message.text).join(" "),
  ];

  return haystacks.some((value) => value?.toLowerCase().includes(needle));
}

function sortConversations(
  conversations: ConversationRecord[],
  sortBy: InboxSortId,
) {
  const next = conversations.slice();

  if (sortBy === "oldest") {
    return next.reverse();
  }

  if (sortBy === "unread") {
    return next.sort((left, right) => {
      if (right.unreadCount !== left.unreadCount) {
        return right.unreadCount - left.unreadCount;
      }

      return riskScore(right) - riskScore(left);
    });
  }

  if (sortBy === "priority") {
    return next.sort((left, right) => {
      const riskDelta = riskScore(right) - riskScore(left);
      if (riskDelta !== 0) {
        return riskDelta;
      }

      return right.unreadCount - left.unreadCount;
    });
  }

  if (sortBy === "longest_wait") {
    return next.sort(
      (left, right) => right.responseTimeSeconds - left.responseTimeSeconds,
    );
  }

  return next;
}

export function filterInboxConversations(
  conversations: ConversationRecord[],
  filters: InboxFilterState,
  aiAgentName: string,
) {
  const next = conversations.filter((conversation) => {
    const channelMatch =
      filters.channel === "all" || conversation.channel === filters.channel;
    const statusMatch =
      filters.status === "all" || conversation.status === filters.status;
    const assignmentMatch =
      filters.assignment === "all" ||
      conversation.assignedTo === filters.assignment;

    return (
      matchesQuickFilter(conversation, filters.quickFilter, aiAgentName) &&
      matchesSearch(conversation, filters.search) &&
      channelMatch &&
      statusMatch &&
      assignmentMatch
    );
  });

  return sortConversations(next, filters.sortBy);
}

export function getAssignmentOptions(
  conversations: ConversationRecord[],
): Array<{ value: "all" | string; label: string }> {
  const uniqueOwners = Array.from(
    new Set(
      conversations
        .map((conversation) => conversation.assignedTo)
        .filter((value) => value.trim().length > 0),
    ),
  );

  return [
    { value: "all", label: "Semua Tim" },
    ...uniqueOwners.map((owner) => ({ value: owner, label: owner })),
  ];
}

export function getConversationContext(
  data: DashboardOperationsData,
  conversation: ConversationRecord,
): ConversationContext {
  const customer =
    data.customers.find((item) => item.id === conversation.customerId) ?? null;
  const relatedBookings = data.bookings
    .filter((booking) => booking.customerId === conversation.customerId)
    .slice()
    .sort((left, right) => right.date.localeCompare(left.date));
  const relatedTickets = data.tickets
    .filter((ticket) => ticket.customerId === conversation.customerId)
    .slice()
    .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
  const activeTicket =
    relatedTickets.find((ticket) => ticket.status !== "resolved") ?? null;
  const latestBooking = relatedBookings[0] ?? null;
  const leadScore = Math.min(
    98,
    50 +
      conversation.aiConfidence / 2 +
      conversation.unreadCount * 3 +
      riskScore(conversation) * 8,
  );

  return {
    customer,
    relatedBookings,
    relatedTickets,
    activeTicket,
    latestBooking,
    leadScore: Math.round(leadScore),
    customerSinceLabel: customer
      ? `${customer.totalConversation} percakapan tercatat`
      : "Belum ada histori kontak",
    paymentStatusLabel: relatedBookings.some(
      (booking) => booking.status === "Waiting Payment",
    )
      ? "Menunggu pembayaran"
      : latestBooking
        ? latestBooking.status
        : "Belum ada pembayaran aktif",
    lastServiceLabel:
      latestBooking?.service ??
      activeTicket?.issueType ??
      "Belum ada layanan terkait",
  };
}

export function getSuggestedNextAction(conversation: ConversationRecord) {
  if (conversation.status === "assigned_to_admin") {
    return "Ambil alih penuh, validasi kebutuhan customer, lalu tutup atau aktifkan AI kembali saat aman.";
  }

  if (conversation.status === "waiting_customer") {
    return "Lakukan follow-up singkat untuk mengunci detail terakhir agar proses booking atau penjualan bergerak.";
  }

  if (conversation.riskLevel === "high") {
    return "Prioritaskan respon manusia karena percakapan berisiko tinggi dan butuh klarifikasi cepat.";
  }

  if (conversation.channel === "Instagram Comment") {
    return "Evaluasi apakah perlu dibalas publik atau dipindahkan ke DM agar percakapan lebih privat.";
  }

  return "AI masih aman menangani chat ini, tetapi siapkan handoff jika customer meminta keputusan final.";
}

export function buildAiSuggestion(input: {
  conversation: ConversationRecord;
  config: DashboardConfig;
  variant: "default" | "short" | "warm";
  version: number;
}) {
  const { conversation, config, variant, version } = input;
  const serviceHint =
    conversation.lastIntent.trim() || conversation.tags[0] || "kebutuhan ini";
  const opener =
    variant === "warm"
      ? `Siap, ${conversation.name.split(" ")[0]}. `
      : variant === "short"
        ? ""
        : `Baik kak, untuk ${serviceHint.toLowerCase()} `;
  const questionPool = [
    "boleh dibantu info tipe motor atau detail kebutuhan utamanya?",
    "boleh share detail tambahan supaya kami cek opsi paling pas?",
    "bisa kirim detail singkat agar kami arahkan ke solusi yang tepat?",
  ];
  const detailQuestion = questionPool[version % questionPool.length];

  if (variant === "short") {
    return `${opener}${detailQuestion}`;
  }

  const summaryLine =
    conversation.channel === "Instagram Comment"
      ? "Supaya percakapannya lebih nyaman, kami juga bisa lanjut via DM."
      : `${config.workspace.name} siap bantu cek estimasi dan langkah berikutnya.`;

  return `${opener}${summaryLine} ${detailQuestion}`;
}

export function maskPhone(phone?: string) {
  if (!phone?.trim()) {
    return "-";
  }

  if (phone.length <= 6) {
    return phone;
  }

  return `${phone.slice(0, 5)}****${phone.slice(-3)}`;
}

export function maskEmail(email?: string) {
  if (!email?.includes("@")) {
    return "-";
  }

  const [name, domain] = email.split("@");
  const maskedName =
    name.length <= 3 ? `${name[0]}**` : `${name.slice(0, 2)}***`;

  return `${maskedName}@${domain}`;
}

export function getMessageActorLabel(message: ConversationMessage) {
  switch (message.sender) {
    case "customer":
      return "Customer";
    case "ai":
      return "AI Assistant";
    case "admin":
    case "agent":
      return "Admin";
    case "system":
      return "System";
    default:
      return "Message";
  }
}

