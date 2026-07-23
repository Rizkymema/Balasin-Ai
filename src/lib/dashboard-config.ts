import type { DashboardConfig } from "@/types/dashboard-config";
import { normalizeSecretLikeValue } from "@/lib/normalize-secret-like-value";

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

function normalizeSingleApiIntegration(
  integrations?: DashboardConfig["automation"]["apiIntegrations"],
) {
  return Array.isArray(integrations)
    ? integrations
        .filter((integration): integration is DashboardConfig["automation"]["apiIntegrations"][number] =>
          Boolean(integration && typeof integration === "object"),
        )
        .slice(0, 1)
    : [];
}

const defaultInboxSettings = {
  templates: [],
  autoResponders: [],
  officeHours: {
    enabled: false,
    timezone: "Asia/Jakarta",
    days: [
      { day: "Monday", enabled: true, startTime: "08:00", endTime: "17:00" },
      { day: "Tuesday", enabled: true, startTime: "08:00", endTime: "17:00" },
      { day: "Wednesday", enabled: true, startTime: "08:00", endTime: "17:00" },
      { day: "Thursday", enabled: true, startTime: "08:00", endTime: "17:00" },
      { day: "Friday", enabled: true, startTime: "08:00", endTime: "17:00" },
      { day: "Saturday", enabled: true, startTime: "09:00", endTime: "15:00" },
      { day: "Sunday", enabled: false, startTime: "00:00", endTime: "00:00" },
    ],
    outsideMessage: "Mohon maaf kak, kami sedang di luar jam operasional. Kami akan membalas saat buka kembali.",
  },
  tags: [],
  customerIdle: {
    enabled: false,
    duration: 24,
    unit: "hours",
    reminderEnabled: false,
    reminderDelay: 1,
    reminderUnit: "hours",
    reminderMsg: "Halo kak, apakah masih membutuhkan bantuan?",
    autoResolve: false,
    resolveStatus: "Resolved",
    addTag: "Idle",
  }
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
    onboarded: false,
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
    sentimentCorrections: [],
    pendingQuestions: [],
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
      businessLabel: "Johan Garage WA",
      phoneNumberId: "",
      accessToken: "",
      verifyToken: "verify123",
      webhookUrl: "",
      autoReply: true,
      autoReplyGroups: false,
      qrSessions: [],
    },
    instagram: {
      enabled: false,
      status: "draft",
      username: "namaakun",
      accountId: "17841400000000000",
      pageId: "1029384756",
      accessToken: "",
      verifyToken: "verify123",
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
    apiIntegrations: normalizeSingleApiIntegration(defaultAutomationApiIntegrations),
    crmIntegration: {
      ...defaultAutomationCrmIntegration,
      contactMapping: defaultAutomationCrmIntegration.contactMapping.map((item) => ({
        ...item,
      })),
    },
    rules: [],
    conversations: [],
    aiAgents: [],
    inboxSettings: {
      ...defaultInboxSettings,
      templates: [...defaultInboxSettings.templates],
      autoResponders: [...defaultInboxSettings.autoResponders],
      tags: [...defaultInboxSettings.tags],
      officeHours: {
        ...defaultInboxSettings.officeHours,
        days: defaultInboxSettings.officeHours.days.map(d => ({ ...d }))
      },
      customerIdle: { ...defaultInboxSettings.customerIdle }
    }
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
      workerSecret: normalizeSecretLikeValue(
        incoming.runtime?.workerSecret ?? base.runtime.workerSecret,
      ),
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
      sentimentCorrections:
        incoming.knowledgeBase?.sentimentCorrections ??
        base.knowledgeBase.sentimentCorrections ?? [],
      pendingQuestions:
        incoming.knowledgeBase?.pendingQuestions ??
        base.knowledgeBase.pendingQuestions ?? [],
    },
    channels: {
      webchat: { ...base.channels.webchat, ...incoming.channels?.webchat },
      mobilechat: { ...base.channels.mobilechat, ...incoming.channels?.mobilechat },
      whatsapp: { 
        ...base.channels.whatsapp, 
        ...incoming.channels?.whatsapp,
        qrSessions:
          incoming.channels?.whatsapp?.qrSessions ??
          base.channels.whatsapp.qrSessions ??
          [],
        accessToken: normalizeSecretLikeValue(
          incoming.channels?.whatsapp?.accessToken ??
            base.channels.whatsapp.accessToken,
        ),
        verifyToken: normalizeSecretLikeValue(
          incoming.channels?.whatsapp?.verifyToken ??
            base.channels.whatsapp.verifyToken,
        ),
        accounts:
          (incoming.channels?.whatsapp?.accounts ?? base.channels.whatsapp.accounts ?? [])
            .map((account) => ({
              ...account,
              accessToken: normalizeSecretLikeValue(account.accessToken),
              verifyToken: normalizeSecretLikeValue(account.verifyToken),
            })),
      },
      instagram: { 
        ...base.channels.instagram, 
        ...incoming.channels?.instagram,
        accessToken: normalizeSecretLikeValue(
          incoming.channels?.instagram?.accessToken ??
            base.channels.instagram.accessToken,
        ),
        verifyToken: normalizeSecretLikeValue(
          incoming.channels?.instagram?.verifyToken ??
            base.channels.instagram.verifyToken,
        ),
        accounts:
          (incoming.channels?.instagram?.accounts ?? base.channels.instagram.accounts ?? [])
            .map((account) => ({
              ...account,
              accessToken: normalizeSecretLikeValue(account.accessToken),
              verifyToken: normalizeSecretLikeValue(account.verifyToken),
            })),
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
      apiIntegrations: normalizeSingleApiIntegration(
        incoming.automation?.apiIntegrations ?? base.automation.apiIntegrations,
      ),
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
      inboxSettings: incoming.automation?.inboxSettings ? {
        ...base.automation.inboxSettings,
        ...incoming.automation.inboxSettings,
        templates: incoming.automation.inboxSettings.templates ?? base.automation.inboxSettings.templates,
        autoResponders: incoming.automation.inboxSettings.autoResponders ?? base.automation.inboxSettings.autoResponders,
        tags: incoming.automation.inboxSettings.tags ?? base.automation.inboxSettings.tags,
        officeHours: {
          ...base.automation.inboxSettings.officeHours,
          ...(incoming.automation.inboxSettings.officeHours ?? {}),
          days: incoming.automation.inboxSettings.officeHours?.days ?? base.automation.inboxSettings.officeHours.days,
        },
        customerIdle: {
          ...base.automation.inboxSettings.customerIdle,
          ...(incoming.automation.inboxSettings.customerIdle ?? {}),
        },
      } : base.automation.inboxSettings,
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
