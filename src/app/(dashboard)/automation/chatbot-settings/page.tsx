"use client";

import { useEffect, useState, type FormEvent } from "react";
import {
  ArrowLeft,
  Check,
  Clock3,
  Globe,
  Loader2,
  MessageSquare,
  Radio,
  Settings2,
  Sliders,
  UserCheck,
  Zap,
} from "lucide-react";
import Link from "next/link";

import { useDashboardConfig } from "@/hooks/use-dashboard-config";
import type { AIProviderKind, VectorStoreKind } from "@/types/dashboard-config";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const PROVIDER_MODELS: Record<AIProviderKind, { value: string; label: string }[]> = {
  demo: [{ value: "balesin-demo-model", label: "Balesin Demo Model" }],
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

export default function ChatbotSettingsPage() {
  const { config, patchConfig, isLoading } = useDashboardConfig();
  const [isSaved, setIsSaved] = useState(false);
  const [settingsSubsection, setSettingsSubsection] = useState("ai_config");

  // AI Config
  const [providerEnabled, setProviderEnabled] = useState(false);
  const [provider, setProvider] = useState<AIProviderKind>("openai");
  const [apiKey, setApiKey] = useState("");
  const [model, setModel] = useState("");
  const [embeddingModel, setEmbeddingModel] = useState("");
  const [baseUrl, setBaseUrl] = useState("");
  const [vectorStore, setVectorStore] = useState<VectorStoreKind>("none");
  const [maxTokens, setMaxTokens] = useState(2000);
  const [quotaLimit, setQuotaLimit] = useState(999999999);

  // Idle Action
  const [idleActionType, setIdleActionType] = useState<"followup" | "close" | "handoff">("followup");
  const [idleTimeoutHours, setIdleTimeoutHours] = useState(24);
  const [idleMessage, setIdleMessage] = useState(
    "Halo Kak! Apakah ada hal lain yang bisa kami bantu? Jika tidak ada respon, sesi chat ini akan ditutup otomatis ya."
  );

  // API Integration
  const [qontakApiUrl, setQontakApiUrl] = useState("https://api.qontak.com/v1/");
  const [qontakAccessToken, setQontakAccessToken] = useState("");
  const [inventoryApiUrl, setInventoryApiUrl] = useState("https://api.johangarage.local/inventory/");
  const [isQontakConnected, setIsQontakConnected] = useState(false);
  const [isInventoryConnected, setIsInventoryConnected] = useState(false);

  // CRM Integration
  const [autoSyncToCrm, setAutoSyncToCrm] = useState(true);
  const [defaultLeadStage, setDefaultLeadStage] = useState("Interested");
  const [crmOwner, setCrmOwner] = useState("AI Assistant");

  useEffect(() => {
    if (!config) return;
    setProviderEnabled(config.aiProvider.enabled);
    setProvider(config.aiProvider.provider);
    setApiKey(config.aiProvider.apiKey);
    setModel(config.aiProvider.model);
    setEmbeddingModel(config.aiProvider.embeddingModel);
    setBaseUrl(config.aiProvider.baseUrl);
    setVectorStore(config.aiProvider.vectorStore);
    setIdleTimeoutHours(config.automation.followUpDelayHours);
  }, [config]);

  const handleProviderChange = (newProvider: AIProviderKind) => {
    setProvider(newProvider);
    const models = PROVIDER_MODELS[newProvider] || [];
    if (models.length > 0) setModel(models[0].value);
    else setModel("");
  };

  const handleSaveAIConfig = (event: FormEvent) => {
    event.preventDefault();
    patchConfig((current) => ({
      ...current,
      aiProvider: { enabled: providerEnabled, provider, apiKey, model, embeddingModel, baseUrl, vectorStore },
    }));
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  const handleSaveIdleAction = (event: FormEvent) => {
    event.preventDefault();
    patchConfig((current) => ({
      ...current,
      automation: { ...current.automation, followUpDelayHours: idleTimeoutHours },
    }));
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  const handleSaveApiIntegration = (event: FormEvent) => {
    event.preventDefault();
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  const handleSaveCrmIntegration = (event: FormEvent) => {
    event.preventDefault();
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
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Link href="/automation" className="inline-flex items-center gap-1.5 text-[11px] text-slate-400 hover:text-white transition">
              <ArrowLeft className="h-3.5 w-3.5" />
              Automation
            </Link>
          </div>
          <h1 className="flex items-center gap-2.5 text-2xl font-bold text-white">
            <Settings2 className="h-6 w-6 text-cyan-400" />
            Chatbot settings
          </h1>
          <p className="mt-1 text-xs text-slate-400">
            Konfigurasi teknis AI provider, idle action, dan integrasi sistem eksternal.
          </p>
        </div>

        <div className="flex items-center gap-2 rounded-xl border border-cyan-500/20 bg-cyan-950/20 px-4 py-2.5 text-xs">
          <MessageSquare className="h-4 w-4 text-cyan-400" />
          <span className="text-slate-300">
            Terhubung ke{" "}
            <Link href="/inbox" className="font-bold text-cyan-400 hover:underline">
              Inbox
            </Link>{" "}
            — pengaturan backend aktif
          </span>
          <span className={`flex h-2 w-2 rounded-full ${providerEnabled ? "bg-emerald-400 animate-pulse" : "bg-amber-400"}`} />
        </div>
      </div>

      {/* Provider Status Banner */}
      <div className={`rounded-xl border p-4 flex items-center gap-4 ${
        providerEnabled
          ? "border-emerald-500/20 bg-emerald-950/10"
          : "border-amber-500/20 bg-amber-950/10"
      }`}>
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
          providerEnabled ? "bg-emerald-950/30 text-emerald-400" : "bg-amber-950/30 text-amber-400"
        }`}>
          <Zap className="h-5 w-5" />
        </div>
        <div>
          <div className={`text-sm font-bold ${providerEnabled ? "text-emerald-300" : "text-amber-300"}`}>
            {providerEnabled ? `Provider Aktif: ${provider}` : "Demo Mode (Rule-based Engine)"}
          </div>
          <p className={`text-[11px] ${providerEnabled ? "text-emerald-400/70" : "text-amber-400/70"}`}>
            {providerEnabled
              ? `AI Inbox menggunakan ${model || "model kustom"} untuk membalas pertanyaan customer.`
              : "AI Inbox menggunakan rule-based engine bawaan (tidak memerlukan API key)."}
          </p>
        </div>
      </div>

      {/* Sub Tabs */}
      <div className="flex border-b border-white/8 space-x-6 overflow-x-auto">
        {[
          { id: "ai_config", label: "AI Configuration" },
          { id: "idle_action", label: "Idle Action" },
          { id: "api_integration", label: "API Integration" },
          { id: "crm_integration", label: "CRM Integration" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSettingsSubsection(tab.id)}
            className={`pb-3 text-xs font-semibold uppercase tracking-wider border-b-2 transition whitespace-nowrap ${
              settingsSubsection === tab.id
                ? "border-cyan-400 text-cyan-400 font-bold"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            {tab.label}
          </button>
        ))}
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
              <p className="text-xs text-slate-400 mt-1">
                Pilih model AI dan konfigurasi parameter teknis backend yang digunakan untuk membalas pesan di Inbox.
              </p>
            </div>
          </div>

          <form onSubmit={handleSaveAIConfig} className="space-y-5">
            <label className="flex items-center gap-3 rounded-xl border border-white/8 bg-white/[0.03] p-4 text-xs text-slate-300">
              <input
                type="checkbox"
                checked={providerEnabled}
                onChange={(e) => setProviderEnabled(e.target.checked)}
                className="h-4 w-4 rounded border-white/12 bg-white/4 text-cyan-500"
              />
              Aktifkan provider AI production dari dashboard config
            </label>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Provider Utama</label>
                <Select value={provider} onChange={(e) => handleProviderChange(e.target.value as AIProviderKind)}>
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
                  value={(PROVIDER_MODELS[provider] || []).some((m) => m.value === model) ? model : "custom"}
                  onChange={(e) => {
                    const val = e.target.value;
                    setModel(val === "custom" ? "" : val);
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
                      onChange={(e) => setModel(e.target.value)}
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
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Masukkan API key"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Base URL Custom</label>
                <Input
                  value={baseUrl}
                  onChange={(e) => setBaseUrl(e.target.value)}
                  placeholder="Opsional (untuk custom endpoint)"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Max Tokens</label>
                <Input
                  type="number"
                  value={maxTokens}
                  onChange={(e) => setMaxTokens(Number(e.target.value))}
                  placeholder="Contoh: 2000"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Kuota Limit Bulanan</label>
                <Input
                  type="number"
                  value={quotaLimit}
                  onChange={(e) => setQuotaLimit(Number(e.target.value))}
                  placeholder="Contoh: 999999999"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Embedding Model</label>
                <Input value={embeddingModel} onChange={(e) => setEmbeddingModel(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Vector Store</label>
                <Select value={vectorStore} onChange={(e) => setVectorStore(e.target.value as VectorStoreKind)}>
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
              <h2 className="text-sm font-bold uppercase tracking-wider text-white">Idle Action</h2>
              <p className="text-xs text-slate-400 mt-1">
                Atur apa yang dilakukan sistem jika obrolan di Inbox menganggur tanpa respons.
              </p>
            </div>
          </div>

          <form onSubmit={handleSaveIdleAction} className="space-y-5">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Jeda Waktu Idle (Jam)</label>
                <Input
                  type="number"
                  min="1"
                  value={idleTimeoutHours}
                  onChange={(e) => setIdleTimeoutHours(Number(e.target.value))}
                />
                <p className="text-[10px] text-slate-500">Sesi dinyatakan idle jika tidak ada pesan baru selama rentang ini.</p>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Aksi Otomatis Saat Idle</label>
                <Select
                  value={idleActionType}
                  onChange={(e) => setIdleActionType(e.target.value as "followup" | "close" | "handoff")}
                >
                  <option value="followup">Kirim pesan follow-up otomatis</option>
                  <option value="close">Tutup sesi percakapan otomatis (Auto Close)</option>
                  <option value="handoff">Pindahkan tiket ke antrean Handoff Admin</option>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Teks Pesan Idle</label>
              <Textarea
                value={idleMessage}
                onChange={(e) => setIdleMessage(e.target.value)}
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
              <h2 className="text-sm font-bold uppercase tracking-wider text-white">API Integration</h2>
              <p className="text-xs text-slate-400 mt-1">
                Hubungkan chatbot dengan sistem eksternal melalui API agar bisa mengambil data real-time.
              </p>
            </div>
          </div>

          <form onSubmit={handleSaveApiIntegration} className="space-y-6">
            {/* Qontak API */}
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
                  <Input value={qontakApiUrl} onChange={(e) => setQontakApiUrl(e.target.value)} className="h-9 text-xs" disabled={isQontakConnected} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-semibold text-slate-300">Access Token / Bearer Token</label>
                  <Input type="password" value={qontakAccessToken} onChange={(e) => setQontakAccessToken(e.target.value)} placeholder="••••••••••••••••••••••••" className="h-9 text-xs" disabled={isQontakConnected} />
                </div>
              </div>
            </div>

            {/* Inventory API */}
            <div className="rounded-xl border border-white/8 bg-white/[0.02] p-5 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Radio className={`h-3 w-3 ${isInventoryConnected ? "text-emerald-400 animate-pulse" : "text-slate-500"}`} />
                  Inventory API (Stok Suku Cadang)
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
                <label className="text-[10px] font-semibold text-slate-300">Local Inventory API Endpoint</label>
                <Input value={inventoryApiUrl} onChange={(e) => setInventoryApiUrl(e.target.value)} className="h-9 text-xs" disabled={isInventoryConnected} />
                <p className="text-[9px] text-slate-500">Bot dapat mengecek ketersediaan stok secara real-time saat ditanya pelanggan.</p>
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
              <p className="text-xs text-slate-400 mt-1">
                Sinkronisasi data dari chatbot ke CRM agar setiap prospek baru terdaftar otomatis di Contacts.
              </p>
            </div>
          </div>

          <form onSubmit={handleSaveCrmIntegration} className="space-y-5">
            <label className="flex items-center gap-3 rounded-xl border border-white/8 bg-white/[0.03] p-4 text-xs text-slate-300">
              <input
                type="checkbox"
                checked={autoSyncToCrm}
                onChange={(e) => setAutoSyncToCrm(e.target.checked)}
                className="h-4 w-4 rounded border-white/12 bg-white/4 text-cyan-500"
              />
              Aktifkan sinkronisasi otomatis kontak baru langsung ke CRM database
            </label>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Tahap Pipeline Default</label>
                <Select value={defaultLeadStage} onChange={(e) => setDefaultLeadStage(e.target.value)}>
                  <option value="Interested">Interested / Tertarik</option>
                  <option value="Qualified Lead">Qualified Lead / Prospek Layak</option>
                  <option value="Proposal Sent">Proposal Sent / Penawaran Terkirim</option>
                  <option value="Negotiation">Negotiation / Negosiasi</option>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Owner Default Prospek Baru</label>
                <Select value={crmOwner} onChange={(e) => setCrmOwner(e.target.value)}>
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
  );
}
