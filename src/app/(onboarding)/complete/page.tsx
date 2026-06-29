"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, ChevronRight, Sparkles, Building, Radio, BookOpen, Users } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function CompletePage() {
  const router = useRouter();
  const [summary, setSummary] = useState({
    businessName: "",
    channelName: "",
    faqCount: 0,
    inviteCount: 0,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  useEffect(() => {
    const biz = localStorage.getItem("onboarding_business");
    const ch = localStorage.getItem("onboarding_channel");
    const faqs = localStorage.getItem("onboarding_faqs");
    const invites = localStorage.getItem("onboarding_invites");

    let businessName = "Bisnis Saya";
    let channelName = "Tidak Terhubung";
    let faqCount = 0;
    let inviteCount = 0;

    if (biz) {
      try {
        businessName = JSON.parse(biz).name || "Bisnis Saya";
      } catch (e) {}
    }

    if (ch) {
      channelName = ch === "webchat" ? "Website Live Chat" : "WhatsApp Business";
    }

    if (faqs) {
      try {
        faqCount = JSON.parse(faqs).length || 0;
      } catch (e) {}
    }

    if (invites) {
      try {
        inviteCount = JSON.parse(invites).length || 0;
      } catch (e) {}
    }

    setSummary({ businessName, channelName, faqCount, inviteCount });
  }, []);

  const handleFinish = async () => {
    setIsSaving(true);
    setSaveError("");

    try {
      const biz = localStorage.getItem("onboarding_business");
      const ch = localStorage.getItem("onboarding_channel");
      const faqsRaw = localStorage.getItem("onboarding_faqs");
      const invitesRaw = localStorage.getItem("onboarding_invites");

      let businessName = "Bisnis Saya";
      let industry = "";
      let description = "";
      let faqs: any[] = [];
      let invites: any[] = [];

      if (biz) {
        try {
          const parsed = JSON.parse(biz);
          businessName = parsed.name || "Bisnis Saya";
          industry = parsed.industry || "";
          description = parsed.description || "";
        } catch (e) {}
      }

      if (faqsRaw) {
        try {
          faqs = JSON.parse(faqsRaw);
        } catch (e) {}
      }

      if (invitesRaw) {
        try {
          invites = JSON.parse(invitesRaw);
        } catch (e) {}
      }

      // Fetch current config from server
      const configRes = await fetch("/api/dashboard-config", {
        credentials: "include",
        cache: "no-store",
      });

      if (!configRes.ok) {
        throw new Error("Gagal mengambil konfigurasi awal dari server.");
      }

      const payload = await configRes.json();
      const currentConfig = payload.data;

      // Construct next configuration
      const nextConfig = {
        ...currentConfig,
        workspace: {
          ...currentConfig.workspace,
          name: businessName,
          industry: industry,
          description: description,
          onboarded: true,
        },
        knowledgeBase: {
          ...currentConfig.knowledgeBase,
          faqs: faqs.map((faq) => ({
            id: faq.id ? String(faq.id) : Math.random().toString(36).substr(2, 9),
            question: faq.question,
            answer: faq.answer,
          })),
        },
        channels: {
          ...currentConfig.channels,
          webchat: {
            ...currentConfig.channels.webchat,
            enabled: ch === "webchat",
            status: ch === "webchat" ? "connected" : currentConfig.channels?.webchat?.status || "draft",
          },
          whatsapp: {
            ...currentConfig.channels.whatsapp,
            enabled: ch === "whatsapp",
            status: ch === "whatsapp" ? "connected" : currentConfig.channels?.whatsapp?.status || "disconnected",
          },
        },
        team: {
          ...currentConfig.team,
          members: invites.map((inv) => ({
            id: inv.id ? String(inv.id) : Math.random().toString(36).substr(2, 9),
            name: inv.email.split("@")[0],
            email: inv.email,
            role: inv.role === "Admin" ? "Admin" : "Operator",
            status: "pending",
          })),
        },
      };

      // Save config to server
      const saveRes = await fetch("/api/dashboard-config", {
        method: "PUT",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(nextConfig),
      });

      if (!saveRes.ok) {
        const errPayload = await saveRes.json().catch(() => ({}));
        throw new Error(errPayload.error || "Gagal menyimpan konfigurasi ke server.");
      }

      // Mark as onboarded in client
      localStorage.setItem("balesin_onboarded", "true");
      localStorage.setItem("balesin_dashboard_config", JSON.stringify(nextConfig));

      // Remove temp onboarding keys
      localStorage.removeItem("onboarding_business");
      localStorage.removeItem("onboarding_channel");
      localStorage.removeItem("onboarding_faqs");
      localStorage.removeItem("onboarding_invites");

      router.push("/dashboard");
    } catch (err) {
      console.error(err);
      setSaveError(err instanceof Error ? err.message : "Terjadi kesalahan saat menyimpan data.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="text-center animate-fade-in py-4">
      {/* Celebrating success badge */}
      <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-400/20 shadow-[0_0_30px_rgba(84,219,255,0.25)] animate-pulse">
        <Sparkles className="h-8 w-8" />
      </div>

      <h2 className="text-2xl font-bold font-heading text-white tracking-wide">
        Setup Workspace Selesai!
      </h2>
      <p className="text-xs text-slate-400 mt-2.5 max-w-md mx-auto leading-relaxed">
        Workspace Anda siap digunakan. AI Balesin telah diinisialisasi menggunakan data profil dan FAQ awal Anda, siap diaktifkan untuk melayani pelanggan.
      </p>

      {/* Summary Box Card */}
      <div className="mt-8 mb-8 text-left rounded-xl border border-white/8 bg-white/[0.01] p-5.5 space-y-4 max-w-md mx-auto">
        <div className="text-[10px] uppercase font-extrabold tracking-wider text-slate-500 border-b border-white/5 pb-2 flex items-center gap-1.5">
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
          Rincian Konfigurasi Workspace
        </div>
        
        <div className="space-y-3.5">
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-400 flex items-center gap-2">
              <Building className="h-4 w-4 text-cyan-400/80" />
              Nama Bisnis:
            </span>
            <span className="font-bold text-white">{summary.businessName}</span>
          </div>
          
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-400 flex items-center gap-2">
              <Radio className="h-4 w-4 text-cyan-400/80" />
              Channel Utama:
            </span>
            <span className="font-bold text-cyan-400 flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-ping" />
              {summary.channelName}
            </span>
          </div>
          
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-400 flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-cyan-400/80" />
              Knowledge Base:
            </span>
            <span className="font-bold text-white bg-white/5 px-2.5 py-0.5 rounded border border-white/5">
              {summary.faqCount} FAQ Aktif
            </span>
          </div>
          
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-400 flex items-center gap-2">
              <Users className="h-4 w-4 text-cyan-400/80" />
              Anggota Tim:
            </span>
            <span className="font-bold text-white">
              {summary.inviteCount} Orang Diundang
            </span>
          </div>
        </div>
      </div>

      {saveError && (
        <div className="mb-6 text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg p-3.5 max-w-md mx-auto">
          {saveError}
        </div>
      )}

      <div className="flex justify-center">
        <Button
          onClick={handleFinish}
          disabled={isSaving}
          className="w-full max-w-xs px-6 py-5.5 rounded-full shadow-[0_4px_25px_rgba(0,210,255,0.2)] hover:shadow-[0_4px_30px_rgba(0,210,255,0.4)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-300"
        >
          <span className="flex items-center justify-center gap-1.5 font-bold tracking-wide">
            {isSaving ? "Menyimpan..." : "Masuk ke Dashboard"}
            {!isSaving && <ChevronRight className="h-5 w-5" />}
          </span>
        </Button>
      </div>
    </div>
  );
}
