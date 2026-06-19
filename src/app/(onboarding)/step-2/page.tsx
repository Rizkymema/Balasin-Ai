"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { MessageSquare, ArrowRight, ArrowLeft, Check, Globe, MessageCircle, Instagram } from "lucide-react";
import { Button } from "@/components/ui/button";

const CHANNELS = [
  {
    id: "webchat",
    name: "Website Live Chat",
    description: "Widget chat interaktif di website toko Anda. Ringan, cepat, & gratis.",
    icon: Globe,
    color: "border-white/8 bg-white/[0.02] hover:bg-white/[0.04] text-white",
    activeColor: "border-cyan-400 bg-cyan-950/20 text-cyan-300 ring-1 ring-cyan-400/40 shadow-[0_0_20px_rgba(6,182,212,0.15)]",
    iconColor: "text-cyan-400 bg-cyan-500/10",
  },
  {
    id: "whatsapp",
    name: "WhatsApp Business",
    description: "Balas chat pelanggan secara otomatis di WhatsApp resmi nomor bisnis Anda.",
    icon: MessageCircle,
    color: "border-white/8 bg-white/[0.02] hover:bg-white/[0.04] text-white",
    activeColor: "border-emerald-500 bg-emerald-950/20 text-emerald-300 ring-1 ring-emerald-500/40 shadow-[0_0_20px_rgba(16,185,129,0.15)]",
    iconColor: "text-emerald-400 bg-emerald-500/10",
  },
  {
    id: "instagram",
    name: "Instagram DM",
    description: "Hubungkan ke Direct Message dan Komentar IG secara otomatis. (Roadmap)",
    icon: Instagram,
    color: "border-pink-500/10 bg-pink-950/5 text-slate-500 opacity-50 cursor-not-allowed",
    activeColor: "",
    iconColor: "text-pink-500 bg-pink-500/5",
    disabled: true,
  },
];

export default function Step2Page() {
  const router = useRouter();
  const [selectedChannel, setSelectedChannel] = useState<string>("");

  useEffect(() => {
    const cached = localStorage.getItem("onboarding_channel");
    if (cached) {
      setSelectedChannel(cached);
    }
  }, []);

  const handleSelect = (id: string, disabled?: boolean) => {
    if (disabled) return;
    setSelectedChannel(id);
  };

  const handleNext = () => {
    if (!selectedChannel) return;
    localStorage.setItem("onboarding_channel", selectedChannel);
    router.push("/step-3");
  };

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h2 className="text-xl font-bold font-heading text-white flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400">
            <MessageSquare className="h-5 w-5" />
          </div>
          Pilih Channel Utama
        </h2>
        <p className="text-xs text-slate-400 mt-2 max-w-lg leading-relaxed">
          Hubungkan channel komunikasi pertama Anda. AI Balesin akan siaga 24/7 untuk menangani dan menjawab pesan masuk dari channel ini.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {CHANNELS.map((ch) => {
          const isSelected = selectedChannel === ch.id;
          const Icon = ch.icon;
          return (
            <div
              key={ch.id}
              onClick={() => handleSelect(ch.id, ch.disabled)}
              className={`relative flex flex-col justify-between rounded-xl border p-5 transition-all duration-300 h-44 ${
                ch.disabled
                  ? ch.color
                  : isSelected
                  ? `${ch.activeColor} scale-[1.02]`
                  : `${ch.color} cursor-pointer hover:scale-[1.02] hover:-translate-y-0.5`
              }`}
            >
              {isSelected && (
                <div className="absolute top-3 right-3 flex h-5 w-5 items-center justify-center rounded-full bg-cyan-400 text-slate-950 shadow-[0_0_8px_rgba(34,211,238,0.4)]">
                  <Check className="h-3.5 w-3.5 stroke-[3]" />
                </div>
              )}
              <div>
                <div className={`p-2 rounded-lg w-fit mb-3.5 ${ch.iconColor}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="text-xs font-bold tracking-wider uppercase text-white">{ch.name}</h3>
                <p className="text-[10.5px] text-slate-400 mt-2 leading-relaxed">
                  {ch.description}
                </p>
              </div>
              {ch.disabled && (
                <span className="text-[8px] font-bold text-pink-400 uppercase tracking-widest mt-3.5 self-start bg-pink-500/10 px-2 py-0.5 rounded-full border border-pink-500/20">
                  Segera Hadir
                </span>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-between border-t border-white/5 pt-5">
        <Button
          variant="secondary"
          onClick={() => router.push("/step-1")}
          className="px-5 py-5 hover:bg-white/5 transition-all"
        >
          <span className="flex items-center gap-1.5 font-bold tracking-wide">
            <ArrowLeft className="h-4 w-4" />
            Kembali
          </span>
        </Button>

        <Button
          onClick={handleNext}
          disabled={!selectedChannel}
          className="px-6 py-5.5 shadow-[0_4px_20px_rgba(0,210,255,0.15)] hover:shadow-[0_4px_25px_rgba(0,210,255,0.3)] transition-all duration-200"
        >
          <span className="flex items-center gap-1.5 font-bold tracking-wide">
            Lanjutkan
            <ArrowRight className="h-4 w-4" />
          </span>
        </Button>
      </div>
    </div>
  );
}
