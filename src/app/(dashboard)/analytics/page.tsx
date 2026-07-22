"use client";

import { useMemo, useState } from "react";
import {
  ArrowUpRight,
  BarChart2,
  Bot,
  Clock,
  Download,
  MessageSquare,
  RefreshCw,
  TrendingUp,
  User,
  Wifi,
} from "lucide-react";

import { useDashboardConfig } from "@/hooks/use-dashboard-config";
import { useDashboardOperations } from "@/hooks/use-dashboard-operations";
import { useRealtimeInbox } from "@/hooks/use-realtime-inbox";
import {
  deriveAnalyticsSummary,
  deriveAnalyticsTrend,
  type AnalyticsRange,
} from "@/lib/dashboard-operations";
import { Card } from "@/components/ui/card";

export default function AnalyticsPage() {
  const { config } = useDashboardConfig();
  const {
    data,
    isLoading,
    error,
    applyLocalPatch,
    refreshData,
  } = useDashboardOperations();
  const [timeRange, setTimeRange] = useState<AnalyticsRange>("7d");

  useRealtimeInbox({
    applyLocalPatch,
    refreshData,
    pollIntervalMs: 5000,
  });

  const summary = useMemo(() => deriveAnalyticsSummary(data), [data]);
  const trend = useMemo(
    () => deriveAnalyticsTrend(data, timeRange),
    [data, timeRange],
  );
  const trendMax = Math.max(...trend.map((item) => item.count), 1);
  const trendPoints = trend.map((item, index) => {
    const x = 50 + (510 * index) / Math.max(trend.length - 1, 1);
    const y = 200 - (item.count / trendMax) * 150;
    return { ...item, x, y };
  });
  const trendLine = trendPoints.map((item) => `${item.x},${item.y}`).join(" ");
  const trendArea = `${trendLine} 560,200 50,200`;
  const updatedAt = data.lastUpdatedAt
    ? new Intl.DateTimeFormat("id-ID", {
        dateStyle: "short",
        timeStyle: "medium",
      }).format(new Date(data.lastUpdatedAt))
    : "belum ada sinkronisasi";

  const cards = [
    {
      label: "Total Pesan Masuk",
      value: `${summary.totalMessages}`,
      change: `${summary.totalConversations} conv`,
      icon: MessageSquare,
      detail: "Total message events dari semua percakapan yang ada di store dashboard.",
    },
    {
      label: "AI Auto-Reply Rate",
      value: `${summary.aiAutoReplyRate}%`,
      change: `${config.aiAgent.confidenceThreshold}% threshold`,
      icon: Bot,
      detail: "Rasio balasan AI dibanding total balasan keluar.",
    },
    {
      label: "Eskalasi ke Admin",
      value: `${summary.handoffRate}%`,
      change: `${data.conversations.filter((item) => item.status === "assigned_to_admin").length} handoff`,
      icon: User,
      detail: "Percakapan yang dialihkan ke manual takeover.",
    },
    {
      label: "Avg. First Response",
      value: `${summary.avgFirstResponseSeconds}s`,
      change: `${summary.activeCustomers} customer`,
      icon: Clock,
      detail: "Rata-rata response time awal dari data percakapan saat ini.",
    },
  ];

  const reportCards = [
    {
      label: "Open tickets",
      value: `${summary.openTickets}`,
      detail: `${summary.totalTickets} total ticket yang sudah tercatat di dashboard.`,
    },
    {
      label: "AI aman dibalas",
      value: `${summary.aiSafeConversationCount}`,
      detail: "Percakapan low-risk dengan confidence tinggi yang layak diproses otomatis.",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-white">
            <BarChart2 className="h-6 w-6 text-cyan-400" />
            Analytics & Laporan
          </h1>
          <p className="mt-1 text-xs text-slate-400">
            Analytics sekarang membaca data operasional yang sama dengan inbox, customer,
            booking, AI, ticket, broadcast, dan channel dashboard.
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-[10px]">
            <span className="flex items-center gap-1.5 text-emerald-300">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
              Live update aktif
            </span>
            <span className="text-slate-500">Sinkron terakhir: {updatedAt}</span>
            {error && <span className="text-rose-300">{error}</span>}
          </div>
        </div>

        <div className="flex items-center gap-3 self-start">
          <div className="rounded-lg border border-white/8 bg-white/4 p-1">
            {(
              [
                { key: "24h", label: "Hari Ini" },
                { key: "7d", label: "7 Hari" },
                { key: "30d", label: "30 Hari" },
              ] satisfies Array<{ key: AnalyticsRange; label: string }>
            ).map((item) => (
              <button
                key={item.key}
                onClick={() => setTimeRange(item.key)}
                className={`rounded px-3 py-1 text-xs font-semibold ${
                  timeRange === item.key
                    ? "bg-cyan-950 text-cyan-400"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <button className="flex h-9 items-center gap-1.5 rounded-lg border border-white/8 bg-white/4 px-4 text-xs font-semibold text-white transition duration-200 hover:bg-white/8">
            <Download className="h-4 w-4" />
            Ekspor CSV
          </button>
          <button
            type="button"
            onClick={() => void refreshData()}
            disabled={isLoading}
            className="flex h-9 items-center gap-1.5 rounded-lg border border-cyan-400/20 bg-cyan-400/10 px-3 text-xs font-semibold text-cyan-300 transition duration-200 hover:bg-cyan-400/20 disabled:cursor-wait disabled:opacity-60"
            title="Sinkronkan data analytics sekarang"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
            Sinkronkan
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.label} className="glass-panel flex flex-col justify-between p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400">{card.label}</span>
                <Icon className="h-4.5 w-4.5 text-cyan-400" />
              </div>
              <div className="mt-4">
                <span className="font-heading text-2xl font-bold text-white">
                  {card.value}
                </span>
                <div className="mt-1 flex items-center gap-1.5">
                  <span className="flex items-center gap-0.5 rounded bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-bold text-emerald-400">
                    <ArrowUpRight className="h-3 w-3" />
                    {card.change}
                  </span>
                </div>
                <p className="mt-3 text-[11px] leading-5 text-slate-500">{card.detail}</p>
              </div>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="glass-panel space-y-4 rounded-xl p-5 lg:col-span-2">
          <h3 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-white">
            <TrendingUp className="h-4 w-4 text-cyan-400" />
            Statistik Chat Masuk
          </h3>
          <div className="relative h-64">
            <svg viewBox="0 0 600 220" className="h-full w-full overflow-visible text-slate-700">
              <line x1="30" y1="30" x2="580" y2="30" stroke="rgba(255,255,255,0.03)" strokeDasharray="3" />
              <line x1="30" y1="90" x2="580" y2="90" stroke="rgba(255,255,255,0.03)" strokeDasharray="3" />
              <line x1="30" y1="150" x2="580" y2="150" stroke="rgba(255,255,255,0.03)" strokeDasharray="3" />
              <line x1="30" y1="200" x2="580" y2="200" stroke="rgba(255,255,255,0.08)" />

              <text x="15" y="35" fill="currentColor" className="text-[9px] font-bold text-slate-500" textAnchor="end">
                {trendMax}
              </text>
              <text x="15" y="95" fill="currentColor" className="text-[9px] font-bold text-slate-500" textAnchor="end">
                {Math.round(trendMax * 0.6)}
              </text>
              <text x="15" y="155" fill="currentColor" className="text-[9px] font-bold text-slate-500" textAnchor="end">
                {Math.round(trendMax * 0.3)}
              </text>
              <text x="15" y="205" fill="currentColor" className="text-[9px] font-bold text-slate-500" textAnchor="end">
                0
              </text>

              <polyline
                points={trendLine}
                fill="none"
                stroke="#22d3ee"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <polygon points={trendArea} fill="url(#analyticsGradient)" />

              {trendPoints.map((item) => (
                <circle
                  key={item.label}
                  cx={item.x}
                  cy={item.y}
                  r="3.5"
                  fill="#020611"
                  stroke="#22d3ee"
                  strokeWidth="2"
                />
              ))}

              <defs>
                <linearGradient id="analyticsGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#22d3ee" stopOpacity="0" />
                </linearGradient>
              </defs>

              {trendPoints
                .filter((_, index) => index === 0 || index === trendPoints.length - 1 || index % Math.ceil(trendPoints.length / 4) === 0)
                .map((item) => (
                  <text
                    key={`label-${item.label}`}
                    x={item.x}
                    y="216"
                    fill="currentColor"
                    className="text-[8px] font-bold text-slate-500"
                    textAnchor="middle"
                  >
                    {item.label}
                  </text>
                ))}
            </svg>
          </div>
        </div>

        <div className="glass-panel flex h-[340px] flex-col justify-between rounded-xl p-5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-white">
            Breakdown Channel
          </h3>

          <div className="space-y-4">
            {summary.channelBreakdown.map((item) => (
              <div key={item.channel} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-300">{item.channel}</span>
                  <span className="font-bold text-white">{item.count}</span>
                </div>
                <div className="h-2 rounded-full bg-white/8">
                  <div
                    className="h-2 rounded-full bg-cyan-400"
                    style={{
                      width: `${(item.count / Math.max(summary.channelBreakdown.reduce((t, c) => t + c.count, 0), 1)) * 100}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-3 border-t border-white/8 pt-4 text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <Wifi className="h-4 w-4 text-cyan-300" />
              Channel yang aktif di dashboard ikut mempengaruhi komposisi analytics.
            </div>
            <div className="flex items-center gap-2">
              <Bot className="h-4 w-4 text-cyan-300" />
              Automation dan AI config memakai sumber data yang sama, jadi laporan lebih konsisten.
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {reportCards.map((card) => (
          <Card key={card.label} className="glass-panel p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              {card.label}
            </p>
            <p className="mt-3 text-3xl font-bold text-white">{card.value}</p>
            <p className="mt-4 text-xs leading-6 text-slate-400">{card.detail}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
