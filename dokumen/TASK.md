# TASK

## Nama Task

Fondasi awal Balesin AI untuk web dashboard berbasis Next.js.

## Tujuan

Membangun baseline project yang profesional untuk Balesin AI agar siap dikembangkan menjadi platform AI customer service omnichannel untuk UMKM Indonesia.

## Latar Belakang

Project ini dimulai dari kebutuhan membuat produk yang tidak hanya sekadar bisa jalan, tetapi punya struktur engineering yang rapi, UI yang modern, mudah dikembangkan, dan aman untuk dikembangkan menjadi SaaS yang lebih besar.

Konsep produk utama:

- Dashboard overview operasional
- Unified inbox omnichannel
- AI assistant dengan safety control
- Knowledge base
- Contacts / CRM
- Booking, tickets, dan campaign
- Products & services catalog
- Channels, reports, dan automation

## Scope Task Saat Ini

Task saat ini sudah bergerak dari fondasi frontend ke baseline backend operasional, webhook inbound, knowledge ingestion, dan worker automation, dengan login tetap sengaja dibiarkan demo.

### Yang Termasuk

- Setup project Next.js App Router dengan TypeScript
- Setup Tailwind CSS v4
- Penyusunan struktur folder `src/`
- Pembuatan reusable UI primitives
- Pembuatan halaman awal sebagai representasi arah produk
- Pembuatan route dashboard utama untuk modul operasional
- Pembuatan backend SQLite untuk dashboard config dan data operasional
- Pembuatan session cookie demo dan proteksi route internal
- Pembuatan endpoint API untuk inbox, customer, booking, ticket, produk, layanan, dan broadcast
- Pembuatan webhook inbound untuk WhatsApp, Instagram DM/komentar, dan web chat
- Pembuatan upload dan ingestion knowledge base
- Pembuatan worker queue untuk handoff, follow-up, reminder, broadcast, dan analytics
- Pembuatan file governance dan dokumentasi proyek
- Penyelarasan spesifikasi produk dengan blueprint `fitur.md`
- Verifikasi `lint`, `typecheck`, dan `build`

### Yang Belum Termasuk

- Finalisasi auth production
- Integrasi AI provider / vector store production
- Signature verification webhook provider
- Scheduler/runner terpisah untuk worker production
- Billing dan payment

## Deliverables

- [x] `SPEC.md`
- [x] `PROJECT_CONTEXT.md`
- [x] `AGENTS.md`
- [x] `TASK.md`
- [x] `TASK_QUEUE.md`
- [x] `ERROR_LOG.md`
- [x] `CHANGELOG_AI.md`
- [x] `DECISION_LOG.md`
- [x] `TESTING_RULES.md`
- [x] `DEPLOYMENT.md`
- [x] `README.md`
- [x] `package.json`
- [x] `src/` foundation

## Status Saat Ini

### Selesai

- Fondasi project berhasil dibuat
- Struktur folder utama sudah tersedia
- UI landing/dashboard starter sudah tersedia
- Reusable component dasar sudah tersedia
- Build verification sudah lolos
- Dashboard config center untuk AI, knowledge base, channels, automation, dan settings
- Shared operational data store untuk inbox, customer, booking, analytics, ticket, produk/layanan, dan broadcast
- Service/helper layer local storage untuk konfigurasi dashboard dan data operasional
- Dashboard route terpisah
- Unified Inbox page
- AI Assistant page
- Knowledge Base page
- Channels page
- Automation page
- Contacts / CRM page
- Booking page
- Products & Services page
- Tickets page
- Broadcast / Campaign page
- Reports page
- Team & Settings page
- Demo auth top-level route (`/login`, `/register`, `/forgot-password`, `/reset-password`, `/verify-email`)
- UI scaffold workspace onboarding
- Root shell dipisah agar dashboard/auth tidak memakai header-footer landing page
- Dashboard visual dirapikan ke arah control panel operasional yang lebih netral
- Backend SQLite persisten untuk config, inbox, customer, booking, ticket, produk/layanan, broadcast, jobs, dan webhook events
- API live untuk dashboard config dan resource operasional
- Session cookie demo untuk login/register dan proteksi route dashboard/API internal
- Webhook inbound untuk WhatsApp, Instagram DM/komentar, dan web chat
- Knowledge base upload dan ingestion nyata untuk PDF, DOCX, TXT, MD, CSV, JSON, dan HTML
- Worker queue untuk follow-up, handoff notify, booking reminder, broadcast send, dan analytics rollup
- README dan environment setup disesuaikan dengan runtime backend saat ini
- Terminologi modul, navigasi, dan spesifikasi diselaraskan dengan blueprint `fitur.md`
- Input operasional dari dashboard dilengkapi untuk create/update/delete customer, booking, ticket, produk, dan layanan
- Dashboard overview menampilkan checklist setup agar bagian yang belum terisi langsung terlihat

### Sedang Berjalan

- Tidak ada

### Belum Dikerjakan

- Finalisasi auth/login production dengan provider nyata
- Grounding AI Agent dengan real LLM dan vector retrieval
- Signature verification untuk webhook Meta
- Scheduler background/cron untuk trigger worker otomatis
- Outbound adapter tambahan untuk channel selain WhatsApp live send
- Segmentasi customer, analytics enrichment, dan delivery report yang lebih detail

## Acceptance Criteria

- Repository memiliki struktur dokumentasi proyek yang jelas
- Project dapat di-install dan dijalankan tanpa error
- `npm run lint` berhasil
- `npm run typecheck` berhasil
- `npm run build` berhasil
- UI memiliki arah visual yang konsisten dan tidak terasa seperti template default
- Struktur code siap untuk pengembangan fitur tahap berikutnya
- Dashboard dan API internal sudah membaca/menulis data persisten
- Worker internal bisa dijalankan tanpa error
- Upload knowledge base menghasilkan chunk ingestion yang bisa dipakai modul AI berikutnya

## Next Recommended Task

Task berikutnya yang paling disarankan:

1. Finalisasi contract data untuk backend API dan webhook payload
2. Tambahkan auth production dan role policy yang lebih ketat
3. Tambahkan signature verification dan observability webhook
4. Hubungkan AI provider, retrieval, dan prompt orchestration
5. Jalankan worker lewat cron atau service terpisah untuk mode production

## Catatan

Task ini sudah melewati tahap fondasi frontend dan masuk ke baseline operasional. Tujuannya sekarang adalah memastikan arsitektur cukup nyata untuk integrasi automation berikutnya tanpa perlu refactor besar.
