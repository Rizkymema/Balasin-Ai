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
    info: "border-[var(--color-brand)]/20 bg-[var(--color-surface)]/95 text-[var(--color-brand)] shadow-[0_0_12px_rgba(10,132,255,0.08)]",
    success: "border-[var(--color-success)]/20 bg-[var(--color-surface)]/95 text-[var(--color-success)] shadow-[0_0_12px_rgba(48,209,88,0.08)]",
    error: "border-red-500/20 bg-[var(--color-surface)]/95 text-red-400 shadow-[0_0_12px_rgba(239,68,68,0.08)]",
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
