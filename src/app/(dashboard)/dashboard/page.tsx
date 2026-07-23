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
      note: "Handoff, keluhan & eskalasi",
      badgeColor: "bg-amber-50 text-amber-700 border-amber-200 font-bold",
      badgeText: `${automationCoverage}% Auto-Rule`,
    },
  ].filter(Boolean);

  const controlCenterCards = [
    {
      title: "AI Assistant",
      detail: "Konfigurasi sistem kecerdasan, intent, respons otomatis, instruksi, dan pangkalan pengetahuan AI.",
      href: "/automation?tab=ai_agents",
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
      href: "/automation?tab=settings",
      icon: Workflow,
    },
    {
      title: "Broadcasting",
      detail: "Kirim pesan kampanye, penawaran promo, pengumuman terjadwal, dan notifikasi massal.",
      href: "/broadcast",
      icon: SendHorizontal,
    },
  ].filter(Boolean);

  const setupChecklist = [
    {
      title: "Profil Workspace",
      href: "/settings",
      complete:
        Boolean(config.workspace.name.trim()) &&
        Boolean(config.workspace.industry.trim()) &&
        Boolean(config.workspace.supportEmail.trim()) &&
        Boolean(config.workspace.businessHours.trim()) &&
        Boolean(config.workspace.address.trim()),
      note: `${[
        config.workspace.name,
        config.workspace.industry,
        config.workspace.supportEmail,
        config.workspace.businessHours,
        config.workspace.address,
      ].filter((item) => item.trim()).length}/5 profil terisi`,
    },
    {
      title: "Knowledge Base",
      href: "/automation?tab=knowledge_base",
      complete:
        config.knowledgeBase.documents.length > 0 ||
        config.knowledgeBase.websiteUrls.length > 0,
      note: `${config.knowledgeBase.websiteUrls.length} URL | ${config.knowledgeBase.documents.length} dokumen`,
    },
    {
      title: "Integrasi Channel",
      href: "/channels",
      complete:
        config.channels.webchat.enabled ||
        config.channels.whatsapp.status === "connected" ||
        config.channels.instagram.status === "connected",
      note: `${connectedChannels.length} channel terhubung`,
    },
    {
      title: "Konfigurasi AI Provider",
      href: "/automation?tab=ai_agents",
      complete:
        !config.aiProvider.enabled ||
        (Boolean(config.aiProvider.apiKey.trim()) &&
          Boolean(config.aiProvider.model.trim())),
      note: config.aiProvider.enabled
        ? `${config.aiProvider.provider} (${config.aiProvider.model})`
        : "Dinonaktifkan",
    },
    {
      title: "Aturan Automasi",
      href: "/automation?tab=settings",
      complete: activeRules > 0,
      note: `${activeRules}/${config.automation.rules.length} rule aktif`,
    },
    {
      title: "Tim Operator",
      href: "/settings",
      complete: config.team.members.some((member) => member.status === "active"),
      note: `${config.team.members.filter((member) => member.status === "active").length} operator aktif`,
    },
  ];

  const completedChecklist = setupChecklist.filter((item) => item.complete).length;
  const checklistPercentage = Math.round((completedChecklist / setupChecklist.length) * 100);

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-blue-100 bg-white p-5 md:p-6 shadow-2xs">
        <div className="relative z-10 space-y-2">
          <div className="flex items-center gap-2">
            <Badge variant="success" className="text-[10px]">
              Sistem Aktif
            </Badge>
            <span className="text-xs text-slate-500 font-medium">
              Timezone: {config.workspace.timezone}
            </span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 md:text-2xl tracking-tight">
            Selamat datang di Workspace <span className="text-blue-600 font-black">{config.workspace.name}</span>
          </h1>
          <p className="max-w-2xl text-xs md:text-sm leading-relaxed text-slate-600 font-normal">
            Kelola interaksi pelanggan, automasi AI assistant, basis pengetahuan FAQ, booking slot, dan ticket eskalasi dalam satu panel kontrol terpusat yang aman dan andal.
          </p>
        </div>
      </div>

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;

          return (
            <Card key={stat.label} className="relative overflow-hidden p-5 h-[120px] bg-white border border-slate-200 hover:border-slate-300 hover:shadow-md transition-all duration-200 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                  {stat.label}
                </span>
                <div className={`flex h-7 w-7 items-center justify-center rounded-lg border ${stat.color}`}>
                  <Icon className="h-3.5 w-3.5" />
                </div>
              </div>
              <div className="flex items-baseline justify-between mt-1">
                <span className="font-heading text-2xl font-black text-slate-900 tracking-tight">
                  {stat.value}
                </span>
                <span className={`rounded-lg border px-2 py-0.5 text-[9px] font-bold ${stat.badgeColor}`}>
                  {stat.badgeText}
                </span>
              </div>
              <p className="text-xs text-slate-500 truncate" title={stat.note}>
                {stat.note}
              </p>
            </Card>
          );
        })}
      </div>

      {/* Main Content Layout Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        {/* Left Column: Control Center & Checklist */}
        <div className="lg:col-span-3 space-y-6">
          {/* Operational Control Center */}
          <Card className="p-5 md:p-6 bg-white border border-slate-200">
            <div className="border-b border-slate-100 pb-3 mb-4">
              <h3 className="text-base font-bold tracking-tight text-slate-900">
                Pusat Kendali Operasional
              </h3>
              <p className="mt-0.5 text-xs text-slate-500">
                Akses cepat ke berbagai modul utama untuk mengelola respon dan layanan bisnis Anda.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 gap-4">
              {controlCenterCards.map((card) => {
                const Icon = card.icon;
                return (
                  <Link
                    key={card.title}
                    href={card.href}
                    className="flex flex-col justify-between rounded-xl border border-slate-200 bg-slate-50/50 p-4 transition-all duration-150 hover:border-blue-300 hover:bg-blue-50/40 hover:-translate-y-0.5 hover:shadow-md group"
                  >
                    <div>
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-100 border border-blue-200 text-blue-700">
                          <Icon className="h-3.5 w-3.5" />
                        </div>
                        <h4 className="text-xs font-bold text-slate-900 tracking-tight group-hover:text-blue-600 transition-colors duration-150">
                          {card.title}
                        </h4>
                      </div>
                      <p className="mt-2 text-xs leading-relaxed text-slate-500">
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
          <Card className="p-5 md:p-6 bg-white border border-slate-200">
            <div className="border-b border-slate-100 pb-3 mb-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <h3 className="text-base font-bold tracking-tight text-slate-900 flex items-center gap-2">
                    <Zap className="h-4.5 w-4.5 text-blue-600 animate-pulse" />
                    Panduan Cepat Mulai Balesin AI
                  </h3>
                  <p className="mt-0.5 text-xs text-slate-500">
                    Ikuti 5 langkah mudah berikut untuk mengaktifkan asisten AI pintar di bisnis Anda.
                  </p>
                </div>
                <Badge variant="default" className="shrink-0 self-start sm:self-center">
                  {completedChecklist} dari {setupChecklist.length} Siap
                </Badge>
              </div>

              {/* Progress Bar */}
              <div className="mt-4">
                <div className="flex justify-between text-[10px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">
                  <span>Kelengkapan Sistem</span>
                  <span>{checklistPercentage}%</span>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200 p-[1px]">
                  <div
                    className="h-full bg-blue-600 rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${checklistPercentage}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Interactive Timeline Roadmap */}
            <div className="relative border-l border-slate-200 ml-3 pl-6 space-y-4">
              {[
                {
                  step: 1,
                  title: "Lengkapi Profil & Jam Buka Bisnis",
                  desc: "Isi alamat resmi, jam operasional, dan deskripsi bisnis Anda agar AI memiliki informasi dasar yang akurat.",
                  complete: setupChecklist[0].complete,
                  actionText: "Atur Profil Bisnis",
                  onClick: () => setActiveEditModal("profile"),
                },
                {
                  step: 2,
                  title: "Hubungkan Media Sosial (Instagram/WhatsApp)",
                  desc: "Tautkan akun bisnis Instagram DM atau WhatsApp Anda agar AI dapat membalas chat secara otomatis.",
                  complete: setupChecklist[2].complete,
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
                  complete: true,
                  actionText: "Buka Inbox",
                },
              ].map((item) => {
                const isStepComplete = item.complete;
                return (
                  <div key={item.step} className="relative group">
                    {/* Circle Indicator */}
                    <div className={`absolute -left-[33px] top-1 flex h-4 w-4 items-center justify-center rounded-full border transition-all duration-200 ${
                      isStepComplete
                        ? "bg-emerald-500 border-emerald-500 text-white"
                        : "bg-white border-slate-300 text-slate-400"
                    }`}>
                      {isStepComplete ? (
                        <Check className="h-2.5 w-2.5 stroke-[3px]" />
                      ) : (
                        <span className="text-[9px] font-bold">{item.step}</span>
                      )}
                    </div>

                    {/* Content Area */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50/40 p-3.5 transition-all duration-150 group-hover:border-slate-300 group-hover:bg-slate-50">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <h4 className={`text-xs font-bold tracking-tight transition-colors duration-150 ${
                            isStepComplete ? "text-emerald-700" : "text-slate-900"
                          }`}>
                            Langkah {item.step}: {item.title}
                          </h4>
                          {isStepComplete && (
                            <Badge variant="success" className="text-[9px] py-0 px-1.5">
                              Selesai
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs leading-relaxed text-slate-500 max-w-xl">
                          {item.desc}
                        </p>
                      </div>
                      
                      {item.href ? (
                        <Link
                          href={item.href}
                          className={`inline-flex items-center justify-center h-8 px-3 rounded-lg text-xs font-bold transition-all shrink-0 ${
                            isStepComplete
                              ? "bg-white border border-slate-200 text-slate-700 hover:bg-slate-100"
                              : "bg-blue-600 text-white hover:bg-blue-700 shadow-2xs"
                          }`}
                        >
                          {item.actionText}
                          <ArrowRight className="h-3.5 w-3.5 ml-1 transform transition-transform group-hover:translate-x-0.5" />
                        </Link>
                      ) : (
                        <button
                          onClick={item.onClick}
                          className={`inline-flex items-center justify-center h-8 px-3 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer ${
                            isStepComplete
                              ? "bg-white border border-slate-200 text-slate-700 hover:bg-slate-100"
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
        <div className="lg:col-span-1 space-y-6 lg:sticky lg:top-4 h-fit">
          {/* Security & Env Configuration Card */}
          <Card className="p-5 bg-white border border-slate-200">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-3">
              <ShieldCheck className="h-4.5 w-4.5 text-emerald-600" />
              <h3 className="text-xs font-bold tracking-tight text-slate-900">
                Kredensial & Integrasi Aman
              </h3>
            </div>
            <p className="text-xs leading-relaxed text-slate-500">
              Untuk menjamin keamanan operasional, seluruh token API pihak ketiga, secret token webhook, App URL, dan session key tidak disimpan di database, melainkan dikelola langsung melalui variabel lingkungan server (*environment variables*).
            </p>
            <div className="mt-3 space-y-2 border-t border-slate-100 pt-3">
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
          <Card className="p-5 bg-white border border-slate-200">
            <h3 className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-3 mb-3">
              Snapshot Workspace
            </h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3 text-xs">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-blue-50 border border-blue-200 text-[10px] font-bold text-blue-700">
                  WS
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-slate-900 text-xs">Workspace</p>
                  <p className="text-xs text-slate-500 mt-0.5 truncate">
                    {config.workspace.name} ({config.workspace.industry})
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 text-xs">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-blue-50 border border-blue-200 text-[10px] font-bold text-blue-700">
                  AI
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-slate-900 text-xs">Asisten Bot</p>
                  <p className="text-xs text-slate-500 mt-0.5 truncate">
                    {config.aiAgent.name} | {config.aiAgent.blacklist.length} blacklist kata
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 text-xs">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-blue-50 border border-blue-200 text-[10px] font-bold text-blue-700">
                  TK
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-slate-900 text-xs">Support Desk</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {data.tickets.filter((t) => t.status === "in_progress").length} tiket diproses operator
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 text-xs">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-blue-50 border border-blue-200 text-[10px] font-bold text-blue-700">
                  BC
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-slate-900 text-xs">Kampanye Broadcast</p>
                  <p className="text-xs text-slate-500 mt-0.5">
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
              placeholder="Contoh: support@workspace.com"
              required
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Jam Operasional</label>
            <Input
              value={profileHours}
              onChange={(e) => setProfileHours(e.target.value)}
              placeholder="Contoh: Sabtu - Kamis: 08.00 - 17.00, Jumat: Libur"
              required
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Alamat Lengkap</label>
            <Textarea
              value={profileAddress}
              onChange={(e) => setProfileAddress(e.target.value)}
              placeholder="Contoh: Jl. Jati Raya, D2 No.6, Bekasi Jaya..."
              rows={3}
              required
            />
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setActiveEditModal("none")}
              disabled={isSaving}
            >
              Batal
            </Button>
            <Button type="submit" isLoading={isSaving} variant="primary">
              Simpan Perubahan
            </Button>
          </div>
        </form>
      </Modal>

      {/* Hubungkan Channel Modal */}
      <Modal
        isOpen={activeEditModal === "channels"}
        onClose={() => setActiveEditModal("none")}
        title="Hubungkan Saluran Chat"
      >
        <form onSubmit={handleSaveChannels} className="space-y-5">
          <p className="text-xs text-slate-500 leading-relaxed">
            Aktifkan fitur balas otomatis AI untuk masing-masing saluran komunikasi berikut setelah Anda menyambungkannya:
          </p>
          
          <div className="space-y-3">
            {/* WhatsApp */}
            <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 bg-slate-50/50">
              <div className="space-y-0.5">
                <p className="text-xs font-bold text-slate-900">WhatsApp Business</p>
                <p className="text-[11px] text-slate-500">
                  Status koneksi saat ini: <span className={config?.channels?.whatsapp?.status === "connected" ? "text-emerald-600 font-bold" : "text-amber-600 font-bold"}>
                    {config?.channels?.whatsapp?.status === "connected" ? "Terhubung" : "Belum Terhubung"}
                  </span>
                </p>
              </div>
              <input
                type="checkbox"
                checked={whatsappAutoReply}
                onChange={(e) => setWhatsappAutoReply(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
              />
            </div>

            {/* Instagram */}
            <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 bg-slate-50/50">
              <div className="space-y-0.5">
                <p className="text-xs font-bold text-slate-900">Instagram DM</p>
                <p className="text-[11px] text-slate-500">
                  Status koneksi saat ini: <span className={config?.channels?.instagram?.status === "connected" ? "text-emerald-600 font-bold" : "text-amber-600 font-bold"}>
                    {config?.channels?.instagram?.status === "connected" ? "Terhubung" : "Belum Terhubung"}
                  </span>
                </p>
              </div>
              <input
                type="checkbox"
                checked={instagramAutoReply}
                onChange={(e) => setInstagramAutoReply(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
              />
            </div>

            {/* Web Chat */}
            <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 bg-slate-50/50">
              <div className="space-y-0.5">
                <p className="text-xs font-bold text-slate-900">Live Web Chat Widget</p>
                <p className="text-[11px] text-slate-500">Aktifkan widget obrolan di halaman website utama.</p>
              </div>
              <input
                type="checkbox"
                checked={webchatEnabled}
                onChange={(e) => setWebchatEnabled(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setActiveEditModal("none")}
              disabled={isSaving}
            >
              Batal
            </Button>
            <Button type="submit" isLoading={isSaving} variant="primary">
              Simpan Saluran
            </Button>
          </div>
        </form>
      </Modal>

      {/* Custom Instructions Modal */}
      <Modal
        isOpen={activeEditModal === "instructions"}
        onClose={() => setActiveEditModal("none")}
        title="Atur Persona & Panduan Gaya Bicara AI"
        className="max-w-2xl"
      >
        <form onSubmit={handleSaveInstructions} className="space-y-4">
          <p className="text-xs text-slate-500 leading-relaxed">
            Tulis persona, gaya bahasa, dan batasan agar AI dapat melayani pelanggan dengan tepat sesuai standar bisnis Anda.
          </p>

          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">1. Persona & Identitas</label>
            <Textarea
              value={personaText}
              onChange={(e) => setPersonaText(e.target.value)}
              placeholder="Contoh: Nama bot adalah Balesin Assistant. Sopan, ramah, sigap, dan siap membantu menjawab pertanyaan seputar layanan kami..."
              rows={4}
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">2. Gaya Bahasa (Tone of Voice)</label>
            <Textarea
              value={toneText}
              onChange={(e) => setToneText(e.target.value)}
              placeholder="Contoh: Menggunakan panggilan 'Kak' atau 'Sahabat'. Sopan dan profesional..."
              rows={3}
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">3. Aturan & Batasan (Guardrails)</label>
            <Textarea
              value={guardrailsText}
              onChange={(e) => setGuardrailsText(e.target.value)}
              placeholder="Contoh: Dilarang mengarang harga servis. Wajib arahkan customer ke link booking/produk..."
              rows={4}
              required
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setActiveEditModal("none")}
              disabled={isSaving}
            >
              Batal
            </Button>
            <Button type="submit" isLoading={isSaving} variant="primary">
              Simpan Instruksi
            </Button>
          </div>
        </form>
      </Modal>

      {/* Bot Activation Modal */}
      <Modal
        isOpen={activeEditModal === "bot_activation"}
        onClose={() => setActiveEditModal("none")}
        title="Aktifkan & Atur Sensitivitas AI Bot"
      >
        <form onSubmit={handleSaveBot} className="space-y-5">
          {/* Auto Reply Toggle */}
          <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200 bg-slate-50/50">
            <div className="space-y-0.5">
              <p className="text-xs font-bold text-slate-900">Status Balas Otomatis AI</p>
              <p className="text-[11px] text-slate-500">Nyalakan agar AI otomatis membalas chat pelanggan secara real-time.</p>
            </div>
            <input
              type="checkbox"
              checked={autoReplyEnabled}
              onChange={(e) => setAutoReplyEnabled(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
            />
          </div>

          {/* Confidence Threshold */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-semibold text-slate-600">
              <span className="uppercase tracking-wider">Confidence Threshold ({confidenceThreshold}%)</span>
              <span className="text-[11px] text-slate-500">Akurasi minimum AI</span>
            </div>
            <input
              type="range"
              min="10"
              max="99"
              value={confidenceThreshold}
              onChange={(e) => setConfidenceThreshold(Number(e.target.value))}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Semakin tinggi batas akurasi, semakin selektif bot membalas. Pesan di bawah batas ini akan otomatis dilemparkan ke Inbox untuk dibalas admin secara manual.
            </p>
          </div>

          {/* Safety Mode */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Mode Keamanan Balasan</label>
            <Select
              value={safetyMode}
              onChange={(e) => setSafetyMode(e.target.value as "strict" | "balanced" | "aggressive")}
            >
              <option value="strict">Strict (Sangat Ketat)</option>
              <option value="balanced">Balanced (Sedang/Seimbang)</option>
              <option value="aggressive">Aggressive (Bebas/Agresif)</option>
            </Select>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setActiveEditModal("none")}
              disabled={isSaving}
            >
              Batal
            </Button>
            <Button type="submit" isLoading={isSaving} variant="primary">
              Aktifkan Pengaturan
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
