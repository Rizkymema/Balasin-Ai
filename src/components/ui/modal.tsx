import { useEffect, type ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  className?: string;
}

export function Modal({ isOpen, onClose, title, children, className }: ModalProps) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-950/35 backdrop-blur-[2px] transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div
        className={cn(
          "relative z-10 w-full max-w-lg animate-fade-in rounded-2xl border border-[var(--color-border)] bg-white p-6 shadow-[var(--shadow-floating)] md:p-8",
          className,
        )}
      >
        {/* Header */}
        <div className="mb-5 flex items-center justify-between border-b border-[var(--color-border)] pb-4">
          {title && <h3 className="text-lg font-bold text-[var(--color-text)]">{title}</h3>}
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-[var(--color-muted)] transition duration-200 hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text)]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div>{children}</div>
      </div>
    </div>
  );
}
