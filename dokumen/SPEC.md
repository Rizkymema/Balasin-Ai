# Balesin Desk Specification

## Product Summary

Balesin Desk adalah dashboard AI Omnichannel CRM untuk operasional customer service, booking, katalog produk/layanan, ticketing, campaign, dan automation, dengan inbox terpusat sebagai pusat kontrol utama.

Dokumen [fitur.md](/d:/Project%20Apk-Web/chatbotAI/fitur.md) menjadi blueprint fitur target. Spesifikasi ini merangkum implementasi yang sedang berjalan, MVP yang diprioritaskan, dan area yang masih roadmap.

## Product Goal

Membangun fondasi produk yang dapat berkembang dari MVP operasional menjadi platform setara CRM omnichannel seperti Qontak, tetapi dengan kekuatan lebih pada AI guardrail, knowledge grounding, booking bengkel, sparepart/service catalog, dan workflow automation.

## Information Architecture Target

Menu utama yang menjadi arah produk:

- Dashboard
- Unified Inbox
- AI Assistant
- Knowledge Base
- Contacts / CRM
- Products & Services
- Booking
- Tickets
- Broadcast / Campaign
- Automation
- Channels
- Reports
- Team & Settings

## MVP Scope

### Included in MVP V1

- Dashboard overview KPI operasional
- Unified inbox omnichannel dasar
- WhatsApp integration
- Instagram DM dan comment integration
- Website live chat
- AI intent classification dasar
- AI auto reply dengan confidence guardrail
- Human handoff ke admin
- Customer CRM dasar
- Knowledge base upload dan FAQ
- Product / sparepart / service catalog
- Booking management dasar
- Ticketing dasar
- Broadcast dasar
- Basic report
- Role admin / agent dasar

### Planned for V2

- Flow builder / chatbot builder
- Automation builder yang lebih visual
- Advanced broadcast dan segmentasi
- Agent allocation dan routing
- SLA ticketing
- AI suggested reply
- Sentiment analysis
- Spam detection
- Google Sheets integration
- Telegram notification
- Campaign analytics

### Planned for V3

- Marketplace chat
- Payment integration
- Advanced sales pipeline
- Multi-workspace SaaS
- Billing usage
- Advanced security
- Mobile app

## Current Implementation Snapshot

Saat ini repo sudah memiliki:

- Dashboard operasional berbasis Next.js App Router
- Session cookie demo dan proteksi route internal
- Backend SQLite persisten
- API untuk conversations, customers, bookings, tickets, products, services, broadcasts
- Webhook inbound untuk WhatsApp, Instagram DM/comment, dan website chat
- Knowledge base ingestion untuk beberapa format dokumen
- Worker queue dasar untuk follow-up, reminder, broadcast, dan analytics
- Inbox action backend untuk reply, status change, notes, dan ticket creation
- Panel test channel dan worker control dari dashboard

## Functional Requirements

### Dashboard Overview

- Menampilkan KPI seperti total chat, chat aktif, handoff, booking, komplain, response time, lead, dan conversion
- Menjadi ringkasan lintas modul, bukan hanya landing statis
- Menunjukkan channel aktif, coverage automation, dan isu operasional penting

### Unified Inbox

- Semua percakapan dari channel masuk ke satu area
- Mendukung filter by channel, status, intent, dan assigned state
- Mendukung manual takeover, resolve, reopen, notes, dan profile sidebar
- Menampilkan AI summary, confidence, intent terakhir, dan ticket aktif

### AI Assistant

- Menyimpan konfigurasi AI, fallback, blacklist, dan confidence threshold
- Menjadi rumah untuk intent settings, prompt control, fallback rules, dan AI logs roadmap
- Mengikuti guardrail: tidak mengarang harga, stok, atau diagnosa berat

### Knowledge Base

- Mendukung FAQ, profil bisnis, dan dokumen sumber
- Menjadi sumber kebenaran untuk FAQ, harga, SOP, kebijakan, dan diagnosa ringan
- Siap berkembang ke versioning, approval, dan knowledge gap detection

### Contacts / CRM

- Menyimpan customer profile, lead status, tag, riwayat chat, booking, dan segmentasi
- Mendukung status seperti new lead, prospect, active customer, repeat, VIP, complaint, blocked

### Products & Services

- Menyimpan katalog produk, sparepart, dan jasa
- Mencakup harga, stok, kategori, kompatibilitas motor, dan deskripsi
- Siap dihubungkan ke PostgreSQL / Google Sheets sync

### Booking

- Mendukung booking service, slot, assignment, reminder, reschedule, dan payment status roadmap
- Menjadi modul operasional unggulan untuk use case bengkel

### Tickets

- Chat komplain bisa menjadi ticket
- Mendukung priority, status, assignee, resolution note, dan reopen roadmap

### Broadcast / Campaign

- Mendukung create campaign, audience, template, status, schedule, dan campaign result dasar
- Siap berkembang ke analytics, A/B testing, dan opt-out management

### Automation

- Menyimpan handoff threshold, follow-up delay, reminder, spam guard, sentiment guard
- Mendukung workflow trigger/action/condition secara bertahap
- Menjadi jembatan ke n8n dan integrasi eksternal

### Channels & Integration

- Mengelola konfigurasi WhatsApp, Instagram, dan website chat
- Menyediakan webhook entrypoint dan test panel dari dashboard
- Menjadi dasar untuk Telegram, email, marketplace, Google Sheets, PostgreSQL, n8n, Meta Graph API, dan provider AI

### Reports

- Menyediakan laporan chat, AI, booking, ticket, campaign, dan conversion bertahap
- Minimal menampilkan metric penting seperti total conversations, open/resolved, handoff rate, response time, booking count

### Team & Settings

- Menyimpan workspace profile, members, notifications, dan pengaturan platform
- Siap berkembang ke role, permission, audit log, security, API key management, dan billing usage

## Non-Functional Requirements

- Clean TypeScript architecture
- App Router-based Next.js structure
- Responsive design
- Reusable component system
- No secrets committed to source
- Data persistence for internal operations
- Safe AI fallback behavior
- Easy extension toward PostgreSQL, n8n, OpenAI/OpenRouter, and Meta integrations

## Explicitly Not Finished Yet

- Auth production
- Webhook signature verification
- Provider-backed outbound delivery selain WhatsApp live path
- Full AI grounding / vector retrieval production
- Cron/service runner untuk worker background
- Full role & permission system
- Billing / package usage

## Success Criteria

- Project installs and builds successfully
- Arsitektur dashboard mengikuti blueprint `fitur.md`
- UI dan istilah modul konsisten dengan target produk
- Dashboard, inbox, channels, automation, booking, ticket, knowledge, dan catalog sudah memiliki baseline operasional
- Kode siap dikembangkan ke automation dan integrasi production tanpa refactor besar
