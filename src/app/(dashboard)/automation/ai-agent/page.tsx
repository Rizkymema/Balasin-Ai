"use client";

import { useEffect, useState, type FormEvent } from "react";
import {
  Bot,
  Check,
  Play,
  Send,
  Shield,
  Sliders,
  Sparkles,
  ArrowLeft,
  Loader2,
  MessageSquare,
  Zap,
} from "lucide-react";
import Link from "next/link";

import { useDashboardConfig } from "@/hooks/use-dashboard-config";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

interface TestMessage {
  sender: "user" | "ai";
  text: string;
  confidence?: number;
  grounded?: boolean;
}

export default function AIAgentPage() {
  const { config, patchConfig, isLoading } = useDashboardConfig();
  const [isSaved, setIsSaved] = useState(false);

  const [agentName, setAgentName] = useState("");
  const [language, setLanguage] = useState("id");
  const [tone, setTone] = useState("casual");
  const [confidence, setConfidence] = useState(80);
  const [fallbackMsg, setFallbackMsg] = useState("");
  const [replyInstructions, setReplyInstructions] = useState("");
  const [replyStyleExample, setReplyStyleExample] = useState("");
  const [greetingKeywords, setGreetingKeywords] = useState("");
  const [greetingTemplate, setGreetingTemplate] = useState("");
  const [blacklist, setBlacklist] = useState("");
  const [autoReplyEnabled, setAutoReplyEnabled] = useState(true);
  const [safetyMode, setSafetyMode] = useState<"strict" | "balanced" | "aggressive">("balanced");

  const [testInput, setTestInput] = useState("");
  const [testMessages, setTestMessages] = useState<TestMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    if (!config) return;
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
    setTestMessages([
      {
        sender: "ai",
        text: `Halo! Saya ${config.aiAgent.name}. Tanyakan apa saja untuk menguji jawaban saya.`,
      },
    ]);
  }, [config]);

  const buildDraftAgentConfig = () => ({
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
        .map((k) => k.trim())
        .filter(Boolean),
      greetingTemplate,
      blacklist: blacklist
        .split(",")
        .map((k) => k.trim())
        .filter(Boolean),
      autoReplyEnabled,
      safetyMode,
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
    if (!testInput.trim()) return;

    const userMsg = testInput.trim();
    setTestMessages((prev) => [...prev, { sender: "user", text: userMsg }]);
    setTestInput("");
    setIsTyping(true);

    try {
      const response = await fetch("/api/ai-agent/preview", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMsg,
          config: buildDraftAgentConfig(),
        }),
      });

      if (!response.ok) throw new Error("Preview gagal.");

      const payload = (await response.json()) as {
        ok: boolean;
        data: { reply?: string; confidence: number; grounded: boolean };
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
        { sender: "ai", text: fallbackMsg, confidence: 45, grounded: false },
      ]);
    } finally {
      setIsTyping(false);
    }
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
            <Link
              href="/automation"
              className="inline-flex items-center gap-1.5 text-[11px] text-slate-400 hover:text-white transition"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Automation
            </Link>
          </div>
          <h1 className="flex items-center gap-2.5 text-2xl font-bold text-white">
            <Bot className="h-6 w-6 text-cyan-400" />
            AI agents
            <Badge className="bg-cyan-500 text-slate-950 text-[9px] font-extrabold px-1.5 py-0.5 rounded">
              NEW
            </Badge>
          </h1>
          <p className="mt-1 text-xs text-slate-400">
            Atur persona, gaya bahasa, dan kemampuan respons AI agent yang terhubung ke Inbox.
          </p>
        </div>

        {/* Inbox connection badge */}
        <div className="flex items-center gap-2 rounded-xl border border-cyan-500/20 bg-cyan-950/20 px-4 py-2.5 text-xs">
          <MessageSquare className="h-4 w-4 text-cyan-400" />
          <span className="text-slate-300">
            Terhubung ke{" "}
            <Link href="/inbox" className="font-bold text-cyan-400 hover:underline">
              Inbox
            </Link>{" "}
            — perubahan aktif seketika
          </span>
          <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
        </div>
      </div>

      {/* Status Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-cyan-500/15 bg-gradient-to-r from-cyan-950/25 via-blue-950/15 to-transparent p-5">
        <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-cyan-400/8 blur-3xl" />
        <div className="relative z-10 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-cyan-400/20 bg-cyan-950/40">
              <Bot className="h-6 w-6 text-cyan-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-bold text-white">{agentName || "AI Assistant"}</span>
                <span className={`inline-flex h-2 w-2 rounded-full ${autoReplyEnabled ? "bg-emerald-400 animate-pulse" : "bg-slate-600"}`} />
                <span className={`text-[10px] font-bold ${autoReplyEnabled ? "text-emerald-400" : "text-slate-500"}`}>
                  {autoReplyEnabled ? "Auto Reply Aktif" : "Auto Reply Nonaktif"}
                </span>
              </div>
              <div className="flex items-center gap-3 mt-1 text-[11px] text-slate-400">
                <span>Bahasa: <strong className="text-slate-300">{language === "id" ? "Bahasa Indonesia" : "English"}</strong></span>
                <span>·</span>
                <span>Tone: <strong className="text-slate-300">{tone}</strong></span>
                <span>·</span>
                <span>Threshold: <strong className="text-cyan-400">{confidence}%</strong></span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/inbox"
              className="inline-flex items-center gap-1.5 rounded-lg border border-cyan-400/20 bg-cyan-950/30 px-4 py-2 text-[11px] font-bold text-cyan-400 transition hover:bg-cyan-950/50"
            >
              <Zap className="h-3.5 w-3.5" />
              Lihat di Inbox
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
        {/* Persona Controls Form */}
        <div className="space-y-6 lg:col-span-2">
          <form onSubmit={handleSaveAgent} className="glass-panel rounded-xl p-6 space-y-6">
            <div>
              <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-cyan-400 mb-1">
                <Sliders className="h-4 w-4" />
                Persona & Output Control
              </h3>
              <p className="text-[11px] text-slate-400">Atur profil, gaya bahasa, dan tata cara respons AI.</p>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Nama AI Agent</label>
                <Input value={agentName} onChange={(e) => setAgentName(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Bahasa Utama</label>
                <Select value={language} onChange={(e) => setLanguage(e.target.value)}>
                  <option value="id">Bahasa Indonesia</option>
                  <option value="en">English</option>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Gaya Bahasa</label>
                <Select value={tone} onChange={(e) => setTone(e.target.value)}>
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
                  onChange={(e) => setReplyInstructions(e.target.value)}
                  rows={4}
                  placeholder="Contoh: Jawab singkat, pakai kata saya, panggil customer dengan kak..."
                />
                <p className="text-[10px] text-slate-500">Instruksikan bot mengenai gaya bicara dan batasan respons.</p>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Contoh Gaya Bicara</label>
                <Textarea
                  value={replyStyleExample}
                  onChange={(e) => setReplyStyleExample(e.target.value)}
                  rows={4}
                  placeholder="Contoh: Halo kak, saya bantu cek dulu ya..."
                />
                <p className="text-[10px] text-slate-500">Contoh sapaan agar AI menirunya.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Keyword Sapaan Tambahan</label>
                <Input
                  value={greetingKeywords}
                  onChange={(e) => setGreetingKeywords(e.target.value)}
                  placeholder="Contoh: oi, punten, bang, min"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Template Sapaan</label>
                <Textarea
                  value={greetingTemplate}
                  onChange={(e) => setGreetingTemplate(e.target.value)}
                  rows={3}
                  placeholder="Gunakan {businessName}, {agentName}, {address}, {businessHours}"
                />
                <p className="text-[10px] text-slate-500">
                  Placeholder: <code>{"{businessName}"}</code>, <code>{"{agentName}"}</code>.
                </p>
              </div>
            </div>

            <div className="my-2 h-[1px] bg-white/8" />

            <div>
              <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-cyan-400 mb-1">
                <Shield className="h-4 w-4" />
                Safety & Automation
              </h3>
              <p className="text-[11px] text-slate-400">Pengaturan confidence threshold dan guardrail keamanan.</p>
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
                  onChange={(e) => setConfidence(Number(e.target.value))}
                  className="h-2 w-full cursor-pointer rounded-lg bg-white/10 accent-cyan-400"
                />
                <p className="text-[10px] text-slate-500">
                  Respons di bawah {confidence}% akan dialihkan ke admin (fallback).
                </p>
              </div>

              <div className="space-y-3 rounded-xl border border-white/8 bg-white/[0.03] p-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Safety Mode</label>
                  <Select
                    value={safetyMode}
                    onChange={(e) => setSafetyMode(e.target.value as "strict" | "balanced" | "aggressive")}
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
                    onChange={(e) => setAutoReplyEnabled(e.target.checked)}
                    className="h-4 w-4 rounded border-white/12 bg-white/4 text-cyan-500"
                  />
                  Aktifkan auto reply untuk channel yang terhubung
                </label>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Pesan Fallback</label>
              <Textarea value={fallbackMsg} onChange={(e) => setFallbackMsg(e.target.value)} rows={2} />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Topik Terlarang / Blacklist</label>
              <Input
                value={blacklist}
                onChange={(e) => setBlacklist(e.target.value)}
                placeholder="Contoh: judi, kasar, kompetitor"
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              {isSaved ? (
                <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                  <Check className="h-4 w-4" />
                  Persona bot berhasil disimpan! Inbox sudah diperbarui.
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
                  className={`flex max-w-[85%] flex-col ${isUser ? "ml-auto items-end" : "mr-auto items-start"}`}
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
              placeholder="Tanya: Di mana alamat toko?"
              value={testInput}
              onChange={(e) => setTestInput(e.target.value)}
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

          <p className="mt-3 text-center text-[9px] text-slate-600">
            Hasil playground menggunakan konfigurasi yang sedang diedit, bukan yang tersimpan.
          </p>
        </div>
      </div>
    </div>
  );
}
