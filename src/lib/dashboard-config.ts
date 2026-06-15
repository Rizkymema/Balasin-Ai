import type { DashboardConfig } from "@/types/dashboard-config";

const STORAGE_KEY = "balesin_dashboard_config";
const STORAGE_EVENT = "balesin-dashboard-config-change";

export const defaultDashboardConfig: DashboardConfig = {
  workspace: {
    name: "Balesin Workspace",
    industry: "Bengkel Motor",
    description:
      "AI customer service omnichannel untuk membalas chat, menerima booking, dan menjaga handoff tetap aman.",
    address: "Jl. Sudirman No. 42, Jakarta Pusat",
    businessHours: "Senin - Minggu, 09.00 - 21.00 WIB",
    timezone: "Asia/Jakarta",
    language: "id",
    supportEmail: "admin@balesin.ai",
  },
  aiAgent: {
    name: "Balesin Bot",
    language: "id",
    tone: "casual",
    confidenceThreshold: 80,
    fallbackMessage:
      "Maaf, saya kurang memahami pertanyaan Anda. Saya akan meneruskan chat ini ke admin manusia ya.",
    blacklist: ["kompetitor", "kata kasar", "refund ilegal"],
    autoReplyEnabled: true,
    safetyMode: "balanced",
  },
  runtime: {
    publicAppUrl: "",
    workerSecret: "dashboard-worker-secret-change-me",
  },
  aiProvider: {
    enabled: false,
    provider: "demo",
    apiKey: "",
    model: "gpt-4.1-mini",
    embeddingModel: "text-embedding-3-small",
    baseUrl: "",
    vectorStore: "none",
  },
  knowledgeBase: {
    faqs: [
      {
        id: "faq-1",
        question: "Apakah bisa kirim ke luar kota/daerah?",
        answer:
          "Ya, kami melayani pengiriman ke seluruh Indonesia menggunakan jasa kurir JNE, J&T, dan Sicepat.",
      },
      {
        id: "faq-2",
        question: "Berapa lama proses pengerjaan/pengiriman?",
        answer:
          "Untuk produk ready stock dikirim di hari yang sama. Untuk pre-order memerlukan waktu 2-3 hari kerja.",
      },
    ],
    documents: [
      {
        id: "doc-1",
        name: "SOP_Pelayanan_Toko.pdf",
        size: "1.2 MB",
        status: "ready",
        progress: 100,
      },
      {
        id: "doc-2",
        name: "Price_List_Produk_2026.docx",
        size: "850 KB",
        status: "ready",
        progress: 100,
      },
    ],
    websiteUrls: ["https://example.com/faq", "https://example.com/pricing"],
  },
  channels: {
    webchat: {
      enabled: true,
      status: "connected",
      widgetColor: "#06b6d4",
      welcomeText: "Halo! Ada yang bisa kami bantu?",
      captureLead: true,
      handoffToWhatsApp: false,
    },
    whatsapp: {
      enabled: false,
      status: "disconnected",
      businessLabel: "WhatsApp Resmi Toko",
      phoneNumberId: "",
      accessToken: "",
      verifyToken: "balesin_secure_verification_token",
      webhookUrl: "https://api.balesin.ai/webhooks/whatsapp",
      autoReply: true,
    },
    instagram: {
      enabled: false,
      status: "draft",
      username: "@balesin.demo",
      accountId: "",
      accessToken: "",
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
    rules: [
      {
        id: "rule-1",
        name: "Human handoff untuk confidence rendah",
        trigger: "Confidence AI di bawah threshold",
        action: "Tahan auto reply dan assign ke admin",
        channel: "all",
        isActive: true,
        risk: "high",
      },
      {
        id: "rule-2",
        name: "Comment guard Instagram",
        trigger: "Keyword spam, judol, atau kasar",
        action: "Hide komentar dan kirim ke review queue",
        channel: "instagram",
        isActive: true,
        risk: "high",
      },
      {
        id: "rule-3",
        name: "Follow-up lead otomatis",
        trigger: "Customer diam lebih dari 24 jam",
        action: "Kirim follow-up ringan dan tawarkan booking",
        channel: "whatsapp",
        isActive: true,
        risk: "medium",
      },
      {
        id: "rule-4",
        name: "Reminder booking H-2 jam",
        trigger: "Mendekati jadwal kedatangan",
        action: "Kirim pengingat waktu dan lokasi",
        channel: "all",
        isActive: true,
        risk: "low",
      },
    ],
  },
  team: {
    members: [
      {
        id: "member-1",
        name: "Junaedi Rian",
        email: "junaedi.rian@balesin.ai",
        role: "Admin",
        status: "active",
      },
      {
        id: "member-2",
        name: "Siti Rahma",
        email: "siti.rahma@balesin.ai",
        role: "Operator",
        status: "active",
      },
    ],
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
    },
    channels: {
      webchat: { ...base.channels.webchat, ...incoming.channels?.webchat },
      whatsapp: { ...base.channels.whatsapp, ...incoming.channels?.whatsapp },
      instagram: { ...base.channels.instagram, ...incoming.channels?.instagram },
    },
    automation: {
      ...base.automation,
      ...incoming.automation,
      rules: incoming.automation?.rules ?? base.automation.rules,
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
