"use client";

import { useEffect, useMemo, useState, useCallback, type FormEvent } from "react";
import {
  AlertCircle,
  ArrowLeft,
  Check,
  CheckCircle2,
  Copy,
  Eye,
  Globe,
  Instagram,
  Loader2,
  MessageCircle,
  Send,
  Shield,
  Wifi,
  Smartphone,
  Phone,
  ShoppingCart,
  Mail,
  Facebook,
  MessageSquare,
  Database,
  Plus,
  PlusCircle,
  Link2,
  Settings,
  ChevronDown,
  Unplug,
  Zap
} from "lucide-react";

import { useMetaConnect } from "@/hooks/use-meta-connect";
import { WhatsAppQrConnector } from "./components/whatsapp-qr-connector";

import { useDashboardConfig } from "@/hooks/use-dashboard-config";
import { resolveDashboardPublicAppUrl } from "@/lib/runtime-url";
import type { ChannelKind } from "@/types/operations";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";

type ActiveChannel =
  | "mobilechat"
  | "webchat"
  | "whatsapp"
  | "instagram"
  | "facebook"
  | "telegram"
  | "x"
  | "line"
  | "call"
  | "ecommerce"
  | "email"
  | "qontak";

export default function ChannelsPage() {
  const { config, patchConfig } = useDashboardConfig();
  const {
    connectWhatsApp,
    connectInstagram,
    isWaConnecting,
    isIgConnecting,
    waError: oauthWaError,
    igError: oauthIgError,
  } = useMetaConnect();

  const whatsappAccounts = useMemo(() => {
    const list = config.channels.whatsapp.accounts ?? [];
    if (list.length === 0 && config.channels.whatsapp.status === "connected" && config.channels.whatsapp.phoneNumberId) {
      return [{
        id: config.channels.whatsapp.phoneNumberId,
        businessLabel: config.channels.whatsapp.businessLabel || "WhatsApp Business Account",
        phoneNumberId: config.channels.whatsapp.phoneNumberId,
        accessToken: config.channels.whatsapp.accessToken,
        verifyToken: config.channels.whatsapp.verifyToken,
        status: config.channels.whatsapp.status,
        phoneNumber: "Primary Number",
      }];
    }
    return list;
  }, [config.channels.whatsapp]);

  const instagramAccounts = useMemo(() => {
    const list = config.channels.instagram.accounts ?? [];
    if (list.length === 0 && config.channels.instagram.status === "connected" && config.channels.instagram.accountId) {
      return [{
        id: config.channels.instagram.accountId,
        username: config.channels.instagram.username || "instagram_user",
        accountId: config.channels.instagram.accountId,
        pageId: config.channels.instagram.pageId || "",
        accessToken: config.channels.instagram.accessToken,
        verifyToken: config.channels.instagram.verifyToken,
        status: config.channels.instagram.status,
        pageName: "Instagram Account",
      }];
    }
    return list;
  }, [config.channels.instagram]);

  const hasConnectedWhatsApp = whatsappAccounts.length > 0;
  const hasConnectedInstagram = instagramAccounts.length > 0;

  const [activeChannel, setActiveChannel] = useState<ActiveChannel>("whatsapp");
  const [origin, setOrigin] = useState("");
  const [copied, setCopied] = useState(false);
  const [webchatSaved, setWebchatSaved] = useState(false);
  const [waSaved, setWaSaved] = useState(false);
  const [igSaved, setIgSaved] = useState(false);

  const [waAdvancedOpen, setWaAdvancedOpen] = useState(false);
  const [igAdvancedOpen, setIgAdvancedOpen] = useState(false);

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
  const [waAutoReplyGroups, setWaAutoReplyGroups] = useState(
    config.channels.whatsapp.autoReplyGroups,
  );
  const [waStatus, setWaStatus] = useState(config.channels.whatsapp.status);

  const [igUsername, setIgUsername] = useState(config.channels.instagram.username);
  const [igAccountId, setIgAccountId] = useState(config.channels.instagram.accountId);
  const [igPageId, setIgPageId] = useState(config.channels.instagram.pageId || "");
  const [igAccessToken, setIgAccessToken] = useState(config.channels.instagram.accessToken);
  const [igVerifyToken, setIgVerifyToken] = useState(config.channels.instagram.verifyToken || "");
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

  // Mobile Widget Builder States
  const [mobileWidgetName, setMobileWidgetName] = useState(config.channels.mobilechat?.widgetName || "Mobile App Widget Utama");
  const [mobilePlatform, setMobilePlatform] = useState<"react-native" | "flutter" | "android" | "ios">(config.channels.mobilechat?.platform || "react-native");
  const [mobileWidgetColor, setMobileWidgetColor] = useState(config.channels.mobilechat?.widgetColor || "#2563eb");
  const [mobileWelcomeText, setMobileWelcomeText] = useState(config.channels.mobilechat?.welcomeText || "Halo Kak! Ada yang bisa kami bantu?");

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  useEffect(() => {
    setWidgetColor(config.channels.webchat.widgetColor);
    setWelcomeText(config.channels.webchat.welcomeText);
    setWebchatEnabled(config.channels.webchat.enabled);
    setCaptureLead(config.channels.webchat.captureLead);
    setHandoffToWhatsApp(config.channels.webchat.handoffToWhatsApp);

    if (config.channels.mobilechat) {
      setMobileWidgetName(config.channels.mobilechat.widgetName);
      setMobilePlatform(config.channels.mobilechat.platform);
      setMobileWidgetColor(config.channels.mobilechat.widgetColor);
      setMobileWelcomeText(config.channels.mobilechat.welcomeText);
    }

    setWaLabel(config.channels.whatsapp.businessLabel);
    setPhoneId(config.channels.whatsapp.phoneNumberId);
    setAccessToken(config.channels.whatsapp.accessToken);
    setVerifyToken(config.channels.whatsapp.verifyToken);
    setWaAutoReply(config.channels.whatsapp.autoReply);
    setWaAutoReplyGroups(config.channels.whatsapp.autoReplyGroups);
    setWaStatus(config.channels.whatsapp.status);

    setIgUsername(config.channels.instagram.username);
    setIgAccountId(config.channels.instagram.accountId);
    setIgPageId(config.channels.instagram.pageId || "");
    setIgAccessToken(config.channels.instagram.accessToken);
    setIgVerifyToken(config.channels.instagram.verifyToken || "");
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

    const hasExistingToken =
      config.channels.whatsapp.status === "connected" ||
      config.channels.whatsapp.status === "testing";

    const nextStatus =
      trimmedPhoneId && (trimmedAccessToken || hasExistingToken) && trimmedVerifyToken
        ? ("connected" as const)
        : ("draft" as const);

    setWaLabel(trimmedLabel);
    setPhoneId(trimmedPhoneId);
    setAccessToken(trimmedAccessToken);
    setVerifyToken(trimmedVerifyToken);
    setWaStatus(nextStatus);

    patchConfig((current) => {
      const existingAccounts = current.channels.whatsapp.accounts ?? [];
      let updatedAccounts = [...existingAccounts];

      if (nextStatus === "connected") {
        const existingAccount = existingAccounts.find(
          (acc) => acc.phoneNumberId === trimmedPhoneId,
        );
        const newAccount = {
          id: trimmedPhoneId,
          businessLabel: trimmedLabel || "WhatsApp Business Account",
          phoneNumberId: trimmedPhoneId,
          accessToken: trimmedAccessToken,
          verifyToken: trimmedVerifyToken,
          status: "connected" as const,
          phoneNumber: existingAccount?.phoneNumber || "Primary Number",
        };

        const alreadyExists = existingAccounts.some(acc => acc.phoneNumberId === trimmedPhoneId);
        if (alreadyExists) {
          updatedAccounts = updatedAccounts.map(acc => acc.phoneNumberId === trimmedPhoneId ? newAccount : acc);
        } else {
          updatedAccounts.push(newAccount);
        }
      }

      return {
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
            autoReplyGroups: waAutoReplyGroups,
            accounts: updatedAccounts,
          },
        },
      };
    });

    setWaSaved(true);
    setTimeout(() => setWaSaved(false), 2500);
  };

  const persistInstagram = (event: FormEvent) => {
    event.preventDefault();
    const trimmedUsername = igUsername.trim();
    const trimmedAccountId = igAccountId.trim();
    const trimmedAccessToken = igAccessToken.trim();
    const trimmedVerifyToken = igVerifyToken.trim();

    const nextStatus =
      trimmedAccountId && trimmedAccessToken
        ? ("connected" as const)
        : ("draft" as const);

    patchConfig((current) => ({
      ...current,
      channels: {
        ...current.channels,
        instagram: {
          ...current.channels.instagram,
          enabled: nextStatus === "connected",
          status: nextStatus,
          username: trimmedUsername,
          accountId: trimmedAccountId,
          pageId: igPageId.trim(),
          accessToken: trimmedAccessToken,
          verifyToken: trimmedVerifyToken,
          autoReplyDm: igAutoReplyDm,
          commentGuard: igCommentGuard,
          commentToDm: igCommentToDm,
        },
      },
    }));

    setIgSaved(true);
    setTimeout(() => setIgSaved(false), 2500);
  };

  const handleOAuthWhatsApp = useCallback(async () => {
    const result = await connectWhatsApp();
    if (!result) {
      if (oauthWaError?.toLowerCase().includes("https")) {
        setWaAdvancedOpen(true);
      }
      return;
    }

    const { phoneNumberId, accessToken: token, businessName, displayPhone } = result;
    if (!phoneNumberId || !token) return;

    patchConfig((current) => {
      const existingAccounts = current.channels.whatsapp.accounts ?? [];
      const alreadyExists = existingAccounts.some(acc => acc.phoneNumberId === phoneNumberId);
      let updatedAccounts = [...existingAccounts];

      const newAccount = {
        id: phoneNumberId,
        businessLabel: businessName || "WhatsApp Business Account",
        phoneNumberId: phoneNumberId,
        accessToken: token,
        verifyToken: current.channels.whatsapp.verifyToken || "balesin_verify",
        status: "connected" as const,
        phoneNumber: displayPhone || "—",
      };

      if (alreadyExists) {
        updatedAccounts = updatedAccounts.map(acc => acc.phoneNumberId === phoneNumberId ? newAccount : acc);
      } else {
        updatedAccounts.push(newAccount);
      }

      const isFirst = existingAccounts.length === 0;

      return {
        ...current,
        channels: {
          ...current.channels,
          whatsapp: {
            ...current.channels.whatsapp,
            enabled: true,
            status: "connected" as const,
            businessLabel: isFirst ? newAccount.businessLabel : current.channels.whatsapp.businessLabel,
            phoneNumberId: isFirst ? newAccount.phoneNumberId : current.channels.whatsapp.phoneNumberId,
            accessToken: isFirst ? newAccount.accessToken : current.channels.whatsapp.accessToken,
            verifyToken: current.channels.whatsapp.verifyToken || "balesin_verify",
            accounts: updatedAccounts,
          }
        }
      };
    });
  }, [connectWhatsApp, patchConfig, oauthWaError]);

  const disconnectWhatsAppAccount = useCallback((phoneIdToDisconnect: string) => {
    patchConfig((current) => {
      const existingAccounts = current.channels.whatsapp.accounts ?? [];
      const updatedAccounts = existingAccounts.filter(acc => acc.phoneNumberId !== phoneIdToDisconnect);
      const nextPrimary = updatedAccounts[0];

      return {
        ...current,
        channels: {
          ...current.channels,
          whatsapp: {
            ...current.channels.whatsapp,
            enabled: updatedAccounts.length > 0,
            status: updatedAccounts.length > 0 ? "connected" as const : "disconnected" as const,
            businessLabel: nextPrimary ? nextPrimary.businessLabel : "",
            phoneNumberId: nextPrimary ? nextPrimary.phoneNumberId : "",
            accessToken: nextPrimary ? nextPrimary.accessToken : "",
            accounts: updatedAccounts,
          }
        }
      };
    });
  }, [patchConfig]);

  const handleOAuthInstagram = useCallback(async () => {
    const result = await connectInstagram();
    if (!result) {
      if (oauthIgError?.toLowerCase().includes("https")) {
        setIgAdvancedOpen(true);
      }
      return;
    }

    const { accountId, accessToken: token, username, pageId, pageName } = result;
    if (!accountId || !token) return;

    patchConfig((current) => {
      const existingAccounts = current.channels.instagram.accounts ?? [];
      const alreadyExists = existingAccounts.some(acc => acc.accountId === accountId);
      let updatedAccounts = [...existingAccounts];
      const isCurrentPrimary =
        !current.channels.instagram.accountId ||
        current.channels.instagram.accountId === accountId;

      const newAccount = {
        id: accountId,
        username: username || "instagram_user",
        accountId: accountId,
        pageId: pageId || "",
        accessToken: token,
        verifyToken: current.channels.instagram.verifyToken || "balesin_verify",
        status: "connected" as const,
        pageName: pageName || "—",
      };

      if (alreadyExists) {
        updatedAccounts = updatedAccounts.map(acc => acc.accountId === accountId ? newAccount : acc);
      } else {
        updatedAccounts.push(newAccount);
      }

      const shouldSyncPrimary = existingAccounts.length === 0 || isCurrentPrimary;

      return {
        ...current,
        channels: {
          ...current.channels,
          instagram: {
            ...current.channels.instagram,
            enabled: true,
            status: "connected" as const,
            username: shouldSyncPrimary ? newAccount.username : current.channels.instagram.username,
            accountId: shouldSyncPrimary ? newAccount.accountId : current.channels.instagram.accountId,
            pageId: shouldSyncPrimary ? newAccount.pageId : current.channels.instagram.pageId,
            accessToken: shouldSyncPrimary ? newAccount.accessToken : current.channels.instagram.accessToken,
            verifyToken: current.channels.instagram.verifyToken || "balesin_verify",
            accounts: updatedAccounts,
          }
        }
      };
    });
  }, [connectInstagram, patchConfig, oauthIgError]);

  const disconnectInstagramAccount = useCallback((accountIdToDisconnect: string) => {
    patchConfig((current) => {
      const existingAccounts = current.channels.instagram.accounts ?? [];
      const updatedAccounts = existingAccounts.filter(acc => acc.accountId !== accountIdToDisconnect);
      const nextPrimary = updatedAccounts[0];

      return {
        ...current,
        channels: {
          ...current.channels,
          instagram: {
            ...current.channels.instagram,
            enabled: updatedAccounts.length > 0,
            status: updatedAccounts.length > 0 ? "connected" as const : "draft" as const,
            username: nextPrimary ? nextPrimary.username : "",
            accountId: nextPrimary ? nextPrimary.accountId : "",
            pageId: nextPrimary ? nextPrimary.pageId : "",
            accessToken: nextPrimary ? nextPrimary.accessToken : "",
            accounts: updatedAccounts,
          }
        }
      };
    });
  }, [patchConfig]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Integrations & Channels</h1>
        <p className="text-xs text-slate-500 mt-1">
          Hubungkan seluruh saluran komunikasi bisnis Anda ke satu platform Omnichannel terpusat.
        </p>
      </div>

      {/* Main Channel Selector Tabs */}
      <div className="border-b border-slate-200 overflow-x-auto">
        <nav className="flex gap-1">
          {[
            { id: "whatsapp", label: "WhatsApp", icon: MessageCircle, badge: hasConnectedWhatsApp ? "Connected" : null },
            { id: "instagram", label: "Instagram", icon: Instagram, badge: hasConnectedInstagram ? "Connected" : null },
            { id: "webchat", label: "Web Chat", icon: Globe, badge: webchatEnabled ? "Active" : null },
            { id: "mobilechat", label: "Mobile App SDK", icon: Smartphone },
            { id: "call", label: "Call / VoIP", icon: Phone },
            { id: "qontak", label: "Qontak CRM", icon: Database },
          ].map(({ id, label, icon: Icon, badge }) => (
            <button
              key={id}
              onClick={() => setActiveChannel(id as ActiveChannel)}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold whitespace-nowrap border-b-2 transition cursor-pointer ${
                activeChannel === id
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-slate-500 hover:text-slate-900"
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
              {badge && <Badge variant="success" className="text-[9px] px-1.5 py-0">{badge}</Badge>}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Panels */}
      <div>
        {/* ============================================== */}
        {/* WHATSAPP TAB */}
        {/* ============================================== */}
        {activeChannel === "whatsapp" && (
          <div className="space-y-6 max-w-4xl">
            {/* WhatsApp QR Connector Section */}
            <Card className="p-6 border-slate-200 bg-white shadow-2xs">
              <WhatsAppQrConnector />
            </Card>

            {/* Cloud API Connect */}
            <Card className="p-6 border-slate-200 bg-white shadow-2xs space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 font-bold">
                    <MessageCircle className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">WhatsApp Cloud API (Meta Official)</h3>
                    <p className="text-xs text-slate-500">Integrasi resmi Meta untuk pesan berskala besar dan Centang Biru (Official Business Account).</p>
                  </div>
                </div>
                {hasConnectedWhatsApp && (
                  <Badge variant="success" className="text-[10px]">
                    <Check className="h-3 w-3 mr-1" /> Cloud API Active
                  </Badge>
                )}
              </div>

              {hasConnectedWhatsApp ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-slate-900">Akun Terhubung ({whatsappAccounts.length})</h4>
                    <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 overflow-hidden">
                      {whatsappAccounts.map((acc) => (
                        <div key={acc.id} className="flex items-center justify-between p-3.5 bg-slate-50/50">
                          <div>
                            <span className="font-bold text-xs text-slate-900">{acc.businessLabel}</span>
                            <div className="text-[10px] text-slate-500 font-medium">ID: {acc.phoneNumberId} • Phone: {acc.phoneNumber}</div>
                          </div>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => disconnectWhatsAppAccount(acc.phoneNumberId)}
                            className="text-xs text-red-600 hover:bg-red-50 hover:border-red-200"
                          >
                            <Unplug className="h-3.5 w-3.5 mr-1" /> Disconnect
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Button
                    onClick={() => void handleOAuthWhatsApp()}
                    disabled={isWaConnecting}
                    variant="primary"
                    size="sm"
                    className="gap-1.5"
                  >
                    {isWaConnecting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                    Tambah Akun WhatsApp Cloud API
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-4 text-xs leading-relaxed text-slate-700">
                    Gunakan <strong>WhatsApp Cloud API</strong> jika Anda memerlukan nomor resmi Meta, broadcast massal tanpa batas, dan integrasi API tingkat lanjut.
                  </div>

                  <Button
                    onClick={() => void handleOAuthWhatsApp()}
                    disabled={isWaConnecting}
                    variant="primary"
                    size="sm"
                    className="gap-2"
                  >
                    {isWaConnecting ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageCircle className="h-4 w-4" />}
                    Connect WhatsApp Cloud API via Meta
                  </Button>
                </div>
              )}
            </Card>
          </div>
        )}

        {/* ============================================== */}
        {/* INSTAGRAM TAB */}
        {/* ============================================== */}
        {activeChannel === "instagram" && (
          <Card className="p-6 border-slate-200 bg-white max-w-4xl shadow-2xs space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-purple-600 font-bold">
                  <Instagram className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">Instagram Messaging</h3>
                  <p className="text-xs text-slate-500">Kelola DM Instagram dan komentar postingan secara otomatis.</p>
                </div>
              </div>
              {hasConnectedInstagram && (
                <Badge variant="success" className="text-[10px]">
                  <Check className="h-3 w-3 mr-1" /> Connected
                </Badge>
              )}
            </div>

            {hasConnectedInstagram ? (
              <div className="space-y-4">
                <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 overflow-hidden">
                  {instagramAccounts.map((acc) => (
                    <div key={acc.id} className="flex items-center justify-between p-3.5 bg-slate-50/50">
                      <div>
                        <span className="font-bold text-xs text-slate-900">@{acc.username}</span>
                        <div className="text-[10px] text-slate-500 font-medium">Page: {acc.pageName} • ID: {acc.accountId}</div>
                      </div>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => disconnectInstagramAccount(acc.accountId)}
                        className="text-xs text-red-600 hover:bg-red-50 hover:border-red-200"
                      >
                        <Unplug className="h-3.5 w-3.5 mr-1" /> Disconnect
                      </Button>
                    </div>
                  ))}
                </div>

                <Button
                  onClick={() => void handleOAuthInstagram()}
                  disabled={isIgConnecting}
                  variant="primary"
                  size="sm"
                  className="gap-1.5"
                >
                  {isIgConnecting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                  Tambah Akun Instagram Business
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="rounded-xl border border-purple-200 bg-purple-50/50 p-4 text-xs leading-relaxed text-slate-700">
                  Hubungkan akun Instagram Business untuk membalas DM pelanggan dan otomatis mengonversi komentar menjadi obrolan.
                </div>

                <Button
                  onClick={() => void handleOAuthInstagram()}
                  disabled={isIgConnecting}
                  variant="primary"
                  size="sm"
                  className="gap-2"
                >
                  {isIgConnecting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Instagram className="h-4 w-4" />}
                  Connect Instagram Business via Meta
                </Button>
              </div>
            )}
          </Card>
        )}

        {/* ============================================== */}
        {/* WEB CHAT TAB */}
        {/* ============================================== */}
        {activeChannel === "webchat" && (
          <Card className="p-6 border-slate-200 bg-white max-w-4xl shadow-2xs space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 font-bold">
                  <Globe className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">Website Live Chat Widget</h3>
                  <p className="text-xs text-slate-500">Pasang widget live chat pintar di website Anda dalam hitungan detik.</p>
                </div>
              </div>
              <Badge variant={webchatEnabled ? "success" : "secondary"} className="text-[10px]">
                {webchatEnabled ? "Active" : "Disabled"}
              </Badge>
            </div>

            <form onSubmit={persistWebchat} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-900">Warna Utama Widget</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={widgetColor}
                      onChange={(e) => setWidgetColor(e.target.value)}
                      className="h-9 w-12 rounded-md border border-slate-200 bg-slate-50 p-1 cursor-pointer"
                    />
                    <Input value={widgetColor} onChange={(e) => setWidgetColor(e.target.value)} className="h-9 text-xs bg-slate-50 font-mono" />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-900">Pesan Menyapa Pertama</label>
                  <Input value={welcomeText} onChange={(e) => setWelcomeText(e.target.value)} className="h-9 text-xs bg-slate-50" />
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <label className="text-xs font-bold text-slate-900">Embed Code untuk Website</label>
                <Textarea value={embedCode} readOnly className="min-h-[120px] font-mono text-xs bg-slate-50 text-slate-800" />
                <Button type="button" onClick={handleCopyCode} variant="secondary" size="sm" className="gap-1.5">
                  {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                  {copied ? "Tersalin!" : "Salin Embed Code"}
                </Button>
              </div>

              <div className="flex items-center justify-between border-t border-slate-100 pt-4">
                {webchatSaved ? (
                  <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-600">
                    <Check className="h-4 w-4" /> Pengaturan Webchat Disimpan!
                  </span>
                ) : (
                  <div />
                )}
                <Button type="submit" variant="primary" size="sm">Simpan Widget Config</Button>
              </div>
            </form>
          </Card>
        )}

        {/* ============================================== */}
        {/* MOBILE CHAT SDK TAB */}
        {/* ============================================== */}
        {activeChannel === "mobilechat" && (
          <Card className="p-6 border-slate-200 bg-white max-w-4xl shadow-2xs space-y-4">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 font-bold">
                <Smartphone className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">Mobile App Chat SDK</h3>
                <p className="text-xs text-slate-500">Integrasikan obrolan AI langsung ke dalam aplikasi iOS & Android bisnis Anda.</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-900">Platform Framework</label>
                  <select
                    className="flex h-9 w-full rounded-md border border-slate-200 bg-slate-50 px-3 text-xs font-semibold text-slate-900 focus:outline-none focus:border-blue-600 font-medium"
                    value={mobilePlatform}
                    onChange={(e) => setMobilePlatform(e.target.value as any)}
                  >
                    <option value="react-native">React Native</option>
                    <option value="flutter">Flutter</option>
                    <option value="android">Android (Native Kotlin/Java)</option>
                    <option value="ios">iOS (Native Swift)</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-900">Warna Aksen SDK</label>
                  <Input value={mobileWidgetColor} onChange={(e) => setMobileWidgetColor(e.target.value)} className="h-9 text-xs bg-slate-50 font-mono" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-900">SDK Initialization Snippet</label>
                <Textarea value={`// Balesin Mobile SDK (${mobilePlatform})\nimport { BalesinSDK } from 'balesin-mobile-sdk';\n\nBalesinSDK.init({\n  workspaceId: "${config.workspace.name.toLowerCase().replace(/\s+/g, "-")}",\n  themeColor: "${mobileWidgetColor}",\n  welcomeMessage: "${mobileWelcomeText}"\n});`} readOnly className="min-h-[120px] font-mono text-xs bg-slate-50 text-slate-800" />
              </div>
            </div>
          </Card>
        )}

        {/* ============================================== */}
        {/* OTHER CHANNELS */}
        {/* ============================================== */}
        {["call", "qontak"].includes(activeChannel) && (
          <Card className="p-6 border-slate-200 bg-white max-w-4xl shadow-2xs space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
              {activeChannel === "call" ? "VoIP Cloud Call Center Integration" : "Qontak CRM Integration"}
            </h3>
            <p className="text-xs text-slate-500">
              {activeChannel === "call"
                ? "Integrasi saluran telepon suara cloud (SIP Trunk/Twilio) untuk merekam dan menangani panggilan pelanggan secara otomatis."
                : "Sinkronisasi data kontak dan tiket keluhan secara real-time dengan database Qontak CRM internal Anda."}
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}
