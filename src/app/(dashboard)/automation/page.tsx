"use client";

import { useEffect, useMemo, useState, useRef, type FormEvent } from "react";
import {
  AlertTriangle,
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  Clock3,
  Loader2,
  MessageSquareWarning,
  PlayCircle,
  Settings2,
  Sparkles,
  Workflow,
  Bot,
  Check,
  KeyRound,
  Play,
  Send,
  Shield,
  Sliders,
  Trash2,
  ChevronRight,
  GitBranch,
  PlusCircle,
  MessageSquare,
  Sparkle,
  Link2,
  Upload,
  FileText,
  Building2,
  Save,
  Plus,
  Search,
  Database,
  Globe,
  Radio,
  UserCheck,
  RefreshCw
} from "lucide-react";

import Link from "next/link";
import { useDashboardConfig } from "@/hooks/use-dashboard-config";
import type {
  AIProviderKind,
  VectorStoreKind,
  AutomationRule
} from "@/types/dashboard-config";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState } from "@/components/ui/empty-state";
import { Tabs } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type ExecutionStatus = "success" | "warning" | "danger";

interface TestMessage {
  sender: "user" | "ai";
  text: string;
  confidence?: number;
  grounded?: boolean;
}

const PROVIDER_MODELS: Record<AIProviderKind, { value: string; label: string }[]> = {
  demo: [
    { value: "balesin-demo-model", label: "Balesin Demo Model" },
  ],
  openai: [
    { value: "gpt-4o", label: "GPT-4o (Flagship / Recommended)" },
    { value: "gpt-4o-mini", label: "GPT-4o Mini (Fast & Cheap)" },
    { value: "gpt-4-turbo", label: "GPT-4 Turbo" },
    { value: "gpt-3.5-turbo", label: "GPT-3.5 Turbo" },
  ],
  gemini: [
    { value: "gemini-2.5-flash", label: "Gemini 2.5 Flash (Recommended)" },
    { value: "gemini-2.5-pro", label: "Gemini 2.5 Pro" },
    { value: "gemini-1.5-flash", label: "Gemini 1.5 Flash" },
    { value: "gemini-1.5-pro", label: "Gemini 1.5 Pro" },
  ],
  anthropic: [
    { value: "claude-3-7-sonnet-latest", label: "Claude 3.7 Sonnet (Latest)" },
    { value: "claude-3-5-sonnet-latest", label: "Claude 3.5 Sonnet" },
    { value: "claude-3-5-haiku-latest", label: "Claude 3.5 Haiku" },
    { value: "claude-3-opus-latest", label: "Claude 3 Opus" },
  ],
  openrouter: [
    { value: "google/gemini-2.5-flash", label: "Gemini 2.5 Flash (via OpenRouter)" },
    { value: "openai/gpt-4o-mini", label: "GPT-4o Mini (via OpenRouter)" },
    { value: "anthropic/claude-3.7-sonnet", label: "Claude 3.7 Sonnet (via OpenRouter)" },
    { value: "meta-llama/llama-3.3-70b-instruct", label: "Llama 3.3 70B (via OpenRouter)" },
    { value: "deepseek/deepseek-chat", label: "DeepSeek V3 (via OpenRouter)" },
    { value: "deepseek/deepseek-r1", label: "DeepSeek R1 (via OpenRouter)" },
  ],
};

export default function AutomationPage() {
  const { config, patchConfig, refreshConfig, isLoading } = useDashboardConfig();

  // Tab state
  const [activeTab, setActiveTab] = useState("conversations");

  // Sync with URL tab parameters on load (hydration safe)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get("tab");
    if (tabParam && ["conversations", "ai_agents", "knowledge_base", "settings"].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, []);

  // Shared states across components
  const [isSaved, setIsSaved] = useState(false);

  // -------------------------------------------------------------
  // TAB 1: Conversations States
  // -------------------------------------------------------------
  const [isCreatingFlow, setIsCreatingFlow] = useState(false);
  const [flowName, setFlowName] = useState("");
  const [flowTrigger, setFlowTrigger] = useState("");
  const [flowAction, setFlowAction] = useState("");

  // -------------------------------------------------------------
  // TAB 2: AI Agents States
  // -------------------------------------------------------------
  const [agentName, setAgentName] = useState("");
  const [language, setLanguage] = useState("");
  const [tone, setTone] = useState("");
  const [confidence, setConfidence] = useState(80);
  const [fallbackMsg, setFallbackMsg] = useState("");
  const [replyInstructions, setReplyInstructions] = useState("");
  const [replyStyleExample, setReplyStyleExample] = useState("");
  const [greetingKeywords, setGreetingKeywords] = useState("");
  const [greetingTemplate, setGreetingTemplate] = useState("");
  const [blacklist, setBlacklist] = useState("");
  const [autoReplyEnabled, setAutoReplyEnabled] = useState(true);
  const [safetyMode, setSafetyMode] = useState<"strict" | "balanced" | "aggressive">("balanced");

  // AI agent playground
  const [testInput, setTestInput] = useState("");
  const [testMessages, setTestMessages] = useState<TestMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);

  // -------------------------------------------------------------
  // TAB 3: Knowledge Base States
  // -------------------------------------------------------------
  const [kbSubsection, setKbSubsection] = useState("resources"); // resources | instructions
  const [unansweredQuestions, setUnansweredQuestions] = useState<string[]>([
    "Apakah Johan Garage menerima servis motor listrik?",
    "Berapa biaya ganti ban tubeless untuk motor NMax?",
    "Apakah Johan Garage buka saat libur Idul Fitri?"
  ]);

  // Methods Input Forms states
  const [inputMethodActive, setInputMethodActive] = useState<"none" | "url" | "text">("none");
  const [kbUrlInput, setKbUrlInput] = useState("");
  const [kbTextTitle, setKbTextTitle] = useState("");
  const [kbTextContent, setKbTextContent] = useState("");
  const [isSyncingKbSources, setIsSyncingKbSources] = useState(false);
  const [isIngestingText, setIsIngestingText] = useState(false);
  const [isUploadingKbFile, setIsUploadingKbFile] = useState(false);
  const [kbSearchQuery, setKbSearchQuery] = useState("");

  // Hidden File input ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Custom instructions prompt parts
  const [personaConfig, setPersonaConfig] = useState("");
  const [toneOfVoice, setToneOfVoice] = useState("");
  const [guardrails, setGuardrails] = useState("");

  // -------------------------------------------------------------
  // TAB 4: Chatbot Settings (Redesigned)
  // -------------------------------------------------------------
  const [settingsSubsection, setSettingsSubsection] = useState("ai_config"); // ai_config | idle_action | api_integration | crm_integration

  // AI Config Technical States
  const [providerEnabled, setProviderEnabled] = useState(false);
  const [provider, setProvider] = useState<AIProviderKind>("openai");
  const [apiKey, setApiKey] = useState("");
  const [model, setModel] = useState("");
  const [embeddingModel, setEmbeddingModel] = useState("");
  const [baseUrl, setBaseUrl] = useState("");
  const [vectorStore, setVectorStore] = useState<VectorStoreKind>("none");
  const [maxTokens, setMaxTokens] = useState(2000);
  const [quotaLimit, setQuotaLimit] = useState(999999999);

  // Idle Action States
  const [idleActionType, setIdleActionType] = useState<"followup" | "close" | "handoff">("followup");
  const [idleTimeoutHours, setIdleTimeoutHours] = useState(24);
  const [idleMessage, setIdleMessage] = useState("Halo Kak! Apakah ada hal lain yang bisa kami bantu? Jika tidak ada respon, sesi chat ini akan ditutup otomatis ya.");

  // API Integration States
  const [qontakApiUrl, setQontakApiUrl] = useState("https://api.qontak.com/v1/");
  const [qontakAccessToken, setQontakAccessToken] = useState("");
  const [inventoryApiUrl, setInventoryApiUrl] = useState("https://api.johangarage.local/inventory/");
  const [isQontakConnected, setIsQontakConnected] = useState(false);
  const [isInventoryConnected, setIsInventoryConnected] = useState(false);

  // CRM Integration States
  const [autoSyncToCrm, setAutoSyncToCrm] = useState(true);
  const [defaultLeadStage, setDefaultLeadStage] = useState("Interested");
  const [crmOwner, setCrmOwner] = useState("AI Assistant");

  // Rule catalog state (for Conversations lists)
  const [rules, setRules] = useState<AutomationRule[]>([]);

  // -------------------------------------------------------------
  // Sync States with incoming Config
  // -------------------------------------------------------------
  useEffect(() => {
    if (!config) return;

    // AI Agents Config sync
    setAgentName(config.aiAgent.name);
    setLanguage(config.aiAgent.language);
    setTone(config.aiAgent.tone);
    setConfidence(config.aiAgent.confidenceThreshold);
    setFallbackMsg(config.aiAgent.fallbackMessage);
    setReplyInstructions(config.aiAgent.replyInstructions);
    setReplyStyleExample(config.aiAgent.replyStyleExample);
    setGreetingKeywords(config.aiAgent.greetingKeywords.join(", "));
    setGreetingTemplate(config.aiAgent.greetingTemplate);
    setBlacklist(config.aiAgent.blacklist.join(", "));
    setAutoReplyEnabled(config.aiAgent.autoReplyEnabled);
    setSafetyMode(config.aiAgent.safetyMode);

    // AI Provider backend settings
    setProviderEnabled(config.aiProvider.enabled);
    setProvider(config.aiProvider.provider);
    setApiKey(config.aiProvider.apiKey);
    setModel(config.aiProvider.model);
    setEmbeddingModel(config.aiProvider.embeddingModel);
    setBaseUrl(config.aiProvider.baseUrl);
    setVectorStore(config.aiProvider.vectorStore);

    // Playground greeting
    setTestMessages([
      {
        sender: "ai",
        text: `Halo! Saya ${config.aiAgent.name}. Tanyakan apa saja tentang bisnis Anda untuk menguji jawaban saya.`,
      },
    ]);

    // Parse Custom instructions from replyInstructions
    const rawPrompt = config.aiAgent.replyInstructions || "";
    const personaMatch = rawPrompt.match(/\[PERSONA\]\n([\s\S]*?)(?=\n\n\[TONE\]|$)/);
    const toneMatch = rawPrompt.match(/\[TONE\]\n([\s\S]*?)(?=\n\n\[GUARDRAILS\]|$)/);
    const guardMatch = rawPrompt.match(/\[GUARDRAILS\]\n([\s\S]*?)$/);

    if (personaMatch || toneMatch || guardMatch) {
      setPersonaConfig(personaMatch ? personaMatch[1].trim() : "");
      setToneOfVoice(toneMatch ? toneMatch[1].trim() : "");
      setGuardrails(guardMatch ? guardMatch[1].trim() : "");
    } else {
      setPersonaConfig(rawPrompt);
      setToneOfVoice("");
      setGuardrails("");
    }

    // Chatbot Settings / Automation config sync
    setRules(config.automation.rules);
    setIdleTimeoutHours(config.automation.followUpDelayHours);
  }, [config]);

  // -------------------------------------------------------------
  // HANDLERS
  // -------------------------------------------------------------

  // Save Flow (Conversations)
  const handleSaveFlow = (event: FormEvent) => {
    event.preventDefault();
    if (!flowName.trim() || !flowTrigger.trim() || !flowAction.trim()) {
      return;
    }

    const newRule: AutomationRule = {
      id: "rule_" + Date.now(),
      name: flowName.trim(),
      trigger: `Pesan mengandung kata "${flowTrigger.trim()}"`,
      action: `Kirim balasan: "${flowAction.trim()}"`,
      channel: "all",
      isActive: true,
      risk: "low"
    };

    const nextRules = [newRule, ...rules];
    setRules(nextRules);

    patchConfig((current) => ({
      ...current,
      automation: {
        ...current.automation,
        rules: nextRules
      }
    }));

    setIsCreatingFlow(false);
    setFlowName("");
    setFlowTrigger("");
    setFlowAction("");

    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  const toggleRule = (id: string) => {
    const nextRules = rules.map((rule) =>
      rule.id === id ? { ...rule, isActive: !rule.isActive } : rule,
    );
    setRules(nextRules);
    patchConfig((current) => ({
      ...current,
      automation: {
        ...current.automation,
        rules: nextRules,
      },
    }));
  };

  const deleteRule = (id: string) => {
    const nextRules = rules.filter((rule) => rule.id !== id);
    setRules(nextRules);
    patchConfig((current) => ({
      ...current,
      automation: {
        ...current.automation,
        rules: nextRules,
      },
    }));
  };

  const buildDraftAgentConfig = () => ({
    ...config,
    aiAgent: {
      ...config.aiAgent,
      name: agentName,
      language,
      tone,
      confidenceThreshold: confidence,
      fallbackMessage: fallbackMsg,
      replyInstructions: replyInstructions || `${config.aiAgent.replyInstructions}`,
      replyStyleExample,
      greetingKeywords: greetingKeywords
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
      greetingTemplate,
      blacklist: blacklist
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
      autoReplyEnabled,
      safetyMode,
    },
    aiProvider: {
      enabled: providerEnabled,
      provider,
      apiKey,
      model,
      embeddingModel,
      baseUrl,
      vectorStore,
    },
  });

  const handleSaveAgent = (event: FormEvent) => {
    event.preventDefault();
    patchConfig(() => buildDraftAgentConfig());
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const handleTestSend = async (event: FormEvent) => {
    event.preventDefault();
    if (!testInput.trim()) {
      return;
    }

    const userMsg = testInput.trim();
    setTestMessages((prev) => [...prev, { sender: "user", text: userMsg }]);
    setTestInput("");
    setIsTyping(true);

    try {
      const response = await fetch("/api/ai-agent/preview", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: userMsg,
          config: buildDraftAgentConfig(),
        }),
      });

      if (!response.ok) {
        throw new Error("Preview balasan AI gagal dibuat.");
      }

      const payload = (await response.json()) as {
        ok: boolean;
        data: {
          reply?: string;
          confidence: number;
          grounded: boolean;
        };
      };

      setTestMessages((prev) => [
        ...prev,
        {
          sender: "ai",
          text: payload.data.reply ?? fallbackMsg,
          confidence: payload.data.confidence,
          grounded: payload.data.grounded,
        },
      ]);
    } catch {
      setTestMessages((prev) => [
        ...prev,
        {
          sender: "ai",
          text: fallbackMsg,
          confidence: 45,
          grounded: false,
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  // -------------------------------------------------------------
  // KNOWLEDGE BASE HANDLERS
  // -------------------------------------------------------------
  const handleSaveInstructions = (event: FormEvent) => {
    event.preventDefault();

    const assembledPrompt = `[PERSONA]\n${personaConfig.trim()}\n\n[TONE]\n${toneOfVoice.trim()}\n\n[GUARDRAILS]\n${guardrails.trim()}`;

    patchConfig((current) => ({
      ...current,
      aiAgent: {
        ...current.aiAgent,
        replyInstructions: assembledPrompt,
      },
    }));

    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  const handleSyncKbUrl = async (event: FormEvent) => {
    event.preventDefault();
    if (!kbUrlInput.trim()) return;

    setIsSyncingKbSources(true);
    const incomingUrls = kbUrlInput.split("\n").map(u => u.trim()).filter(Boolean);

    try {
      const existingUrls = config.knowledgeBase.websiteUrls;
      const combinedUrls = Array.from(new Set([...existingUrls, ...incomingUrls]));

      const response = await fetch("/api/knowledge/sources/sync", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          websiteUrls: combinedUrls,
          googleSheetUrls: config.knowledgeBase.googleSheetUrls
        }),
      });

      if (!response.ok) {
        throw new Error("Gagal menyelaraskan URL website.");
      }

      await refreshConfig();
      setKbUrlInput("");
      setInputMethodActive("none");
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2500);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Sinkronisasi URL gagal.");
    } finally {
      setIsSyncingKbSources(false);
    }
  };

  const handleIngestKbText = async (event: FormEvent) => {
    event.preventDefault();
    if (!kbTextTitle.trim() || !kbTextContent.trim()) return;

    setIsIngestingText(true);

    try {
      const response = await fetch("/api/knowledge/text", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: kbTextTitle.trim() + ".txt",
          content: kbTextContent.trim()
        }),
      });

      if (!response.ok) {
        throw new Error("Gagal menyimpan teks fakta.");
      }

      setUnansweredQuestions(prev => prev.filter(q => q !== kbTextTitle.trim()));

      await refreshConfig();
      setKbTextTitle("");
      setKbTextContent("");
      setInputMethodActive("none");
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2500);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Simpan teks gagal.");
    } finally {
      setIsIngestingText(false);
    }
  };

  const handleUploadKbFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploadingKbFile(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/knowledge/documents/upload", {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Gagal mengunggah file.");
      }

      await refreshConfig();
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2500);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Gagal mengunggah berkas.");
    } finally {
      setIsUploadingKbFile(false);
    }
  };

  const handleDeleteKbDocument = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus referensi ini?")) return;
    try {
      await fetch(`/api/knowledge/documents/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      await refreshConfig();
    } catch {
      alert("Gagal menghapus dokumen.");
    }
  };

  const handleAnswerQuestion = (question: string) => {
    setKbTextTitle(question);
    setKbTextContent("");
    setInputMethodActive("text");
  };

  const handleDismissQuestion = (question: string) => {
    setUnansweredQuestions(prev => prev.filter(q => q !== question));
  };

  const urlCount = useMemo(() => config?.knowledgeBase.websiteUrls.length || 0, [config]);
  const docCount = useMemo(() => config?.knowledgeBase.documents.filter(d => d.sourceType === "upload" && !d.name.endsWith(".txt")).length || 0, [config]);
  const textCount = useMemo(() => config?.knowledgeBase.documents.filter(d => d.name.endsWith(".txt")).length || 0, [config]);

  const filteredKbDocs = useMemo(() => {
    const docs = config?.knowledgeBase.documents || [];
    if (!kbSearchQuery.trim()) return docs;
    return docs.filter(doc => doc.name.toLowerCase().includes(kbSearchQuery.toLowerCase()));
  }, [config, kbSearchQuery]);

  // -------------------------------------------------------------
  // CHATBOT SETTINGS HANDLERS (Redesigned Backend Saves)
  // -------------------------------------------------------------
  const handleProviderChange = (newProvider: AIProviderKind) => {
    setProvider(newProvider);
    const models = PROVIDER_MODELS[newProvider] || [];
    if (models.length > 0) {
      setModel(models[0].value);
    } else {
      setModel("");
    }
  };

  const handleSaveAIConfig = (event: FormEvent) => {
    event.preventDefault();

    patchConfig((current) => ({
      ...current,
      aiProvider: {
        enabled: providerEnabled,
        provider,
        apiKey,
        model,
        embeddingModel,
        baseUrl,
        vectorStore,
      },
    }));

    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  const handleSaveIdleAction = (event: FormEvent) => {
    event.preventDefault();

    patchConfig((current) => ({
      ...current,
      automation: {
        ...current.automation,
        followUpDelayHours: idleTimeoutHours,
      },
    }));

    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  const handleSaveApiIntegration = (event: FormEvent) => {
    event.preventDefault();

    // Mock link state updates
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  const handleSaveCrmIntegration = (event: FormEvent) => {
    event.preventDefault();

    // Mock link crm updates
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header and top tab buttons */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="flex items-center gap-2.5 text-2xl font-bold text-white">
            <Workflow className="h-6 w-6 text-cyan-400" />
            Automation Control Center
          </h1>
          <p className="mt-1 text-xs text-slate-400">
            Menggabungkan skenario conversations, AI Agent, Knowledge Base, dan chatbot settings dalam satu area.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {activeTab === "knowledge_base" && kbSubsection === "instructions" && (
            <Button onClick={handleSaveInstructions} className="text-xs px-4 h-9">
              <Save className="mr-1 h-4 w-4" />
              Simpan Instruksi
            </Button>
          )}
        </div>
      </div>

      {/* Quick Nav to standalone pages */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          { href: "/automation", label: "Conversations", desc: "Aturan otomasi", icon: GitBranch, active: true },
          { href: "/automation/ai-agent", label: "AI agents", desc: "Persona & tone AI", icon: Bot, badge: "NEW" },
          { href: "/automation/knowledge-base", label: "Knowledge Base", desc: "FAQ & dokumen", icon: Database },
          { href: "/automation/chatbot-settings", label: "Chatbot settings", desc: "Provider AI", icon: Settings2 },
        ].map(({ href, label, desc, icon: Icon, active, badge }) => (
          <Link
            key={href}
            href={href}
            className={`flex items-start gap-3 rounded-xl border p-3.5 transition hover:border-cyan-400/30 hover:bg-white/[0.03] ${
              active && href !== "/automation"
                ? "border-cyan-400/25 bg-cyan-950/10"
                : "border-white/8 bg-white/[0.02]"
            }`}
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-cyan-400/15 bg-cyan-950/30 text-cyan-400">
              <Icon className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-bold text-white">{label}</span>
                {badge && <span className="rounded bg-cyan-500 px-1 py-0.5 text-[8px] font-extrabold text-slate-950">{badge}</span>}
              </div>
              <span className="text-[10px] text-slate-500">{desc}</span>
            </div>
          </Link>
        ))}
      </div>

      <Tabs
        tabs={[
          { id: "conversations", label: "Conversations" },
          { id: "ai_agents", label: "AI agents (New)" },
          { id: "knowledge_base", label: "Knowledge Base" },
          { id: "settings", label: "Chatbot settings" },
        ]}
        activeTab={activeTab}
        onChange={setActiveTab}
      />

      {/* -------------------------------------------------------------------------------- */}
      {/* TAB 1: CONVERSATIONS */}
      {/* -------------------------------------------------------------------------------- */}
      {activeTab === "conversations" && (
        <div className="space-y-6">
          {/* Bot Quota & Action Banner */}
          <div className="relative overflow-hidden rounded-2xl border border-cyan-500/15 bg-gradient-to-r from-cyan-950/20 via-blue-950/10 to-transparent p-6">
            <div className="absolute right-0 top-0 h-48 w-48 rounded-full bg-cyan-400/8 blur-3xl" />
            <div className="relative z-10 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div className="space-y-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-cyan-400/20 bg-cyan-950/40 px-3 py-0.5 text-[10px] font-bold text-cyan-300">
                  <Sparkle className="h-3 w-3 text-cyan-300 animate-pulse" />
                  Bot Response Quota
                </span>
                <h2 className="text-3xl font-extrabold text-white tracking-tight">
                  999.999.999 <span className="text-sm font-semibold text-slate-400">kuota tersisa</span>
                </h2>
                <p className="max-w-2xl text-xs leading-5 text-slate-400">
                  Kuota balasan bot Anda saat ini tercatat 999999999. Anda dapat menyusun skenario balasan otomatis kustom untuk membalas pesan masuk pelanggan seketika.
                </p>
              </div>

              {!isCreatingFlow && (
                <Button onClick={() => setIsCreatingFlow(true)} className="px-6 self-start md:self-center">
                  <PlusCircle className="mr-1.5 h-4.5 w-4.5" />
                  Create conversation
                </Button>
              )}
            </div>
          </div>

          {/* Builder Canvas / Editor */}
          {isCreatingFlow && (
            <Card className="glass-panel p-6 border-cyan-400/30 shadow-[0_0_15px_rgba(0,210,255,0.05)]">
              <div className="flex items-center justify-between border-b border-white/8 pb-4 mb-6">
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-cyan-400">Canvas Penyusunan Alur Obrolan</h3>
                  <p className="text-xs text-slate-400 mt-1">Buat skenario respons otomatis berdasarkan kata kunci tertentu.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCreatingFlow(false)}
                  className="text-xs font-bold text-slate-400 hover:text-white"
                >
                  Batal
                </button>
              </div>

              <form onSubmit={handleSaveFlow} className="space-y-6">
                <div className="space-y-1.5 max-w-md">
                  <label className="text-xs font-semibold text-slate-300">Nama Skenario</label>
                  <Input
                    value={flowName}
                    onChange={(e) => setFlowName(e.target.value)}
                    placeholder="Contoh: Skenario Servis Bengkel"
                    className="h-10 text-xs"
                    required
                  />
                </div>

                <div className="flex flex-col md:flex-row gap-6 items-stretch">
                  {/* TRIGGER NODE */}
                  <div className="flex-1 rounded-xl border border-white/8 bg-white/[0.02] p-5 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <div className="flex h-7 w-7 items-center justify-center rounded bg-cyan-950/80 border border-cyan-400/20 text-cyan-400">
                          <GitBranch className="h-4 w-4" />
                        </div>
                        <span className="text-xs font-bold uppercase tracking-wider text-cyan-300">Pemicu (Trigger)</span>
                      </div>
                      <p className="text-[11px] text-slate-400 mb-4 leading-relaxed">
                        Skenario ini akan terpicu secara otomatis apabila pelanggan mengirim pesan yang mengandung kata kunci yang ditentukan.
                      </p>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-300">Kata Kunci Pemicu</label>
                      <Input
                        value={flowTrigger}
                        onChange={(e) => setFlowTrigger(e.target.value)}
                        placeholder="Misalnya: Servis, Harga, Booking"
                        className="h-10 text-xs"
                        required
                      />
                      <p className="text-[10px] text-slate-500">
                        *Kata kunci bersifat tidak sensitif huruf besar/kecil.
                      </p>
                    </div>
                  </div>

                  {/* ARROW */}
                  <div className="flex items-center justify-center text-slate-600">
                    <ChevronRight className="h-8 w-8 hidden md:block" />
                  </div>

                  {/* ACTION NODE */}
                  <div className="flex-1 rounded-xl border border-white/8 bg-white/[0.02] p-5 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <div className="flex h-7 w-7 items-center justify-center rounded bg-cyan-950/80 border border-cyan-400/20 text-cyan-400">
                          <Send className="h-4 w-4" />
                        </div>
                        <span className="text-xs font-bold uppercase tracking-wider text-cyan-300">Respon Asisten Bot</span>
                      </div>
                      <p className="text-[11px] text-slate-400 mb-4 leading-relaxed">
                        Tentukan teks pesan jawaban otomatis yang akan langsung dikirim oleh asisten bot kepada pelanggan.
                      </p>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-300">Teks Balasan Otomatis</label>
                      <Textarea
                        value={flowAction}
                        onChange={(e) => setFlowAction(e.target.value)}
                        placeholder="Contoh: Halo Kak! Kami menyediakan paket servis motor lengkap seharga Rp150.000."
                        rows={4}
                        className="text-xs"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setIsCreatingFlow(false)}
                    className="text-xs px-5 h-9.5"
                  >
                    Batal
                  </Button>
                  <Button type="submit" className="text-xs px-6 h-9.5">
                    Simpan dan Aktifkan Alur
                  </Button>
                </div>
              </form>
            </Card>
          )}

          {/* List of custom conversations/rules */}
          <Card className="glass-panel p-6">
            <h3 className="text-sm font-bold uppercase tracking-wider text-white mb-4">Skenario Percakapan Aktif</h3>
            <div className="space-y-3">
              {rules.length === 0 ? (
                <EmptyState
                  icon={<MessageSquare className="h-10 w-10" />}
                  title="Belum ada skenario"
                  description="Silakan klik tombol Create conversation untuk menyusun skenario percakapan pertama Anda."
                  className="min-h-[220px]"
                />
              ) : (
                rules.map((rule) => (
                  <div
                    key={rule.id}
                    className="rounded-xl border border-white/8 bg-white/[0.02] p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-white">{rule.name}</h4>
                        <Badge className="border-white/10 bg-white/5 text-slate-300 text-[10px]">
                          {rule.channel}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1 text-xs">
                        <p className="text-slate-300">
                          <span className="font-semibold text-cyan-400">Trigger:</span> {rule.trigger}
                        </p>
                        <p className="text-slate-400">
                          <span className="font-semibold text-cyan-400">Action:</span> {rule.action}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 self-end md:self-center">
                      <button
                        type="button"
                        onClick={() => toggleRule(rule.id)}
                        className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-bold transition ${
                          rule.isActive
                            ? "border-emerald-400/20 bg-emerald-950/30 text-emerald-300"
                            : "border-white/10 bg-white/5 text-slate-300"
                        }`}
                      >
                        {rule.isActive ? "Aktif" : "Nonaktif"}
                      </button>
                      <button
                        onClick={() => deleteRule(rule.id)}
                        className="rounded-lg p-2 border border-white/8 text-slate-500 hover:border-red-400/20 hover:bg-red-950/20 hover:text-red-400 transition"
                        title="Hapus Skenario"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      )}

      {/* -------------------------------------------------------------------------------- */}
      {/* TAB 2: AI AGENTS (NEW) */}
      {/* -------------------------------------------------------------------------------- */}
      {activeTab === "ai_agents" && (
        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
          {/* Persona controls Form */}
          <div className="space-y-6 lg:col-span-2">
            <form onSubmit={handleSaveAgent} className="glass-panel rounded-xl p-6 space-y-6">
              <div>
                <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-cyan-400 mb-1">
                  <Sliders className="h-4 w-4" />
                  Persona & Output Control
                </h3>
                <p className="text-[11px] text-slate-400">Atur profil, gaya bahasa, dan tata cara respons asisten AI virtual Anda.</p>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Nama AI Agent</label>
                  <Input value={agentName} onChange={(event) => setAgentName(event.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Bahasa Utama</label>
                  <Select value={language} onChange={(event) => setLanguage(event.target.value)}>
                    <option value="id">Bahasa Indonesia</option>
                    <option value="en">English</option>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Gaya Bahasa</label>
                  <Select value={tone} onChange={(event) => setTone(event.target.value)}>
                    <option value="casual">Casual / Santai</option>
                    <option value="formal">Formal / Sopan</option>
                    <option value="helpful">Ramah & Solutif</option>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Instruksi Balasan AI</label>
                  <Textarea
                    value={replyInstructions}
                    onChange={(event) => setReplyInstructions(event.target.value)}
                    rows={4}
                    placeholder="Contoh: Jawab singkat, pakai kata saya, panggil customer dengan kak, jangan terlalu formal."
                  />
                  <p className="text-[10px] text-slate-500">
                    Instruksikan bot mengenai gaya bicara, panggilan pelanggan, dan batasan respons.
                  </p>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Contoh Gaya Bicara Anda</label>
                  <Textarea
                    value={replyStyleExample}
                    onChange={(event) => setReplyStyleExample(event.target.value)}
                    rows={4}
                    placeholder="Contoh: Halo kak, saya bantu cek dulu ya. Kalau mau booking, boleh kirim tipe motor dan jam yang diinginkan."
                  />
                  <p className="text-[10px] text-slate-500">
                    Contoh sapaan, nada bicara, dan gaya penulisan agar AI menirunya.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Keyword Sapaan Tambahan</label>
                  <Input
                    value={greetingKeywords}
                    onChange={(event) => setGreetingKeywords(event.target.value)}
                    placeholder="Contoh: oi, punten, bang, min"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Template Sapaan</label>
                  <Textarea
                    value={greetingTemplate}
                    onChange={(event) => setGreetingTemplate(event.target.value)}
                    rows={3}
                    placeholder="Gunakan {businessName}, {agentName}, {address}, {businessHours}"
                  />
                  <p className="text-[10px] text-slate-500">
                    Gunakan placeholder: <code>{`{businessName}`}</code>, <code>{`{agentName}`}</code>, <code>{`{address}`}</code>.
                  </p>
                </div>
              </div>

              <div className="my-2 h-[1px] bg-white/8" />

              <div>
                <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-cyan-400 mb-1">
                  <Shield className="h-4 w-4" />
                  Safety & Automation
                </h3>
                <p className="text-[11px] text-slate-400">Pengaturan tingkat akurasi (confidence threshold) dan guardrail.</p>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2 rounded-xl border border-white/8 bg-white/[0.03] p-4">
                  <div className="flex items-center justify-between text-xs">
                    <label className="font-semibold text-slate-300">Confidence Threshold</label>
                    <span className="rounded border border-cyan-400/20 bg-cyan-950/40 px-2 py-0.5 font-bold text-cyan-400">
                      {confidence}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="30"
                    max="95"
                    step="5"
                    value={confidence}
                    onChange={(event) => setConfidence(Number(event.target.value))}
                    className="h-2 w-full cursor-pointer rounded-lg bg-white/10 accent-cyan-400"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">
                    Respons dengan tingkat kepastian di bawah {confidence}% akan dialihkan ke admin (fallback).
                  </p>
                </div>

                <div className="space-y-3 rounded-xl border border-white/8 bg-white/[0.03] p-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">Safety Mode</label>
                    <Select
                      value={safetyMode}
                      onChange={(event) =>
                        setSafetyMode(event.target.value as "strict" | "balanced" | "aggressive")
                      }
                    >
                      <option value="strict">Strict</option>
                      <option value="balanced">Balanced</option>
                      <option value="aggressive">Aggressive</option>
                    </Select>
                  </div>

                  <label className="flex items-center gap-3 text-xs text-slate-300">
                    <input
                      type="checkbox"
                      checked={autoReplyEnabled}
                      onChange={(event) => setAutoReplyEnabled(event.target.checked)}
                      className="h-4 w-4 rounded border-white/12 bg-white/4 text-cyan-500"
                    />
                    Aktifkan auto reply default untuk channel yang terhubung
                  </label>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Pesan Fallback</label>
                <Textarea value={fallbackMsg} onChange={(event) => setFallbackMsg(event.target.value)} rows={2} />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Topik Terlarang / Blacklist</label>
                <Input
                  value={blacklist}
                  onChange={(event) => setBlacklist(event.target.value)}
                  placeholder="Contoh: judi, kasar, kompetitor"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                {isSaved ? (
                  <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                    <Check className="h-4 w-4" />
                    Persona bot berhasil disimpan!
                  </span>
                ) : (
                  <div />
                )}
                <Button type="submit" className="px-6">
                  Simpan Persona Bot
                </Button>
              </div>
            </form>
          </div>

          {/* Playground Panel */}
          <div className="glass-panel flex h-[620px] flex-col rounded-xl p-5 sticky top-6">
            <h3 className="mb-4 flex items-center gap-2 shrink-0 text-xs font-bold uppercase tracking-wider text-cyan-400">
              <Play className="h-4 w-4 text-cyan-400" />
              Playground Balasan
            </h3>

            <div className="custom-scrollbar mb-4 flex-1 space-y-4 overflow-y-auto pr-1">
              {testMessages.map((message, index) => {
                const isUser = message.sender === "user";

                return (
                  <div
                    key={`${message.sender}-${index}`}
                    className={`flex max-w-[85%] flex-col ${
                      isUser ? "ml-auto items-end" : "mr-auto items-start"
                    }`}
                  >
                    <div
                      className={`rounded-2xl px-3 py-2 text-xs leading-relaxed ${
                        isUser
                          ? "rounded-tr-none border border-cyan-400/20 bg-cyan-950/40 text-cyan-100"
                          : "rounded-tl-none bg-white/6 text-slate-100"
                      }`}
                    >
                      {message.text}
                    </div>
                    {!isUser && message.confidence ? (
                      <div className="mt-1 flex gap-2 text-[9px] font-semibold text-slate-500">
                        <span>Conf: {message.confidence}%</span>
                      </div>
                    ) : null}
                  </div>
                );
              })}

              {isTyping && (
                <div className="animate-pulse self-start rounded-full bg-white/4 px-3 py-1.5 text-xs font-semibold text-slate-500">
                  {agentName} sedang berpikir...
                </div>
              )}
            </div>

            <form onSubmit={handleTestSend} className="flex shrink-0 gap-2 border-t border-white/8 pt-3">
              <Input
                placeholder="Tanya: Di mana alamat toko? atau Jam buka?"
                value={testInput}
                onChange={(event) => setTestInput(event.target.value)}
                disabled={isTyping}
                className="h-10 text-xs"
              />
              <button
                type="submit"
                disabled={isTyping}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-cyan-400 text-slate-950 shadow-lg transition hover:bg-cyan-300 disabled:opacity-50"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------------------------- */}
      {/* TAB 3: KNOWLEDGE BASE */}
      {/* -------------------------------------------------------------------------------- */}
      {activeTab === "knowledge_base" && (
        <div className="space-y-6">
          {/* Sub Tab section (AI resources | Custom instructions) */}
          <div className="flex border-b border-white/8 space-x-6">
            <button
              onClick={() => setKbSubsection("resources")}
              className={`pb-3 text-xs font-semibold uppercase tracking-wider border-b-2 transition ${
                kbSubsection === "resources" ? "border-cyan-400 text-cyan-400 font-bold" : "border-transparent text-slate-400 hover:text-slate-200"
              }`}
            >
              AI Resources
            </button>
            <button
              onClick={() => setKbSubsection("instructions")}
              className={`pb-3 text-xs font-semibold uppercase tracking-wider border-b-2 transition ${
                kbSubsection === "instructions" ? "border-cyan-400 text-cyan-400 font-bold" : "border-transparent text-slate-400 hover:text-slate-200"
              }`}
            >
              Custom Instructions
            </button>
          </div>

          {/* SubSection: AI Resources */}
          {kbSubsection === "resources" && (
            <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
              <div className="space-y-6 lg:col-span-2">
                {/* Search & Existing Sources */}
                <Card className="glass-panel p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                    <div>
                      <h3 className="text-sm font-bold uppercase tracking-wider text-white">Existing Sources</h3>
                      <p className="text-xs text-slate-400 mt-0.5">Seluruh referensi pangkalan data yang sudah dipelajari oleh asisten bot.</p>
                    </div>

                    <div className="relative w-full sm:max-w-xs">
                      <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                      <Input
                        placeholder="Cari referensi..."
                        className="h-9 pl-9 text-xs"
                        value={kbSearchQuery}
                        onChange={(e) => setKbSearchQuery(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    {filteredKbDocs.length === 0 ? (
                      <EmptyState
                        icon={<Database className="h-10 w-10 text-slate-500" />}
                        title="Belum ada referensi"
                        description="Existing sources saat ini masih kosong. Silakan gunakan Metode Input di samping kanan untuk memasukkan data."
                        className="min-h-[200px]"
                      />
                    ) : (
                      filteredKbDocs.map((doc) => (
                        <div key={doc.id} className="rounded-xl border border-white/6 bg-white/2 p-4 flex items-center justify-between gap-4">
                          <div className="flex min-w-0 items-center gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-cyan-400/10 bg-cyan-950/20 text-cyan-400">
                              {doc.name.endsWith(".txt") ? (
                                <FileText className="h-4.5 w-4.5" />
                              ) : doc.sourceType === "website" ? (
                                <Link2 className="h-4.5 w-4.5" />
                              ) : (
                                <Upload className="h-4.5 w-4.5" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <span className="block truncate text-xs font-bold text-white">{doc.name}</span>
                              <div className="mt-1 flex flex-wrap items-center gap-2 text-[10px] font-semibold text-slate-500">
                                <span>{doc.size}</span>
                                <span className="rounded-full border border-white/8 px-2 py-0.5 text-[9px] uppercase tracking-wider text-slate-400">
                                  {doc.name.endsWith(".txt")
                                    ? "Text Content"
                                    : doc.sourceType === "website"
                                      ? "External URL"
                                      : "File Upload"}
                                </span>
                                {doc.syncedAt && <span>sync: {new Date(doc.syncedAt).toLocaleDateString("id-ID")}</span>}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-4">
                            <span className="flex items-center gap-1 rounded bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                              <Check className="h-3.5 w-3.5 stroke-[2.5]" />
                              Terserap AI
                            </span>
                            <button
                              onClick={() => handleDeleteKbDocument(doc.id)}
                              className="rounded p-1.5 text-slate-500 transition hover:text-red-400"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </Card>

                {/* Unanswered Questions (Debugging tool) */}
                <Card className="glass-panel p-6 border-amber-500/25">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="h-5 w-5 text-amber-400" />
                    <h3 className="text-sm font-bold uppercase tracking-wider text-white">Unanswered Questions</h3>
                  </div>
                  <p className="text-xs text-slate-400 mb-4 leading-normal">
                    Mencatat daftar pertanyaan pelanggan yang gagal dijawab oleh AI (di bawah threshold). Sangat berguna untuk mengetahui materi apa yang kurang pada pangkalan data Anda.
                  </p>

                  <div className="space-y-3">
                    {unansweredQuestions.length === 0 ? (
                      <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.01] p-6 text-center text-xs font-semibold text-slate-500">
                        Tidak ada pertanyaan tak terjawab saat ini. Sistem bekerja sempurna!
                      </div>
                    ) : (
                      unansweredQuestions.map((question, idx) => (
                        <div key={idx} className="rounded-xl border border-white/8 bg-white/[0.02] p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                          <p className="text-xs font-semibold text-slate-200">{question}</p>

                          <div className="flex gap-2 shrink-0">
                            <Button
                              onClick={() => handleAnswerQuestion(question)}
                              className="text-[10px] h-8 px-3 rounded-lg"
                            >
                              Jawab via Text Content
                            </Button>
                            <button
                              onClick={() => handleDismissQuestion(question)}
                              className="text-[10px] h-8 px-3 rounded-lg border border-white/10 text-slate-400 hover:text-white"
                            >
                              Abaikan
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </Card>
              </div>

              {/* Methods Input Side Panel */}
              <div className="space-y-6">
                <Card className="glass-panel p-5">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-400 mb-4">Metode Input</h3>

                  <div className="space-y-3">
                    {/* External URL Card */}
                    <div
                      onClick={() => setInputMethodActive("url")}
                      className={`flex items-center justify-between p-4 rounded-xl border transition cursor-pointer ${
                        inputMethodActive === "url"
                          ? "border-cyan-400 bg-cyan-950/20"
                          : "border-white/8 bg-white/[0.02] hover:border-cyan-400/50"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-950/50 text-cyan-400 border border-cyan-400/20">
                          <Link2 className="h-4 w-4" />
                        </div>
                        <div className="text-left">
                          <p className="text-xs font-bold text-white">External URL</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">Tautkan link / katalog online</p>
                        </div>
                      </div>
                      <Badge className="bg-cyan-950 text-cyan-300 border-cyan-400/20">{urlCount}</Badge>
                    </div>

                    {/* File Upload Card */}
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center justify-between p-4 rounded-xl border border-white/8 bg-white/[0.02] hover:border-cyan-400/50 transition cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-950/50 text-cyan-400 border border-cyan-400/20">
                          <Upload className="h-4 w-4" />
                        </div>
                        <div className="text-left">
                          <p className="text-xs font-bold text-white">File upload</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">Unggah berkas PDF / XLSX</p>
                        </div>
                      </div>
                      <Badge className="bg-cyan-950 text-cyan-300 border-cyan-400/20">
                        {isUploadingKbFile ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          docCount
                        )}
                      </Badge>
                    </div>
                    {/* Hidden File input */}
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleUploadKbFile}
                      accept=".pdf,.docx,.xlsx,.xls,.csv,.txt,.md"
                      className="hidden"
                    />

                    {/* Text Content Card */}
                    <div
                      onClick={() => setInputMethodActive("text")}
                      className={`flex items-center justify-between p-4 rounded-xl border transition cursor-pointer ${
                        inputMethodActive === "text"
                          ? "border-cyan-400 bg-cyan-950/20"
                          : "border-white/8 bg-white/[0.02] hover:border-cyan-400/50"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-950/50 text-cyan-400 border border-cyan-400/20">
                          <FileText className="h-4 w-4" />
                        </div>
                        <div className="text-left">
                          <p className="text-xs font-bold text-white">Text content</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">Ketik fakta manual</p>
                        </div>
                      </div>
                      <Badge className="bg-cyan-950 text-cyan-300 border-cyan-400/20">{textCount}</Badge>
                    </div>
                  </div>
                </Card>

                {/* Form URL */}
                {inputMethodActive === "url" && (
                  <Card className="glass-panel p-5 space-y-3.5">
                    <div className="flex items-center justify-between border-b border-white/8 pb-2">
                      <span className="text-xs font-bold text-white uppercase tracking-wider">Input External URL</span>
                      <button onClick={() => setInputMethodActive("none")} className="text-[10px] text-slate-500 hover:text-white">Batal</button>
                    </div>
                    <form onSubmit={handleSyncKbUrl} className="space-y-3">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-semibold text-slate-300">Tautan Halaman Website (Satu per baris)</label>
                        <Textarea
                          placeholder="https://johangarage.com/profile"
                          value={kbUrlInput}
                          onChange={(e) => setKbUrlInput(e.target.value)}
                          rows={3}
                          className="text-xs"
                          required
                        />
                      </div>
                      <Button type="submit" disabled={isSyncingKbSources} className="w-full text-xs h-9">
                        {isSyncingKbSources ? (
                          <>
                            <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                            Sinkronisasi...
                          </>
                        ) : (
                          "Tambahkan Tautan"
                        )}
                      </Button>
                    </form>
                  </Card>
                )}

                {/* Form Text Fact Ingest */}
                {inputMethodActive === "text" && (
                  <Card className="glass-panel p-5 space-y-3.5">
                    <div className="flex items-center justify-between border-b border-white/8 pb-2">
                      <span className="text-xs font-bold text-white uppercase tracking-wider">Ketik Fakta Manual</span>
                      <button onClick={() => setInputMethodActive("none")} className="text-[10px] text-slate-500 hover:text-white">Batal</button>
                    </div>
                    <form onSubmit={handleIngestKbText} className="space-y-3">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-semibold text-slate-300">Nama Fakta / Pemicu</label>
                        <Input
                          placeholder="Contoh: Jadwal Buka Bengkel"
                          value={kbTextTitle}
                          onChange={(e) => setKbTextTitle(e.target.value)}
                          className="h-9 text-xs"
                          required
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-semibold text-slate-300">Isi Konten Teks Fakta</label>
                        <Textarea
                          placeholder="Contoh: Johan Garage buka setiap Senin s.d Sabtu pukul 08:00 - 17:00."
                          value={kbTextContent}
                          onChange={(e) => setKbTextContent(e.target.value)}
                          rows={4}
                          className="text-xs"
                          required
                        />
                      </div>
                      <Button type="submit" disabled={isIngestingText} className="w-full text-xs h-9">
                        {isIngestingText ? (
                          <>
                            <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                            Menyimpan...
                          </>
                        ) : (
                          "Simpan Konten Fakta"
                        )}
                      </Button>
                    </form>
                  </Card>
                )}
              </div>
            </div>
          )}

          {/* SubSection: Custom Instructions */}
          {kbSubsection === "instructions" && (
            <Card className="glass-panel p-6 max-w-3xl">
              <div className="mb-6">
                <h3 className="text-sm font-bold uppercase tracking-wider text-white">Custom Instructions</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Atur instruksi dasar tingkat tinggi (*high-level directives*) sistem prompt AI untuk mengontrol identitas, nada bahasa, dan batasan respon.
                </p>
              </div>

              <form onSubmit={handleSaveInstructions} className="space-y-5">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">1. Persona Configuration (Identitas Bot)</label>
                  <Textarea
                    placeholder="Contoh: Kamu adalah asisten mekanik Johan Garage yang ramah dan ahli dalam mesin motor..."
                    value={personaConfig}
                    onChange={(e) => setPersonaConfig(e.target.value)}
                    rows={3}
                    className="text-xs"
                    required
                  />
                  <p className="text-[10px] text-slate-500 leading-normal">
                    Menjelaskan identitas bot, keahlian khusus, dan konteks operasional bisnis Anda.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">2. Tone of Voice (Gaya Bahasa)</label>
                  <Textarea
                    placeholder="Contoh: Gunakan bahasa santai anak motor, panggil pelanggan dengan sapaan 'Om' atau 'Bang'..."
                    value={toneOfVoice}
                    onChange={(e) => setToneOfVoice(e.target.value)}
                    rows={3}
                    className="text-xs"
                    required
                  />
                  <p className="text-[10px] text-slate-500 leading-normal">
                    Menentukan gaya penulisan, sapaan wajib, serta nada emosi tanggapan bot.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">3. Guardrails / Aturan Keamanan (Zero Hallucination)</label>
                  <Textarea
                    placeholder="Contoh: Dilarang memberikan estimasi harga perbaikan mesin yang berat sebelum diinspeksi langsung. Arahkan untuk booking jadwal saja..."
                    value={guardrails}
                    onChange={(e) => setGuardrails(e.target.value)}
                    rows={3}
                    className="text-xs"
                    required
                  />
                  <p className="text-[10px] text-slate-500 leading-normal">
                    Instruksi mutlak untuk mencegah bot mengarang info palsu. Berisi larangan keras atau pembatasan topik sensitif.
                  </p>
                </div>

                <div className="flex items-center justify-between border-t border-white/8 pt-4">
                  {isSaved ? (
                    <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                      <Check className="h-4 w-4" />
                      Instruksi kustom berhasil disimpan!
                    </span>
                  ) : (
                    <div />
                  )}
                  <Button type="submit" className="px-6 h-9.5 text-xs">
                    Simpan Instruksi Custom
                  </Button>
                </div>
              </form>
            </Card>
          )}
        </div>
      )}

      {/* -------------------------------------------------------------------------------- */}
      {/* TAB 4: CHATBOT SETTINGS (REDESIGNED) */}
      {/* -------------------------------------------------------------------------------- */}
      {activeTab === "settings" && (
        <div className="space-y-6">
          {/* Sub Tab section (AI config | Idle Action | API Integration | CRM integration) */}
          <div className="flex border-b border-white/8 space-x-6">
            <button
              onClick={() => setSettingsSubsection("ai_config")}
              className={`pb-3 text-xs font-semibold uppercase tracking-wider border-b-2 transition ${
                settingsSubsection === "ai_config" ? "border-cyan-400 text-cyan-400 font-bold" : "border-transparent text-slate-400 hover:text-slate-200"
              }`}
            >
              AI Configuration
            </button>
            <button
              onClick={() => setSettingsSubsection("idle_action")}
              className={`pb-3 text-xs font-semibold uppercase tracking-wider border-b-2 transition ${
                settingsSubsection === "idle_action" ? "border-cyan-400 text-cyan-400 font-bold" : "border-transparent text-slate-400 hover:text-slate-200"
              }`}
            >
              Idle Action
            </button>
            <button
              onClick={() => setSettingsSubsection("api_integration")}
              className={`pb-3 text-xs font-semibold uppercase tracking-wider border-b-2 transition ${
                settingsSubsection === "api_integration" ? "border-cyan-400 text-cyan-400 font-bold" : "border-transparent text-slate-400 hover:text-slate-200"
              }`}
            >
              API Integration
            </button>
            <button
              onClick={() => setSettingsSubsection("crm_integration")}
              className={`pb-3 text-xs font-semibold uppercase tracking-wider border-b-2 transition ${
                settingsSubsection === "crm_integration" ? "border-cyan-400 text-cyan-400 font-bold" : "border-transparent text-slate-400 hover:text-slate-200"
              }`}
            >
              CRM Integration
            </button>
          </div>

          {/* Subsection: AI Configuration */}
          {settingsSubsection === "ai_config" && (
            <Card className="glass-panel p-6 max-w-3xl">
              <div className="mb-5 flex items-center gap-3">
                <div className="rounded-2xl border border-cyan-400/20 bg-cyan-950/30 p-3 text-cyan-300">
                  <Sliders className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-sm font-bold uppercase tracking-wider text-white">AI Configuration</h2>
                  <p className="text-xs text-slate-400 mt-1">Menu ini digunakan untuk mengatur parameter teknis dari mesin kecerdasan buatan itu sendiri, seperti memilih model AI yang digunakan atau mengonfigurasi batas penggunaan token/kuota (backend settings).</p>
                </div>
              </div>

              <form onSubmit={handleSaveAIConfig} className="space-y-5">
                <label className="flex items-center gap-3 rounded-xl border border-white/8 bg-white/[0.03] p-4 text-xs text-slate-300">
                  <input
                    type="checkbox"
                    checked={providerEnabled}
                    onChange={(event) => setProviderEnabled(event.target.checked)}
                    className="h-4 w-4 rounded border-white/12 bg-white/4 text-cyan-500"
                  />
                  Aktifkan provider AI production dari dashboard config
                </label>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">Provider Utama</label>
                    <Select
                      value={provider}
                      onChange={(event) => handleProviderChange(event.target.value as AIProviderKind)}
                    >
                      <option value="demo">Demo / Playground</option>
                      <option value="openai">OpenAI</option>
                      <option value="openrouter">OpenRouter</option>
                      <option value="anthropic">Anthropic</option>
                      <option value="gemini">Gemini</option>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">Pilihan Model</label>
                    <Select
                      value={
                        (PROVIDER_MODELS[provider] || []).some((m) => m.value === model)
                          ? model
                          : "custom"
                      }
                      onChange={(event) => {
                        const val = event.target.value;
                        if (val === "custom") {
                          setModel("");
                        } else {
                          setModel(val);
                        }
                      }}
                    >
                      {(PROVIDER_MODELS[provider] || []).map((m) => (
                        <option key={m.value} value={m.value}>
                          {m.label}
                        </option>
                      ))}
                      <option value="custom">Model Kustom...</option>
                    </Select>
                    {(!(PROVIDER_MODELS[provider] || []).some((m) => m.value === model) || model === "") && (
                      <div className="mt-2">
                        <Input
                          value={model}
                          onChange={(event) => setModel(event.target.value)}
                          placeholder="Nama model kustom (misal: gpt-4o-mini)"
                          className="text-xs h-9"
                        />
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">API Key Provider</label>
                    <Input
                      type="password"
                      value={apiKey}
                      onChange={(event) => setApiKey(event.target.value)}
                      placeholder="Masukkan API key"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">Base URL Custom</label>
                    <Input
                      value={baseUrl}
                      onChange={(event) => setBaseUrl(event.target.value)}
                      placeholder="Opsional (untuk custom endpoint)"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">Max Tokens (Token Limit)</label>
                    <Input
                      type="number"
                      value={maxTokens}
                      onChange={(event) => setMaxTokens(Number(event.target.value))}
                      placeholder="Contoh: 2000"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">Kuota Limit Balasan Bulanan (Token/Kuota)</label>
                    <Input
                      type="number"
                      value={quotaLimit}
                      onChange={(event) => setQuotaLimit(Number(event.target.value))}
                      placeholder="Contoh: 999999999"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">Embedding Model</label>
                    <Input value={embeddingModel} onChange={(event) => setEmbeddingModel(event.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">Vector Store</label>
                    <Select
                      value={vectorStore}
                      onChange={(event) => setVectorStore(event.target.value as VectorStoreKind)}
                    >
                      <option value="none">Belum dipakai</option>
                      <option value="pgvector">PostgreSQL / pgvector</option>
                      <option value="pinecone">Pinecone</option>
                      <option value="supabase">Supabase Vector</option>
                    </Select>
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-white/8 pt-4">
                  {isSaved ? (
                    <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                      <Check className="h-4 w-4" />
                      AI configuration berhasil disimpan!
                    </span>
                  ) : (
                    <div />
                  )}
                  <Button type="submit" className="px-6 h-9.5 text-xs">
                    Simpan AI Config
                  </Button>
                </div>
              </form>
            </Card>
          )}

          {/* Subsection: Idle Action */}
          {settingsSubsection === "idle_action" && (
            <Card className="glass-panel p-6 max-w-3xl">
              <div className="mb-5 flex items-center gap-3">
                <div className="rounded-2xl border border-cyan-400/20 bg-cyan-950/30 p-3 text-cyan-300">
                  <Clock3 className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-sm font-bold uppercase tracking-wider text-white">Idle Action (Kontrol Obrolan Menganggur)</h2>
                  <p className="text-xs text-slate-400 mt-1">Fitur kontrol otomatisasi obrolan. Di sini Anda mengatur apa yang harus dilakukan oleh sistem jika sebuah obrolan sedang &quot;menganggur&quot; (idle), misalnya ketika pelanggan menghilang tanpa membalas chat atau agen lupa menutup sesi percakapan.</p>
                </div>
              </div>

              <form onSubmit={handleSaveIdleAction} className="space-y-5">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">Jeda Waktu Idle (Timeout Jam)</label>
                    <Input
                      type="number"
                      min="1"
                      value={idleTimeoutHours}
                      onChange={(event) => setIdleTimeoutHours(Number(event.target.value))}
                    />
                    <p className="text-[10px] text-slate-500">Sesi dinyatakan idle jika tidak ada pesan baru selama rentang waktu ini.</p>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">Aksi Otomatis Saat Idle</label>
                    <Select
                      value={idleActionType}
                      onChange={(event) => setIdleActionType(event.target.value as "followup" | "close" | "handoff")}
                    >
                      <option value="followup">Kirim pesan follow-up otomatis</option>
                      <option value="close">Tutup sesi percakapan otomatis (Auto Close)</option>
                      <option value="handoff">Pindahkan tiket ke antrean Handoff Admin</option>
                    </Select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Teks Pesan Idle (Pesan Otomatis)</label>
                  <Textarea
                    value={idleMessage}
                    onChange={(event) => setIdleMessage(event.target.value)}
                    rows={4}
                    placeholder="Tulis pesan penutup atau follow-up otomatis..."
                  />
                </div>

                <div className="flex items-center justify-between border-t border-white/8 pt-4">
                  {isSaved ? (
                    <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                      <Check className="h-4 w-4" />
                      Idle action berhasil disimpan!
                    </span>
                  ) : (
                    <div />
                  )}
                  <Button type="submit" className="px-6 h-9.5 text-xs">
                    Simpan Idle Action
                  </Button>
                </div>
              </form>
            </Card>
          )}

          {/* Subsection: API Integration */}
          {settingsSubsection === "api_integration" && (
            <Card className="glass-panel p-6 max-w-3xl">
              <div className="mb-5 flex items-center gap-3">
                <div className="rounded-2xl border border-cyan-400/20 bg-cyan-950/30 p-3 text-cyan-300">
                  <Globe className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-sm font-bold uppercase tracking-wider text-white">API Integration (Integrasi Sistem Eksternal)</h2>
                  <p className="text-xs text-slate-400 mt-1">Modul untuk menghubungkan chatbot Anda dengan aplikasi atau server eksternal melalui Application Programming Interface (API). Misalnya, menghubungkan bot Qontak dengan sistem inventaris spare part lokal di Johan Garage agar bot bisa mengecek stok barang secara real-time.</p>
                </div>
              </div>

              <form onSubmit={handleSaveApiIntegration} className="space-y-6">
                {/* Integration 1: Qontak API */}
                <div className="rounded-xl border border-white/8 bg-white/[0.02] p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                      <Radio className={`h-3 w-3 ${isQontakConnected ? "text-emerald-400 animate-pulse" : "text-slate-500"}`} />
                      Qontak OMNI API
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsQontakConnected(!isQontakConnected)}
                      className={`text-[10px] font-bold px-3 py-1 rounded border transition ${
                        isQontakConnected
                          ? "border-emerald-400/20 bg-emerald-950/20 text-emerald-300"
                          : "border-white/10 bg-white/5 text-slate-400 hover:text-white"
                      }`}
                    >
                      {isQontakConnected ? "Connected" : "Connect API"}
                    </button>
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-semibold text-slate-300">Endpoint URL Qontak</label>
                      <Input
                        value={qontakApiUrl}
                        onChange={(e) => setQontakApiUrl(e.target.value)}
                        className="h-9 text-xs"
                        disabled={isQontakConnected}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-semibold text-slate-300">Access Token / Bearer Token</label>
                      <Input
                        type="password"
                        value={qontakAccessToken}
                        onChange={(e) => setQontakAccessToken(e.target.value)}
                        placeholder="••••••••••••••••••••••••••••••••"
                        className="h-9 text-xs"
                        disabled={isQontakConnected}
                      />
                    </div>
                  </div>
                </div>

                {/* Integration 2: Inventory API Johan Garage */}
                <div className="rounded-xl border border-white/8 bg-white/[0.02] p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                      <Radio className={`h-3 w-3 ${isInventoryConnected ? "text-emerald-400 animate-pulse" : "text-slate-500"}`} />
                      Johan Garage Inventory API (Stok Suku Cadang)
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsInventoryConnected(!isInventoryConnected)}
                      className={`text-[10px] font-bold px-3 py-1 rounded border transition ${
                        isInventoryConnected
                          ? "border-emerald-400/20 bg-emerald-950/20 text-emerald-300"
                          : "border-white/10 bg-white/5 text-slate-400 hover:text-white"
                      }`}
                    >
                      {isInventoryConnected ? "Connected" : "Connect API"}
                    </button>
                  </div>

                  <div className="space-y-1.5 max-w-md">
                    <label className="text-[10px] font-semibold text-slate-300">Local Inventory Stock API Endpoint</label>
                    <Input
                      value={inventoryApiUrl}
                      onChange={(e) => setInventoryApiUrl(e.target.value)}
                      className="h-9 text-xs"
                      disabled={isInventoryConnected}
                    />
                    <p className="text-[9px] text-slate-500">Membantu bot Johan Garage mengecek ketersediaan oli, filter, atau ban secara langsung saat ditanya pelanggan.</p>
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-white/8 pt-4">
                  {isSaved ? (
                    <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                      <Check className="h-4 w-4" />
                      API integrations berhasil diperbarui!
                    </span>
                  ) : (
                    <div />
                  )}
                  <Button type="submit" className="px-6 h-9.5 text-xs">
                    Simpan Integrasi API
                  </Button>
                </div>
              </form>
            </Card>
          )}

          {/* Subsection: CRM Integration */}
          {settingsSubsection === "crm_integration" && (
            <Card className="glass-panel p-6 max-w-3xl">
              <div className="mb-5 flex items-center gap-3">
                <div className="rounded-2xl border border-cyan-400/20 bg-cyan-950/30 p-3 text-cyan-300">
                  <UserCheck className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-sm font-bold uppercase tracking-wider text-white">CRM Integration</h2>
                  <p className="text-xs text-slate-400 mt-1">Pengaturan spesifik untuk menyinkronkan data dari chatbot langsung ke dalam sistem Customer Relationship Management (CRM). Ini memastikan setiap interaksi prospek baru yang ditangani bot secara otomatis terdaftar di dalam database Contacts atau jalur penjualan (Sales Pipeline) bengkel Anda.</p>
                </div>
              </div>

              <form onSubmit={handleSaveCrmIntegration} className="space-y-5">
                <label className="flex items-center gap-3 rounded-xl border border-white/8 bg-white/[0.03] p-4 text-xs text-slate-300">
                  <input
                    type="checkbox"
                    checked={autoSyncToCrm}
                    onChange={(event) => setAutoSyncToCrm(event.target.checked)}
                    className="h-4 w-4 rounded border-white/12 bg-white/4 text-cyan-500"
                  />
                  Aktifkan sinkronisasi otomatis kontak baru langsung ke CRM database
                </label>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">Tahap Pipeline Default Prospek Baru</label>
                    <Select
                      value={defaultLeadStage}
                      onChange={(e) => setDefaultLeadStage(e.target.value)}
                    >
                      <option value="Interested">Interested / Tertarik</option>
                      <option value="Qualified Lead">Qualified Lead / Prospek Layak</option>
                      <option value="Proposal Sent">Proposal Sent / Penawaran Terkirim</option>
                      <option value="Negotiation">Negotiation / Negosiasi</option>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">Owner Default Prospek Baru</label>
                    <Select
                      value={crmOwner}
                      onChange={(e) => setCrmOwner(e.target.value)}
                    >
                      <option value="AI Assistant">AI Assistant (Otomatis)</option>
                      <option value="Johan (Mekanik)">Johan (Mekanik Utama)</option>
                      <option value="Admin Office">Admin Office</option>
                    </Select>
                  </div>
                </div>

                <div className="rounded-xl border border-white/8 bg-white/[0.02] p-4 space-y-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Mapping Kolom CRM</span>
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <p className="text-slate-500">Kolom Chatbot</p>
                      <ul className="mt-1 space-y-1.5 text-slate-300 font-semibold">
                        <li>Nomor Pengirim (WhatsApp ID)</li>
                        <li>Nama Pelanggan (WhatsApp Profile)</li>
                        <li>Summary Percakapan AI</li>
                      </ul>
                    </div>
                    <div>
                      <p className="text-slate-500">Kolom CRM Contacts</p>
                      <ul className="mt-1 space-y-1.5 text-cyan-400 font-semibold">
                        <li>→ Nomor Telepon Utama</li>
                        <li>→ Nama Lengkap</li>
                        <li>→ Catatan & Context (Notes)</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-white/8 pt-4">
                  {isSaved ? (
                    <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                      <Check className="h-4 w-4" />
                      CRM integration berhasil disimpan!
                    </span>
                  ) : (
                    <div />
                  )}
                  <Button type="submit" className="px-6 h-9.5 text-xs">
                    Simpan Setelan CRM
                  </Button>
                </div>
              </form>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
