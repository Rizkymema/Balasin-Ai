"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Users, Plus, Trash2, ArrowRight, ArrowLeft } from "lucide-react";
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
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-bold font-heading text-white flex items-center gap-2">
          <Users className="h-5 w-5 text-cyan-400" />
          Undang Anggota Tim
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Undang admin atau agen customer service Anda agar dapat berkolaborasi menangani chat yang masuk. Anda bisa melewati langkah ini.
        </p>
      </div>

      <div className="space-y-3 mb-6 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
        {invites.map((inv, idx) => (
          <div key={inv.id} className="flex gap-2 items-center">
            <div className="flex-1">
              <Input
                type="email"
                placeholder="nama.rekan@perusahaan.com"
                value={inv.email}
                onChange={(e) => handleUpdate(inv.id, "email", e.target.value)}
              />
            </div>
            <div className="w-32">
              <Select
                value={inv.role}
                onChange={(e) => handleUpdate(inv.id, "role", e.target.value)}
              >
                <option value="Operator" className="bg-[#091223]">Operator</option>
                <option value="Admin" className="bg-[#091223]">Admin</option>
              </Select>
            </div>
            {invites.length > 1 && (
              <button
                type="button"
                onClick={() => handleRemove(inv.id)}
                className="text-slate-400 hover:text-red-400 transition p-2.5 rounded hover:bg-white/5"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={handleAdd}
        className="flex items-center gap-1.5 text-xs font-semibold text-cyan-400 hover:text-cyan-300 transition mb-6"
      >
        <Plus className="h-4 w-4" />
        Tambah Anggota
      </button>

      <div className="flex items-center justify-between border-t border-white/8 pt-4">
        <Button
          variant="secondary"
          onClick={() => router.push("/step-3")}
          className="px-5"
        >
          <span className="flex items-center gap-1.5">
            <ArrowLeft className="h-4 w-4" />
            Kembali
          </span>
        </Button>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleNext}
            className="px-4 py-2.5 text-xs font-bold text-slate-400 hover:text-white transition"
          >
            Lewati Langkah Ini
          </button>
          <Button onClick={handleNext} className="px-5">
            <span className="flex items-center gap-1.5">
              Lanjutkan
              <ArrowRight className="h-4 w-4" />
            </span>
          </Button>
        </div>
      </div>
    </div>
  );
}
