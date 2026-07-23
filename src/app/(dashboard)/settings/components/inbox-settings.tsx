"use client";

import { useEffect, useRef, useState } from "react";
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
import { Card } from "@/components/ui/card";
import { useDashboardConfig } from "@/hooks/use-dashboard-config";

// Helpers
function InboxToggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="relative inline-flex cursor-pointer items-center">
      <input type="checkbox" className="peer sr-only" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <div className="h-5 w-9 rounded-full bg-slate-200 after:absolute after:left-[2px] after:top-[2px] after:h-4 after:w-4 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:bg-blue-600 peer-checked:after:translate-x-full peer-focus:outline-none shadow-2xs" />
    </label>
  );
}

const INBOX_TABS = [
  { id: "auto_responder", label: "Auto Responder", icon: <Zap className="h-4 w-4" /> },
  { id: "office_hours", label: "Office Hours", icon: <Clock className="h-4 w-4" /> },
  { id: "templates", label: "Templates", icon: <MessageSquare className="h-4 w-4" /> },
  { id: "tags", label: "Tags", icon: <Tags className="h-4 w-4" /> },
  { id: "customer_idle", label: "Customer Idle", icon: <Users className="h-4 w-4" /> },
];

export function InboxSettings() {
  const { config, isLoading, patchConfig } = useDashboardConfig();
  const settings = config.automation.inboxSettings;

  const [activeTab, setActiveTab] = useState("auto_responder");
  const [isSaved, setIsSaved] = useState(false);

  const initializedRef = useRef(false);

  // 1. Auto Responder State
  const [autoResponders, setAutoResponders] = useState(settings.autoResponders);
  const [showResModal, setShowResModal] = useState(false);
  const [resForm, setResForm] = useState({ name: "", type: "Greeting Message", channel: "All Channels", trigger: "First incoming message", message: "", delaySeconds: 0 });

  // 2. Office Hours State
  const [ohEnabled, setOhEnabled] = useState(settings.officeHours.enabled);
  const [ohTimezone, setOhTimezone] = useState(settings.officeHours.timezone);
  const [ohDays, setOhDays] = useState(() => settings.officeHours.days.map(d => ({ ...d })));
  const [ohOutsideMessage, setOhOutsideMessage] = useState(settings.officeHours.outsideMessage);

  // 3. Templates State
  const [templates, setTemplates] = useState(settings.templates);
  const [showTplModal, setShowTplModal] = useState(false);
  const [tplForm, setTplForm] = useState({ name: "", category: "Greeting", channel: "All Channels", language: "Indonesian", body: "" });

  // 4. Tags State
  const [tags, setTags] = useState(settings.tags);
  const [showTagModal, setShowTagModal] = useState(false);
  const [tagForm, setTagForm] = useState({ name: "", color: "bg-blue-50 text-blue-700 border-blue-200", category: "General", visibility: "All agents" });

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

  useEffect(() => {
    if (isLoading || initializedRef.current) return;
    initializedRef.current = true;
    const s = config.automation.inboxSettings;
    setAutoResponders(s.autoResponders);
    setOhEnabled(s.officeHours.enabled);
    setOhTimezone(s.officeHours.timezone);
    setOhDays(s.officeHours.days.map(d => ({ ...d })));
    setOhOutsideMessage(s.officeHours.outsideMessage);
    setTemplates(s.templates);
    setTags(s.tags);
    setIdleEnabled(s.customerIdle.enabled);
    setIdleDuration(s.customerIdle.duration);
    setIdleUnit(s.customerIdle.unit);
    setIdleReminderEnabled(s.customerIdle.reminderEnabled);
    setIdleReminderDelay(s.customerIdle.reminderDelay);
    setIdleReminderUnit(s.customerIdle.reminderUnit);
    setIdleReminderMsg(s.customerIdle.reminderMsg);
    setIdleAutoResolve(s.customerIdle.autoResolve);
    setIdleResolveStatus(s.customerIdle.resolveStatus);
    setIdleAddTag(s.customerIdle.addTag);
  }, [isLoading, config]);

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
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <Inbox className="h-5 w-5 text-blue-600" />
          Inbox Settings
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">Atur auto responder, office hours, template pesan, tagging, dan aturan idle pelanggan.</p>
      </div>

      <div className="space-y-5">
        {/* Tab Navigation */}
        <div className="border-b border-slate-200 overflow-x-auto">
          <nav className="flex gap-1">
            {INBOX_TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold whitespace-nowrap border-b-2 transition-all cursor-pointer ${
                  activeTab === tab.id
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-slate-500 hover:text-slate-900"
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
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">Auto Responder</h3>
                <p className="text-xs text-slate-500">Balas pesan otomatis berdasarkan trigger tertentu.</p>
              </div>
              <Button onClick={() => setShowResModal(true)} variant="primary" size="sm" className="gap-1.5">
                <PlusCircle className="h-4 w-4" />
                Create Auto Responder
              </Button>
            </div>
            
            <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-2xs">
              <table className="w-full text-xs text-slate-700">
                <thead className="bg-slate-50 text-[10px] uppercase text-slate-500 font-bold border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 text-left font-bold">Name</th>
                    <th className="px-4 py-3 text-left font-bold">Type & Trigger</th>
                    <th className="px-4 py-3 text-left font-bold">Message Preview</th>
                    <th className="px-4 py-3 text-left font-bold">Status</th>
                    <th className="px-4 py-3 text-right font-bold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {autoResponders.map((res) => (
                    <tr key={res.id} className="hover:bg-slate-50/70 transition">
                      <td className="px-4 py-3">
                        <div className="font-bold text-slate-900">{res.name}</div>
                        <div className="text-[10px] text-slate-500 font-medium">{res.channel}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-xs font-semibold text-slate-800">{res.type}</div>
                        <div className="text-[10px] text-amber-600 font-bold">{res.trigger}</div>
                      </td>
                      <td className="px-4 py-3 text-slate-500 text-xs max-w-[200px] truncate">{res.message}</td>
                      <td className="px-4 py-3">
                        <Badge variant="success" className="text-[10px]">{res.status}</Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => setAutoResponders(autoResponders.filter((r) => r.id !== res.id))}
                          className="text-slate-400 hover:text-red-600 transition p-1.5 rounded-lg hover:bg-red-50 cursor-pointer"
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
              <Button onClick={saveSettings} variant="primary" size="sm" className="gap-1.5">
                {isSaved ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />}
                {isSaved ? "Tersimpan!" : "Save Auto Responders"}
              </Button>
            </div>
          </div>
        )}

        {/* 2. Office Hours */}
        {activeTab === "office_hours" && (
          <div className="space-y-4">
            <Card className="p-5 border-slate-200 bg-white shadow-2xs flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-slate-900">Enable Office Hours</div>
                <div className="text-[11px] text-slate-500 font-medium">Jadwalkan ketersediaan layanan dan balas pesan di luar jam operasional.</div>
              </div>
              <InboxToggle checked={ohEnabled} onChange={setOhEnabled} />
            </Card>

            {ohEnabled && (
              <div className="grid grid-cols-1 gap-4">
                <Card className="p-5 border-slate-200 bg-white shadow-2xs space-y-4">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Jadwal Mingguan</h4>
                    <select
                      className="h-8 rounded-md border border-slate-200 bg-slate-50 px-2.5 text-xs font-semibold text-slate-900 focus:outline-none focus:border-blue-600"
                      value={ohTimezone}
                      onChange={(e) => setOhTimezone(e.target.value)}
                    >
                      <option value="Asia/Jakarta">Asia/Jakarta (WIB)</option>
                      <option value="Asia/Makassar">Asia/Makassar (WITA)</option>
                      <option value="Asia/Jayapura">Asia/Jayapura (WIT)</option>
                    </select>
                  </div>
                  
                  {ohDays.map((d, i) => (
                    <div key={d.day} className="flex items-center gap-4 py-1.5 border-b border-slate-100 last:border-0">
                      <div className="w-28 flex items-center justify-between">
                        <span className="text-xs text-slate-900 font-bold">{d.day}</span>
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
                        <div className="flex items-center gap-2">
                          <Input type="time" value={d.startTime} onChange={(e) => { const nd = [...ohDays]; nd[i].startTime = e.target.value; setOhDays(nd); }} className="h-8 w-28 text-xs bg-slate-50" />
                          <span className="text-xs text-slate-400 font-medium">s/d</span>
                          <Input type="time" value={d.endTime} onChange={(e) => { const nd = [...ohDays]; nd[i].endTime = e.target.value; setOhDays(nd); }} className="h-8 w-28 text-xs bg-slate-50" />
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 italic font-medium">Tutup</span>
                      )}
                    </div>
                  ))}
                </Card>

                <Card className="p-5 border-slate-200 bg-white shadow-2xs space-y-2">
                  <label className="text-xs font-bold text-slate-900">Outside Hours Message</label>
                  <p className="text-[11px] text-slate-500 font-medium">Pesan otomatis yang dikirim ketika pelanggan menghubungi di luar jam kerja.</p>
                  <Textarea 
                    value={ohOutsideMessage} 
                    onChange={(e) => setOhOutsideMessage(e.target.value)} 
                    className="min-h-[80px] bg-slate-50 text-xs"
                  />
                </Card>
              </div>
            )}
            
            <div className="pt-2">
              <Button onClick={saveSettings} variant="primary" size="sm" className="gap-1.5">
                {isSaved ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />}
                {isSaved ? "Tersimpan!" : "Save Office Hours"}
              </Button>
            </div>
          </div>
        )}

        {/* 3. Templates */}
        {activeTab === "templates" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">Message Templates</h3>
                <p className="text-xs text-slate-500">Kelola pesan standar/quick replies yang bisa digunakan agen.</p>
              </div>
              <Button onClick={() => setShowTplModal(true)} variant="primary" size="sm" className="gap-1.5">
                <PlusCircle className="h-4 w-4" />
                Create Template
              </Button>
            </div>
            
            <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-2xs">
              <table className="w-full text-xs text-slate-700">
                <thead className="bg-slate-50 text-[10px] uppercase text-slate-500 font-bold border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 text-left font-bold">Name & Category</th>
                    <th className="px-4 py-3 text-left font-bold">Body Preview</th>
                    <th className="px-4 py-3 text-left font-bold">Variables</th>
                    <th className="px-4 py-3 text-left font-bold">Status</th>
                    <th className="px-4 py-3 text-right font-bold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {templates.map((tpl) => (
                    <tr key={tpl.id} className="hover:bg-slate-50/70 transition">
                      <td className="px-4 py-3">
                        <div className="font-bold text-slate-900">{tpl.name}</div>
                        <div className="text-[10px] text-slate-500 font-medium">{tpl.category}</div>
                      </td>
                      <td className="px-4 py-3 text-slate-500 text-xs max-w-[200px] truncate">{tpl.body}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {tpl.variables.map(v => (
                            <Badge key={v} variant="secondary" className="text-[9px] font-mono">{"{{"}{v}{"}}"}</Badge>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="success" className="text-[10px]">{tpl.status}</Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => setTemplates(templates.filter((t) => t.id !== tpl.id))}
                          className="text-slate-400 hover:text-red-600 transition p-1.5 rounded-lg hover:bg-red-50 cursor-pointer"
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
              <Button onClick={saveSettings} variant="primary" size="sm" className="gap-1.5">
                {isSaved ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />}
                {isSaved ? "Tersimpan!" : "Save Templates"}
              </Button>
            </div>
          </div>
        )}

        {/* 4. Tags */}
        {activeTab === "tags" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">Conversation Tags</h3>
                <p className="text-xs text-slate-500">Buat kategori/tag untuk menyaring dan melaporkan analitik percakapan.</p>
              </div>
              <Button onClick={() => setShowTagModal(true)} variant="primary" size="sm" className="gap-1.5">
                <PlusCircle className="h-4 w-4" />
                Create Tag
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {tags.map((tag) => (
                <Card key={tag.id} className="p-4 border-slate-200 bg-white shadow-2xs hover:border-slate-300 transition relative group">
                  <div className="flex items-start justify-between">
                    <div>
                      <Badge variant="default" className="text-[10px] font-bold uppercase">
                        {tag.name}
                      </Badge>
                      <div className="mt-2.5 text-xs text-slate-500 font-medium">Category: <span className="text-slate-900 font-semibold">{tag.category}</span></div>
                      <div className="text-xs text-slate-500 font-medium">Visibility: <span className="text-slate-900 font-semibold">{tag.visibility}</span></div>
                    </div>
                    <button
                      onClick={() => setTags(tags.filter((t) => t.id !== tag.id))}
                      className="text-slate-400 hover:text-red-600 transition p-1 cursor-pointer"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </Card>
              ))}
            </div>
            
            <div className="pt-2">
              <Button onClick={saveSettings} variant="primary" size="sm" className="gap-1.5">
                {isSaved ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />}
                {isSaved ? "Tersimpan!" : "Save Tags"}
              </Button>
            </div>
          </div>
        )}

        {/* 5. Customer Idle */}
        {activeTab === "customer_idle" && (
          <div className="space-y-4">
            <Card className="p-5 border-slate-200 bg-white shadow-2xs flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-slate-900">Enable Customer Idle Rule</div>
                <div className="text-[11px] text-slate-500 font-medium">Tutup chat otomatis atau kirim reminder jika pelanggan tidak membalas.</div>
              </div>
              <InboxToggle checked={idleEnabled} onChange={setIdleEnabled} />
            </Card>

            {idleEnabled && (
              <div className="space-y-4">
                <Card className="p-5 border-slate-200 bg-white shadow-2xs space-y-2">
                  <label className="text-xs font-bold text-slate-900">Idle Duration Trigger</label>
                  <p className="text-[11px] text-slate-500 font-medium">Berapa lama pelanggan diam sebelum aksi dijalankan?</p>
                  <div className="flex items-center gap-2 pt-1">
                    <Input type="number" value={idleDuration} onChange={(e) => setIdleDuration(Number(e.target.value))} className="h-9 w-24 text-xs bg-slate-50 font-bold" />
                    <select
                      className="h-9 rounded-md border border-slate-200 bg-slate-50 px-3 text-xs font-semibold text-slate-900 focus:outline-none focus:border-blue-600"
                      value={idleUnit}
                      onChange={(e) => setIdleUnit(e.target.value)}
                    >
                      <option value="minutes">Minutes</option>
                      <option value="hours">Hours</option>
                      <option value="days">Days</option>
                    </select>
                  </div>
                </Card>

                <Card className="p-5 border-slate-200 bg-white shadow-2xs space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-slate-900">Send Reminder Message</div>
                      <div className="text-[11px] text-slate-500 font-medium">Kirim pesan pengingat saat idle tercapai.</div>
                    </div>
                    <InboxToggle checked={idleReminderEnabled} onChange={setIdleReminderEnabled} />
                  </div>
                  {idleReminderEnabled && (
                    <Textarea 
                      value={idleReminderMsg} 
                      onChange={(e) => setIdleReminderMsg(e.target.value)} 
                      className="min-h-[80px] bg-slate-50 text-xs mt-2"
                    />
                  )}
                </Card>

                <Card className="p-5 border-slate-200 bg-white shadow-2xs space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-slate-900">Auto Resolve / Close</div>
                      <div className="text-[11px] text-slate-500 font-medium">Tutup percakapan otomatis jika tidak dibalas.</div>
                    </div>
                    <InboxToggle checked={idleAutoResolve} onChange={setIdleAutoResolve} />
                  </div>
                  {idleAutoResolve && (
                    <div className="grid grid-cols-2 gap-4 mt-2">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-900">Ubah status menjadi</label>
                        <select
                          className="w-full h-9 rounded-md border border-slate-200 bg-slate-50 px-3 text-xs font-semibold text-slate-900 focus:outline-none focus:border-blue-600"
                          value={idleResolveStatus}
                          onChange={(e) => setIdleResolveStatus(e.target.value)}
                        >
                          <option value="Resolved">Resolved</option>
                          <option value="Closed">Closed</option>
                          <option value="Archived">Archived</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-900">Tambahkan tag</label>
                        <Input value={idleAddTag} onChange={(e) => setIdleAddTag(e.target.value)} className="h-9 bg-slate-50 text-xs" />
                      </div>
                    </div>
                  )}
                </Card>
              </div>
            )}
            
            <div className="pt-2">
              <Button onClick={saveSettings} variant="primary" size="sm" className="gap-1.5">
                {isSaved ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />}
                {isSaved ? "Tersimpan!" : "Save Idle Rules"}
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {showResModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 space-y-4 shadow-2xl">
            <h4 className="text-base font-bold text-slate-900">Create Auto Responder</h4>
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-900">Name</label>
                <Input placeholder="e.g. Greeting" value={resForm.name} onChange={(e) => setResForm({...resForm, name: e.target.value})} className="h-9 text-xs bg-slate-50" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-900">Type</label>
                <select
                  className="w-full h-9 rounded-md border border-slate-200 bg-slate-50 px-3 text-xs font-semibold text-slate-900 focus:outline-none focus:border-blue-600"
                  value={resForm.type}
                  onChange={(e) => setResForm({...resForm, type: e.target.value})}
                >
                  {["Greeting Message", "Away Message", "Outside Office Hours Message", "Busy Agent Message", "Queue Waiting Message", "Conversation Closed Message"].map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-900">Trigger</label>
                <select
                  className="w-full h-9 rounded-md border border-slate-200 bg-slate-50 px-3 text-xs font-semibold text-slate-900 focus:outline-none focus:border-blue-600"
                  value={resForm.trigger}
                  onChange={(e) => setResForm({...resForm, trigger: e.target.value})}
                >
                  {["First incoming message", "Every new conversation", "Outside office hours", "All agents busy", "All agents offline", "Customer enters queue", "Conversation resolved"].map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-900">Message Content</label>
                <Textarea value={resForm.message} onChange={(e) => setResForm({...resForm, message: e.target.value})} className="min-h-[80px] bg-slate-50 text-xs" />
              </div>
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <Button variant="secondary" onClick={() => setShowResModal(false)} size="sm">Cancel</Button>
              <Button variant="primary" size="sm" onClick={() => {
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 space-y-4 shadow-2xl">
            <h4 className="text-base font-bold text-slate-900">Create Template</h4>
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-900">Name</label>
                <Input placeholder="e.g. Booking Confirm" value={tplForm.name} onChange={(e) => setTplForm({...tplForm, name: e.target.value})} className="h-9 text-xs bg-slate-50" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-900">Category</label>
                <select
                  className="w-full h-9 rounded-md border border-slate-200 bg-slate-50 px-3 text-xs font-semibold text-slate-900 focus:outline-none focus:border-blue-600"
                  value={tplForm.category}
                  onChange={(e) => setTplForm({...tplForm, category: e.target.value})}
                >
                  {["Greeting", "FAQ", "Booking", "Payment", "Service Update", "Complaint", "Follow Up"].map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-900">Message Body (Use {"{{var}}"} for variables)</label>
                <Textarea value={tplForm.body} onChange={(e) => setTplForm({...tplForm, body: e.target.value})} className="min-h-[100px] bg-slate-50 text-xs font-mono" />
              </div>
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <Button variant="secondary" onClick={() => setShowTplModal(false)} size="sm">Cancel</Button>
              <Button variant="primary" size="sm" onClick={() => {
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 space-y-4 shadow-2xl">
            <h4 className="text-base font-bold text-slate-900">Create Tag</h4>
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-900">Tag Name</label>
                <Input placeholder="e.g. VIP Customer" value={tagForm.name} onChange={(e) => setTagForm({...tagForm, name: e.target.value})} className="h-9 text-xs bg-slate-50" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-900">Category</label>
                <select
                  className="w-full h-9 rounded-md border border-slate-200 bg-slate-50 px-3 text-xs font-semibold text-slate-900 focus:outline-none focus:border-blue-600"
                  value={tagForm.category}
                  onChange={(e) => setTagForm({...tagForm, category: e.target.value})}
                >
                  {["Sales", "Support", "Service", "Complaint", "Payment", "Priority", "Internal"].map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <Button variant="secondary" onClick={() => setShowTagModal(false)} size="sm">Cancel</Button>
              <Button variant="primary" size="sm" onClick={() => {
                if (!tagForm.name) return;
                setTags([...tags, { id: "tag_" + Date.now(), ...tagForm, status: "Active" }]);
                setTagForm({ name: "", color: "bg-blue-50 text-blue-700 border-blue-200", category: "General", visibility: "All agents" });
                setShowTagModal(false);
              }}>Save Tag</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
