"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
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
  const router = useRouter();
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    // Setup wizard dinonaktifkan — semua konfigurasi dilakukan melalui dashboard
    localStorage.setItem("balesin_onboarded", "true");
    router.push("/dashboard");
  }, [router]);

  const activeIndex = Math.max(
    0,
    STEPS.findIndex((s) => pathname.endsWith(s.id))
  );

  const getStepStatus = (stepId: string, index: number) => {
    if (pathname.endsWith(stepId)) return "active";
    if (activeIndex > index) return "completed";
    return "upcoming";
  };

  const progressPercent = (activeIndex / (STEPS.length - 1)) * 100;

  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#020611] text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent" />
          <span className="text-xs text-slate-400 font-semibold tracking-wider uppercase">
            Menyiapkan Workspace...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen flex flex-col bg-[#020611] text-white">
      {/* Background radial gradient */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(84,219,255,0.08),transparent_50%)]" />

      {/* Header */}
      <header className="relative z-10 border-b border-white/8 bg-[#020611]/80 backdrop-blur-md px-6 py-4">
        <div className="mx-auto max-w-5xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-cyan-400/30 bg-cyan-950/40 text-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.15)]">
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
      <main className="relative z-10 flex-1 max-w-3xl w-full mx-auto px-4 py-12 flex flex-col justify-center">
        {/* Stepper progress */}
        <div className="relative mb-14 px-1">
          {/* Line container aligned to circle centers (left 16px to right 16px) */}
          <div className="absolute top-4 left-4 right-4 h-[2px] -translate-y-1/2 z-0">
            {/* Background line */}
            <div className="w-full h-full bg-white/5 rounded-full" />
            {/* Active progress line */}
            <div
              className="absolute top-0 left-0 h-full bg-gradient-to-r from-cyan-400 via-cyan-500 to-emerald-400 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {/* Step nodes */}
          <div className="relative z-10 flex justify-between">
            {STEPS.map((step, idx) => {
              const status = getStepStatus(step.id, idx);
              return (
                <div key={step.id} className="flex flex-col items-center gap-2.5">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full border text-xs font-bold transition-all duration-300 ${
                      status === "active"
                        ? "border-cyan-400 bg-cyan-950 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.5)] scale-110"
                        : status === "completed"
                        ? "border-emerald-500 bg-emerald-950 text-emerald-400"
                        : "border-white/10 bg-[#070b19] text-slate-500"
                    }`}
                  >
                    {status === "completed" ? (
                      <Check className="h-4 w-4 stroke-[2.5]" />
                    ) : (
                      step.num
                    )}
                  </div>
                  <span
                    className={`text-[10px] font-bold tracking-wide transition-colors duration-200 text-center max-w-[80px] ${
                      status === "active"
                        ? "text-cyan-400 font-extrabold"
                        : status === "completed"
                        ? "text-emerald-400/80"
                        : "text-slate-500"
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Form panel wrapper with premium backdrop-glow */}
        <div className="relative group mt-2">
          <div className="absolute -inset-px bg-gradient-to-r from-cyan-500/10 to-emerald-500/10 rounded-2xl blur-xl opacity-75 transition duration-1000" />
          <div className="relative glass-panel-strong rounded-2xl p-6 md:p-8 shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-white/10 bg-[#030408]/80 backdrop-blur-xl">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
