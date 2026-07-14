"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Search, Info } from "lucide-react";
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
  const [searchQuery, setSearchQuery] = useState("");

  const toggleOpen = (idx: number) => {
    setOpenIdx(openIdx === idx ? null : idx);
  };

  const filteredFaqs = FAQS.filter(
    (faq) =>
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <section id="faq" className="py-24 lg:py-32 relative border-t border-[var(--color-border)] bg-[var(--color-bg)]">
      <div className="mx-auto max-w-3xl px-6 lg:px-8 text-center space-y-12 select-none">
        
        <div className="space-y-4 max-w-xl mx-auto">
          <h2 className="text-2xl sm:text-3.5xl font-bold text-[var(--color-text)] tracking-[-0.03em] leading-tight">
            Sering Ditanyakan (FAQ)
          </h2>
          <p className="text-xs sm:text-sm text-[var(--color-muted)] leading-relaxed font-normal">
            Temukan jawaban cepat mengenai keamanan data, setup WhatsApp, dan integrasi AI Balesin.
          </p>
        </div>

        {/* Live Search Box */}
        <div className="max-w-md mx-auto relative select-none">
          <span className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-[var(--color-muted)]" />
          </span>
          <input
            type="text"
            placeholder="Cari pertanyaan atau kata kunci..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setOpenIdx(null); // Close open accordions on search
            }}
            className="w-full pl-11 pr-5 py-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]/45 text-xs text-[var(--color-text)] placeholder-[var(--color-muted)] focus:outline-none focus:border-[var(--color-brand)] focus:ring-1 focus:ring-[var(--color-brand)] transition-all duration-200"
          />
        </div>

        {/* FAQ Accordion List */}
        <div className="space-y-4 text-left mt-8">
          {filteredFaqs.length > 0 ? (
            filteredFaqs.map((faq, idx) => {
              const isOpen = openIdx === idx;
              return (
                <Card
                  key={idx}
                  className="p-0 overflow-hidden border border-[var(--color-border)] bg-[var(--color-surface)]/30 hover:bg-[var(--color-surface)]/50 rounded-2xl cursor-pointer transition-all duration-300"
                  onClick={() => toggleOpen(idx)}
                >
                  <div className="flex items-center justify-between p-6 font-semibold text-xs sm:text-sm text-[var(--color-text)] select-none">
                    <span className="tracking-tight">{faq.question}</span>
                    {isOpen ? (
                      <ChevronUp className="h-4.5 w-4.5 text-[var(--color-brand)] shrink-0 ml-4" />
                    ) : (
                      <ChevronDown className="h-4.5 w-4.5 text-[var(--color-muted)] shrink-0 ml-4" />
                    )}
                  </div>
                  {isOpen && (
                    <div className="px-6 pb-6 text-xs text-[var(--color-muted)] leading-relaxed font-normal bg-transparent animate-fade-in border-t border-[var(--color-border)]/20 pt-4">
                      {faq.answer}
                    </div>
                  )}
                </Card>
              );
            })
          ) : (
            <div className="text-center py-12 space-y-3 rounded-2xl border border-dashed border-[var(--color-border)] bg-[var(--color-surface)]/10">
              <Info className="h-8 w-8 text-[var(--color-muted)] mx-auto opacity-60" />
              <p className="text-xs text-[var(--color-muted)]">
                Tidak ada hasil pencarian untuk &ldquo;{searchQuery}&rdquo;
              </p>
            </div>
          )}
        </div>

      </div>
    </section>
  );
}
