"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Users, Plus, Trash2, ArrowRight, ArrowLeft, Mail, ShieldAlert } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

interface InviteItem {
  id: number;
  email: string;
  role: string;
}

export default function Step4Page() {
  const router = useRouter();
  const [invites, setInvites] = useState<InviteItem[]>([
    { id: 1, email: "", role: "Operator" },
  ]);

  const handleAdd = () => {
    setInvites([...invites, { id: Date.now(), email: "", role: "Operator" }]);
  };

  const handleRemove = (id: number) => {
    setInvites(invites.filter((inv) => inv.id !== id));
  };

  const handleUpdate = (id: number, field: "email" | "role", value: string) => {
    setInvites(
      invites.map((inv) => (inv.id === id ? { ...inv, [field]: value } : inv))
    );
  };

  const handleNext = () => {
    // Saring email yang diisi
    const filledInvites = invites.filter((inv) => inv.email.trim());
    if (filledInvites.length > 0) {
      localStorage.setItem("onboarding_invites", JSON.stringify(filledInvites));
    }
    router.push("/complete");
  };

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <h2 className="text-xl font-bold font-heading text-white flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400">
            <Users className="h-5 w-5" />
          </div>
          Undang Anggota Tim
        </h2>
        <p className="text-xs text-slate-400 mt-2 max-w-lg leading-relaxed">
          Undang admin atau agen customer service Anda agar dapat berkolaborasi menangani chat yang masuk. Langkah ini dapat dilewati jika belum diperlukan.
        </p>
      </div>

      <div className="space-y-4 mb-6 max-h-[280px] overflow-y-auto pr-2 custom-scrollbar">
        {invites.map((inv, idx) => (
          <div key={inv.id} className="flex gap-3 items-end p-4 rounded-xl border border-white/6 bg-white/[0.01] hover:bg-white/[0.02] transition-colors duration-200">
            <div className="flex-1 space-y-1.5">
              <label className="text-[10px] font-bold text-slate-300 tracking-wider uppercase flex items-center gap-1">
                <Mail className="h-3.5 w-3.5 text-cyan-400/80" />
                Email Rekan Kerja
              </label>
              <Input
                type="email"
                placeholder="nama.rekan@perusahaan.com"
                value={inv.email}
                onChange={(e) => handleUpdate(inv.id, "email", e.target.value)}
                className="bg-white/[0.01] border-white/8 hover:border-white/12 focus:border-cyan-400/80 transition duration-200"
              />
            </div>
            
            <div className="w-36 space-y-1.5">
              <label className="text-[10px] font-bold text-slate-300 tracking-wider uppercase flex items-center gap-1">
                <ShieldAlert className="h-3.5 w-3.5 text-cyan-400/80" />
                Peran
              </label>
              <Select
                value={inv.role}
                onChange={(e) => handleUpdate(inv.id, "role", e.target.value)}
                className="bg-[#0a0e1c] border-white/8 hover:border-white/12 focus:border-cyan-400/80 transition duration-200"
              >
                <option value="Operator" className="bg-[#0a0e1c]">Operator</option>
                <option value="Admin" className="bg-[#0a0e1c]">Admin</option>
              </Select>
            </div>

            {invites.length > 1 && (
              <button
                type="button"
                onClick={() => handleRemove(inv.id)}
                className="text-slate-400 hover:text-red-400 transition p-2.5 rounded hover:bg-white/5 cursor-pointer self-end mb-0.5"
              >
                <Trash2 className="h-4.5 w-4.5" />
              </button>
            )}
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={handleAdd}
        className="flex items-center gap-1.5 text-xs font-bold text-cyan-400 hover:text-cyan-300 transition-colors mb-6 cursor-pointer bg-cyan-500/5 hover:bg-cyan-500/10 px-3 py-2 rounded-lg border border-cyan-500/10"
      >
        <Plus className="h-4 w-4" />
        Tambah Anggota
      </button>

      <div className="flex items-center justify-between border-t border-white/5 pt-5">
        <Button
          variant="secondary"
          onClick={() => router.push("/step-3")}
          className="px-5 py-5 hover:bg-white/5 transition-all"
        >
          <span className="flex items-center gap-1.5 font-bold tracking-wide">
            <ArrowLeft className="h-4 w-4" />
            Kembali
          </span>
        </Button>

        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={handleNext}
            className="text-xs font-bold text-slate-400 hover:text-white transition-colors cursor-pointer px-3 py-2 hover:bg-white/5 rounded-lg"
          >
            Lewati Langkah Ini
          </button>
          
          <Button onClick={handleNext} className="px-6 py-5.5 shadow-[0_4px_20px_rgba(0,210,255,0.15)] hover:shadow-[0_4px_25px_rgba(0,210,255,0.3)] transition-all duration-200">
            <span className="flex items-center gap-1.5 font-bold tracking-wide">
              Lanjutkan
              <ArrowRight className="h-4 w-4" />
            </span>
          </Button>
        </div>
      </div>
    </div>
  );
}
