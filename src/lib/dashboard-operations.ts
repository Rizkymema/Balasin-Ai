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
} from "@/types/operations";

const STORAGE_KEY = "balesin_dashboard_operations";
const STORAGE_EVENT = "balesin-dashboard-operations-change";

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

export const defaultDashboardOperations: DashboardOperationsData = {
  conversations: [
    {
      id: "conv-1",
      customerId: "cust-1",
      name: "Jefri Pratama",
      channel: "WhatsApp",
      lastMessage: "Apakah besok bengkelnya buka jam 9 pagi?",
      timestamp: "10:14",
      unreadCount: 0,
      status: "ai_active",
      phone: "+62 812-3456-7890",
      email: "jefri.pratama@gmail.com",
      username: "@jefripratama",
      assignedTo: "AI Agent",
      responseTimeSeconds: 28,
      tags: ["Tanya Harga", "Pelanggan Baru"],
      notes: "Pelanggan ingin servis berkala Honda Vario.",
      summary:
        "Customer menanyakan estimasi servis berkala dan jam buka bengkel. AI masih aman untuk lanjut menjawab.",
      lastIntent: "FAQ umum",
      sentiment: "neutral",
      aiConfidence: 92,
      riskLevel: "low",
      ticketId: null,
      messages: [
        {
          id: "m1",
          sender: "customer",
          text: "Halo Balesin AI, mau tanya alamat bengkelnya di mana ya?",
          timestamp: "10:10",
          type: "text",
        },
        {
          id: "m2",
          sender: "ai",
          text: "Halo! Bengkel kami berlokasi di Jl. Sudirman No. 42, Jakarta Pusat. Patokannya di sebelah Gedung BCA.",
          timestamp: "10:10",
          status: "read",
          type: "text",
        },
        {
          id: "m3",
          sender: "customer",
          text: "Apakah besok bengkelnya buka jam 9 pagi?",
          timestamp: "10:14",
          type: "text",
        },
      ],
    },
    {
      id: "conv-2",
      customerId: "cust-2",
      name: "Siti Rahma",
      channel: "Website Chat",
      lastMessage: "Oke tolong segera ya karena besok saya keluar kota.",
      timestamp: "09:45",
      unreadCount: 2,
      status: "assigned_to_admin",
      phone: "-",
      email: "siti.rahma99@outlook.com",
      assignedTo: "Nadia",
      responseTimeSeconds: 41,
      tags: ["Refund", "Komplain"],
      notes: "Menunggu refund order sepatu yang robek.",
      summary:
        "Kasus refund dan komplain kualitas barang. AI sudah handoff ke admin dan tidak boleh membalas lagi.",
      lastIntent: "Komplain",
      sentiment: "negative",
      aiConfidence: 44,
      riskLevel: "high",
      ticketId: "ticket-1",
      messages: [
        {
          id: "m4",
          sender: "customer",
          text: "Saya ingin melakukan refund untuk order #1084",
          timestamp: "09:42",
          type: "text",
        },
        {
          id: "m5",
          sender: "ai",
          text: "Maaf atas ketidaknyamanan Anda. Untuk proses refund/pengembalian barang, saya perlu meneruskan chat ini ke admin manusia. Mohon tunggu sebentar ya.",
          timestamp: "09:43",
          status: "read",
          type: "text",
        },
        {
          id: "m6",
          sender: "customer",
          text: "Oke tolong segera ya karena besok saya keluar kota.",
          timestamp: "09:45",
          type: "text",
        },
      ],
    },
    {
      id: "conv-3",
      customerId: "cust-3",
      name: "Andi Wijaya",
      channel: "WhatsApp",
      lastMessage: "Terima kasih, infonya sangat membantu.",
      timestamp: "Kemarin",
      unreadCount: 0,
      status: "resolved",
      phone: "+62 899-7766-5544",
      email: "andi.wijaya@yahoo.com",
      username: "@andiwijaya",
      assignedTo: "Rian",
      responseTimeSeconds: 54,
      tags: ["VIP", "Repeat Order"],
      notes: "Sering order oli mesin dalam jumlah besar.",
      summary:
        "Customer repeat order sudah dibantu manual oleh admin dan percakapan ditandai selesai.",
      lastIntent: "Tanya stok",
      sentiment: "positive",
      aiConfidence: 78,
      riskLevel: "medium",
      ticketId: null,
      messages: [
        {
          id: "m7",
          sender: "customer",
          text: "Apakah oli Castrol Power 1 ready stock?",
          timestamp: "Kemarin 14:20",
          type: "text",
        },
        {
          id: "m8",
          sender: "admin",
          text: "Ready pak Andi! Silakan langsung order via link tokopedia kami ya.",
          timestamp: "Kemarin 14:22",
          status: "read",
          type: "text",
        },
        {
          id: "m9",
          sender: "customer",
          text: "Terima kasih, infonya sangat membantu.",
          timestamp: "Kemarin 14:25",
          type: "text",
        },
      ],
    },
    {
      id: "conv-4",
      customerId: "cust-4",
      name: "Sarah Motorcare",
      channel: "Instagram DM",
      lastMessage: "Kalau mau cek stok langsung via DM ya kak?",
      timestamp: "1 jam lalu",
      unreadCount: 1,
      status: "waiting_customer",
      phone: "",
      email: "sarah.motorcare@instagram.local",
      username: "@sarah.motorcare",
      assignedTo: "AI Agent",
      responseTimeSeconds: 22,
      tags: ["DM Conversion", "Komentar IG"],
      notes: "Masuk dari komentar Instagram dan diarahkan ke DM.",
      summary:
        "Lead dari komentar IG sudah dipindahkan ke DM. Sistem sedang menunggu detail tipe motor dari customer.",
      lastIntent: "Tanya produk",
      sentiment: "neutral",
      aiConfidence: 88,
      riskLevel: "low",
      ticketId: null,
      messages: [
        {
          id: "m10",
          sender: "customer",
          text: "Harga sparepart Vario berapa kak?",
          timestamp: "1 jam lalu",
          type: "text",
        },
        {
          id: "m11",
          sender: "ai",
          text: "Halo kak, untuk detail harga dan stok, kami bantu teruskan ke DM ya. Boleh kirim tipe motor lengkapnya?",
          timestamp: "59 menit lalu",
          status: "delivered",
          type: "text",
        },
      ],
    },
    {
      id: "conv-5",
      customerId: "cust-5",
      name: "Dewi Lestari",
      channel: "Website Chat",
      lastMessage: "Saya pilih jam 10.30 ya.",
      timestamp: "Hari ini",
      unreadCount: 0,
      status: "ai_paused",
      phone: "+62 851-1002-2003",
      email: "dewi.lestari@outlook.com",
      assignedTo: "Bagas",
      responseTimeSeconds: 35,
      tags: ["Booking", "Reminder"],
      notes: "Sudah pilih slot booking, menunggu konfirmasi final admin.",
      summary:
        "Customer ingin booking tune-up. Admin sedang menindaklanjuti slot yang sudah dipilih sehingga AI dipause sementara.",
      lastIntent: "Booking",
      sentiment: "positive",
      aiConfidence: 74,
      riskLevel: "medium",
      ticketId: "ticket-2",
      messages: [
        {
          id: "m12",
          sender: "customer",
          text: "Saya ingin booking tune-up untuk besok.",
          timestamp: "Hari ini 08:40",
          type: "text",
        },
        {
          id: "m13",
          sender: "admin",
          text: "Siap, tersedia slot 10.30 atau 13.00. Pilih yang mana ya?",
          timestamp: "Hari ini 08:42",
          status: "read",
          type: "text",
        },
        {
          id: "m14",
          sender: "customer",
          text: "Saya pilih jam 10.30 ya.",
          timestamp: "Hari ini 08:44",
          type: "text",
        },
      ],
    },
    {
      id: "conv-6",
      customerId: "cust-6",
      name: "Komentar Spam IG",
      channel: "Instagram Comment",
      lastMessage: "JUDOL GACOR LINK DI BIO",
      timestamp: "12 menit lalu",
      unreadCount: 0,
      status: "spam",
      email: "not-applicable",
      username: "@akun.spam",
      assignedTo: "Moderation Engine",
      responseTimeSeconds: 3,
      tags: ["Spam", "Moderation"],
      notes: "Komentar otomatis di-hide oleh guardrail.",
      summary:
        "Komentar publik terdeteksi spam dan tidak diteruskan ke inbox aktif.",
      lastIntent: "Spam",
      sentiment: "negative",
      aiConfidence: 99,
      riskLevel: "high",
      ticketId: null,
      messages: [
        {
          id: "m15",
          sender: "customer",
          text: "JUDOL GACOR LINK DI BIO",
          timestamp: "12 menit lalu",
          type: "comment",
        },
        {
          id: "m16",
          sender: "system",
          text: "Komentar di-hide dan masuk spam log.",
          timestamp: "12 menit lalu",
          type: "system",
        },
      ],
    },
  ],
  customers: [
    {
      id: "cust-1",
      name: "Jefri Pratama",
      channel: "WhatsApp",
      leadStatus: "Interested",
      tags: ["Servis berkala", "Pelanggan baru"],
      lastContact: "10 menit lalu",
      assignedTo: "AI Agent",
      totalConversation: 12,
      revenueHint: "Rp420.000",
      note: "Minat booking servis Sabtu pagi jika estimasi harga sesuai.",
      phone: "+62 812-3456-7890",
      email: "jefri.pratama@gmail.com",
      username: "@jefripratama",
      segment: "Warm lead",
      activeTicketCount: 0,
    },
    {
      id: "cust-2",
      name: "Siti Rahma",
      channel: "Website Chat",
      leadStatus: "Complaint",
      tags: ["Refund", "Prioritas tinggi"],
      lastContact: "25 menit lalu",
      assignedTo: "Nadia",
      totalConversation: 8,
      revenueHint: "At risk",
      note: "Kasus refund order. Tidak boleh diproses otomatis.",
      phone: "-",
      email: "siti.rahma99@outlook.com",
      segment: "High risk",
      activeTicketCount: 1,
    },
    {
      id: "cust-3",
      name: "Andi Wijaya",
      channel: "WhatsApp",
      leadStatus: "Paid",
      tags: ["VIP", "Repeat order"],
      lastContact: "Kemarin",
      assignedTo: "Rian",
      totalConversation: 28,
      revenueHint: "Rp2.450.000",
      note: "Sering beli oli dan sparepart dalam jumlah besar.",
      phone: "+62 899-7766-5544",
      email: "andi.wijaya@yahoo.com",
      username: "@andiwijaya",
      segment: "VIP",
      activeTicketCount: 0,
    },
    {
      id: "cust-4",
      name: "Sarah Motorcare",
      channel: "Instagram DM",
      leadStatus: "Asked Price",
      tags: ["DM conversion", "Komentar IG"],
      lastContact: "1 jam lalu",
      assignedTo: "AI Agent",
      totalConversation: 5,
      revenueHint: "Rp0",
      note: "Masuk dari komentar Instagram dan diarahkan ke DM.",
      phone: "",
      email: "sarah.motorcare@instagram.local",
      username: "@sarah.motorcare",
      segment: "Social lead",
      activeTicketCount: 0,
    },
    {
      id: "cust-5",
      name: "Dewi Lestari",
      channel: "Website Chat",
      leadStatus: "Booking",
      tags: ["Booking", "Reminder"],
      lastContact: "Hari ini",
      assignedTo: "Bagas",
      totalConversation: 14,
      revenueHint: "Rp780.000",
      note: "Sudah pilih slot booking, menunggu konfirmasi final admin.",
      phone: "+62 851-1002-2003",
      email: "dewi.lestari@outlook.com",
      segment: "Booking lead",
      activeTicketCount: 1,
    },
    {
      id: "cust-6",
      name: "Komentar Spam IG",
      channel: "Instagram Comment",
      leadStatus: "Spam",
      tags: ["Spam", "Moderation"],
      lastContact: "12 menit lalu",
      assignedTo: "Moderation Engine",
      totalConversation: 1,
      revenueHint: "-",
      note: "Komentar spam di-hide otomatis dan tidak perlu follow-up.",
      username: "@akun.spam",
      segment: "Filtered",
      activeTicketCount: 0,
    },
  ],
  bookings: [
    {
      id: "booking-1",
      customerId: "cust-1",
      customer: "Jefri Pratama",
      service: "Servis berkala Honda Vario",
      date: "Sabtu, 14 Juni",
      slot: "09:00",
      channel: "WhatsApp",
      status: "Confirmed",
      technician: "Bagas",
      branch: "Workshop Pusat",
      note: "Konfirmasi servis berkala dan cek rem.",
    },
    {
      id: "booking-2",
      customerId: "cust-5",
      customer: "Dewi Lestari",
      service: "Tune-up + cek CVT",
      date: "Sabtu, 14 Juni",
      slot: "10:30",
      channel: "Website Chat",
      status: "Waiting Payment",
      technician: "Rian",
      branch: "Workshop Pusat",
      note: "Menunggu DP sebelum final confirmation.",
    },
    {
      id: "booking-3",
      customerId: "cust-4",
      customer: "Sarah Motorcare",
      service: "Konsultasi sparepart",
      date: "Sabtu, 14 Juni",
      slot: "13:00",
      channel: "Instagram DM",
      status: "Pending Confirmation",
      technician: "AI Agent",
      branch: "Online",
      note: "Lead baru dari DM Instagram perlu konfirmasi admin.",
    },
    {
      id: "booking-4",
      customerId: "cust-3",
      customer: "Andi Wijaya",
      service: "Pembelian oli + filter",
      date: "Minggu, 15 Juni",
      slot: "08:30",
      channel: "WhatsApp",
      status: "Done",
      technician: "Gudang",
      branch: "Workshop Pusat",
      note: "Order repeat selesai diproses.",
    },
  ],
  tickets: [
    {
      id: "ticket-1",
      conversationId: "conv-2",
      customerId: "cust-2",
      customerName: "Siti Rahma",
      channel: "Website Chat",
      issueType: "Refund & complaint",
      priority: "high",
      status: "in_progress",
      assignedTo: "Nadia",
      summary: "Customer minta refund order #1084 dan perlu respon admin segera.",
      createdAt: "Hari ini 09:43",
      updatedAt: "Hari ini 09:45",
      resolutionNote: "",
    },
    {
      id: "ticket-2",
      conversationId: "conv-5",
      customerId: "cust-5",
      customerName: "Dewi Lestari",
      channel: "Website Chat",
      issueType: "Booking handoff",
      priority: "medium",
      status: "open",
      assignedTo: "Bagas",
      summary: "Booking tune-up butuh verifikasi slot dan konfirmasi pembayaran.",
      createdAt: "Hari ini 08:42",
      updatedAt: "Hari ini 08:44",
      resolutionNote: "",
    },
    {
      id: "ticket-3",
      conversationId: "conv-4",
      customerId: "cust-4",
      customerName: "Sarah Motorcare",
      channel: "Instagram DM",
      issueType: "Stock check",
      priority: "low",
      status: "resolved",
      assignedTo: "AI Agent",
      summary: "Lead dari komentar IG diarahkan ke DM untuk cek stok V-belt Vario 125.",
      createdAt: "1 jam lalu",
      updatedAt: "45 menit lalu",
      resolutionNote: "Menunggu customer kirim tipe motor lengkap.",
    },
  ],
  products: [
    {
      id: "prod-1",
      name: "V-Belt Vario 125",
      sku: "VB-VARIO125-01",
      category: "Sparepart",
      brand: "Honda Genuine Parts",
      price: "Rp185.000",
      stock: "12 pcs",
      compatibility: "Honda Vario 125 LED / CBS",
      description: "V-belt original untuk Vario 125 dengan stok gudang utama.",
      status: "active",
      source: "postgresql",
      updatedAt: "Hari ini 08:00",
    },
    {
      id: "prod-2",
      name: "Oli Castrol Power 1",
      sku: "OIL-CSTRL-P1",
      category: "Oli",
      brand: "Castrol",
      price: "Rp74.000",
      stock: "45 botol",
      compatibility: "Motor matic dan bebek 4T",
      description: "Produk repeat order paling sering dipakai untuk servis berkala.",
      status: "active",
      source: "google_sheets",
      updatedAt: "Hari ini 07:30",
    },
    {
      id: "prod-3",
      name: "Kampas Rem Beat",
      sku: "BRK-BEAT-09",
      category: "Sparepart",
      brand: "Aftermarket",
      price: "Rp55.000",
      stock: "0 pcs",
      compatibility: "Honda Beat FI",
      description: "Stok habis dan perlu restock minggu ini.",
      status: "out_of_stock",
      source: "postgresql",
      updatedAt: "Kemarin",
    },
  ],
  services: [
    {
      id: "svc-1",
      name: "Service CVT",
      category: "Jasa Servis",
      priceStart: "Rp120.000",
      priceEnd: "Rp280.000",
      duration: "45-90 menit",
      description: "Pembersihan CVT, cek roller, kampas ganda, dan belt.",
      status: "active",
      source: "postgresql",
      updatedAt: "Hari ini 07:00",
    },
    {
      id: "svc-2",
      name: "Servis Berkala",
      category: "Paket Layanan",
      priceStart: "Rp95.000",
      priceEnd: "Rp180.000",
      duration: "30-60 menit",
      description: "Ganti oli, cek rem, cek busi, dan inspeksi ringan.",
      status: "active",
      source: "google_sheets",
      updatedAt: "Hari ini 07:10",
    },
    {
      id: "svc-3",
      name: "Tune-Up Injeksi",
      category: "Jasa Servis",
      priceStart: "Rp180.000",
      priceEnd: "Rp320.000",
      duration: "60-120 menit",
      description: "Pembersihan throttle body, injektor, dan penyesuaian idle.",
      status: "draft",
      source: "google_sheets",
      updatedAt: "Kemarin",
    },
  ],
  broadcasts: [
    {
      id: "broadcast-1",
      name: "Promo Servis Mingguan",
      channel: "WhatsApp",
      audience: "Lead warm + repeat order",
      template:
        "Halo kak, minggu ini ada promo servis berkala + cek CVT. Mau saya bantu booking slot?",
      status: "scheduled",
      scheduledAt: "Besok 09:00",
      sentCount: 0,
    },
    {
      id: "broadcast-2",
      name: "Follow-up Sparepart IG",
      channel: "Instagram DM",
      audience: "Lead dari komentar IG 14 hari terakhir",
      template:
        "Halo kak, stok sparepart yang kemarin sempat ditanyakan sudah ready. Mau saya kirim detail harga?",
      status: "draft",
      scheduledAt: "Belum dijadwalkan",
      sentCount: 0,
    },
    {
      id: "broadcast-3",
      name: "Reminder Booking Web",
      channel: "Website Chat",
      audience: "Booking pending confirmation",
      template:
        "Reminder booking Anda besok. Jika perlu ubah jadwal, balas chat ini ya.",
      status: "sent",
      scheduledAt: "Hari ini 08:00",
      sentCount: 24,
    },
  ],
  lastUpdatedAt: new Date().toISOString(),
};

function cloneDefaultData() {
  return JSON.parse(
    JSON.stringify(defaultDashboardOperations),
  ) as DashboardOperationsData;
}

function normalizeDashboardOperations(raw: unknown): DashboardOperationsData {
  const fallback = cloneDefaultData();

  if (!raw || typeof raw !== "object") {
    return fallback;
  }

  const source = raw as Partial<DashboardOperationsData> & {
    conversations?: Array<Partial<ConversationRecord>>;
    customers?: Array<Partial<CustomerRecord>>;
  };

  return {
    conversations: Array.isArray(source.conversations)
      ? source.conversations.map((conversation, index) => {
          const defaultConversation =
            fallback.conversations[index] ?? fallback.conversations[0];

          return {
            ...defaultConversation,
            ...conversation,
            channel: normalizeChannel(conversation.channel),
            status: normalizeConversationStatus(conversation.status),
            messages: Array.isArray(conversation.messages)
              ? conversation.messages.map((message, messageIndex) => ({
                  ...(defaultConversation.messages[messageIndex] ??
                    defaultConversation.messages[0]),
                  ...message,
                  sender: normalizeSender(message.sender),
                }))
              : defaultConversation.messages,
          };
        })
      : fallback.conversations,
    customers: Array.isArray(source.customers)
      ? source.customers.map((customer, index) => {
          const defaultCustomer = fallback.customers[index] ?? fallback.customers[0];

          return {
            ...defaultCustomer,
            ...customer,
            channel: normalizeChannel(customer.channel),
            leadStatus: normalizeLeadStatus(customer.leadStatus),
          };
        })
      : fallback.customers,
    bookings: Array.isArray(source.bookings)
      ? source.bookings.map((booking, index) => ({
          ...(fallback.bookings[index] ?? fallback.bookings[0]),
          ...booking,
          channel: normalizeChannel(booking.channel),
        }))
      : fallback.bookings,
    tickets: Array.isArray(source.tickets) ? source.tickets : fallback.tickets,
    products: Array.isArray(source.products) ? source.products : fallback.products,
    services: Array.isArray(source.services) ? source.services : fallback.services,
    broadcasts: Array.isArray(source.broadcasts)
      ? source.broadcasts
      : fallback.broadcasts,
    lastUpdatedAt:
      typeof source.lastUpdatedAt === "string"
        ? source.lastUpdatedAt
        : fallback.lastUpdatedAt,
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
