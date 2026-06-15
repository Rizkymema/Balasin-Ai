# Balesin Desk

Balesin Desk adalah dashboard AI Omnichannel CRM untuk mengelola unified inbox, AI assistant, knowledge base, CRM customer, booking, ticket, produk/layanan, broadcast campaign, channels, reports, dan automation dari satu workspace.

Dokumen [fitur.md](/d:/Project%20Apk-Web/chatbotAI/fitur.md) sekarang menjadi blueprint fitur target. Implementasi repo ini sudah mengejar baseline operasional inti, sementara fitur yang belum production-ready tetap ditandai jelas sebagai roadmap.

## Status Saat Ini

- Backend API sudah nyata dan persisten dengan SQLite lokal.
- Unified inbox, customer, booking, ticket, produk/layanan, knowledge, broadcast, dan worker queue sudah punya baseline operasional.
- Webhook inbound tersedia untuk WhatsApp, Instagram DM/komentar, dan website chat.
- Dashboard channels sudah bisa dipakai untuk simulasi inbound/outbound test.
- Login masih mode demo, tetapi route protection sudah aktif memakai cookie session.

## Area Fitur

### Sudah Ada di Repo

- Dashboard overview operasional
- Unified inbox dasar
- AI assistant settings dasar
- Knowledge base upload dan FAQ
- Contacts / CRM dasar
- Products & Services catalog dasar
- Booking management dasar
- Ticketing dasar
- Broadcast / campaign dasar
- Automation rules dan worker queue dasar
- Channels center untuk WhatsApp, Instagram, dan website chat
- Reports dasar dari data operasional
- Team / settings dasar

### Masih Roadmap

- Chatbot flow builder visual
- Advanced automation builder
- Telegram channel live
- Facebook Messenger / Email / Marketplace channel
- AI suggested reply production
- Sentiment analysis production
- Full role & permission system
- Billing / package usage
- Multi-workspace SaaS

## Quick Start

```bash
npm install
copy .env.example .env.local
npm run dev
```

Buka `http://localhost:3000`.

## Scripts

- `npm run dev`
- `npm run clean`
- `npm run build`
- `npm run start`
- `npm run lint`
- `npm run typecheck`
- `npm run format`
- `npm run check`

## Environment Variables

Isi minimal file `.env.local` dengan nilai berikut:

```env
NEXT_PUBLIC_APP_NAME=Balesin Desk
NEXT_PUBLIC_APP_URL=http://localhost:3000
SESSION_COOKIE_NAME=balesin_session
SESSION_SECRET=change-this-demo-session-secret
WORKER_SECRET=change-this-worker-secret
WHATSAPP_BASE_URL=https://graph.facebook.com
WHATSAPP_API_VERSION=v21.0
```

Catatan:
- Kredensial WhatsApp Business, verify token, dan access token channel diisi dari dashboard.
- `SESSION_SECRET` dan `WORKER_SECRET` wajib diganti saat masuk environment non-local.

## Menjalankan Worker

Worker bisa dipanggil dari internal scheduler, cron, atau automation engine lain:

```bash
curl -X POST http://localhost:3000/api/workers/run ^
  -H "x-worker-secret: YOUR_WORKER_SECRET"
```

Endpoint ini akan:
- menjadwalkan job operasional yang due,
- mengeksekusi antrean,
- mengembalikan hasil job yang diproses.

## Webhook yang Tersedia

- `POST /api/webhooks/webchat`
- `GET|POST /api/webhooks/whatsapp`
- `POST /api/webhooks/instagram`

Catatan implementasi:
- WhatsApp `GET` dipakai untuk verifikasi webhook Meta.
- Instagram route menerima DM dan komentar yang dinormalisasi ke inbox internal.
- Validasi signature provider belum diaktifkan.

## Struktur Fitur Saat Ini

```text
Dashboard
Unified Inbox
AI Assistant
Knowledge Base
Contacts / CRM
Products & Services
Booking
Tickets
Broadcast / Campaign
Automation
Channels
Reports
Team & Settings
```

## Penyimpanan Data

Data runtime disimpan di folder lokal berikut:

- `data/balesin.sqlite`
- `data/knowledge/*`

Folder `data/` sudah diabaikan oleh Git.

## Struktur Project

```text
.
|-- fitur.md
|-- flow.md
|-- README.md
|-- package.json
|-- src
|   |-- app
|   |   |-- (dashboard)
|   |   `-- api
|   |-- components
|   |-- constants
|   |-- hooks
|   |-- lib
|   |-- server
|   `-- types
`-- dokumen
```

## Area Penting

- `src/server/db.ts`: inisialisasi SQLite dan schema runtime.
- `src/server/services/inbox-service.ts`: normalisasi pesan masuk, intent dasar, dan auto-reply/handoff.
- `src/server/services/operations-service.ts`: action backend untuk reply, notes, status, dan ticket inbox.
- `src/server/services/automation-service.ts`: scheduler dan executor queue.
- `src/app/api/*`: endpoint session, dashboard, inbox, resources, channels, webhook, knowledge, dan worker.

## Build dan Validasi

Project sudah diverifikasi dengan:

- `npm run lint`
- `npm run typecheck`
- `npm run build`
- `npm run check`

`node:sqlite` masih mengeluarkan warning experimental di Node 22, tetapi build dan runtime Next.js tetap berjalan.

## Langkah Berikutnya

- Ganti auth demo ke provider production.
- Tambahkan signature verification untuk webhook Meta.
- Jalankan worker via cron atau queue runner terpisah.
- Tambahkan AI grounding / vector retrieval production.
- Tambahkan channel Telegram live dan integration center yang lebih luas.
