"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  AlertCircle,
  ArrowLeft,
  Check,
  Copy,
  Eye,
  Globe,
  Instagram,
  MessageCircle,
  Send,
  Shield,
  TestTube2,
  Wifi,
} from "lucide-react";

import { useDashboardConfig } from "@/hooks/use-dashboard-config";
import { resolveDashboardPublicAppUrl } from "@/lib/runtime-url";
import type { ChannelKind } from "@/types/operations";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type ActiveChannel = "list" | "webchat" | "whatsapp" | "instagram";

function getChannelKind(activeChannel: ActiveChannel): ChannelKind {
  switch (activeChannel) {
    case "whatsapp":
      return "WhatsApp";
    case "instagram":
      return "Instagram DM";
    case "webchat":
    case "list":
    default:
      return "Website Chat";
  }
}

export default function ChannelsPage() {
  const { config, patchConfig } = useDashboardConfig();

  const [activeChannel, setActiveChannel] = useState<ActiveChannel>("list");
  const [origin, setOrigin] = useState("");
  const [copied, setCopied] = useState(false);
  const [webchatSaved, setWebchatSaved] = useState(false);
  const [waSaved, setWaSaved] = useState(false);
  const [igSaved, setIgSaved] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testFeedback, setTestFeedback] = useState("");

  const [widgetColor, setWidgetColor] = useState(config.channels.webchat.widgetColor);
  const [welcomeText, setWelcomeText] = useState(config.channels.webchat.welcomeText);
  const [webchatEnabled, setWebchatEnabled] = useState(config.channels.webchat.enabled);
  const [captureLead, setCaptureLead] = useState(config.channels.webchat.captureLead);
  const [handoffToWhatsApp, setHandoffToWhatsApp] = useState(
    config.channels.webchat.handoffToWhatsApp,
  );

  const [waLabel, setWaLabel] = useState(config.channels.whatsapp.businessLabel);
  const [phoneId, setPhoneId] = useState(config.channels.whatsapp.phoneNumberId);
  const [accessToken, setAccessToken] = useState(config.channels.whatsapp.accessToken);
  const [verifyToken, setVerifyToken] = useState(config.channels.whatsapp.verifyToken);
  const [waAutoReply, setWaAutoReply] = useState(config.channels.whatsapp.autoReply);
  const [waStatus, setWaStatus] = useState(config.channels.whatsapp.status);

  const [igUsername, setIgUsername] = useState(config.channels.instagram.username);
  const [igAccountId, setIgAccountId] = useState(config.channels.instagram.accountId);
  const [igAccessToken, setIgAccessToken] = useState(config.channels.instagram.accessToken);
  const [igAutoReplyDm, setIgAutoReplyDm] = useState(
    config.channels.instagram.autoReplyDm,
  );
  const [igCommentGuard, setIgCommentGuard] = useState(
    config.channels.instagram.commentGuard,
  );
  const [igCommentToDm, setIgCommentToDm] = useState(
    config.channels.instagram.commentToDm,
  );
  const [igStatus, setIgStatus] = useState(config.channels.instagram.status);

  const [testDisplayName, setTestDisplayName] = useState("Customer Test");
  const [testPhone, setTestPhone] = useState("+6281234567890");
  const [testUsername, setTestUsername] = useState("@customer.test");
  const [testMessage, setTestMessage] = useState("Halo, saya ingin tanya harga servis.");
  const [testOutboundRecipient, setTestOutboundRecipient] = useState("+6281234567890");
  const [testOutboundMessage, setTestOutboundMessage] = useState(
    "Halo, ini pesan test dari dashboard Balesin Desk.",
  );

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  useEffect(() => {
    setWidgetColor(config.channels.webchat.widgetColor);
    setWelcomeText(config.channels.webchat.welcomeText);
    setWebchatEnabled(config.channels.webchat.enabled);
    setCaptureLead(config.channels.webchat.captureLead);
    setHandoffToWhatsApp(config.channels.webchat.handoffToWhatsApp);

    setWaLabel(config.channels.whatsapp.businessLabel);
    setPhoneId(config.channels.whatsapp.phoneNumberId);
    setAccessToken(config.channels.whatsapp.accessToken);
    setVerifyToken(config.channels.whatsapp.verifyToken);
    setWaAutoReply(config.channels.whatsapp.autoReply);
    setWaStatus(config.channels.whatsapp.status);

    setIgUsername(config.channels.instagram.username);
    setIgAccountId(config.channels.instagram.accountId);
    setIgAccessToken(config.channels.instagram.accessToken);
    setIgAutoReplyDm(config.channels.instagram.autoReplyDm);
    setIgCommentGuard(config.channels.instagram.commentGuard);
    setIgCommentToDm(config.channels.instagram.commentToDm);
    setIgStatus(config.channels.instagram.status);
  }, [config]);

  const baseUrl = useMemo(() => origin || "http://localhost:3000", [origin]);
  const configuredBaseUrl = useMemo(
    () => resolveDashboardPublicAppUrl(config.runtime.publicAppUrl, baseUrl),
    [baseUrl, config.runtime.publicAppUrl],
  );

  const whatsappWebhookUrl = `${configuredBaseUrl}/api/webhooks/whatsapp`;
  const instagramWebhookUrl = `${configuredBaseUrl}/api/webhooks/instagram`;
  const webchatWebhookUrl = `${configuredBaseUrl}/api/webhooks/webchat`;

  const embedCode = useMemo(
    () => `<!-- Balesin Desk Chat Widget -->
<script>
  window.BalesinConfig = {
    webhookUrl: "${webchatWebhookUrl}",
    workspaceId: "${config.workspace.name.toLowerCase().replace(/\s+/g, "-")}",
    themeColor: "${widgetColor}",
    welcomeMessage: "${welcomeText}",
    captureLead: ${captureLead},
    handoffToWhatsapp: ${handoffToWhatsApp}
  };
</script>
<script src="https://cdn.balesin.ai/widget.js" async></script>`,
    [
      captureLead,
      config.workspace.name,
      handoffToWhatsApp,
      webchatWebhookUrl,
      welcomeText,
      widgetColor,
    ],
  );

  const handleCopyCode = async () => {
    await navigator.clipboard.writeText(embedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const persistWebchat = (event: FormEvent) => {
    event.preventDefault();

    patchConfig((current) => ({
      ...current,
      channels: {
        ...current.channels,
        webchat: {
          ...current.channels.webchat,
          enabled: webchatEnabled,
          status: webchatEnabled ? "connected" : "draft",
          widgetColor,
          welcomeText,
          captureLead,
          handoffToWhatsApp,
        },
      },
    }));

    setWebchatSaved(true);
    setTimeout(() => setWebchatSaved(false), 2000);
  };

  const persistWhatsApp = (event: FormEvent) => {
    event.preventDefault();
    const trimmedLabel = waLabel.trim();
    const trimmedPhoneId = phoneId.trim();
    const trimmedAccessToken = accessToken.trim();
    const trimmedVerifyToken = verifyToken.trim();

    const nextStatus =
      trimmedPhoneId && trimmedAccessToken && trimmedVerifyToken
        ? ("connected" as const)
        : ("draft" as const);

    setWaLabel(trimmedLabel);
    setPhoneId(trimmedPhoneId);
    setAccessToken(trimmedAccessToken);
    setVerifyToken(trimmedVerifyToken);
    setWaStatus(nextStatus);

    patchConfig((current) => ({
      ...current,
      channels: {
        ...current.channels,
        whatsapp: {
          ...current.channels.whatsapp,
          enabled: nextStatus === "connected",
          status: nextStatus,
          businessLabel: trimmedLabel,
          phoneNumberId: trimmedPhoneId,
          accessToken: trimmedAccessToken,
          verifyToken: trimmedVerifyToken,
          webhookUrl: whatsappWebhookUrl,
          autoReply: waAutoReply,
        },
      },
    }));

    setWaSaved(true);
    setTimeout(() => setWaSaved(false), 2500);
  };

  const disconnectWhatsApp = () => {
    setWaStatus("disconnected");
    patchConfig((current) => ({
      ...current,
      channels: {
        ...current.channels,
        whatsapp: {
          ...current.channels.whatsapp,
          enabled: false,
          status: "disconnected",
        },
      },
    }));
  };

  const persistInstagram = (event: FormEvent) => {
    event.preventDefault();

    const nextStatus = igAccountId && igAccessToken ? "connected" : "draft";
    setIgStatus(nextStatus);

    patchConfig((current) => ({
      ...current,
      channels: {
        ...current.channels,
        instagram: {
          ...current.channels.instagram,
          enabled: nextStatus === "connected",
          status: nextStatus,
          username: igUsername,
          accountId: igAccountId,
          accessToken: igAccessToken,
          autoReplyDm: igAutoReplyDm,
          commentGuard: igCommentGuard,
          commentToDm: igCommentToDm,
        },
      },
    }));

    setIgSaved(true);
    setTimeout(() => setIgSaved(false), 2500);
  };

  const runInboundTest = async () => {
    if (activeChannel === "list") {
      return;
    }

    setIsTesting(true);
    setTestFeedback("");

    try {
      const response = await fetch("/api/channels/test-inbound", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          channel: activeChannel === "instagram" ? "Instagram DM" : getChannelKind(activeChannel),
          displayName: testDisplayName,
          phone: testPhone,
          username: testUsername,
          message: testMessage,
        }),
      });

      const payload = (await response.json()) as {
        error?: string;
        data?: {
          decision?: {
            intent?: string;
            status?: string;
          };
        };
      };

      if (!response.ok) {
        throw new Error(payload.error ?? "Simulasi inbound gagal.");
      }

      setTestFeedback(
        `Inbound test berhasil. Intent: ${payload.data?.decision?.intent ?? "-"}, status: ${payload.data?.decision?.status ?? "-"}. Lihat hasilnya di Inbox.`,
      );
    } catch (error) {
      setTestFeedback(
        error instanceof Error ? error.message : "Simulasi inbound gagal.",
      );
    } finally {
      setIsTesting(false);
    }
  };

  const runOutboundTest = async () => {
    if (activeChannel === "list") {
      return;
    }

    setIsTesting(true);
    setTestFeedback("");

    try {
      const response = await fetch("/api/channels/test-message", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          channel: activeChannel === "instagram" ? "Instagram DM" : getChannelKind(activeChannel),
          recipientId: testOutboundRecipient,
          message: testOutboundMessage,
        }),
      });

      const payload = (await response.json()) as {
        error?: string;
        data?: {
          provider?: string;
          status?: number;
          note?: string;
        };
      };

      if (!response.ok) {
        throw new Error(payload.error ?? "Test outbound gagal.");
      }

      setTestFeedback(
        `Outbound test selesai. Provider: ${payload.data?.provider ?? "-"}, status: ${payload.data?.status ?? "-"}. ${payload.data?.note ?? ""}`.trim(),
      );
    } catch (error) {
      setTestFeedback(
        error instanceof Error ? error.message : "Test outbound gagal.",
      );
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        {activeChannel !== "list" ? (
          <button
            onClick={() => setActiveChannel("list")}
            className="rounded-lg border border-white/8 bg-white/4 px-3 py-1.5 text-xs font-semibold transition duration-200 hover:text-white"
          >
            <span className="flex items-center gap-1.5">
              <ArrowLeft className="h-4 w-4" />
              Kembali ke daftar channel
            </span>
          </button>
        ) : null}
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-white">
            <Wifi className="h-6 w-6 text-cyan-400" />
            Saluran Komunikasi
          </h1>
          <p className="mt-1 text-xs text-slate-400">
            Semua koneksi WA, IG, dan web chat diatur dari dashboard yang sama.
          </p>
        </div>
      </div>

      {activeChannel === "list" ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          <div className="glass-panel flex h-52 flex-col justify-between rounded-xl p-5 transition duration-300 hover:border-cyan-500/20">
            <div>
              <div className="mb-3 flex items-center justify-between">
                <Globe className="h-7 w-7 text-cyan-300" />
                <Badge className="border-cyan-400/20 bg-cyan-950/40 text-cyan-200">
                  {config.channels.webchat.status}
                </Badge>
              </div>
              <h3 className="text-sm font-bold text-white">Website Live Chat</h3>
              <p className="mt-1.5 text-[11px] leading-normal text-slate-400">
                Widget chat, webhook inbound, dan lead capture dikelola penuh dari dashboard.
              </p>
            </div>
            <Button
              onClick={() => setActiveChannel("webchat")}
              className="mt-4 h-9 w-full py-2 text-xs"
              variant="secondary"
            >
              Konfigurasi widget
            </Button>
          </div>

          <div className="glass-panel flex h-52 flex-col justify-between rounded-xl p-5 transition duration-300 hover:border-emerald-500/20">
            <div>
              <div className="mb-3 flex items-center justify-between">
                <MessageCircle className="h-7 w-7 text-emerald-300" />
                <Badge className="border-emerald-400/20 bg-emerald-950/40 text-emerald-200">
                  {config.channels.whatsapp.status}
                </Badge>
              </div>
              <h3 className="text-sm font-bold text-white">WhatsApp Cloud API</h3>
              <p className="mt-1.5 text-[11px] leading-normal text-slate-400">
                Phone number ID, token, verify token, webhook, dan test message dikelola di sini.
              </p>
            </div>
            <Button
              onClick={() => setActiveChannel("whatsapp")}
              className="mt-4 h-9 w-full py-2 text-xs"
              variant="secondary"
            >
              Sambungkan nomor
            </Button>
          </div>

          <div className="glass-panel flex h-52 flex-col justify-between rounded-xl p-5 transition duration-300 hover:border-fuchsia-500/20">
            <div>
              <div className="mb-3 flex items-center justify-between">
                <Instagram className="h-7 w-7 text-fuchsia-300" />
                <Badge className="border-fuchsia-400/20 bg-fuchsia-950/40 text-fuchsia-200">
                  {config.channels.instagram.status}
                </Badge>
              </div>
              <h3 className="text-sm font-bold text-white">Instagram DM & Comment</h3>
              <p className="mt-1.5 text-[11px] leading-normal text-slate-400">
                DM automation, comment guard, dan test inbound Instagram diatur dari sini.
              </p>
            </div>
            <Button
              onClick={() => setActiveChannel("instagram")}
              className="mt-4 h-9 w-full py-2 text-xs"
              variant="secondary"
            >
              Atur Instagram
            </Button>
          </div>
        </div>
      ) : null}

      {activeChannel === "webchat" ? (
        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
          <form onSubmit={persistWebchat} className="space-y-6 lg:col-span-2">
            <div className="glass-panel space-y-4 rounded-xl p-5">
              <h3 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-cyan-400">
                <Globe className="h-4.5 w-4.5" />
                Desain widget chat website
              </h3>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Warna tombol utama</label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={widgetColor}
                      onChange={(event) => setWidgetColor(event.target.value)}
                      className="h-10 w-12 rounded-lg border-0 bg-transparent p-0"
                    />
                    <Input
                      type="text"
                      value={widgetColor}
                      onChange={(event) => setWidgetColor(event.target.value)}
                      className="h-10 flex-1 text-xs"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">
                    Pesan selamat datang
                  </label>
                  <Input
                    value={welcomeText}
                    onChange={(event) => setWelcomeText(event.target.value)}
                    className="h-10 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <label className="flex items-center gap-3 rounded-xl border border-white/8 bg-white/[0.03] p-4 text-xs text-slate-300">
                  <input
                    type="checkbox"
                    checked={webchatEnabled}
                    onChange={(event) => setWebchatEnabled(event.target.checked)}
                    className="h-4 w-4 rounded border-white/12 bg-white/4 text-cyan-500"
                  />
                  Aktifkan widget web chat untuk website
                </label>
                <label className="flex items-center gap-3 rounded-xl border border-white/8 bg-white/[0.03] p-4 text-xs text-slate-300">
                  <input
                    type="checkbox"
                    checked={captureLead}
                    onChange={(event) => setCaptureLead(event.target.checked)}
                    className="h-4 w-4 rounded border-white/12 bg-white/4 text-cyan-500"
                  />
                  Minta nama dan nomor customer sebelum percakapan lanjut
                </label>
                <label className="flex items-center gap-3 rounded-xl border border-white/8 bg-white/[0.03] p-4 text-xs text-slate-300 md:col-span-2">
                  <input
                    type="checkbox"
                    checked={handoffToWhatsApp}
                    onChange={(event) => setHandoffToWhatsApp(event.target.checked)}
                    className="h-4 w-4 rounded border-white/12 bg-white/4 text-cyan-500"
                  />
                  Saat handoff terjadi, arahkan customer ke WhatsApp admin bila channel itu aktif
                </label>
              </div>

              <div className="rounded-lg border border-white/8 bg-white/4 p-4 text-[11px] leading-normal text-slate-400">
                <p className="font-bold text-slate-300">Webhook web chat</p>
                <code className="mt-2 block rounded bg-[#020611] p-2 font-mono text-cyan-300">
                  {webchatWebhookUrl}
                </code>
              </div>

              <div className="flex items-center justify-between">
                {webchatSaved ? (
                  <span className="text-xs font-bold text-emerald-400">
                    Konfigurasi web chat disimpan.
                  </span>
                ) : (
                  <div />
                )}
                <Button type="submit">Simpan web chat</Button>
              </div>
            </div>

            <div className="glass-panel space-y-4 rounded-xl p-5">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-400">
                  Embed code HTML
                </h3>
                <button
                  onClick={() => void handleCopyCode()}
                  type="button"
                  className="flex items-center gap-1.5 text-xs font-semibold text-cyan-400 transition hover:text-cyan-300"
                >
                  {copied ? (
                    <>
                      <Check className="h-4 w-4" /> Disalin
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" /> Salin code
                    </>
                  )}
                </button>
              </div>
              <pre className="custom-scrollbar overflow-x-auto whitespace-pre-wrap rounded-lg border border-white/8 bg-[#020611] p-4 font-mono text-[10px] leading-relaxed text-slate-300">
                {embedCode}
              </pre>
            </div>
          </form>

          <div className="glass-panel relative flex h-[470px] flex-col overflow-hidden rounded-xl bg-gradient-to-b from-[#04091a] to-[#020611] p-5">
            <h3 className="mb-4 flex items-center gap-1.5 shrink-0 text-xs font-bold uppercase tracking-wider text-cyan-400">
              <Eye className="h-4.5 w-4.5" />
              Pratinjau widget
            </h3>
            <div className="relative flex flex-1 flex-col justify-between overflow-hidden rounded-lg border border-white/8 bg-white/2 p-4">
              <div className="pointer-events-none select-none space-y-2 opacity-30">
                <div className="h-4 w-24 rounded bg-white/20" />
                <div className="h-3 w-full rounded bg-white/10" />
                <div className="h-3 w-4/5 rounded bg-white/10" />
              </div>

              <div className="absolute bottom-16 right-4 flex w-56 flex-col rounded-xl border border-white/8 bg-[#091223] text-[10px] shadow-2xl">
                <div
                  className="rounded-t-xl px-3 py-2.5 font-bold text-white"
                  style={{ backgroundColor: widgetColor }}
                >
                  <div className="flex items-center gap-2">
                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-white/20 font-bold">
                      B
                    </div>
                    <div>
                      <div className="text-[9px] font-bold">{config.workspace.name}</div>
                      <div className="text-[7px] font-normal text-white/80">
                        AI membalas kilat
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex-1 space-y-2 bg-[#04091a]/40 p-3">
                  <div className="max-w-[85%] rounded-lg rounded-tl-none bg-white/6 px-2.5 py-1.5 text-[9px] text-slate-300">
                    {welcomeText}
                  </div>
                </div>
              </div>

              <div
                className="absolute bottom-4 right-4 flex h-9 w-9 items-center justify-center rounded-full text-white shadow-lg"
                style={{ backgroundColor: widgetColor }}
              >
                <MessageCircle className="h-4.5 w-4.5" />
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {activeChannel === "whatsapp" ? (
        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-5 rounded-xl border border-white/8 bg-[#04091a]/70 p-6 backdrop-blur-md">
            <div className="flex items-center justify-between border-b border-white/8 pb-3">
              <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-cyan-400">
                <MessageCircle className="h-5 w-5 text-emerald-400" />
                Integrasi WhatsApp Cloud API
              </h3>
              <Badge className="border-emerald-400/20 bg-emerald-950/40 text-emerald-200">
                {waStatus}
              </Badge>
            </div>

            <form onSubmit={persistWhatsApp} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Label nomor bisnis</label>
                  <Input value={waLabel} onChange={(event) => setWaLabel(event.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Phone Number ID</label>
                  <Input value={phoneId} onChange={(event) => setPhoneId(event.target.value)} />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  Permanent access token
                </label>
                <Input
                  type="password"
                  value={accessToken}
                  onChange={(event) => setAccessToken(event.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Verify token</label>
                <Input
                  value={verifyToken}
                  onChange={(event) => setVerifyToken(event.target.value)}
                />
              </div>

              <label className="flex items-center gap-3 rounded-xl border border-white/8 bg-white/[0.03] p-4 text-xs text-slate-300">
                <input
                  type="checkbox"
                  checked={waAutoReply}
                  onChange={(event) => setWaAutoReply(event.target.checked)}
                  className="h-4 w-4 rounded border-white/12 bg-white/4 text-cyan-500"
                />
                Aktifkan auto reply WhatsApp menggunakan AI Agent dashboard
              </label>

              <div className="rounded-lg border border-white/8 bg-white/4 p-4 text-[11px] leading-normal text-slate-400">
                <p className="flex items-center gap-1 font-bold text-slate-300">
                  <AlertCircle className="h-4 w-4 text-cyan-400" />
                  Gunakan data ini pada Facebook Developer webhook setup
                </p>
                <div className="mt-2 space-y-2">
                  <div>
                    <span className="block text-[10px] font-semibold uppercase text-slate-500">
                      Callback URL
                    </span>
                    <code className="mt-0.5 block rounded bg-[#020611] p-1 font-mono text-cyan-300">
                      {whatsappWebhookUrl}
                    </code>
                  </div>
                  <div>
                    <span className="block text-[10px] font-semibold uppercase text-slate-500">
                      Verify Token
                    </span>
                    <code className="mt-0.5 block rounded bg-[#020611] p-1 font-mono text-cyan-300">
                      {verifyToken}
                    </code>
                  </div>
                </div>
              </div>

              {waSaved ? (
                <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-4 text-xs text-emerald-300">
                  Konfigurasi WhatsApp tersimpan.
                </div>
              ) : null}

              <div className="flex items-center justify-between">
                <div className="text-xs text-slate-500">
                  Semua data WhatsApp ini sekarang bersumber dari dashboard.
                </div>
                <div className="flex gap-3">
                  {waStatus === "connected" ? (
                    <Button
                      type="button"
                      variant="secondary"
                      className="px-4"
                      onClick={disconnectWhatsApp}
                    >
                      Putuskan
                    </Button>
                  ) : null}
                  <Button type="submit" className="px-5">
                    Simpan WA
                  </Button>
                </div>
              </div>
            </form>
          </div>

          <div className="glass-panel space-y-4 rounded-xl p-5">
            <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-cyan-400">
              <TestTube2 className="h-4.5 w-4.5" />
              Test channel
            </h3>
            <p className="text-[11px] leading-6 text-slate-400">
              Gunakan panel ini untuk simulasi pesan inbound ke inbox atau kirim outbound test lewat adapter channel.
            </p>
            {renderTestPanel()}
          </div>
        </div>
      ) : null}

      {activeChannel === "instagram" ? (
        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-5 rounded-xl border border-white/8 bg-[#04091a]/70 p-6 backdrop-blur-md">
            <div className="flex items-center justify-between border-b border-white/8 pb-3">
              <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-fuchsia-300">
                <Instagram className="h-5 w-5 text-fuchsia-300" />
                Instagram DM & Comment Automation
              </h3>
              <Badge className="border-fuchsia-400/20 bg-fuchsia-950/40 text-fuchsia-200">
                {igStatus}
              </Badge>
            </div>

            <form onSubmit={persistInstagram} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Username Instagram</label>
                  <Input
                    value={igUsername}
                    onChange={(event) => setIgUsername(event.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Instagram Account ID</label>
                  <Input
                    value={igAccountId}
                    onChange={(event) => setIgAccountId(event.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Meta access token</label>
                <Input
                  type="password"
                  value={igAccessToken}
                  onChange={(event) => setIgAccessToken(event.target.value)}
                />
              </div>

              <div className="rounded-lg border border-white/8 bg-white/4 p-4 text-[11px] leading-normal text-slate-400">
                <p className="font-bold text-slate-300">Webhook Instagram</p>
                <code className="mt-2 block rounded bg-[#020611] p-2 font-mono text-cyan-300">
                  {instagramWebhookUrl}
                </code>
              </div>

              <div className="grid grid-cols-1 gap-3">
                <label className="flex items-center gap-3 rounded-xl border border-white/8 bg-white/[0.03] p-4 text-xs text-slate-300">
                  <input
                    type="checkbox"
                    checked={igAutoReplyDm}
                    onChange={(event) => setIgAutoReplyDm(event.target.checked)}
                    className="h-4 w-4 rounded border-white/12 bg-white/4 text-cyan-500"
                  />
                  Aktifkan auto reply untuk DM Instagram
                </label>
                <label className="flex items-center gap-3 rounded-xl border border-white/8 bg-white/[0.03] p-4 text-xs text-slate-300">
                  <input
                    type="checkbox"
                    checked={igCommentGuard}
                    onChange={(event) => setIgCommentGuard(event.target.checked)}
                    className="h-4 w-4 rounded border-white/12 bg-white/4 text-cyan-500"
                  />
                  Aktifkan comment guard untuk spam, judol, dan kata kasar
                </label>
                <label className="flex items-center gap-3 rounded-xl border border-white/8 bg-white/[0.03] p-4 text-xs text-slate-300">
                  <input
                    type="checkbox"
                    checked={igCommentToDm}
                    onChange={(event) => setIgCommentToDm(event.target.checked)}
                    className="h-4 w-4 rounded border-white/12 bg-white/4 text-cyan-500"
                  />
                  Otomatis arahkan komentar berkualitas ke DM untuk follow-up sales
                </label>
              </div>

              <div className="rounded-lg border border-fuchsia-400/15 bg-fuchsia-950/15 p-4 text-xs leading-6 text-slate-300">
                <div className="mb-2 flex items-center gap-2 font-bold text-fuchsia-200">
                  <Shield className="h-4 w-4" />
                  Instagram control from dashboard
                </div>
                Pengaturan ini menjadi source of truth untuk DM automation,
                comment guard, dan private DM converter.
              </div>

              {igSaved ? (
                <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-4 text-xs text-emerald-300">
                  Konfigurasi Instagram berhasil disimpan ke dashboard.
                </div>
              ) : null}

              <div className="flex items-center justify-between">
                <div className="text-xs text-slate-500">
                  Status menjadi `connected` saat account ID dan token tersedia.
                </div>
                <Button type="submit" className="px-5">
                  Simpan Instagram
                </Button>
              </div>
            </form>
          </div>

          <div className="glass-panel space-y-4 rounded-xl p-5">
            <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-fuchsia-300">
              <TestTube2 className="h-4.5 w-4.5" />
              Test DM / comment
            </h3>
            <p className="text-[11px] leading-6 text-slate-400">
              Simulasikan pesan Instagram ke inbox tanpa menunggu webhook provider hidup.
            </p>
            {renderTestPanel()}
          </div>
        </div>
      ) : null}

      {renderHiddenTestPanel()}
    </div>
  );

  function renderTestPanel() {
    return (
      <div className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-300">Nama customer test</label>
          <Input
            value={testDisplayName}
            onChange={(event) => setTestDisplayName(event.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">
              Nomor / recipient ID
            </label>
            <Input
              value={testPhone}
              onChange={(event) => {
                setTestPhone(event.target.value);
                setTestOutboundRecipient(event.target.value);
              }}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Username</label>
            <Input
              value={testUsername}
              onChange={(event) => setTestUsername(event.target.value)}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-300">Inbound test message</label>
          <Textarea
            rows={4}
            value={testMessage}
            onChange={(event) => setTestMessage(event.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-300">Outbound test message</label>
          <Textarea
            rows={3}
            value={testOutboundMessage}
            onChange={(event) => setTestOutboundMessage(event.target.value)}
          />
        </div>

        {testFeedback ? (
          <div className="rounded-lg border border-cyan-400/15 bg-cyan-950/15 p-3 text-[11px] leading-6 text-cyan-100">
            {testFeedback}
          </div>
        ) : null}

        <div className="flex flex-wrap gap-3">
          <Button
            type="button"
            variant="secondary"
            className="text-xs"
            onClick={() => void runInboundTest()}
            disabled={isTesting}
          >
            <TestTube2 className="mr-1.5 h-4 w-4" />
            Simulasi inbound
          </Button>
          <Button
            type="button"
            className="text-xs"
            onClick={() => void runOutboundTest()}
            disabled={isTesting}
          >
            <Send className="mr-1.5 h-4 w-4" />
            Test outbound
          </Button>
        </div>
      </div>
    );
  }

  function renderHiddenTestPanel() {
    if (activeChannel !== "webchat") {
      return null;
    }

    return (
      <div className="glass-panel space-y-4 rounded-xl p-5">
        <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-cyan-400">
          <TestTube2 className="h-4.5 w-4.5" />
          Test web chat
        </h3>
        <p className="text-[11px] leading-6 text-slate-400">
          Simulasikan pesan customer website langsung ke inbox untuk mengecek alur auto-reply, handoff, dan follow-up.
        </p>
        {renderTestPanel()}
      </div>
    );
  }
}
