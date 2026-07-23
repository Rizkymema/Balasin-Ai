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
import { Button } from "@/components/ui/button";

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
          <h1 className="flex items-center gap-2.5 text-2xl font-extrabold text-slate-900 tracking-tight">
            <BarChart2 className="h-6 w-6 text-blue-600" />
            Analytics & Laporan
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            Analytics membaca data operasional terpusat dari inbox, customer, booking, AI, ticket, dan channel.
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] font-medium">
            <span className="flex items-center gap-1.5 text-emerald-700 font-bold">
              <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-600" />
              Live update aktif
            </span>
            <span className="text-slate-400">•</span>
            <span className="text-slate-500">Sinkron terakhir: {updatedAt}</span>
            {error && <span className="text-red-600 font-semibold">{error}</span>}
          </div>
        </div>

        <div className="flex items-center gap-2 self-start">
          <div className="rounded-xl border border-slate-200 bg-white p-1 shadow-2xs">
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
                className={`rounded-lg px-3 py-1 text-xs font-bold transition cursor-pointer ${
                  timeRange === item.key
                    ? "bg-blue-50 text-blue-700"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <Button variant="secondary" size="sm" className="gap-1.5">
            <Download className="h-4 w-4" />
            Ekspor CSV
          </Button>
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={() => void refreshData()}
            disabled={isLoading}
            className="gap-1.5"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
            Sinkronkan
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.label} className="flex flex-col justify-between p-5 border-slate-200 bg-white shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500">{card.label}</span>
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                  <Icon className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-3">
                <span className="text-2xl font-extrabold text-slate-900">
                  {card.value}
                </span>
                <div className="mt-1 flex items-center gap-1.5">
                  <span className="flex items-center gap-0.5 rounded-md bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                    <ArrowUpRight className="h-3 w-3" />
                    {card.change}
                  </span>
                </div>
                <p className="mt-2.5 text-xs leading-relaxed text-slate-500 font-medium">{card.detail}</p>
              </div>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="space-y-4 rounded-2xl p-5 border-slate-200 bg-white shadow-2xs lg:col-span-2">
          <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-900">
            <TrendingUp className="h-4 w-4 text-blue-600" />
            Statistik Chat Masuk
          </h3>
          <div className="relative h-64">
            <svg viewBox="0 0 600 220" className="h-full w-full overflow-visible text-slate-400">
              <line x1="30" y1="30" x2="580" y2="30" stroke="#e2e8f0" strokeDasharray="3" />
              <line x1="30" y1="90" x2="580" y2="90" stroke="#e2e8f0" strokeDasharray="3" />
              <line x1="30" y1="150" x2="580" y2="150" stroke="#e2e8f0" strokeDasharray="3" />
              <line x1="30" y1="200" x2="580" y2="200" stroke="#cbd5e1" />

              <text x="15" y="35" fill="currentColor" className="text-[9px] font-bold text-slate-400" textAnchor="end">
                {trendMax}
              </text>
              <text x="15" y="95" fill="currentColor" className="text-[9px] font-bold text-slate-400" textAnchor="end">
                {Math.round(trendMax * 0.6)}
              </text>
              <text x="15" y="155" fill="currentColor" className="text-[9px] font-bold text-slate-400" textAnchor="end">
                {Math.round(trendMax * 0.3)}
              </text>
              <text x="15" y="205" fill="currentColor" className="text-[9px] font-bold text-slate-400" textAnchor="end">
                0
              </text>

              <polyline
                points={trendLine}
                fill="none"
                stroke="#2563eb"
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
                  r="4"
                  fill="#ffffff"
                  stroke="#2563eb"
                  strokeWidth="2.5"
                />
              ))}

              <defs>
                <linearGradient id="analyticsGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#2563eb" stopOpacity="0.15" />
                  <stop offset="100%" stopColor="#2563eb" stopOpacity="0" />
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
                    className="text-[9px] font-bold text-slate-500"
                    textAnchor="middle"
                  >
                    {item.label}
                  </text>
                ))}
            </svg>
          </div>
        </Card>

        <Card className="flex flex-col justify-between rounded-2xl p-5 border-slate-200 bg-white shadow-2xs">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
            Breakdown Channel
          </h3>

          <div className="space-y-4 my-4">
            {summary.channelBreakdown.map((item) => (
              <div key={item.channel} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-slate-700">{item.channel}</span>
                  <span className="text-slate-900">{item.count}</span>
                </div>
                <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-2 rounded-full bg-blue-600"
                    style={{
                      width: `${(item.count / Math.max(summary.channelBreakdown.reduce((t, c) => t + c.count, 0), 1)) * 100}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-2 border-t border-slate-100 pt-3 text-xs text-slate-500 font-medium">
            <div className="flex items-center gap-2">
              <Wifi className="h-4 w-4 text-blue-600 shrink-0" />
              Channel aktif ikut mempengaruhi komposisi analytics.
            </div>
            <div className="flex items-center gap-2">
              <Bot className="h-4 w-4 text-blue-600 shrink-0" />
              Automation dan AI config memakai sumber data terpadu.
            </div>
          </div>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {reportCards.map((card) => (
          <Card key={card.label} className="p-5 border-slate-200 bg-white shadow-2xs">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
              {card.label}
            </p>
            <p className="mt-2 text-2xl font-extrabold text-slate-900">{card.value}</p>
            <p className="mt-2 text-xs leading-relaxed text-slate-500 font-medium">{card.detail}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
