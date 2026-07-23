"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Check, Loader2, LogOut, QrCode, RefreshCw, ShieldCheck, Webhook } from "lucide-react";
import Image from "next/image";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { WhatsAppQrSession } from "@/types/dashboard-config";

type QrResponse = {
  ok?: boolean;
  data?: {
    configured?: boolean;
    webhookUrl?: string;
    sessions?: WhatsAppQrSession[];
    session?: WhatsAppQrSession;
    qrCode?: string;
    removed?: boolean;
  };
  error?: string;
};

function statusLabel(status: WhatsAppQrSession["status"]) {
  if (status === "connected") return "Terhubung";
  if (status === "connecting") return "Menunggu scan";
  return "Terputus";
}

function statusBadgeVariant(status: WhatsAppQrSession["status"]) {
  if (status === "connected") return "success";
  if (status === "connecting") return "warning";
  return "secondary";
}

export function WhatsAppQrConnector() {
  const [configured, setConfigured] = useState(false);
  const [sessions, setSessions] = useState<WhatsAppQrSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState("");
  const [qrCode, setQrCode] = useState("");
  const [webhookUrl, setWebhookUrl] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isBusy, setIsBusy] = useState(false);
  const [message, setMessage] = useState("");

  const activeSession = useMemo(
    () => sessions.find((session) => session.id === activeSessionId) ?? null,
    [activeSessionId, sessions],
  );

  const loadSessions = useCallback(async () => {
    try {
      const response = await fetch("/api/channels/whatsapp/qr", {
        credentials: "include",
        cache: "no-store",
      });
      const payload = (await response.json()) as QrResponse;
      if (!response.ok || !payload.ok) {
        throw new Error(payload.error || "Gagal memuat koneksi WhatsApp QR.");
      }
      const nextSessions = payload.data?.sessions ?? [];
      setConfigured(payload.data?.configured === true);
      setWebhookUrl(payload.data?.webhookUrl ?? "");
      setSessions(nextSessions);
      setActiveSessionId((current) => {
        if (nextSessions.some((session) => session.id === current)) {
          return current;
        }
        return (
          nextSessions.find((session) => session.status === "connecting")?.id ??
          nextSessions.find((session) => session.status === "connected")?.id ??
          nextSessions[0]?.id ??
          ""
        );
      });
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Gagal memuat koneksi WhatsApp QR.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadSessions();
  }, [loadSessions]);

  const callAction = useCallback(async (body: Record<string, string>) => {
    const response = await fetch("/api/channels/whatsapp/qr", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const payload = (await response.json()) as QrResponse;
    if (!response.ok || !payload.ok) {
      throw new Error(payload.error || "Operasi WhatsApp QR gagal.");
    }
    return payload.data;
  }, []);

  const handleConnect = async () => {
    setIsBusy(true);
    setMessage("");
    setQrCode("");
    try {
      const data = await callAction({ action: "connect" });
      if (data?.session) {
        setSessions((current) => [data.session!, ...current]);
        setActiveSessionId(data.session.id);
        setQrCode(data.qrCode ?? "");
        setWebhookUrl(data.webhookUrl ?? webhookUrl);
        setMessage(data.qrCode ? "QR siap dipindai dari WhatsApp di ponsel Anda." : "Sesi dibuat. Klik refresh QR jika kode belum tampil.");
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Gagal membuat sesi QR.");
    } finally {
      setIsBusy(false);
    }
  };

  const handleRefresh = async (sessionId = activeSessionId) => {
    if (!sessionId) return;
    setIsBusy(true);
    setMessage("");
    try {
      const data = await callAction({ action: "refresh", sessionId });
      setQrCode(data?.qrCode ?? "");
      setMessage(data?.qrCode ? "QR baru siap dipindai." : "Gateway belum mengirim QR baru.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Gagal mengambil QR baru.");
    } finally {
      setIsBusy(false);
    }
  };

  const handleStatus = useCallback(async (sessionId: string) => {
    try {
      const data = await callAction({ action: "status", sessionId });
      if (!data?.session) return;
      setSessions((current) =>
        current.map((session) => session.id === sessionId ? data.session! : session),
      );
      if (data.session.status === "connected") {
        setQrCode("");
        setMessage("WhatsApp QR berhasil terhubung dan webhook chatbot aktif.");
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Status WhatsApp QR gagal dibaca.");
    }
  }, [callAction]);

  useEffect(() => {
    if (!activeSession || activeSession.status !== "connecting") return;
    const interval = window.setInterval(() => {
      void handleStatus(activeSession.id);
    }, 4_000);
    return () => window.clearInterval(interval);
  }, [activeSession, handleStatus]);

  const handleWebhook = async () => {
    if (!activeSession) return;
    setIsBusy(true);
    try {
      await callAction({ action: "webhook", sessionId: activeSession.id });
      setMessage("Webhook Evolution berhasil didaftarkan ulang.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Webhook gagal didaftarkan.");
    } finally {
      setIsBusy(false);
    }
  };

  const handleLogout = async (session: WhatsAppQrSession) => {
    if (!window.confirm(`Putuskan sesi ${session.label}?`)) return;
    setIsBusy(true);
    try {
      const data = await callAction({ action: "logout", sessionId: session.id });
      const nextSessions =
        data?.sessions ?? sessions.filter((item) => item.id !== session.id);
      setSessions(nextSessions);
      setQrCode("");
      if (session.id === activeSessionId) {
        setActiveSessionId(
          nextSessions.find((item) => item.status === "connected")?.id ??
            nextSessions[0]?.id ??
            "",
        );
      }
      setMessage("WhatsApp berhasil logout dan dihapus dari daftar sesi QR.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Gagal memutus sesi WhatsApp QR.");
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <div className="rounded-2xl border border-blue-100 bg-blue-50/30 p-5 space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <QrCode className="h-4.5 w-4.5 text-blue-600" />
            <h4 className="text-sm font-bold text-slate-900">Tambah WhatsApp dengan QR Code</h4>
            <Badge variant="default" className="text-[10px]">Evolution API</Badge>
          </div>
          <p className="mt-1 text-xs leading-relaxed text-slate-500">
            API key gateway hanya berada di server. Browser hanya menerima QR dan status sesi.
            Konfigurasi Meta Cloud API yang sudah ada tetap terpisah dan tidak dihapus.
          </p>
        </div>
        <Button type="button" onClick={() => void handleConnect()} disabled={isBusy || !configured} variant="primary" size="sm" className="shrink-0 gap-2">
          {isBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <QrCode className="h-3.5 w-3.5" />}
          Hubungkan via QR
        </Button>
      </div>

      {!configured && !isLoading && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800 font-medium">
          Gateway QR belum dikonfigurasi. Admin perlu mengisi `WHATSAPP_QR_API_URL`, `WHATSAPP_QR_API_KEY`, dan `WHATSAPP_QR_WEBHOOK_SECRET` di environment server/Vercel satu kali.
        </div>
      )}

      {activeSession && (
        <div className="grid gap-4 lg:grid-cols-[220px_minmax(0,1fr)]">
          <div className="flex min-h-[220px] items-center justify-center rounded-xl border border-slate-200 bg-white p-3 shadow-2xs">
            {qrCode ? (
              <Image
                src={qrCode.startsWith("data:") ? qrCode : `data:image/png;base64,${qrCode}`}
                alt="QR Code WhatsApp"
                width={190}
                height={190}
                unoptimized
                className="h-[190px] w-[190px] rounded-lg object-contain"
              />
            ) : activeSession.status === "connected" ? (
              <div className="text-center text-emerald-600">
                <Check className="mx-auto h-12 w-12" />
                <p className="mt-2 text-xs font-bold">WhatsApp terhubung</p>
              </div>
            ) : (
              <div className="text-center text-slate-400">
                <QrCode className="mx-auto h-12 w-12" />
                <p className="mt-2 text-xs font-medium">Klik refresh untuk mengambil QR</p>
              </div>
            )}
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold text-slate-900">{activeSession.label}</p>
                <p className="font-mono text-[11px] text-slate-500">{activeSession.instanceName}</p>
              </div>
              <Badge variant={statusBadgeVariant(activeSession.status)} className="text-[10px]">{statusLabel(activeSession.status)}</Badge>
            </div>
            <p className="text-xs leading-relaxed text-slate-600">
              Buka WhatsApp di ponsel, pilih <strong className="text-slate-900">Perangkat tertaut</strong>, lalu <strong className="text-slate-900">Tautkan perangkat</strong> dan scan QR di kiri.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="secondary" size="sm" onClick={() => void handleRefresh()} disabled={isBusy || activeSession.status === "connected"}>
                <RefreshCw className="h-3.5 w-3.5 mr-1" /> Refresh QR
              </Button>
              <Button type="button" variant="secondary" size="sm" onClick={() => void handleWebhook()} disabled={isBusy}>
                <Webhook className="h-3.5 w-3.5 mr-1" /> Daftarkan webhook
              </Button>
              <Button type="button" variant="destructive" size="sm" onClick={() => void handleLogout(activeSession)} disabled={isBusy}>
                <LogOut className="h-3.5 w-3.5 mr-1" /> Putuskan
              </Button>
            </div>
            {webhookUrl && (
              <div className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800 font-medium">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                Webhook aman terdaftar ke runtime chatbot. URL secret tidak ditampilkan di panel.
              </div>
            )}
          </div>
        </div>
      )}

      {sessions.length > 0 && (
        <div className="space-y-2 border-t border-slate-200 pt-4">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Sesi QR tersimpan</p>
          <div className="grid gap-2 md:grid-cols-2">
            {sessions.map((session) => (
              <button
                key={session.id}
                type="button"
                onClick={() => { setActiveSessionId(session.id); setQrCode(""); }}
                className={`flex items-center justify-between rounded-xl border p-3 text-left transition cursor-pointer ${session.id === activeSessionId ? "border-blue-300 bg-blue-50" : "border-slate-200 bg-white hover:bg-slate-50"}`}
              >
                <span>
                  <span className="block text-xs font-bold text-slate-900">{session.label}</span>
                  <span className="block text-[11px] text-slate-500">{session.phoneNumber || session.instanceName}</span>
                </span>
                <Badge variant={statusBadgeVariant(session.status)} className="text-[9px]">{statusLabel(session.status)}</Badge>
              </button>
            ))}
          </div>
        </div>
      )}

      {message && <p className="text-xs font-bold text-blue-700">{message}</p>}
    </div>
  );
}
