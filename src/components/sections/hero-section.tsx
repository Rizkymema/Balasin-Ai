"use client";

import { useState } from "react";
import { ArrowRight, Bot, MessageSquare, Zap, CheckCircle2, ShieldCheck, Cpu } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const PARTNER_LOGOS = [
  "Tokopedia", "Gojek", "Shopee", "Bukalapak", "Blibli", "Lazada", "Grab", "Traveloka"
];

const PRESETS = [
  { q: "Berapa lama setup WhatsApp?", a: "Kurang dari 5 menit! Terkoneksi langsung via WhatsApp Cloud API resmi Facebook." },
  { q: "Bagaimana jika AI salah jawab?", a: "Balesin AI memiliki Safety Gate. Jika tingkat keyakinan (confidence) rendah, otomatis dialihkan ke admin." },
  { q: "Apakah mendukung e-commerce?", a: "Tentu! AI terintegrasi dengan katalog produk, stok barang, dan sistem pemesanan." }
];

export function HeroSection() {
  const [chatHistory, setChatHistory] = useState<Array<{ sender: "user" | "ai"; text: string }>>([
    { sender: "user", text: "Halo, apakah produknya bisa dikirim ke Surabaya? Dan jam berapa tokonya tutup ya?" },
    { sender: "ai", text: "Halo! Tentu bisa, kami melayani pengiriman ke seluruh Indonesia via JNE/J&T. Toko fisik kami tutup pukul 21:00 WIB. Ada yang bisa dibantu lagi? 😊" }
  ]);
  const [typing, setTyping] = useState(false);
  const [activePreset, setActivePreset] = useState<number | null>(null);

  const handlePresetClick = (idx: number) => {
    if (typing) return;
    setActivePreset(idx);
    const selected = PRESETS[idx];
    
    // Add user question
    setChatHistory(prev => [...prev, { sender: "user", text: selected.q }]);
    setTyping(true);

    // Simulate typing and AI response
    setTimeout(() => {
      setChatHistory(prev => [...prev, { sender: "ai", text: selected.a }]);
      setTyping(false);
      setActivePreset(null);
    }, 1200);
  };

  return (
    <section className="relative overflow-hidden py-20 lg:py-28 bg-[var(--color-bg)]">
      {/* Background Subtle Design */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_0%,rgba(10,132,255,0.03),transparent_100%)] pointer-events-none" />

      <div className="mx-auto grid max-w-7xl gap-16 px-6 lg:grid-cols-[1.15fr_0.85fr] lg:px-8 relative z-10">
        
        {/* Left Side Content */}
        <div className="flex flex-col justify-center space-y-8 animate-fade-in">
          <div className="inline-flex max-w-fit items-center gap-1.5 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-3.5 py-1.5 text-xs font-semibold text-[var(--color-text)]">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--color-success)] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--color-success)]"></span>
            </span>
            AI Agent Cerdas 24/7 Terdepan di Indonesia
          </div>

          <div className="space-y-5">
            <h1 className="text-4xl font-bold text-[var(--color-text)] sm:text-5xl lg:text-[58px] lg:leading-[1.1] tracking-[-0.03em] text-wrap">
              Satu AI Agent. <br />
              <span className="text-[var(--color-muted)] font-medium">Kelola Chat, CRM, dan Closing Otomatis.</span>
            </h1>
            <p className="max-w-xl text-sm sm:text-base leading-relaxed text-[var(--color-muted)] font-normal">
              Melayani ribuan pelanggan 24/7 tanpa henti dengan AI Agent yang dilatih khusus menggunakan basis pengetahuan Anda. Hubungkan WhatsApp, Website Live Chat, dan Instagram dalam satu Dashboard CRM cerdas.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Link href="/login" className="w-full sm:w-auto">
              <Button className="w-full sm:w-auto">
                Coba Demo Sekarang
                <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </Button>
            </Link>
            <Link href="/register" className="w-full sm:w-auto">
              <Button variant="secondary" className="w-full sm:w-auto">
                Mulai Uji Coba Gratis
              </Button>
            </Link>
          </div>

          {/* Clean Interactive Status Center (Replaces boring stats) */}
          <div className="border-t border-[var(--color-border)] pt-8 space-y-4">
            <p className="text-xs font-bold uppercase tracking-wider text-[var(--color-muted)]">
              Status & Kapabilitas Sistem
            </p>
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
              <div className="flex items-start gap-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]/20 p-3">
                <CheckCircle2 className="h-4.5 w-4.5 text-[var(--color-success)] shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-[var(--color-text)]">WhatsApp Cloud API</p>
                  <p className="text-[10px] text-[var(--color-muted)] mt-0.5">Koneksi resmi & stabil</p>
                </div>
              </div>
              <div className="flex items-start gap-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]/20 p-3">
                <ShieldCheck className="h-4.5 w-4.5 text-[var(--color-brand)] shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-[var(--color-text)]">Safety Guard Takeover</p>
                  <p className="text-[10px] text-[var(--color-muted)] mt-0.5">Handoff ke admin &lt; 60dtk</p>
                </div>
              </div>
              <div className="flex items-start gap-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]/20 p-3">
                <Cpu className="h-4.5 w-4.5 text-[var(--color-brand-blue)] shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-[var(--color-text)]">RAG Knowledge Base</p>
                  <p className="text-[10px] text-[var(--color-muted)] mt-0.5">Berdasarkan data internal</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side Visual Mockup - High-Fidelity Interactive Simulator */}
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]/40 p-0 overflow-hidden self-center shadow-[0_24px_50px_rgba(0,0,0,0.03)] backdrop-blur-md transition-all duration-300 hover:shadow-[0_32px_60px_rgba(0,0,0,0.05)] w-full max-w-md lg:max-w-none">
          
          {/* Mockup Header */}
          <div className="border-b border-[var(--color-border)] px-5 py-3.5 bg-[var(--color-surface)]/70 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <div className="h-2.5 w-2.5 rounded-full bg-red-500/80" />
              <div className="h-2.5 w-2.5 rounded-full bg-yellow-500/80" />
              <div className="h-2.5 w-2.5 rounded-full bg-green-500/80" />
              <span className="text-[9px] text-[var(--color-muted)] font-semibold ml-2 tracking-widest uppercase">
                Balesin.AI Dashboard
              </span>
            </div>
            <div className="flex items-center gap-1 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 py-0.5 text-[8px] font-bold uppercase tracking-wider text-[var(--color-text)]">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse mr-1" />
              AI Agent Aktif
            </div>
          </div>

          {/* Simulator Content */}
          <div className="p-5 space-y-4 text-[var(--color-text)]">
            
            {/* Conversation Area */}
            <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)]/50 p-4 space-y-3.5 h-[260px] overflow-y-auto custom-scrollbar flex flex-col justify-end">
              <div className="text-[9px] font-bold tracking-widest text-[var(--color-muted)] uppercase flex justify-between border-b border-[var(--color-border)]/50 pb-2 mb-1">
                <span>SIMULASI PERCAKAPAN</span>
                <span className="text-[var(--color-brand)]">Grounding FAQ</span>
              </div>
              
              <div className="space-y-3.5 overflow-y-auto pr-1">
                {chatHistory.map((chat, idx) => (
                  <div key={idx} className={`flex gap-2.5 max-w-[85%] ${chat.sender === "ai" ? "ml-auto justify-end" : ""}`}>
                    {chat.sender === "user" && (
                      <div className="h-6 w-6 rounded-full bg-[var(--color-surface-hover)] border border-[var(--color-border)] flex items-center justify-center text-[9px] font-bold text-[var(--color-muted)] shrink-0 select-none">
                        U
                      </div>
                    )}
                    <div className={`rounded-2xl px-3 py-2 text-xs leading-relaxed ${
                      chat.sender === "ai" 
                        ? "rounded-tr-none bg-[var(--color-brand)] text-[var(--color-bg)]" 
                        : "rounded-tl-none bg-[var(--color-surface)] text-[var(--color-text)] border border-[var(--color-border)]"
                    }`}>
                      {chat.text}
                    </div>
                    {chat.sender === "ai" && (
                      <div className="h-6 w-6 rounded-full bg-[var(--color-surface)] border border-[var(--color-border)] flex items-center justify-center text-[9px] font-bold text-[var(--color-text)] shrink-0 select-none">
                        <Bot className="h-3.5 w-3.5 text-[var(--color-brand)]" />
                      </div>
                    )}
                  </div>
                ))}

                {typing && (
                  <div className="flex gap-2.5 max-w-[85%] ml-auto justify-end">
                    <div className="rounded-2xl rounded-tr-none bg-[var(--color-brand)]/20 px-3 py-2.5 text-xs text-[var(--color-text)] leading-relaxed flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-text)] animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-text)] animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-text)] animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                    <div className="h-6 w-6 rounded-full bg-[var(--color-surface)] border border-[var(--color-border)] flex items-center justify-center text-[9px] font-bold text-[var(--color-text)] shrink-0">
                      <Bot className="h-3.5 w-3.5 text-[var(--color-brand)]" />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Interactive Presets (Tells the user they can interact) */}
            <div className="space-y-2">
              <p className="text-[8px] font-bold uppercase tracking-widest text-[var(--color-muted)]">
                Klik pertanyaan untuk menguji AI:
              </p>
              <div className="flex flex-wrap gap-2">
                {PRESETS.map((preset, idx) => (
                  <button
                    key={idx}
                    onClick={() => handlePresetClick(idx)}
                    disabled={typing}
                    className={`text-[10px] text-left px-3 py-1.5 rounded-lg border transition-all duration-200 focus:outline-none ${
                      activePreset === idx
                        ? "border-[var(--color-brand)] bg-[var(--color-brand)]/10 text-[var(--color-brand)] font-semibold"
                        : "border-[var(--color-border)] bg-[var(--color-surface)]/60 text-[var(--color-text)] hover:border-[var(--color-border-hover)] hover:bg-[var(--color-surface)]"
                    } disabled:opacity-50`}
                  >
                    {preset.q}
                  </button>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Partners/Clients logos block below hero */}
      <div className="mx-auto max-w-7xl px-6 lg:px-8 mt-20 pt-12 border-t border-[var(--color-border)]">
        <p className="text-center text-xs font-semibold text-[var(--color-muted)] uppercase tracking-widest">
          Dipercaya oleh 3.000+ UMKM dan brand terkemuka di Indonesia
        </p>
        <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-6 mt-8 opacity-35 grayscale">
          {PARTNER_LOGOS.map((name) => (
            <span key={name} className="text-xs font-bold text-[var(--color-text)] tracking-widest uppercase">
              {name}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
