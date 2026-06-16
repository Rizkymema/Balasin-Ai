"use client";

import { useEffect, useState, type FormEvent } from "react";
import {
  Bot,
  Check,
  Database,
  KeyRound,
  Play,
  Send,
  Shield,
  Sliders,
  Sparkles,
} from "lucide-react";

import { useDashboardConfig } from "@/hooks/use-dashboard-config";
import type { AIProviderKind, VectorStoreKind } from "@/types/dashboard-config";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

interface TestMessage {
  sender: "user" | "ai";
  text: string;
  confidence?: number;
  grounded?: boolean;
}

export default function AIAgentPage() {
  const { config, patchConfig } = useDashboardConfig();

  const [agentName, setAgentName] = useState(config.aiAgent.name);
  const [language, setLanguage] = useState(config.aiAgent.language);
  const [tone, setTone] = useState(config.aiAgent.tone);
  const [confidence, setConfidence] = useState(config.aiAgent.confidenceThreshold);
  const [fallbackMsg, setFallbackMsg] = useState(config.aiAgent.fallbackMessage);
  const [replyInstructions, setReplyInstructions] = useState(
    config.aiAgent.replyInstructions,
  );
  const [replyStyleExample, setReplyStyleExample] = useState(
    config.aiAgent.replyStyleExample,
  );
  const [greetingKeywords, setGreetingKeywords] = useState(
    config.aiAgent.greetingKeywords.join(", "),
  );
  const [greetingTemplate, setGreetingTemplate] = useState(
    config.aiAgent.greetingTemplate,
  );
  const [blacklist, setBlacklist] = useState(config.aiAgent.blacklist.join(", "));
  const [autoReplyEnabled, setAutoReplyEnabled] = useState(config.aiAgent.autoReplyEnabled);
  const [safetyMode, setSafetyMode] = useState(config.aiAgent.safetyMode);
  const [isSaved, setIsSaved] = useState(false);

  const [providerEnabled, setProviderEnabled] = useState(config.aiProvider.enabled);
  const [provider, setProvider] = useState<AIProviderKind>(config.aiProvider.provider);
  const [apiKey, setApiKey] = useState(config.aiProvider.apiKey);
  const [model, setModel] = useState(config.aiProvider.model);
  const [embeddingModel, setEmbeddingModel] = useState(config.aiProvider.embeddingModel);
  const [baseUrl, setBaseUrl] = useState(config.aiProvider.baseUrl);
  const [vectorStore, setVectorStore] = useState<VectorStoreKind>(
    config.aiProvider.vectorStore,
  );

  const [testInput, setTestInput] = useState("");
  const [testMessages, setTestMessages] = useState<TestMessage[]>([
    {
      sender: "ai",
      text: `Halo! Saya ${config.aiAgent.name}. Tanyakan apa saja tentang bisnis Anda untuk menguji jawaban saya.`,
    },
  ]);
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
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
    setProviderEnabled(config.aiProvider.enabled);
    setProvider(config.aiProvider.provider);
    setApiKey(config.aiProvider.apiKey);
    setModel(config.aiProvider.model);
    setEmbeddingModel(config.aiProvider.embeddingModel);
    setBaseUrl(config.aiProvider.baseUrl);
    setVectorStore(config.aiProvider.vectorStore);
  }, [config]);

  const buildDraftConfig = () => ({
    ...config,
    aiAgent: {
      ...config.aiAgent,
      name: agentName,
      language,
      tone,
      confidenceThreshold: confidence,
      fallbackMessage: fallbackMsg,
      replyInstructions,
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

  const handleSave = (event: FormEvent) => {
    event.preventDefault();

    patchConfig(() => buildDraftConfig());

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
          config: buildDraftConfig(),
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold text-white">
          <Bot className="h-6 w-6 text-cyan-400" />
          Pusat Balasan
        </h1>
        <p className="mt-1 text-xs text-slate-400">
          Persona AI, threshold, fallback, dan credential provider production sekarang bisa diisi dari dashboard.
        </p>
      </div>

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <form onSubmit={handleSave} className="glass-panel rounded-xl p-5 space-y-5">
            <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-cyan-400">
              <Sliders className="h-4 w-4" />
              Persona & Output Control
            </h3>

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
                <label className="text-xs font-semibold text-slate-300">
                  Instruksi Balasan AI
                </label>
                <Textarea
                  value={replyInstructions}
                  onChange={(event) => setReplyInstructions(event.target.value)}
                  rows={4}
                  placeholder="Contoh: Jawab singkat, pakai kata saya, panggil customer dengan kak, jangan terlalu formal."
                />
                <p className="text-[10px] leading-5 text-slate-500">
                  Gunakan instruksi seperti: singkat, formal, santai, pakai saya,
                  pakai kami, panggil kak, atau panggil Bapak/Ibu.
                </p>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  Contoh Gaya Bicara Anda
                </label>
                <Textarea
                  value={replyStyleExample}
                  onChange={(event) => setReplyStyleExample(event.target.value)}
                  rows={4}
                  placeholder="Contoh: Halo kak, saya bantu cek dulu ya. Kalau mau booking, boleh kirim tipe motor dan jam yang diinginkan."
                />
                <p className="text-[10px] leading-5 text-slate-500">
                  Contoh ini dipakai untuk membaca sapaan, kata ganti, dan nada balasan.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  Keyword Sapaan Tambahan
                </label>
                <Input
                  value={greetingKeywords}
                  onChange={(event) => setGreetingKeywords(event.target.value)}
                  placeholder="Contoh: oi, punten, bang, min"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  Template Sapaan
                </label>
                <Textarea
                  value={greetingTemplate}
                  onChange={(event) => setGreetingTemplate(event.target.value)}
                  rows={3}
                  placeholder="Gunakan {businessName}, {agentName}, {address}, {businessHours}"
                />
                <p className="text-[10px] leading-5 text-slate-500">
                  Placeholder yang bisa dipakai: <code>{`{businessName}`}</code>,{" "}
                  <code>{`{agentName}`}</code>, <code>{`{address}`}</code>,{" "}
                  <code>{`{businessHours}`}</code>.
                </p>
              </div>
            </div>

            <div className="my-2 h-[1px] bg-white/8" />

            <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-cyan-400">
              <Shield className="h-4 w-4" />
              Safety & Automation
            </h3>

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
                <p className="text-[10px] leading-normal text-slate-500">
                  Di bawah {confidence}% AI diarahkan ke admin atau fallback response.
                </p>
              </div>

              <div className="space-y-3 rounded-xl border border-white/8 bg-white/[0.03] p-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Safety Mode</label>
                  <Select
                    value={safetyMode}
                    onChange={(event) =>
                      setSafetyMode(
                        event.target.value as "strict" | "balanced" | "aggressive",
                      )
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
              <label className="text-xs font-semibold text-slate-300">
                Pesan Fallback
              </label>
              <Textarea
                value={fallbackMsg}
                onChange={(event) => setFallbackMsg(event.target.value)}
                rows={2}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">
                Topik Terlarang / Blacklist
              </label>
              <Input
                value={blacklist}
                onChange={(event) => setBlacklist(event.target.value)}
                placeholder="Contoh: judi, kasar, kompetitor"
              />
            </div>

            <div className="my-2 h-[1px] bg-white/8" />

            <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-cyan-400">
              <KeyRound className="h-4 w-4" />
              AI Provider Production
            </h3>

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
                <label className="text-xs font-semibold text-slate-300">Provider</label>
                <Select
                  value={provider}
                  onChange={(event) =>
                    setProvider(event.target.value as AIProviderKind)
                  }
                >
                  <option value="demo">Demo / Playground</option>
                  <option value="openai">OpenAI</option>
                  <option value="openrouter">OpenRouter</option>
                  <option value="anthropic">Anthropic</option>
                  <option value="gemini">Gemini</option>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Model utama</label>
                <Input value={model} onChange={(event) => setModel(event.target.value)} />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">API Key</label>
                <Input
                  type="password"
                  value={apiKey}
                  onChange={(event) => setApiKey(event.target.value)}
                  placeholder="Masukkan API key provider"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Base URL</label>
                <Input
                  value={baseUrl}
                  onChange={(event) => setBaseUrl(event.target.value)}
                  placeholder="Opsional, untuk custom endpoint"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Embedding Model</label>
                <Input
                  value={embeddingModel}
                  onChange={(event) => setEmbeddingModel(event.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Vector Store</label>
                <Select
                  value={vectorStore}
                  onChange={(event) =>
                    setVectorStore(event.target.value as VectorStoreKind)
                  }
                >
                  <option value="none">Belum dipakai</option>
                  <option value="pgvector">PostgreSQL / pgvector</option>
                  <option value="pinecone">Pinecone</option>
                  <option value="supabase">Supabase Vector</option>
                </Select>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-xl border border-white/8 bg-white/[0.03] p-4">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-cyan-400">
                  <Database className="h-4 w-4" />
                  Knowledge Readiness
                </div>
                <p className="mt-3 text-xs leading-6 text-slate-400">
                  Saat vector store sudah dipilih, FAQ dan dokumen knowledge base Anda siap dijadikan grounding AI production.
                </p>
              </div>

              <div className="rounded-xl border border-white/8 bg-white/[0.03] p-4">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-cyan-400">
                  <Sparkles className="h-4 w-4" />
                  Status Saat Ini
                </div>
                <p className="mt-3 text-xs leading-6 text-slate-400">
                  Data provider ini sudah bisa Anda isi dari dashboard, tetapi backend AI live belum saya ubah ke orchestration production penuh.
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-white/8 bg-white/[0.03] p-4">
              <div className="flex items-start gap-3">
                <Sparkles className="mt-0.5 h-4 w-4 text-cyan-300" />
                <p className="text-xs leading-6 text-slate-400">
                  Konfigurasi balasan ini dipakai lintas modul dashboard: inbox, automation,
                  knowledge base, dan channel. Jadi Anda cukup ubah dari sini.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              {isSaved ? (
                <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 animate-fade-in">
                  <Check className="h-4 w-4" />
                  Konfigurasi berhasil disimpan ke dashboard!
                </span>
              ) : (
                <div />
              )}
              <Button type="submit" className="px-6">
                Simpan Konfigurasi
              </Button>
            </div>
          </form>
        </div>

        <div className="glass-panel flex h-[540px] flex-col rounded-xl p-5">
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
                      <span
                        className={message.grounded ? "text-emerald-400" : "text-amber-400"}
                      >
                        {message.grounded ? "Grounded" : "Fallback"}
                      </span>
                    </div>
                  ) : null}
                </div>
              );
            })}

            {isTyping ? (
              <div className="animate-pulse self-start rounded-full bg-white/4 px-3 py-1.5 text-xs font-semibold text-slate-500">
                {agentName} sedang berpikir...
              </div>
            ) : null}
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
    </div>
  );
}
