export type KnowledgeSourceType = "upload" | "website" | "google_sheet";

export type FAQItem = {
  id: string;
  question: string;
  answer: string;
};

export type KnowledgeDocument = {
  id: string;
  name: string;
  size: string;
  status: "ready" | "processing";
  progress: number;
  sourceType?: KnowledgeSourceType;
  sourceUrl?: string;
  syncedAt?: string;
};

export type TeamMember = {
  id: string;
  name: string;
  email: string;
  role: "Admin" | "Operator";
  status: "active" | "pending";
};

export type ChannelStatus = "draft" | "testing" | "connected" | "disconnected";

export type AutomationRule = {
  id: string;
  name: string;
  trigger: string;
  action: string;
  channel: "all" | "whatsapp" | "instagram" | "webchat";
  isActive: boolean;
  risk: "low" | "medium" | "high";
};

export type ConversationFlow = {
  id: string;
  name: string;
  channel: string;
  trigger: string;
  initialMessage: string;
  interactiveMenu: Array<{
    id: string;
    label: string;
    response: string;
  }>;
  fallbackMessage: string;
  humanAgentHandoff: {
    enabled: boolean;
    condition: string;
  };
  status: "Published" | "Draft" | "Inactive";
  botResponse: number;
  lastUpdate: string;
};

export type AIProviderKind =
  | "demo"
  | "openai"
  | "openrouter"
  | "anthropic"
  | "gemini";

export type VectorStoreKind = "none" | "pgvector" | "pinecone" | "supabase";

export type DashboardConfig = {
  workspace: {
    name: string;
    industry: string;
    description: string;
    address: string;
    businessHours: string;
    timezone: string;
    language: string;
    supportEmail: string;
  };
  aiAgent: {
    name: string;
    language: string;
    tone: string;
    confidenceThreshold: number;
    fallbackMessage: string;
    replyInstructions: string;
    replyStyleExample: string;
    greetingKeywords: string[];
    greetingTemplate: string;
    blacklist: string[];
    autoReplyEnabled: boolean;
    safetyMode: "strict" | "balanced" | "aggressive";
  };
  runtime: {
    publicAppUrl: string;
    workerSecret: string;
  };
  aiProvider: {
    enabled: boolean;
    provider: AIProviderKind;
    apiKey: string;
    model: string;
    embeddingModel: string;
    baseUrl: string;
    vectorStore: VectorStoreKind;
    maxTokens: number;
    quotaLimit: number;
  };
  knowledgeBase: {
    faqs: FAQItem[];
    documents: KnowledgeDocument[];
    websiteUrls: string[];
    googleSheetUrls: string[];
  };
  channels: {
    webchat: {
      enabled: boolean;
      status: ChannelStatus;
      widgetColor: string;
      welcomeText: string;
      captureLead: boolean;
      handoffToWhatsApp: boolean;
    };
    whatsapp: {
      enabled: boolean;
      status: ChannelStatus;
      businessLabel: string;
      phoneNumberId: string;
      accessToken: string;
      verifyToken: string;
      webhookUrl: string;
      autoReply: boolean;
      accounts?: Array<{
        id: string; // phone number ID
        businessLabel: string;
        phoneNumberId: string;
        accessToken: string;
        verifyToken: string;
        status: ChannelStatus;
        phoneNumber: string; // display phone number
      }>;
    };
    instagram: {
      enabled: boolean;
      status: ChannelStatus;
      username: string;
      accountId: string;
      accessToken: string;
      verifyToken: string;
      autoReplyDm: boolean;
      commentGuard: boolean;
      commentToDm: boolean;
      accounts?: Array<{
        id: string; // account ID
        username: string;
        accountId: string;
        accessToken: string;
        verifyToken: string;
        status: ChannelStatus;
        pageName?: string;
      }>;
    };

  };
  automation: {
    handoffThreshold: number;
    followUpDelayHours: number;
    bookingReminderHours: number;
    spamGuard: boolean;
    sentimentGuard: boolean;
    rules: AutomationRule[];
    conversations: ConversationFlow[];
  };
  team: {
    members: TeamMember[];
    notifications: {
      emailDigest: boolean;
      instantHandoff: boolean;
      weeklyReport: boolean;
    };
  };
};
