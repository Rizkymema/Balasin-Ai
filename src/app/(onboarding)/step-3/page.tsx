"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { BookOpen, Plus, Trash2, ArrowRight, ArrowLeft, HelpCircle, MessageSquare } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

interface FAQItem {
  id: number;
  question: string;
  answer: string;
}

export default function Step3Page() {
  const router = useRouter();
  const [faqs, setFaqs] = useState<FAQItem[]>([
    { id: 1, question: "Apakah bisa kirim ke luar kota/daerah?", answer: "Ya, kami melayani pengiriman ke seluruh Indonesia menggunakan jasa kurir JNE, J&T, dan Sicepat." },
    { id: 2, question: "Berapa lama proses pengerjaan/pengiriman?", answer: "Untuk produk ready stock dikirim di hari yang sama. Untuk pre-order memerlukan waktu 2-3 hari kerja." },
  ]);

  useEffect(() => {
    const cached = localStorage.getItem("onboarding_faqs");
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (parsed.length > 0) setFaqs(parsed);
      } catch (e) {}
    }
  }, []);

  const handleAdd = () => {
    setFaqs([...faqs, { id: Date.now(), question: "", answer: "" }]);
  };

  const handleRemove = (id: number) => {
    if (faqs.length <= 1) return;
    setFaqs(faqs.filter((faq) => faq.id !== id));
  };

  const handleUpdate = (id: number, field: "question" | "answer", value: string) => {
    setFaqs(
      faqs.map((faq) => (faq.id === id ? { ...faq, [field]: value } : faq))
    );
  };

  const handleNext = () => {
    const validFaqs = faqs.filter(f => f.question.trim() && f.answer.trim());
    if (validFaqs.length === 0) {
      alert("Masukkan setidaknya 1 FAQ yang valid untuk melatih AI.");
      return;
    }
    localStorage.setItem("onboarding_faqs", JSON.stringify(validFaqs));
    router.push("/step-4");
  };

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <h2 className="text-xl font-bold font-heading text-white flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400">
            <BookOpen className="h-5 w-5" />
          </div>
          Setup Knowledge Base Awal
        </h2>
        <p className="text-xs text-slate-400 mt-2 max-w-lg leading-relaxed">
          Masukkan beberapa Tanya-Jawab (FAQ) umum. Data ini langsung diolah menjadi basis pengetahuan awal agar AI memahami respon operasional bisnis Anda.
        </p>
      </div>

      <div className="space-y-4 max-h-[340px] overflow-y-auto pr-2 custom-scrollbar mb-5">
        {faqs.map((faq, idx) => (
          <div
            key={faq.id}
            className="p-5 rounded-xl border border-white/8 bg-white/[0.01] hover:bg-white/[0.02] space-y-4 relative group transition-all duration-200"
          >
            <div className="flex justify-between items-center border-b border-white/5 pb-2">
              <span className="text-[10px] uppercase tracking-wider text-slate-400 font-extrabold flex items-center gap-1.5">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-cyan-400" />
                FAQ #{idx + 1}
              </span>
              {faqs.length > 1 && (
                <button
                  type="button"
                  onClick={() => handleRemove(faq.id)}
                  className="text-slate-400 hover:text-red-400 transition p-1.5 rounded hover:bg-white/5 cursor-pointer"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>

            <div className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-300 tracking-wider uppercase flex items-center gap-1">
                  <HelpCircle className="h-3.5 w-3.5 text-cyan-400/80" />
                  Pertanyaan
                </label>
                <Input
                  placeholder="Pertanyaan (contoh: Jam berapa toko buka?)"
                  value={faq.question}
                  onChange={(e) => handleUpdate(faq.id, "question", e.target.value)}
                  required
                  className="bg-white/[0.01] border-white/8 hover:border-white/12 focus:border-cyan-400/80 transition duration-200"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-300 tracking-wider uppercase flex items-center gap-1">
                  <MessageSquare className="h-3.5 w-3.5 text-emerald-400/80" />
                  Jawaban AI
                </label>
                <Textarea
                  placeholder="Jawaban (contoh: Toko buka setiap hari pukul 09.00 - 21.00 WIB.)"
                  value={faq.answer}
                  onChange={(e) => handleUpdate(faq.id, "answer", e.target.value)}
                  rows={2}
                  required
                  className="bg-white/[0.01] border-white/8 hover:border-white/12 focus:border-cyan-400/80 transition duration-200 resize-none"
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={handleAdd}
        className="flex items-center gap-1.5 text-xs font-bold text-cyan-400 hover:text-cyan-300 transition-colors mb-6 cursor-pointer bg-cyan-500/5 hover:bg-cyan-500/10 px-3 py-2 rounded-lg border border-cyan-500/10"
      >
        <Plus className="h-4 w-4" />
        Tambah FAQ Baru
      </button>

      <div className="flex items-center justify-between border-t border-white/5 pt-5">
        <Button
          variant="secondary"
          onClick={() => router.push("/step-2")}
          className="px-5 py-5 hover:bg-white/5 transition-all"
        >
          <span className="flex items-center gap-1.5 font-bold tracking-wide">
            <ArrowLeft className="h-4 w-4" />
            Kembali
          </span>
        </Button>

        <Button
          onClick={handleNext}
          className="px-6 py-5.5 shadow-[0_4px_20px_rgba(0,210,255,0.15)] hover:shadow-[0_4px_25px_rgba(0,210,255,0.3)] transition-all duration-200"
        >
          <span className="flex items-center gap-1.5 font-bold tracking-wide">
            Lanjutkan
            <ArrowRight className="h-4 w-4" />
          </span>
        </Button>
      </div>
    </div>
  );
}
