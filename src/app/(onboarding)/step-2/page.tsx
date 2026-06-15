"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { MessageSquare, ArrowRight, ArrowLeft, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

const CHANNELS = [
  {
    id: "webchat",
    name: "Website Live Chat",
    description: "Widget chat interaktif di website toko Anda. Ringan & gratis.",
    icon: "🌐",
    color: "border-cyan-500/30 text-cyan-400 bg-cyan-950/20",
    activeColor: "border-cyan-400 bg-cyan-950/40 text-cyan-300 ring-2 ring-cyan-400/30 shadow-[0_0_15px_rgba(64,223,255,0.15)]",
  },
  {
    id: "whatsapp",
    name: "WhatsApp Business",
    description: "Balas chat pelanggan secara otomatis di WhatsApp resmi.",
    icon: "💬",
    color: "border-emerald-500/30 text-emerald-400 bg-emerald-950/20",
    activeColor: "border-emerald-400 bg-emerald-950/40 text-emerald-300 ring-2 ring-emerald-400/30 shadow-[0_0_15px_rgba(16,185,129,0.15)]",
  },
  {
    id: "instagram",
    name: "Instagram DM (Roadmap)",
    description: "Hubungkan ke Direct Message dan Komentar IG. Coming soon.",
    icon: "📸",
    color: "border-pink-500/20 text-pink-500 bg-pink-950/10 opacity-60 cursor-not-allowed",
    activeColor: "",
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
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-bold font-heading text-white flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-cyan-400" />
          Pilih Channel Utama
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Hubungkan channel chat pertama Anda. AI Balesin akan menangani pesan yang masuk dari channel ini.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {CHANNELS.map((ch) => {
          const isSelected = selectedChannel === ch.id;
          return (
            <div
              key={ch.id}
              onClick={() => handleSelect(ch.id, ch.disabled)}
              className={`relative flex flex-col justify-between rounded-xl border p-4.5 transition duration-300 cursor-pointer h-40 ${
                ch.disabled ? ch.color : isSelected ? ch.activeColor : "border-white/8 bg-white/3 hover:bg-white/6 text-white"
              }`}
            >
              {isSelected && (
                <div className="absolute top-2 right-2 flex h-5 w-5 items-center justify-center rounded-full bg-cyan-400 text-slate-950">
                  <Check className="h-3 w-3 stroke-[3]" />
                </div>
              )}
              <div>
                <span className="text-2xl mb-2.5 block">{ch.icon}</span>
                <h3 className="text-sm font-bold tracking-wide">{ch.name}</h3>
                <p className="text-[11px] text-slate-400 mt-1 leading-normal">
                  {ch.description}
                </p>
              </div>
              {ch.disabled && (
                <span className="text-[9px] font-bold text-pink-400 uppercase tracking-widest mt-2 self-start">
                  Segera Hadir
                </span>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-between border-t border-white/8 pt-4">
        <Button
          variant="secondary"
          onClick={() => router.push("/step-1")}
          className="px-5"
        >
          <span className="flex items-center gap-1.5">
            <ArrowLeft className="h-4 w-4" />
            Kembali
          </span>
        </Button>

        <Button
          onClick={handleNext}
          disabled={!selectedChannel}
          className="px-5"
        >
          <span className="flex items-center gap-1.5">
            Lanjutkan
            <ArrowRight className="h-4 w-4" />
          </span>
        </Button>
      </div>
    </div>
  );
}
