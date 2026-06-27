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

export type ConversationFlowTrigger =
  | "first_incoming_message"
  | "outside_office_hours"
  | "keyword_match"
  | "customer_asks_admin"
  | "booking_intent"
  | "high_risk";

export type ConversationFlow = {
  id: string;
  name: string;
  channel: string;
  trigger: string;
  normalizedTrigger?: ConversationFlowTrigger;
  triggerKeywords?: string[];
  initialMessage: string;
  interactiveMenu: Array<{
    id: string;
    label: string;
    response: string;
  }>;
  fallbackMessage: string;
  aiAgentId?: string;
  humanAgentHandoff: {
    enabled: boolean;
    condition: string;
  };
  status: "Published" | "Draft" | "Inactive";
  botResponse: number;
  lastUpdate: string;
};

export type AIAgentTrainingSource = {
  id: string;
  name: string;
  type: "PDF" | "DOCX" | "TXT" | "CSV" | "XLSX" | "Markdown" | "URL";
  uploadedAt: string;
  status: "Processing" | "Indexed" | "Failed";
};

export type AIAgent = {
  id: string;
  name: string;
  description: string;
  prompt: string;
  toneOfVoice: "Formal" | "Ramah" | "Santai" | "Profesional" | "Singkat";
  trainingSources: AIAgentTrainingSource[];
  allowedActions: {
    replyMessage: boolean;
    createLead: boolean;
    createBooking: boolean;
    updateTicket: boolean;
    sendToApi: boolean;
    handoverToHuman: boolean;
  };
  handover: {
    enabled: boolean;
    assignTeam: string;
    fallbackMessage: string;
  };
  responseMode: "Answer Only" | "Answer + Suggest Menu" | "Answer + Execute Action" | "Answer + Handover if Needed";
  channelUsage: string;
  lastUpdate: string;
  status: "Active" | "Draft" | "Inactive";
};

export type AIProviderKind =
  | "demo"
  | "openai"
  | "openrouter"
  | "anthropic"
  | "gemini";

export type VectorStoreKind = "none" | "pgvector" | "pinecone" | "supabase";

export type ApiMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export type ApiAuthType =
  | "No Auth"
  | "Bearer Token"
  | "API Key"
  | "Basic Auth"
  | "Custom Header";

export type ApiStatus = "Active" | "Draft" | "Inactive";

export type ApiTestResult =
  | "Success"
  | "Failed"
  | "Timeout"
  | "Unauthorized"
  | "Not tested";

export type ApiIntegration = {
  id: string;
  name: string;
  method: ApiMethod;
  endpoint: string;
  authType: ApiAuthType;
  authToken: string;
  headers: string;
  requestBody: string;
  responseMapping: string;
  status: ApiStatus;
  lastTest: ApiTestResult;
};

export type AutomationAiConfig = {
  aiMessageThreshold: number;
  listenTimeSeconds: number;
  handoverEnabled: boolean;
  handoverTargetType: "Any available agent" | "Specific team" | "Specific agent";
  handoverTarget: string;
  handoverMessage: string;
};

export type AutomationIdleAction = {
  enabled: boolean;
  idleTimeout: number;
  idleTimeoutUnit: "hours" | "days";
  triggerTarget:
    | "Customer inactive"
    | "Agent inactive"
    | "Both customer and agent inactive";
  actionType:
    | "Send reminder message"
    | "Mark as resolved"
    | "Close conversation"
    | "Assign to agent"
    | "Move to specific inbox"
    | "Add label"
    | "Trigger webhook";
  idleMessage: string;
  autoClose: boolean;
};

export type AutomationCrmIntegration = {
  enabled: boolean;
  provider: string;
  syncTrigger: string;
  contactMapping: Array<{
    customerField: string;
    crmField: string;
  }>;
  duplicateHandling: string;
};

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
    aiConfig: AutomationAiConfig;
    idleAction: AutomationIdleAction;
    apiIntegrations: ApiIntegration[];
    crmIntegration: AutomationCrmIntegration;
    rules: AutomationRule[];
    conversations: ConversationFlow[];
    aiAgents: AIAgent[];
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
