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
        ? "text-emerald-400 bg-emerald-400/10 border-emerald-400/20"
        : "text-amber-400 bg-amber-400/10 border-amber-400/20",
      note: `Confidence threshold ${config.aiAgent.confidenceThreshold}%`,
      badgeColor: config.aiAgent.autoReplyEnabled
        ? "bg-emerald-400/10 text-emerald-400 border-emerald-400/20"
        : "bg-amber-400/10 text-amber-400 border-amber-400/20",
      badgeText: `Mode ${config.aiAgent.safetyMode}`,
    },
    {
      label: "TIKET TERBUKA",
      value: `${data.tickets.filter((ticket) => ticket.status !== "resolved").length}`,
      icon: Ticket,
      color: "text-amber-400 bg-amber-400/10 border-amber-400/20",
      note: "Handoff, keluhan & eskalasi",
      badgeColor: "bg-amber-400/10 text-amber-400 border-amber-400/20",
      badgeText: `${automationCoverage}% Auto-Rule`,
    },
    {
      label: "KATALOG & FAQ",
      value: `${data.products.length + data.services.length}`,
      icon: Package2,
      color: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
      note: `${data.services.length} layanan | ${config.knowledgeBase.faqs.length} FAQ aktif`,
      badgeColor: "bg-emerald-400/10 text-emerald-400 border-emerald-400/20",
      badgeText: `${data.products.length} Produk`,
    },
  ];

  const controlCenterCards = [
    {
      title: "AI Assistant",
      detail: "Konfigurasi sistem kecerdasan, intent, respons otomatis, FAQ, dan basis pengetahuan jawaban.",
      href: "/ai-agent",
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
      title: "Ticket & Escalation",
      detail: "Kelola antrean komplain pelanggan, status tiket eskalasi, dan histori handoff agen.",
      href: "/tickets",
      icon: Ticket,
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
      href: "/knowledge-base",
      complete:
        config.knowledgeBase.faqs.length > 0 &&
        (config.knowledgeBase.documents.length > 0 ||
          config.knowledgeBase.websiteUrls.length > 0),
      note: `${config.knowledgeBase.faqs.length} FAQ | ${config.knowledgeBase.documents.length} dokumen`,
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
      href: "/ai-agent",
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
      href: "/automation",
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
            <Badge className="border-emerald-500/20 bg-emerald-500/10 text-emerald-400 text-[10px]">
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
          <Card className="p-6 bg-[var(--color-surface)]">
            <div className="border-b border-[var(--color-border)] pb-4 mb-5">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <h3 className="text-base font-bold tracking-tight text-white">
                    Setup & Integrasi Workspace
                  </h3>
                  <p className="mt-1 text-xs text-[var(--color-muted)]">
                    Selesaikan langkah-langkah di bawah untuk memaksimalkan seluruh fitur dashboard.
                  </p>
                </div>
                <Badge className="border-[var(--color-brand)]/20 bg-[var(--color-brand)]/5 text-[var(--color-brand)] self-start sm:self-center font-bold px-2.5 py-0.5">
                  {completedChecklist} dari {setupChecklist.length} Siap
                </Badge>
              </div>

              {/* Progress Bar */}
              <div className="mt-4">
                <div className="flex justify-between text-[10px] font-bold text-[var(--color-muted)] mb-1.5 uppercase">
                  <span>Progress Kelengkapan</span>
                  <span>{checklistPercentage}%</span>
                </div>
                <div className="h-1.5 w-full bg-[var(--color-surface-strong)] rounded-full overflow-hidden border border-[var(--color-border)]">
                  <div
                    className="h-full bg-[var(--color-brand)] rounded-full transition-all duration-300"
                    style={{ width: `${checklistPercentage}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {setupChecklist.map((item) => {
                const Icon = item.complete ? CheckCircle2 : CircleDashed;

                return (
                  <Link
                    key={item.title}
                    href={item.href}
                    className="flex items-start justify-between gap-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-strong)]/20 p-3.5 transition duration-150 hover:border-[var(--color-border-hover)] hover:bg-[var(--color-surface-hover)]/30 group"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-white group-hover:text-[var(--color-brand)] transition-colors duration-150">
                        {item.title}
                      </p>
                      <p className="mt-1 text-[10px] text-[var(--color-muted)] truncate">
                        {item.note}
                      </p>
                    </div>
                    <Icon
                      className={`h-4 w-4 shrink-0 mt-0.5 transition-colors duration-150 ${
                        item.complete ? "text-emerald-400" : "text-amber-400 group-hover:text-amber-300"
                      }`}
                    />
                  </Link>
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
              <ShieldCheck className="h-5 w-5 text-emerald-400" />
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
                <Badge className="bg-emerald-400/10 text-emerald-400 border-emerald-400/20 text-[10px] px-2 py-0">
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
                <span className="text-emerald-400 font-semibold flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
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
