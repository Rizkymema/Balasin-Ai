"use client";

import { useEffect, useState, type FormEvent } from "react";
import {
  Bell,
  Building2,
  Check,
  Globe,
  KeyRound,
  Save,
  Settings,
  Trash2,
  UserPlus,
} from "lucide-react";

import { useDashboardConfig } from "@/hooks/use-dashboard-config";
import { resolveDashboardPublicAppUrl } from "@/lib/runtime-url";
import type { TeamMember } from "@/types/dashboard-config";
import { Tabs } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";

export default function SettingsPage() {
  const { config, patchConfig } = useDashboardConfig();

  const [activeTab, setActiveTab] = useState("workspace");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [origin, setOrigin] = useState("");

  const [workspaceName, setWorkspaceName] = useState(config.workspace.name);
  const [industry, setIndustry] = useState(config.workspace.industry);
  const [description, setDescription] = useState(config.workspace.description);
  const [address, setAddress] = useState(config.workspace.address);
  const [businessHours, setBusinessHours] = useState(config.workspace.businessHours);
  const [timezone, setTimezone] = useState(config.workspace.timezone);
  const [lang, setLang] = useState(config.workspace.language);
  const [supportEmail, setSupportEmail] = useState(config.workspace.supportEmail);
  const [isSavedWorkspace, setIsSavedWorkspace] = useState(false);

  const [publicAppUrl, setPublicAppUrl] = useState(config.runtime.publicAppUrl);
  const [dashboardWorkerSecret, setDashboardWorkerSecret] = useState(
    config.runtime.workerSecret,
  );
  const [isSavedRuntime, setIsSavedRuntime] = useState(false);

  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"Admin" | "Operator">("Operator");
  const [members, setMembers] = useState<TeamMember[]>(config.team.members);
  const [notifyEmail, setNotifyEmail] = useState(config.team.notifications.emailDigest);
  const [notifyHandoff, setNotifyHandoff] = useState(
    config.team.notifications.instantHandoff,
  );
  const [notifyWeekly, setNotifyWeekly] = useState(
    config.team.notifications.weeklyReport,
  );
  const [isSavedNotify, setIsSavedNotify] = useState(false);

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  useEffect(() => {
    setWorkspaceName(config.workspace.name);
    setIndustry(config.workspace.industry);
    setDescription(config.workspace.description);
    setAddress(config.workspace.address);
    setBusinessHours(config.workspace.businessHours);
    setTimezone(config.workspace.timezone);
    setLang(config.workspace.language);
    setSupportEmail(config.workspace.supportEmail);
    setPublicAppUrl(resolveDashboardPublicAppUrl(config.runtime.publicAppUrl, origin));
    setDashboardWorkerSecret(config.runtime.workerSecret);
    setMembers(config.team.members);
    setNotifyEmail(config.team.notifications.emailDigest);
    setNotifyHandoff(config.team.notifications.instantHandoff);
    setNotifyWeekly(config.team.notifications.weeklyReport);
  }, [config, origin]);

  const handleSaveWorkspace = (event: FormEvent) => {
    event.preventDefault();

    patchConfig((current) => ({
      ...current,
      workspace: {
        ...current.workspace,
        name: workspaceName,
        industry,
        description,
        address,
        businessHours,
        timezone,
        language: lang,
        supportEmail,
      },
    }));

    setIsSavedWorkspace(true);
    setTimeout(() => setIsSavedWorkspace(false), 2500);
  };

  const handleSaveRuntime = (event: FormEvent) => {
    event.preventDefault();

    patchConfig((current) => ({
      ...current,
      runtime: {
        publicAppUrl: publicAppUrl.trim(),
        workerSecret: dashboardWorkerSecret,
      },
    }));

    setIsSavedRuntime(true);
    setTimeout(() => setIsSavedRuntime(false), 2500);
  };

  const handleInvite = (event: FormEvent) => {
    event.preventDefault();
    if (!inviteEmail) {
      return;
    }

    const nextMembers = [
      ...members,
      {
        id: Date.now().toString(),
        name: inviteEmail.split("@")[0],
        email: inviteEmail,
        role: inviteRole,
        status: "pending" as const,
      },
    ];

    setMembers(nextMembers);
    patchConfig((current) => ({
      ...current,
      team: {
        ...current.team,
        members: nextMembers,
      },
    }));

    setInviteEmail("");
    setIsModalOpen(false);
  };

  const handleDeleteMember = (id: string) => {
    const nextMembers = members.filter((member) => member.id !== id);
    setMembers(nextMembers);
    patchConfig((current) => ({
      ...current,
      team: {
        ...current.team,
        members: nextMembers,
      },
    }));
  };

  const handleSaveNotify = (event: FormEvent) => {
    event.preventDefault();

    patchConfig((current) => ({
      ...current,
      team: {
        ...current.team,
        notifications: {
          emailDigest: notifyEmail,
          instantHandoff: notifyHandoff,
          weeklyReport: notifyWeekly,
        },
      },
    }));

    setIsSavedNotify(true);
    setTimeout(() => setIsSavedNotify(false), 2500);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold text-white">
          <Settings className="h-6 w-6 text-cyan-400" />
          Pengaturan (Settings)
        </h1>
        <p className="mt-1 text-xs text-slate-400">
          Workspace, runtime, anggota tim, dan notifikasi operasional dikelola dari dashboard yang sama.
        </p>
      </div>

      <Tabs
        tabs={[
          { id: "workspace", label: "Workspace" },
          { id: "runtime", label: "Runtime" },
          { id: "team", label: "Tim & Anggota" },
          { id: "notifications", label: "Notifikasi" },
        ]}
        activeTab={activeTab}
        onChange={setActiveTab}
      />

      {activeTab === "workspace" ? (
        <form
          onSubmit={handleSaveWorkspace}
          className="glass-panel max-w-3xl space-y-4 rounded-xl p-6"
        >
          <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-cyan-400">
            <Building2 className="h-4.5 w-4.5" />
            Detail Identitas Workspace
          </h3>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Nama Workspace</label>
              <Input
                value={workspaceName}
                onChange={(event) => setWorkspaceName(event.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Industri</label>
              <Input
                value={industry}
                onChange={(event) => setIndustry(event.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Email Support</label>
            <Input
              type="email"
              value={supportEmail}
              onChange={(event) => setSupportEmail(event.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Deskripsi Bisnis</label>
            <Textarea
              rows={3}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Alamat</label>
            <Textarea
              rows={2}
              value={address}
              onChange={(event) => setAddress(event.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Jam Operasional</label>
            <Input
              value={businessHours}
              onChange={(event) => setBusinessHours(event.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Zona Waktu</label>
              <Select value={timezone} onChange={(event) => setTimezone(event.target.value)}>
                <option value="Asia/Jakarta">WIB - Asia/Jakarta</option>
                <option value="Asia/Makassar">WITA - Asia/Makassar</option>
                <option value="Asia/Jayapura">WIT - Asia/Jayapura</option>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">
                Bahasa Default Sistem
              </label>
              <Select value={lang} onChange={(event) => setLang(event.target.value)}>
                <option value="id">Bahasa Indonesia</option>
                <option value="en">English</option>
              </Select>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            {isSavedWorkspace ? (
              <span className="flex items-center gap-1 text-xs font-bold text-emerald-400 animate-fade-in">
                <Check className="h-4 w-4" />
                Workspace berhasil diperbarui!
              </span>
            ) : (
              <div />
            )}
            <Button type="submit" className="px-5">
              <Save className="mr-1.5 h-4 w-4" />
              Simpan Perubahan
            </Button>
          </div>
        </form>
      ) : null}

      {activeTab === "runtime" ? (
        <form
          onSubmit={handleSaveRuntime}
          className="glass-panel max-w-3xl space-y-5 rounded-xl p-6"
        >
          <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-cyan-400">
            <Globe className="h-4.5 w-4.5" />
            Runtime Dashboard
          </h3>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Public App URL</label>
            <Input
              value={publicAppUrl}
              onChange={(event) => setPublicAppUrl(event.target.value)}
              placeholder="https://domain-anda.com"
            />
            <p className="text-[11px] leading-5 text-slate-500">
              Dipakai untuk membentuk webhook URL dan script web chat langsung dari dashboard.
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Worker Secret</label>
            <Input
              type="password"
              value={dashboardWorkerSecret}
              onChange={(event) => setDashboardWorkerSecret(event.target.value)}
              placeholder="worker-secret-anda"
            />
            <p className="text-[11px] leading-5 text-slate-500">
              Secret ini bisa dipakai untuk memanggil endpoint worker tanpa login dashboard.
            </p>
          </div>

          <div className="rounded-xl border border-amber-400/15 bg-amber-950/15 p-4 text-xs leading-6 text-slate-300">
            <div className="mb-1 flex items-center gap-2 font-bold text-amber-200">
              <KeyRound className="h-4 w-4" />
              Catatan penting
            </div>
            `SESSION_SECRET` tetap dibiarkan di `.env.local` karena secret itu dipakai untuk sistem session/auth sebelum dashboard dibuka.
            Jadi yang masih wajib file manual tinggal session secret saja.
          </div>

          <div className="flex items-center justify-between border-t border-white/8 pt-2">
            {isSavedRuntime ? (
              <span className="flex items-center gap-1 text-xs font-bold text-emerald-400 animate-fade-in">
                <Check className="h-4 w-4" />
                Runtime dashboard disimpan!
              </span>
            ) : (
              <div />
            )}
            <Button type="submit" className="px-5">
              Simpan Runtime
            </Button>
          </div>
        </form>
      ) : null}

      {activeTab === "team" ? (
        <div className="max-w-3xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Anggota yang Terdaftar
            </h3>
            <Button onClick={() => setIsModalOpen(true)}>
              <UserPlus className="mr-1.5 h-4.5 w-4.5" />
              Undang Anggota Baru
            </Button>
          </div>

          <div className="space-y-3">
            {members.map((member) => (
              <div
                key={member.id}
                className="glass-panel flex items-center justify-between gap-4 rounded-xl p-4"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full border border-cyan-400/20 bg-cyan-950 text-xs font-bold uppercase text-cyan-400">
                    {member.name.substring(0, 2)}
                  </div>
                  <div>
                    <span className="block text-xs font-bold capitalize text-white">
                      {member.name}
                    </span>
                    <span className="text-[10px] font-semibold text-slate-500">
                      {member.email}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <Badge className="px-2 py-0.5 text-[9px] font-semibold">
                    {member.role}
                  </Badge>
                  {member.status === "pending" ? (
                    <span className="rounded bg-amber-500/10 px-2 py-0.5 text-[9px] font-bold text-amber-400">
                      Pending Invite
                    </span>
                  ) : (
                    <span className="rounded bg-emerald-500/10 px-2 py-0.5 text-[9px] font-bold text-emerald-400">
                      Aktif
                    </span>
                  )}
                  {members.length > 1 ? (
                    <button
                      onClick={() => handleDeleteMember(member.id)}
                      className="rounded p-1 text-slate-500 transition hover:text-red-400"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {activeTab === "notifications" ? (
        <form
          onSubmit={handleSaveNotify}
          className="glass-panel max-w-xl space-y-5 rounded-xl p-6"
        >
          <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-cyan-400">
            <Bell className="h-4.5 w-4.5" />
            Preferensi Notifikasi
          </h3>

          <div className="space-y-3.5">
            <label className="flex items-start gap-3 text-xs leading-normal text-slate-300">
              <input
                type="checkbox"
                checked={notifyEmail}
                onChange={(event) => setNotifyEmail(event.target.checked)}
                className="mt-1 h-4 w-4 rounded border-white/12 bg-white/4 text-cyan-500"
              />
              <span>
                <span className="block font-bold text-white">Email Ringkasan Aktivitas</span>
                Kirim ringkasan operasional harian / mingguan ke email admin.
              </span>
            </label>

            <label className="flex items-start gap-3 text-xs leading-normal text-slate-300">
              <input
                type="checkbox"
                checked={notifyHandoff}
                onChange={(event) => setNotifyHandoff(event.target.checked)}
                className="mt-1 h-4 w-4 rounded border-white/12 bg-white/4 text-cyan-500"
              />
              <span>
                <span className="block font-bold text-white">Notifikasi Handoff Instan</span>
                Beri tahu admin begitu AI memicu pengalihan chat.
              </span>
            </label>

            <label className="flex items-start gap-3 text-xs leading-normal text-slate-300">
              <input
                type="checkbox"
                checked={notifyWeekly}
                onChange={(event) => setNotifyWeekly(event.target.checked)}
                className="mt-1 h-4 w-4 rounded border-white/12 bg-white/4 text-cyan-500"
              />
              <span>
                <span className="block font-bold text-white">Laporan Kinerja Bulanan</span>
                Dapatkan laporan performa AI, volume inbox, dan tren channel.
              </span>
            </label>
          </div>

          <div className="flex items-center justify-between border-t border-white/8 pt-2">
            {isSavedNotify ? (
              <span className="flex items-center gap-1 text-xs font-bold text-emerald-400 animate-fade-in">
                <Check className="h-4 w-4" />
                Preferensi notifikasi disimpan!
              </span>
            ) : (
              <div />
            )}
            <Button type="submit" className="px-5">
              Simpan Notifikasi
            </Button>
          </div>
        </form>
      ) : null}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Undang Rekan Tim">
        <form onSubmit={handleInvite} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Email Anggota</label>
            <Input
              type="email"
              placeholder="nama@perusahaan.com"
              value={inviteEmail}
              onChange={(event) => setInviteEmail(event.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Peran / Role</label>
            <Select
              value={inviteRole}
              onChange={(event) =>
                setInviteRole(event.target.value as "Admin" | "Operator")
              }
            >
              <option value="Operator">Operator (CS / Balas Chat)</option>
              <option value="Admin">Admin (Akses Penuh)</option>
            </Select>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsModalOpen(false)}
              className="px-4"
            >
              Batal
            </Button>
            <Button type="submit" className="px-5">
              Undang Sekarang
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
