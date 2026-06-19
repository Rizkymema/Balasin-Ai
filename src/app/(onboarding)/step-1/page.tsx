"use client";

import { useState, type FormEvent, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Building2, ArrowRight, Store, Briefcase, FileText } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

export default function Step1Page() {
  const router = useRouter();
  const [businessName, setBusinessName] = useState("");
  const [industry, setIndustry] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    // Muat data jika sebelumnya sudah diisi
    const cached = localStorage.getItem("onboarding_business");
    if (cached) {
      try {
        const data = JSON.parse(cached);
        setBusinessName(data.name || "");
        setIndustry(data.industry || "");
        setDescription(data.description || "");
      } catch (e) {}
    }
  }, []);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!businessName || !industry) return;

    localStorage.setItem(
      "onboarding_business",
      JSON.stringify({ name: businessName, industry, description })
    );

    router.push("/step-2");
  };

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h2 className="text-xl font-bold font-heading text-white flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400">
            <Building2 className="h-5 w-5" />
          </div>
          Detail Profil Bisnis Anda
        </h2>
        <p className="text-xs text-slate-400 mt-2 max-w-lg leading-relaxed">
          Beri tahu kami tentang bisnis Anda. Informasi ini membantu AI memahami konteks dasar serta kepribadian brand Anda saat berinteraksi dengan pelanggan.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <label className="text-[11px] font-bold text-slate-300 tracking-wider uppercase flex items-center gap-1.5">
            <Store className="h-3.5 w-3.5 text-cyan-400/80" />
            Nama Bisnis / Toko
          </label>
          <Input
            placeholder="Contoh: Toko Kopi Sejahtera, Bengkel Jaya Mandiri"
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            required
            className="bg-white/[0.02] border-white/8 hover:border-white/15 focus:border-cyan-400 focus:ring-cyan-400/25 transition duration-200"
          />
        </div>

        <div className="space-y-2">
          <label className="text-[11px] font-bold text-slate-300 tracking-wider uppercase flex items-center gap-1.5">
            <Briefcase className="h-3.5 w-3.5 text-cyan-400/80" />
            Industri / Kategori
          </label>
          <Select
            value={industry}
            onChange={(e) => setIndustry(e.target.value)}
            required
            className="bg-white/[0.02] border-white/8 hover:border-white/15 focus:border-cyan-400 focus:ring-cyan-400/25 transition duration-200"
          >
            <option value="" disabled className="bg-[#0a0e1c]">Pilih Kategori Industri</option>
            <option value="F&B (Makanan & Minuman)" className="bg-[#0a0e1c]">F&B (Makanan & Minuman)</option>
            <option value="Jasa Otomotif / Bengkel" className="bg-[#0a0e1c]">Jasa Otomotif / Bengkel</option>
            <option value="Ritel & E-Commerce" className="bg-[#0a0e1c]">Ritel & E-Commerce</option>
            <option value="Jasa Profesional (Konsultan, Salon, dll)" className="bg-[#0a0e1c]">Jasa Profesional (Konsultan, Salon, dll)</option>
            <option value="Kesehatan / Apotek" className="bg-[#0a0e1c]">Kesehatan / Apotek</option>
            <option value="Lainnya" className="bg-[#0a0e1c]">Lainnya</option>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-[11px] font-bold text-slate-300 tracking-wider uppercase flex items-center gap-1.5">
            <FileText className="h-3.5 w-3.5 text-cyan-400/80" />
            Deskripsi Singkat Bisnis <span className="text-[9px] text-slate-500 font-normal lowercase">(opsional)</span>
          </label>
          <Textarea
            placeholder="Jelaskan produk utama Anda, jam operasional, atau keunggulan unik dari bisnis Anda untuk melatih AI..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className="bg-white/[0.02] border-white/8 hover:border-white/15 focus:border-cyan-400 focus:ring-cyan-400/25 transition duration-200 resize-none"
          />
        </div>

        <div className="flex justify-end pt-3 border-t border-white/5">
          <Button type="submit" className="px-6 py-5.5 shadow-[0_4px_20px_rgba(0,210,255,0.15)] hover:shadow-[0_4px_25px_rgba(0,210,255,0.3)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-200">
            <span className="flex items-center gap-1.5 font-bold tracking-wide">
              Lanjutkan
              <ArrowRight className="h-4 w-4" />
            </span>
          </Button>
        </div>
      </form>
    </div>
  );
}
