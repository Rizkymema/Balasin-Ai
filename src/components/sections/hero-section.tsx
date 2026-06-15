import { ArrowRight, Bot, MessageSquare, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { heroMetrics } from "@/constants/product";
import { siteConfig } from "@/constants/site";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden py-12 lg:py-20">
      <div className="mx-auto grid max-w-7xl gap-12 px-6 lg:grid-cols-[1.1fr_0.9fr] lg:px-8">
        <div className="flex flex-col justify-center space-y-8">
          <div className="inline-flex max-w-fit items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-3.5 py-1.5 text-xs font-semibold text-[var(--color-muted)]">
            <ShieldCheck className="h-4 w-4 text-[var(--color-success)]" />
            Otomasi Terkontrol dengan Human Handoff
          </div>

          <div className="space-y-6">
            <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl leading-[1.15]">
              Satu dashboard untuk balas customer lebih cepat, lebih aman, dan lebih rapi.
            </h1>
            <p className="max-w-2xl text-base leading-relaxed text-[var(--color-muted)] sm:text-lg">
              {siteConfig.tagline} Dirancang untuk UMKM Indonesia yang ingin AI
              membantu operasional customer service tanpa kehilangan kontrol.
            </p>
          </div>

          <div className="flex flex-col gap-3.5 sm:flex-row">
            <Button className="px-7 py-3">
              Mulai Uji Coba Gratis
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button variant="secondary" className="px-7 py-3">
              Dokumentasi Arsitektur
            </Button>
          </div>

          {/* Redesigned metrics as a clean, integrated grid, removing SaaS big-number template */}
          <div className="border-t border-[var(--color-border)] pt-8">
            <div className="grid gap-6 sm:grid-cols-3">
              {heroMetrics.map((metric) => (
                <div key={metric.label} className="space-y-1.5">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-muted)]">
                    {metric.label}
                  </p>
                  <p className="text-2xl font-bold text-white tracking-tight">
                    {metric.value}
                  </p>
                  <p className="text-xs text-[var(--color-muted)] leading-relaxed">
                    {metric.detail}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Realistic CRM Dashboard preview - solid layout, no blurs or neon colors */}
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-strong)] p-0 overflow-hidden self-center shadow-[0_20px_50px_rgba(0,0,0,0.4)]">
          <div className="border-b border-[var(--color-border)] px-6 py-4.5 bg-[var(--color-surface)]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-muted)]">
                  Operational Overview
                </p>
                <p className="mt-0.5 text-lg font-bold text-white tracking-tight">
                  Dashboard Utama
                </p>
              </div>
              <div className="rounded border border-[var(--color-success)]/20 bg-[var(--color-success)]/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[var(--color-success)]">
                Live
              </div>
            </div>
          </div>

          <div className="grid gap-4 p-6 bg-[var(--color-surface-strong)]">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
                <div className="flex items-center gap-3">
                  <div className="rounded bg-[var(--color-brand)]/10 p-2.5 text-[var(--color-brand)] border border-[var(--color-brand)]/20">
                    <MessageSquare className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs text-[var(--color-muted)]">Kotak Masuk</p>
                    <p className="text-base font-bold text-white">128 Chat Aktif</p>
                  </div>
                </div>
                <div className="mt-4 flex items-end justify-between border-t border-[var(--color-border)] pt-3.5">
                  <div>
                    <p className="text-[10px] text-[var(--color-muted)]">Butuh Handoff</p>
                    <p className="text-sm font-bold text-[var(--color-warning)]">14 Percakapan</p>
                  </div>
                  <span className="rounded bg-[var(--color-warning)]/10 px-2 py-0.5 text-[10px] font-bold text-[var(--color-warning)] border border-[var(--color-warning)]/20">
                    Pending
                  </span>
                </div>
              </div>

              <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
                <div className="flex items-center gap-3">
                  <div className="rounded bg-[var(--color-success)]/10 p-2.5 text-[var(--color-success)] border border-[var(--color-success)]/20">
                    <Bot className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs text-[var(--color-muted)]">Mode AI Agent</p>
                    <p className="text-base font-bold text-white">Balanced Safety</p>
                  </div>
                </div>
                <div className="mt-4 space-y-2 border-t border-[var(--color-border)] pt-3.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[var(--color-muted)]">Confidence threshold</span>
                    <span className="font-bold text-white">80%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-[var(--color-surface-strong)] overflow-hidden">
                    <div className="h-full w-4/5 rounded-full bg-[var(--color-brand)]" />
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <p className="text-xs text-[var(--color-muted)]">Rollout Integrasi</p>
                  <p className="text-sm font-bold text-white">Cakupan MVP Roadmap</p>
                </div>
                <div className="flex flex-wrap gap-2 text-[10px] font-bold uppercase tracking-wider">
                  <span className="rounded border border-[var(--color-brand)]/20 bg-[var(--color-brand)]/10 px-2 py-0.5 text-[var(--color-brand)]">
                    Website Chat
                  </span>
                  <span className="rounded border border-[var(--color-success)]/20 bg-[var(--color-success)]/10 px-2 py-0.5 text-[var(--color-success)]">
                    WhatsApp
                  </span>
                  <span className="rounded border border-[var(--color-border)] bg-[var(--color-surface-strong)] px-2 py-0.5 text-[var(--color-muted)]">
                    Instagram next
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
