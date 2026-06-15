AI Omnichannel CRM Dashboard Flow

Intinya:

Customer chat masuk
↓
Sistem tangkap pesan dari WA / IG DM / IG Comment / Website
↓
AI analisis intent
↓
AI ambil data dari database / knowledge / Google Sheets
↓
AI jawab otomatis jika aman
↓
Jika tidak yakin, AI teruskan ke admin
↓
Admin jawab manual
↓
AI berhenti membalas chat itu
↓
Semua histori, data customer, ticket, dan laporan masuk dashboard
1. Struktur Dashboard Utama

Dashboard Anda sebaiknya jangan dibuat terlalu rumit. Buat menu utama seperti ini:

1. Inbox
2. Customer
3. AI Knowledge
4. Produk & Layanan
5. Booking
6. Ticket / Handoff Admin
7. Automation Flow
8. Broadcast
9. Analytics
10. Settings
Rekomendasi tampilan sidebar
Dashboard
├── Inbox
│   ├── Semua Chat
│   ├── WhatsApp
│   ├── Instagram DM
│   ├── Komentar IG
│   ├── Butuh Admin
│   └── Selesai
│
├── Customer
│   ├── Data Customer
│   ├── Riwayat Chat
│   ├── Tag Customer
│   └── Segmentasi
│
├── AI Center
│   ├── Knowledge Base
│   ├── Prompt AI
│   ├── Rules AI
│   ├── Intent Setting
│   └── Test AI
│
├── Produk & Layanan
│   ├── Produk
│   ├── Sparepart
│   ├── Jasa Servis
│   └── Paket Layanan
│
├── Ticket
│   ├── Masuk
│   ├── Diproses
│   ├── Selesai
│   └── Komplain
│
├── Automation
│   ├── Flow Chatbot
│   ├── Handoff Rules
│   ├── Auto Reply
│   ├── Auto Tagging
│   └── Error Log
│
└── Report
    ├── Jumlah Chat
    ├── Leads
    ├── Booking
    ├── Closing
    └── Performa Admin
2. Flow Utama Sistem
Flow besar
Customer
↓
Channel API
WhatsApp / IG DM / IG Comment / Website Chat
↓
Webhook
↓
Message Normalizer
↓
Database Logging
↓
Contact Matching
↓
Conversation Status Check
↓
AI Intent Classification
↓
Data Retrieval
↓
AI Response Generator
↓
Guardrail Check
↓
Send Reply / Handoff Admin
↓
Update Dashboard
3. Flow Teknis Lengkap
Step 1 — Pesan Customer Masuk

Channel yang bisa masuk:

WhatsApp
Instagram DM
Instagram Comment
Facebook Messenger
Website Live Chat
Telegram

Data yang ditangkap:

{
  "channel": "instagram_dm",
  "customer_id": "ig_12345",
  "name": "Budi",
  "username": "@budi_motor",
  "message": "Kak service CVT berapa?",
  "message_type": "text",
  "timestamp": "2026-06-14 10:00:00"
}
Step 2 — Normalisasi Pesan

Karena format data WA, IG, Telegram, dan website berbeda, semua pesan harus disamakan dulu.

Format final internal:

{
  "source": "instagram_dm",
  "external_user_id": "ig_12345",
  "display_name": "Budi",
  "message_text": "Kak service CVT berapa?",
  "message_type": "text",
  "conversation_id": "conv_001",
  "raw_payload": {}
}

Tujuannya agar dashboard Anda tidak pusing membaca banyak format API.

4. Flow AI Classification

Setelah pesan masuk, AI jangan langsung jawab. AI harus klasifikasi dulu.

Intent yang perlu dibuat
1. Tanya harga
2. Tanya stok
3. Tanya produk
4. Tanya layanan servis
5. Booking
6. FAQ umum
7. Keluhan ringan
8. Keluhan berat
9. Komplain
10. Follow up order
11. Spam
12. Komentar negatif
13. Tidak jelas
14. Butuh admin
Output AI classifier
{
  "intent": "tanya_harga_layanan",
  "confidence": 0.91,
  "risk_level": "low",
  "needs_human": false,
  "detected_topic": "service_cvt",
  "customer_sentiment": "neutral"
}
5. Logic Utama AI

Gunakan aturan ini:

Jika confidence >= 0.80 dan risk low:
AI boleh jawab otomatis

Jika confidence 0.60 - 0.79:
AI boleh jawab dengan hati-hati atau buat draft untuk admin

Jika confidence < 0.60:
AI tidak boleh jawab langsung

Jika risk high:
Wajib handoff ke admin

Jika chat sudah diambil admin:
AI berhenti membalas

Jika data produk/harga tidak ditemukan:
AI tidak boleh mengarang
6. Flow Reply Otomatis
Contoh flow tanya harga
Customer:
"Kak service CVT berapa?"

↓
AI Classification:
Intent = Tanya harga layanan
Confidence = 91%
Risk = Low

↓
Query Database:
Cari layanan: service CVT

↓
Data ditemukan:
Service CVT mulai dari Rp xxx

↓
AI Generate Jawaban:
"Kak, untuk service CVT mulai dari Rp xxx ya. Kalau mau lebih akurat, boleh info tipe motornya dulu?"

↓
Send Reply
↓
Log ke dashboard
7. Flow Jika Data Tidak Ditemukan
Customer:
"Kak ada knalpot racing buat motor X tahun 2026?"

↓
AI cari di database produk
↓
Data tidak ditemukan
↓
AI tidak boleh mengarang
↓
Balasan aman:
"Untuk stok item itu saya cek dulu ke admin ya kak, supaya informasinya tidak salah."
↓
Create Ticket
↓
Assign Admin
↓
AI paused
8. Flow Human Handoff

Ini bagian paling penting supaya AI tidak asal balas.

Flow handoff
AI tidak yakin / kasus berat / data tidak ada
↓
Sistem buat ticket
↓
Conversation status berubah:
ai_active → assigned_to_admin
↓
Admin dapat notifikasi
↓
Admin buka dashboard
↓
Admin jawab manual
↓
Pesan terkirim ke customer
↓
AI tetap pause
↓
Admin klik "Selesaikan"
↓
Conversation status berubah:
assigned_to_admin → resolved
Status conversation yang wajib ada
ai_active
ai_paused
assigned_to_admin
waiting_customer
resolved
blocked
spam
9. Flow Ketika Admin Sudah Balas Manual

Ini solusi agar AI tidak ikut membalas lagi.

Admin membalas dari dashboard
↓
Sistem simpan message sender = admin
↓
Conversation status = assigned_to_admin
↓
AI Reply Engine otomatis skip conversation ini
↓
AI tidak boleh membalas
↓
Jika admin klik "Aktifkan AI lagi"
Baru status berubah ke ai_active
Logic backend
if (conversation.status === "assigned_to_admin") {
  return {
    action: "skip_ai_reply",
    reason: "Conversation handled by human admin"
  };
}
10. Flow Untuk Instagram Comment

Komentar IG harus dibedakan dari DM, karena komentar publik lebih sensitif.

Flow komentar
Komentar masuk
↓
Moderation AI
↓
Cek kategori:
- Pertanyaan valid
- Pujian
- Minat beli
- Spam
- Kata kasar
- Komentar negatif
- Tidak relevan
↓
Jika aman:
Auto reply public
↓
Jika minat beli:
Reply public + kirim DM
↓
Jika negatif:
Hide / delete / teruskan admin
↓
Log ke dashboard
Contoh logic
Komentar:
"Harga service CVT berapa min?"

↓
Aman
↓
Balas:
"Bisa kak, untuk estimasi service CVT mulai dari Rp xxx. Kalau mau lebih akurat, boleh DM tipe motornya ya."
Komentar:
"JUDOL GACOR LINK DI BIO"

↓
Spam
↓
Hide/Delete
↓
Masuk log spam
11. Flow Booking
Customer:
"Mau booking servis besok"

↓
AI Classification:
Intent = booking

↓
AI minta data:
Nama
Tipe motor
Keluhan
Tanggal booking
Jam perkiraan
Nomor WhatsApp

↓
Simpan ke database booking
↓
Kirim notifikasi ke admin
↓
Kirim konfirmasi ke customer
↓
Status booking = pending_confirmation
Data booking
id
customer_id
name
phone
motor_type
complaint
booking_date
booking_time
status
assigned_admin
created_at
12. Flow Produk / Sparepart
Customer:
"Kak ada V-belt Vario 125?"

↓
AI Classification:
Intent = tanya_produk

↓
Search produk:
keyword = "V-belt Vario 125"

↓
Jika ditemukan:
Ambil nama, stok, harga, kompatibilitas

↓
AI jawab:
"Ada kak, V-belt untuk Vario 125 tersedia. Harga Rp xxx. Stok saat ini ada. Mau saya bantu lanjutkan order?"
Sumber data produk

Paling bagus:

PostgreSQL = sumber utama
Google Sheets = tempat admin update mudah
n8n = sync Google Sheets ke PostgreSQL

Jadi admin cukup edit Google Sheets, dashboard dan AI tetap ambil dari PostgreSQL.

13. Database Utama

Minimal pakai tabel ini.

contacts
id
name
phone
instagram_username
channel
tags
last_seen_at
created_at
conversations
id
contact_id
channel
status
assigned_admin_id
last_intent
last_message
last_message_at
created_at
updated_at
messages
id
conversation_id
sender_type -- customer / ai / admin / system
message_text
message_type
raw_payload
created_at
products
id
name
category
brand
price
stock
description
motor_compatibility
image_url
is_active
updated_at
services
id
service_name
category
price_start
price_end
description
duration_estimate
notes
is_active
updated_at
knowledge_base
id
title
category
content
source
status
updated_at
tickets
id
conversation_id
contact_id
issue_type
priority
status
assigned_to
summary
created_at
resolved_at
automation_logs
id
workflow_name
conversation_id
input_payload
output_payload
status
error_message
created_at
14. Flow n8n Yang Perlu Dibuat
Workflow 1 — Incoming Message Router
Webhook
↓
Normalize Data
↓
Save Contact
↓
Save Message
↓
Check Conversation Status
↓
If AI Active
↓
Send to AI Classifier

Node n8n:

Webhook
Code
PostgreSQL
IF
AI Agent / HTTP Request
Switch
Execute Workflow
Workflow 2 — AI Auto Reply
Input message
↓
Classify intent
↓
Search data
↓
Generate answer
↓
Guardrail check
↓
Send reply
↓
Save log

Node n8n:

Execute Workflow Trigger
AI Chat Model
PostgreSQL
IF
HTTP Request
PostgreSQL
Workflow 3 — Human Handoff
AI confidence rendah
↓
Create ticket
↓
Assign admin
↓
Set conversation = assigned_to_admin
↓
Notify admin
↓
Stop AI

Node n8n:

IF
PostgreSQL
Telegram / WhatsApp / Email Notification
Update Database
Workflow 4 — Admin Manual Reply Sync
Admin reply dari dashboard
↓
Backend send message ke channel
↓
Save message as admin
↓
Keep AI paused
↓
Update last message
Workflow 5 — Product Sync
Admin update Google Sheets
↓
n8n scheduled trigger
↓
Read Google Sheets
↓
Clean data
↓
Upsert ke PostgreSQL
↓
Update dashboard
Workflow 6 — Instagram Comment Moderation
IG Comment webhook
↓
Moderation AI
↓
Spam/negative?
↓
Jika spam: hide/delete
↓
Jika pertanyaan: reply
↓
Jika minat beli: reply + DM
↓
Save log
Workflow 7 — Daily Analytics
Setiap malam
↓
Hitung jumlah chat
↓
Hitung leads
↓
Hitung ticket
↓
Hitung booking
↓
Hitung AI success rate
↓
Tampilkan di dashboard
15. Tampilan Inbox Yang Paling Mudah Dipakai

Inbox harus dibuat seperti dashboard CS modern.

Layout ideal
Kiri:
List chat customer

Tengah:
Isi percakapan

Kanan:
Detail customer + AI insight + action button
Panel kiri
Semua
Butuh Admin
Belum Dibalas
AI Aktif
Komplain
Booking
Spam
Selesai
Panel tengah
Chat history
Input balasan admin
Tombol quick reply
Tombol AI bantu buat jawaban
Panel kanan
Nama customer
Channel
Nomor / username
Intent terakhir
Sentiment
Status AI
Tag
Riwayat order
Ticket aktif
Tombol:
- Ambil alih chat
- Aktifkan AI
- Pause AI
- Buat ticket
- Tandai selesai
16. Fitur Agar Dashboard Lebih Mudah Digunakan

Ini yang akan membuat sistem Anda lebih unggul dari dashboard yang terlalu kompleks.

1. Tombol “Ambil Alih”

Admin cukup klik:

Ambil Alih

Efeknya:

AI otomatis pause
Chat assigned ke admin
Admin bisa jawab manual
2. Tombol “Aktifkan AI Lagi”

Setelah masalah selesai:

Aktifkan AI Lagi

Efeknya:

Status kembali ai_active
AI boleh balas lagi
3. AI Summary Otomatis

Setiap chat yang masuk ke admin harus punya ringkasan:

Ringkasan:
Customer tanya harga service CVT untuk Vario 125.
Belum diberi harga pasti karena tipe layanan belum jelas.
Rekomendasi: minta detail keluhan dan arahkan booking.
4. AI Suggested Reply

Admin tidak perlu mengetik dari nol.

AI menyarankan:
"Siap kak, untuk service CVT Vario 125 bisa kami bantu cek dulu ya. Biasanya estimasi tergantung kondisi CVT dan part yang perlu diganti."

Admin tinggal klik:

Kirim
Edit
Tolak
5. Confidence Badge

Tampilkan status AI:

AI Confidence: 92% Aman
AI Confidence: 65% Perlu cek
AI Confidence: 38% Wajib admin
6. Auto Tagging

AI otomatis memberi tag:

Hot Lead
Tanya Harga
Booking
Komplain
Spam
Butuh Follow Up
Customer Lama
7. Quick Reply Template

Admin bisa pilih template:

Info Harga
Minta Tipe Motor
Minta Foto/Video
Arahkan Booking
Stok Kosong
Tunggu Admin Teknis
17. Flow Automation Di Dashboard

Di menu Automation, buat bukan seperti n8n yang rumit. Buat versi sederhana:

Tampilan rule sederhana
Jika customer bertanya tentang harga
→ Cari data produk/layanan
→ Jawab otomatis jika data ditemukan
→ Jika tidak ditemukan, teruskan ke admin
Jika komentar mengandung kata spam
→ Hide comment
→ Simpan ke spam log
Jika customer minta booking
→ Minta data booking
→ Simpan
→ Notifikasi admin
18. Data Yang Diambil Sistem
Kebutuhan	Sumber Data
Chat customer	WhatsApp API, IG Graph API, website chat
Nama customer	Channel API + CRM
Riwayat chat	Database messages
Produk	PostgreSQL / Google Sheets
Harga	PostgreSQL / Google Sheets
Stok	PostgreSQL / Google Sheets
Layanan bengkel	Database services
FAQ	Knowledge Base
Diagnosa ringan	Knowledge Base teknis
Booking	Database booking / Google Calendar
Admin	Database users
Ticket	Database tickets
Report	Logs + analytics
19. Rule Keamanan Jawaban AI

AI wajib mengikuti aturan ini:

1. Jangan mengarang harga.
2. Jangan mengarang stok.
3. Jangan memberi diagnosa berat secara pasti.
4. Jangan menjawab jika data tidak ditemukan.
5. Jangan membalas jika chat sudah diambil admin.
6. Jangan hapus komentar kecuali masuk rule spam/negatif.
7. Selalu simpan log jawaban AI.
8. Untuk komplain, prioritaskan admin.
9. Untuk pertanyaan teknis berat, arahkan cek langsung.
10. Untuk produk/harga, wajib ambil dari database.
20. Flow Final Yang Bisa Anda Terapkan

Ini versi final paling rapi:

Customer Message
↓
Webhook Receiver
↓
Normalize Message
↓
Save Contact & Message
↓
Check Conversation Status
├── assigned_to_admin → Stop AI
├── blocked → Ignore
├── spam → Log Only
└── ai_active → Continue
↓
Moderation Check
├── Spam → Hide/Delete/Ignore
├── Negative → Handoff Admin
└── Safe → Continue
↓
AI Intent Classification
↓
Confidence Check
├── Low Confidence → Handoff Admin
├── High Risk → Handoff Admin
└── Safe → Continue
↓
Retrieve Data
├── Product DB
├── Service DB
├── Knowledge Base
├── Booking DB
└── Chat History
↓
Data Validation
├── Data Found → Generate Reply
└── Data Not Found → Handoff Admin
↓
AI Response Guardrail
├── Safe → Send Reply
└── Unsafe → Handoff Admin
↓
Save AI Reply
↓
Update Dashboard
↓
Analytics Log
21. MVP Yang Sebaiknya Anda Bangun Dulu

Jangan langsung buat terlalu besar. Urutan terbaik:

Phase 1 — Core Inbox
- Login admin
- Inbox semua chat
- Detail conversation
- Manual reply
- Status ai_active / assigned_to_admin / resolved
Phase 2 — AI Auto Reply
- Intent classification
- Knowledge base
- Auto reply FAQ
- Auto handoff jika tidak yakin
Phase 3 — Produk & Layanan
- Database produk
- Database layanan
- Query harga/stok
- Google Sheets sync
Phase 4 — Instagram Comment
- Auto reply komentar aman
- Hide/delete spam
- DM untuk leads
Phase 5 — Analytics
- Jumlah chat
- Jumlah leads
- Ticket masuk
- Booking masuk
- AI success rate
- Admin response time
22. Kesimpulan Flow Terbaik

Dashboard Anda sebaiknya dibuat dengan prinsip ini:

AI bukan pusat sistem.
Database adalah sumber kebenaran.
Dashboard adalah pusat kontrol.
n8n adalah mesin automation.
Admin adalah fallback untuk kasus sulit.

Flow yang paling bagus:

Omnichannel Inbox
+
AI Intent Classifier
+
Knowledge Base
+
Product/Service Database
+
Human Handoff
+
Ticketing
+
Analytics