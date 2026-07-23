import { useState, useRef, useEffect, type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface DropdownItem {
  label: string;
  onClick: () => void;
  icon?: ReactNode;
  className?: string;
  danger?: boolean;
}

interface DropdownProps {
  trigger: ReactNode;
  items: DropdownItem[];
  align?: "left" | "right";
  className?: string;
  header?: ReactNode;
}

export function Dropdown({ trigger, items, align = "right", className, header }: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className={cn("relative inline-block text-left", className)} ref={containerRef}>
      <div onClick={() => setIsOpen(!isOpen)} className="cursor-pointer">
        {trigger}
      </div>

      {isOpen && (
        <div
          className={cn(
            "absolute z-50 mt-2 w-60 animate-fade-in rounded-2xl border border-[var(--color-border)] bg-white p-1.5 shadow-[var(--shadow-floating)]",
            align === "right" ? "right-0" : "left-0"
          )}
        >
          {header && (
            <div className="px-3 py-2.5 border-b border-[var(--color-border)] mb-1">
              {header}
            </div>
          )}
          {items.map((item, index) => (
            <button
              key={index}
              onClick={() => {
                item.onClick();
                setIsOpen(false);
              }}
              className={cn(
                "group flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-xs font-semibold transition-all duration-150 cursor-pointer",
                item.danger
                  ? "text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                  : "text-[var(--color-text)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text)]",
                item.className
              )}
            >
              {item.icon && <span className="text-[var(--color-muted)] transition-colors group-hover:text-[var(--color-brand)]">{item.icon}</span>}
              <span className="flex-1 truncate">{item.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
