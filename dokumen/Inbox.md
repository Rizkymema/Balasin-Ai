# Flow Revisi Website Balesin AI

Dokumen ini merapikan alur produk dan struktur dashboard agar selaras dengan revisi website yang sekarang.
Fokus utamanya adalah membuat produk terasa sederhana di permukaan, tetapi tetap kuat untuk operasional AI, omnichannel, CRM, booking, ticketing, dan automation.

---

## 1. Arah Produk

Posisi produk:

**Balesin AI adalah AI omnichannel dashboard** untuk mengelola chat customer, knowledge base, booking, ticket, broadcast, dan automation dari satu tempat.

Prinsip revisi website:

- Menu utama tidak boleh terlalu banyak.
- User harus cepat paham fungsi tiap halaman.
- Fitur besar ditampilkan sebagai modul utama.
- Fitur tambahan ditempatkan sebagai subflow, bukan menambah menu baru.
- Semua pengaturan bisnis sebaiknya bisa dikontrol dari dashboard.

---

## 2. Struktur Menu Utama Website

Menu utama yang dipakai pada revisi sekarang:

1. Dashboard
2. Inbox
3. Customers
4. AI Agent
5. Knowledge Base
6. Products & Services
7. Booking
8. Tickets
9. Automation
10. Broadcast
11. Channels
12. Analytics
13. Settings

Struktur ini mengikuti halaman yang memang ada di aplikasi saat ini dan menjadi fondasi utama website/dashboard.

---

## 3. Struktur Halaman per Modul

### Dashboard

Fungsi:

- Ringkasan performa bisnis
- Status channel
- Status AI
- Jumlah conversation aktif
- Booking, ticket, dan broadcast summary
- Quick action ke modul penting

### Inbox

Fungsi:

- Semua percakapan dari seluruh channel masuk ke satu tempat
- Operator dan AI bekerja dari halaman ini

Subflow penting:

- Semua percakapan
- Ditangani AI
- Butuh admin
- Menunggu customer
- Selesai
- Spam

Fitur inti:

- Search chat
- Filter channel
- Filter status
- Balas manual
- Take over admin
- Private note
- Suggested reply AI
- Delivery status

### Customers

Fungsi:

- Menyimpan data customer lintas channel dalam satu profil
- Menjadi titik awal CRM sederhana

Isi data:

- Nama
- Nomor WhatsApp
- Username sosial
- Email
- Segment
- Tag
- Riwayat interaksi
- Booking
- Ticket
- Nilai lead / status customer

### AI Agent

Fungsi:

- Mengatur perilaku AI
- Menentukan cara AI menjawab
- Mengatur prompt, tone, guardrail, dan handoff

Subflow penting:

- Identitas AI
- Bahasa utama
- Gaya bahasa
- Instruksi balasan
- Contoh gaya bicara
- Keyword sapaan
- Template sapaan
- Blacklist topik
- Confidence threshold
- Fallback message

### Knowledge Base

Fungsi:

- Menjadi sumber data utama untuk AI

Sumber knowledge:

- FAQ manual
- Text manual
- File upload
- Website URL
- Google Sheet

Status yang diharapkan:

- Draft
- Processing
- Ready
- Published
- Needs review

### Products & Services

Fungsi:

- Menyimpan katalog produk dan layanan resmi
- Menjadi sumber jawaban AI untuk harga, stok, dan detail jasa

Data inti:

- Produk
- Layanan
- Harga mulai
- Harga akhir
- Deskripsi
- Durasi
- Status
- Ketersediaan

### Booking

Fungsi:

- Mengelola jadwal layanan, reservasi, dan reminder

Data inti:

- Nama customer
- Layanan
- Tanggal
- Jam
- Keluhan
- Motor / unit
- Status booking
- Catatan admin

### Tickets

Fungsi:

- Menangani kasus yang tidak boleh ditutup AI
- Menjadi alur handoff dari AI ke admin

Data inti:

- Nomor ticket
- Ringkasan masalah
- Prioritas
- Status
- PIC
- SLA
- Catatan internal

### Automation

Fungsi:

- Menjalankan trigger, condition, dan action dari event bisnis

Contoh automation:

- Handoff ke admin
- Reminder booking
- Reminder follow-up lead
- Follow-up broadcast
- Escalation ticket

### Broadcast

Fungsi:

- Mengirim campaign atau pesan massal

Data inti:

- Template
- Audience
- Jadwal kirim
- Channel
- Status campaign
- Hasil campaign

### Channels

Fungsi:

- Mengelola integrasi channel

Channel utama:

- WhatsApp
- Instagram
- Website Chat

Channel lanjutan:

- Facebook
- Telegram
- Email
- API Channel

### Analytics

Fungsi:

- Menampilkan performa percakapan, AI, agent, dan funnel customer

Metrik inti:

- Total conversation
- AI handled
- Human handled
- Handoff rate
- Response time
- Ticket rate
- Booking rate
- Broadcast performance

### Settings

Fungsi:

- Mengelola workspace dan konfigurasi sistem

Isi utama:

- Profil bisnis
- Tim
- Permission
- API key
- Security
- Working hours
- Notifikasi

---

## 4. Flow Besar Seluruh Sistem

```text
Customer / Lead
-> Masuk dari Channel
-> Dinormalisasi ke format internal
-> Dicocokkan ke customer profile
-> Masuk ke Inbox
-> Dicek status conversation
-> Diproses AI atau admin
-> Ambil data dari knowledge / produk / booking / ticket
-> Sistem memberi jawaban atau menjalankan aksi
-> Semua event disimpan
-> Masuk ke analytics, CRM, dan automation
```

Ringkasan alur:

1. Customer menghubungi bisnis lewat salah satu channel.
2. Sistem menerima webhook atau event inbound.
3. Event diubah ke format standar internal.
4. Sistem mencari atau membuat contact/customer.
5. Sistem mencari atau membuat conversation.
6. Inbox menentukan apakah AI boleh menjawab.
7. Jika boleh, AI mengambil knowledge dan data bisnis.
8. Jika tidak aman, sistem handoff ke admin.
9. Semua aktivitas disimpan untuk analytics dan history.

---

## 5. Flow Pesan Masuk

### 5.1 Event dari Channel

Contoh bentuk event eksternal:

```json
{
  "channel": "whatsapp",
  "event_type": "message.received",
  "external_message_id": "msg_983721",
  "external_customer_id": "wa_62812xxxx",
  "customer_name": "Budi",
  "message_type": "text",
  "message": "Harga service CVT Vario 125 berapa?",
  "timestamp": "2026-06-17T10:30:00+07:00"
}
```

### 5.2 Normalisasi Internal

Semua channel harus dipetakan ke format standar:

```json
{
  "tenant_id": "business_001",
  "channel_id": "whatsapp_johan_garage",
  "channel_type": "whatsapp",
  "external_customer_id": "wa_62812xxxx",
  "external_message_id": "msg_983721",
  "message_type": "text",
  "content": {
    "text": "Harga service CVT Vario 125 berapa?"
  },
  "received_at": "2026-06-17T10:30:00+07:00"
}
```

### 5.3 Validasi Sebelum Diproses

Sistem wajib memeriksa:

- Signature webhook valid
- Message ID belum pernah diproses
- Channel aktif
- Token/channel tidak error
- Pesan bukan dari bot sendiri
- Customer tidak diblokir
- Conversation tidak sedang dibekukan
- AI masih aktif untuk conversation tersebut
- Admin belum take over

---

## 6. Flow Inbox

Inbox menjadi pusat operasional utama.

Struktur tampilan ideal:

```text
Kolom 1: Daftar chat
Kolom 2: Area percakapan
Kolom 3: Context customer
```

### Kolom 1 - Daftar Chat

- Search
- Filter status
- Filter channel
- Filter agent
- Filter label

### Kolom 2 - Area Percakapan

- Pesan customer
- Balasan AI
- Balasan admin
- Quick reply
- Suggested reply
- Private note
- Attachment
- Delivery state

### Kolom 3 - Customer Context

- Profil customer
- Tag
- Intent terakhir
- Booking terkait
- Ticket terkait
- Riwayat chat
- Summary AI

### Aturan Penting Inbox

```ts
if (conversation.status === "human_active") {
  return { action: "skip_ai" };
}

if (conversation.ai_enabled === false) {
  return { action: "skip_ai" };
}

if (conversation.status === "blocked") {
  return { action: "ignore" };
}
```

Status conversation yang dipakai:

- `new`
- `unassigned`
- `ai_active`
- `queued`
- `human_active`
- `waiting_customer`
- `waiting_internal`
- `snoozed`
- `resolved`
- `closed`
- `spam`
- `blocked`

---

## 7. Flow AI Assistant

Flow AI yang disarankan:

```text
Pesan customer
-> Intent classification
-> Entity extraction
-> Risk classification
-> Pilih AI agent
-> Ambil context customer
-> Ambil knowledge
-> Ambil data bisnis
-> Validasi jawaban
-> Kirim jawaban atau handoff
```

Jenis agent yang bisa berkembang:

- Sales Agent
- Customer Service Agent
- Product Agent
- Booking Agent
- Technical Agent
- Complaint Agent
- Billing Agent

Aturan confidence:

- `>= 0.85`: AI boleh jawab otomatis jika datanya ada
- `0.65 - 0.84`: AI boleh meminta satu data tambahan yang penting
- `< 0.65`: AI tidak boleh mengarang dan harus handoff

Risk level tinggi harus selalu handoff, walaupun confidence tinggi.

---

## 8. Flow Knowledge Base

Knowledge Base adalah sumber kebenaran untuk AI.

Flow data:

```text
Admin input FAQ / file / website / Google Sheet
-> Sistem ingest dan parsing
-> Sistem membuat chunk / knowledge item
-> Status processing
-> Ready / published
-> Dipakai AI saat menjawab
```

Struktur knowledge item:

```json
{
  "title": "Harga Service CVT",
  "category": "service",
  "content": "Service CVT untuk motor tertentu dimulai dari ...",
  "keywords": ["service cvt", "servis cvt", "cvt berisik"],
  "source_type": "google_sheet",
  "status": "published",
  "version": 3
}
```

Aturan penting:

- Harga resmi harus berasal dari data bisnis resmi
- AI tidak boleh mengarang harga
- Data expired harus ditandai
- Pertanyaan yang gagal dijawab harus masuk antrean improvement

---

## 9. Flow Products & Services

Flow untuk pertanyaan harga atau layanan:

```text
Customer tanya harga / jasa
-> AI baca intent
-> Cari ke data services / products
-> Data ditemukan?
   -> Ya: jawab sesuai data
   -> Tidak: minta detail tambahan atau handoff
```

Data layanan minimal:

- Nama layanan
- Kategori
- Harga minimum
- Harga maksimum
- Estimasi durasi
- Kompatibilitas motor
- Deskripsi
- Status aktif

Catatan revisi:

Jika data harga final belum ada, AI harus jujur bahwa harga perlu dicek admin. Jangan pernah menebak nominal.

---

## 10. Flow Booking

Flow booking:

```text
Customer minta booking
-> AI identifikasi layanan
-> Minta tipe motor dan keluhan
-> Cek slot
-> Tawarkan pilihan waktu
-> Customer pilih
-> Buat booking
-> Kirim konfirmasi
-> Kirim reminder
```

Status booking:

- `requested`
- `pending_confirmation`
- `confirmed`
- `rescheduled`
- `checked_in`
- `in_progress`
- `completed`
- `no_show`
- `cancelled`

---

## 11. Flow Ticket dan Handoff

Ticket dibuat saat:

- Customer komplain
- Customer minta admin
- AI confidence rendah
- Data bisnis tidak ditemukan
- Masalah pembayaran
- Diagnosis teknis berisiko
- Tool/API gagal

Flow handoff:

```text
AI mendeteksi handoff
-> Buat ringkasan
-> Kumpulkan data penting
-> Create ticket
-> Assign team / agent
-> Conversation menjadi queued
-> Admin menerima
-> Conversation menjadi human_active
-> AI berhenti membalas
```

Data summary untuk admin sebaiknya mencakup:

- kebutuhan customer
- issue yang terdeteksi
- motor / produk / layanan terkait
- aksi yang sudah dilakukan AI
- data yang masih kurang
- alasan handoff

---

## 12. Flow Automation

Automation builder memakai pola:

```text
Trigger
-> Condition
-> Action
-> Delay / Wait
-> Branch
-> Output
```

Trigger utama:

- Message received
- Comment received
- Booking created
- Ticket created
- Payment received
- Campaign replied
- Schedule reached

Action utama:

- Send message
- Assign agent
- Add tag
- Create ticket
- Create booking
- Create order
- Call AI agent
- Call API
- Send webhook
- Notify admin
- Pause AI

Contoh automation wajib:

1. Tanya harga atau stok
2. Booking masuk
3. Komplain
4. Admin take over
5. AI gagal menjawab
6. Follow-up lead
7. SLA escalation
8. CSAT setelah percakapan selesai

---

## 13. Flow Broadcast

Flow campaign:

```text
Pilih channel
-> Pilih audience
-> Pilih template
-> Isi variable
-> Atur jadwal
-> Preview
-> Approval
-> Send
-> Tracking hasil
```

Status campaign:

- `draft`
- `pending_approval`
- `approved`
- `scheduled`
- `running`
- `paused`
- `completed`
- `cancelled`
- `failed`

Metrik utama:

- Sent
- Delivered
- Read
- Replied
- Failed
- Booking
- Order
- Conversion rate

---

## 14. Flow Channels

Semua channel tidak boleh terhubung langsung ke logic bisnis.
Gunakan adapter per channel.

Adapter:

- WhatsApp Adapter
- Instagram Adapter
- Website Chat Adapter
- Telegram Adapter
- Email Adapter

Semua adapter harus menghasilkan event internal yang sama agar backend tetap konsisten.

Status koneksi channel:

- `connected`
- `degraded`
- `token_expiring`
- `disconnected`
- `configuration_error`
- `webhook_error`
- `rate_limited`

---

## 15. Flow Analytics dan Customer Journey

Analytics harus membaca event, bukan hanya teks chat.

Metrik yang penting:

- Total incoming conversation
- Unique customers
- AI handled
- Human handled
- Handoff rate
- Response time
- Resolution time
- Booking created
- Ticket created
- Broadcast conversion
- CSAT

Flow customer journey:

```text
Landing page visited
-> Channel conversation started
-> Contact created
-> AI replied
-> Admin assigned
-> Booking / order / ticket created
-> Follow-up
-> CSAT
-> Repeat purchase
```

---

## 16. Arsitektur Teknis yang Disarankan

Struktur teknis revisi:

```text
Frontend Dashboard
Next.js + TypeScript + Tailwind
-> Backend API
Next.js Route Handlers / service layer
-> Database
Supabase PostgreSQL
-> Queue / Worker
Worker endpoint + scheduled execution
-> Knowledge Storage
knowledge documents + chunks
-> AI Provider
OpenRouter / OpenAI / Gemini
-> Channel Adapters
WhatsApp / Instagram / Web Chat
```

Prinsip tanggung jawab:

- Backend: source of truth dan state bisnis
- AI: memahami pesan dan menyusun jawaban
- Database: menyimpan data resmi
- Dashboard: pusat kontrol manusia
- Automation: trigger dan orkestrasi proses

---

## 17. Prioritas Pengembangan Revisi

### Fase 1 - Core Dashboard

- Authentication
- Workspace config
- Channels
- Customers
- Inbox
- Manual reply
- Assignment

### Fase 2 - AI Layer

- AI Agent
- Knowledge Base
- AI reply
- Suggested reply
- Summary
- Handoff

### Fase 3 - Operasional

- Products & Services
- Booking
- Tickets
- Analytics

### Fase 4 - Automation

- Trigger condition action
- Scheduled worker
- Execution log
- Retry handling

### Fase 5 - Campaign dan Scale

- Broadcast
- Audience segment
- Approval flow
- Performance report

---

## 18. Kesimpulan Flow Final

Flow final revisi website:

```text
Channel
-> Customer Identity
-> Unified Inbox
-> AI Decision Layer
-> Knowledge / Business Data
-> AI Reply atau Human Handoff
-> Booking / Ticket / Broadcast / CRM Action
-> Automation
-> Analytics dan Optimization
```

Inti revisi website ini:

- Tampilan harus tetap sederhana.
- User harus cepat paham alur kerja.
- Semua data penting bisnis dikontrol dari dashboard.
- AI hanya boleh menjawab jika punya dasar data yang cukup.
- Jika tidak aman, sistem harus handoff dengan rapi ke admin.
