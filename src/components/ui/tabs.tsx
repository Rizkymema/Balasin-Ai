import { cn } from "@/lib/utils";

interface Tab {
  id: string;
  label: string;
}

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (id: string) => void;
  className?: string;
}

export function Tabs({ tabs, activeTab, onChange, className }: TabsProps) {
  return (
    <div className={cn("flex border-b border-white/8 space-x-6", className)}>
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={cn(
              "relative pb-3 text-sm font-semibold tracking-wide transition-all duration-200 focus:outline-none",
              isActive
                ? "text-cyan-400 font-bold"
                : "text-slate-400 hover:text-slate-200"
            )}
          >
            {tab.label}
            {isActive && (
              <span className="absolute bottom-0 left-0 right-0 h-[2px] rounded-full bg-cyan-400 shadow-[0_0_12px_rgba(34,211,238,0.6)] animate-fade-in" />
            )}
          </button>
        );
      })}
    </div>
  );
}
