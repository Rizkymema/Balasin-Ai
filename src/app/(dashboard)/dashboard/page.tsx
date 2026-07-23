"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  CalendarRange,
  CheckCircle2,
  CircleDashed,
  MessageSquare,
  Package2,
  SendHorizontal,
  ShieldCheck,
  Ticket,
  Wifi,
  Workflow,
  Zap,
  Users2,
  Loader2,
  Check,
} from "lucide-react";

import { useDashboardConfig } from "@/hooks/use-dashboard-config";
import { useDashboardOperations } from "@/hooks/use-dashboard-operations";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import {
  parseCustomInstructions,
  serializeCustomInstructions,
} from "@/lib/custom-instructions";

export default function DashboardPage() {
  const { config, patchConfig, refreshConfig } = useDashboardConfig();
  const { data } = useDashboardOperations();

  const [activeEditModal, setActiveEditModal] = useState<"none" | "profile" | "channels" | "instructions" | "bot_activation">("none");
  const [isSaving, setIsSaving] = useState(false);

  // Form states
  const [profileName, setProfileName] = useState("");
  const [profileIndustry, setProfileIndustry] = useState("");
  const [profileEmail, setProfileEmail] = useState("");
  const [profileAddress, setProfileAddress] = useState("");
  const [profileHours, setProfileHours] = useState("");

  const [personaText, setPersonaText] = useState("");
  const [toneText, setToneText] = useState("");
  const [guardrailsText, setGuardrailsText] = useState("");

  const [whatsappAutoReply, setWhatsappAutoReply] = useState(false);
  const [instagramAutoReply, setInstagramAutoReply] = useState(false);
  const [webchatEnabled, setWebchatEnabled] = useState(false);

  const [autoReplyEnabled, setAutoReplyEnabled] = useState(false);
  const [confidenceThreshold, setConfidenceThreshold] = useState(70);
  const [safetyMode, setSafetyMode] = useState<"strict" | "balanced" | "aggressive">("balanced");

  // Sync state with config when modal opens or config is fetched
  useEffect(() => {
    if (!config) return;
    
    // Profile
    setProfileName(config.workspace.name || "");
    setProfileIndustry(config.workspace.industry || "");
    setProfileEmail(config.workspace.supportEmail || "");
    setProfileAddress(config.workspace.address || "");
    setProfileHours(config.workspace.businessHours || "");

    // Custom Instructions parsing
    const sections = parseCustomInstructions(config.aiAgent.replyInstructions || "");
    setPersonaText(sections.persona);
    setToneText(sections.tone);
    setGuardrailsText(sections.guardrails);

    // Channels
    setWhatsappAutoReply(config.channels.whatsapp.autoReply);
    setInstagramAutoReply(config.channels.instagram.autoReplyDm);
    setWebchatEnabled(config.channels.webchat.enabled);

    // Bot Activation
    setAutoReplyEnabled(config.aiAgent.autoReplyEnabled);
    setConfidenceThreshold(config.aiAgent.confidenceThreshold);
    setSafetyMode((config.aiAgent.safetyMode as "strict" | "balanced" | "aggressive") || "balanced");
  }, [config, activeEditModal]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await patchConfig((current) => ({
        ...current,
        workspace: {
          ...current.workspace,
          name: profileName,
          industry: profileIndustry,
          supportEmail: profileEmail,
          address: profileAddress,
          businessHours: profileHours,
        },
      }));
      await refreshConfig();
      setActiveEditModal("none");
    } catch (err) {
      alert("Gagal menyimpan profil.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveInstructions = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const assembledPrompt = serializeCustomInstructions({
        persona: personaText,
        tone: toneText,
        guardrails: guardrailsText,
      });
      await patchConfig((current) => ({
        ...current,
        aiAgent: {
          ...current.aiAgent,
          replyInstructions: assembledPrompt,
        },
      }));
      await refreshConfig();
      setActiveEditModal("none");
    } catch (err) {
      alert("Gagal menyimpan instruksi.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveChannels = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await patchConfig((current) => ({
        ...current,
        channels: {
          ...current.channels,
          whatsapp: {
            ...current.channels.whatsapp,
            autoReply: whatsappAutoReply,
          },
          instagram: {
            ...current.channels.instagram,
            autoReplyDm: instagramAutoReply,
          },
          webchat: {
            ...current.channels.webchat,
            enabled: webchatEnabled,
          },
        },
      }));
      await refreshConfig();
      setActiveEditModal("none");
    } catch (err) {
      alert("Gagal menyimpan saluran.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveBot = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await patchConfig((current) => ({
        ...current,
        aiAgent: {
          ...current.aiAgent,
          autoReplyEnabled,
          confidenceThreshold,
          safetyMode,
        },
      }));
      await refreshConfig();
      setActiveEditModal("none");
    } catch (err) {
      alert("Gagal menyimpan pengaturan bot.");
    } finally {
      setIsSaving(false);
    }
  };

  const connectedChannels = [
    config.channels.webchat.status === "connected" ? "Web Chat" : null,
    config.channels.whatsapp.status === "connected" ? "WhatsApp" : null,
    config.channels.instagram.status === "connected" ? "Instagram" : null,
  ].filter(Boolean) as string[];

  const activeRules = config.automation.rules.filter((rule) => rule.isActive).length;
  const automationCoverage = Math.min(
    100,
    Math.round((activeRules / Math.max(config.automation.rules.length, 1)) * 100),
  );

  const stats = [
    {
      label: "OMNICHANNEL ACTIVE",
      value: `${data.conversations.length}`,
      icon: MessageSquare,
      color: "text-blue-600 bg-blue-50 border-blue-200",
      note: connectedChannels.length > 0 ? connectedChannels.join(", ") : "Tidak ada channel aktif",
      badgeColor: "bg-blue-50 text-blue-700 border-blue-200 font-bold",
      badgeText: `${connectedChannels.length} Live`,
    },
    {
      label: "AUTO REPLY AI",
      value: config.aiAgent.autoReplyEnabled ? "ON" : "OFF",
      icon: Zap,
      color: config.aiAgent.autoReplyEnabled
        ? "text-emerald-600 bg-emerald-50 border-emerald-200"
        : "text-amber-600 bg-amber-50 border-amber-200",
      note: `Confidence threshold ${config.aiAgent.confidenceThreshold}%`,
      badgeColor: config.aiAgent.autoReplyEnabled
        ? "bg-emerald-50 text-emerald-700 border-emerald-200 font-bold"
        : "bg-amber-50 text-amber-700 border-amber-200 font-bold",
      badgeText: `Mode ${config.aiAgent.safetyMode}`,
    },
    {
      label: "TIKET TERBUKA",
      value: `${data.tickets.filter((ticket) => ticket.status !== "resolved").length}`,
      icon: Ticket,
      color: "text-amber-600 bg-amber-50 border-amber-200",
      note: "Handoff, keluhan & eskalasi tiket operator",
      badgeColor: "bg-amber-50 text-amber-700 border-amber-200 font-bold",
      badgeText: `${automationCoverage}% ditangani otomatis`,
      tooltip: `${automationCoverage}% tiket dan keluhan ditangani secara otomatis oleh aturan sistem.`,
    },
  ];

  // 6 Control Cards for a perfectly balanced 3-column grid across 2 rows
  const controlCenterCards = [
    {
      title: "AI Assistant",
      detail: "Konfigurasi sistem kecerdasan, intent, respons otomatis, instruksi, dan pangkalan pengetahuan AI.",
      href: "/automation/ai-agent",
      icon: Zap,
    },
    {
      title: "Unified Inbox",
      detail: "Pantau percakapan dari seluruh channel dan lakukan intervensi atau handoff manual admin.",
      href: "/inbox",
      icon: MessageSquare,
    },
    {
      title: "Integrasi Channel",
      detail: "Hubungkan akun WhatsApp, Instagram, Live Chat, dan pantau status koneksi saluran media sosial.",
      href: "/channels",
      icon: Wifi,
    },
    {
      title: "Automation Rules",
      detail: "Atur trigger operasional, pesan berkala, pengalihan di luar jam kerja, dan moderasi bot.",
      href: "/automation",
      icon: Workflow,
    },
    {
      title: "Broadcasting",
      detail: "Kirim pesan kampanye, penawaran promo, pengumuman terjadwal, dan notifikasi massal.",
      href: "/broadcast",
      icon: SendHorizontal,
    },
    {
      title: "Database Kontak & CRM",
      detail: "Kelola basis data pelanggan, segmen kontak, riwayat obrolan, dan bidang data kustom.",
      href: "/customers",
      icon: Users2,
    },
  ];

  const roadmapSteps = [
    {
      step: 1,
      title: "Lengkapi Profil & Jam Buka Bisnis",
      desc: "Isi alamat resmi, jam operasional, dan deskripsi bisnis Anda agar AI memiliki informasi dasar yang akurat.",
      complete:
        Boolean(config.workspace.name.trim()) &&
        Boolean(config.workspace.industry.trim()) &&
        Boolean(config.workspace.supportEmail.trim()),
      actionText: "Atur Profil Bisnis",
      onClick: () => setActiveEditModal("profile"),
    },
    {
      step: 2,
      title: "Hubungkan Media Sosial (Instagram/WhatsApp)",
      desc: "Tautkan akun bisnis Instagram DM atau WhatsApp Anda agar AI dapat membalas chat secara otomatis.",
      complete:
        config.channels.webchat.enabled ||
        config.channels.whatsapp.status === "connected" ||
        config.channels.instagram.status === "connected",
      actionText: "Hubungkan Saluran Chat",
      onClick: () => setActiveEditModal("channels"),
    },
    {
      step: 3,
      title: "Buat Custom Instructions & Persona AI",
      desc: "Atur identitas asisten AI (seperti nama asisten, gaya komunikasi formal/santai, sapaan khas, dan aturan dilarang mengarang harga).",
      complete: Boolean(config.aiAgent.replyInstructions?.trim()),
      actionText: "Tulis Instruksi AI",
      onClick: () => setActiveEditModal("instructions"),
    },
    {
      step: 4,
      title: "Aktifkan Fitur Balas Otomatis AI (Auto Reply)",
      desc: "Nyalakan tombol utama Auto Reply agar sistem memproses dan menjawab chat masuk berdasarkan kecerdasan buatan.",
      complete: config.aiAgent.autoReplyEnabled,
      actionText: "Nyalakan Auto Reply",
      onClick: () => setActiveEditModal("bot_activation"),
    },
    {
      step: 5,
      title: "Pantau Chat & Intervensi di Unified Inbox",
      desc: "Monitor semua chat yang masuk secara terpadu. Admin manusia dapat mengambil alih percakapan kapan saja untuk kenyamanan pelanggan.",
      href: "/inbox",
      complete: data.conversations.length > 0,
      actionText: "Buka Inbox",
    },
  ];

  const completedSteps = roadmapSteps.filter((item) => item.complete).length;
  const totalSteps = roadmapSteps.length;
  const checklistPercentage = Math.round((completedSteps / totalSteps) * 100);

  return (
    <div className="space-y-5">
      {/* Welcome Banner */}
      <Card className="p-5 md:p-6 bg-white border border-slate-200 shadow-2xs space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="success" className="text-[10px] px-2 py-0.5 font-bold shadow-2xs flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Sistem Aktif
          </Badge>
          <Badge variant="outline" className="text-[10px] px-2 py-0.5 text-slate-600 bg-slate-50 border-slate-200 font-medium">
            Timezone: {config.workspace.timezone}
          </Badge>
        </div>
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 md:text-2xl tracking-tight leading-tight">
            Selamat datang di Workspace <span className="text-blue-600">{config.workspace.name}</span>
          </h1>
          <p className="max-w-3xl text-xs md:text-sm leading-relaxed text-slate-600 font-normal mt-1">
            Kelola interaksi pelanggan, automasi AI assistant, basis pengetahuan FAQ, booking slot, dan ticket eskalasi dalam satu panel kontrol terpusat yang aman dan andal.
          </p>
        </div>
      </Card>

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;

          return (
            <Card key={stat.label} className="p-4.5 bg-white border border-slate-200 hover:border-slate-300 hover:shadow-xs transition-all duration-200 flex flex-col justify-between space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                  {stat.label}
                </span>
                <div className={`flex h-8 w-8 items-center justify-center rounded-xl border ${stat.color}`}>
                  <Icon className="h-4 w-4" />
                </div>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="font-heading text-2xl font-black text-slate-900 tracking-tight">
                  {stat.value}
                </span>
                <span 
                  className={`rounded-lg border px-2 py-0.5 text-[9px] font-bold ${stat.badgeColor}`}
                  title={stat.tooltip}
                >
                  {stat.badgeText}
                </span>
              </div>
              <p className="text-xs text-slate-500 line-clamp-1 font-medium" title={stat.note}>
                {stat.note}
              </p>
            </Card>
          );
        })}
      </div>

      {/* Main Content Layout Grid */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-4 items-start">
        {/* Left Column: Control Center & Checklist */}
        <div className="lg:col-span-3 space-y-5">
          {/* Operational Control Center */}
          <Card className="p-5 md:p-6 bg-white border border-slate-200 shadow-2xs">
            <div className="border-b border-slate-100 pb-3 mb-4">
              <h3 className="text-base font-extrabold tracking-tight text-slate-900">
                Pusat Kendali Operasional
              </h3>
              <p className="mt-0.5 text-xs text-slate-500">
                Akses cepat ke 6 modul utama untuk mengelola respon dan layanan bisnis Anda secara efisien.
              </p>
            </div>

            {/* 6 Cards in a clean 3-column grid across 2 rows */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {controlCenterCards.map((card) => {
                const Icon = card.icon;
                return (
                  <Link
                    key={card.title}
                    href={card.href}
                    className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-slate-50/50 p-4.5 transition-all duration-150 hover:border-blue-300 hover:bg-blue-50/40 hover:-translate-y-0.5 hover:shadow-xs group min-h-[140px]"
                  >
                    <div>
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-100 border border-blue-200 text-blue-700 shrink-0">
                          <Icon className="h-4 w-4" />
                        </div>
                        <h4 className="text-xs font-bold text-slate-900 tracking-tight group-hover:text-blue-600 transition-colors duration-150">
                          {card.title}
                        </h4>
                      </div>
                      <p className="mt-2 text-xs leading-relaxed text-slate-500 font-medium">
                        {card.detail}
                      </p>
                    </div>
                    <div className="mt-3 flex items-center gap-1 text-xs font-bold text-blue-600 group-hover:text-blue-700 transition-colors duration-150">
                      Buka Modul
                      <ArrowRight className="h-3.5 w-3.5 transform group-hover:translate-x-1 transition-transform duration-150" />
                    </div>
                  </Link>
                );
              })}
            </div>
          </Card>

          {/* Setup Checklist Progress */}
          <Card className="p-5 md:p-6 bg-white border border-slate-200 shadow-2xs">
            <div className="border-b border-slate-100 pb-3 mb-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <h3 className="text-base font-extrabold tracking-tight text-slate-900 flex items-center gap-2">
                    <Zap className="h-4.5 w-4.5 text-blue-600 animate-pulse" />
                    Panduan Cepat Mulai Balesin AI
                  </h3>
                  <p className="mt-0.5 text-xs text-slate-500">
                    Ikuti 5 langkah mudah berikut untuk mengaktifkan asisten AI pintar di bisnis Anda.
                  </p>
                </div>
                <Badge variant="default" className="shrink-0 self-start sm:self-center text-xs font-bold px-3 py-1">
                  {completedSteps} dari {totalSteps} Siap
                </Badge>
              </div>

              {/* Progress Bar */}
              <div className="mt-4">
                <div className="flex justify-between text-[10px] font-extrabold text-slate-500 mb-1.5 uppercase tracking-wider">
                  <span>Kelengkapan Sistem</span>
                  <span>{checklistPercentage}%</span>
                </div>
                <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200 p-[1px]">
                  <div
                    className="h-full bg-blue-600 rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${checklistPercentage}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Interactive Timeline Roadmap */}
            <div className="relative border-l-2 border-slate-200 ml-3 pl-6 space-y-4">
              {roadmapSteps.map((item) => {
                const isStepComplete = item.complete;
                return (
                  <div key={item.step} className="relative group">
                    {/* Circle Indicator */}
                    <div className={`absolute -left-[33px] top-1 flex h-4.5 w-4.5 items-center justify-center rounded-full border-2 transition-all duration-200 ${
                      isStepComplete
                        ? "bg-emerald-500 border-emerald-500 text-white"
                        : "bg-white border-slate-300 text-slate-400"
                    }`}>
                      {isStepComplete ? (
                        <Check className="h-3 w-3 stroke-[3px]" />
                      ) : (
                        <span className="text-[9px] font-bold">{item.step}</span>
                      )}
                    </div>

                    {/* Content Area */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50/50 p-4 transition-all duration-150 group-hover:border-slate-300 group-hover:bg-slate-50">
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className={`text-xs font-bold tracking-tight transition-colors duration-150 ${
                            isStepComplete ? "text-emerald-700" : "text-slate-900"
                          }`}>
                            Langkah {item.step}: {item.title}
                          </h4>
                          {isStepComplete && (
                            <Badge variant="success" className="text-[9px] py-0 px-2 font-bold">
                              Selesai
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs leading-relaxed text-slate-500 max-w-xl font-medium">
                          {item.desc}
                        </p>
                      </div>
                      
                      {item.href ? (
                        <Link
                          href={item.href}
                          className={`inline-flex items-center justify-center h-8 px-3.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                            isStepComplete
                              ? "bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 shadow-2xs"
                              : "bg-blue-600 text-white hover:bg-blue-700 shadow-2xs"
                          }`}
                        >
                          {item.actionText}
                          <ArrowRight className="h-3.5 w-3.5 ml-1 transform transition-transform group-hover:translate-x-0.5" />
                        </Link>
                      ) : (
                        <button
                          onClick={item.onClick}
                          className={`inline-flex items-center justify-center h-8 px-3.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                            isStepComplete
                              ? "bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 shadow-2xs"
                              : "bg-blue-600 text-white hover:bg-blue-700 shadow-2xs"
                          }`}
                        >
                          {item.actionText}
                          <ArrowRight className="h-3.5 w-3.5 ml-1 transform transition-transform group-hover:translate-x-0.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>

        {/* Right Column: API Credentials Info & Workspace Snapshot (Sticky Sidebar) */}
        <div className="lg:col-span-1 space-y-5 lg:sticky lg:top-4 h-fit">
          {/* Security & Env Configuration Card */}
          <Card className="p-5 bg-white border border-slate-200 shadow-2xs space-y-3">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <ShieldCheck className="h-4.5 w-4.5 text-emerald-600" />
              <h3 className="text-xs font-bold tracking-tight text-slate-900">
                Kredensial & Integrasi Aman
              </h3>
            </div>
            <p className="text-xs leading-relaxed text-slate-500 font-medium">
              Untuk menjamin keamanan operasional, seluruh token API pihak ketiga, secret token webhook, App URL, dan session key tidak disimpan di database, melainkan dikelola langsung melalui variabel lingkungan server (*environment variables*).
            </p>
            <div className="space-y-2 border-t border-slate-100 pt-3">
              <div className="flex items-center justify-between text-xs py-0.5">
                <span className="text-slate-500 font-medium">App Environment</span>
                <Badge variant="success" className="text-[9px]">
                  Secure Live
                </Badge>
              </div>
              <div className="flex items-center justify-between text-xs py-0.5">
                <span className="text-slate-500 font-medium">AI Provider API Key</span>
                <span className="font-mono text-slate-700 text-[11px]">
                  {config.aiProvider.enabled && config.aiProvider.apiKey.trim()
                    ? "••••••••••••••••"
                    : "Not Configured"}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs py-0.5">
                <span className="text-slate-500 font-medium">Workspace Status</span>
                <span className="text-emerald-600 font-bold flex items-center gap-1.5 text-xs">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  Online
                </span>
              </div>
            </div>
          </Card>

          {/* System Workspace Snapshot */}
          <Card className="p-5 bg-white border border-slate-200 shadow-2xs">
            <h3 className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-3 mb-3">
              Snapshot Workspace
            </h3>
            <div className="space-y-3.5">
              <div className="flex items-start gap-3 text-xs">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-blue-50 border border-blue-200 text-[10px] font-bold text-blue-700">
                  WS
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-slate-900 text-xs">Workspace</p>
                  <p className="text-xs text-slate-900 font-extrabold leading-snug mt-0.5">
                    {config.workspace.name}
                  </p>
                  {config.workspace.industry && (
                    <p className="text-[11px] text-slate-500 font-medium leading-normal mt-0.5">
                      {config.workspace.industry}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-start gap-3 text-xs">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-blue-50 border border-blue-200 text-[10px] font-bold text-blue-700">
                  AI
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-slate-900 text-xs">Asisten Bot</p>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    {config.aiAgent.name} | {config.aiAgent.blacklist.length} blacklist kata
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 text-xs">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-blue-50 border border-blue-200 text-[10px] font-bold text-blue-700">
                  TK
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-slate-900 text-xs">Support Desk</p>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    {data.tickets.filter((t) => t.status === "in_progress").length} tiket diproses operator
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 text-xs">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-blue-50 border border-blue-200 text-[10px] font-bold text-blue-700">
                  BC
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-slate-900 text-xs">Kampanye Broadcast</p>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    {data.broadcasts.filter((item) => item.status === "sent").length} terkirim | {data.broadcasts.filter((item) => item.status === "scheduled").length} dijadwalkan
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Profil Bengkel Modal */}
      <Modal
        isOpen={activeEditModal === "profile"}
        onClose={() => setActiveEditModal("none")}
        title="Atur Profil & Jam Buka Bisnis"
      >
        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Nama Bisnis / Perusahaan</label>
            <Input
              value={profileName}
              onChange={(e) => setProfileName(e.target.value)}
              placeholder="Contoh: Balesin Corp"
              required
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Industri</label>
            <Input
              value={profileIndustry}
              onChange={(e) => setProfileIndustry(e.target.value)}
              placeholder="Contoh: Toko Online / Jasa Konsultasi"
              required
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Email Dukungan</label>
            <Input
              type="email"
              value={profileEmail}
              onChange={(e) => setProfileEmail(e.target.value)}
              placeholder="support@domain.com"
              required
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Alamat</label>
            <Textarea
              value={profileAddress}
              onChange={(e) => setProfileAddress(e.target.value)}
              placeholder="Jl. Raya No. 123"
              rows={2}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Jam Buka Operasional</label>
            <Input
              value={profileHours}
              onChange={(e) => setProfileHours(e.target.value)}
              placeholder="Senin - Sabtu (08:00 - 17:00 WIB)"
            />
          </div>
          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button type="button" variant="secondary" onClick={() => setActiveEditModal("none")}>
              Batal
            </Button>
            <Button type="submit" isLoading={isSaving} variant="primary">
              Simpan Profil
            </Button>
          </div>
        </form>
      </Modal>

      {/* Custom Instructions Modal */}
      <Modal
        isOpen={activeEditModal === "instructions"}
        onClose={() => setActiveEditModal("none")}
        title="Konfigurasi Custom Instructions & Persona AI"
      >
        <form onSubmit={handleSaveInstructions} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Persona & Identitas Bot</label>
            <Textarea
              value={personaText}
              onChange={(e) => setPersonaText(e.target.value)}
              placeholder="Jelaskan peran bot, nama bot, dan fokus utamanya..."
              rows={3}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Gaya Komunikasi (Tone)</label>
            <Textarea
              value={toneText}
              onChange={(e) => setToneText(e.target.value)}
              placeholder="Contoh: Ramah, ramah tamah, santai tapi profesional..."
              rows={2}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Batasan (Guardrails)</label>
            <Textarea
              value={guardrailsText}
              onChange={(e) => setGuardrailsText(e.target.value)}
              placeholder="Aturan hal-hal yang dilarang dikatakan bot..."
              rows={3}
            />
          </div>
          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button type="button" variant="secondary" onClick={() => setActiveEditModal("none")}>
              Batal
            </Button>
            <Button type="submit" isLoading={isSaving} variant="primary">
              Simpan Instruksi AI
            </Button>
          </div>
        </form>
      </Modal>

      {/* Saluran Chat Modal */}
      <Modal
        isOpen={activeEditModal === "channels"}
        onClose={() => setActiveEditModal("none")}
        title="Pengaturan Balas Otomatis Saluran Chat"
      >
        <form onSubmit={handleSaveChannels} className="space-y-4">
          <div className="space-y-3">
            <label className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 bg-slate-50/50 cursor-pointer">
              <input
                type="checkbox"
                checked={whatsappAutoReply}
                onChange={(e) => setWhatsappAutoReply(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <div>
                <p className="text-xs font-bold text-slate-900">Aktifkan Auto Reply WhatsApp</p>
                <p className="text-[11px] text-slate-500">Kirim balasan AI otomatis untuk pesan masuk WhatsApp.</p>
              </div>
            </label>

            <label className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 bg-slate-50/50 cursor-pointer">
              <input
                type="checkbox"
                checked={instagramAutoReply}
                onChange={(e) => setInstagramAutoReply(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <div>
                <p className="text-xs font-bold text-slate-900">Aktifkan Auto Reply Instagram DM</p>
                <p className="text-[11px] text-slate-500">Kirim balasan AI otomatis untuk DM Instagram bisnis.</p>
              </div>
            </label>

            <label className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 bg-slate-50/50 cursor-pointer">
              <input
                type="checkbox"
                checked={webchatEnabled}
                onChange={(e) => setWebchatEnabled(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <div>
                <p className="text-xs font-bold text-slate-900">Aktifkan Live Chat Widget Website</p>
                <p className="text-[11px] text-slate-500">Tampilkan widget live chat di website publik.</p>
              </div>
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button type="button" variant="secondary" onClick={() => setActiveEditModal("none")}>
              Batal
            </Button>
            <Button type="submit" isLoading={isSaving} variant="primary">
              Simpan Saluran Chat
            </Button>
          </div>
        </form>
      </Modal>

      {/* Bot Activation Modal */}
      <Modal
        isOpen={activeEditModal === "bot_activation"}
        onClose={() => setActiveEditModal("none")}
        title="Pengaturan Mode Utamakan Asisten AI"
      >
        <form onSubmit={handleSaveBot} className="space-y-4">
          <label className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 bg-slate-50/50 cursor-pointer">
            <input
              type="checkbox"
              checked={autoReplyEnabled}
              onChange={(e) => setAutoReplyEnabled(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            <div>
              <p className="text-xs font-bold text-slate-900">Aktifkan Utama Auto Reply AI</p>
              <p className="text-[11px] text-slate-500">Aktifkan sakelar utama agar AI membalas obrolan pelanggan.</p>
            </div>
          </label>

          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Confidence Threshold (%)</label>
            <Input
              type="number"
              min={50}
              max={100}
              value={confidenceThreshold}
              onChange={(e) => setConfidenceThreshold(Number(e.target.value))}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Mode Keamanan Balasan</label>
            <Select
              value={safetyMode}
              onChange={(e) => setSafetyMode(e.target.value as any)}
            >
              <option value="strict">Strict (Sangat Ketat - Hanya fakta pasti)</option>
              <option value="balanced">Balanced (Seimbang - Rekomendasi)</option>
              <option value="aggressive">Aggressive (Kreatif - Lebih responsif)</option>
            </Select>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button type="button" variant="secondary" onClick={() => setActiveEditModal("none")}>
              Batal
            </Button>
            <Button type="submit" isLoading={isSaving} variant="primary">
              Simpan Pengaturan Bot
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
