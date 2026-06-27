import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CTASection() {
  return (
    <section id="cta" className="py-28 lg:py-36 relative overflow-hidden border-t border-[var(--color-border)] bg-[var(--color-bg)]">
      <div className="mx-auto max-w-5xl px-6 lg:px-8 text-center relative z-10">
        <div className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)]/20 p-12 md:p-20 space-y-8 max-w-4xl mx-auto hover:bg-[var(--color-surface)]/30 transition-all duration-300 select-none">
          <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-full bg-[var(--color-surface)] text-[var(--color-text)] border border-[var(--color-border)]">
            <Sparkles className="h-4.5 w-4.5" />
          </div>

          <div className="space-y-3 max-w-2xl mx-auto">
            <h2 className="text-2xl sm:text-3.5xl font-bold text-[var(--color-text)] tracking-[-0.03em] leading-tight">
              Siap Mengotomatiskan Layanan Pelanggan Toko Anda?
            </h2>
            <p className="text-xs sm:text-sm text-[var(--color-muted)] leading-relaxed font-normal">
              Bergabunglah dengan ratusan UMKM Indonesia yang menggunakan Balesin AI untuk membalas chat secara cerdas, cepat, dan 24 jam penuh tanpa henti.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
            <Link href="/register" className="w-full sm:w-auto">
              <Button className="w-full sm:w-auto">
                Mulai Uji Coba Gratis
                <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </Button>
            </Link>
            <Link href="#pricing" className="w-full sm:w-auto">
              <Button variant="secondary" className="w-full sm:w-auto">
                Lihat Skema Harga
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
