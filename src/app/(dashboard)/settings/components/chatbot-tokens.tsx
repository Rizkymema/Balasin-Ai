"use client";

import { useEffect, useState } from "react";
import { Check, FileCode, Bot, KeyRound } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useDashboardConfig } from "@/lib/dashboard-config";
import type { AIProviderKind } from "@/types/dashboard-config";

export function ChatbotTokens() {
  const { config, patchConfig } = useDashboardConfig();

  // Bot API Token State
  const [chatbotApiToken, setChatbotApiToken] = useState("chatbot_api_tok_x8f9a2b4c6e1d3");
  const [chatbotTokenCopied, setChatbotTokenCopied] = useState(false);
  const [isSavedChatbotToken, setIsSavedChatbotToken] = useState(false);

  // Webhook Runtime Config State
  const [publicAppUrl, setPublicAppUrl] = useState(config.runtime.publicAppUrl);
  const [dashboardWorkerSecret, setDashboardWorkerSecret] = useState(config.runtime.workerSecret);
  const [isSavedRuntime, setIsSavedRuntime] = useState(false);

  // LLM Provider API Keys State
  const [defaultLlmProvider, setDefaultLlmProvider] = useState<AIProviderKind>(config.aiProvider.provider || "openrouter");
  const [openRouterKey, setOpenRouterKey] = useState(config.aiProvider.provider === "openrouter" ? config.aiProvider.apiKey : "");
  const [openAiKey, setOpenAiKey] = useState(config.aiProvider.provider === "openai" ? config.aiProvider.apiKey : "");
  const [anthropicKey, setAnthropicKey] = useState(config.aiProvider.provider === "anthropic" ? config.aiProvider.apiKey : "");
  const [geminiKey, setGeminiKey] = useState(config.aiProvider.provider === "gemini" ? config.aiProvider.apiKey : "");
  const [isSavedLlm, setIsSavedLlm] = useState(false);

  useEffect(() => {
    setPublicAppUrl(config.runtime.publicAppUrl);
    setDashboardWorkerSecret(config.runtime.workerSecret);
    setDefaultLlmProvider(config.aiProvider.provider || "openrouter");
    if (config.aiProvider.provider === "openrouter") setOpenRouterKey(config.aiProvider.apiKey);
    if (config.aiProvider.provider === "openai") setOpenAiKey(config.aiProvider.apiKey);
    if (config.aiProvider.provider === "anthropic") setAnthropicKey(config.aiProvider.apiKey);
    if (config.aiProvider.provider === "gemini") setGeminiKey(config.aiProvider.apiKey);
  }, [config]);

  const handleSaveRuntime = (e: React.FormEvent) => {
    e.preventDefault();
    patchConfig((current) => ({
      ...current,
      runtime: {
        publicAppUrl: publicAppUrl.trim(),
        workerSecret: dashboardWorkerSecret.trim(),
      },
    }));
    setIsSavedRuntime(true);
    setTimeout(() => setIsSavedRuntime(false), 2000);
  };

  const handleSaveLlm = (e: React.FormEvent) => {
    e.preventDefault();
    
    let apiKeyToSave = "";
    if (defaultLlmProvider === "openrouter") apiKeyToSave = openRouterKey;
    else if (defaultLlmProvider === "openai") apiKeyToSave = openAiKey;
    else if (defaultLlmProvider === "anthropic") apiKeyToSave = anthropicKey;
    else if (defaultLlmProvider === "gemini") apiKeyToSave = geminiKey;

    patchConfig((current) => ({
      ...current,
      aiProvider: {
        ...current.aiProvider,
        enabled: Boolean(apiKeyToSave.trim()),
        provider: defaultLlmProvider,
        apiKey: apiKeyToSave.trim(),
      },
    }));
    
    setIsSavedLlm(true);
    setTimeout(() => setIsSavedLlm(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Bot API Token Generator */}
      <Card className="glass-panel p-6 max-w-3xl border-white/8">
        <div className="border-b border-white/8 pb-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-950/30 p-3 text-emerald-300">
              <FileCode className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-white">Chatbot API Token</h2>
              <p className="text-xs text-slate-400 font-normal">Tempat membuat token API khusus untuk integrasi fungsi otomatisasi bot.</p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-lg border border-white/8 bg-[#020611] p-4">
            <span className="block text-[9px] font-bold uppercase text-slate-500">Chatbot API Key</span>
            <div className="flex items-center justify-between mt-1">
              <code className="text-xs font-mono text-emerald-400">{chatbotApiToken}</code>
              <button onClick={async () => {
                await navigator.clipboard.writeText(chatbotApiToken);
                setChatbotTokenCopied(true);
                setTimeout(() => setChatbotTokenCopied(false), 2000);
              }} className="text-emerald-400 hover:text-emerald-300 text-xs font-bold transition">
                {chatbotTokenCopied ? "Disalin \u2713" : "Salin Token"}
              </button>
            </div>
          </div>

          <div className="flex justify-between items-center pt-2">
            {isSavedChatbotToken ? (
              <span className="text-xs text-emerald-400 font-semibold animate-pulse">Chatbot API Token baru digenerasi!</span>
            ) : <div />}
            <Button onClick={() => {
              setIsSavedChatbotToken(true);
              setChatbotApiToken("chatbot_api_tok_" + Math.random().toString(36).substring(2, 18) + Math.random().toString(36).substring(2, 6));
              setTimeout(() => setIsSavedChatbotToken(false), 2000);
            }} className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs">
              Generasi Token Chatbot Baru
            </Button>
          </div>
        </div>
      </Card>

      {/* LLM Provider API Keys */}
      <form onSubmit={handleSaveLlm} className="glass-panel max-w-3xl space-y-5 rounded-xl p-6 border-white/8">
        <div className="border-b border-white/8 pb-4 mb-2">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl border border-cyan-500/20 bg-cyan-950/30 p-3 text-cyan-400">
              <Bot className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-white">LLM Provider API Keys</h2>
              <p className="text-[11px] text-slate-400 mt-1">Integrasikan API eksternal (OpenRouter, OpenAI, Gemini) untuk kecerdasan AI Agent Anda.</p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Default Provider Utama</label>
            <select
              className="w-full h-10 rounded border border-white/10 bg-black/30 px-3 text-xs text-slate-300 focus:outline-none focus:ring-1 focus:ring-cyan-400"
              value={defaultLlmProvider}
              onChange={(e) => setDefaultLlmProvider(e.target.value as AIProviderKind)}
            >
              <option value="openrouter">OpenRouter (Rekomendasi)</option>
              <option value="openai">OpenAI (ChatGPT)</option>
              <option value="gemini">Google Gemini</option>
              <option value="anthropic">Anthropic Claude</option>
            </select>
            <p className="text-[10px] text-slate-500">Provider ini akan digunakan secara default oleh semua AI Agent kecuali di-override di level agent.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5"><KeyRound className="h-3 w-3 text-emerald-400" /> OpenRouter API Key</label>
              <Input
                type="password"
                value={openRouterKey}
                onChange={(e) => setOpenRouterKey(e.target.value)}
                placeholder="sk-or-v1-..."
                className="h-10 text-xs font-mono bg-black/20"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5"><KeyRound className="h-3 w-3 text-slate-300" /> OpenAI API Key</label>
              <Input
                type="password"
                value={openAiKey}
                onChange={(e) => setOpenAiKey(e.target.value)}
                placeholder="sk-proj-..."
                className="h-10 text-xs font-mono bg-black/20"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5"><KeyRound className="h-3 w-3 text-blue-400" /> Google Gemini API Key</label>
              <Input
                type="password"
                value={geminiKey}
                onChange={(e) => setGeminiKey(e.target.value)}
                placeholder="AIzaSy..."
                className="h-10 text-xs font-mono bg-black/20"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5"><KeyRound className="h-3 w-3 text-amber-400" /> Anthropic API Key</label>
              <Input
                type="password"
                value={anthropicKey}
                onChange={(e) => setAnthropicKey(e.target.value)}
                placeholder="sk-ant-api03-..."
                className="h-10 text-xs font-mono bg-black/20"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-white/8 pt-4">
          {isSavedLlm ? (
            <span className="flex items-center gap-1.5 text-xs font-bold text-cyan-400">
              <Check className="h-4 w-4" /> Kunci API LLM berhasil disimpan!
            </span>
          ) : (
            <div />
          )}
          <Button type="submit" className="bg-cyan-500 hover:bg-cyan-400 text-black text-xs h-9">Simpan Konfigurasi LLM</Button>
        </div>
      </form>

      {/* Bot Webhook & Platform Settings (Saves Public URL & Worker Secret) */}
      <form onSubmit={handleSaveRuntime} className="glass-panel max-w-3xl space-y-5 rounded-xl p-6 border-white/8">
        <div className="border-b border-white/8 pb-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
            Bot Webhook & Platform Settings (Runtime Config)
          </h3>
          <p className="text-[10px] text-slate-500 mt-1">Konfigurasi endpoint webhook internal serta worker secret autentikasi.</p>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-300">Public App URL (Untuk Sinkronisasi Webhook)</label>
          <Input
            value={publicAppUrl}
            onChange={(event) => setPublicAppUrl(event.target.value)}
            placeholder="https://domain-anda.com"
            className="h-10 text-xs"
          />
          <p className="text-[10px] text-slate-500">
            Digunakan untuk membentuk webhook endpoint URL serta generator script widget di website.
          </p>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-300">Chatbot Worker Token (Worker Secret)</label>
          <Input
            type="password"
            value={dashboardWorkerSecret}
            onChange={(event) => setDashboardWorkerSecret(event.target.value)}
            placeholder="worker-secret-anda"
            className="h-10 text-xs font-mono"
          />
          <p className="text-[10px] text-slate-500">
            Secret token khusus yang digunakan untuk mengautentikasi panggilan endpoint asisten AI tanpa login manual.
          </p>
        </div>

        <div className="flex items-center justify-between border-t border-white/8 pt-4">
          {isSavedRuntime ? (
            <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
              <Check className="h-4 w-4" /> Token Chatbot disimpan!
            </span>
          ) : (
            <div />
          )}
          <Button type="submit">Simpan Konfigurasi Token</Button>
        </div>
      </form>
    </div>
  );
}
