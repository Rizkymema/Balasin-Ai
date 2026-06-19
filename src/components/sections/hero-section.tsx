"use client";

import { ArrowRight, Bot, MessageSquare, ShieldCheck, CheckCircle2, Zap, Radio, Globe } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { heroMetrics } from "@/constants/product";
import { siteConfig } from "@/constants/site";

const PARTNER_LOGOS = [
  "Tokopedia", "Gojek", "Shopee", "Bukalapak", "Blibli", "Lazada", "Grab", "Traveloka"
];

export function HeroSection() {
  return (
    <section className="relative overflow-hidden py-16 lg:py-24 bg-gradient-to-b from-white to-slate-50">
      {/* Background Decorative Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a08_1px,transparent_1px),linear-gradient(to_bottom,#0f172a08_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />

      <div className="mx-auto grid max-w-7xl gap-16 px-6 lg:grid-cols-[1.1fr_0.9fr] lg:px-8 relative z-10">
        
        {/* Left Side Content */}
        <div className="flex flex-col justify-center space-y-8 animate-fade-in">
          <div className="inline-flex max-w-fit items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50/50 px-4 py-1.5 text-xs font-bold text-indigo-600 shadow-sm">
            <Zap className="h-3.5 w-3.5 fill-indigo-600" />
            AI Agent Cerdas 24/7 Terdepan di Indonesia
          </div>

          <div className="space-y-6">
            <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl lg:text-[56px] lg:leading-[1.12]">
              Satu AI Agent untuk Kelola <span className="text-[var(--color-brand)]">Chat, CRM,</span> dan <span className="text-[var(--color-brand)]">Closing Otomatis</span>
            </h1>
            <p className="max-w-2xl text-base leading-relaxed text-slate-600 sm:text-lg">
              Melayani ribuan pelanggan 24/7 tanpa henti dengan AI Agent yang dilatih khusus menggunakan basis pengetahuan Anda. Hubungkan WhatsApp, Website Live Chat, dan Instagram dalam satu Dashboard CRM cerdas.
            </p>
          </div>

          <div className="flex flex-col gap-3.5 sm:flex-row">
            <Link href="/login" className="w-full sm:w-auto">
              <Button className="w-full sm:w-auto px-8 py-3.5 bg-[var(--color-brand)] text-white hover:bg-[var(--color-brand-hover)] shadow-lg shadow-indigo-600/10 hover:shadow-indigo-600/20 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200">
                <span className="flex items-center justify-center gap-1.5 font-bold">
                  Coba Demo Sekarang
                  <ArrowRight className="h-4 w-4" />
                </span>
              </Button>
            </Link>
            <Link href="/register" className="w-full sm:w-auto">
              <Button variant="secondary" className="w-full sm:w-auto px-8 py-3.5 border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-all">
                <span className="font-bold">Mulai Uji Coba Gratis</span>
              </Button>
            </Link>
          </div>

          {/* Clean Metrics Grid */}
          <div className="border-t border-slate-200/80 pt-8">
            <div className="grid gap-6 grid-cols-3">
              {heroMetrics.map((metric) => (
                <div key={metric.label} className="space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    {metric.label}
                  </p>
                  <p className="text-2xl font-extrabold text-slate-900 tracking-tight">
                    {metric.value}
                  </p>
                  <p className="text-[11px] text-slate-500 leading-relaxed font-semibold">
                    {metric.detail}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side Visual Mockup - Ultra-Clean Light Mode CRM */}
        <div className="rounded-2xl border border-slate-200 bg-white p-0 overflow-hidden self-center shadow-[0_25px_60px_-15px_rgba(15,23,42,0.12)] border-slate-200/80 transition-all duration-500 hover:shadow-[0_30px_70px_-10px_rgba(15,23,42,0.16)]">
          
          {/* Mockup Header */}
          <div className="border-b border-slate-100 px-6 py-4 bg-slate-50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-rose-400" />
              <div className="h-3 w-3 rounded-full bg-amber-400" />
              <div className="h-3 w-3 rounded-full bg-emerald-400" />
              <span className="text-[10px] text-slate-400 font-bold ml-2 tracking-wider uppercase">
                Balesin.AI Dashboard
              </span>
            </div>
            <div className="flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-emerald-600">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse mr-1" />
              AI Agent Aktif
            </div>
          </div>

          {/* Mockup Content Panel */}
          <div className="p-6 space-y-4.5 bg-white text-slate-800">
            {/* Row of stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4">
                <div className="flex items-center gap-3">
                  <div className="rounded bg-indigo-50 p-2 text-[var(--color-brand)] border border-indigo-100">
                    <MessageSquare className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Pesan Masuk</p>
                    <p className="text-sm font-bold text-slate-800">1,248 Chat / Hari</p>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4">
                <div className="flex items-center gap-3">
                  <div className="rounded bg-emerald-50 p-2 text-emerald-600 border border-emerald-100">
                    <Bot className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Resolusi AI</p>
                    <p className="text-sm font-bold text-slate-800">92.4% Terjawab</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Chat preview mimicking Cekat AI behavior */}
            <div className="rounded-xl border border-slate-100 bg-slate-50/20 p-4 space-y-3.5">
              <div className="text-[10px] font-extrabold tracking-wider text-slate-400 uppercase flex justify-between">
                <span>SIMULASI PERCAKAPAN</span>
                <span className="text-indigo-600">Grounding FAQ</span>
              </div>
              
              {/* User Bubble */}
              <div className="flex gap-2.5 max-w-[85%]">
                <div className="h-6 w-6 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-600">
                  U
                </div>
                <div className="rounded-2xl rounded-tl-none bg-slate-100 px-3.5 py-2 text-xs text-slate-700 leading-relaxed">
                  Halo, apakah produknya bisa dikirim ke Surabaya? Dan jam berapa tokonya tutup ya?
                </div>
              </div>

              {/* AI Bubble */}
              <div className="flex gap-2.5 max-w-[85%] ml-auto justify-end">
                <div className="rounded-2xl rounded-tr-none bg-indigo-600 px-3.5 py-2 text-xs text-white leading-relaxed">
                  Halo! Tentu bisa, kami melayani pengiriman ke seluruh Indonesia via JNE/J&T. Toko fisik kami tutup pukul 21:00 WIB. Ada yang bisa dibantu lagi? 😊
                </div>
                <div className="h-6 w-6 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-[10px] font-bold text-indigo-600 shrink-0">
                  <Bot className="h-3.5 w-3.5" />
                </div>
              </div>
            </div>

            {/* Integration sources */}
            <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Channel Terintegrasi</p>
                  <p className="text-xs font-semibold text-slate-700">Hubungkan dalam 1x klik</p>
                </div>
                <div className="flex gap-2 text-[9px] font-bold uppercase tracking-wider">
                  <span className="rounded-full border border-indigo-100 bg-indigo-50 px-2.5 py-0.5 text-[var(--color-brand)]">
                    WhatsApp AI
                  </span>
                  <span className="rounded-full border border-emerald-100 bg-emerald-50 px-2.5 py-0.5 text-emerald-600">
                    Live Chat
                  </span>
                  <span className="rounded-full border border-slate-200 bg-slate-100 px-2.5 py-0.5 text-slate-500">
                    Instagram
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Partners/Clients logos block below hero */}
      <div className="mx-auto max-w-7xl px-6 lg:px-8 mt-16 pt-10 border-t border-slate-200/60">
        <p className="text-center text-xs font-bold text-slate-400 uppercase tracking-widest">
          Dipercaya oleh 3.000+ UMKM dan brand terkemuka di Indonesia
        </p>
        <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-6 mt-6 opacity-45 grayscale">
          {PARTNER_LOGOS.map((name) => (
            <span key={name} className="text-sm font-extrabold text-slate-800 tracking-wider">
              {name}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
