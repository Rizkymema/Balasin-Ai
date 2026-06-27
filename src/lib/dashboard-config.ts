import type { DashboardConfig } from "@/types/dashboard-config";

const STORAGE_KEY = "balesin_dashboard_config";
const STORAGE_EVENT = "balesin-dashboard-config-change";

const defaultAutomationAiConfig = {
  aiMessageThreshold: 10,
  listenTimeSeconds: 2,
  handoverEnabled: true,
  handoverTargetType: "Specific team",
  handoverTarget: "Admin Desk",
  handoverMessage:
    "Baik, percakapan ini saya teruskan ke admin agar bisa dibantu lebih lanjut.",
} as const;

const defaultAutomationIdleAction = {
  enabled: true,
  idleTimeout: 48,
  idleTimeoutUnit: "hours",
  triggerTarget: "Customer inactive",
  actionType: "Send reminder message",
  idleMessage:
    "Halo kak, apakah masih membutuhkan bantuan? Jika tidak ada balasan, percakapan ini akan kami tutup otomatis.",
  autoClose: true,
} as const;

const defaultAutomationApiIntegrations: DashboardConfig["automation"]["apiIntegrations"] =
  [];

const defaultAutomationCrmIntegration = {
  enabled: false,
  provider: "Internal CRM",
  syncTrigger: "When lead intent is detected",
  contactMapping: [
    { customerField: "Customer Name", crmField: "CRM Contact Name" },
    { customerField: "Customer Phone", crmField: "CRM Phone Number" },
    { customerField: "Customer Email", crmField: "CRM Email" },
  ],
  duplicateHandling: "Update existing contact",
} as const;

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
    mobilechat: {
      enabled: false,
      status: "draft",
      widgetName: "Mobile App Widget Utama",
      platform: "react-native",
      widgetColor: "#00d2ff",
      welcomeText: "Halo Kak! Ada yang bisa kami bantu?",
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
    aiConfig: {
      ...defaultAutomationAiConfig,
    },
    idleAction: {
      ...defaultAutomationIdleAction,
    },
    apiIntegrations: defaultAutomationApiIntegrations.map((item) => ({ ...item })),
    crmIntegration: {
      ...defaultAutomationCrmIntegration,
      contactMapping: defaultAutomationCrmIntegration.contactMapping.map((item) => ({
        ...item,
      })),
    },
    rules: [],
    conversations: [],
    aiAgents: [],
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
      mobilechat: { ...base.channels.mobilechat, ...incoming.channels?.mobilechat },
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
      aiConfig: {
        ...base.automation.aiConfig,
        ...incoming.automation?.aiConfig,
      },
      idleAction: {
        ...base.automation.idleAction,
        ...incoming.automation?.idleAction,
      },
      apiIntegrations:
        incoming.automation?.apiIntegrations ?? base.automation.apiIntegrations,
      crmIntegration: {
        ...base.automation.crmIntegration,
        ...incoming.automation?.crmIntegration,
        contactMapping:
          incoming.automation?.crmIntegration?.contactMapping ??
          base.automation.crmIntegration.contactMapping,
      },
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
