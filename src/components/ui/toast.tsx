import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ToastProps {
  message: string;
  type?: "info" | "success" | "error";
  onClose: () => void;
  className?: string;
}

export function Toast({ message, type = "info", onClose, className }: ToastProps) {
  const typeClasses = {
    info: "border-cyan-500/20 bg-[#091223]/95 text-cyan-400 shadow-[0_0_12px_rgba(64,223,255,0.1)]",
    success: "border-emerald-500/20 bg-[#061812]/95 text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.1)]",
    error: "border-red-500/20 bg-[#1a0c0c]/95 text-red-400 shadow-[0_0_12px_rgba(239,68,68,0.1)]",
  };

  return (
    <div
      className={cn(
        "fixed bottom-4 right-4 z-50 flex items-center gap-3 rounded-lg border p-4 text-xs font-semibold backdrop-blur-md animate-fade-in",
        typeClasses[type],
        className
      )}
    >
      <span>{message}</span>
      <button
        onClick={onClose}
        className="text-slate-400 hover:text-white transition duration-150"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
