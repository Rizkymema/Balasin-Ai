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
    <section id="faq" className="py-20 relative border-t border-[var(--color-border)]">
      <div className="mx-auto max-w-4xl px-6 lg:px-8 text-center space-y-12">
        <div className="space-y-3 max-w-2xl mx-auto">
          <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-brand)]">
            Pertanyaan Umum
          </span>
          <h2 className="text-3xl font-bold text-[var(--color-text)] md:text-4xl tracking-tight">
            Sering Ditanyakan (FAQ)
          </h2>
          <p className="text-sm text-[var(--color-muted)] leading-relaxed">
            Temukan jawaban cepat mengenai keamanan data, setup WhatsApp, dan integrasi AI Balesin.
          </p>
        </div>

        <div className="space-y-4 text-left">
          {FAQS.map((faq, idx) => {
            const isOpen = openIdx === idx;
            return (
              <Card
                key={idx}
                className="p-0 overflow-hidden transition-all duration-200 cursor-pointer hover:border-[var(--color-border-hover)]"
                onClick={() => toggleOpen(idx)}
              >
                <div className="flex items-center justify-between p-5 font-bold text-xs md:text-sm text-[var(--color-text)] select-none">
                  <span className="tracking-tight">{faq.question}</span>
                  {isOpen ? (
                    <ChevronUp className="h-4.5 w-4.5 text-[var(--color-brand)] shrink-0 ml-4" />
                  ) : (
                    <ChevronDown className="h-4.5 w-4.5 text-[var(--color-muted)] shrink-0 ml-4" />
                  )}
                </div>
                {isOpen && (
                  <div className="p-5 pt-0 text-xs text-[var(--color-muted)] leading-relaxed font-medium border-t border-[var(--color-border)] bg-[var(--color-surface-hover)]/30 animate-fade-in">
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
