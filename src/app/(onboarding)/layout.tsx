"use client";

import { usePathname } from "next/navigation";
import { Bot, Check } from "lucide-react";

const STEPS = [
  { id: "/step-1", num: 1, label: "Profil Bisnis" },
  { id: "/step-2", num: 2, label: "Pilih Channel" },
  { id: "/step-3", num: 3, label: "Knowledge Base" },
  { id: "/step-4", num: 4, label: "Undang Tim" },
  { id: "/complete", num: 5, label: "Selesai" },
];

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const getStepStatus = (stepId: string, index: number) => {
    const activeIndex = STEPS.findIndex((s) => pathname.endsWith(s.id));
    if (pathname.endsWith(stepId)) return "active";
    if (activeIndex > index) return "completed";
    return "upcoming";
  };

  return (
    <div className="relative min-h-screen flex flex-col bg-[#020611] text-white">
      {/* Background radial gradient */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(84,219,255,0.06),transparent_40%)]" />

      {/* Header */}
      <header className="relative z-10 border-b border-white/8 bg-[#020611]/80 backdrop-blur-md px-6 py-4">
        <div className="mx-auto max-w-5xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-cyan-400/30 bg-cyan-950/40 text-cyan-400">
              <Bot className="h-4.5 w-4.5" />
            </div>
            <span className="font-heading font-bold text-lg">
              Balesin<span className="text-cyan-400">.AI</span>
            </span>
          </div>
          <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
            Setup Workspace
          </div>
        </div>
      </header>

      {/* Main content area */}
      <main className="relative z-10 flex-1 max-w-3xl w-full mx-auto px-4 py-10 flex flex-col justify-center">
        {/* Stepper progress */}
        <div className="mb-10">
          <div className="flex items-center justify-between">
            {STEPS.map((step, idx) => {
              const status = getStepStatus(step.id, idx);
              return (
                <div key={step.id} className="flex flex-1 items-center last:flex-none">
                  <div className="flex flex-col items-center relative">
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-full border text-xs font-bold transition-all duration-300 ${
                        status === "active"
                          ? "border-cyan-400 bg-cyan-950 text-cyan-400 shadow-[0_0_12px_rgba(34,211,238,0.4)]"
                          : status === "completed"
                          ? "border-emerald-500 bg-emerald-950 text-emerald-400"
                          : "border-white/10 bg-white/4 text-slate-500"
                      }`}
                    >
                      {status === "completed" ? <Check className="h-4 w-4" /> : step.num}
                    </div>
                    <span
                      className={`absolute top-10 whitespace-nowrap text-[10px] font-bold tracking-wide transition-colors ${
                        status === "active" ? "text-cyan-400" : "text-slate-500"
                      }`}
                    >
                      {step.label}
                    </span>
                  </div>

                  {idx < STEPS.length - 1 && (
                    <div
                      className={`h-[1px] flex-1 mx-2 transition-all duration-300 ${
                        getStepStatus(STEPS[idx + 1].id, idx + 1) === "active" ||
                        getStepStatus(STEPS[idx + 1].id, idx + 1) === "completed" ||
                        status === "completed"
                          ? "bg-gradient-to-r from-cyan-500 to-cyan-400"
                          : "bg-white/8"
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Form panel wrapper */}
        <div className="glass-panel-strong rounded-2xl p-6 md:p-8 shadow-xl mt-4">
          {children}
        </div>
      </main>
    </div>
  );
}
