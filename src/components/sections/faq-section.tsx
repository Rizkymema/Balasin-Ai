"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Card } from "@/components/ui/card";

const FAQS = [
  {
    question: "Apakah AI Balesin bisa berimprovisasi menjawab di luar data bisnis?",
    answer: "Tidak. AI Balesin dirancang dengan grounding ketat (RAG) hanya berdasarkan data profil, katalog produk, dan FAQ yang Anda masukkan di Knowledge Base. Jika AI ragu (di bawah confidence threshold), obrolan akan langsung dihentikan dan dialihkan ke admin.",
  },
  {
    question: "Bagaimana cara kerja serah terima (human handoff) ke admin?",
    answer: "Saat AI tidak mendeteksi jawaban yang cocok atau mendeteksi sentimen komplain dari pelanggan, status chat akan ditandai sebagai 'Handoff' di Inbox terpusat Anda. Admin akan menerima notifikasi suara/email untuk mengambil alih chat dan membalas secara manual.",
  },
  {
    question: "Apakah saya memerlukan server khusus untuk menyambungkan WhatsApp?",
    answer: "Tidak perlu. Balesin AI terhubung langsung via WhatsApp Cloud API resmi Facebook. Anda hanya perlu mendaftarkan nomor telepon bisnis Anda, memasukkan Phone ID & Token di panel Channels kami, dan webhook akan terkonfigurasi otomatis.",
  },
  {
    question: "Berapa lama masa uji coba gratis Balesin AI?",
    answer: "Kami memberikan masa uji coba gratis selama 14 hari dengan akses ke paket Starter secara penuh (termasuk 500 pesan AI dan WhatsApp Channel). Tanpa perlu kartu kredit saat pendaftaran.",
  },
];

export function FAQSection() {
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  const toggleOpen = (idx: number) => {
    setOpenIdx(openIdx === idx ? null : idx);
  };

  return (
    <section id="faq" className="py-24 lg:py-32 relative border-t border-[var(--color-border)] bg-[var(--color-bg)]">
      <div className="mx-auto max-w-3xl px-6 lg:px-8 text-center space-y-16 select-none">
        <div className="space-y-2.5 max-w-2xl mx-auto">
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--color-muted)]">
            Pertanyaan Umum
          </span>
          <h2 className="text-2xl sm:text-3.5xl font-bold text-[var(--color-text)] tracking-[-0.03em] leading-tight">
            Sering Ditanyakan (FAQ)
          </h2>
          <p className="text-xs sm:text-sm text-[var(--color-muted)] leading-relaxed font-normal">
            Temukan jawaban cepat mengenai keamanan data, setup WhatsApp, dan integrasi AI Balesin.
          </p>
        </div>

        <div className="space-y-4 text-left mt-16">
          {FAQS.map((faq, idx) => {
            const isOpen = openIdx === idx;
            return (
              <Card
                key={idx}
                className="p-0 overflow-hidden border border-[var(--color-border)] bg-[var(--color-surface)]/35 hover:bg-[var(--color-surface)]/60 rounded-2xl cursor-pointer transition-all duration-300"
                onClick={() => toggleOpen(idx)}
              >
                <div className="flex items-center justify-between p-6 font-semibold text-xs sm:text-sm text-[var(--color-text)] select-none">
                  <span className="tracking-tight">{faq.question}</span>
                  {isOpen ? (
                    <ChevronUp className="h-4.5 w-4.5 text-[var(--color-text)] shrink-0 ml-4" />
                  ) : (
                    <ChevronDown className="h-4.5 w-4.5 text-[var(--color-muted)] shrink-0 ml-4" />
                  )}
                </div>
                {isOpen && (
                  <div className="px-6 pb-6 text-xs text-[var(--color-muted)] leading-relaxed font-normal bg-transparent animate-fade-in">
                    {faq.answer}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
