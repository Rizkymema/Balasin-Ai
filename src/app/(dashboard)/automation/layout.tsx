"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  GitBranch,
  Bot,
  Database,
  Settings2,
} from "lucide-react";

const AUTOMATION_TABS = [
  { href: "/automation", label: "Conversations", icon: GitBranch, exact: true },
  { href: "/automation/ai-agent", label: "AI Agents", icon: Bot, badge: "NEW" },
  { href: "/automation/knowledge-base", label: "Knowledge Base", icon: Database },
  { href: "/automation/chatbot-settings", label: "Chatbot Settings", icon: Settings2 },
];

export default function AutomationLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="space-y-0">
      {/* Tab Navigation Bar */}
      <div className="border-b border-[var(--color-border)] mb-6 -mx-6 px-6">
        <nav className="flex gap-1 overflow-x-auto" role="tablist">
          {AUTOMATION_TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = tab.exact
              ? pathname === tab.href
              : pathname.startsWith(tab.href);

            return (
              <Link
                key={tab.href}
                href={tab.href}
                role="tab"
                aria-selected={isActive}
                className={`relative flex items-center gap-2 px-4 py-3 text-sm font-semibold whitespace-nowrap border-b-2 transition-all duration-150 ${
                  isActive
                    ? "border-[var(--color-brand)] text-[var(--color-brand)]"
                    : "border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-600"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {tab.label}
                {tab.badge && (
                  <span className="rounded bg-cyan-500 px-1.5 py-0.5 text-[9px] font-extrabold text-slate-950 leading-none">
                    {tab.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Page Content */}
      {children}
    </div>
  );
}
