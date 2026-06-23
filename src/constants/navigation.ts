import type { NavigationItem } from "@/types/product";

export const primaryNavigation: NavigationItem[] = [
  { href: "#platform", label: "Platform" },
  { href: "#modules", label: "Modules" },
  { href: "#pricing", label: "Harga" },
  { href: "#testimonials", label: "Testimoni" },
  { href: "#faq", label: "FAQ" },
  { href: "#roadmap", label: "Roadmap" },
];

export const dashboardModules: NavigationItem[] = [
  { href: "/dashboard", label: "Dashboard", description: "Overview KPI chat, lead, booking, komplain, dan response time" },
  { href: "/inbox", label: "Unified Inbox", description: "Omnichannel inbox, AI pause, manual takeover, dan handoff cepat" },
  { href: "/customers", label: "Contacts / CRM", description: "Customer profile, segmentasi, tag, status lead, dan histori follow-up" },
  { href: "/automation?tab=ai_agents", label: "AI Assistant", description: "Intent, prompt, guardrail, confidence, dan fallback control" },
  { href: "/automation?tab=knowledge_base", label: "Knowledge Base", description: "FAQ, artikel, dokumen, profil bisnis, dan sumber jawaban AI" },
  { href: "/products-services", label: "Products & Services", description: "Katalog produk, sparepart, layanan, harga, dan kompatibilitas motor" },
  { href: "/booking", label: "Booking", description: "Booking list, slot, reminder, status jadwal, dan assignment teknisi" },
  { href: "/tickets", label: "Tickets", description: "Komplain, issue teknis, handoff admin, dan resolution tracking" },
  { href: "/automation", label: "Automation", description: "Workflow, trigger, action, worker queue, dan moderation rules" },
  { href: "/broadcast", label: "Broadcast / Campaign", description: "Kampanye WhatsApp, IG DM, segment audience, dan follow-up terjadwal" },
  { href: "/channels", label: "Channels", description: "WhatsApp, Instagram, Telegram roadmap, website chat, dan integration testing" },
  { href: "/analytics", label: "Reports", description: "Chat report, AI report, booking, ticket, campaign, dan conversion metrics" },
  { href: "/settings", label: "Team & Settings", description: "Workspace, anggota tim, notifikasi, role roadmap, dan preferensi platform" },
];
