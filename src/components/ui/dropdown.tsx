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
}

export function Dropdown({ trigger, items, align = "right", className }: DropdownProps) {
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
            "absolute z-40 mt-2 w-56 rounded-lg border border-white/8 bg-[#091223]/95 p-1 shadow-xl backdrop-blur-md animate-fade-in",
            align === "right" ? "right-0" : "left-0"
          )}
        >
          {items.map((item, index) => (
            <button
              key={index}
              onClick={() => {
                item.onClick();
                setIsOpen(false);
              }}
              className={cn(
                "flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm font-medium transition duration-150",
                item.danger
                  ? "text-red-400 hover:bg-red-500/10"
                  : "text-slate-200 hover:bg-white/6 hover:text-white"
              )}
            >
              {item.icon && <span className="text-slate-400 group-hover:text-white">{item.icon}</span>}
              <span className="flex-1">{item.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
