"use client";

import Link from "next/link";
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  CircleDashed,
  MessageSquare,
  Package2,
  Ticket,
  TrendingUp,
  Users,
  Wifi,
  Zap,
} from "lucide-react";

import { useDashboardConfig } from "@/hooks/use-dashboard-config";
import { useDashboardOperations } from "@/hooks/use-dashboard-operations";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
      label: "Omnichannel Active",
      value: `${data.conversations.length}`,
      change: `${connectedChannels.length} channel`,
      icon: MessageSquare,
      color: "text-[var(--color-brand)] bg-[var(--color-brand)]/10 border-[var(--color-brand)]/20",
      note:
        connectedChannels.length > 0 ? connectedChannels.join(", ") : "Belum ada channel live",
    },
    {
      label: "Auto Reply",
      value: config.aiAgent.autoReplyEnabled ? "ON" : "OFF",
      change: `${config.aiAgent.confidenceThreshold}% safe`,
      icon: Zap,
      color: "text-[var(--color-brand)] bg-[var(--color-brand)]/10 border-[var(--color-brand)]/20",
      note: `Mode ${config.aiAgent.safetyMode} | balasan otomatis terkendali`,
    },
    {
      label: "Open Tickets",
      value: `${data.tickets.filter((ticket) => ticket.status !== "resolved").length}`,
      change: `${automationCoverage}% rule`,
      icon: Ticket,
      color: "text-[var(--color-warning)] bg-[var(--color-warning)]/10 border-[var(--color-warning)]/20",
      note: "Kasus handoff, komplain, dan follow-up admin",
    },
    {
      label: "Catalog Ready",
      value: `${data.products.length + data.services.length}`,
      change: `${data.products.length} produk`,
      icon: Package2,
      color: "text-[var(--color-success)] bg-[var(--color-success)]/10 border-[var(--color-success)]/20",
      note: `${data.services.length} layanan | ${config.knowledgeBase.faqs.length} FAQ grounding`,
    },
  ];

  const controlCenterCards = [
    {
      title: "Pusat balasan & knowledge",
      detail:
        "Intent, prompt, draft respons, guardrail, FAQ, dan dokumen sumber jawaban dikelola dari dashboard.",
      href: "/ai-agent",
    },
    {
      title: "Produk, Layanan, dan Booking",
      detail:
        "Harga, stok, sparepart, paket servis, dan booking dibaca dari control center operasional yang sama.",
      href: "/products-services",
    },
    {
      title: "Ticket, Broadcast, dan Automation",
      detail:
        "Threshold handoff, campaign follow-up, reminder booking, moderation, queue worker, dan ticket escalation dipusatkan di dashboard.",
      href: "/tickets",
    },
  ];

  const recentActivities = [
    {
      id: 1,
      label: "Workspace",
      value: config.workspace.name,
      meta: `${config.workspace.industry} | ${config.workspace.timezone}`,
    },
    {
      id: 2,
      label: "AI Assistant",
      value: config.aiAgent.name,
      meta: `${config.aiAgent.blacklist.length} blacklist item | fallback siap`,
    },
    {
      id: 3,
      label: "Ticket Desk",
      value: `${data.tickets.length} ticket tercatat`,
      meta: `${data.tickets.filter((ticket) => ticket.status === "in_progress").length} sedang diproses admin`,
    },
    {
      id: 4,
      label: "Broadcast",
      value: `${data.broadcasts.length} campaign`,
      meta: `${data.broadcasts.filter((item) => item.status === "scheduled").length} terjadwal | ${data.broadcasts.filter((item) => item.status === "sent").length} terkirim`,
    },
  ];

  const setupChecklist = [
    {
      title: "Profil workspace",
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
      ].filter((item) => item.trim()).length}/5 data inti terisi`,
    },
    {
      title: "Knowledge base",
      href: "/knowledge-base",
      complete:
        config.knowledgeBase.faqs.length > 0 &&
        (config.knowledgeBase.documents.length > 0 ||
          config.knowledgeBase.websiteUrls.length > 0),
      note: `${config.knowledgeBase.faqs.length} FAQ | ${config.knowledgeBase.documents.length} dokumen | ${config.knowledgeBase.websiteUrls.length} URL`,
    },
    {
      title: "Katalog produk & layanan",
      href: "/products-services",
      complete: data.products.length > 0 && data.services.length > 0,
      note: `${data.products.length} produk | ${data.services.length} layanan`,
    },
    {
      title: "Channel live",
      href: "/channels",
      complete:
        config.channels.webchat.enabled ||
        config.channels.whatsapp.status === "connected" ||
        config.channels.instagram.status === "connected",
      note: `${connectedChannels.length} channel aktif`,
    },
    {
      title: "AI provider",
      href: "/ai-agent",
      complete:
        !config.aiProvider.enabled ||
        (Boolean(config.aiProvider.apiKey.trim()) &&
          Boolean(config.aiProvider.model.trim())),
      note: config.aiProvider.enabled
        ? `${config.aiProvider.provider} | ${config.aiProvider.vectorStore}`
        : "Belum diaktifkan",
    },
    {
      title: "Automation rules",
      href: "/automation",
      complete: activeRules > 0,
      note: `${activeRules}/${config.automation.rules.length} rule aktif`,
    },
    {
      title: "Team operator",
      href: "/settings",
      complete: config.team.members.some((member) => member.status === "active"),
      note: `${config.team.members.filter((member) => member.status === "active").length} member aktif`,
    },
  ];

  const completedChecklist = setupChecklist.filter((item) => item.complete).length;

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 md:p-8">
        <div className="absolute right-6 bottom-0 translate-y-1/4 opacity-10">
          <Building2 className="h-48 w-48 text-[var(--color-brand)]" />
        </div>
        <div className="relative z-10 space-y-3">
          <Badge className="border-white/12 bg-white/6 text-slate-200">
            Workspace Operasional
          </Badge>
          <h1 className="text-2xl font-bold text-white md:text-3xl tracking-tight">
            Semua data operasional sekarang bisa Anda kelola dari dashboard{" "}
            <span className="text-[var(--color-brand)]">{config.workspace.name}</span>
          </h1>
          <p className="max-w-3xl text-sm leading-relaxed text-[var(--color-muted)]">
            Dashboard ini sekarang mengikuti blueprint omnichannel: dashboard overview, unified inbox,
            contacts/CRM, AI assistant, knowledge base, products & services, booking, tickets,
            automation, campaign, channels, reports, dan team/settings. Jadi setup operasional
            tidak lagi tercecer.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;

          return (
            <Card key={stat.label} className="relative overflow-hidden p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-muted)]">{stat.label}</span>
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded border ${stat.color}`}
                >
                  <Icon className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-4">
                <span className="font-heading text-2xl font-bold text-white">
                  {stat.value}
                </span>
                <div className="mt-1.5 flex items-center gap-1.5">
                  <span className="rounded bg-[var(--color-success)]/10 px-1.5 py-0.5 text-[10px] font-bold text-[var(--color-success)] border border-[var(--color-success)]/20">
                    {stat.change}
                  </span>
                </div>
                <p className="mt-3 text-[11px] leading-5 text-[var(--color-muted)]">{stat.note}</p>
              </div>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <Card className="p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold tracking-tight text-white">Checklist Setup</h3>
              <p className="mt-1 text-xs leading-relaxed text-[var(--color-muted)]">
                Panel ini menunjukkan bagian mana yang masih perlu Anda isi dari dashboard.
              </p>
            </div>
            <Badge className="border-white/12 bg-white/6 text-slate-200">
              {completedChecklist}/{setupChecklist.length} siap
            </Badge>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {setupChecklist.map((item) => {
              const Icon = item.complete ? CheckCircle2 : CircleDashed;

              return (
                <Link
                  key={item.title}
                  href={item.href}
                  className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-hover)]/20 p-4 transition hover:border-[var(--color-border-hover)] hover:bg-[var(--color-surface-hover)]/40"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-white">{item.title}</p>
                      <p className="mt-2 text-xs leading-6 text-[var(--color-muted)]">
                        {item.note}
                      </p>
                    </div>
                    <Icon
                      className={`mt-0.5 h-4 w-4 shrink-0 ${
                        item.complete ? "text-emerald-300" : "text-amber-300"
                      }`}
                    />
                  </div>
                </Link>
              );
            })}
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center gap-3">
            <Ticket className="h-4 w-4 text-[var(--color-brand)]" />
            <h3 className="text-sm font-bold tracking-tight text-white">
              Yang Masih Manual
            </h3>
          </div>
          <div className="mt-4 space-y-3 text-xs leading-6 text-[var(--color-muted)]">
            <p>
              Dashboard sekarang sudah menampung data operasional inti. Yang tetap perlu Anda isi
              manual hanya secret session server dan kredensial integrasi yang memang rahasia.
            </p>
            <p>
              `App URL`, `worker secret`, channel token, AI provider, produk, layanan, customer,
              booking, ticket, knowledge base, dan rule automation sekarang bisa Anda kelola dari dashboard.
            </p>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 lg:col-span-2">
          <div className="mb-5 flex items-center justify-between">
            <h3 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-white">
              <TrendingUp className="h-4 w-4 text-[var(--color-brand)]" />
              Control Surface
            </h3>
            <span className="text-xs font-medium text-[var(--color-muted)]">
              Sumber data lintas modul
            </span>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {controlCenterCards.map((card) => (
              <Card key={card.title} className="bg-[var(--color-surface-hover)]/30 p-5">
                <h4 className="text-sm font-bold text-white tracking-tight">{card.title}</h4>
                <p className="mt-3 text-xs leading-relaxed text-[var(--color-muted)]">{card.detail}</p>
                <Link
                  href={card.href}
                  className="mt-5 inline-flex items-center gap-1.5 text-xs font-bold text-[var(--color-brand)] transition hover:text-[var(--color-brand-hover)]"
                >
                  Buka modul
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </Card>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
          <h3 className="mb-4 text-xs font-bold uppercase tracking-wide text-white">
            Snapshot Operasional
          </h3>
          <div className="space-y-4">
            {recentActivities.map((item) => (
              <div key={item.id} className="flex items-start gap-3 text-xs leading-normal">
                <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-[var(--color-brand)]/20 bg-[var(--color-brand)]/10 text-[10px] font-bold text-[var(--color-brand)]">
                  {item.label.slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex justify-between">
                    <span className="font-bold text-white">{item.label}</span>
                  </div>
                  <p className="mt-0.5 text-[11px] text-slate-300">{item.value}</p>
                  <p className="mt-0.5 text-[10px] text-[var(--color-muted)]">{item.meta}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <Card className="flex flex-col justify-between p-5 hover:border-[var(--color-border-hover)] transition-all">
          <div>
            <h4 className="text-sm font-bold text-white tracking-tight">Kelola knowledge & balasan</h4>
            <p className="mt-2 text-xs leading-relaxed text-[var(--color-muted)]">
              Edit intent, prompt, threshold, FAQ, dokumen, dan profil bisnis yang dipakai sistem balasan.
            </p>
          </div>
          <Link href="/ai-agent" className="block pt-4">
            <Button variant="secondary" className="h-9 w-full py-2 text-xs">
              Buka AI Assistant
            </Button>
          </Link>
        </Card>

        <Card className="flex flex-col justify-between p-5 hover:border-[var(--color-border-hover)] transition-all">
          <div>
            <h4 className="text-sm font-bold text-white tracking-tight">Atur WA, IG, Web Chat</h4>
            <p className="mt-2 text-xs leading-relaxed text-[var(--color-muted)]">
              Token, webhook, DM automation, comment guard, dan widget web chat diatur dari dashboard.
            </p>
          </div>
          <Link href="/channels" className="block pt-4">
            <Button variant="secondary" className="h-9 w-full py-2 text-xs">
              Hubungkan Channel
            </Button>
          </Link>
        </Card>

        <Card className="flex flex-col justify-between p-5 hover:border-[var(--color-border-hover)] transition-all">
          <div>
            <h4 className="text-sm font-bold text-white tracking-tight">Atur Ticket & Automation</h4>
            <p className="mt-2 text-xs leading-relaxed text-[var(--color-muted)]">
              Handoff admin, safety threshold, follow-up delay, queue worker, dan reminder booking sekarang satu panel.
            </p>
          </div>
          <Link href="/tickets" className="block pt-4">
            <Button variant="secondary" className="h-9 w-full py-2 text-xs">
              Buka Ticket Desk
            </Button>
          </Link>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Card className="p-5">
          <div className="flex items-center gap-3">
            <MessageSquare className="h-4 w-4 text-[var(--color-brand)]" />
            <h4 className="text-sm font-bold text-white tracking-tight">Inbox-Ready Setup</h4>
          </div>
          <p className="mt-3 text-xs leading-relaxed text-[var(--color-muted)]">
            Semua modul ini sekarang mengisi konteks yang nantinya dibaca inbox:
            draft respons, customer handoff, knowledge grounding, pricing lookup, booking context,
            dan rule moderation.
          </p>
        </Card>

        <Card className="p-5">
          <div className="flex items-center gap-3">
            <Users className="h-4 w-4 text-[var(--color-brand)]" />
            <h4 className="text-sm font-bold text-white tracking-tight">Team-Ready Workspace</h4>
          </div>
          <p className="mt-3 text-xs leading-relaxed text-[var(--color-muted)]">
            Pengaturan workspace, anggota tim, dan notifikasi tetap dikelola dari dashboard
            agar saat backend live nanti alur admin tidak perlu dirombak.
          </p>
        </Card>
      </div>
    </div>
  );
}
