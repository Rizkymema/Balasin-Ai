import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: ReactNode;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ title, description, icon, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center p-8 rounded-xl border border-dashed border-white/12 bg-white/2 min-h-[260px] animate-fade-in",
        className
      )}
    >
      {icon && <div className="mb-4 text-cyan-400">{icon}</div>}
      <h3 className="text-sm font-bold text-white mb-1">{title}</h3>
      <p className="text-xs text-slate-400 max-w-xs leading-relaxed mb-6">{description}</p>
      {action && <div>{action}</div>}
    </div>
  );
}
