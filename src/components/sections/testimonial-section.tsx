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
    <section id="testimonials" className="py-20 relative border-t border-[var(--color-border)]">
      <div className="mx-auto max-w-7xl px-6 lg:px-8 text-center space-y-12">
        <div className="space-y-3 max-w-2xl mx-auto">
          <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-brand)]">
            Testimoni Mitra
          </span>
          <h2 className="text-3xl font-bold text-white md:text-4xl tracking-tight">
            Cerita Sukses dari Pengguna Balesin AI
          </h2>
          <p className="text-sm text-[var(--color-muted)] leading-relaxed">
            Lihat bagaimana pemilik bisnis dan operasional UMKM meningkatkan konversi penjualan.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
          {TESTIMONIALS.map((test, idx) => (
            <Card key={idx} className="flex flex-col justify-between hover:border-[var(--color-border-hover)] transition-all">
              <p className="text-xs text-slate-300 italic leading-relaxed font-medium">
                &ldquo;{test.quote}&rdquo;
              </p>
              <div className="flex items-center gap-3 mt-6">
                <div className="h-9 w-9 rounded-full bg-[var(--color-surface-hover)] border border-[var(--color-border)] flex items-center justify-center font-bold text-xs text-[var(--color-brand)]">
                  {test.avatar}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">{test.author}</h4>
                  <p className="text-[10px] text-[var(--color-muted)] font-semibold">{test.role}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
