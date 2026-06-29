import { useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface TooltipProps {
  content: string;
  children: ReactNode;
  className?: string;
}

export function Tooltip({ content, children, className }: TooltipProps) {
  const [show, setShow] = useState(false);

  return (
    <div
      className="relative inline-block"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {children}
      {show && (
        <div
          className={cn(
            "absolute bottom-full left-1/2 z-50 mb-2 w-48 -translate-x-1/2 rounded bg-[var(--color-surface-hover)] border border-[var(--color-border)] px-2.5 py-1.5 text-[10px] font-medium leading-relaxed text-[var(--color-text)] shadow-xl backdrop-blur-md animate-fade-in text-center",
            className
          )}
        >
          {content}
          <div className="absolute top-full left-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-0.5 rotate-45 border-r border-b border-[var(--color-border)] bg-[var(--color-surface-hover)]" />
        </div>
      )}
    </div>
  );
}
