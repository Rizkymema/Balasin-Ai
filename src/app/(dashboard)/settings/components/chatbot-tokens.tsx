"use client";

import { useEffect, useState } from "react";
import { Bot, Check, KeyRound } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useDashboardConfig } from "@/hooks/use-dashboard-config";
import type { AIProviderKind } from "@/types/dashboard-config";

function getDefaultModelForProvider(provider: AIProviderKind) {
  switch (provider) {
    case "openrouter":
      return "openai/gpt-4.1-mini";
    case "gemini":
      return "gemini-2.5-flash";
    case "anthropic":
      return "claude-3-5-sonnet-latest";
    case "openai":
    default:
      return "gpt-4.1-mini";
  }
}

export function ChatbotTokens() {
  const { config, patchConfig } = useDashboardConfig();

  const [publicAppUrl, setPublicAppUrl] = useState(config.runtime.publicAppUrl);
  const [dashboardWorkerSecret, setDashboardWorkerSecret] = useState(config.runtime.workerSecret);
  const [isSavedRuntime, setIsSavedRuntime] = useState(false);

  const [defaultLlmProvider, setDefaultLlmProvider] = useState<AIProviderKind>(config.aiProvider.provider || "openai");
  const [providerApiKey, setProviderApiKey] = useState(config.aiProvider.apiKey);
  const [providerModel, setProviderModel] = useState(
    config.aiProvider.model || getDefaultModelForProvider(config.aiProvider.provider || "openai"),
  );
  const [providerBaseUrl, setProviderBaseUrl] = useState(config.aiProvider.baseUrl);
  const [isSavedLlm, setIsSavedLlm] = useState(false);
  const [llmError, setLlmError] = useState<string | null>(null);
  const hasStoredProviderApiKey = Boolean(config.aiProvider.apiKeyConfigured);

  useEffect(() => {
    setPublicAppUrl(config.runtime.publicAppUrl);
    setDashboardWorkerSecret(config.runtime.workerSecret);
    const activeProvider = config.aiProvider.provider || "openai";
    setDefaultLlmProvider(activeProvider);
    setProviderApiKey(config.aiProvider.apiKey);
    setProviderModel(config.aiProvider.model || getDefaultModelForProvider(activeProvider));
    setProviderBaseUrl(config.aiProvider.baseUrl);
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
    const nextApiKey = providerApiKey.trim();
    const providerChanged = defaultLlmProvider !== config.aiProvider.provider;

    if (providerChanged && !nextApiKey) {
      setLlmError("Masukkan API key baru saat mengganti provider AI.");
      return;
    }

    patchConfig((current) => ({
      ...current,
      aiProvider: {
        ...current.aiProvider,
        enabled: nextApiKey ? true : current.aiProvider.enabled,
        provider: defaultLlmProvider,
        apiKey: nextApiKey,
        model: providerModel.trim(),
        baseUrl: providerBaseUrl.trim(),
      },
    }));

    setLlmError(null);
    setIsSavedLlm(true);
    setTimeout(() => setIsSavedLlm(false), 2000);
  };

  return (
    <div className="space-y-6">
      <Card className="p-6 border-slate-200 bg-white max-w-3xl shadow-2xs">
        <form onSubmit={handleSaveLlm} className="space-y-5">
          <div className="border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 font-bold">
                <Bot className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900">Integrasi API AI Chatbot Utama</h2>
                <p className="text-xs text-slate-500 mt-0.5">Sistem hanya memakai satu provider AI aktif untuk semua fitur chatbot dan balasan otomatis.</p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-900">Provider AI Utama</label>
              <select
                className="w-full h-9 rounded-md border border-slate-200 bg-slate-50 px-3 text-xs font-semibold text-slate-900 focus:outline-none focus:border-blue-600"
                value={defaultLlmProvider}
                onChange={(e) => {
                  const nextProvider = e.target.value as AIProviderKind;
                  if (!providerModel.trim() || providerModel === getDefaultModelForProvider(defaultLlmProvider)) {
                    setProviderModel(getDefaultModelForProvider(nextProvider));
                  }
                  setDefaultLlmProvider(nextProvider);
                }}
              >
                <option value="openrouter">OpenRouter (Rekomendasi)</option>
                <option value="openai">OpenAI (ChatGPT)</option>
                <option value="gemini">Google Gemini</option>
                <option value="anthropic">Anthropic Claude</option>
              </select>
              <p className="text-[10px] text-slate-500 font-medium">Hanya provider ini yang dipakai chatbot sebagai sumber API AI utama.</p>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between gap-3">
                <label className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                  <KeyRound className="h-3.5 w-3.5 text-blue-600" />
                  API Key Provider Aktif
                </label>
                {hasStoredProviderApiKey ? (
                  <Badge variant="success" className="text-[10px]">
                    <Check className="h-3 w-3 mr-1" /> API key tersimpan
                  </Badge>
                ) : null}
              </div>
              <Input
                type="password"
                value={providerApiKey}
                onChange={(e) => {
                  setProviderApiKey(e.target.value);
                  setLlmError(null);
                }}
                placeholder={
                  hasStoredProviderApiKey
                    ? "Key dilindungi. Isi hanya untuk mengganti API key."
                    : "Masukkan API key provider yang dipilih"
                }
                className="h-9 bg-slate-50 font-mono text-xs"
              />
              <p className="text-[10px] text-slate-500 font-medium">
                API key tidak pernah ditampilkan kembali di dashboard. Kosongkan saat menyimpan model yang sama untuk mempertahankan key yang sudah ada.
              </p>
              {llmError ? <p className="text-xs font-semibold text-red-600">{llmError}</p> : null}
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-900">Model</label>
                <Input
                  value={providerModel}
                  onChange={(e) => setProviderModel(e.target.value)}
                  placeholder={getDefaultModelForProvider(defaultLlmProvider)}
                  className="h-9 bg-slate-50 font-mono text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-900">Custom Base URL</label>
                <Input
                  value={providerBaseUrl}
                  onChange={(e) => setProviderBaseUrl(e.target.value)}
                  placeholder="Opsional, contoh: https://api.openai.com/v1"
                  className="h-9 bg-slate-50 text-xs"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-slate-100 pt-4">
            {isSavedLlm ? (
              <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-600">
                <Check className="h-4 w-4" /> Kunci API LLM berhasil disimpan!
              </span>
            ) : (
              <div />
            )}
            <Button type="submit" variant="primary" size="sm" className="px-5">
              Simpan Integrasi AI
            </Button>
          </div>
        </form>
      </Card>

      <Card className="p-6 border-slate-200 bg-white max-w-3xl shadow-2xs">
        <form onSubmit={handleSaveRuntime} className="space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">Runtime Internal Chatbot</h3>
            <p className="mt-0.5 text-xs text-slate-500 font-medium">Konfigurasi URL publik dan secret internal untuk webhook worker. Ini bukan provider API eksternal.</p>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-900">Public App URL (Untuk Sinkronisasi Webhook)</label>
            <Input
              value={publicAppUrl}
              onChange={(event) => setPublicAppUrl(event.target.value)}
              placeholder="https://domain-anda.com"
              className="h-9 text-xs bg-slate-50"
            />
            <p className="text-[10px] text-slate-500 font-medium">
              Digunakan untuk membentuk webhook endpoint URL serta generator script widget di website.
            </p>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-900">Chatbot Worker Token (Worker Secret)</label>
            <Input
              type="password"
              value={dashboardWorkerSecret}
              onChange={(event) => setDashboardWorkerSecret(event.target.value)}
              placeholder="worker-secret-anda"
              className="h-9 text-xs bg-slate-50 font-mono"
            />
            <p className="text-[10px] text-slate-500 font-medium">
              Secret token khusus yang digunakan untuk mengautentikasi panggilan endpoint asisten AI tanpa login manual.
            </p>
          </div>

          <div className="flex items-center justify-between border-t border-slate-100 pt-4">
            {isSavedRuntime ? (
              <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-600">
                <Check className="h-4 w-4" /> Konfigurasi runtime disimpan!
              </span>
            ) : (
              <div />
            )}
            <Button type="submit" variant="primary" size="sm" className="px-5">
              Simpan Konfigurasi Runtime
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
