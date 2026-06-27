"use client";

import { useState } from "react";
import {
  Inbox,
  PlusCircle,
  Save,
  Check,
  Trash2,
  Edit,
  MessageSquare,
  Clock,
  Tags,
  Zap,
  Users,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useDashboardConfig } from "@/hooks/use-dashboard-config";

// Helpers
function InboxToggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="relative inline-flex cursor-pointer items-center">
      <input type="checkbox" className="peer sr-only" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <div className="h-5 w-9 rounded-full bg-slate-700 after:absolute after:left-[2px] after:top-[2px] after:h-4 after:w-4 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-cyan-500 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none" />
    </label>
  );
}

function toggleArrayField(field: string, arr: string[], setArr: (v: string[]) => void) {
  setArr(arr.includes(field) ? arr.filter((f) => f !== field) : [...arr, field]);
}

const INBOX_TABS = [
  { id: "auto_responder", label: "Auto Responder", icon: <Zap className="h-4 w-4" /> },
  { id: "office_hours", label: "Office Hours", icon: <Clock className="h-4 w-4" /> },
  { id: "templates", label: "Templates", icon: <MessageSquare className="h-4 w-4" /> },
  { id: "tags", label: "Tags", icon: <Tags className="h-4 w-4" /> },
  { id: "customer_idle", label: "Customer Idle", icon: <Users className="h-4 w-4" /> },
];

export function InboxSettings() {
  const { config, patchConfig } = useDashboardConfig();
  const settings = config.automation.inboxSettings;

  const [activeTab, setActiveTab] = useState("auto_responder");
  const [isSaved, setIsSaved] = useState(false);

  // 1. Auto Responder State
  const [autoResponders, setAutoResponders] = useState(settings.autoResponders);
  const [showResModal, setShowResModal] = useState(false);
  const [resForm, setResForm] = useState({ name: "", type: "Greeting Message", channel: "All Channels", trigger: "First incoming message", message: "", delaySeconds: 0 });

  // 2. Office Hours State
  const [ohEnabled, setOhEnabled] = useState(settings.officeHours.enabled);
  const [ohTimezone, setOhTimezone] = useState(settings.officeHours.timezone);
  const [ohDays, setOhDays] = useState(settings.officeHours.days);
  const [ohOutsideMessage, setOhOutsideMessage] = useState(settings.officeHours.outsideMessage);

  // 3. Templates State
  const [templates, setTemplates] = useState(settings.templates);
  const [showTplModal, setShowTplModal] = useState(false);
  const [tplForm, setTplForm] = useState({ name: "", category: "Greeting", channel: "All Channels", language: "Indonesian", body: "" });

  // 4. Tags State
  const [tags, setTags] = useState(settings.tags);
  const [showTagModal, setShowTagModal] = useState(false);
  const [tagForm, setTagForm] = useState({ name: "", color: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30", category: "General", visibility: "All agents" });

  // 5. Customer Idle State
  const [idleEnabled, setIdleEnabled] = useState(settings.customerIdle.enabled);
  const [idleDuration, setIdleDuration] = useState(settings.customerIdle.duration);
  const [idleUnit, setIdleUnit] = useState(settings.customerIdle.unit);
  const [idleReminderEnabled, setIdleReminderEnabled] = useState(settings.customerIdle.reminderEnabled);
  const [idleReminderDelay, setIdleReminderDelay] = useState(settings.customerIdle.reminderDelay);
  const [idleReminderUnit, setIdleReminderUnit] = useState(settings.customerIdle.reminderUnit);
  const [idleReminderMsg, setIdleReminderMsg] = useState(settings.customerIdle.reminderMsg);
  const [idleAutoResolve, setIdleAutoResolve] = useState(settings.customerIdle.autoResolve);
  const [idleResolveStatus, setIdleResolveStatus] = useState(settings.customerIdle.resolveStatus);
  const [idleAddTag, setIdleAddTag] = useState(settings.customerIdle.addTag);

  const saveSettings = async () => {
    await patchConfig((current) => ({
      ...current,
      automation: {
        ...current.automation,
        inboxSettings: {
          ...current.automation.inboxSettings,
          autoResponders,
          officeHours: {
            enabled: ohEnabled,
            timezone: ohTimezone,
            days: ohDays,
            outsideMessage: ohOutsideMessage,
          },
          templates,
          tags,
          customerIdle: {
            enabled: idleEnabled,
            duration: idleDuration,
            unit: idleUnit,
            reminderEnabled: idleReminderEnabled,
            reminderDelay: idleReminderDelay,
            reminderUnit: idleReminderUnit,
            reminderMsg: idleReminderMsg,
            autoResolve: idleAutoResolve,
            resolveStatus: idleResolveStatus,
            addTag: idleAddTag,
          },
        },
      },
    }));
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Inbox className="h-5 w-5 text-cyan-400" />
          Inbox Settings
        </h2>
        <p className="text-xs text-slate-400 mt-1">Atur auto responder, office hours, template pesan, tagging, dan aturan idle pelanggan.</p>
      </div>

      <div className="space-y-5">
        {/* Tab Navigation */}
        <div className="border-b border-white/10 overflow-x-auto">
          <nav className="flex gap-1">
            {INBOX_TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold whitespace-nowrap border-b-2 transition-all ${
                  activeTab === tab.id
                    ? "border-cyan-400 text-cyan-400"
                    : "border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-600"
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* 1. Auto Responder */}
        {activeTab === "auto_responder" && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white">Auto Responder</h3>
                <p className="text-xs text-slate-400 mt-0.5">Balas pesan otomatis berdasarkan trigger tertentu.</p>
              </div>
              <Button onClick={() => setShowResModal(true)} className="gap-2 text-xs px-4 h-9">
                <PlusCircle className="h-3.5 w-3.5" />
                Create Auto Responder
              </Button>
            </div>
            
            <div className="overflow-x-auto rounded-xl border border-white/10">
              <table className="w-full text-sm text-slate-300">
                <thead className="bg-white/[0.02] text-[10px] uppercase text-slate-500">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold">Name</th>
                    <th className="px-4 py-3 text-left font-semibold">Type & Trigger</th>
                    <th className="px-4 py-3 text-left font-semibold">Message Preview</th>
                    <th className="px-4 py-3 text-left font-semibold">Status</th>
                    <th className="px-4 py-3 text-right font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.05]">
                  {autoResponders.map((res) => (
                    <tr key={res.id} className="hover:bg-white/[0.01]">
                      <td className="px-4 py-3">
                        <div className="font-semibold text-white">{res.name}</div>
                        <div className="text-[10px] text-slate-500">{res.channel}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-xs text-slate-300">{res.type}</div>
                        <div className="text-[10px] text-amber-400/80">{res.trigger}</div>
                      </td>
                      <td className="px-4 py-3 text-slate-400 text-xs max-w-[200px] truncate">{res.message}</td>
                      <td className="px-4 py-3">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400">{res.status}</span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => setAutoResponders(autoResponders.filter((r) => r.id !== res.id))}
                          className="text-slate-500 hover:text-red-400 transition p-1 rounded"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="pt-2">
              <Button onClick={saveSettings} className="gap-2 text-xs h-9">
                {isSaved ? <Check className="h-3.5 w-3.5" /> : <Save className="h-3.5 w-3.5" />}
                {isSaved ? "Tersimpan!" : "Save Auto Responders"}
              </Button>
            </div>
          </div>
        )}

        {/* 2. Office Hours */}
        {activeTab === "office_hours" && (
          <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="flex items-center justify-between p-4 rounded-lg border border-white/10 bg-white/[0.02]">
              <div>
                <div className="text-sm font-semibold text-white">Enable Office Hours</div>
                <div className="text-xs text-slate-500">Jadwalkan ketersediaan layanan dan balas pesan di luar jam operasional.</div>
              </div>
              <InboxToggle checked={ohEnabled} onChange={setOhEnabled} />
            </div>

            {ohEnabled && (
              <div className="grid grid-cols-1 gap-6">
                <div className="space-y-4 p-5 rounded-lg border border-white/10 bg-white/[0.01]">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="text-sm font-semibold text-slate-200">Jadwal Mingguan</h4>
                    <select
                      className="h-8 rounded border border-white/10 bg-black/30 px-2 text-xs text-slate-300 focus:outline-none focus:ring-1 focus:ring-cyan-400"
                      value={ohTimezone}
                      onChange={(e) => setOhTimezone(e.target.value)}
                    >
                      <option value="Asia/Jakarta">Asia/Jakarta (WIB)</option>
                      <option value="Asia/Makassar">Asia/Makassar (WITA)</option>
                      <option value="Asia/Jayapura">Asia/Jayapura (WIT)</option>
                    </select>
                  </div>
                  
                  {ohDays.map((d, i) => (
                    <div key={d.day} className="flex items-center gap-4 py-2 border-b border-white/5 last:border-0">
                      <div className="w-28 flex items-center justify-between">
                        <span className="text-xs text-slate-300 font-medium">{d.day}</span>
                        <InboxToggle
                          checked={d.enabled}
                          onChange={(v) => {
                            const newDays = [...ohDays];
                            newDays[i].enabled = v;
                            setOhDays(newDays);
                          }}
                        />
                      </div>
                      {d.enabled ? (
                        <div className="flex items-center gap-3">
                          <Input type="time" value={d.startTime} onChange={(e) => { const nd = [...ohDays]; nd[i].startTime = e.target.value; setOhDays(nd); }} className="h-8 w-28 text-xs bg-black/20" />
                          <span className="text-xs text-slate-500">to</span>
                          <Input type="time" value={d.endTime} onChange={(e) => { const nd = [...ohDays]; nd[i].endTime = e.target.value; setOhDays(nd); }} className="h-8 w-28 text-xs bg-black/20" />
                        </div>
                      ) : (
                        <span className="text-xs text-slate-500 italic">Tutup</span>
                      )}
                    </div>
                  ))}
                </div>

                <div className="space-y-2 p-5 rounded-lg border border-white/10 bg-white/[0.01]">
                  <label className="text-sm font-semibold text-slate-200">Outside Hours Message</label>
                  <p className="text-xs text-slate-400 mb-2">Pesan otomatis yang dikirim ketika pelanggan menghubungi di luar jam kerja.</p>
                  <Textarea 
                    value={ohOutsideMessage} 
                    onChange={(e) => setOhOutsideMessage(e.target.value)} 
                    className="min-h-[80px] bg-black/20 text-sm"
                  />
                </div>
              </div>
            )}
            
            <div className="pt-2">
              <Button onClick={saveSettings} className="gap-2 text-xs h-9">
                {isSaved ? <Check className="h-3.5 w-3.5" /> : <Save className="h-3.5 w-3.5" />}
                {isSaved ? "Tersimpan!" : "Save Office Hours"}
              </Button>
            </div>
          </div>
        )}

        {/* 3. Templates */}
        {activeTab === "templates" && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white">Message Templates</h3>
                <p className="text-xs text-slate-400 mt-0.5">Kelola pesan standar/quick replies yang bisa digunakan agen.</p>
              </div>
              <Button onClick={() => setShowTplModal(true)} className="gap-2 text-xs px-4 h-9">
                <PlusCircle className="h-3.5 w-3.5" />
                Create Template
              </Button>
            </div>
            
            <div className="overflow-x-auto rounded-xl border border-white/10">
              <table className="w-full text-sm text-slate-300">
                <thead className="bg-white/[0.02] text-[10px] uppercase text-slate-500">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold">Name & Category</th>
                    <th className="px-4 py-3 text-left font-semibold">Body Preview</th>
                    <th className="px-4 py-3 text-left font-semibold">Variables</th>
                    <th className="px-4 py-3 text-left font-semibold">Status</th>
                    <th className="px-4 py-3 text-right font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.05]">
                  {templates.map((tpl) => (
                    <tr key={tpl.id} className="hover:bg-white/[0.01]">
                      <td className="px-4 py-3">
                        <div className="font-semibold text-white">{tpl.name}</div>
                        <div className="text-[10px] text-slate-500">{tpl.category}</div>
                      </td>
                      <td className="px-4 py-3 text-slate-400 text-xs max-w-[200px] truncate">{tpl.body}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {tpl.variables.map(v => (
                            <Badge key={v} className="bg-slate-800 text-slate-300 text-[9px] font-mono px-1.5 py-0">{"{{"}{v}{"}}"}</Badge>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400">{tpl.status}</span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => setTemplates(templates.filter((t) => t.id !== tpl.id))}
                          className="text-slate-500 hover:text-red-400 transition p-1 rounded"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="pt-2">
              <Button onClick={saveSettings} className="gap-2 text-xs h-9">
                {isSaved ? <Check className="h-3.5 w-3.5" /> : <Save className="h-3.5 w-3.5" />}
                {isSaved ? "Tersimpan!" : "Save Templates"}
              </Button>
            </div>
          </div>
        )}

        {/* 4. Tags */}
        {activeTab === "tags" && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white">Conversation Tags</h3>
                <p className="text-xs text-slate-400 mt-0.5">Buat kategori/tag untuk menyaring dan melaporkan analitik percakapan.</p>
              </div>
              <Button onClick={() => setShowTagModal(true)} className="gap-2 text-xs px-4 h-9">
                <PlusCircle className="h-3.5 w-3.5" />
                Create Tag
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {tags.map((tag) => (
                <div key={tag.id} className="p-4 rounded-xl border border-white/10 bg-white/[0.01] hover:bg-white/[0.03] transition relative group">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider border ${tag.color}`}>
                        {tag.name}
                      </span>
                      <div className="mt-3 text-xs text-slate-400">Category: <span className="text-slate-300">{tag.category}</span></div>
                      <div className="text-xs text-slate-400">Visibility: <span className="text-slate-300">{tag.visibility}</span></div>
                    </div>
                    <button
                      onClick={() => setTags(tags.filter((t) => t.id !== tag.id))}
                      className="text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="pt-2">
              <Button onClick={saveSettings} className="gap-2 text-xs h-9">
                {isSaved ? <Check className="h-3.5 w-3.5" /> : <Save className="h-3.5 w-3.5" />}
                {isSaved ? "Tersimpan!" : "Save Tags"}
              </Button>
            </div>
          </div>
        )}

        {/* 5. Customer Idle */}
        {activeTab === "customer_idle" && (
          <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="flex items-center justify-between p-4 rounded-lg border border-white/10 bg-white/[0.02]">
              <div>
                <div className="text-sm font-semibold text-white">Enable Customer Idle Rule</div>
                <div className="text-xs text-slate-500">Tutup chat otomatis atau kirim reminder jika pelanggan tidak membalas.</div>
              </div>
              <InboxToggle checked={idleEnabled} onChange={setIdleEnabled} />
            </div>

            {idleEnabled && (
              <div className="space-y-6">
                <div className="p-5 rounded-lg border border-white/10 bg-white/[0.01] space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-slate-200">Idle Duration Trigger</label>
                    <p className="text-xs text-slate-500">Berapa lama pelanggan diam sebelum aksi dijalankan?</p>
                    <div className="flex items-center gap-2 pt-1">
                      <Input type="number" value={idleDuration} onChange={(e) => setIdleDuration(Number(e.target.value))} className="h-9 w-24 text-sm bg-black/20" />
                      <select
                        className="h-9 rounded border border-white/10 bg-black/30 px-3 text-sm text-slate-300 focus:outline-none focus:ring-1 focus:ring-cyan-400"
                        value={idleUnit}
                        onChange={(e) => setIdleUnit(e.target.value)}
                      >
                        <option value="minutes">Minutes</option>
                        <option value="hours">Hours</option>
                        <option value="days">Days</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="p-5 rounded-lg border border-white/10 bg-white/[0.01] space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-semibold text-slate-200">Send Reminder Message</div>
                      <div className="text-xs text-slate-500">Kirim pesan pengingat saat idle tercapai.</div>
                    </div>
                    <InboxToggle checked={idleReminderEnabled} onChange={setIdleReminderEnabled} />
                  </div>
                  {idleReminderEnabled && (
                    <Textarea 
                      value={idleReminderMsg} 
                      onChange={(e) => setIdleReminderMsg(e.target.value)} 
                      className="min-h-[80px] bg-black/20 text-sm mt-3"
                    />
                  )}
                </div>

                <div className="p-5 rounded-lg border border-white/10 bg-white/[0.01] space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-semibold text-slate-200">Auto Resolve / Close</div>
                      <div className="text-xs text-slate-500">Tutup percakapan otomatis jika tidak dibalas.</div>
                    </div>
                    <InboxToggle checked={idleAutoResolve} onChange={setIdleAutoResolve} />
                  </div>
                  {idleAutoResolve && (
                    <div className="grid grid-cols-2 gap-4 mt-3">
                      <div className="space-y-1.5">
                        <label className="text-xs text-slate-400 font-medium">Ubah status menjadi</label>
                        <select
                          className="w-full h-9 rounded border border-white/10 bg-black/30 px-3 text-sm text-slate-300 focus:outline-none focus:ring-1 focus:ring-cyan-400"
                          value={idleResolveStatus}
                          onChange={(e) => setIdleResolveStatus(e.target.value)}
                        >
                          <option value="Resolved">Resolved</option>
                          <option value="Closed">Closed</option>
                          <option value="Archived">Archived</option>
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs text-slate-400 font-medium">Tambahkan tag</label>
                        <Input value={idleAddTag} onChange={(e) => setIdleAddTag(e.target.value)} className="h-9 bg-black/20 text-sm" />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            <div className="pt-2">
              <Button onClick={saveSettings} className="gap-2 text-xs h-9">
                {isSaved ? <Check className="h-3.5 w-3.5" /> : <Save className="h-3.5 w-3.5" />}
                {isSaved ? "Tersimpan!" : "Save Idle Rules"}
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {showResModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md rounded-xl border border-white/10 bg-[var(--color-surface)] p-6 space-y-4 shadow-2xl">
            <h4 className="text-base font-bold text-white">Create Auto Responder</h4>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Name</label>
                <Input placeholder="e.g. Greeting" value={resForm.name} onChange={(e) => setResForm({...resForm, name: e.target.value})} className="h-9 text-sm bg-black/20" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Type</label>
                <select
                  className="w-full h-9 rounded-md border border-white/10 bg-black/30 px-3 text-sm text-slate-300 focus:outline-none focus:ring-1 focus:ring-cyan-400"
                  value={resForm.type}
                  onChange={(e) => setResForm({...resForm, type: e.target.value})}
                >
                  {["Greeting Message", "Away Message", "Outside Office Hours Message", "Busy Agent Message", "Queue Waiting Message", "Conversation Closed Message"].map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Trigger</label>
                <select
                  className="w-full h-9 rounded-md border border-white/10 bg-black/30 px-3 text-sm text-slate-300 focus:outline-none focus:ring-1 focus:ring-cyan-400"
                  value={resForm.trigger}
                  onChange={(e) => setResForm({...resForm, trigger: e.target.value})}
                >
                  {["First incoming message", "Every new conversation", "Outside office hours", "All agents busy", "All agents offline", "Customer enters queue", "Conversation resolved"].map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Message Content</label>
                <Textarea value={resForm.message} onChange={(e) => setResForm({...resForm, message: e.target.value})} className="min-h-[80px] bg-black/20 text-sm" />
              </div>
            </div>
            <div className="flex gap-3 justify-end pt-2">
              <Button variant="secondary" onClick={() => setShowResModal(false)} className="text-slate-400 bg-transparent border-transparent text-xs h-9 hover:bg-white/5">Cancel</Button>
              <Button className="text-xs h-9 bg-cyan-500 text-black hover:bg-cyan-400" onClick={() => {
                if (!resForm.name) return;
                setAutoResponders([...autoResponders, { id: "res_" + Date.now(), ...resForm, status: "Active" }]);
                setResForm({ name: "", type: "Greeting Message", channel: "All Channels", trigger: "First incoming message", message: "", delaySeconds: 0 });
                setShowResModal(false);
              }}>Save Responder</Button>
            </div>
          </div>
        </div>
      )}

      {showTplModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md rounded-xl border border-white/10 bg-[var(--color-surface)] p-6 space-y-4 shadow-2xl">
            <h4 className="text-base font-bold text-white">Create Template</h4>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Name</label>
                <Input placeholder="e.g. Booking Confirm" value={tplForm.name} onChange={(e) => setTplForm({...tplForm, name: e.target.value})} className="h-9 text-sm bg-black/20" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Category</label>
                <select
                  className="w-full h-9 rounded-md border border-white/10 bg-black/30 px-3 text-sm text-slate-300 focus:outline-none focus:ring-1 focus:ring-cyan-400"
                  value={tplForm.category}
                  onChange={(e) => setTplForm({...tplForm, category: e.target.value})}
                >
                  {["Greeting", "FAQ", "Booking", "Payment", "Service Update", "Complaint", "Follow Up"].map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Message Body (Use {"{{var}}"} for variables)</label>
                <Textarea value={tplForm.body} onChange={(e) => setTplForm({...tplForm, body: e.target.value})} className="min-h-[100px] bg-black/20 text-sm font-mono" />
              </div>
            </div>
            <div className="flex gap-3 justify-end pt-2">
              <Button variant="secondary" onClick={() => setShowTplModal(false)} className="text-slate-400 bg-transparent border-transparent text-xs h-9 hover:bg-white/5">Cancel</Button>
              <Button className="text-xs h-9 bg-cyan-500 text-black hover:bg-cyan-400" onClick={() => {
                if (!tplForm.name) return;
                const matches = tplForm.body.match(/\{\{([^}]+)\}\}/g);
                const vars = matches ? matches.map(m => m.replace(/[{}]/g, '')) : [];
                setTemplates([...templates, { id: "tpl_" + Date.now(), ...tplForm, variables: vars, approvalStatus: "Approved", status: "Active" }]);
                setTplForm({ name: "", category: "Greeting", channel: "All Channels", language: "Indonesian", body: "" });
                setShowTplModal(false);
              }}>Save Template</Button>
            </div>
          </div>
        </div>
      )}

      {showTagModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-sm rounded-xl border border-white/10 bg-[var(--color-surface)] p-6 space-y-4 shadow-2xl">
            <h4 className="text-base font-bold text-white">Create Tag</h4>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Tag Name</label>
                <Input placeholder="e.g. VIP Customer" value={tagForm.name} onChange={(e) => setTagForm({...tagForm, name: e.target.value})} className="h-9 text-sm bg-black/20" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Category</label>
                <select
                  className="w-full h-9 rounded-md border border-white/10 bg-black/30 px-3 text-sm text-slate-300 focus:outline-none focus:ring-1 focus:ring-cyan-400"
                  value={tagForm.category}
                  onChange={(e) => setTagForm({...tagForm, category: e.target.value})}
                >
                  {["Sales", "Support", "Service", "Complaint", "Payment", "Priority", "Internal"].map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Color</label>
                <select
                  className="w-full h-9 rounded-md border border-white/10 bg-black/30 px-3 text-sm text-slate-300 focus:outline-none focus:ring-1 focus:ring-cyan-400"
                  value={tagForm.color}
                  onChange={(e) => setTagForm({...tagForm, color: e.target.value})}
                >
                  <option value="bg-cyan-500/20 text-cyan-400 border-cyan-500/30">Cyan</option>
                  <option value="bg-blue-500/20 text-blue-400 border-blue-500/30">Blue</option>
                  <option value="bg-red-500/20 text-red-400 border-red-500/30">Red</option>
                  <option value="bg-green-500/20 text-green-400 border-green-500/30">Green</option>
                  <option value="bg-amber-500/20 text-amber-400 border-amber-500/30">Amber</option>
                  <option value="bg-purple-500/20 text-purple-400 border-purple-500/30">Purple</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 justify-end pt-2">
              <Button variant="secondary" onClick={() => setShowTagModal(false)} className="text-slate-400 bg-transparent border-transparent text-xs h-9 hover:bg-white/5">Cancel</Button>
              <Button className="text-xs h-9 bg-cyan-500 text-black hover:bg-cyan-400" onClick={() => {
                if (!tagForm.name) return;
                setTags([...tags, { id: "tag_" + Date.now(), ...tagForm, status: "Active" }]);
                setTagForm({ name: "", color: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30", category: "General", visibility: "All agents" });
                setShowTagModal(false);
              }}>Save Tag</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
