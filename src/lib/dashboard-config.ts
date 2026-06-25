import type { DashboardConfig } from "@/types/dashboard-config";

const STORAGE_KEY = "balesin_dashboard_config";
const STORAGE_EVENT = "balesin-dashboard-config-change";

export const defaultDashboardConfig: DashboardConfig = {
  workspace: {
    name: "Workspace Baru",
    industry: "",
    description: "",
    address: "",
    businessHours: "",
    timezone: "Asia/Jakarta",
    language: "id",
    supportEmail: "",
  },
  aiAgent: {
    name: "AI Assistant",
    language: "id",
    tone: "casual",
    confidenceThreshold: 80,
    fallbackMessage:
      "Maaf, saya kurang memahami pertanyaan Anda. Saya akan meneruskan chat ini ke admin manusia ya.",
    replyInstructions:
      "Jawab singkat, jelas, ramah, dan hanya berdasarkan data bisnis yang tersedia di dashboard.",
    replyStyleExample: "",
    greetingKeywords: [],
    greetingTemplate:
      "Halo, selamat datang di {businessName}. Ada yang bisa kami bantu? Anda bisa tanya alamat, jam buka, booking, atau layanan yang dibutuhkan ya.",
    blacklist: [],
    autoReplyEnabled: true,
    safetyMode: "balanced",
  },
  runtime: {
    publicAppUrl: "",
    workerSecret: "",
  },
  aiProvider: {
    enabled: false,
    provider: "openai",
    apiKey: "",
    model: "gpt-4.1-mini",
    embeddingModel: "text-embedding-3-small",
    baseUrl: "",
    vectorStore: "none",
    maxTokens: 2000,
    quotaLimit: 999999999,
  },
  knowledgeBase: {
    faqs: [],
    documents: [],
    websiteUrls: [],
    googleSheetUrls: [],
  },
  channels: {
    webchat: {
      enabled: false,
      status: "draft",
      widgetColor: "#06b6d4",
      welcomeText: "Halo! Ada yang bisa kami bantu?",
      captureLead: true,
      handoffToWhatsApp: false,
    },
    whatsapp: {
      enabled: false,
      status: "disconnected",
      businessLabel: "",
      phoneNumberId: "",
      accessToken: "",
      verifyToken: "",
      webhookUrl: "",
      autoReply: true,
    },
    instagram: {
      enabled: false,
      status: "draft",
      username: "",
      accountId: "",
      accessToken: "",
      verifyToken: "",
      autoReplyDm: true,
      commentGuard: true,
      commentToDm: true,
    },
  },
  automation: {
    handoffThreshold: 80,
    followUpDelayHours: 24,
    bookingReminderHours: 2,
    spamGuard: true,
    sentimentGuard: true,
    rules: [],
    conversations: [
      {
        id: "conv_001",
        name: "Greeting Johan Garage",
        botResponse: 1245,
        channel: "WhatsApp - Johan Garage",
        trigger: "Pesan Pertama Masuk",
        initialMessage: "Halo! Selamat datang di Johan Garage. Ada yang bisa kami bantu?",
        interactiveMenu: [
          { id: "btn_1", label: "Cek Servis", response: "Silakan pilih jenis servis yang dibutuhkan: servis ringan, servis lengkap, atau pengecekan motor." },
          { id: "btn_2", label: "Tanya Harga", response: "Untuk info harga, silakan sebutkan produk atau layanan yang ingin ditanyakan." },
          { id: "btn_3", label: "Booking Service", response: "Silakan kirim nama, jenis motor, tanggal booking, dan keluhan motor." },
          { id: "btn_4", label: "Bicara dengan Admin", response: "Baik kak, percakapan akan kami teruskan ke admin." }
        ],
        fallbackMessage: "Maaf kak, saya belum memahami pertanyaannya. Silakan pilih menu yang tersedia atau hubungi admin.",
        humanAgentHandoff: {
          enabled: true,
          condition: "Saat pelanggan memilih Bicara dengan Admin"
        },
        lastUpdate: "25 Jun 2026, 14:30",
        status: "Published",
      },
      {
        id: "conv_002",
        name: "Chatbot Jam Kerja",
        botResponse: 890,
        channel: "WhatsApp - Johan Garage",
        trigger: "Di luar jam kerja",
        initialMessage: "Halo! Saat ini kami sedang di luar jam operasional. Pesan Anda akan kami balas secepatnya saat jam buka.",
        interactiveMenu: [],
        fallbackMessage: "Tinggalkan pesan Anda.",
        humanAgentHandoff: { enabled: false, condition: "" },
        lastUpdate: "24 Jun 2026, 09:15",
        status: "Published",
      },
      {
        id: "conv_003",
        name: "FAQ Servis Motor",
        botResponse: 320,
        channel: "Instagram DM",
        trigger: "Keyword tertentu",
        initialMessage: "Halo, ada pertanyaan seputar servis?",
        interactiveMenu: [],
        fallbackMessage: "Tinggalkan pertanyaan Anda.",
        humanAgentHandoff: { enabled: false, condition: "" },
        lastUpdate: "23 Jun 2026, 18:40",
        status: "Draft",
      },
      {
        id: "conv_004",
        name: "Booking Service Bot",
        botResponse: 0,
        channel: "Website Chat Widget",
        trigger: "Pesan pertama masuk",
        initialMessage: "Hai! Mau booking service?",
        interactiveMenu: [],
        fallbackMessage: "Pilih menu untuk melanjutkan.",
        humanAgentHandoff: { enabled: false, condition: "" },
        lastUpdate: "22 Jun 2026, 11:05",
        status: "Inactive",
      },
    ],
    aiAgents: [
      {
        id: "agent_001",
        name: "Johan Garage Assistant",
        description: "Asisten AI untuk layanan servis, booking, harga, dan sparepart.",
        prompt: "Kamu adalah asisten virtual Johan Garage. Tugasmu membantu pelanggan dengan jawaban singkat, jelas, ramah, dan profesional. Jawab hanya berdasarkan informasi bisnis yang tersedia di training sources. Jangan mengarang harga, stok, promo, atau jadwal jika datanya tidak tersedia. Jika pertanyaan pelanggan terlalu kompleks atau membutuhkan keputusan manusia, teruskan ke admin.",
        toneOfVoice: "Ramah",
        trainingSources: [
          { id: "ts_001", name: "FAQ Layanan Servis.pdf", type: "PDF", uploadedAt: "25 Jun 2026, 10:00", status: "Indexed" },
          { id: "ts_002", name: "Daftar Harga Sparepart.xlsx", type: "XLSX", uploadedAt: "25 Jun 2026, 10:05", status: "Indexed" },
          { id: "ts_003", name: "Kebijakan Booking.txt", type: "TXT", uploadedAt: "25 Jun 2026, 10:10", status: "Indexed" },
        ],
        allowedActions: {
          replyMessage: true,
          createLead: false,
          createBooking: true,
          updateTicket: false,
          sendToApi: false,
          handoverToHuman: true,
        },
        handover: {
          enabled: true,
          assignTeam: "Customer Service",
          fallbackMessage: "Baik kak, saya teruskan ke admin Johan Garage agar bisa dibantu lebih lanjut.",
        },
        responseMode: "Answer + Handover if Needed",
        channelUsage: "WhatsApp - Johan Garage",
        lastUpdate: "25 Jun 2026, 15:20",
        status: "Active",
      },
      {
        id: "agent_002",
        name: "Sparepart Advisor",
        description: "AI untuk menjawab pertanyaan seputar produk dan stok sparepart.",
        prompt: "Kamu adalah asisten sparepart Johan Garage. Bantu pelanggan menemukan informasi produk, stok, dan harga sparepart yang tersedia.",
        toneOfVoice: "Profesional",
        trainingSources: [
          { id: "ts_004", name: "Katalog Produk.pdf", type: "PDF", uploadedAt: "24 Jun 2026, 09:00", status: "Indexed" },
          { id: "ts_005", name: "Stok Sparepart Terbaru.csv", type: "CSV", uploadedAt: "24 Jun 2026, 09:05", status: "Processing" },
        ],
        allowedActions: {
          replyMessage: true,
          createLead: true,
          createBooking: false,
          updateTicket: false,
          sendToApi: false,
          handoverToHuman: false,
        },
        handover: { enabled: false, assignTeam: "", fallbackMessage: "" },
        responseMode: "Answer Only",
        channelUsage: "Instagram DM",
        lastUpdate: "24 Jun 2026, 10:45",
        status: "Draft",
      },
      {
        id: "agent_003",
        name: "Booking Service Agent",
        description: "AI untuk membantu pelanggan membuat reservasi servis.",
        prompt: "Kamu adalah asisten booking servis. Bantu pelanggan menjadwalkan kunjungan servis motor dengan mengumpulkan informasi nama, tipe motor, jadwal, dan keluhan.",
        toneOfVoice: "Santai",
        trainingSources: [
          { id: "ts_006", name: "SOP Booking.docx", type: "DOCX", uploadedAt: "23 Jun 2026, 18:00", status: "Indexed" },
        ],
        allowedActions: {
          replyMessage: true,
          createLead: false,
          createBooking: true,
          updateTicket: false,
          sendToApi: false,
          handoverToHuman: true,
        },
        handover: { enabled: true, assignTeam: "Booking Team", fallbackMessage: "Admin kami akan segera menghubungi Anda." },
        responseMode: "Answer + Execute Action",
        channelUsage: "Not connected",
        lastUpdate: "23 Jun 2026, 18:10",
        status: "Inactive",
      },
    ],
  },
  team: {
    members: [],
    notifications: {
      emailDigest: true,
      instantHandoff: true,
      weeklyReport: false,
    },
  },
};

export function mergeDashboardConfig(
  base: DashboardConfig,
  incoming?: Partial<DashboardConfig>,
): DashboardConfig {
  if (!incoming) {
    return base;
  }

  return {
    workspace: { ...base.workspace, ...incoming.workspace },
    aiAgent: {
      ...base.aiAgent,
      ...incoming.aiAgent,
      greetingKeywords:
        incoming.aiAgent?.greetingKeywords ?? base.aiAgent.greetingKeywords,
      blacklist: incoming.aiAgent?.blacklist ?? base.aiAgent.blacklist,
    },
    runtime: {
      ...base.runtime,
      ...incoming.runtime,
    },
    aiProvider: {
      ...base.aiProvider,
      ...incoming.aiProvider,
    },
    knowledgeBase: {
      ...base.knowledgeBase,
      ...incoming.knowledgeBase,
      faqs: incoming.knowledgeBase?.faqs ?? base.knowledgeBase.faqs,
      documents:
        incoming.knowledgeBase?.documents ?? base.knowledgeBase.documents,
      websiteUrls:
        incoming.knowledgeBase?.websiteUrls ?? base.knowledgeBase.websiteUrls,
      googleSheetUrls:
        incoming.knowledgeBase?.googleSheetUrls ??
        base.knowledgeBase.googleSheetUrls,
    },
    channels: {
      webchat: { ...base.channels.webchat, ...incoming.channels?.webchat },
      whatsapp: { 
        ...base.channels.whatsapp, 
        ...incoming.channels?.whatsapp,
        accounts: incoming.channels?.whatsapp?.accounts ?? base.channels.whatsapp.accounts ?? []
      },
      instagram: { 
        ...base.channels.instagram, 
        ...incoming.channels?.instagram,
        accounts: incoming.channels?.instagram?.accounts ?? base.channels.instagram.accounts ?? []
      },
    },
    automation: {
      ...base.automation,
      ...incoming.automation,
      rules: incoming.automation?.rules ?? base.automation.rules,
      conversations: incoming.automation?.conversations ?? base.automation.conversations,
      aiAgents: incoming.automation?.aiAgents ?? base.automation.aiAgents,
    },
    team: {
      members: incoming.team?.members ?? base.team.members,
      notifications: {
        ...base.team.notifications,
        ...incoming.team?.notifications,
      },
    },
  };
}

function readLegacyBootstrap(): Partial<DashboardConfig> {
  if (typeof window === "undefined") {
    return {};
  }

  const workspaceSource = localStorage.getItem("onboarding_business");
  const faqSource = localStorage.getItem("onboarding_faqs");

  const partial: Partial<DashboardConfig> = {};

  if (workspaceSource) {
    try {
      const workspace = JSON.parse(workspaceSource) as {
        name?: string;
        industry?: string;
        description?: string;
      };

      partial.workspace = {
        ...defaultDashboardConfig.workspace,
        name: workspace.name ?? defaultDashboardConfig.workspace.name,
        industry: workspace.industry ?? defaultDashboardConfig.workspace.industry,
        description:
          workspace.description ?? defaultDashboardConfig.workspace.description,
      };
    } catch {}
  }

  if (faqSource) {
    try {
      partial.knowledgeBase = {
        ...defaultDashboardConfig.knowledgeBase,
        faqs: JSON.parse(faqSource),
      };
    } catch {}
  }

  return partial;
}

export function getDashboardConfig(): DashboardConfig {
  if (typeof window === "undefined") {
    return defaultDashboardConfig;
  }

  const raw = localStorage.getItem(STORAGE_KEY);
  const legacy = readLegacyBootstrap();

  if (!raw) {
    return mergeDashboardConfig(defaultDashboardConfig, legacy);
  }

  try {
    const parsed = JSON.parse(raw) as Partial<DashboardConfig>;
    return mergeDashboardConfig(mergeDashboardConfig(defaultDashboardConfig, legacy), parsed);
  } catch {
    return mergeDashboardConfig(defaultDashboardConfig, legacy);
  }
}

export function saveDashboardConfig(config: DashboardConfig) {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  window.dispatchEvent(new Event(STORAGE_EVENT));
}

export function updateDashboardConfig(
  updater: (current: DashboardConfig) => DashboardConfig,
) {
  const next = updater(getDashboardConfig());
  saveDashboardConfig(next);
  return next;
}

export { STORAGE_EVENT as DASHBOARD_CONFIG_EVENT };
