"use client";

import { useState, type FormEvent, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Building2, ArrowRight } from "lucide-react";
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
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-bold font-heading text-white flex items-center gap-2">
          <Building2 className="h-5 w-5 text-cyan-400" />
          Detail Profil Bisnis Anda
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Beri tahu kami tentang bisnis Anda. Informasi ini membantu AI memahami konteks saat menjawab pelanggan.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-300">Nama Bisnis / Toko</label>
          <Input
            placeholder="Contoh: Toko Kopi Sejahtera, Bengkel Jaya Mandiri"
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            required
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-300">Industri / Kategori</label>
          <Select
            value={industry}
            onChange={(e) => setIndustry(e.target.value)}
            required
          >
            <option value="" disabled className="bg-[#091223]">Pilih Kategori Industri</option>
            <option value="F&B (Makanan & Minuman)" className="bg-[#091223]">F&B (Makanan & Minuman)</option>
            <option value="Jasa Otomotif / Bengkel" className="bg-[#091223]">Jasa Otomotif / Bengkel</option>
            <option value="Ritel & E-Commerce" className="bg-[#091223]">Ritel & E-Commerce</option>
            <option value="Jasa Profesional (Konsultan, Salon, dll)" className="bg-[#091223]">Jasa Profesional (Konsultan, Salon, dll)</option>
            <option value="Kesehatan / Apotek" className="bg-[#091223]">Kesehatan / Apotek</option>
            <option value="Lainnya" className="bg-[#091223]">Lainnya</option>
          </Select>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-300">
            Deskripsi Singkat Bisnis <span className="text-[10px] text-slate-500">(Opsional)</span>
          </label>
          <Textarea
            placeholder="Jelaskan produk utama Anda, jam buka, atau nilai unik dari bisnis Anda..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
          />
        </div>

        <div className="flex justify-end pt-2">
          <Button type="submit" className="px-6">
            <span className="flex items-center gap-1.5">
              Lanjutkan
              <ArrowRight className="h-4 w-4" />
            </span>
          </Button>
        </div>
      </form>
    </div>
  );
}
