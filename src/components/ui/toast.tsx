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
    info: "border-blue-200 bg-white text-blue-700",
    success: "border-emerald-200 bg-white text-emerald-700",
    error: "border-red-200 bg-white text-red-700",
  };

  return (
    <div
      className={cn(
        "fixed bottom-4 right-4 z-50 flex items-center gap-3 rounded-xl border p-4 text-xs font-semibold shadow-[var(--shadow-floating)] animate-fade-in",
        typeClasses[type],
        className
      )}
    >
      <span>{message}</span>
      <button
        onClick={onClose}
        className="text-slate-400 transition duration-150 hover:text-slate-900"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
