"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { BookOpen, Plus, Trash2, ArrowRight, ArrowLeft } from "lucide-react";
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
    // Validasi input FAQ tidak boleh kosong
    const validFaqs = faqs.filter(f => f.question.trim() && f.answer.trim());
    if (validFaqs.length === 0) {
      alert("Masukkan setidaknya 1 FAQ yang valid untuk melatih AI.");
      return;
    }
    localStorage.setItem("onboarding_faqs", JSON.stringify(validFaqs));
    router.push("/step-4");
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-bold font-heading text-white flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-cyan-400" />
          Setup Knowledge Base Awal
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Masukkan beberapa Tanya-Jawab (FAQ) umum. Data ini akan menjadi basis pengetahuan bagi AI untuk menjawab pelanggan.
        </p>
      </div>

      <div className="space-y-4 max-h-[360px] overflow-y-auto pr-1 custom-scrollbar mb-6">
        {faqs.map((faq, idx) => (
          <div
            key={faq.id}
            className="p-4 rounded-xl border border-white/8 bg-white/3 space-y-3 relative group"
          >
            <div className="flex justify-between items-center">
              <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">
                FAQ #{idx + 1}
              </span>
              {faqs.length > 1 && (
                <button
                  type="button"
                  onClick={() => handleRemove(faq.id)}
                  className="text-slate-400 hover:text-red-400 transition p-1 rounded hover:bg-white/5"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>

            <div className="space-y-2">
              <Input
                placeholder="Pertanyaan (contoh: Jam berapa toko buka?)"
                value={faq.question}
                onChange={(e) => handleUpdate(faq.id, "question", e.target.value)}
                required
              />
              <Textarea
                placeholder="Jawaban (contoh: Toko buka setiap hari pukul 09.00 - 21.00 WIB.)"
                value={faq.answer}
                onChange={(e) => handleUpdate(faq.id, "answer", e.target.value)}
                rows={2}
                required
              />
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={handleAdd}
        className="flex items-center gap-1.5 text-xs font-semibold text-cyan-400 hover:text-cyan-300 transition mb-6"
      >
        <Plus className="h-4 w-4" />
        Tambah FAQ Baru
      </button>

      <div className="flex items-center justify-between border-t border-white/8 pt-4">
        <Button
          variant="secondary"
          onClick={() => router.push("/step-2")}
          className="px-5"
        >
          <span className="flex items-center gap-1.5">
            <ArrowLeft className="h-4 w-4" />
            Kembali
          </span>
        </Button>

        <Button
          onClick={handleNext}
          className="px-5"
        >
          <span className="flex items-center gap-1.5">
            Lanjutkan
            <ArrowRight className="h-4 w-4" />
          </span>
        </Button>
      </div>
    </div>
  );
}
