import type { FeaturePillar, MetricCard, WorkflowStep } from "@/types/product";

export const heroMetrics: MetricCard[] = [
  {
    label: "Core Channels",
    value: "5 MVP",
    detail: "WhatsApp, IG DM, IG Comment, Telegram, dan Website Chat menjadi arah inti platform.",
  },
  {
    label: "Human Handoff",
    value: "< 60s",
    detail: "Kasus sensitif, komplain, dan confidence rendah wajib diarahkan ke admin.",
  },
  {
    label: "Blueprint Scope",
    value: "20 Area",
    detail: "Dari inbox, AI, CRM, ticketing, booking, campaign, hingga audit dan integration center.",
  },
];

export const featurePillars: FeaturePillar[] = [
  {
    title: "Omnichannel inbox yang operasional",
    description:
      "Satu workspace untuk melihat percakapan WA, IG, Telegram, website, status chat, assign admin, dan catatan internal.",
    bullets: ["Filter channel", "Manual takeover", "Customer profile sidebar"],
  },
  {
    title: "AI assistant yang terkontrol",
    description:
      "AI hanya menjawab berdasarkan data bisnis, knowledge, produk, dan aturan safety, bukan improvisasi liar.",
    bullets: ["Intent classification", "Confidence score", "Human handoff rules"],
  },
  {
    title: "CRM, booking, dan katalog yang menyatu",
    description:
      "Data customer, booking, produk, sparepart, layanan, dan ticket disimpan sebagai sumber operasional yang sama.",
    bullets: ["Customer timeline", "Booking management", "Product/service lookup"],
  },
];

export const workflowSteps: WorkflowStep[] = [
  {
    title: "Capture",
    description: "Pesan dari WA, IG, Telegram, atau website masuk ke satu jalur normalisasi.",
  },
  {
    title: "Classify",
    description: "Sistem mendeteksi intent, sentimen, risiko, dan kebutuhan handoff admin.",
  },
  {
    title: "Ground",
    description: "AI mengambil jawaban dari knowledge base, katalog, booking, dan aturan bisnis.",
  },
  {
    title: "Decide",
    description: "Safety filter menentukan reply otomatis, review, hide/delete komentar, atau handoff.",
  },
  {
    title: "Operate",
    description: "Percakapan dan keputusan disimpan untuk inbox, CRM, tickets, booking, dan analytics.",
  },
];

export const roadmapItems = [
  {
    phase: "MVP V1",
    title: "Core Omnichannel",
    detail: "Dashboard, unified inbox, WA/IG integration, AI auto reply, human handoff, CRM, KB, booking, katalog, ticketing, broadcast dasar, dan basic report.",
  },
  {
    phase: "V2",
    title: "Automation & Agent Ops",
    detail: "Flow builder, automation builder, SLA ticketing, AI suggestion, sentiment/spam detection, Google Sheets integration, Telegram notification, dan campaign analytics.",
  },
  {
    phase: "V3",
    title: "SaaS Expansion",
    detail: "Marketplace chat, payment integration, advanced sales pipeline, multi-workspace SaaS, billing usage, advanced security, dan mobile app.",
  },
];
