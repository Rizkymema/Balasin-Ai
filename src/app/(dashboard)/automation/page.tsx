"use client";

import { useEffect, useState, type FormEvent } from "react";
import {
  GitBranch,
  PlusCircle,
  MessageSquare,
  Sparkle,
  Trash2,
  Workflow,
  ChevronRight,
  Bot,
  Database,
  Settings2,
  Loader2,
  Send
} from "lucide-react";

import Link from "next/link";
import { useDashboardConfig } from "@/hooks/use-dashboard-config";
import type { AutomationRule } from "@/types/dashboard-config";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState } from "@/components/ui/empty-state";

export default function AutomationPage() {
  const { config, patchConfig, isLoading } = useDashboardConfig();
  const [isSaved, setIsSaved] = useState(false);

  // -------------------------------------------------------------
  // Conversations States
  // -------------------------------------------------------------
  const [isCreatingFlow, setIsCreatingFlow] = useState(false);
  const [flowName, setFlowName] = useState("");
  const [flowTrigger, setFlowTrigger] = useState("");
  const [flowAction, setFlowAction] = useState("");
  const [rules, setRules] = useState<AutomationRule[]>([]);

  useEffect(() => {
    if (!config) return;
    setRules(config.automation.rules);
  }, [config]);

  // -------------------------------------------------------------
  // HANDLERS
  // -------------------------------------------------------------
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

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
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
    </div>
  );
}
