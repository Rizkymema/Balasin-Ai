"use client";

import { X, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export function DeleteConversationModal({
  conversationName,
  onClose,
  onConfirm,
}: {
  conversationName: string;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-2xl text-center">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded p-1 text-slate-400 hover:bg-white/10 hover:text-white"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-500/10 text-red-500">
          <AlertTriangle className="h-7 w-7" />
        </div>

        <h3 className="mb-2 text-lg font-bold text-white">Hapus Conversation?</h3>
        <p className="mb-6 text-sm text-slate-400">
          Apakah Anda yakin ingin menghapus conversation flow{" "}
          <span className="font-semibold text-white">&quot;{conversationName}&quot;</span>? 
          Tindakan ini tidak dapat dibatalkan.
        </p>

        <div className="flex gap-3 justify-center">
          <Button variant="secondary" onClick={onClose} className="text-slate-400 hover:text-white flex-1 max-w-[120px] bg-transparent border-transparent">
            Batal
          </Button>
          <Button
            onClick={onConfirm}
            className="flex-1 max-w-[120px] bg-red-500 hover:bg-red-600 text-white"
          >
            Ya, Hapus
          </Button>
        </div>
      </div>
    </div>
  );
}
