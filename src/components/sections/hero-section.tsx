"use client";

import { ArrowRight, Bot, MessageSquare, Zap } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { heroMetrics } from "@/constants/product";

const PARTNER_LOGOS = [
  "Tokopedia", "Gojek", "Shopee", "Bukalapak", "Blibli", "Lazada", "Grab", "Traveloka"
];

export function HeroSection() {
  return (
    <section className="relative overflow-hidden py-20 lg:py-28 bg-[var(--color-bg)]">
      {/* Background Subtle Design */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_0%,rgba(0,0,0,0.02),transparent_100%)] pointer-events-none" />

      <div className="mx-auto grid max-w-7xl gap-16 px-6 lg:grid-cols-[1.15fr_0.85fr] lg:px-8 relative z-10">
        
        {/* Left Side Content */}
        <div className="flex flex-col justify-center space-y-8 animate-fade-in">
          <div className="inline-flex max-w-fit items-center gap-1.5 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1 text-[10px] font-semibold text-[var(--color-text)]">
            <Zap className="h-3 w-3 text-[var(--color-brand)] fill-[var(--color-brand)]" />
            AI Agent Cerdas 24/7 Terdepan di Indonesia
          </div>

          <div className="space-y-5">
            <h1 className="text-4xl font-bold tracking-tight text-[var(--color-text)] sm:text-5xl lg:text-[62px] lg:leading-[1.08] tracking-[-0.035em]">
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

          {/* Clean Metrics Grid */}
          <div className="border-t border-[var(--color-border)] pt-8">
            <div className="grid gap-6 grid-cols-3">
              {heroMetrics.map((metric) => (
                <div key={metric.label} className="space-y-1">
                  <p className="text-[9px] font-bold uppercase tracking-widest text-[var(--color-muted)]">
                    {metric.label}
                  </p>
                  <p className="text-xl font-bold text-[var(--color-text)] tracking-tight">
                    {metric.value}
                  </p>
                  <p className="text-[10px] text-[var(--color-muted)] leading-relaxed font-normal">
                    {metric.detail}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side Visual Mockup - Ultra-Clean Light Mode CRM */}
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]/40 p-0 overflow-hidden self-center shadow-[0_24px_50px_rgba(0,0,0,0.03)] backdrop-blur-md transition-all duration-300 hover:shadow-[0_32px_60px_rgba(0,0,0,0.05)]">
          
          {/* Mockup Header */}
          <div className="border-b border-[var(--color-border)] px-5 py-3.5 bg-[var(--color-surface)]/70 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <div className="h-2.5 w-2.5 rounded-full bg-[var(--color-border-hover)]" />
              <div className="h-2.5 w-2.5 rounded-full bg-[var(--color-border-hover)]" />
              <div className="h-2.5 w-2.5 rounded-full bg-[var(--color-border-hover)]" />
              <span className="text-[9px] text-[var(--color-muted)] font-semibold ml-2 tracking-widest uppercase">
                Balesin.AI Dashboard
              </span>
            </div>
            <div className="flex items-center gap-1 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 py-0.5 text-[8px] font-bold uppercase tracking-wider text-[var(--color-text)]">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse mr-1" />
              AI Agent Aktif
            </div>
          </div>

          {/* Mockup Content Panel */}
          <div className="p-5 space-y-4 bg-transparent text-[var(--color-text)]">
            {/* Row of stats */}
            <div className="grid grid-cols-2 gap-3.5">
              <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)]/80 p-3.5">
                <div className="flex items-center gap-3">
                  <div className="rounded bg-[var(--color-surface)] p-2 text-[var(--color-text)] border border-[var(--color-border)]">
                    <MessageSquare className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <p className="text-[8px] font-bold uppercase tracking-widest text-[var(--color-muted)]">Pesan Masuk</p>
                    <p className="text-xs font-bold text-[var(--color-text)]">1,248 Chat / Hari</p>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)]/80 p-3.5">
                <div className="flex items-center gap-3">
                  <div className="rounded bg-[var(--color-surface)] p-2 text-[var(--color-text)] border border-[var(--color-border)]">
                    <Bot className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <p className="text-[8px] font-bold uppercase tracking-widest text-[var(--color-muted)]">Resolusi AI</p>
                    <p className="text-xs font-bold text-[var(--color-text)]">92.4% Terjawab</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Chat preview mimicking Cekat AI behavior */}
            <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)]/50 p-4 space-y-3.5">
              <div className="text-[9px] font-bold tracking-widest text-[var(--color-muted)] uppercase flex justify-between">
                <span>SIMULASI PERCAKAPAN</span>
                <span className="text-[var(--color-brand-blue)]">Grounding FAQ</span>
              </div>
              
              {/* User Bubble */}
              <div className="flex gap-2.5 max-w-[85%]">
                <div className="h-5.5 w-5.5 rounded-full bg-[var(--color-surface-hover)] flex items-center justify-center text-[8px] font-bold text-[var(--color-muted)] shrink-0">
                  U
                </div>
                <div className="rounded-2xl rounded-tl-none bg-[var(--color-surface)] px-3 py-2 text-xs text-[var(--color-text)] leading-relaxed">
                  Halo, apakah produknya bisa dikirim ke Surabaya? Dan jam berapa tokonya tutup ya?
                </div>
              </div>

              {/* AI Bubble */}
              <div className="flex gap-2.5 max-w-[85%] ml-auto justify-end">
                <div className="rounded-2xl rounded-tr-none bg-[var(--color-brand)] px-3 py-2 text-xs text-[var(--color-bg)] leading-relaxed">
                  Halo! Tentu bisa, kami melayani pengiriman ke seluruh Indonesia via JNE/J&T. Toko fisik kami tutup pukul 21:00 WIB. Ada yang bisa dibantu lagi? 😊
                </div>
                <div className="h-5.5 w-5.5 rounded-full bg-[var(--color-surface)] border border-[var(--color-border)] flex items-center justify-center text-[8px] font-bold text-[var(--color-text)] shrink-0">
                  <Bot className="h-3 w-3" />
                </div>
              </div>
            </div>

            {/* Integration sources */}
            <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)]/80 p-3.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <p className="text-[8px] font-bold uppercase tracking-widest text-[var(--color-muted)]">Channel Terintegrasi</p>
                  <p className="text-[10px] font-medium text-[var(--color-muted)]">Hubungkan dalam 1x klik</p>
                </div>
                <div className="flex gap-1.5 text-[8px] font-semibold">
                  <span className="rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 py-0.5 text-[var(--color-text)]">
                    WhatsApp AI
                  </span>
                  <span className="rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 py-0.5 text-[var(--color-text)]">
                    Live Chat
                  </span>
                  <span className="rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 py-0.5 text-[var(--color-text)]">
                    Instagram
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Partners/Clients logos block below hero */}
      <div className="mx-auto max-w-7xl px-6 lg:px-8 mt-20 pt-12 border-t border-[var(--color-border)]">
        <p className="text-center text-[10px] font-semibold text-[var(--color-muted)] uppercase tracking-widest">
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
