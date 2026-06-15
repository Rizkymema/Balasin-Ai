"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, ChevronRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function CompletePage() {
  const router = useRouter();
  const [summary, setSummary] = useState({
    businessName: "",
    channelName: "",
    faqCount: 0,
    inviteCount: 0,
  });

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

  const handleFinish = () => {
    localStorage.setItem("balesin_onboarded", "true");
    router.push("/dashboard");
  };

  return (
    <div className="text-center">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-cyan-500/10 text-cyan-400 shadow-[0_0_20px_rgba(84,219,255,0.2)] animate-pulse">
        <Sparkles className="h-7 w-7" />
      </div>

      <h2 className="text-2xl font-bold font-heading text-white">Setup Workspace Selesai!</h2>
      <p className="text-xs text-slate-400 mt-1.5 max-w-md mx-auto leading-relaxed">
        Workspace Anda siap digunakan. AI Balesin telah dilatih dengan knowledge base awal Anda dan siap menjawab pelanggan.
      </p>

      {/* Summary Box */}
      <div className="mt-8 mb-8 text-left rounded-xl border border-white/8 bg-white/3 p-5 space-y-3.5 max-w-sm mx-auto">
        <div className="flex justify-between items-center text-xs">
          <span className="text-slate-400">Nama Bisnis:</span>
          <span className="font-bold text-white">{summary.businessName}</span>
        </div>
        <div className="flex justify-between items-center text-xs">
          <span className="text-slate-400">Channel Aktif:</span>
          <span className="font-bold text-cyan-400 flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-ping" />
            {summary.channelName}
          </span>
        </div>
        <div className="flex justify-between items-center text-xs">
          <span className="text-slate-400">Knowledge Base:</span>
          <span className="font-bold text-white">{summary.faqCount} FAQ Terlatih</span>
        </div>
        <div className="flex justify-between items-center text-xs">
          <span className="text-slate-400">Anggota Tim:</span>
          <span className="font-bold text-white">{summary.inviteCount} Diundang</span>
        </div>
      </div>

      <Button onClick={handleFinish} className="w-full max-w-xs px-6 py-5 rounded-full">
        <span className="flex items-center justify-center gap-1.5">
          Masuk ke Dashboard
          <ChevronRight className="h-5 w-5" />
        </span>
      </Button>
    </div>
  );
}
