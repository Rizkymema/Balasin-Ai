# KONSEP PROJECT

# **Balesin AI — Omnichannel AI Customer Service Platform**

## 1. Ringkasan Project

**Balesin AI** adalah platform **AI Customer Service Omnichannel** yang membantu bisnis membalas chat dan komentar customer secara otomatis dari berbagai channel seperti:

* WhatsApp
* Instagram DM
* Instagram Comment
* Facebook Messenger
* Website Chat
* Telegram Admin Bot
* Channel lain di masa depan

Tujuan utama platform ini adalah membuat bisnis, terutama UMKM Indonesia, bisa memiliki sistem customer service otomatis tanpa harus memahami coding, API, chatbot flow, prompt engineering, atau automation tools.

Konsep utama:

> **Upload data bisnis → hubungkan channel → AI langsung bisa membalas customer, menerima booking, menjawab harga, filter komentar negatif, dan mengoper chat sulit ke manusia.**

---

## 2. Masalah yang Ingin Diselesaikan

Banyak bisnis kecil dan menengah mengalami masalah seperti:

1. Terlalu banyak chat masuk dari WhatsApp, Instagram, komentar, dan website.
2. Admin sering menjawab pertanyaan yang sama berulang-ulang.
3. Customer sering bertanya harga, stok, lokasi, jam buka, booking, promo, atau layanan.
4. Komentar negatif, spam, judol, dan kata kasar sulit difilter manual.
5. Chat penting sering terlewat.
6. Customer ingin respons cepat, tetapi admin tidak selalu online.
7. Platform besar seperti CRM/omnichannel sering terasa rumit dan mahal.
8. Banyak UMKM tidak punya tim teknis untuk membuat chatbot sendiri.
9. AI sering salah menjawab jika tidak dikontrol dengan knowledge base dan human handoff.
10. Bisnis ingin otomatisasi, tetapi tetap aman saat ada komplain, garansi, refund, atau kasus sensitif.

---

## 3. Solusi Utama

Balesin AI memberikan satu dashboard sederhana untuk mengelola semua percakapan customer.

Flow utama:

```text
Customer chat / komentar dari berbagai channel
↓
Masuk ke satu inbox
↓
AI membaca konteks dan data bisnis
↓
AI klasifikasi intent customer
↓
AI mengambil jawaban dari knowledge base / database
↓
Safety filter mengecek risiko jawaban
↓
Jika aman → AI balas otomatis
Jika tidak yakin → oper ke admin manusia
↓
Semua riwayat tersimpan di CRM ringan
```

---

## 4. Positioning Produk

### Positioning Utama

**AI Customer Service paling mudah untuk UMKM Indonesia.**

### Tagline

**Balas WhatsApp, DM Instagram, komentar, dan chat website otomatis dengan AI.**

### Value Proposition

**Balesin AI membantu bisnis membalas customer 24/7, mengelola semua chat dalam satu inbox, filter komentar negatif, menerima booking, follow-up lead, dan mengoper kasus sulit ke admin manusia.**

### Kalimat Jualan Singkat

> “Cukup upload data bisnis Anda, hubungkan WhatsApp dan Instagram, AI langsung bantu balas customer.”

---

## 5. Target User

### Target Utama

1. Bengkel motor
2. Rental mobil
3. Toko online
4. Klinik
5. Laundry
6. Barbershop
7. Jasa service AC/laptop/elektronik
8. Restoran/catering
9. Toko sparepart
10. Bisnis lokal yang aktif di WhatsApp dan Instagram

### Target Persona

#### Owner Bisnis

Butuh sistem yang bisa bantu balas customer tanpa harus menambah banyak admin.

#### Admin Customer Service

Butuh inbox yang rapi, template balasan, AI suggestion, dan sistem handoff.

#### Tim Sales

Butuh follow-up lead, status customer, dan data customer yang tersimpan.

#### Social Media Admin

Butuh auto reply komentar, filter komentar negatif, dan arahkan komentar ke DM.

---

## 6. Fitur Utama

## 6.1 Unified Inbox

Semua pesan dari berbagai channel masuk ke satu tempat.

Channel yang didukung:

* WhatsApp
* Instagram DM
* Instagram Comment
* Facebook Messenger
* Website Chat
* Telegram Bot
* Email di roadmap berikutnya

Fitur inbox:

* Filter berdasarkan channel
* Status chat: Open, Pending, Closed
* Assign chat ke admin
* Ambil alih dari AI
* AI reply suggestion
* Riwayat percakapan customer
* Label customer
* Catatan internal
* Prioritas chat
* Search percakapan
* Deteksi chat belum dibalas

---

## 6.2 AI Agent

AI Agent adalah inti dari sistem.

Fungsi AI Agent:

* Menjawab pertanyaan customer
* Membaca knowledge base
* Mengambil data harga/produk/layanan
* Menentukan apakah chat aman dijawab otomatis
* Mengoper chat sulit ke admin manusia
* Memberikan rekomendasi balasan untuk admin
* Mengklasifikasi intent customer
* Mengklasifikasi sentimen customer
* Mendeteksi komplain
* Mendeteksi spam
* Mendeteksi komentar negatif

Pengaturan AI Agent:

* Nama AI
* Gaya bahasa
* Bahasa utama
* Mode santai/profesional
* Auto reply ON/OFF
* Confidence threshold
* Human handoff rule
* Safety mode
* Channel yang boleh dijawab otomatis
* Jam operasional AI
* Template fallback jika AI tidak yakin

Contoh konfigurasi:

```text
Nama AI: Admin Johan
Tone: Ramah, santai, profesional
Mode Aman: Aktif
Auto Reply: Aktif
Confidence Minimum: 80%
Jika komplain: Oper ke admin
Jika harga custom: Oper ke admin
Jika pertanyaan di luar data: Jangan mengarang
```

---

## 6.3 Knowledge Base

Knowledge base adalah sumber data yang dipakai AI.

Sumber data yang bisa diinput:

* PDF
* Excel
* Google Sheet
* CSV
* Website
* Foto daftar harga
* Manual FAQ
* Dokumen SOP
* Database produk
* Chat lama
* Notion/Google Docs di roadmap berikutnya

Jenis data yang disimpan:

* Profil bisnis
* Alamat
* Jam buka
* Layanan
* Harga
* Produk
* Stok
* Promo
* FAQ
* Syarat booking
* Kebijakan refund
* Kebijakan garansi
* SOP komplain
* Cara pembayaran
* Kontak admin
* Link booking
* Informasi teknis sesuai industri

Prinsip utama:

> AI hanya boleh menjawab berdasarkan knowledge base, database, atau aturan yang sudah disediakan.

Jika data tidak ditemukan, AI tidak boleh mengarang.

---

## 6.4 AI Flow Generator

User tidak perlu membuat flow chatbot manual.

User cukup memilih jenis bisnis, lalu sistem otomatis membuat flow awal.

Contoh template bisnis: **Bengkel Motor**

Flow otomatis:

* Tanya harga servis
* Tanya sparepart
* Booking servis
* Tanya lokasi
* Tanya jam buka
* Tanya promo
* Keluhan motor
* Komplain
* Bicara dengan admin

Contoh template bisnis: **Rental Mobil**

Flow otomatis:

* Cek ketersediaan mobil
* Tanya harga sewa
* Booking tanggal
* Syarat sewa
* Metode pembayaran
* Lokasi pickup
* Komplain
* Bicara dengan admin

---

## 6.5 Instagram Comment Guard

Fitur khusus untuk mengelola komentar Instagram secara otomatis.

Komentar diklasifikasikan menjadi:

* Pertanyaan valid
* Minat beli
* Tanya harga
* Tanya stok
* Tanya booking
* Komentar positif
* Komentar negatif
* Komplain
* Spam
* Judol
* Kata kasar
* Promosi liar
* Tidak relevan

Aksi otomatis:

```text
Jika pertanyaan valid → balas komentar
Jika minat beli → balas komentar + arahkan ke DM
Jika komentar positif → balas ringan
Jika spam/judol/kasar → hide otomatis
Jika komplain → jangan balas otomatis, kirim ke admin
Jika AI tidak yakin → pending untuk review admin
```

Contoh:

```text
Komentar:
“Harga servis CVT berapa kak?”

AI:
“Halo kak, servis CVT mulai dari Rp... ya. Kalau mau, bisa langsung DM untuk booking jadwal 🙌”
```

Contoh negatif:

```text
Komentar:
“Judol gacor klik link ini”

Aksi:
Hide komentar otomatis + tandai sebagai spam.
```

---

## 6.6 Private DM Converter

Fitur untuk mengubah komentar menjadi lead DM.

Flow:

```text
Customer komentar:
“Mau dong kak”

↓
AI balas komentar:
“Siap kak, kami kirim detail via DM ya 🙌”

↓
AI kirim DM:
“Halo kak, mau tanya untuk kebutuhan apa ya?”
```

Tujuan:

* Meningkatkan closing dari konten Instagram
* Mengubah komentar menjadi percakapan privat
* Mempermudah follow-up sales

---

## 6.7 Human Handoff

AI tidak boleh menjawab semua kasus.

Rule human handoff:

```text
Jika AI yakin > 80% → balas otomatis
Jika AI yakin 60–80% → balas hati-hati atau minta konfirmasi
Jika AI yakin < 60% → oper admin
Jika komplain → oper admin
Jika refund → oper admin
Jika garansi → oper admin
Jika customer marah → oper admin
Jika kasus teknis berat → oper admin
Jika harga custom → oper admin
Jika data tidak ada → oper admin
```

Contoh jawaban handoff:

```text
Mohon maaf ya kak, untuk kasus ini saya bantu teruskan ke admin agar bisa dicek lebih akurat. Boleh kirim detail tambahan dulu?
```

---

## 6.8 Booking Automation

Fitur untuk menerima booking otomatis.

Data booking:

* Nama customer
* Nomor WhatsApp
* Channel asal
* Jenis layanan
* Tanggal
* Jam
* Catatan
* Status booking
* Admin penanggung jawab

Flow booking:

```text
Customer: “Mau booking servis besok”
↓
AI tanya jenis motor/layanan
↓
AI tanya tanggal dan jam
↓
AI cek slot tersedia
↓
AI konfirmasi booking
↓
Data masuk ke dashboard / Google Sheet / Calendar
↓
Admin menerima notifikasi
```

Status booking:

* New
* Confirmed
* Waiting Payment
* Rescheduled
* Done
* Cancelled

---

## 6.9 CRM Ringan

CRM dibuat sederhana, tidak serumit enterprise CRM.

Data customer:

* Nama
* Nomor WhatsApp
* Username Instagram
* Channel asal
* Riwayat chat
* Tag
* Status lead
* Catatan admin
* Minat produk/layanan
* Booking terakhir
* Komplain terakhir

Status lead:

* New Lead
* Interested
* Asked Price
* Booking
* Waiting Payment
* Paid
* Done
* Lost
* Complaint

---

## 6.10 Analytics

Dashboard analytics menampilkan:

* Total chat masuk
* Total komentar masuk
* Total pesan dijawab AI
* Persentase auto reply
* Jumlah handoff ke admin
* Pertanyaan paling sering
* Produk/layanan paling sering ditanya
* Channel paling ramai
* Komplain masuk
* Spam terdeteksi
* Booking masuk
* Conversion rate dari komentar ke DM
* Waktu respons rata-rata
* Performa admin

---

## 7. Struktur Dashboard

Menu utama:

```text
1. Dashboard
2. Inbox
3. AI Agent
4. Knowledge Base
5. Channels
6. Automation
7. Customer
8. Booking
9. Analytics
10. Settings
```

---

## 7.1 Dashboard

Isi:

* Ringkasan chat hari ini
* Chat belum dibalas
* Komentar perlu review
* Booking hari ini
* Komplain masuk
* AI auto reply rate
* Channel paling aktif

---

## 7.2 Inbox

Isi:

* List percakapan
* Detail chat
* AI suggestion
* Tombol ambil alih
* Tombol assign admin
* Label
* Status chat
* Riwayat customer

---

## 7.3 AI Agent

Isi:

* Buat AI Agent
* Atur tone
* Atur rules
* Atur mode aman
* Test AI
* Lihat sumber jawaban AI
* Confidence score
* Fallback response

---

## 7.4 Knowledge Base

Isi:

* Upload file
* Import Google Sheet
* Input FAQ manual
* List dokumen
* Status indexing
* Edit data
* Hapus data
* Test pertanyaan

---

## 7.5 Channels

Isi:

* WhatsApp
* Instagram
* Facebook
* Website Chat
* Telegram
* Status koneksi
* Webhook URL
* Token/API setting
* Channel permission

---

## 7.6 Automation

Isi:

* Rule auto reply
* Rule komentar
* Rule handoff
* Rule follow-up
* Rule booking
* Rule spam filter
* Rule notifikasi admin

Contoh rule:

```text
Jika komentar mengandung kata “harga”
→ AI jawab harga atau arahkan ke DM

Jika komentar mengandung kata kasar
→ Hide komentar

Jika customer tidak membalas 24 jam
→ Kirim follow-up

Jika AI confidence di bawah 70%
→ Assign ke admin
```

---

## 7.7 Customer

Isi:

* List customer
* Detail customer
* Riwayat chat
* Status lead
* Tag
* Catatan
* Export data

---

## 7.8 Booking

Isi:

* List booking
* Kalender booking
* Status booking
* Detail booking
* Assign teknisi/admin
* Reminder otomatis

---

## 7.9 Analytics

Isi:

* Grafik chat
* Grafik komentar
* Grafik channel
* Grafik booking
* Top FAQ
* Top produk
* Top komplain
* Performa AI
* Performa admin

---

## 8. Role User

### Super Admin

Pemilik platform.

Akses:

* Kelola semua tenant
* Kelola subscription
* Kelola user
* Lihat usage
* Kelola model AI
* Kelola sistem global

### Owner Bisnis

Pemilik workspace bisnis.

Akses:

* Kelola channel
* Kelola AI
* Kelola knowledge base
* Lihat analytics
* Kelola admin
* Kelola billing

### Admin CS

Tim customer service.

Akses:

* Balas chat
* Ambil alih chat dari AI
* Assign chat
* Ubah status chat
* Tambah catatan customer

### Social Media Admin

Akses:

* Kelola komentar
* Review komentar
* Approve/reject AI reply
* Lihat komentar negatif
* Ubah rule komentar

### Sales

Akses:

* Lihat lead
* Follow-up customer
* Ubah status lead
* Lihat riwayat customer

---

## 9. AI Workflow

Workflow AI utama:

```text
1. Pesan masuk
2. Deteksi channel
3. Normalisasi format pesan
4. Ambil data customer
5. Deteksi intent
6. Deteksi sentimen
7. Deteksi risiko
8. Cari jawaban di knowledge base
9. Generate jawaban
10. Validasi safety
11. Hitung confidence
12. Tentukan action
13. Kirim balasan / handoff / hide / pending review
14. Simpan log
```

Intent yang perlu didukung:

* Tanya harga
* Tanya stok
* Tanya produk
* Tanya layanan
* Booking
* Tanya lokasi
* Tanya jam buka
* Komplain
* Refund
* Garansi
* Tanya promo
* Tanya metode pembayaran
* Tanya ongkir
* Tanya status pesanan
* Tanya teknis ringan
* Minta admin manusia
* Spam
* Komentar negatif
* Komentar positif

---

## 10. Safety System

AI harus memiliki pengaman.

AI tidak boleh:

* Mengarang harga
* Mengarang stok
* Mengarang jadwal
* Memberi janji palsu
* Menjawab komplain berat secara otomatis
* Menjawab refund/garansi tanpa SOP
* Memberi diagnosa teknis berat tanpa disclaimer
* Menghapus komentar penting tanpa aturan
* Membalas komentar negatif dengan nada defensif
* Mengirim data pribadi customer ke pihak lain

Mode aman:

```text
Strict Mode:
AI hanya menjawab jika data sangat jelas.

Balanced Mode:
AI menjawab jika cukup yakin dan menggunakan bahasa hati-hati.

Aggressive Mode:
AI lebih aktif menjawab, cocok untuk komentar umum dan FAQ.
```

Rekomendasi default:

```text
Mode default: Balanced + Human Handoff aktif.
```

---

## 11. Integrasi Channel

### WhatsApp

Fitur:

* Pesan masuk
* Auto reply
* Template message
* Media message
* Human handoff
* Broadcast di roadmap

### Instagram DM

Fitur:

* Pesan masuk
* Auto reply DM
* Human handoff
* Simpan riwayat customer

### Instagram Comment

Fitur:

* Baca komentar
* Balas komentar
* Hide komentar
* Klasifikasi komentar
* Private reply ke DM jika memungkinkan

### Website Chat

Fitur:

* Widget embed
* AI chat
* Capture lead
* Transfer ke WhatsApp
* Simpan percakapan

### Facebook Messenger

Fitur:

* Pesan masuk
* Auto reply
* Human handoff

### Telegram Admin Bot

Fungsi:

* Notifikasi chat penting
* Notifikasi komplain
* Notifikasi booking
* Admin bisa approve/reject balasan
* Admin bisa ambil alih chat

---

## 12. Tech Stack Rekomendasi

### Frontend

```text
Next.js
TypeScript
Tailwind CSS
Shadcn UI
Zustand
TanStack Query
Socket.IO Client
```

### Backend

Pilihan 1:

```text
NestJS
TypeScript
PostgreSQL
Prisma
Redis
BullMQ
Socket.IO
```

Pilihan 2:

```text
FastAPI
Python
PostgreSQL
SQLAlchemy
Redis
Celery
WebSocket
```

Rekomendasi untuk Anda:

```text
NestJS + Next.js + PostgreSQL + Redis + BullMQ
```

Karena stack ini enak untuk SaaS, realtime inbox, queue, webhook, dan automation.

### Database

```text
PostgreSQL
pgvector
Redis
```

### AI

```text
OpenAI / Gemini / OpenRouter
Embeddings
RAG
Intent Classifier
Safety Classifier
Sentiment Classifier
```

### Storage

```text
Cloudflare R2 / AWS S3
```

### Automation

```text
n8n untuk integrasi tambahan
```

### Deployment

```text
Docker
Docker Compose
Nginx
Cloudflare
VPS
```

---

## 13. Arsitektur Sistem

```text
Frontend Dashboard
↓
Backend API
↓
Auth Service
↓
Workspace/Tenant Service
↓
Channel Service
↓
Webhook Receiver
↓
Message Queue
↓
AI Orchestrator
↓
Knowledge Base Service
↓
CRM Service
↓
Automation Engine
↓
Notification Service
↓
Database + Vector Store
```

Detail alur:

```text
WhatsApp / Instagram / Web Chat
↓
Webhook Receiver
↓
Message Normalizer
↓
Queue
↓
AI Orchestrator
↓
RAG Knowledge Base
↓
Safety Filter
↓
Action Router
↓
Reply / Hide / Handoff / Notify Admin
↓
Save to Database
↓
Realtime update to Dashboard
```

---

## 14. Database Entity Utama

Entity penting:

```text
User
Workspace
Role
Channel
Conversation
Message
Customer
AI Agent
Knowledge Document
Knowledge Chunk
Automation Rule
Booking
Lead
Comment
Handoff
AI Log
Analytics Event
Subscription
```

Contoh struktur sederhana:

```text
Workspace
- id
- name
- business_type
- owner_id
- subscription_plan

Channel
- id
- workspace_id
- type
- status
- config

Conversation
- id
- workspace_id
- customer_id
- channel_id
- status
- assigned_to
- last_message_at

Message
- id
- conversation_id
- sender_type
- content
- ai_generated
- confidence_score

Customer
- id
- workspace_id
- name
- phone
- instagram_username
- tags
- lead_status

KnowledgeDocument
- id
- workspace_id
- title
- source_type
- file_url
- status

AutomationRule
- id
- workspace_id
- trigger
- condition
- action
- is_active
```

---

## 15. MVP Versi 1

Fokus awal jangan terlalu besar.

### MVP V1: AI CS untuk Website Chat + WhatsApp

Fitur wajib:

1. Login/register
2. Buat workspace bisnis
3. Input profil bisnis
4. Upload knowledge base
5. AI tester
6. Website chat widget
7. WhatsApp Cloud API
8. Unified inbox sederhana
9. Auto reply AI
10. Human handoff
11. Customer list
12. Analytics dasar

Tujuan MVP V1:

> Membuktikan bahwa AI bisa menjawab customer berdasarkan data bisnis dan semua chat tersimpan rapi di inbox.

---

## 16. MVP Versi 2

### MVP V2: Instagram DM + Comment Automation

Tambah fitur:

1. Connect Instagram Professional Account
2. Auto reply DM
3. Baca komentar Instagram
4. Auto reply komentar
5. Hide komentar negatif/spam
6. Private DM converter
7. Review komentar di dashboard
8. Notifikasi komentar prioritas

Tujuan MVP V2:

> Membuat platform unggul di Instagram automation.

---

## 17. MVP Versi 3

### MVP V3: CRM + Booking + Automation

Tambah fitur:

1. CRM ringan
2. Booking management
3. Follow-up otomatis
4. Reminder otomatis
5. Lead status
6. Google Sheet integration
7. Telegram admin bot
8. Advanced analytics

Tujuan MVP V3:

> Membuat platform siap dijual ke UMKM secara lebih luas.

---

## 18. Fitur Premium

Fitur untuk paket berbayar:

* Multi-admin
* Multi-channel
* Unlimited knowledge base
* Advanced automation
* AI training dari chat lama
* Auto flow generator
* Comment guard
* Analytics lengkap
* Export customer
* Booking calendar
* Broadcast campaign
* Custom AI personality
* API access
* White label
* Multi-branch
* SLA response tracking

---

## 19. Monetization

### Paket Gratis

Untuk testing.

Fitur:

* 1 workspace
* 1 channel website chat
* 100 pesan AI/bulan
* Knowledge base terbatas
* Basic inbox

### Paket Starter

Target: UMKM kecil.

Fitur:

* WhatsApp atau website chat
* 1 AI Agent
* 1.000 pesan AI/bulan
* Knowledge base standar
* Basic analytics

### Paket Growth

Target: bisnis aktif Instagram/WA.

Fitur:

* WhatsApp
* Instagram DM
* Instagram Comment
* Website Chat
* 3 admin
* 5.000 pesan AI/bulan
* Comment Guard
* Booking
* CRM ringan

### Paket Pro

Target: bisnis dengan banyak chat.

Fitur:

* Semua channel
* Multi-admin
* Advanced automation
* Advanced analytics
* Telegram admin bot
* Priority support
* Custom flow

### Paket Enterprise

Target: perusahaan.

Fitur:

* Multi-branch
* Custom integration
* Dedicated server
* SLA
* White label
* Custom AI model/rules

---

## 20. Keunggulan Produk

Keunggulan utama:

1. Lebih mudah digunakan daripada CRM besar.
2. Fokus pada UMKM Indonesia.
3. Kuat di WhatsApp + Instagram DM + komentar.
4. Bisa filter komentar negatif.
5. Bisa mengubah komentar menjadi lead DM.
6. Tidak perlu coding.
7. AI bisa dibuat dari data bisnis.
8. Ada human handoff agar aman.
9. Dashboard sederhana.
10. Bisa dikembangkan menjadi SaaS besar.

---

## 21. Risiko Project

Risiko utama:

1. Integrasi API Meta membutuhkan setup dan approval.
2. WhatsApp template message punya aturan khusus.
3. Instagram automation harus mengikuti policy platform.
4. AI bisa salah jawab jika knowledge base buruk.
5. Biaya AI bisa membesar jika tidak dikontrol.
6. User UMKM mungkin butuh onboarding.
7. Sistem harus aman karena menyimpan data customer.
8. Spam/abuse harus dicegah.
9. Multi-channel webhook bisa kompleks.
10. Scaling realtime inbox butuh arsitektur yang rapi.

Mitigasi:

* Gunakan confidence score.
* Gunakan human handoff.
* Batasi auto reply untuk kasus sensitif.
* Simpan AI log.
* Gunakan queue.
* Buat rate limit.
* Buat template industri.
* Buat onboarding super sederhana.
* Mulai dari MVP kecil.
* Validasi dengan 1 niche dulu.

---

## 22. Strategi Go-To-Market

### Niche Awal

Mulai dari:

```text
Bengkel motor
```

Alasannya:

* Banyak pertanyaan berulang
* Banyak customer dari WA dan Instagram
* Sering butuh booking
* Banyak komentar tanya harga
* Banyak layanan dan sparepart
* Cocok dengan studi kasus Johan Garage

### Strategi Validasi

1. Buat demo untuk 1 bengkel.
2. Masukkan daftar harga, FAQ, lokasi, jam buka.
3. Test auto reply dari website chat.
4. Lanjut WhatsApp.
5. Lanjut Instagram comment.
6. Tawarkan ke 5–10 bengkel lain.
7. Ambil feedback.
8. Buat template “Bengkel Motor AI CS”.

### Konten Marketing

Tema konten:

* “Capek balas chat harga terus?”
* “AI bisa balas DM Instagram bengkel otomatis”
* “Komentar spam bisa di-hide otomatis”
* “Customer tanya harga, AI langsung jawab”
* “Owner bengkel tidak perlu online 24 jam”
* “Upload daftar harga, AI langsung jadi admin”

---

## 23. Roadmap Development

### Phase 1 — Foundation

* Auth
* Workspace
* Dashboard layout
* User role
* Database schema
* AI Agent basic
* Knowledge base upload
* AI tester

### Phase 2 — Inbox

* Conversation list
* Message detail
* Manual reply
* AI suggestion
* Assign admin
* Status chat
* Customer profile

### Phase 3 — Web Chat

* Widget script
* Chat popup
* Send/receive message
* AI reply
* Capture lead

### Phase 4 — WhatsApp

* Webhook receiver
* Message normalizer
* Send reply
* Conversation mapping
* Handoff

### Phase 5 — Instagram

* Instagram DM
* Instagram comment
* Comment classification
* Auto reply
* Hide spam
* Private reply

### Phase 6 — Automation

* Rule builder
* Handoff rule
* Comment rule
* Follow-up rule
* Booking rule

### Phase 7 — Analytics

* Message count
* Channel performance
* AI performance
* FAQ insights
* Booking insights

### Phase 8 — SaaS

* Subscription
* Usage limit
* Billing
* Team management
* Plan upgrade
* Tenant isolation

---

## 24. Konsep UI/UX

Prinsip UI:

* Simple
* Bersih
* Tidak terlalu enterprise
* Mobile responsive
* Fokus pada aksi cepat
* Owner UMKM harus paham tanpa training panjang

Warna brand:

* Biru/ungu untuk AI dan teknologi
* Hijau untuk WhatsApp/automation
* Putih/abu untuk dashboard clean

Style:

* Modern SaaS
* Clean card layout
* Sidebar simple
* Banyak status badge
* Banyak quick action
* Realtime inbox

Komponen penting:

* Sidebar navigation
* Inbox split layout
* Chat bubble
* AI confidence badge
* Channel badge
* Customer profile panel
* Quick reply button
* Automation rule card
* Knowledge base upload card
* Analytics chart

---

## 25. Prompt Singkat untuk Menjelaskan Produk

```text
Balesin AI adalah platform AI Customer Service Omnichannel untuk UMKM Indonesia. Sistem ini menghubungkan WhatsApp, Instagram DM, Instagram Comment, Website Chat, dan channel lain ke satu inbox. AI dapat membalas pertanyaan customer otomatis berdasarkan knowledge base bisnis, menerima booking, menjawab harga, filter komentar negatif, mengarahkan komentar ke DM, dan mengoper kasus sulit ke admin manusia. Fokus produk adalah mudah digunakan, cepat aktif, aman, dan cocok untuk bisnis kecil-menengah seperti bengkel, rental, toko online, klinik, laundry, barbershop, dan jasa service.
```

---

## 26. Kesimpulan Konsep

Balesin AI bukan hanya chatbot WhatsApp.

Balesin AI adalah:

```text
AI Omnichannel Inbox
+ AI Customer Service
+ Instagram Comment Guard
+ Knowledge Base
+ Booking Automation
+ CRM Ringan
+ Human Handoff
```

Produk ini cocok bersaing dengan platform seperti Qontak dan Cekat AI jika fokusnya dibuat lebih tajam:

```text
Lebih mudah.
Lebih cepat aktif.
Lebih cocok untuk UMKM.
Lebih kuat di Instagram comment dan DM.
Lebih praktis untuk bisnis lokal Indonesia.
```

Arah terbaik project:

```text
Mulai dari niche bengkel motor.
Bangun MVP website chat + WhatsApp.
Lanjut Instagram DM + comment.
Tambah CRM ringan dan booking.
Scale ke niche lain.
```
