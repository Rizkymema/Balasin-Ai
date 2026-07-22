"use client";

import { useEffect, useState } from "react";
import {
  Bot,
  PlusCircle,
  Loader2,
  MoreVertical,
  Edit2,
  Copy,
  PowerOff,
  Power,
  Trash2,
  FlaskConical,
  Database,
  Zap,
  UserCheck,
  CheckSquare,
  Square,
  X,
  Send,
  Save,
  FileText,
  AlertTriangle,
  BrainCircuit,
  ChevronDown,
} from "lucide-react";

import { useDashboardConfig } from "@/hooks/use-dashboard-config";
import type { AIAgent } from "@/types/dashboard-config";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dropdown } from "@/components/ui/dropdown";

// ─── Status Badge ─────────────────────────────────────────────────────────────
function AgentStatusBadge({ status }: { status: AIAgent["status"] }) {
  if (status === "Active")
    return <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">Active</Badge>;
  if (status === "Draft")
    return <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/20">Draft</Badge>;
  return <Badge className="bg-slate-500/10 text-slate-400 border-slate-500/20">Inactive</Badge>;
}

// ─── Empty State ──────────────────────────────────────────────────────────────
function EmptyAgentState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[var(--color-border)] py-20 px-4 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[var(--color-brand)]/10 text-[var(--color-brand)] mb-5">
        <BrainCircuit className="h-10 w-10" />
      </div>
      <h3 className="text-xl font-bold text-white mb-2">No AI agent yet</h3>
      <p className="text-sm text-slate-400 mb-6 max-w-md mx-auto">
        Buat AI Agent pertama Anda untuk membantu menjawab pesan pelanggan secara otomatis berdasarkan data bisnis internal.
      </p>
      <Button onClick={onCreate} className="gap-2">
        <PlusCircle className="h-4 w-4" />
        Create AI Agent
      </Button>
    </div>
  );
}

// ─── Test Agent Panel ─────────────────────────────────────────────────────────
function TestAgentPanel({ agent, onClose }: { agent: AIAgent; onClose: () => void }) {
  const [messages, setMessages] = useState<Array<{
    sender: "user" | "ai";
    text: string;
    confidence?: number;
    source?: string;
  }>>([
    { sender: "ai", text: `Halo! Saya ${agent.name}. Ada yang bisa saya bantu?` },
  ]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState("");

  const handleSend = async () => {
    const message = input.trim();
    if (!message || isSending) return;

    const userMsg = { sender: "user" as const, text: message };
    const conversationMessages = [...messages, userMsg];
    setMessages(conversationMessages);
    setInput("");
    setError("");
    setIsSending(true);

    try {
      const response = await fetch("/api/ai-agent/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message,
          agentId: agent.id,
          context: {
            recentMessages: conversationMessages.map((item) => ({
              sender: item.sender === "user" ? "customer" : "ai",
              text: item.text,
            })),
          },
        }),
      });
      const payload = await response.json();
      if (!response.ok || !payload.ok) {
        throw new Error(payload.error || "Gagal menguji AI Agent.");
      }

      setMessages((current) => [
        ...current,
        {
          sender: "ai",
          text: payload.data.reply || "AI tidak menghasilkan balasan.",
          confidence: payload.data.confidence,
          source: payload.data.source,
        },
      ]);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Gagal menguji AI Agent.",
      );
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="relative flex flex-col w-full max-w-lg rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-2xl" style={{ height: "580px" }}>
        <div className="flex items-center justify-between border-b border-[var(--color-border)] px-5 py-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--color-brand)]/20 text-[var(--color-brand)]">
              <Bot className="h-5 w-5" />
            </div>
            <div>
              <div className="font-bold text-white text-sm">{agent.name}</div>
              <div className="text-xs text-slate-400">Test Mode</div>
            </div>
          </div>
          <button onClick={onClose} className="rounded p-1 text-slate-400 hover:bg-white/10 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[80%] rounded-xl px-4 py-2.5 text-sm ${
                msg.sender === "user"
                  ? "bg-[var(--color-brand)] text-slate-950 font-medium"
                  : "bg-white/[0.06] text-slate-200"
              }`}>
                {msg.text}
                {msg.sender === "ai" && msg.confidence && (
                  <div className="text-[10px] text-slate-500 mt-1">
                    Confidence: {msg.confidence}%{msg.source ? ` | Source: ${msg.source}` : ""}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="border-t border-[var(--color-border)] p-4 shrink-0">
          {error && <p className="mb-2 text-xs text-red-400">{error}</p>}
          <div className="flex gap-2">
            <Input
              placeholder="Tulis pesan test..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && void handleSend()}
              disabled={isSending}
              className="bg-black/20"
            />
            <Button
              onClick={() => void handleSend()}
              disabled={isSending || !input.trim()}
              className="px-3 py-2 shrink-0"
            >
              {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Delete Confirm Modal ─────────────────────────────────────────────────────
function DeleteAgentModal({ agentName, onClose, onConfirm }: { agentName: string; onClose: () => void; onConfirm: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-2xl text-center">
        <button onClick={onClose} className="absolute right-4 top-4 rounded p-1 text-slate-400 hover:bg-white/10 hover:text-white">
          <X className="h-5 w-5" />
        </button>
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-500/10 text-red-500">
          <AlertTriangle className="h-7 w-7" />
        </div>
        <h3 className="mb-2 text-lg font-bold text-white">Hapus AI Agent?</h3>
        <p className="mb-6 text-sm text-slate-400">
          Apakah Anda yakin ingin menghapus AI Agent{" "}
          <span className="font-semibold text-white">&quot;{agentName}&quot;</span>?{" "}
          Agent yang sudah dihapus tidak dapat digunakan lagi di conversation flow.
        </p>
        <div className="flex gap-3 justify-center">
          <Button variant="secondary" onClick={onClose} className="flex-1 max-w-[120px] bg-transparent border-transparent text-slate-400 hover:text-white">
            Cancel
          </Button>
          <Button onClick={onConfirm} className="flex-1 max-w-[140px] bg-red-500 hover:bg-red-600 text-white border-transparent">
            Delete AI Agent
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Create / Edit Modal ──────────────────────────────────────────────────────
type AgentFormData = Omit<AIAgent, "id" | "lastUpdate" | "trainingSources">;

function CreateAgentModal({
  initialData,
  onClose,
  onSave,
}: {
  initialData?: AIAgent;
  onClose: () => void;
  onSave: (data: AgentFormData, status: "Active" | "Draft") => Promise<void>;
}) {
  const [name, setName] = useState(initialData?.name ?? "");
  const [description, setDescription] = useState(initialData?.description ?? "");
  const [prompt, setPrompt] = useState(initialData?.prompt ?? "");
  const [tone, setTone] = useState<AIAgent["toneOfVoice"]>(initialData?.toneOfVoice ?? "Ramah");
  const [responseMode, setResponseMode] = useState<AIAgent["responseMode"]>(initialData?.responseMode ?? "Answer + Handover if Needed");
  const [channelUsage, setChannelUsage] = useState(initialData?.channelUsage ?? "WhatsApp - Business");
  const [actions, setActions] = useState(initialData?.allowedActions ?? {
    replyMessage: true,
    createLead: false,
    createBooking: false,
    updateTicket: false,
    sendToApi: false,
    handoverToHuman: false,
  });
  const [handoverEnabled, setHandoverEnabled] = useState(initialData?.handover.enabled ?? false);
  const [handoverTeam, setHandoverTeam] = useState(initialData?.handover.assignTeam ?? "");
  const [handoverMsg, setHandoverMsg] = useState(initialData?.handover.fallbackMessage ?? "");
  const [isSaving, setIsSaving] = useState(false);

  const toggleAction = (key: keyof typeof actions) => {
    setActions((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const actionLabels: { key: keyof typeof actions; label: string }[] = [
    { key: "replyMessage", label: "Membalas pesan pelanggan" },
    { key: "createLead", label: "Mencatat prospek / deal" },
    { key: "createBooking", label: "Membuat reservasi jadwal" },
    { key: "updateTicket", label: "Memperbarui status tiket" },
    { key: "sendToApi", label: "Mengirim data ke API eksternal" },
    { key: "handoverToHuman", label: "Meneruskan ke human agent" },
  ];

  const handleSave = async (status: "Active" | "Draft") => {
    setIsSaving(true);
    try {
      await onSave({
        name, description, prompt,
        toneOfVoice: tone,
        allowedActions: actions,
        handover: { enabled: handoverEnabled, assignTeam: handoverTeam, fallbackMessage: handoverMsg },
        responseMode,
        channelUsage,
        status,
      }, status);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-3xl rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-2xl my-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--color-border)] px-6 py-4 sticky top-0 bg-[var(--color-surface)] z-10 rounded-t-xl">
          <h2 className="font-heading text-lg font-bold text-white">
            {initialData ? "Edit AI Agent" : "Create AI Agent"}
          </h2>
          <button onClick={onClose} className="rounded p-1 text-slate-400 hover:bg-white/10 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
          {/* Agent Identity */}
          <div className="space-y-1">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--color-brand)]">Identity & Persona</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-300">Agent Name</label>
              <Input placeholder="Contoh: Customer Support Assistant" value={name} onChange={(e) => setName(e.target.value)} className="bg-black/20" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-300">Channel</label>
              <select
                className="flex h-10 w-full rounded-md border border-[var(--color-border)] bg-black/20 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[var(--color-brand)]"
                value={channelUsage}
                onChange={(e) => setChannelUsage(e.target.value)}
              >
                <option value="WhatsApp - Business">WhatsApp - Business</option>
                <option value="Instagram DM">Instagram DM</option>
                <option value="Website Chat Widget">Website Chat Widget</option>
                <option value="Not connected">Not connected</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-300">Agent Description</label>
            <Input placeholder="Contoh: Asisten AI untuk layanan servis, booking, harga, dan sparepart." value={description} onChange={(e) => setDescription(e.target.value)} className="bg-black/20" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-300">Tone of Voice</label>
              <select
                className="flex h-10 w-full rounded-md border border-[var(--color-border)] bg-black/20 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[var(--color-brand)]"
                value={tone}
                onChange={(e) => setTone(e.target.value as AIAgent["toneOfVoice"])}
              >
                {["Formal", "Ramah", "Santai", "Profesional", "Singkat"].map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-300">Response Mode</label>
              <select
                className="flex h-10 w-full rounded-md border border-[var(--color-border)] bg-black/20 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[var(--color-brand)]"
                value={responseMode}
                onChange={(e) => setResponseMode(e.target.value as AIAgent["responseMode"])}
              >
                {["Answer Only", "Answer + Suggest Menu", "Answer + Execute Action", "Answer + Handover if Needed"].map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-300">AI Prompt / Instruction</label>
            <Textarea
              placeholder="Kamu adalah asisten virtual yang ramah dan sigap. Tugasmu membantu menjawab pertanyaan seputar layanan kami..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="min-h-[130px] bg-black/20"
            />
          </div>

          {/* Allowed Actions */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--color-brand)]">Allowed Actions</h3>
            <div className="rounded-lg border border-[var(--color-border)] divide-y divide-[var(--color-border)]">
              {actionLabels.map(({ key, label }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => toggleAction(key)}
                  className="flex w-full items-center gap-3 px-4 py-3 text-sm text-slate-300 hover:bg-white/[0.02] transition"
                >
                  {actions[key]
                    ? <CheckSquare className="h-4 w-4 text-[var(--color-brand)] shrink-0" />
                    : <Square className="h-4 w-4 text-slate-600 shrink-0" />
                  }
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Human Handover */}
          <div className="rounded-lg border border-[var(--color-border)] p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-semibold text-white">Human Handover Rules</h4>
                <p className="text-xs text-slate-500">Alihkan ke admin jika kondisi tertentu terpenuhi</p>
              </div>
              <label className="relative inline-flex cursor-pointer items-center">
                <input type="checkbox" className="peer sr-only" checked={handoverEnabled} onChange={(e) => setHandoverEnabled(e.target.checked)} />
                <div className="h-5 w-9 rounded-full bg-slate-700 after:absolute after:left-[2px] after:top-[2px] after:h-4 after:w-4 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-[var(--color-brand)] peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none"></div>
              </label>
            </div>
            {handoverEnabled && (
              <div className="space-y-3 pt-2 border-t border-[var(--color-border)]">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-300">Assign To Team</label>
                  <Input placeholder="Customer Service" value={handoverTeam} onChange={(e) => setHandoverTeam(e.target.value)} className="bg-black/40 h-9 text-sm" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-300">Fallback Handover Message</label>
                  <Textarea
                    placeholder="Baik kak, saya teruskan ke admin agar bisa dibantu lebih lanjut."
                    value={handoverMsg}
                    onChange={(e) => setHandoverMsg(e.target.value)}
                    className="min-h-[70px] bg-black/40 text-sm"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-[var(--color-border)] px-6 py-4 bg-[var(--color-surface)] rounded-b-xl">
          <Button variant="secondary" onClick={onClose} className="text-slate-400 hover:text-white bg-transparent border-transparent">
            Cancel
          </Button>
          <div className="flex gap-3">
            <Button variant="secondary" disabled={isSaving} onClick={() => void handleSave("Draft")} className="gap-2 bg-transparent">
              <Save className="h-4 w-4" />
              Save as Draft
            </Button>
            <Button disabled={isSaving} onClick={() => void handleSave("Active")} className="gap-2">
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              {isSaving ? "Integrating..." : "Publish"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AIAgentsPage() {
  const { config, patchConfig, isLoading } = useDashboardConfig();
  const [agents, setAgents] = useState<AIAgent[]>([]);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingAgent, setEditingAgent] = useState<AIAgent | null>(null);
  const [deletingAgent, setDeletingAgent] = useState<AIAgent | null>(null);
  const [testingAgent, setTestingAgent] = useState<AIAgent | null>(null);

  useEffect(() => {
    if (isLoading || !config) return;
    setAgents(config.automation.aiAgents || []);
  }, [config, isLoading]);

  const now = () =>
    new Date().toLocaleString("id-ID", {
      day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
    }).replace(/\./g, ":");

  const persist = async (next: AIAgent[]) => {
    setAgents(next);
    try {
      await patchConfig((current) => ({
        ...current,
        automation: { ...current.automation, aiAgents: next },
      }));
    } catch (error) {
      setAgents(config.automation.aiAgents || []);
      throw error;
    }
  };

  const handleSave = async (data: AgentFormData, status: "Active" | "Draft") => {
    let next: AIAgent[];
    if (editingAgent) {
      next = agents.map((a) =>
        a.id === editingAgent.id ? { ...a, ...data, status, lastUpdate: now(), trainingSources: a.trainingSources } : a
      );
    } else {
      const newAgent: AIAgent = { ...data, id: "agent_" + Date.now(), trainingSources: [], lastUpdate: now() };
      next = [newAgent, ...agents];
    }
    await persist(next);
    setIsCreateOpen(false);
    setEditingAgent(null);
  };

  const handleDuplicate = (agent: AIAgent) => {
    const dup: AIAgent = { ...agent, id: "agent_" + Date.now(), name: agent.name + " Copy", status: "Draft", lastUpdate: now(), trainingSources: [] };
    void persist([dup, ...agents]).catch(() => undefined);
  };

  const handleToggleStatus = (agent: AIAgent) => {
    const next = agents.map((a) =>
      a.id === agent.id ? { ...a, status: a.status === "Inactive" || a.status === "Draft" ? "Active" : "Inactive" } as AIAgent : a
    );
    void persist(next).catch(() => undefined);
  };

  const confirmDelete = () => {
    if (!deletingAgent) return;
    void persist(agents.filter((a) => a.id !== deletingAgent.id)).catch(
      () => undefined,
    );
    setDeletingAgent(null);
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--color-brand)]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-heading text-white">AI Agents</h1>
          <p className="text-sm text-slate-400 mt-1 max-w-xl">
            Buat dan kelola asisten AI. Setiap Agent memakai Custom Instructions global dan seluruh sumber Knowledge Base yang sudah berstatus siap.
          </p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)} className="gap-2 shrink-0">
          <PlusCircle className="h-4 w-4" />
          Create AI Agent
        </Button>
      </div>

      {/* Stats Cards */}
      {agents.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total Agents", value: agents.length, icon: Bot },
            { label: "Active", value: agents.filter((a) => a.status === "Active").length, icon: Power },
            { label: "Draft", value: agents.filter((a) => a.status === "Draft").length, icon: Save },
            { label: "KB Sources", value: config.knowledgeBase.documents.filter((document) => document.status === "ready").length, icon: Database },
          ].map(({ label, value, icon: Icon }) => (
            <Card key={label} className="p-4 border-white/10 bg-white/[0.02] flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--color-brand)]/15 text-[var(--color-brand)] shrink-0">
                <Icon className="h-4.5 w-4.5" />
              </div>
              <div>
                <div className="text-lg font-bold font-heading text-white">{value}</div>
                <div className="text-xs text-slate-500">{label}</div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Content */}
      {agents.length === 0 ? (
        <EmptyAgentState onCreate={() => setIsCreateOpen(true)} />
      ) : (
        <div className="space-y-4">
          <div className="overflow-x-auto rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-white/[0.02] text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-5 py-4 font-semibold">Agent Name</th>
                  <th className="px-5 py-4 font-semibold">Knowledge Base</th>
                  <th className="px-5 py-4 font-semibold">Actions Enabled</th>
                  <th className="px-5 py-4 font-semibold">Channel</th>
                  <th className="px-5 py-4 font-semibold">Last Update</th>
                  <th className="px-5 py-4 font-semibold">Status</th>
                  <th className="px-5 py-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)]">
                {agents.map((agent) => {
                  const activeActions = Object.values(agent.allowedActions).filter(Boolean).length;
                  return (
                    <tr key={agent.id} className="hover:bg-white/[0.01] transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--color-brand)]/15 text-[var(--color-brand)]">
                            <Bot className="h-4 w-4" />
                          </div>
                          <div>
                            <div className="font-semibold text-white">{agent.name}</div>
                            <div className="text-xs text-slate-500 max-w-[200px] truncate">{agent.description}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className="flex items-center gap-1.5">
                          <Database className="h-3.5 w-3.5 text-slate-500" />
                          {config.knowledgeBase.documents.filter((document) => document.status === "ready").length} shared sources
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className="flex items-center gap-1.5">
                          <Zap className="h-3.5 w-3.5 text-slate-500" />
                          {activeActions} / 6
                        </span>
                      </td>
                      <td className="px-5 py-4 text-slate-400">{agent.channelUsage}</td>
                      <td className="px-5 py-4 text-slate-400">{agent.lastUpdate}</td>
                      <td className="px-5 py-4"><AgentStatusBadge status={agent.status} /></td>
                      <td className="px-5 py-4 text-right">
                        <Dropdown
                          align="right"
                          trigger={
                            <button className="rounded p-1.5 text-slate-400 hover:bg-white/10 hover:text-white transition">
                              <MoreVertical className="h-4 w-4" />
                            </button>
                          }
                          items={[
                            { label: "Edit", icon: <Edit2 className="h-4 w-4" />, onClick: () => { setEditingAgent(agent); setIsCreateOpen(true); } },
                            { label: "Duplicate", icon: <Copy className="h-4 w-4" />, onClick: () => handleDuplicate(agent) },
                            { label: "Test Agent", icon: <FlaskConical className="h-4 w-4" />, onClick: () => setTestingAgent(agent) },
                            {
                              label: agent.status === "Active" ? "Deactivate" : "Activate",
                              icon: agent.status === "Active" ? <PowerOff className="h-4 w-4" /> : <Power className="h-4 w-4" />,
                              onClick: () => handleToggleStatus(agent),
                            },
                            { label: "Delete", icon: <Trash2 className="h-4 w-4" />, onClick: () => setDeletingAgent(agent), danger: true },
                          ]}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Shared Knowledge Base detail */}
          <div className="space-y-3">
            <h2 className="text-sm font-bold text-slate-300 flex items-center gap-2">
              <Database className="h-4 w-4 text-[var(--color-brand)]" />
              Knowledge Base Terhubung
            </h2>
            <Card className="border-white/10 bg-white/[0.02] overflow-hidden">
              <div className="px-5 py-3 border-b border-[var(--color-border)] flex items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-white">
                  <Database className="h-4 w-4 text-[var(--color-brand)]" />
                  Sumber bersama untuk semua AI Agent
                </div>
                <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                  {config.knowledgeBase.documents.filter((document) => document.status === "ready").length} Ready
                </Badge>
              </div>
              {config.knowledgeBase.documents.length === 0 ? (
                <p className="px-5 py-4 text-sm text-amber-300">
                  Belum ada sumber. Tambahkan FAQ, dokumen, URL, Google Sheet, atau text content di menu Knowledge Base.
                </p>
              ) : (
                <div className="divide-y divide-[var(--color-border)]">
                  {config.knowledgeBase.documents.slice(0, 8).map((document) => (
                    <div key={document.id} className="flex items-center justify-between gap-4 px-5 py-3 text-sm">
                      <div className="flex min-w-0 items-center gap-2 text-slate-300">
                        <FileText className="h-3.5 w-3.5 shrink-0 text-slate-500" />
                        <span className="truncate">{document.name}</span>
                      </div>
                      <span className={document.status === "ready" ? "text-xs text-emerald-400" : "text-xs text-amber-400"}>
                        {document.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </div>
      )}

      {/* Modals */}
      {isCreateOpen && (
        <CreateAgentModal
          initialData={editingAgent ?? undefined}
          onClose={() => { setIsCreateOpen(false); setEditingAgent(null); }}
          onSave={handleSave}
        />
      )}
      {deletingAgent && (
        <DeleteAgentModal
          agentName={deletingAgent.name}
          onClose={() => setDeletingAgent(null)}
          onConfirm={confirmDelete}
        />
      )}
      {testingAgent && (
        <TestAgentPanel
          agent={testingAgent}
          onClose={() => setTestingAgent(null)}
        />
      )}
    </div>
  );
}
