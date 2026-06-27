"use client";

import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const PLANS = [
  {
    name: "Starter",
    price: "Rp 150K",
    period: "/ bulan",
    description: "Cocok untuk UMKM pemula yang ingin mengotomatiskan chat pertama.",
    features: [
      "1 WhatsApp Business Channel",
      "500 percakapan AI / bulan",
      "Knowledge base basic (10 FAQ)",
      "1 Admin / CS operator",
      "Widget Web Chat gratis",
    ],
    cta: "Mulai Uji Coba Gratis",
    popular: false,
  },
  {
    name: "Pro",
    price: "Rp 390K",
    period: "/ bulan",
    description: "Sangat direkomendasikan untuk bisnis berkembang dengan banyak pesanan.",
    features: [
      "Omnichannel (WhatsApp + Web Chat)",
      "3,000 percakapan AI / bulan",
      "Knowledge base unlimited",
      "3 Admin / CS operator",
      "Analisis performa & CSAT",
      "Eskalasi rules & human takeover",
    ],
    cta: "Coba Paket Pro",
    popular: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    description: "Kustomisasi penuh untuk korporasi dan platform e-commerce besar.",
    features: [
      "Saluran khusus & nomor tak terbatas",
      "Percakapan AI tak terbatas",
      "Grounding dokumen PDF besar",
      "Operator CS tak terbatas",
      "Integrasi API & Webhook kustom",
      "Dukungan SLA 24/7",
    ],
    cta: "Hubungi Penjualan",
    popular: false,
  },
];

export function PricingSection() {
  return (
    <section id="pricing" className="py-24 lg:py-32 relative border-t border-[var(--color-border)] bg-[var(--color-bg)]">
      <div className="mx-auto max-w-7xl px-6 lg:px-8 text-center space-y-16 select-none">
        <div className="space-y-2.5 max-w-2xl mx-auto">
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--color-muted)]">
            Harga Transparan
          </span>
          <h2 className="text-2xl sm:text-3.5xl font-bold text-[var(--color-text)] tracking-[-0.03em] leading-tight">
            Pilih Paket yang Sesuai dengan Skala Bisnis Anda
          </h2>
          <p className="text-xs sm:text-sm text-[var(--color-muted)] leading-relaxed font-normal">
            Semua paket dilengkapi dengan masa uji coba gratis 14 hari. Batalkan kapan saja.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left items-stretch mt-16">
          {PLANS.map((plan, idx) => (
            <Card
              key={idx}
              className={`p-8 md:p-10 flex flex-col justify-between relative transition-all duration-300 border rounded-2xl ${
                plan.popular
                  ? "border-2 border-[var(--color-text)] bg-[var(--color-surface)] shadow-md"
                  : "border-[var(--color-border)] bg-[var(--color-surface)]/30 hover:border-[var(--color-border-hover)] hover:bg-[var(--color-surface)]/50"
              }`}
            >
              {plan.popular && (
                <span className="absolute top-0 right-8 -translate-y-1/2 bg-[var(--color-text)] text-[var(--color-bg)] text-[9px] font-bold uppercase tracking-widest px-3 py-1 rounded-full">
                  Paling Populer
                </span>
              )}
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-bold text-[var(--color-text)] tracking-tight">{plan.name}</h3>
                  <p className="text-xs text-[var(--color-muted)] mt-2 leading-relaxed font-normal">{plan.description}</p>
                </div>
                <div className="flex items-baseline">
                  <span className="text-2xl sm:text-3.5xl font-bold text-[var(--color-text)] tracking-tight">{plan.price}</span>
                  <span className="text-xs text-[var(--color-muted)] font-medium ml-1.5">{plan.period}</span>
                </div>
                <div className="h-[0.5px] bg-[var(--color-border)]" />
                <ul className="space-y-4 text-xs text-[var(--color-muted)] font-normal">
                  {plan.features.map((feat, fIdx) => (
                    <li key={fIdx} className="flex items-start gap-2.5">
                      <Check className="h-4 w-4 text-[var(--color-text)] shrink-0 mt-0.5" />
                      <span className="leading-normal">{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="pt-8">
                <Button className="w-full" variant={plan.popular ? "primary" : "secondary"}>
                  {plan.cta}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
