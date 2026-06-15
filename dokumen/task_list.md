# 📋 Task List — Balesin AI Dashboard

> **Project:** Balesin AI — Platform AI Customer Service Omnichannel untuk UMKM Indonesia  
> **Tech Stack:** Next.js 15, React 19, TypeScript, Tailwind CSS v4, Lucide React  
> **Updated:** 2026-06-13  

---

## ✅ STATUS LEGEND

| Simbol | Arti |
|--------|------|
| `[ ]`  | Belum dikerjakan |
| `[/]`  | Sedang dikerjakan |
| `[x]`  | Selesai |
| `[-]`  | Ditunda / Dibatalkan |

---

## 🏗️ PHASE 1 — Foundation & Infrastructure

### 1.1 Project Setup & Config
- [x] Inisialisasi project Next.js 15 + TypeScript
- [x] Konfigurasi Tailwind CSS v4
- [x] Setup ESLint + Prettier
- [x] Konfigurasi font (Space Grotesk + IBM Plex Mono)
- [x] Setup siteConfig (`/src/constants/site.ts`)
- [x] Setup types dasar (`/src/types/product.ts`)
- [x] Konfigurasi path alias `@/` di `tsconfig.json`
- [x] Setup environment variables (`.env.local`)
- [x] Setup `next.config.ts` untuk image domain & rewrites

### 1.2 Design System & Globals
- [x] Setup `globals.css` dengan CSS variables
- [x] Definisi color tokens (`--color-bg`, dll)
- [x] Tambahkan design tokens lengkap (spacing, border-radius, shadows)
- [x] Buat komponen `<Typography>` / heading variants
- [x] Buat utility class untuk gradient dan glassmorphism
- [x] Dark mode support (default dark theme)

### 1.3 Core UI Components (`/src/components/ui/`)
- [x] `badge.tsx` — Badge / chip component
- [x] `button.tsx` — Button dengan variants
- [x] `card.tsx` — Card container
- [x] `section-heading.tsx` — Heading section
- [x] `input.tsx` — Input field dengan variants
- [x] `textarea.tsx` — Textarea
- [x] `select.tsx` — Dropdown select
- [x] `modal.tsx` — Dialog / Modal overlay
- [x] `dropdown.tsx` — Dropdown menu
- [x] `tooltip.tsx` — Tooltip
- [x] `avatar.tsx` — User avatar
- [x] `spinner.tsx` — Loading spinner
- [x] `skeleton.tsx` — Skeleton loading
- [x] `toast.tsx` — Notification toast
- [x] `tabs.tsx` — Tab navigation
- [x] `table.tsx` — Data table
- [x] `sidebar.tsx` — Sidebar navigation
- [x] `breadcrumb.tsx` — Breadcrumb navigation
- [x] `empty-state.tsx` — Empty state placeholder

---

## 🌐 PHASE 2 — Landing Page (Marketing Site)

### 2.1 Layout Components (`/src/components/layout/`)
- [x] `site-header.tsx` — Header dengan navigasi utama
- [x] `site-footer.tsx` — Footer
- [x] Tambahkan mobile menu / hamburger di header
- [x] Smooth scroll behavior untuk anchor links

### 2.2 Sections (`/src/components/sections/`)
- [x] `hero-section.tsx` — Hero dengan metrics card
- [x] `platform-section.tsx` — Feature pillars
- [x] `modules-section.tsx` — Dashboard modules overview
- [x] `workflow-section.tsx` — 5-step workflow
- [x] `roadmap-section.tsx` — 4 phase roadmap
- [x] `pricing-section.tsx` — Harga / paket
- [x] `testimonial-section.tsx` — Social proof
- [x] `faq-section.tsx` — FAQ
- [x] `cta-section.tsx` — Call-to-action / Signup

### 2.3 Landing Page Route (`/src/app/`)
- [x] `page.tsx` — Home page (compose semua sections)
- [x] `layout.tsx` — Root layout dengan fonts & background gradient
- [x] SEO metadata per section
- [x] Open Graph image
- [x] `sitemap.ts` — Sitemap generator
- [x] `robots.ts` — Robots.txt

---

## 🔐 PHASE 3 — Auth Flow

### 3.1 Auth Pages (`/src/app/(auth)/`)
- [x] Buat route group `(auth)` terpisah dari dashboard
- [x] `layout.tsx` — Auth layout (centered, brand visual)
- [x] `login/page.tsx` — Halaman Login
  - [x] Form email + password
  - [x] Tombol "Login dengan Google"
  - [x] Link "Lupa password?" → forgot-password page
  - [x] Link "Belum punya akun?" → register page
- [x] `register/page.tsx` — Halaman Register / Sign Up
  - [x] Form nama, email, password, konfirmasi password
  - [x] Tombol "Daftar dengan Google"
  - [x] Link "Sudah punya akun?" → login page
  - [x] Terms & Privacy checkbox
- [x] `forgot-password/page.tsx` — Halaman Lupa Password
  - [x] Form email
  - [x] Kirim email reset
- [x] `reset-password/page.tsx` — Halaman Reset Password
  - [x] Form password baru + konfirmasi
  - [x] Token validasi dari URL
- [x] `verify-email/page.tsx` — Halaman Verifikasi Email
  - [x] Tampilkan instruksi cek email
  - [x] Tombol resend email

### 3.2 Auth Logic & Middleware
- [-] Setup auth library (NextAuth.js / Better Auth / Supabase Auth)
- [-] `middleware.ts` — Proteksi route dashboard
- [-] Session management (client + server)
- [-] Refresh token handling
- [-] Google OAuth provider
- [-] Error handling (invalid credentials, email taken, dll)

---

## 🏢 PHASE 4 — Workspace Onboarding

### 4.1 Onboarding Flow (`/src/app/(onboarding)/`)
- [x] Buat route group `(onboarding)`
- [x] `layout.tsx` — Onboarding layout (stepper / progress bar)
- [x] `step-1/page.tsx` — Nama & Profil Bisnis
  - [x] Input nama bisnis
  - [x] Upload logo
  - [x] Pilih industri / kategori UMKM
- [x] `step-2/page.tsx` — Pilih Channel Pertama
  - [x] Pilih: Website Chat / WhatsApp / Instagram / Lainnya
  - [x] Info koneksi awal per channel
- [x] `step-3/page.tsx` — Setup Knowledge Base Awal
  - [x] Input FAQ pertama (minimal 3)
  - [x] Upload dokumen bisnis (opsional)
  - [x] Input profil produk/layanan
- [x] `step-4/page.tsx` — Undang Anggota Tim (opsional)
  - [x] Input email admin lainnya
  - [x] Tentukan role (Admin / Operator)
- [x] `complete/page.tsx` — Onboarding Selesai
  - [x] Ringkasan setup
  - [x] Tombol "Masuk ke Dashboard"

### 4.2 Onboarding Logic
- [x] State management multi-step form
- [x] Validasi per step
- [ ] Simpan progress onboarding ke database
- [x] Skip onboarding (lanjut ke dashboard)
- [x] Tandai workspace sebagai "onboarded"

---

## 📊 PHASE 5 — Dashboard Layout

### 5.1 Dashboard Shell (`/src/app/(dashboard)/`)
- [x] Buat route group `(dashboard)` terpisah dari marketing site
- [x] `layout.tsx` — Dashboard layout
  - [x] Sidebar navigasi kiri (collapsible)
  - [x] Topbar dengan breadcrumb, notifikasi, user menu
  - [x] Responsive: sidebar drawer di mobile
  - [x] Workspace switcher di sidebar
- [ ] Sidebar items:
  - [ ] Dashboard (icon: LayoutDashboard)
  - [ ] Inbox (icon: MessageSquare)
  - [ ] AI Agent (icon: Bot)
  - [ ] Knowledge Base (icon: BookOpen)
  - [ ] Channels (icon: Wifi)
  - [ ] Analytics (icon: BarChart2)
  - [ ] Settings (icon: Settings2)

### 5.2 Dashboard Components (`/src/components/dashboard/`)
- [ ] `sidebar-nav.tsx` — Sidebar navigation list
- [ ] `topbar.tsx` — Dashboard topbar
- [ ] `workspace-switcher.tsx` — Dropdown ganti workspace
- [ ] `notification-bell.tsx` — Icon notifikasi + badge count
- [ ] `user-menu.tsx` — Avatar + dropdown (profil, logout)
- [ ] `stat-card.tsx` — KPI metric card
- [ ] `chart-area.tsx` — Wrapper chart (Recharts / Chart.js)

---

## 🏠 PHASE 6 — Dashboard Home Page

### 6.1 Route (`/src/app/(dashboard)/dashboard/page.tsx`)
- [x] Buat halaman utama Dashboard
- [x] KPI Summary Cards:
  - [x] Total percakapan hari ini
  - [x] AI auto-reply rate (%)
  - [x] Human handoff count
  - [x] Avg. response time
  - [x] Unread / pending conversations
- [x] Chart percakapan per hari (7 hari terakhir)
- [x] Tabel top channel by volume
- [x] Quick actions (Buka Inbox, Tambah FAQ, Lihat Analytics)
- [x] Feed aktivitas terbaru

---

## 💬 PHASE 7 — Inbox Page

### 7.1 Route (`/src/app/(dashboard)/inbox/`)
- [x] `page.tsx` — Inbox utama (layout split 3 panel)

### 7.2 Panel Kiri — Conversation List
- [x] List percakapan (scroll infinite)
- [x] Filter: All / Unread / AI Handled / Human Handled / Pending
- [x] Filter by channel (WhatsApp, Web Chat, Instagram)
- [x] Search percakapan
- [x] Badge count unread per item
- [x] Nama kontak + preview pesan terakhir + timestamp
- [x] Indikator channel (icon kecil)
- [x] Indikator status (online/offline/away)

### 7.3 Panel Tengah — Message Thread
- [x] Bubble chat (user kiri, AI/admin kanan)
- [x] Timestamp per pesan
- [x] Status pesan (delivered/read)
- [x] Tampilkan nama pengirim (AI atau admin mana)
- [x] Input balas pesan (text + emoji + attachment)
- [x] Tombol "Kirim" + shortcut Enter
- [x] AI suggestion chip di atas input
- [x] Tombol "Take Over" / "Handoff ke AI"

### 7.4 Panel Kanan — Contact & Detail
- [x] Nama kontak + avatar
- [x] Channel asal percakapan
- [x] Riwayat percakapan sebelumnya
- [x] Tag percakapan
- [x] Assign admin
- [x] Catatan internal (private notes)
- [x] Aksi: Close, Spam, Archive

---

## 🤖 PHASE 8 — AI Agent Page

### 8.1 Route (`/src/app/(dashboard)/ai-agent/`)
- [x] `page.tsx` — Halaman AI Agent settings

### 8.2 Sections
- [x] **Profil AI Agent**
  - [x] Nama agent / persona
  - [x] Bahasa utama (Indonesia / Inggris / Auto)
  - [x] Tone of voice (Formal / Casual / Friendly)
  - [x] Avatar / foto agent (opsional)
- [x] **Confidence & Safety**
  - [x] Slider confidence threshold (0–100%)
  - [x] Pilih aksi saat confidence rendah: Reply fallback / Handoff / Diam
  - [x] Toggle: Aktifkan safety filter
  - [x] Daftar topic yang dilarang (blacklist)
  - [x] Custom fallback message
- [x] **Human Handoff Rules**
  - [x] Toggle: Handoff otomatis saat agent offline
  - [x] Jam operasional admin (dengan timezone)
  - [x] Pesan saat di luar jam operasional
  - [x] Eskalasi ke admin tertentu
- [x] **Test Playground**
  - [x] Input pesan test
  - [x] Lihat respons AI + confidence score
  - [x] Lihat sumber knowledge yang digunakan
- [x] Tombol Simpan Konfigurasi

---

## 📚 PHASE 9 — Knowledge Base Page

### 9.1 Route (`/src/app/(dashboard)/knowledge-base/`)
- [x] `page.tsx` — Halaman utama Knowledge Base
- [ ] `[id]/page.tsx` — Detail / edit entri

### 9.2 Sections
- [x] **Profil Bisnis**
  - [x] Form nama bisnis, deskripsi, alamat, jam buka
  - [ ] Upload logo
- [x] **FAQ Manager**
  - [x] List FAQ (pertanyaan + jawaban)
  - [x] Tambah / edit / hapus FAQ
  - [x] Search & filter FAQ
  - [ ] Drag-and-drop reorder prioritas
- [x] **Dokumen & File**
  - [x] Upload file (PDF, DOCX, TXT)
  - [x] List file terupload + status parsing
  - [x] Hapus file
- [ ] **Produk & Layanan**
  - [ ] List produk/layanan
  - [ ] Form tambah produk (nama, deskripsi, harga, variasi)
  - [ ] Edit / hapus produk
- [ ] **Custom Rules**
  - [ ] Tambahkan aturan khusus ("Jangan menyebutkan kompetitor")
  - [ ] Toggle aktif/nonaktif per rule

---

## 📡 PHASE 10 — Channels Page

### 10.1 Route (`/src/app/(dashboard)/channels/`)
- [x] `page.tsx` — Daftar semua channel
- [ ] `[channelId]/page.tsx` — Setting per channel

### 10.2 Sections
- [x] **Channel List**
  - [x] Card per channel: logo, nama, status (Connected/Disconnected/Pending)
  - [x] Tombol Connect / Disconnect / Konfigurasi
- [x] **Website Chat (MVP)**
  - [x] Generate embed script (copy-paste ke website)
  - [x] Kustomisasi widget: warna, posisi, welcome message
  - [x] Preview widget
  - [ ] Domain whitelist
- [x] **WhatsApp (MVP)**
  - [x] Connect via WhatsApp Cloud API
  - [x] Input Phone Number ID + Access Token
  - [x] Verifikasi webhook
  - [x] Status koneksi real-time
- [x] **Instagram (Roadmap)**
  - [x] Koneksi akun Instagram Business
  - [x] Pilih tipe: DM / Komentar / Keduanya
  - [x] Status: "Coming Soon" / dalam pengembangan
- [x] **Channel Roadmap Info**
  - [x] Tampilkan channel yang akan datang (Tokopedia, Shopee, dll)

---

## 📈 PHASE 11 — Analytics Page

### 11.1 Route (`/src/app/(dashboard)/analytics/`)
- [x] `page.tsx` — Halaman Analytics

### 11.2 Sections
- [x] **Filter Global**
  - [x] Date range picker (7 hari, 30 hari, custom)
  - [ ] Filter per channel
- [x] **Overview Cards**
  - [x] Total pesan masuk
  - [x] Total percakapan unik
  - [x] AI auto-reply rate
  - [x] Human handoff rate
  - [x] Avg. first response time
  - [ ] Customer satisfaction (CSAT) — jika ada
- [x] **Chart: Volume Percakapan**
  - [x] Line chart per hari / minggu
  - [ ] Breakdown per channel
- [x] **Chart: AI vs Human**
  - [x] Pie / donut chart
  - [x] Tren over time
- [ ] **Performa Admin**
  - [ ] Tabel: admin, jumlah handled, avg response time
- [ ] **Top Intents / Topics**
  - [ ] Tabel atau word cloud topik terbanyak
- [x] **Export**
  - [x] Download CSV / Excel report

---

## ⚙️ PHASE 12 — Settings Page

### 12.1 Route (`/src/app/(dashboard)/settings/`)
- [x] `page.tsx` — Halaman Settings (tabbed)

### 12.2 Tab: Workspace
- [x] Nama workspace
- [x] Timezone
- [x] Bahasa default
- [ ] Upload logo workspace
- [ ] Zona bahaya: hapus workspace

### 12.3 Tab: Tim & Anggota
- [x] List anggota tim (nama, email, role, status)
- [x] Undang anggota baru (kirim email invite)
- [ ] Edit role anggota (Admin / Operator / Viewer)
- [x] Hapus / nonaktifkan anggota

### 12.4 Tab: Notifikasi
- [x] Toggle notifikasi in-app
- [x] Toggle notifikasi email
- [ ] Pilih jenis event (handoff, percakapan baru, error channel)

### 12.5 Tab: Profil Akun
- [ ] Nama, email, foto profil user
- [ ] Ganti password
- [ ] Linked accounts (Google OAuth)

### 12.6 Tab: Billing & Paket (Roadmap)
- [ ] Lihat paket aktif
- [ ] Usage meter (percakapan AI bulan ini)
- [ ] Upgrade / downgrade paket
- [ ] Riwayat invoice

### 12.7 Tab: API & Webhook (Advanced)
- [ ] Generate API key
- [ ] Daftar webhook endpoints
- [ ] Event log webhook

---

## 🔌 PHASE 13 — Backend & API Integration

### 13.1 API Routes (`/src/app/api/`)
- [-] `auth/[...nextauth]/route.ts` — Auth handler
- [-] `workspaces/route.ts` — CRUD workspace
- [-] `conversations/route.ts` — Fetch / update conversations
- [-] `messages/route.ts` — Send / receive messages
- [-] `knowledge/route.ts` — CRUD knowledge base
- [-] `channels/route.ts` — Channel connect / disconnect
- [-] `analytics/route.ts` — Fetch analytics data
- [-] `webhooks/whatsapp/route.ts` — Webhook receiver WhatsApp
- [-] `webhooks/instagram/route.ts` — Webhook receiver Instagram

### 13.2 Data Layer
- [-] Pilih dan setup database (Supabase / PlanetScale / Neon)
- [-] Setup Prisma ORM (schema & migrations)
- [-] Schema: User, Workspace, Member, Conversation, Message, Channel, KnowledgeItem, Analytics
- [-] Setup Supabase Realtime / Pusher untuk live inbox

### 13.3 AI Integration
- [-] Pilih LLM provider (OpenAI GPT-4o / Gemini / Groq)
- [-] Setup prompt engineering (system prompt + grounding)
- [-] RAG pipeline (chunk knowledge base → embedding → vector search)
- [-] Confidence scoring logic
- [-] Safety filter implementation

---

## 🧪 PHASE 14 — Testing & QA

- [-] Unit test komponen UI utama (Jest + React Testing Library)
- [-] Integration test API routes
- [-] E2E test auth flow (Playwright)
- [-] E2E test onboarding flow
- [-] E2E test inbox: kirim & terima pesan
- [-] Test mobile responsiveness (375px, 768px, 1280px)
- [-] Accessibility audit (WCAG 2.1 AA)
- [-] Performance audit (Lighthouse score ≥ 90)

---

## 🚀 PHASE 15 — Deployment & DevOps

- [-] Setup Vercel project (atau alternatif: Railway / Fly.io)
- [-] Setup environment variables di Vercel
- [-] Custom domain
- [-] Setup CI/CD (GitHub Actions: lint → typecheck → build)
- [-] Staging environment
- [-] Error monitoring (Sentry)
- [-] Logging (Axiom / Logtail)
- [-] Uptime monitoring

---

## 📌 PRIORITAS MVP (Segera Dikerjakan)

| # | Task | Priority |
|---|------|----------|
| 1 | Auth Flow (Login + Register) | 🔴 High |
| 2 | Workspace Onboarding (4 steps) | 🔴 High |
| 3 | Dashboard Layout (sidebar + topbar) | 🔴 High |
| 4 | Dashboard Home (KPI cards) | 🔴 High |
| 5 | Inbox Page (3-panel layout) | 🔴 High |
| 6 | Knowledge Base (FAQ + Profil Bisnis) | 🟡 Medium |
| 7 | Channels (Web Chat + WhatsApp) | 🟡 Medium |
| 8 | AI Agent Settings | 🟡 Medium |
| 9 | Analytics (basic charts) | 🟡 Medium |
| 10 | Settings (Workspace + Tim) | 🟢 Normal |

---

## 🗂️ STRUKTUR FOLDER TARGET

```
src/
├── app/
│   ├── (auth)/
│   │   ├── layout.tsx
│   │   ├── login/page.tsx
│   │   ├── register/page.tsx
│   │   ├── forgot-password/page.tsx
│   │   └── reset-password/page.tsx
│   ├── (onboarding)/
│   │   ├── layout.tsx
│   │   ├── step-1/page.tsx
│   │   ├── step-2/page.tsx
│   │   ├── step-3/page.tsx
│   │   ├── step-4/page.tsx
│   │   └── complete/page.tsx
│   ├── (dashboard)/
│   │   ├── layout.tsx
│   │   ├── dashboard/page.tsx
│   │   ├── inbox/page.tsx
│   │   ├── ai-agent/page.tsx
│   │   ├── knowledge-base/
│   │   │   ├── page.tsx
│   │   │   └── [id]/page.tsx
│   │   ├── channels/
│   │   │   ├── page.tsx
│   │   │   └── [channelId]/page.tsx
│   │   ├── analytics/page.tsx
│   │   └── settings/page.tsx
│   ├── api/
│   │   ├── auth/[...nextauth]/route.ts
│   │   ├── workspaces/route.ts
│   │   ├── conversations/route.ts
│   │   └── webhooks/
│   │       ├── whatsapp/route.ts
│   │       └── instagram/route.ts
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
├── components/
│   ├── layout/
│   ├── sections/
│   ├── ui/
│   └── dashboard/
├── constants/
├── lib/
├── types/
└── middleware.ts
```

---

*Dokumen ini adalah living task list — update status secara berkala saat progress berubah.*
