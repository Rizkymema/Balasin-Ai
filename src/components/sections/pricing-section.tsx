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
    <section id="pricing" className="py-20 relative border-t border-[var(--color-border)]">
      <div className="mx-auto max-w-7xl px-6 lg:px-8 text-center space-y-12">
        <div className="space-y-3 max-w-2xl mx-auto">
          <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-brand)]">
            Harga Transparan
          </span>
          <h2 className="text-3xl font-bold text-white md:text-4xl tracking-tight">
            Pilih Paket yang Sesuai dengan Skala Bisnis Anda
          </h2>
          <p className="text-sm text-[var(--color-muted)] leading-relaxed">
            Semua paket dilengkapi dengan masa uji coba gratis 14 hari. Batalkan kapan saja.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left items-stretch">
          {PLANS.map((plan, idx) => (
            <Card
              key={idx}
              className={`p-6 md:p-8 flex flex-col justify-between relative transition-all duration-200 hover:border-[var(--color-border-hover)] ${
                plan.popular ? "border-[var(--color-brand)] ring-1 ring-[var(--color-brand)]/20 bg-[var(--color-surface)]" : ""
              }`}
            >
              {plan.popular && (
                <span className="absolute top-0 right-6 -translate-y-1/2 bg-[var(--color-brand)] text-slate-950 text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded">
                  Paling Populer
                </span>
              )}
              <div className="space-y-6">
                <div>
                  <h3 className="text-base font-bold text-white tracking-tight">{plan.name}</h3>
                  <p className="text-xs text-[var(--color-muted)] mt-1.5 leading-relaxed">{plan.description}</p>
                </div>
                <div className="flex items-baseline">
                  <span className="text-3xl font-extrabold text-white tracking-tight">{plan.price}</span>
                  <span className="text-xs text-[var(--color-muted)] font-medium ml-1.5">{plan.period}</span>
                </div>
                <div className="h-px bg-[var(--color-border)]" />
                <ul className="space-y-3.5 text-xs text-slate-300 font-medium">
                  {plan.features.map((feat, fIdx) => (
                    <li key={fIdx} className="flex items-start gap-2.5">
                      <Check className="h-4 w-4 text-[var(--color-brand)] shrink-0 mt-0.5" />
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
