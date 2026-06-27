"use client";

import { Card } from "@/components/ui/card";

const TESTIMONIALS = [
  {
    quote: "Sangat membantu bengkel kami! AI Balesin bisa menjawab pertanyaan harga oli, alamat, dan booking antrean secara otomatis saat kami sedang sibuk melayani pelanggan.",
    author: "Rahmat Hidayat",
    role: "Pemilik Rahmat Motor",
    avatar: "RH",
  },
  {
    quote: "Dulu kami sering kehilangan prospek karena telat balas chat WhatsApp malam-malam. Sekarang, AI menjawab semuanya 24 jam penuh berdasarkan FAQ produk kami.",
    author: "Dewi Lestari",
    role: "Founder Hijab Chic",
    avatar: "DL",
  },
  {
    quote: "Fitur human handoff-nya sangat mulus. AI menjawab pertanyaan umum, dan saat ada komplain serius, admin langsung mengambil alih tanpa pelanggan sadar.",
    author: "Hendra Wijaya",
    role: "Operational Manager Kopi Selesa",
    avatar: "HW",
  },
];

export function TestimonialSection() {
  return (
    <section id="testimonials" className="py-24 lg:py-32 relative border-t border-[var(--color-border)] bg-[var(--color-bg)]">
      <div className="mx-auto max-w-7xl px-6 lg:px-8 text-center space-y-16 select-none">
        <div className="space-y-2.5 max-w-2xl mx-auto">
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--color-muted)]">
            Testimoni Mitra
          </span>
          <h2 className="text-2xl sm:text-3.5xl font-bold text-[var(--color-text)] tracking-[-0.03em] leading-tight">
            Cerita Sukses dari Pengguna Balesin AI
          </h2>
          <p className="text-xs sm:text-sm text-[var(--color-muted)] leading-relaxed font-normal">
            Lihat bagaimana pemilik bisnis dan operasional UMKM meningkatkan konversi penjualan.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left mt-16">
          {TESTIMONIALS.map((test, idx) => (
            <Card key={idx} className="flex flex-col justify-between p-8 bg-[var(--color-surface)]/30 border border-[var(--color-border)] hover:bg-[var(--color-surface)] hover:border-[var(--color-border-hover)] rounded-2xl transition-all duration-300">
              <p className="text-xs text-[var(--color-text)] leading-relaxed font-normal">
                &ldquo;{test.quote}&rdquo;
              </p>
              <div className="flex items-center gap-3 mt-8 pt-6 border-t border-[var(--color-border)]/50">
                <div className="h-8 w-8 rounded-full bg-[var(--color-surface-hover)] border border-[var(--color-border)] flex items-center justify-center font-bold text-[10px] text-[var(--color-text)]">
                  {test.avatar}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[var(--color-text)]">{test.author}</h4>
                  <p className="text-[10px] text-[var(--color-muted)] font-normal mt-0.5">{test.role}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
