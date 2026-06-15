"use client";

import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CTASection() {
  return (
    <section id="cta" className="py-24 relative overflow-hidden border-t border-[var(--color-border)]">
      <div className="mx-auto max-w-5xl px-6 lg:px-8 text-center relative z-10">
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-strong)] p-8 md:p-14 space-y-6 max-w-4xl mx-auto hover:border-[var(--color-border-hover)] transition-all">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-brand)]/10 text-[var(--color-brand)] border border-[var(--color-brand)]/25">
            <Sparkles className="h-5 w-5" />
          </div>

          <div className="space-y-3 max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold text-white md:text-4xl tracking-tight">
              Siap Mengotomatiskan Layanan Pelanggan Toko Anda?
            </h2>
            <p className="text-xs md:text-sm text-[var(--color-muted)] leading-relaxed">
              Bergabunglah dengan ratusan UMKM Indonesia yang menggunakan Balesin AI untuk membalas chat secara cerdas, cepat, dan 24 jam penuh tanpa henti.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link href="/register">
              <Button className="px-8 py-3 font-bold">
                Mulai Uji Coba Gratis
                <ArrowRight className="ml-1.5 h-4 w-4" />
              </Button>
            </Link>
            <Link href="#pricing">
              <Button variant="secondary" className="px-8 py-3">
                Lihat Skema Harga
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
