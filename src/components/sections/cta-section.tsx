import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CTASection() {
  return (
    <section id="cta" className="py-28 lg:py-36 relative overflow-hidden border-t border-[var(--color-border)] bg-[var(--color-bg)]">
      {/* Subtle radial backdrop for the CTA */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom,rgba(10,132,255,0.08),transparent_70%)] pointer-events-none" />

      <div className="mx-auto max-w-5xl px-6 lg:px-8 text-center relative z-10">
        <div className="rounded-3xl border border-[var(--color-brand)]/20 bg-gradient-to-br from-[var(--color-surface)] to-[var(--color-brand-blue)]/10 p-12 md:p-20 space-y-8 max-w-4xl mx-auto hover:border-[var(--color-brand)]/35 transition-all duration-300 select-none shadow-[0_20px_50px_rgba(10,132,255,0.03)]">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-brand)] text-[var(--color-bg)] shadow-[0_0_15px_rgba(10,132,255,0.3)]">
            <Sparkles className="h-5 w-5" />
          </div>

          <div className="space-y-4 max-w-2xl mx-auto">
            <h2 className="text-3xl sm:text-4.5xl font-bold text-[var(--color-text)] tracking-[-0.03em] leading-tight">
              Siap Mengotomatiskan Layanan Pelanggan Toko Anda?
            </h2>
            <p className="text-xs sm:text-sm text-[var(--color-muted)] leading-relaxed font-normal">
              Bergabunglah dengan ratusan UMKM Indonesia yang menggunakan Balesin AI untuk membalas chat secara cerdas, cepat, dan 24 jam penuh tanpa henti.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-4">
            <Link href="/register" className="w-full sm:w-auto">
              <Button className="w-full sm:w-auto shadow-[0_4px_20px_rgba(10,132,255,0.25)] hover:shadow-[0_4px_30px_rgba(10,132,255,0.4)] transition-all duration-300">
                Mulai Uji Coba Gratis
                <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </Button>
            </Link>
            <Link href="#pricing" className="w-full sm:w-auto">
              <Button variant="secondary" className="w-full sm:w-auto border-[var(--color-border)] hover:bg-[var(--color-surface-hover)]">
                Lihat Skema Harga
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
