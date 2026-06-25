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

function getChannelKind(activeChannel: ActiveChannel): ChannelKind {
  switch (activeChannel) {
    case "whatsapp":
      return "WhatsApp";
    case "instagram":
      return "Instagram DM";
    case "webchat":
    case "mobilechat":
    default:
      return "Website Chat";
  }
}

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


  // Set default active tab to "mobilechat" as requested
  const [activeChannel, setActiveChannel] = useState<ActiveChannel>("mobilechat");
  const [origin, setOrigin] = useState("");
  const [copied, setCopied] = useState(false);
  const [webchatSaved, setWebchatSaved] = useState(false);
  const [waSaved, setWaSaved] = useState(false);
  const [igSaved, setIgSaved] = useState(false);

  // Advanced/manual section toggle
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
  const [waStatus, setWaStatus] = useState(config.channels.whatsapp.status);

  const [igUsername, setIgUsername] = useState(config.channels.instagram.username);
  const [igAccountId, setIgAccountId] = useState(config.channels.instagram.accountId);
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
  const [isCreatingMobileWidget, setIsCreatingMobileWidget] = useState(false);
  const [mobileWidgetName, setMobileWidgetName] = useState("Mobile App Widget Utama");
  const [mobilePlatform, setMobilePlatform] = useState<"react-native" | "flutter" | "android" | "ios">("react-native");
  const [mobileWidgetColor, setMobileWidgetColor] = useState("#00d2ff");
  const [mobileWelcomeText, setMobileWelcomeText] = useState("Halo Kak! Ada yang bisa kami bantu?");
  const [mobileWidgetSaved, setMobileWidgetSaved] = useState(false);
  const [mobileCopied, setMobileCopied] = useState(false);

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

  const mobileEmbedCode = useMemo(() => {
    const wsSlug = config?.workspace?.name?.toLowerCase()?.replace(/\s+/g, "-") || "johan-garage";
    switch (mobilePlatform) {
      case "react-native":
        return `// Balesin SDK Integration for React Native
import { BalesinChat } from 'balesin-mobile-sdk';

export default function App() {
  return (
    <BalesinChat 
      workspaceId="${wsSlug}"
      themeColor="${mobileWidgetColor}"
      welcomeMessage="${mobileWelcomeText}"
    />
  );
}`;
      case "flutter":
        return `// Balesin SDK Integration for Flutter
import 'package:balesin_sdk/balesin_sdk.dart';

class MyChatScreen extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return BalesinChatWidget(
      workspaceId: "${wsSlug}",
      themeColor: "${mobileWidgetColor}",
      welcomeMessage: "${mobileWelcomeText}",
    );
  }
}`;
      case "android":
        return `<!-- Balesin SDK Integration for Android (XML Layout) -->
<com.balesin.sdk.BalesinChatWidget
    android:id="@+id/balesin_chat_widget"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    app:workspace_id="${wsSlug}"
    app:widget_color="${mobileWidgetColor}"
    app:welcome_text="${mobileWelcomeText}" />`;
      case "ios":
        return `// Balesin SDK Integration for iOS (SwiftUI)
import BalesinSDK
import SwiftUI

struct ChatView: View {
    var body: some View {
        BalesinChatView(
            workspaceId: "${wsSlug}",
            themeColor: "${mobileWidgetColor}",
            welcomeMessage: "${mobileWelcomeText}"
        )
    }
}`;
    }
  }, [mobilePlatform, mobileWidgetColor, mobileWelcomeText, config]);

  const handleCopyCode = async () => {
    await navigator.clipboard.writeText(embedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyMobileCode = async () => {
    await navigator.clipboard.writeText(mobileEmbedCode);
    setMobileCopied(true);
    setTimeout(() => setMobileCopied(false), 2000);
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
    setPhoneId("");
    setAccessToken("");
    setVerifyToken("");
    patchConfig((current) => ({
      ...current,
      channels: {
        ...current.channels,
        whatsapp: {
          ...current.channels.whatsapp,
          enabled: false,
          status: "disconnected",
          phoneNumberId: "",
          accessToken: "",
          verifyToken: "",
          accounts: [],
        },
      },
    }));
  };

  const disconnectInstagram = () => {
    setIgStatus("draft");
    setIgAccountId("");
    setIgAccessToken("");
    setIgUsername("");
    patchConfig((current) => ({
      ...current,
      channels: {
        ...current.channels,
        instagram: {
          ...current.channels.instagram,
          enabled: false,
          status: "draft",
          accountId: "",
          accessToken: "",
          username: "",
          accounts: [],
        },
      },
    }));
  };

  // OAuth WhatsApp connect handler (Multi-Account)
  const handleOAuthWhatsApp = useCallback(async () => {
    const result = await connectWhatsApp();
    if (!result) {
      // Jika error karena HTTP (bukan HTTPS), buka panel manual otomatis
      // agar user bisa langsung memasukkan token secara manual
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
  }, [connectWhatsApp, patchConfig, oauthWaError, setWaAdvancedOpen]);

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

  // OAuth Instagram connect handler (Multi-Account)
  const handleOAuthInstagram = useCallback(async () => {
    const result = await connectInstagram();
    if (!result) {
      // Jika error karena HTTP (bukan HTTPS), buka panel manual otomatis
      if (oauthIgError?.toLowerCase().includes("https")) {
        setIgAdvancedOpen(true);
      }
      return;
    }

    const { accountId, accessToken: token, username, pageName } = result;
    if (!accountId || !token) return;

    patchConfig((current) => {
      const existingAccounts = current.channels.instagram.accounts ?? [];
      const alreadyExists = existingAccounts.some(acc => acc.accountId === accountId);
      let updatedAccounts = [...existingAccounts];

      const newAccount = {
        id: accountId,
        username: username || "instagram_user",
        accountId: accountId,
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

      const isFirst = existingAccounts.length === 0;

      return {
        ...current,
        channels: {
          ...current.channels,
          instagram: {
            ...current.channels.instagram,
            enabled: true,
            status: "connected" as const,
            username: isFirst ? newAccount.username : current.channels.instagram.username,
            accountId: isFirst ? newAccount.accountId : current.channels.instagram.accountId,
            accessToken: isFirst ? newAccount.accessToken : current.channels.instagram.accessToken,
            verifyToken: current.channels.instagram.verifyToken || "balesin_verify",
            accounts: updatedAccounts,
          }
        }
      };
    });
  }, [connectInstagram, patchConfig, oauthIgError, setIgAdvancedOpen]);

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
            accessToken: nextPrimary ? nextPrimary.accessToken : "",
            accounts: updatedAccounts,
          }
        }
      };
    });
  }, [patchConfig]);


  const persistInstagram = (event: FormEvent) => {
    event.preventDefault();
    const trimmedVerifyToken = igVerifyToken.trim();
    const nextStatus = igAccountId && igAccessToken ? "connected" : "draft";
    setIgStatus(nextStatus);
    setIgVerifyToken(trimmedVerifyToken);

    patchConfig((current) => ({
      ...current,
      channels: {
        ...current.channels,
        instagram: {
          ...current.channels.instagram,
          enabled: nextStatus === "connected",
          status: nextStatus,
          username: igUsername.trim(),
          accountId: igAccountId.trim(),
          accessToken: igAccessToken.trim(),
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

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div>
        <h1 className="flex items-center gap-2.5 text-2xl font-bold text-white">
          <Wifi className="h-6 w-6 text-cyan-400" />
          Integrations & Channels
        </h1>
        <p className="mt-1 text-xs text-slate-400">
          Kelola seluruh channel sosial media, widget chat khusus, sistem internal, dan integrasi CRM omnichannel Anda.
        </p>
      </div>

      {/* Main Container Layout */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4 items-start">
        {/* Left Sidebar List of Channels */}
        <div className="space-y-6 lg:col-span-1">
          {/* Category 1: Saluran Pesan & Media Sosial */}
          <div className="space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block px-2.5">
              Saluran Pesan & Media Sosial
            </span>
            <div className="space-y-1 bg-white/[0.01] border border-white/6 rounded-xl p-1.5">
              {/* WhatsApp */}
              <button
                onClick={() => {
                  setActiveChannel("whatsapp");
                  setIsCreatingMobileWidget(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left text-xs font-semibold transition ${
                  activeChannel === "whatsapp"
                    ? "bg-cyan-950/40 border border-cyan-400/20 text-cyan-300"
                    : "border border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/[0.02]"
                }`}
              >
                <div className="flex items-center gap-2">
                  <MessageCircle className="h-4 w-4 text-emerald-400" />
                  <span>WhatsApp</span>
                </div>
                <Badge className={`text-[9px] px-1.5 py-0 border ${
                  config.channels.whatsapp.status === "connected"
                    ? "border-emerald-400/20 bg-emerald-950/40 text-emerald-300"
                    : "border-white/10 bg-white/4 text-slate-400"
                }`}>
                  {config.channels.whatsapp.status === "connected" ? "Connected" : "Draft"}
                </Badge>
              </button>

              {/* Facebook Messenger */}
              <button
                onClick={() => {
                  setActiveChannel("facebook");
                  setIsCreatingMobileWidget(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left text-xs font-semibold transition ${
                  activeChannel === "facebook"
                    ? "bg-cyan-950/40 border border-cyan-400/20 text-cyan-300"
                    : "border border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/[0.02]"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Facebook className="h-4 w-4 text-blue-400" />
                  <span>Facebook</span>
                </div>
                <Badge className="border-white/8 bg-white/4 text-slate-500 text-[8px] px-1.5 py-0">
                  Roadmap
                </Badge>
              </button>

              {/* Instagram */}
              <button
                onClick={() => {
                  setActiveChannel("instagram");
                  setIsCreatingMobileWidget(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left text-xs font-semibold transition ${
                  activeChannel === "instagram"
                    ? "bg-cyan-950/40 border border-cyan-400/20 text-cyan-300"
                    : "border border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/[0.02]"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Instagram className="h-4 w-4 text-fuchsia-400" />
                  <span>Instagram</span>
                </div>
                <Badge className={`text-[9px] px-1.5 py-0 border ${
                  config.channels.instagram.status === "connected"
                    ? "border-fuchsia-400/20 bg-fuchsia-950/40 text-fuchsia-300"
                    : "border-white/10 bg-white/4 text-slate-400"
                }`}>
                  {config.channels.instagram.status === "connected" ? "Connected" : "Draft"}
                </Badge>
              </button>

              {/* Telegram */}
              <button
                onClick={() => {
                  setActiveChannel("telegram");
                  setIsCreatingMobileWidget(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left text-xs font-semibold transition ${
                  activeChannel === "telegram"
                    ? "bg-cyan-950/40 border border-cyan-400/20 text-cyan-300"
                    : "border border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/[0.02]"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Send className="h-4 w-4 text-cyan-400" />
                  <span>Telegram</span>
                </div>
                <Badge className="border-white/8 bg-white/4 text-slate-500 text-[8px] px-1.5 py-0">
                  Roadmap
                </Badge>
              </button>

              {/* X (Twitter) */}
              <button
                onClick={() => {
                  setActiveChannel("x");
                  setIsCreatingMobileWidget(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left text-xs font-semibold transition ${
                  activeChannel === "x"
                    ? "bg-cyan-950/40 border border-cyan-400/20 text-cyan-300"
                    : "border border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/[0.02]"
                }`}
              >
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-slate-300" />
                  <span>X (Twitter)</span>
                </div>
                <Badge className="border-white/8 bg-white/4 text-slate-500 text-[8px] px-1.5 py-0">
                  Roadmap
                </Badge>
              </button>

              {/* Line Messenger */}
              <button
                onClick={() => {
                  setActiveChannel("line");
                  setIsCreatingMobileWidget(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left text-xs font-semibold transition ${
                  activeChannel === "line"
                    ? "bg-cyan-950/40 border border-cyan-400/20 text-cyan-300"
                    : "border border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/[0.02]"
                }`}
              >
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-green-400" />
                  <span>Line Messenger</span>
                </div>
                <Badge className="border-white/8 bg-white/4 text-slate-500 text-[8px] px-1.5 py-0">
                  Roadmap
                </Badge>
              </button>
            </div>
          </div>

          {/* Category 2: Widget Khusus */}
          <div className="space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block px-2.5">
              Widget Khusus
            </span>
            <div className="space-y-1 bg-white/[0.01] border border-white/6 rounded-xl p-1.5">
              {/* Mobile Chat */}
              <button
                onClick={() => {
                  setActiveChannel("mobilechat");
                  setIsCreatingMobileWidget(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left text-xs font-semibold transition ${
                  activeChannel === "mobilechat"
                    ? "bg-cyan-950/40 border border-cyan-400/20 text-cyan-300"
                    : "border border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/[0.02]"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Smartphone className="h-4 w-4 text-cyan-400" />
                  <span>Mobile chat</span>
                </div>
                <Badge className="border-cyan-400/25 bg-cyan-950/30 text-cyan-300 text-[9px] px-1.5 py-0">
                  Active
                </Badge>
              </button>

              {/* Web Chat */}
              <button
                onClick={() => {
                  setActiveChannel("webchat");
                  setIsCreatingMobileWidget(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left text-xs font-semibold transition ${
                  activeChannel === "webchat"
                    ? "bg-cyan-950/40 border border-cyan-400/20 text-cyan-300"
                    : "border border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/[0.02]"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-cyan-300" />
                  <span>Web chat</span>
                </div>
                <Badge className={`text-[9px] px-1.5 py-0 border ${
                  config.channels.webchat.enabled
                    ? "border-cyan-400/20 bg-cyan-950/40 text-cyan-300"
                    : "border-white/10 bg-white/4 text-slate-400"
                }`}>
                  {config.channels.webchat.enabled ? "Connected" : "Draft"}
                </Badge>
              </button>
            </div>
          </div>

          {/* Category 3: Ekspansi Baru (NEW) */}
          <div className="space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5 px-2.5">
              Ekspansi Baru
              <Badge className="bg-cyan-500 text-slate-950 text-[8px] font-extrabold px-1 py-0.5 rounded">NEW</Badge>
            </span>
            <div className="space-y-1 bg-white/[0.01] border border-white/6 rounded-xl p-1.5">
              {/* Call */}
              <button
                onClick={() => {
                  setActiveChannel("call");
                  setIsCreatingMobileWidget(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left text-xs font-semibold transition ${
                  activeChannel === "call"
                    ? "bg-cyan-950/40 border border-cyan-400/20 text-cyan-300"
                    : "border border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/[0.02]"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-amber-400" />
                  <span>Call (Telepon)</span>
                </div>
                <Badge className="border-white/8 bg-white/4 text-slate-500 text-[8px] px-1.5 py-0">
                  Roadmap
                </Badge>
              </button>

              {/* E-commerce */}
              <button
                onClick={() => {
                  setActiveChannel("ecommerce");
                  setIsCreatingMobileWidget(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left text-xs font-semibold transition ${
                  activeChannel === "ecommerce"
                    ? "bg-cyan-950/40 border border-cyan-400/20 text-cyan-300"
                    : "border border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/[0.02]"
                }`}
              >
                <div className="flex items-center gap-2">
                  <ShoppingCart className="h-4 w-4 text-fuchsia-400" />
                  <span>E-commerce</span>
                </div>
                <Badge className="border-white/8 bg-white/4 text-slate-500 text-[8px] px-1.5 py-0">
                  Roadmap
                </Badge>
              </button>

              {/* Email */}
              <button
                onClick={() => {
                  setActiveChannel("email");
                  setIsCreatingMobileWidget(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left text-xs font-semibold transition ${
                  activeChannel === "email"
                    ? "bg-cyan-950/40 border border-cyan-400/20 text-cyan-300"
                    : "border border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/[0.02]"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-cyan-400" />
                  <span>Email</span>
                </div>
                <Badge className="border-white/8 bg-white/4 text-slate-500 text-[8px] px-1.5 py-0">
                  Roadmap
                </Badge>
              </button>
            </div>
          </div>

          {/* Category 4: Sistem Internal */}
          <div className="space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block px-2.5">
              Sistem Internal
            </span>
            <div className="space-y-1 bg-white/[0.01] border border-white/6 rounded-xl p-1.5">
              {/* Qontak CRM */}
              <button
                onClick={() => {
                  setActiveChannel("qontak");
                  setIsCreatingMobileWidget(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left text-xs font-semibold transition ${
                  activeChannel === "qontak"
                    ? "bg-cyan-950/40 border border-cyan-400/20 text-cyan-300"
                    : "border border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/[0.02]"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Link2 className="h-4 w-4 text-emerald-400" />
                  <span>Qontak CRM Sync</span>
                </div>
                <Badge className="border-emerald-500/20 bg-emerald-950/30 text-emerald-400 text-[9px] px-1.5 py-0 font-bold">
                  Active 2-Way
                </Badge>
              </button>
            </div>
          </div>
        </div>

        {/* Right Content Panel - Area Kerja Utama */}
        <div className="lg:col-span-3 space-y-6">
          {/* ============================================== */}
          {/* ACTIVE TAB: MOBILE CHAT */}
          {/* ============================================== */}
          {activeChannel === "mobilechat" && (
            <div className="space-y-6">
              {/* Mobile Chat Workspace Header */}
              <div className="flex items-center justify-between border-b border-white/8 pb-4">
                <div>
                  <h2 className="text-sm font-bold uppercase tracking-wider text-white flex items-center gap-2">
                    <Smartphone className="h-4.5 w-4.5 text-cyan-400" />
                    Mobile Chat widget (Active)
                  </h2>
                  <p className="text-[11px] text-slate-400 mt-1">Konfigurasikan SDK chat Balesin langsung di aplikasi Android/iOS Anda.</p>
                </div>
                {!isCreatingMobileWidget && (
                  <Button onClick={() => setIsCreatingMobileWidget(true)} className="bg-cyan-500 text-slate-950 hover:bg-cyan-400 text-xs px-4 h-9">
                    <Plus className="mr-1.5 h-4 w-4" />
                    Create chat widget
                  </Button>
                )}
              </div>

              {/* Main Content Form / Canvas */}
              {!isCreatingMobileWidget ? (
                <div className="space-y-6">
                  {/* Center Information Canvas */}
                  <div className="flex flex-col items-center justify-center text-center p-8 rounded-2xl border border-white/6 bg-white/[0.01] min-h-[250px] relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-b from-cyan-950/5 to-transparent pointer-events-none" />
                    <div className="h-14 w-14 rounded-2xl bg-cyan-950/50 border border-cyan-400/25 flex items-center justify-center text-cyan-400 mb-4 animate-pulse">
                      <Smartphone className="h-7 w-7" />
                    </div>
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-2">Mobile Chat Widget Canvas</h3>
                    <p className="text-xs text-slate-400 max-w-lg leading-relaxed mb-6">
                      Fitur ini digunakan untuk membuat modul obrolan khusus yang nantinya ditanamkan ke dalam aplikasi mobile milik bisnis Anda.
                    </p>
                    <Button onClick={() => setIsCreatingMobileWidget(true)} className="bg-cyan-500 text-slate-950 hover:bg-cyan-400 px-6">
                      <PlusCircle className="mr-1.5 h-4.5 w-4.5" />
                      Create chat widget
                    </Button>
                  </div>

                  {/* Step-by-Step Procedure */}
                  <Card className="glass-panel p-6 border-white/6">
                    <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                      <Settings className="h-4 w-4 text-cyan-400" />
                      Prosedur Umum Pembuatan & Penautan Widget
                    </h4>
                    <div className="space-y-4">
                      <p className="text-xs text-slate-400 leading-normal">
                        Berikut adalah prosedur umum untuk membuat dan menautkan widget obrolan pada aplikasi mobile bisnis Anda:
                      </p>
                      <div className="relative border-l border-white/8 pl-6 ml-2.5 space-y-5 text-xs text-slate-300">
                        {/* Step 1 */}
                        <div className="relative">
                          <span className="absolute -left-[31px] top-0.5 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-[#050814] border border-cyan-400/30 text-[9px] font-extrabold text-cyan-400">
                            1
                          </span>
                          <p className="font-semibold text-white">Buka sub-menu Mobile chat di dalam menu Integrations.</p>
                          <p className="text-[10px] text-slate-500 mt-0.5">Akses panel konfigurasi mobile chat yang saat ini sedang aktif di layar Anda.</p>
                        </div>
                        {/* Step 2 */}
                        <div className="relative">
                          <span className="absolute -left-[31px] top-0.5 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-[#050814] border border-cyan-400/30 text-[9px] font-extrabold text-cyan-400">
                            2
                          </span>
                          <p className="font-semibold text-white">Klik tombol biru Create chat widget yang berada di sudut kanan atas layar.</p>
                          <p className="text-[10px] text-slate-500 mt-0.5">Tombol ini memicu form/wizard pembuatan widget baru untuk aplikasi Anda.</p>
                        </div>
                        {/* Step 3 */}
                        <div className="relative">
                          <span className="absolute -left-[31px] top-0.5 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-[#050814] border border-cyan-400/30 text-[9px] font-extrabold text-cyan-400">
                            3
                          </span>
                          <p className="font-semibold text-white">Konfigurasikan detail dan preferensi tampilan widget sesuai instruksi sistem.</p>
                          <p className="text-[10px] text-slate-500 mt-0.5">Pilih platform SDK, kustomisasi nama widget, warna tombol utama, serta pesan sapaan bot.</p>
                        </div>
                        {/* Step 4 */}
                        <div className="relative">
                          <span className="absolute -left-[31px] top-0.5 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-[#050814] border border-cyan-400/30 text-[9px] font-extrabold text-cyan-400">
                            4
                          </span>
                          <p className="font-semibold text-white">Salin kode (atau script) yang dihasilkan oleh sistem.</p>
                          <p className="text-[10px] text-slate-500 mt-0.5">Kode integrasi unik akan secara otomatis tergenerasi sesuai preferensi yang Anda tentukan.</p>
                        </div>
                        {/* Step 5 */}
                        <div className="relative">
                          <span className="absolute -left-[31px] top-0.5 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-[#050814] border border-cyan-400/30 text-[9px] font-extrabold text-cyan-400">
                            5
                          </span>
                          <p className="font-semibold text-white">Tanamkan (embed) kode tersebut ke dalam source code aplikasi mobile Anda.</p>
                          <p className="text-[10px] text-slate-500 mt-0.5">Hal ini dilakukan agar setiap pesan masuk dari aplikasi secara otomatis diteruskan (routing) ke Inbox Omnichannel Balesin AI.</p>
                        </div>
                      </div>
                    </div>
                  </Card>
                </div>
              ) : (
                /* Interactive Creation Wizard */
                <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
                  <div className="glass-panel space-y-4 rounded-xl p-5 lg:col-span-2">
                    <h3 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-cyan-400">
                      <Smartphone className="h-4 w-4" />
                      Configure Mobile Widget
                    </h3>

                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-300">Nama Widget</label>
                        <Input
                          value={mobileWidgetName}
                          onChange={(e) => setMobileWidgetName(e.target.value)}
                          className="h-10 text-xs"
                        />
                      </div>

                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-slate-300">Warna Tombol Utama</label>
                          <div className="flex gap-2">
                            <Input
                              type="color"
                              value={mobileWidgetColor}
                              onChange={(e) => setMobileWidgetColor(e.target.value)}
                              className="h-10 w-12 rounded-lg border-0 bg-transparent p-0"
                            />
                            <Input
                              type="text"
                              value={mobileWidgetColor}
                              onChange={(e) => setMobileWidgetColor(e.target.value)}
                              className="h-10 flex-1 text-xs"
                            />
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-slate-300">SDK Target Platform</label>
                          <select
                            value={mobilePlatform}
                            onChange={(e) => setMobilePlatform(e.target.value as any)}
                            className="flex h-10 w-full rounded-md border border-white/10 bg-[#0a0e1c] px-3 py-2 text-xs text-white outline-none focus:border-cyan-400"
                          >
                            <option value="react-native">React Native</option>
                            <option value="flutter">Flutter</option>
                            <option value="android">Android (Kotlin / XML)</option>
                            <option value="ios">iOS (SwiftUI)</option>
                          </select>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-300">Welcome greeting message</label>
                        <Textarea
                          value={mobileWelcomeText}
                          onChange={(e) => setMobileWelcomeText(e.target.value)}
                          rows={3}
                          className="text-xs"
                        />
                      </div>

                      <div className="flex items-center justify-between border-t border-white/8 pt-4">
                        {mobileWidgetSaved ? (
                          <span className="text-xs font-bold text-emerald-400">
                            Widget mobile berhasil disimpan.
                          </span>
                        ) : (
                          <button
                            onClick={() => setIsCreatingMobileWidget(false)}
                            className="text-xs font-semibold text-slate-400 hover:text-white transition"
                          >
                            Batal
                          </button>
                        )}
                        <Button onClick={() => {
                          setMobileWidgetSaved(true);
                          setTimeout(() => {
                            setMobileWidgetSaved(false);
                            setIsCreatingMobileWidget(false);
                          }, 2500);
                        }}>
                          Simpan & Hubungkan
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Embed Code output panel */}
                  <div className="space-y-6">
                    <div className="glass-panel space-y-4 rounded-xl p-5">
                      <div className="flex items-center justify-between">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-400">
                          Embed SDK Script
                        </h3>
                        <button
                          onClick={() => void handleCopyMobileCode()}
                          type="button"
                          className="flex items-center gap-1.5 text-xs font-semibold text-cyan-400 transition hover:text-cyan-300"
                        >
                          {mobileCopied ? (
                            <>
                              <Check className="h-4 w-4" /> Disalin
                            </>
                          ) : (
                            <>
                              <Copy className="h-4 w-4" /> Salin script
                            </>
                          )}
                        </button>
                      </div>
                      <pre className="custom-scrollbar overflow-x-auto whitespace-pre-wrap rounded-lg border border-white/8 bg-[#020611] p-4 font-mono text-[9px] leading-relaxed text-slate-300">
                        {mobileEmbedCode}
                      </pre>
                    </div>

                    <div className="rounded-xl border border-white/8 bg-white/[0.02] p-4 text-[10px] text-slate-400 space-y-2 leading-relaxed">
                      <h4 className="font-bold text-slate-200 uppercase tracking-wider">Langkah Integrasi SDK:</h4>
                      <ol className="list-decimal pl-4 space-y-1.5">
                        <li>Install paket SDK balesin sesuai platform target.</li>
                        <li>Salin script di atas dan tanamkan ke bagian routing/inbox chat aplikasi.</li>
                        <li>Pesan masuk dari pelanggan Anda akan langsung diarahkan ke inbox dashboard.</li>
                      </ol>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ============================================== */}
          {/* ACTIVE TAB: WEBSITE LIVE CHAT */}
          {/* ============================================== */}
          {activeChannel === "webchat" && (
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
                  <pre className="custom-scrollbar overflow-x-auto whitespace-pre-wrap rounded-lg border border-white/8 bg-[#020611] p-4 font-mono text-[9px] leading-relaxed text-slate-300">
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
          )}

          {/* ============================================== */}
          {/* ACTIVE TAB: WHATSAPP */}
          {/* ============================================== */}
          {activeChannel === "whatsapp" && (
            <div className="space-y-4 max-w-3xl">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-white/8 pb-3">
                <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-400">
                  <MessageCircle className="h-5 w-5" />
                  WhatsApp Business
                </h3>
                {hasConnectedWhatsApp && (
                  <Button
                    type="button"
                    onClick={() => void handleOAuthWhatsApp()}
                    disabled={isWaConnecting}
                    className="h-8 text-[11px] font-bold bg-[#1877f2] hover:bg-[#1565d8] text-white flex items-center gap-1.5 px-3 py-1 rounded-lg transition-all"
                  >
                    {isWaConnecting ? (
                      <Loader2 className="h-3 animate-spin" />
                    ) : (
                      <Plus className="h-3.5 w-3.5" />
                    )}
                    Tambah Akun
                  </Button>
                )}
              </div>

              {/* === CONNECTED STATE === */}
              {hasConnectedWhatsApp ? (
                <div className="space-y-4">
                  {/* Status Table */}
                  <div className="rounded-xl border border-white/8 bg-white/[0.01] overflow-hidden">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-white/8 bg-white/[0.02] text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                          <th className="p-4">Whatsapp name</th>
                          <th className="p-4">Phone number</th>
                          <th className="p-4">Status</th>
                          <th className="p-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/6">
                        {whatsappAccounts.map((acc) => (
                          <tr key={acc.phoneNumberId} className="hover:bg-white/[0.01] transition-colors">
                            <td className="p-4 font-bold text-white flex items-center gap-2">
                              <div className="h-6 w-6 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                                <MessageCircle className="h-3.5 w-3.5 text-emerald-400" />
                              </div>
                              {acc.businessLabel}
                            </td>
                            <td className="p-4 text-slate-300 font-mono">{acc.phoneNumber}</td>
                            <td className="p-4">
                              <Badge className="border-emerald-400/20 bg-emerald-950/30 text-emerald-300 text-[9px] font-bold px-2 py-0.5">
                                Connected
                              </Badge>
                            </td>
                            <td className="p-4 text-right">
                              <Button
                                type="button"
                                variant="secondary"
                                className="text-[10px] px-2 h-7 border-red-500/20 text-red-400 hover:bg-red-950/20"
                                onClick={() => disconnectWhatsAppAccount(acc.phoneNumberId)}
                              >
                                <Unplug className="h-3 w-3 mr-1" />
                                Disconnect
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Auto reply toggle */}
                  <label className="flex items-center gap-3 rounded-lg border border-white/8 bg-white/[0.02] p-3 text-xs text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={waAutoReply}
                      onChange={(e) => {
                        setWaAutoReply(e.target.checked);
                        patchConfig((c) => ({
                          ...c,
                          channels: { ...c.channels, whatsapp: { ...c.channels.whatsapp, autoReply: e.target.checked } },
                        }));
                      }}
                      className="h-4 w-4 rounded border-white/12 bg-white/4 text-cyan-500"
                    />
                    Aktifkan auto reply WhatsApp menggunakan AI Agent untuk semua akun terhubung
                  </label>

                  {/* Collapsible Advanced */}
                  <button
                    type="button"
                    onClick={() => setWaAdvancedOpen((v) => !v)}
                    className="flex items-center gap-2 text-[11px] font-semibold text-slate-500 hover:text-slate-300 transition w-full text-left"
                  >
                    <ChevronDown className={`h-3.5 w-3.5 transition-transform ${waAdvancedOpen ? "rotate-180" : ""}`} />
                    Konfigurasi Manual / Advanced (Akun Utama)
                  </button>

                  {waAdvancedOpen && (
                    <form onSubmit={persistWhatsApp} className="rounded-xl border border-white/8 bg-white/[0.02] p-5 space-y-4">
                      <p className="text-[10px] text-slate-500">Gunakan ini jika ingin override token atau Phone Number ID secara manual.</p>
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-slate-300">Label nomor bisnis</label>
                          <Input value={waLabel} onChange={(e) => setWaLabel(e.target.value)} className="h-10 text-xs" />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-slate-300">Phone Number ID</label>
                          <Input value={phoneId} onChange={(e) => setPhoneId(e.target.value)} className="h-10 text-xs" />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-300">Permanent access token</label>
                        <Input type="password" value={accessToken} onChange={(e) => setAccessToken(e.target.value)} className="h-10 text-xs" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-300">Verify token</label>
                        <Input value={verifyToken} onChange={(e) => setVerifyToken(e.target.value)} className="h-10 text-xs" />
                      </div>
                      <div className="rounded-lg border border-white/8 bg-white/4 p-3 text-[11px] text-slate-400">
                        <span className="block text-[10px] font-semibold uppercase text-slate-500 mb-1">Callback URL</span>
                        <code className="font-mono text-cyan-300">{whatsappWebhookUrl}</code>
                      </div>
                      {waSaved && (
                        <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-3 text-xs text-emerald-300">
                          Konfigurasi tersimpan.
                        </div>
                      )}
                      <div className="flex justify-end">
                        <Button type="submit" className="px-5 text-xs h-9">Simpan Manual</Button>
                      </div>
                    </form>
                  )}
                </div>
              ) : (
                /* === NOT CONNECTED STATE === */
                <div className="space-y-5">
                  {/* OAuth Connect Card */}
                  <div className="rounded-xl border border-white/10 bg-[#04091a] p-6 space-y-5">
                    {/* Icon + title */}
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-2xl bg-emerald-950/50 border border-emerald-500/25 flex items-center justify-center">
                        <MessageCircle className="h-6 w-6 text-emerald-400" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white">Connect WhatsApp Business</h4>
                        <p className="text-xs text-slate-400 mt-0.5">Hubungkan nomor WA Anda lewat Facebook — tidak perlu copy-paste token manual.</p>
                      </div>
                    </div>

                    {/* Flow steps */}
                    <div className="rounded-xl border border-emerald-500/10 bg-emerald-950/10 p-4">
                      <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                        <Zap className="h-3 w-3" /> Flow OAuth (1 klik)
                      </p>
                      <ol className="space-y-2">
                        {[
                          "Login ke akun Facebook Business",
                          "Pilih Business Portfolio",
                          "Buat atau pilih WABA (WhatsApp Business Account)",
                          "Verifikasi nomor telepon",
                          "Sistem menyimpan Phone Number ID otomatis ✓",
                        ].map((step, i) => (
                          <li key={i} className="flex items-start gap-2.5 text-[11px] text-slate-300">
                            <span className="flex-shrink-0 h-4 w-4 rounded-full bg-emerald-950/60 border border-emerald-500/30 flex items-center justify-center text-[8px] font-extrabold text-emerald-400">
                              {i + 1}
                            </span>
                            {step}
                          </li>
                        ))}
                      </ol>
                    </div>

                    {/* Error */}
                    {oauthWaError && (
                      oauthWaError.toLowerCase().includes("https") ? (
                        <div className="rounded-lg border border-amber-500/20 bg-amber-950/20 p-3 text-xs text-amber-300 flex items-start gap-2">
                          <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5 text-amber-400" />
                          <div>
                            <p className="font-semibold mb-1">Fitur OAuth membutuhkan HTTPS</p>
                            <p className="text-amber-400/80">{oauthWaError}</p>
                            <button
                              type="button"
                              onClick={() => setWaAdvancedOpen(true)}
                              className="mt-2 text-amber-300 underline underline-offset-2 hover:text-amber-200 transition"
                            >
                              → Buka Setup Manual untuk input token langsung
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="rounded-lg border border-red-500/20 bg-red-950/20 p-3 text-xs text-red-300 flex items-start gap-2">
                          <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                          {oauthWaError}
                        </div>
                      )
                    )}

                    {/* Main connect button */}
                    <Button
                      type="button"
                      onClick={() => void handleOAuthWhatsApp()}
                      disabled={isWaConnecting}
                      className="w-full h-11 bg-[#1877f2] hover:bg-[#1565d8] text-white font-bold text-sm gap-2.5 transition-all"
                    >
                      {isWaConnecting ? (
                        <><Loader2 className="h-4 w-4 animate-spin" /> Menghubungkan...</>
                      ) : (
                        <><Facebook className="h-4.5 w-4.5" /> Connect via Facebook</>
                      )}
                    </Button>
                  </div>

                  {/* ── Divider manual ── */}
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-px bg-white/8" />
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">atau isi manual</span>
                    <div className="flex-1 h-px bg-white/8" />
                  </div>

                  {/* ── Form Manual WhatsApp ── */}
                  <form onSubmit={persistWhatsApp} className="rounded-xl border border-white/8 bg-white/[0.02] p-5 space-y-4">
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Jika Anda sudah punya token dari Meta Developer Console, isi langsung di bawah ini.
                    </p>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-300">Label nomor bisnis</label>
                        <Input value={waLabel} onChange={(e) => setWaLabel(e.target.value)} className="h-10 text-xs" placeholder="Contoh: Johan Garage WA" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-300">Phone Number ID</label>
                        <Input value={phoneId} onChange={(e) => setPhoneId(e.target.value)} className="h-10 text-xs" placeholder="Dari Meta Developer" />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-300">Permanent access token</label>
                      <Input type="password" value={accessToken} onChange={(e) => setAccessToken(e.target.value)} className="h-10 text-xs" placeholder="EAABwzLixnjY..." />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-300">Verify token</label>
                      <Input value={verifyToken} onChange={(e) => setVerifyToken(e.target.value)} className="h-10 text-xs" placeholder="Contoh: balesin_verify" />
                    </div>
                    <div className="rounded-lg border border-white/8 bg-[#020611] p-3 text-[10px] text-slate-400 space-y-1">
                      <span className="block font-semibold text-slate-400 uppercase tracking-wider">Webhook Callback URL</span>
                      <code className="block font-mono text-cyan-300 break-all">{whatsappWebhookUrl}</code>
                    </div>
                    {waSaved && (
                      <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-3 text-xs text-emerald-300">
                        ✓ Konfigurasi WhatsApp tersimpan.
                      </div>
                    )}
                    <div className="flex justify-end">
                      <Button type="submit" className="px-6 text-xs h-9 bg-emerald-600 hover:bg-emerald-500">Simpan & Hubungkan</Button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          )}

          {/* ============================================== */}
          {/* ACTIVE TAB: INSTAGRAM */}
          {/* ============================================== */}
          {activeChannel === "instagram" && (
            <div className="space-y-4 max-w-3xl">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-white/8 pb-3">
                <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-fuchsia-400">
                  <Instagram className="h-5 w-5" />
                  Instagram DM & Comment Automation
                </h3>
                {hasConnectedInstagram && (
                  <Button
                    type="button"
                    onClick={() => void handleOAuthInstagram()}
                    disabled={isIgConnecting}
                    className="h-8 text-[11px] font-bold bg-gradient-to-r from-fuchsia-600 to-purple-600 hover:from-fuchsia-500 hover:to-purple-500 text-white flex items-center gap-1.5 px-3 py-1 rounded-lg transition-all"
                  >
                    {isIgConnecting ? (
                      <Loader2 className="h-3 animate-spin" />
                    ) : (
                      <Plus className="h-3.5 w-3.5" />
                    )}
                    Tambah Akun
                  </Button>
                )}
              </div>

              {/* === CONNECTED STATE === */}
              {hasConnectedInstagram ? (
                <div className="space-y-4">
                  {/* Status Table */}
                  <div className="rounded-xl border border-white/8 bg-white/[0.01] overflow-hidden">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-white/8 bg-white/[0.02] text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                          <th className="p-4">Instagram name</th>
                          <th className="p-4">Username</th>
                          <th className="p-4">Status</th>
                          <th className="p-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/6">
                        {instagramAccounts.map((acc) => (
                          <tr key={acc.accountId} className="hover:bg-white/[0.01] transition-colors">
                            <td className="p-4 font-bold text-white flex items-center gap-2">
                              <div className="h-6 w-6 rounded-full bg-fuchsia-500/10 border border-fuchsia-500/20 flex items-center justify-center">
                                <Instagram className="h-3.5 w-3.5 text-fuchsia-400" />
                              </div>
                              {acc.pageName || "Instagram Business"}
                            </td>
                            <td className="p-4 text-slate-300 font-mono">@{acc.username}</td>
                            <td className="p-4">
                              <Badge className="border-fuchsia-400/20 bg-fuchsia-950/30 text-fuchsia-300 text-[9px] font-bold px-2 py-0.5">
                                Connected
                              </Badge>
                            </td>
                            <td className="p-4 text-right">
                              <Button
                                type="button"
                                variant="secondary"
                                className="text-[10px] px-2 h-7 border-red-500/20 text-red-400 hover:bg-red-950/20"
                                onClick={() => disconnectInstagramAccount(acc.accountId)}
                              >
                                <Unplug className="h-3 w-3 mr-1" />
                                Disconnect
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Toggles */}
                  <div className="grid grid-cols-1 gap-2">
                    {[
                      { label: "Auto reply DM Instagram untuk semua akun terhubung", value: igAutoReplyDm, set: setIgAutoReplyDm },
                      { label: "Comment guard (spam, judol, kata kasar)", value: igCommentGuard, set: setIgCommentGuard },
                      { label: "Arahkan komentar berkualitas ke DM (sales)", value: igCommentToDm, set: setIgCommentToDm },
                    ].map(({ label, value, set }) => (
                      <label key={label} className="flex items-center gap-3 rounded-lg border border-white/8 bg-white/[0.02] p-3 text-xs text-slate-300 cursor-pointer">
                        <input type="checkbox" checked={value} onChange={(e) => {
                          set(e.target.checked);
                          patchConfig((c) => ({
                            ...c,
                            channels: {
                              ...c.channels,
                              instagram: {
                                ...c.channels.instagram,
                                autoReplyDm: label.startsWith("Auto reply") ? e.target.checked : igAutoReplyDm,
                                commentGuard: label.startsWith("Comment guard") ? e.target.checked : igCommentGuard,
                                commentToDm: label.startsWith("Arahkan komentar") ? e.target.checked : igCommentToDm,
                              }
                            }
                          }));
                        }} className="h-4 w-4 rounded border-white/12 bg-white/4 text-fuchsia-500" />
                        {label}
                      </label>
                    ))}
                  </div>

                  {/* Collapsible Advanced */}
                  <button
                    type="button"
                    onClick={() => setIgAdvancedOpen((v) => !v)}
                    className="flex items-center gap-2 text-[11px] font-semibold text-slate-500 hover:text-slate-300 transition w-full text-left"
                  >
                    <ChevronDown className={`h-3.5 w-3.5 transition-transform ${igAdvancedOpen ? "rotate-180" : ""}`} />
                    Konfigurasi Manual / Advanced (Akun Utama)
                  </button>

                  {igAdvancedOpen && (
                    <form onSubmit={persistInstagram} className="rounded-xl border border-white/8 bg-white/[0.02] p-5 space-y-4">
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-slate-300">Username Instagram</label>
                          <Input value={igUsername} onChange={(e) => setIgUsername(e.target.value)} className="h-10 text-xs" />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-slate-300">Instagram Account ID</label>
                          <Input value={igAccountId} onChange={(e) => setIgAccountId(e.target.value)} className="h-10 text-xs" />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-slate-300">Meta access token</label>
                          <Input type="password" value={igAccessToken} onChange={(e) => setIgAccessToken(e.target.value)} className="h-10 text-xs" />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-slate-300">Verify token</label>
                          <Input value={igVerifyToken} onChange={(e) => setIgVerifyToken(e.target.value)} className="h-10 text-xs" placeholder="Contoh: balesin_verify" />
                        </div>
                      </div>
                      <div className="rounded-lg border border-white/8 bg-white/4 p-3 text-[11px] text-slate-400">
                        <span className="block text-[10px] font-semibold uppercase text-slate-500 mb-1">Callback URL</span>
                        <code className="font-mono text-cyan-300">{instagramWebhookUrl}</code>
                      </div>
                      {igSaved && (
                        <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-3 text-xs text-emerald-300">
                          Konfigurasi Instagram tersimpan.
                        </div>
                      )}
                      <div className="flex justify-end">
                        <Button type="submit" className="px-5 text-xs h-9">Simpan Manual</Button>
                      </div>
                    </form>
                  )}
                </div>
              ) : (
                /* === NOT CONNECTED STATE === */
                <div className="space-y-5">
                  <div className="rounded-xl border border-white/10 bg-[#04091a] p-6 space-y-5">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-2xl bg-fuchsia-950/50 border border-fuchsia-500/25 flex items-center justify-center">
                        <Instagram className="h-6 w-6 text-fuchsia-400" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white">Connect Instagram Business</h4>
                        <p className="text-xs text-slate-400 mt-0.5">Hubungkan akun Instagram Business Anda lewat halaman Facebook — tidak perlu copy-paste token manual.</p>
                      </div>
                    </div>

                    <div className="rounded-xl border border-fuchsia-500/10 bg-fuchsia-950/10 p-4">
                      <p className="text-[10px] font-bold text-fuchsia-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                        <Zap className="h-3 w-3" /> Flow OAuth (1 klik)
                      </p>
                      <ol className="space-y-2">
                        {[
                          "Login ke akun Facebook",
                          "Pilih halaman Facebook yang terhubung ke Instagram",
                          "Berikan permission DM & Comment",
                          "Sistem mengambil Account ID otomatis ✓",
                          "Webhook aktif langsung ✓",
                        ].map((step, i) => (
                          <li key={i} className="flex items-start gap-2.5 text-[11px] text-slate-300">
                            <span className="flex-shrink-0 h-4 w-4 rounded-full bg-fuchsia-950/60 border border-fuchsia-500/30 flex items-center justify-center text-[8px] font-extrabold text-fuchsia-400">
                              {i + 1}
                            </span>
                            {step}
                          </li>
                        ))}
                      </ol>
                    </div>

                    <div className="rounded-lg border border-amber-500/15 bg-amber-950/10 p-3 text-[10px] text-amber-300/80">
                      <strong className="text-amber-300">Prasyarat:</strong> Akun Instagram Anda harus bertype <strong>Business</strong> atau <strong>Creator</strong> dan sudah terhubung ke halaman Facebook.
                    </div>

                    {oauthIgError && (
                      oauthIgError.toLowerCase().includes("https") ? (
                        <div className="rounded-lg border border-fuchsia-500/20 bg-fuchsia-950/20 p-3 text-xs text-fuchsia-300 flex items-start gap-2">
                          <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5 text-fuchsia-400" />
                          <div>
                            <p className="font-semibold mb-1">Fitur OAuth membutuhkan HTTPS</p>
                            <p className="text-fuchsia-400/80">{oauthIgError}</p>
                            <button
                              type="button"
                              onClick={() => setIgAdvancedOpen(true)}
                              className="mt-2 text-fuchsia-300 underline underline-offset-2 hover:text-fuchsia-200 transition"
                            >
                              → Buka Setup Manual untuk input token langsung
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="rounded-lg border border-red-500/20 bg-red-950/20 p-3 text-xs text-red-300 flex items-start gap-2">
                          <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                          {oauthIgError}
                        </div>
                      )
                    )}

                    <Button
                      type="button"
                      onClick={() => void handleOAuthInstagram()}
                      disabled={isIgConnecting}
                      className="w-full h-11 bg-gradient-to-r from-fuchsia-600 to-purple-600 hover:from-fuchsia-500 hover:to-purple-500 text-white font-bold text-sm gap-2.5 transition-all"
                    >
                      {isIgConnecting ? (
                        <><Loader2 className="h-4 w-4 animate-spin" /> Menghubungkan...</>
                      ) : (
                        <><Instagram className="h-4.5 w-4.5" /> Connect Instagram via Facebook</>
                      )}
                    </Button>
                  </div>

                  {/* ── Divider manual ── */}
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-px bg-white/8" />
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">atau isi manual</span>
                    <div className="flex-1 h-px bg-white/8" />
                  </div>

                  {/* ── Form Manual Instagram ── */}
                  <form onSubmit={persistInstagram} className="rounded-xl border border-white/8 bg-white/[0.02] p-5 space-y-4">
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Jika login Facebook bermasalah, isi token Instagram secara manual di bawah ini.
                    </p>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-300">Username Instagram</label>
                        <Input value={igUsername} onChange={(e) => setIgUsername(e.target.value)} className="h-10 text-xs" placeholder="namaakun (tanpa @)" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-300">Instagram Account ID</label>
                        <Input value={igAccountId} onChange={(e) => setIgAccountId(e.target.value)} className="h-10 text-xs" placeholder="17841400000000000" />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-300">Meta access token</label>
                      <Input type="password" value={igAccessToken} onChange={(e) => setIgAccessToken(e.target.value)} className="h-10 text-xs" placeholder="EAABwzLixnjY..." />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-300">Verify token</label>
                      <Input value={igVerifyToken} onChange={(e) => setIgVerifyToken(e.target.value)} className="h-10 text-xs" placeholder="Contoh: balesin_verify" />
                    </div>
                    <div className="rounded-lg border border-white/8 bg-[#020611] p-3 text-[10px] text-slate-400 space-y-1">
                      <span className="block font-semibold text-slate-400 uppercase tracking-wider">Webhook Callback URL</span>
                      <code className="block font-mono text-cyan-300 break-all">{instagramWebhookUrl}</code>
                    </div>
                    {igSaved && (
                      <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-3 text-xs text-emerald-300">
                        ✓ Konfigurasi Instagram tersimpan.
                      </div>
                    )}
                    <div className="flex justify-end">
                      <Button type="submit" className="px-6 text-xs h-9 bg-fuchsia-600 hover:bg-fuchsia-500">Simpan & Hubungkan</Button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          )}

          {/* ============================================== */}
          {/* ACTIVE TAB: QONTAK CRM SYSTEM INTERNAL */}
          {/* ============================================== */}
          {activeChannel === "qontak" && (
            <Card className="glass-panel p-6 border-white/8">
              <div className="flex items-center justify-between border-b border-white/8 pb-4 mb-5">
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl border border-emerald-500/20 bg-emerald-950/30 p-3 text-emerald-300">
                    <Link2 className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold uppercase tracking-wider text-white">Qontak CRM Integration</h2>
                    <p className="text-xs text-slate-400">Sistem Internal: Integrasi dua arah dengan database CRM Anda.</p>
                  </div>
                </div>
                <Badge className="border-emerald-400/20 bg-emerald-950/40 text-emerald-300 text-[10px] px-2 py-0.5 font-bold animate-pulse">
                  ACTIVE 2-WAY SYNC
                </Badge>
              </div>

              <div className="space-y-6">
                <div className="rounded-xl border border-white/8 bg-white/[0.02] p-4 text-xs text-slate-300 leading-relaxed">
                  Ini memastikan setiap interaksi prospek baru yang ditangani bot secara otomatis terdaftar di dalam database Contacts atau jalur penjualan (Sales Pipeline) bengkel Anda.
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="border border-white/8 bg-white/[0.01] p-4 rounded-xl text-center">
                    <span className="text-[10px] font-bold text-slate-500 uppercase block">Total Synced Contacts</span>
                    <span className="text-xl font-extrabold text-white mt-1 block">1,245</span>
                  </div>
                  <div className="border border-white/8 bg-white/[0.01] p-4 rounded-xl text-center">
                    <span className="text-[10px] font-bold text-slate-500 uppercase block">Active Deal Pipelines</span>
                    <span className="text-xl font-extrabold text-cyan-450 text-cyan-400 mt-1 block">34</span>
                  </div>
                  <div className="border border-white/8 bg-white/[0.01] p-4 rounded-xl text-center">
                    <span className="text-[10px] font-bold text-slate-500 uppercase block">Last Sync Status</span>
                    <span className="text-xs font-bold text-emerald-400 mt-2 block flex items-center justify-center gap-1">
                      <Check className="h-3.5 w-3.5" /> Success (Just Now)
                    </span>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Preferensi Sinkronisasi</h4>
                  <div className="space-y-2">
                    <label className="flex items-center gap-3 rounded-lg border border-white/8 bg-white/[0.02] p-3 text-xs text-slate-300">
                      <input type="checkbox" defaultChecked className="h-4 w-4 rounded border-white/12 bg-white/4 text-cyan-500" />
                      Kirim log ringkasan AI summary obrolan ke timeline CRM
                    </label>
                    <label className="flex items-center gap-3 rounded-lg border border-white/8 bg-white/[0.02] p-3 text-xs text-slate-300">
                      <input type="checkbox" defaultChecked className="h-4 w-4 rounded border-white/12 bg-white/4 text-cyan-500" />
                      Daftarkan WhatsApp ID otomatis sebagai primary phone number
                    </label>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* ============================================== */}
          {/* ACTIVE TAB: OTHER MOCK CHANNELS */}
          {/* ============================================== */}
          {["facebook", "telegram", "x", "line", "call", "ecommerce", "email"].includes(activeChannel) && (
            <Card className="glass-panel p-6 border-white/8 flex flex-col items-center justify-center text-center min-h-[350px]">
              <div className="h-14 w-14 rounded-2xl bg-cyan-950/40 border border-cyan-400/20 flex items-center justify-center text-cyan-400 mb-4">
                {activeChannel === "facebook" && <Facebook className="h-7 w-7" />}
                {activeChannel === "telegram" && <Send className="h-7 w-7" />}
                {activeChannel === "x" && <MessageSquare className="h-7 w-7" />}
                {activeChannel === "line" && <MessageSquare className="h-7 w-7" />}
                {activeChannel === "call" && <Phone className="h-7 w-7 text-amber-400" />}
                {activeChannel === "ecommerce" && <ShoppingCart className="h-7 w-7 text-fuchsia-400" />}
                {activeChannel === "email" && <Mail className="h-7 w-7" />}
              </div>

              <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-2">
                {activeChannel === "facebook" && "Facebook Messenger Integration"}
                {activeChannel === "telegram" && "Telegram Bot Integration"}
                {activeChannel === "x" && "X (Twitter) DM Integration"}
                {activeChannel === "line" && "Line Official Account Integration"}
                {activeChannel === "call" && "Cloud Phone & Call Center (VoIP)"}
                {activeChannel === "ecommerce" && "E-commerce System Integration"}
                {activeChannel === "email" && "Email Inbox & Campaign Tools"}
              </h3>

              <span className="inline-flex items-center gap-1.5 rounded-full border border-cyan-400/20 bg-cyan-950/40 px-3 py-0.5 text-[9px] font-bold text-cyan-300 uppercase mb-4">
                Coming Soon / Roadmap
              </span>

              <p className="text-xs text-slate-400 max-w-md leading-relaxed mb-6">
                {activeChannel === "facebook" && "Hubungkan halaman Facebook Business Anda untuk merespons pesan masuk dari pelanggan langsung ke Unified Inbox Balesin AI secara terpusat."}
                {activeChannel === "telegram" && "Tautkan bot Telegram Anda menggunakan API Token dari @BotFather untuk menangani percakapan customer via asisten cerdas Balesin."}
                {activeChannel === "x" && "Kelola Direct Message (DM) dan mention penting dari akun X bisnis Anda secara real-time dan terintegrasi."}
                {activeChannel === "line" && "Koneksikan akun LINE Official Account Anda melalui Channel Access Token agar pesan masuk ter-routing otomatis."}
                {activeChannel === "call" && "Call (panggilan telepon). Hubungkan VoIP cloud telephony bengkel Anda ke asisten bot, rekam percakapan panggilan masuk, dan lakukan dial-out instan."}
                {activeChannel === "ecommerce" && "E-commerce. Sinkronisasikan database toko online seperti Tokopedia, Shopee, atau WooCommerce agar bot dapat mengecek status pesanan pelanggan secara mandiri."}
                {activeChannel === "email" && "Email. Integrasikan inbox bisnis GMail atau Outlook Anda untuk menyatukan percakapan email customer serta mengelola Broadcast Campaign."}
              </p>

              <Button className="bg-[#0a0e1c] hover:bg-white/4 border border-white/8 text-slate-300 hover:text-white px-5 text-xs">
                Request Beta Access
              </Button>
            </Card>
          )}
        </div>
      </div>
    </div>
  );

}
