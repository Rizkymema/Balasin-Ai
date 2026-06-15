"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  Clock3,
  Loader2,
  MessageSquareWarning,
  PlayCircle,
  Settings2,
  Sparkles,
  Workflow,
} from "lucide-react";

import { useDashboardConfig } from "@/hooks/use-dashboard-config";
import type { AutomationRule } from "@/types/dashboard-config";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type ExecutionStatus = "success" | "warning" | "danger";

type WorkerJob = {
  id: string;
  type: string;
  status: string;
  runAt: string;
  attempts: number;
  lastError: string | null;
};

const statusClassMap = {
  success: "text-emerald-300 border-emerald-400/20 bg-emerald-950/30",
  warning: "text-amber-300 border-amber-400/20 bg-amber-950/30",
  danger: "text-rose-300 border-rose-400/20 bg-rose-950/30",
} satisfies Record<ExecutionStatus, string>;

export default function AutomationPage() {
  const { config, patchConfig } = useDashboardConfig();
  const [rules, setRules] = useState<AutomationRule[]>(config.automation.rules);
  const [handoffThreshold, setHandoffThreshold] = useState(
    config.automation.handoffThreshold,
  );
  const [followUpDelayHours, setFollowUpDelayHours] = useState(
    config.automation.followUpDelayHours,
  );
  const [bookingReminderHours, setBookingReminderHours] = useState(
    config.automation.bookingReminderHours,
  );
  const [spamGuard, setSpamGuard] = useState(config.automation.spamGuard);
  const [sentimentGuard, setSentimentGuard] = useState(config.automation.sentimentGuard);
  const [isSaved, setIsSaved] = useState(false);
  const [jobs, setJobs] = useState<WorkerJob[]>([]);
  const [isWorkerLoading, setIsWorkerLoading] = useState(false);
  const [workerMessage, setWorkerMessage] = useState("");

  useEffect(() => {
    setRules(config.automation.rules);
    setHandoffThreshold(config.automation.handoffThreshold);
    setFollowUpDelayHours(config.automation.followUpDelayHours);
    setBookingReminderHours(config.automation.bookingReminderHours);
    setSpamGuard(config.automation.spamGuard);
    setSentimentGuard(config.automation.sentimentGuard);
  }, [config.automation]);

  useEffect(() => {
    void loadJobs();
  }, []);

  const activeRules = rules.filter((rule) => rule.isActive);

  const automationStats = useMemo(
    () => [
      {
        label: "Rule aktif",
        value: `${activeRules.length}`,
        detail: "Semua rule sekarang bisa dihidupkan atau dimatikan dari dashboard.",
        accent: "text-cyan-400 border-cyan-400/20 bg-cyan-950/30",
      },
      {
        label: "Follow-up delay",
        value: `${followUpDelayHours} jam`,
        detail: "Jeda default untuk menghubungi lead yang diam kembali.",
        accent: "text-emerald-400 border-emerald-400/20 bg-emerald-950/30",
      },
      {
        label: "Booking reminder",
        value: `${bookingReminderHours} jam`,
        detail: "Pengingat default sebelum customer datang ke lokasi.",
        accent: "text-amber-400 border-amber-400/20 bg-amber-950/30",
      },
      {
        label: "Handoff threshold",
        value: `${handoffThreshold}%`,
        detail: "Jika confidence AI di bawah angka ini, percakapan diarahkan ke admin.",
        accent: "text-rose-400 border-rose-400/20 bg-rose-950/30",
      },
    ],
    [activeRules.length, bookingReminderHours, followUpDelayHours, handoffThreshold],
  );

  const executions: Array<{
    name: string;
    trigger: string;
    action: string;
    result: string;
    status: ExecutionStatus;
  }> = [
    {
      name: "Follow-up lead WhatsApp",
      trigger: `Tidak membalas ${followUpDelayHours} jam`,
      action: "Kirim follow-up ringan + tawarkan booking",
      result: "Worker akan mengeksekusi follow-up sesuai queue.",
      status: "success",
    },
    {
      name: "Safety handoff",
      trigger: `Confidence di bawah ${handoffThreshold}%`,
      action: "Tahan auto reply dan assign ke admin",
      result: "Terhubung ke fallback AI dan ticket handoff.",
      status: "warning",
    },
    {
      name: "Instagram comment guard",
      trigger: spamGuard ? "Spam guard aktif" : "Spam guard nonaktif",
      action: "Hide komentar dan catat event",
      result: sentimentGuard ? "Sentiment guard aktif" : "Perlu review manual lebih besar",
      status: spamGuard ? "success" : "danger",
    },
    {
      name: "Booking reminder",
      trigger: `H-${bookingReminderHours} jam kedatangan`,
      action: "Kirim pengingat waktu dan lokasi",
      result: "Queue booking reminder akan ikut dijalankan worker.",
      status: "success",
    },
  ];

  const toggleRule = (id: string) => {
    setRules((prev) =>
      prev.map((rule) =>
        rule.id === id ? { ...rule, isActive: !rule.isActive } : rule,
      ),
    );
  };

  const saveAutomation = () => {
    patchConfig((current) => ({
      ...current,
      automation: {
        ...current.automation,
        handoffThreshold,
        followUpDelayHours,
        bookingReminderHours,
        spamGuard,
        sentimentGuard,
        rules,
      },
    }));

    patchConfig((current) => ({
      ...current,
      aiAgent: {
        ...current.aiAgent,
        confidenceThreshold: handoffThreshold,
      },
    }));

    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  async function loadJobs() {
    const response = await fetch("/api/workers/jobs", {
      credentials: "include",
      cache: "no-store",
    });

    if (!response.ok) {
      return;
    }

    const payload = (await response.json()) as {
      ok: boolean;
      data: WorkerJob[];
    };

    setJobs(payload.data);
  }

  const runWorker = async () => {
    setIsWorkerLoading(true);
    setWorkerMessage("");

    try {
      const response = await fetch("/api/workers/run", {
        method: "POST",
        credentials: "include",
      });

      const payload = (await response.json()) as {
        ok?: boolean;
        error?: string;
        data?: {
          processed: number;
        };
      };

      if (!response.ok) {
        throw new Error(payload.error ?? "Worker gagal dijalankan.");
      }

      setWorkerMessage(
        `Worker selesai berjalan. ${payload.data?.processed ?? 0} job diproses.`,
      );
      await loadJobs();
    } catch (error) {
      setWorkerMessage(
        error instanceof Error ? error.message : "Worker gagal dijalankan.",
      );
    } finally {
      setIsWorkerLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-2xl border border-cyan-400/15 bg-gradient-to-r from-cyan-950/20 via-blue-950/10 to-transparent p-6 md:p-8">
        <div className="absolute right-0 top-0 h-48 w-48 rounded-full bg-cyan-400/8 blur-3xl" />
        <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <Badge className="border-cyan-400/20 bg-cyan-950/40 text-cyan-200">
              Automation Control
            </Badge>
            <div className="space-y-2">
              <h1 className="text-3xl font-bold text-white">
                Semua automation WA, IG, dan handoff sekarang diatur dari dashboard.
              </h1>
              <p className="max-w-3xl text-sm leading-7 text-slate-300">
                Rule, delay follow-up, reminder booking, spam guard, dan confidence handoff
                tidak lagi tersebar. Semua disimpan sebagai control center automation.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button
              variant="secondary"
              className="rounded-xl px-4 py-2.5 text-xs"
              onClick={() => void loadJobs()}
            >
              Muat ulang jobs
            </Button>
            <Button onClick={saveAutomation} className="rounded-xl px-4 py-2.5 text-xs">
              Simpan automation
            </Button>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {automationStats.map((stat) => (
          <Card key={stat.label} className="glass-panel p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  {stat.label}
                </p>
                <p className="mt-3 text-3xl font-bold text-white">{stat.value}</p>
              </div>
              <div className={`rounded-xl border px-3 py-2 text-xs font-bold ${stat.accent}`}>
                live
              </div>
            </div>
            <p className="mt-4 text-xs leading-6 text-slate-400">{stat.detail}</p>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="glass-panel p-6">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-white">Rule catalog</h2>
              <p className="text-xs text-slate-400">
                Aktif/nonaktif rule inti langsung dari dashboard ini.
              </p>
            </div>
            <Badge>Rule Pack</Badge>
          </div>

          <div className="space-y-4">
            {rules.map((rule) => (
              <div
                key={rule.id}
                className="rounded-2xl border border-white/8 bg-white/[0.03] p-5"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-semibold text-white">{rule.name}</h3>
                      <Badge className="border-white/10 bg-white/5 text-slate-300">
                        {rule.channel}
                      </Badge>
                    </div>
                    <p className="text-xs leading-6 text-slate-300">
                      Trigger: {rule.trigger}
                    </p>
                    <p className="text-xs leading-6 text-slate-400">
                      Action: {rule.action}
                    </p>
                    <p className="text-[11px] uppercase tracking-[0.16em] text-slate-500">
                      Risk: {rule.risk}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => toggleRule(rule.id)}
                    className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-bold transition ${
                      rule.isActive
                        ? "border-emerald-400/20 bg-emerald-950/30 text-emerald-300"
                        : "border-white/10 bg-white/5 text-slate-300"
                    }`}
                  >
                    {rule.isActive ? "Aktif" : "Nonaktif"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="glass-panel p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl border border-cyan-400/20 bg-cyan-950/30 p-3 text-cyan-300">
              <Settings2 className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Operational controls</h2>
              <p className="text-xs text-slate-400">
                Parameter global yang dipakai lintas AI, channel, dan booking.
              </p>
            </div>
          </div>

          <div className="mt-6 space-y-5">
            <div className="space-y-2 rounded-2xl border border-white/8 bg-white/[0.03] p-4">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-300">
                  Handoff threshold
                </label>
                <span className="rounded border border-cyan-400/20 bg-cyan-950/40 px-2 py-0.5 text-xs font-bold text-cyan-400">
                  {handoffThreshold}%
                </span>
              </div>
              <input
                type="range"
                min="40"
                max="95"
                step="5"
                value={handoffThreshold}
                onChange={(event) => setHandoffThreshold(Number(event.target.value))}
                className="h-2 w-full cursor-pointer rounded-lg bg-white/10 accent-cyan-400"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-1">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  Follow-up delay (jam)
                </label>
                <Input
                  type="number"
                  min="1"
                  value={followUpDelayHours}
                  onChange={(event) => setFollowUpDelayHours(Number(event.target.value))}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  Booking reminder (jam sebelum datang)
                </label>
                <Input
                  type="number"
                  min="1"
                  value={bookingReminderHours}
                  onChange={(event) => setBookingReminderHours(Number(event.target.value))}
                />
              </div>
            </div>

            <label className="flex items-center gap-3 rounded-xl border border-white/8 bg-white/[0.03] p-4 text-xs text-slate-300">
              <input
                type="checkbox"
                checked={spamGuard}
                onChange={(event) => setSpamGuard(event.target.checked)}
                className="h-4 w-4 rounded border-white/12 bg-white/4 text-cyan-500"
              />
              Aktifkan spam guard untuk channel yang mendukung moderasi
            </label>

            <label className="flex items-center gap-3 rounded-xl border border-white/8 bg-white/[0.03] p-4 text-xs text-slate-300">
              <input
                type="checkbox"
                checked={sentimentGuard}
                onChange={(event) => setSentimentGuard(event.target.checked)}
                className="h-4 w-4 rounded border-white/12 bg-white/4 text-cyan-500"
              />
              Aktifkan sentiment guard untuk komplain dan emosi negatif
            </label>

            {isSaved ? (
              <div className="rounded-xl border border-emerald-400/20 bg-emerald-950/15 p-4 text-xs font-bold text-emerald-300">
                Pengaturan automation tersimpan ke dashboard.
              </div>
            ) : null}

            <div className="rounded-2xl border border-cyan-400/10 bg-cyan-400/5 p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Sparkles className="h-4 w-4 text-cyan-300" />
                  <span className="text-sm font-semibold text-white">
                    Rule ini sekarang menjadi source of truth untuk WA, IG, dan AI agent
                  </span>
                </div>
                <ArrowRight className="h-4 w-4 text-cyan-300" />
              </div>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card className="glass-panel p-6">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-white">Recent executions</h2>
              <p className="text-xs text-slate-400">
                Preview efek rule setelah semua parameter dashboard di atas diterapkan.
              </p>
            </div>
            <Badge className="border-white/10 bg-white/5 text-slate-300">
              {executions.length} events
            </Badge>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Rule</TableHead>
                <TableHead>Trigger</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Result</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {executions.map((item) => (
                <TableRow key={item.name}>
                  <TableCell className="text-white">{item.name}</TableCell>
                  <TableCell>{item.trigger}</TableCell>
                  <TableCell>{item.action}</TableCell>
                  <TableCell>{item.result}</TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex rounded-full border px-3 py-1 text-[11px] font-semibold ${statusClassMap[item.status]}`}
                    >
                      {item.status}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>

        <Card className="glass-panel p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl border border-cyan-400/20 bg-cyan-950/30 p-3 text-cyan-300">
              <Workflow className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Worker & safety rail</h2>
              <p className="text-xs text-slate-400">
                Guardrail dan kontrol eksekusi automation yang aktif di backend.
              </p>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            <div className="rounded-2xl border border-cyan-400/15 bg-cyan-950/15 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-white">Run worker sekarang</p>
                  <p className="mt-2 text-xs leading-6 text-slate-300">
                    Jalankan follow-up, reminder booking, broadcast, dan analytics tanpa menunggu cron.
                  </p>
                </div>
                <Button
                  type="button"
                  onClick={() => void runWorker()}
                  disabled={isWorkerLoading}
                  className="px-4 text-xs"
                >
                  {isWorkerLoading ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Menjalankan
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <PlayCircle className="h-4 w-4" />
                      Run worker
                    </span>
                  )}
                </Button>
              </div>
              {workerMessage ? (
                <p className="mt-3 text-xs text-cyan-200">{workerMessage}</p>
              ) : null}
            </div>

            <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-[11px] font-semibold text-white">Queue jobs terbaru</span>
                <Badge className="border-white/10 bg-white/5 text-slate-300">
                  {jobs.length} jobs
                </Badge>
              </div>
              <div className="space-y-2">
                {jobs.length === 0 ? (
                  <p className="text-xs text-slate-500">Belum ada job yang tercatat.</p>
                ) : (
                  jobs.slice(0, 5).map((job) => (
                    <div
                      key={job.id}
                      className="rounded-xl border border-white/8 bg-white/[0.02] p-3"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-[11px] font-semibold text-white">
                          {job.type}
                        </span>
                        <span className="text-[10px] uppercase tracking-[0.16em] text-slate-500">
                          {job.status}
                        </span>
                      </div>
                      <p className="mt-1 text-[10px] text-slate-500">
                        Run at: {job.runAt} • attempts: {job.attempts}
                      </p>
                      {job.lastError ? (
                        <p className="mt-1 text-[10px] text-rose-300">{job.lastError}</p>
                      ) : null}
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-rose-400/15 bg-rose-950/15 p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="mt-0.5 h-5 w-5 text-rose-300" />
                <div>
                  <p className="text-sm font-semibold text-white">
                    High-risk intents wajib handoff
                  </p>
                  <p className="mt-2 text-xs leading-6 text-slate-300">
                    Refund, komplain berat, garansi, harga custom, dan pertanyaan
                    tanpa grounding tetap tidak boleh dibalas otomatis.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-emerald-400/15 bg-emerald-950/15 p-4">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-300" />
                <div>
                  <p className="text-sm font-semibold text-white">
                    Low-risk FAQ bisa auto-reply
                  </p>
                  <p className="mt-2 text-xs leading-6 text-slate-300">
                    Jam buka, alamat, layanan umum, dan template booking aman
                    dijalankan jika confidence dan rule dashboard mengizinkan.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
              <div className="flex items-start gap-3">
                <MessageSquareWarning className="mt-0.5 h-5 w-5 text-cyan-300" />
                <p className="text-xs leading-6 text-slate-400">
                  Threshold handoff di halaman ini juga disinkronkan ke modul AI Agent agar
                  keputusan reply dan handoff tidak bertabrakan.
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
              <div className="flex items-start gap-3">
                <CalendarClock className="mt-0.5 h-5 w-5 text-amber-300" />
                <p className="text-xs leading-6 text-slate-400">
                  Booking reminder dan lead follow-up dari sini langsung menjadi basis queue
                  backend saat worker dijalankan.
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
              <div className="flex items-start gap-3">
                <Clock3 className="mt-0.5 h-5 w-5 text-slate-300" />
                <p className="text-xs leading-6 text-slate-400">
                  Control automation di halaman ini sudah masuk ke dashboard config, worker queue,
                  dan endpoint internal untuk eksekusi job.
                </p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
