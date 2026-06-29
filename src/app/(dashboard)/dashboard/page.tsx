"use client";

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
} from "lucide-react";

import { useDashboardConfig } from "@/hooks/use-dashboard-config";
import { useDashboardOperations } from "@/hooks/use-dashboard-operations";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

export default function DashboardPage() {
  const { config } = useDashboardConfig();
  const { data } = useDashboardOperations();

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
      color: "text-[var(--color-brand)] bg-[var(--color-brand)]/10 border-[var(--color-brand)]/20",
      note: connectedChannels.length > 0 ? connectedChannels.join(", ") : "Tidak ada channel aktif",
      badgeColor: "bg-[var(--color-brand)]/10 text-[var(--color-brand)] border-[var(--color-brand)]/20",
      badgeText: `${connectedChannels.length} Live`,
    },
    {
      label: "AUTO REPLY AI",
      value: config.aiAgent.autoReplyEnabled ? "ON" : "OFF",
      icon: Zap,
      color: config.aiAgent.autoReplyEnabled
        ? "text-[var(--color-success)] bg-[var(--color-success)]/10 border-[var(--color-success)]/20"
        : "text-[var(--color-warning)] bg-[var(--color-warning)]/10 border-[var(--color-warning)]/20",
      note: `Confidence threshold ${config.aiAgent.confidenceThreshold}%`,
      badgeColor: config.aiAgent.autoReplyEnabled
        ? "bg-[var(--color-success)]/10 text-[var(--color-success)] border-[var(--color-success)]/20"
        : "bg-[var(--color-warning)]/10 text-[var(--color-warning)] border-[var(--color-warning)]/20",
      badgeText: `Mode ${config.aiAgent.safetyMode}`,
    },
    {
      label: "TIKET TERBUKA",
      value: `${data.tickets.filter((ticket) => ticket.status !== "resolved").length}`,
      icon: Ticket,
      color: "text-[var(--color-warning)] bg-[var(--color-warning)]/10 border-[var(--color-warning)]/20",
      note: "Handoff, keluhan & eskalasi",
      badgeColor: "bg-[var(--color-warning)]/10 text-[var(--color-warning)] border-[var(--color-warning)]/20",
      badgeText: `${automationCoverage}% Auto-Rule`,
    },
    {
      label: "KATALOG & LAYANAN",
      value: `${data.products.length + data.services.length}`,
      icon: Package2,
      color: "text-[var(--color-success)] bg-[var(--color-success)]/10 border-[var(--color-success)]/20",
      note: `${data.services.length} layanan | ${data.products.length} produk terdaftar`,
      badgeColor: "bg-[var(--color-success)]/10 text-[var(--color-success)] border-[var(--color-success)]/20",
      badgeText: `${data.products.length} Produk`,
    },
  ];

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
      title: "Katalog & Layanan",
      detail: "Kelola daftar produk, paket servis operasional, sparepart, dan sinkronisasi reservasi.",
      href: "/products-services",
      icon: Package2,
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
  ];

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
      title: "Katalog Produk & Servis",
      href: "/products-services",
      complete: data.products.length > 0 && data.services.length > 0,
      note: `${data.products.length} produk | ${data.services.length} layanan`,
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
      <div className="relative overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 md:p-8">
        <div className="relative z-10 space-y-2">
          <div className="flex items-center gap-2">
            <Badge className="border-[var(--color-success)]/20 bg-[var(--color-success)]/10 text-[var(--color-success)] text-[10px]">
              Sistem Aktif
            </Badge>
            <span className="text-xs text-[var(--color-muted)] font-medium">
              Timezone: {config.workspace.timezone}
            </span>
          </div>
          <h1 className="text-2xl font-bold text-white md:text-3xl tracking-tight mt-1">
            Selamat datang di Workspace <span className="text-[var(--color-brand)]">{config.workspace.name}</span>
          </h1>
          <p className="max-w-3xl text-sm leading-relaxed text-[var(--color-muted)]">
            Kelola interaksi pelanggan, automasi AI assistant, basis pengetahuan FAQ, booking slot, dan ticket eskalasi dalam satu panel kontrol terpusat yang aman dan andal.
          </p>
        </div>
      </div>

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;

          return (
            <Card key={stat.label} className="relative overflow-hidden p-5 bg-[var(--color-surface)] hover:border-[var(--color-border-hover)] transition duration-200">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-muted)]">
                  {stat.label}
                </span>
                <div className={`flex h-8 w-8 items-center justify-center rounded border ${stat.color}`}>
                  <Icon className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-4">
                <span className="font-sans text-3xl font-extrabold text-white tracking-tight">
                  {stat.value}
                </span>
                <div className="mt-2 flex items-center gap-1.5">
                  <span className={`rounded-md border px-2 py-0.5 text-[10px] font-semibold ${stat.badgeColor}`}>
                    {stat.badgeText}
                  </span>
                </div>
                <p className="mt-3 text-[11px] leading-5 text-[var(--color-muted)]">
                  {stat.note}
                </p>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Main Content Layout Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Column: Control Center & Checklist */}
        <div className="lg:col-span-2 space-y-6">
          {/* Operational Control Center */}
          <Card className="p-6 bg-[var(--color-surface)]">
            <div className="border-b border-[var(--color-border)] pb-4 mb-5">
              <h3 className="text-base font-bold tracking-tight text-white">
                Pusat Kendali Operasional
              </h3>
              <p className="mt-1 text-xs text-[var(--color-muted)]">
                Akses cepat ke berbagai modul utama untuk mengelola respon dan layanan bisnis Anda.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {controlCenterCards.map((card) => {
                const Icon = card.icon;
                return (
                  <Link
                    key={card.title}
                    href={card.href}
                    className="flex flex-col justify-between rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-strong)]/30 p-4 transition-all duration-200 hover:border-[var(--color-border-hover)] hover:bg-[var(--color-surface-hover)]/30 group"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <div className="flex h-7 w-7 items-center justify-center rounded bg-[var(--color-surface-hover)] border border-[var(--color-border)] text-[var(--color-brand)]">
                          <Icon className="h-3.5 w-3.5" />
                        </div>
                        <h4 className="text-sm font-bold text-white tracking-tight group-hover:text-[var(--color-brand)] transition-colors duration-150">
                          {card.title}
                        </h4>
                      </div>
                      <p className="mt-3 text-xs leading-relaxed text-[var(--color-muted)]">
                        {card.detail}
                      </p>
                    </div>
                    <div className="mt-4 flex items-center gap-1.5 text-[11px] font-bold text-[var(--color-brand)] group-hover:text-[var(--color-brand-hover)] transition-colors duration-150">
                      Buka Modul
                      <ArrowRight className="h-3 w-3 transform group-hover:translate-x-0.5 transition-transform duration-150" />
                    </div>
                  </Link>
                );
              })}
            </div>
          </Card>

          {/* Setup Checklist Progress */}
          <Card className="p-6 bg-[var(--color-surface)] border border-[var(--color-border)]">
            <div className="border-b border-[var(--color-border)] pb-4 mb-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <h3 className="text-base font-bold tracking-tight text-white flex items-center gap-2">
                    <Zap className="h-5 w-5 text-[var(--color-brand)] animate-pulse" />
                    Panduan Cepat Mulai Balesin AI
                  </h3>
                  <p className="mt-1 text-xs text-[var(--color-muted)]">
                    Ikuti 5 langkah mudah berikut untuk mengaktifkan asisten AI pintar di bengkel Anda.
                  </p>
                </div>
                <Badge className="border-[var(--color-brand)]/20 bg-[var(--color-brand)]/5 text-[var(--color-brand)] font-bold px-2.5 py-1 text-xs">
                  {completedChecklist} dari {setupChecklist.length} Siap
                </Badge>
              </div>

              {/* Progress Bar */}
              <div className="mt-4">
                <div className="flex justify-between text-[10px] font-bold text-[var(--color-muted)] mb-2 uppercase tracking-wider">
                  <span>Kelengkapan Sistem</span>
                  <span>{checklistPercentage}%</span>
                </div>
                <div className="h-2 w-full bg-[var(--color-surface-strong)] rounded-full overflow-hidden border border-[var(--color-border)] p-[1px]">
                  <div
                    className="h-full bg-gradient-to-r from-[var(--color-brand)] to-cyan-400 rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${checklistPercentage}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Interactive Timeline Roadmap */}
            <div className="relative border-l-2 border-white/8 ml-3.5 pl-6 space-y-8">
              {[
                {
                  step: 1,
                  title: "Lengkapi Profil & Jam Buka Bengkel",
                  desc: "Isi alamat resmi, jam operasional (Sabtu-Kamis), dan deskripsi bengkel Anda agar AI memiliki informasi dasar yang akurat.",
                  href: "/settings",
                  complete: setupChecklist[0].complete,
                  actionText: "Atur Profil Bengkel",
                },
                {
                  step: 2,
                  title: "Hubungkan Media Sosial (Instagram/WhatsApp)",
                  desc: "Tautkan akun bisnis Instagram DM atau WhatsApp Anda agar AI dapat membalas chat secara otomatis.",
                  href: "/channels",
                  complete: setupChecklist[3].complete,
                  actionText: "Hubungkan Saluran Chat",
                },
                {
                  step: 3,
                  title: "Buat Custom Instructions & Persona AI",
                  desc: "Atur identitas asisten AI (seperti Johan Garage, nada santai anak motor/mekanik, sapaan 'pren', dan aturan dilarang mengarang harga).",
                  href: "/automation/knowledge-base",
                  complete: Boolean(config.aiAgent.replyInstructions?.trim()),
                  actionText: "Tulis Instruksi AI",
                },
                {
                  step: 4,
                  title: "Aktifkan Fitur Balas Otomatis AI (Auto Reply)",
                  desc: "Nyalakan tombol utama Auto Reply agar sistem memproses dan menjawab chat masuk berdasarkan kecerdasan buatan.",
                  href: "/automation/chatbot-settings",
                  complete: config.aiAgent.autoReplyEnabled,
                  actionText: "Nyalakan Auto Reply",
                },
                {
                  step: 5,
                  title: "Pantau Chat & Intervensi di Unified Inbox",
                  desc: "Monitor semua chat yang masuk secara terpadu. Admin manusia dapat mengambil alih percakapan kapan saja untuk kenyamanan pelanggan.",
                  href: "/inbox",
                  complete: true,
                  actionText: "Buka Inbox Percakapan",
                },
              ].map((item) => {
                const isStepComplete = item.complete;
                return (
                  <div key={item.step} className="relative group">
                    {/* Circle Indicator */}
                    <div className={`absolute -left-[35px] top-0.5 flex h-[18px] w-[18px] items-center justify-center rounded-full border-2 transition-all duration-200 ${
                      isStepComplete
                        ? "bg-[var(--color-success)] border-[var(--color-success)] text-slate-950 font-bold"
                        : "bg-[var(--color-surface)] border-slate-600 text-slate-500 font-semibold"
                    }`}>
                      {isStepComplete ? (
                        <CheckCircle2 className="h-3.5 w-3.5 text-slate-950 stroke-[3px]" />
                      ) : (
                        <span className="text-[9px]">{item.step}</span>
                      )}
                    </div>

                    {/* Content Area */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-xl border border-white/4 bg-white/[0.01] p-4 transition-all duration-150 group-hover:border-white/8 group-hover:bg-white/[0.03]">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className={`text-xs font-bold tracking-tight transition-colors duration-150 ${
                            isStepComplete ? "text-emerald-400" : "text-white"
                          }`}>
                            Langkah {item.step}: {item.title}
                          </h4>
                          {isStepComplete && (
                            <span className="rounded bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 text-[9px] font-black text-emerald-400 uppercase tracking-wider">
                              Selesai
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] leading-relaxed text-[var(--color-muted)] max-w-xl">
                          {item.desc}
                        </p>
                      </div>
                      <Link
                        href={item.href}
                        className={`inline-flex items-center justify-center h-8.5 px-4 rounded-lg text-[10px] font-bold tracking-tight transition-all shrink-0 ${
                          isStepComplete
                            ? "bg-white/5 border border-white/8 text-slate-300 hover:bg-white/10"
                            : "bg-[var(--color-brand)] text-slate-950 hover:bg-[var(--color-brand-hover)] shadow-sm"
                        }`}
                      >
                        {item.actionText}
                        <ArrowRight className="h-3 w-3 ml-1.5 transform transition-transform group-hover:translate-x-0.5" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>

        {/* Right Column: API Credentials Info & Workspace Snapshot */}
        <div className="space-y-6">
          {/* Security & Env Configuration Card */}
          <Card className="p-6 bg-[var(--color-surface)] border border-[var(--color-border)]">
            <div className="flex items-center gap-2.5 border-b border-[var(--color-border)] pb-4 mb-4">
              <ShieldCheck className="h-5 w-5 text-[var(--color-success)]" />
              <h3 className="text-sm font-bold tracking-tight text-white">
                Kredensial & Integrasi Aman
              </h3>
            </div>
            <p className="text-xs leading-relaxed text-[var(--color-muted)]">
              Untuk menjamin keamanan operasional, seluruh token API pihak ketiga, secret token webhook, App URL, dan session key tidak disimpan di database frontend, melainkan dikelola langsung melalui variabel lingkungan server (*environment variables*).
            </p>
            <div className="mt-4 space-y-2 border-t border-[var(--color-border)] pt-4">
              <div className="flex items-center justify-between text-[11px] py-1">
                <span className="text-[var(--color-muted)] font-medium">App Environment</span>
                <Badge className="bg-[var(--color-success)]/10 text-[var(--color-success)] border-[var(--color-success)]/20 text-[10px] px-2 py-0">
                  Secure Live
                </Badge>
              </div>
              <div className="flex items-center justify-between text-[11px] py-1">
                <span className="text-[var(--color-muted)] font-medium">AI Provider API Key</span>
                <span className="font-mono text-slate-300">
                  {config.aiProvider.enabled && config.aiProvider.apiKey.trim()
                    ? "••••••••••••••••"
                    : "Not Configured"}
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px] py-1">
                <span className="text-[var(--color-muted)] font-medium">Workspace Status</span>
                <span className="text-[var(--color-success)] font-semibold flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-success)] animate-pulse" />
                  Online
                </span>
              </div>
            </div>
          </Card>

          {/* System Workspace Snapshot */}
          <Card className="p-6 bg-[var(--color-surface)]">
            <h3 className="text-xs font-bold uppercase tracking-wider text-white border-b border-[var(--color-border)] pb-3 mb-4">
              Snapshot Workspace
            </h3>
            <div className="space-y-3.5">
              <div className="flex items-start gap-3 text-xs">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-[var(--color-surface-hover)] border border-[var(--color-border)] text-[10px] font-bold text-[var(--color-brand)]">
                  WS
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-white text-[11px]">Workspace</p>
                  <p className="text-[10px] text-[var(--color-muted)] mt-0.5 truncate">
                    {config.workspace.name} ({config.workspace.industry})
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 text-xs">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-[var(--color-surface-hover)] border border-[var(--color-border)] text-[10px] font-bold text-[var(--color-brand)]">
                  AI
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-white text-[11px]">Asisten Bot</p>
                  <p className="text-[10px] text-[var(--color-muted)] mt-0.5 truncate">
                    {config.aiAgent.name} | {config.aiAgent.blacklist.length} blacklist kata
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 text-xs">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-[var(--color-surface-hover)] border border-[var(--color-border)] text-[10px] font-bold text-[var(--color-brand)]">
                  TK
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-white text-[11px]">Support Desk</p>
                  <p className="text-[10px] text-[var(--color-muted)] mt-0.5">
                    {data.tickets.filter((t) => t.status === "in_progress").length} tiket sedang diproses operator
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 text-xs">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-[var(--color-surface-hover)] border border-[var(--color-border)] text-[10px] font-bold text-[var(--color-brand)]">
                  BC
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-white text-[11px]">Kampanye Broadcast</p>
                  <p className="text-[10px] text-[var(--color-muted)] mt-0.5">
                    {data.broadcasts.filter((item) => item.status === "sent").length} terkirim | {data.broadcasts.filter((item) => item.status === "scheduled").length} dijadwalkan
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
