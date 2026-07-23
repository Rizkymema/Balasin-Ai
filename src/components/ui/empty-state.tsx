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
        "flex min-h-[260px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 p-8 text-center animate-fade-in",
        className
      )}
    >
      {icon && <div className="mb-4 rounded-2xl border border-blue-100 bg-blue-50 p-3 text-blue-600">{icon}</div>}
      <h3 className="mb-1 text-sm font-bold text-slate-900">{title}</h3>
      <p className="mb-6 max-w-xs text-xs leading-relaxed text-slate-500">{description}</p>
      {action && <div>{action}</div>}
    </div>
  );
}
