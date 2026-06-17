1. Tujuan Unified Inbox

Unified Inbox harus membantu pengguna untuk:

Melihat semua percakapan lintas channel.
Mengetahui chat mana yang belum ditangani.
Mengetahui chat mana yang sedang dijawab AI.
Mengambil alih percakapan dari AI.
Meneruskan chat ke tim atau admin lain.
Membuat ticket, booking, order, atau deal dari chat.
Melihat histori customer secara lengkap.
Membalas dengan cepat menggunakan template dan bantuan AI.
Menutup percakapan dengan status yang jelas.
Memastikan AI tidak membalas ketika admin sedang menangani.
2. Flow Besar Unified Inbox
Pesan masuk dari channel
↓
Webhook menerima event
↓
Validasi dan normalisasi pesan
↓
Cari atau buat contact
↓
Cari atau buat conversation
↓
Simpan pesan
↓
Cek status conversation
├── AI aktif
├── Menunggu admin
├── Ditangani admin
├── Diblokir
└── Selesai
↓
Moderation dan intent classification
↓
AI menjawab atau handoff ke admin
↓
Unified Inbox diperbarui real-time
↓
Admin melakukan tindakan
↓
Semua aktivitas disimpan
3. Struktur Tampilan Utama

Gunakan layout tiga panel.

┌──────────────────────┬────────────────────────────┬──────────────────────┐
│ Daftar Percakapan    │ Area Percakapan           │ Customer Context     │
│                      │                            │                      │
│ Search               │ Header percakapan         │ Identitas customer   │
│ Filter               │ Riwayat pesan             │ Tags                 │
│ Folder/status        │ AI summary                 │ Intent               │
│ Conversation list    │ Composer balasan          │ Booking              │
│                      │ Quick action               │ Ticket               │
│                      │                            │ Deal / Order         │
└──────────────────────┴────────────────────────────┴──────────────────────┘

Proporsi desktop:

Panel kiri   : 25%
Panel tengah : 50%
Panel kanan  : 25%

Panel kanan dapat disembunyikan agar area chat lebih luas.

4. Header Halaman Inbox

Bagian atas:

Unified Inbox

[Search percakapan] [Semua Channel] [Semua Tim]
[Semua Status] [Urutkan] [Refresh]

Tambahkan quick filter:

Semua
Belum Ditangani
Butuh Admin
Ditangani Saya
AI Aktif
Menunggu Customer
Snoozed
Selesai
Spam

Contoh badge:

Belum Ditangani     12
Butuh Admin          8
Ditangani Saya       5
SLA Terlambat        3
5. Panel Kiri: Daftar Percakapan

Setiap item percakapan harus berisi:

Foto / ikon channel
Nama customer
Preview pesan terakhir
Waktu pesan terakhir
Unread count
Status AI/admin
Label atau tag
Priority

Contoh:

[WA] Budi Santoso                10:42
Kak, untuk service CVT berapa?      2

Butuh Admin · Hot Lead

Contoh lain:

[IG] @rianmotor                  10:38
Sudah dibalas AI

AI Aktif · Tanya Harga
6. Informasi Visual pada Conversation List

Gunakan indikator yang konsisten:

Indikator	Arti
Titik biru	Pesan belum dibaca
Ikon robot	AI sedang menangani
Ikon manusia	Admin sedang menangani
Ikon jam	Menunggu terlalu lama
Ikon peringatan	SLA hampir habis
Ikon merah	Urgent atau komplain
Ikon mute	Conversation disnooze
Ikon centang	Selesai

Jangan mengandalkan warna saja. Selalu gunakan ikon dan teks.

7. Filter Percakapan

Filter wajib:

Channel
Status
Assigned agent
Assigned team
Intent
Sentiment
Tag
Priority
Date range
Unread
SLA status
AI status
Customer segment
Campaign source

Contoh filter:

Channel: WhatsApp
Status: Butuh Admin
Team: Customer Service
Priority: High dan Urgent
Sort: Waktu tunggu terlama

Sediakan fitur:

Simpan sebagai View

Contoh saved views:

Chat Urgent
Booking Masuk
Komplain Aktif
Hot Leads
Chat Instagram
SLA Hampir Habis
8. Search Inbox

Search harus dapat mencari:

Nama customer
Nomor telepon
Username Instagram
Email
Isi pesan
Nomor ticket
Nomor order
Nomor booking
Tag
Catatan internal

Contoh:

"Vario 125"

Hasil dapat menampilkan semua percakapan yang membahas Vario 125.

Untuk keamanan, search mengikuti permission user.

9. Header Percakapan

Pada panel tengah:

Budi Santoso
WhatsApp · +62 812-xxxx-xxxx

Status: Human Active
Assigned: Rina
SLA: 12 menit tersisa

[Take Over] [Assign] [Snooze] [Resolve] [...]

Menu tambahan:

Buat Ticket
Buat Booking
Buat Order
Buat Deal
Blokir Customer
Tandai Spam
Export Conversation
10. Area Riwayat Pesan

Pesan dibedakan berdasarkan pengirim:

Customer
AI Assistant
Admin
System
Private Note

Contoh:

Customer:
Kak, motor saya gredek pas awal jalan.

AI:
Gredek saat awal jalan biasanya berkaitan dengan area CVT.
Boleh info tipe motor dan apakah muncul saat kondisi dingin atau panas?

Admin:
Baik kak, saya bantu cek lebih lanjut.

System:
Rina mengambil alih percakapan.

Private Note:
Customer pernah servis CVT bulan lalu.
11. Label pada Pesan

Setiap pesan dapat menampilkan:

Sent
Delivered
Read
Failed
AI generated
Admin edited
Internal note

Untuk jawaban AI, simpan metadata:

AI Agent: Technical Support
Confidence: 88%
Knowledge source: Keluhan CVT
Tool used: search_knowledge

Metadata tersebut tidak perlu tampil kepada customer, tetapi tersedia untuk admin.

12. Composer Balasan

Bagian bawah percakapan:

[ Ketik balasan...                                  ]

[Attachment] [Emoji] [Quick Reply] [AI Suggestion]
[Private Note] [Send]

Fitur composer:

Teks
Gambar
Video
Dokumen
Voice note
Emoji
Quick reply
Mention internal
Private note
AI suggested reply
Schedule send
Translate
Rewrite tone
13. Mode Reply dan Private Note

Gunakan tab jelas:

[Balas Customer] [Catatan Internal]
Balas customer

Pesan terkirim ke channel customer.

Catatan internal

Hanya dapat dilihat oleh tim internal.

Contoh:

Catatan internal:
Customer meminta diskon. Tunggu persetujuan supervisor.

Catatan internal tidak boleh terkirim ke customer dalam kondisi apa pun.

14. AI Suggested Reply

AI dapat membantu admin membuat jawaban.

Flow:

Admin membuka percakapan
↓
Sistem membaca 10–20 pesan terakhir
↓
AI membaca customer context
↓
AI mengambil knowledge terkait
↓
AI membuat suggested reply
↓
Admin memilih:
├── Kirim
├── Edit
├── Regenerate
└── Tolak

Contoh:

Saran AI:

"Untuk estimasi service CVT, harganya mulai dari Rp...,
tetapi hasil akhirnya tergantung kondisi komponen setelah dicek.
Boleh info tipe motornya, kak?"

Tombol:

Gunakan
Edit
Buat Ulang
Lebih Singkat
Lebih Ramah
15. Human Takeover

Ini flow paling penting.

AI sedang menangani
↓
Admin klik "Ambil Alih"
↓
conversation.ai_enabled = false
↓
conversation.status = human_active
↓
conversation.assigned_agent_id = admin
↓
Batalkan AI response yang masih pending
↓
Simpan system event
↓
Admin dapat membalas

Contoh system message:

Rina mengambil alih percakapan dari AI.

Logic backend:

if (conversation.status === "human_active") {
  return {
    allowAiReply: false,
    reason: "Conversation handled by human agent",
  };
}
16. Mengembalikan Chat ke AI

Setelah admin selesai:

Admin klik "Aktifkan AI"
↓
Pastikan tidak ada ticket urgent aktif
↓
conversation.ai_enabled = true
↓
conversation.status = ai_active
↓
Simpan system event
↓
AI dapat menangani pesan berikutnya

Berikan modal konfirmasi:

Aktifkan kembali AI?

AI akan menangani pesan customer berikutnya.
Percakapan yang sedang diketik admin tidak akan terganggu.
17. Status Percakapan

Gunakan status berikut:

new
unassigned
queued
ai_active
need_admin
assigned
human_active
waiting_customer
waiting_internal
snoozed
resolved
closed
spam
blocked
Penjelasan
Status	Fungsi
New	Pesan baru masuk
Unassigned	Belum memiliki agent
Queued	Menunggu agent tersedia
AI Active	Sedang ditangani AI
Need Admin	AI meminta bantuan manusia
Assigned	Sudah dialokasikan ke agent
Human Active	Admin sedang menangani
Waiting Customer	Menunggu jawaban customer
Waiting Internal	Menunggu tim internal
Snoozed	Disembunyikan sampai waktu tertentu
Resolved	Masalah sudah selesai
Closed	Percakapan ditutup final
Spam	Ditandai spam
Blocked	Customer diblokir
18. Conversation Assignment

Metode assignment:

Manual
Round Robin
Least Workload
Skill Based
Channel Based
Team Based
Intent Based
Customer Owner
Priority Based

Contoh flow:

Intent = booking
↓
Assign Team Booking
↓
Pilih agent online dengan workload terendah
↓
Jika tidak ada agent online
↓
Masuk antrean
↓
Notifikasi supervisor
19. Workload Agent

Setiap agent memiliki batas:

Max active conversations: 10
Max urgent conversations: 3

Logic:

Agent aktif < kapasitas
→ Boleh menerima chat baru

Agent mencapai kapasitas
→ Jangan assign chat baru

Semua agent penuh
→ Conversation masuk queue

Panel supervisor:

Rina      8/10
Andi     10/10  Penuh
Johan     4/10
20. SLA Percakapan

SLA dapat berbeda berdasarkan:

Channel
Priority
Customer tier
Team
Working hours
Jenis masalah

Contoh:

WhatsApp Normal:
First response: 5 menit
Resolution: 2 jam

Complaint High:
First response: 2 menit
Resolution: 30 menit

Flow:

Conversation masuk
↓
SLA timer dimulai
↓
50% waktu habis → reminder agent
↓
80% waktu habis → warning supervisor
↓
100% habis → breach dan escalation
21. Snooze Conversation

Snooze digunakan untuk percakapan yang belum perlu ditangani sekarang.

Pilihan:

30 menit
1 jam
Besok pagi
Tanggal tertentu
Saat customer membalas

Flow:

Admin klik Snooze
↓
Pilih waktu
↓
Conversation status = snoozed
↓
Disembunyikan dari inbox aktif
↓
Saat waktu tiba
↓
Status kembali assigned atau need_admin
↓
Agent mendapat notifikasi
22. Resolve Conversation

Flow:

Admin klik Resolve
↓
Sistem cek:
├── Ticket aktif?
├── Booking pending?
├── Payment pending?
└── Customer masih membutuhkan respons?
↓
Jika aman
↓
Status = resolved
↓
Simpan resolution reason
↓
Opsional kirim closing message
↓
Opsional kirim CSAT

Resolution reason:

Pertanyaan terjawab
Booking selesai
Order selesai
Komplain selesai
Customer tidak merespons
Duplicate conversation
Spam
Other
23. Reopen Conversation

Percakapan dapat dibuka kembali ketika:

Customer mengirim pesan baru.
Ticket dibuka ulang.
Admin memilih reopen.
CSAT buruk.
Automation memerlukan follow-up.
Resolved conversation
↓
Customer mengirim pesan baru
↓
Status = new atau assigned
↓
AI/admin menangani kembali
24. Panel Kanan: Customer Context

Panel kanan harus membantu admin memahami customer tanpa membuka banyak halaman.

Informasi customer
Nama
Nomor telepon
Email
Username sosial
Channel
Customer since
Last interaction
Contact owner
CRM information
Lifecycle stage
Lead score
Segment
Tags
Deal aktif
Pipeline stage
Operational information
Booking aktif
Ticket aktif
Order terakhir
Payment status
Riwayat layanan
AI information
Intent terakhir
Sentiment
AI summary
Suggested next action
Risk level
25. AI Conversation Summary

Ringkasan otomatis ditampilkan di panel kanan.

Contoh:

Ringkasan AI

Customer menanyakan estimasi service CVT untuk Vario 125.
Keluhan utama adalah gredek saat awal jalan.
AI sudah meminta informasi tahun motor, tetapi customer belum menjawab.

Rekomendasi:
Minta tahun motor dan arahkan booking pemeriksaan.

Summary diperbarui ketika:

Handoff
Setelah 10 pesan baru
Ticket dibuat
Conversation diselesaikan
26. Suggested Next Action

AI memberikan saran operasional:

Minta tipe motor
Kirim daftar harga
Buat booking
Buat ticket teknis
Follow-up pembayaran
Assign ke supervisor
Tunggu customer

Admin tetap memutuskan tindakan akhir.

27. Quick Actions dari Percakapan

Tampilkan maksimal lima aksi utama:

Ambil Alih
Assign
Buat Ticket
Buat Booking
Resolve

Aksi tambahan masuk menu:

Buat Deal
Buat Order
Tambah Tag
Block
Spam
Export
28. Membuat Ticket dari Chat

Flow:

Admin/AI klik Buat Ticket
↓
Form terisi otomatis:
├── Customer
├── Conversation
├── Summary
├── Category
├── Priority
└── Attachment
↓
Admin melengkapi data
↓
Ticket dibuat
↓
Ticket terhubung ke conversation
↓
Status conversation dapat berubah menjadi waiting_internal
29. Membuat Booking dari Chat

Flow:

Customer meminta booking
↓
Admin klik Buat Booking
↓
Customer data otomatis terisi
↓
Pilih service
↓
Pilih tanggal dan jam
↓
Pilih staff/resource
↓
Simpan
↓
Kirim konfirmasi ke customer
30. Membuat Order dari Chat
Customer memilih produk
↓
Klik Buat Order
↓
Tambah produk
↓
Cek stok
↓
Isi alamat
↓
Hitung ongkir
↓
Buat invoice/payment link
↓
Kirim ke customer
31. WhatsApp dan Channel-Specific Rules

Unified Inbox harus memahami perbedaan aturan channel.

WhatsApp
Session window.
Template message.
Delivery/read status.
Opt-in.
Media support.
Instagram
DM.
Comment reply.
Story mention/reply.
Username dan post context.
Email
Subject.
Thread.
CC/BCC.
Signature.
HTML body.
Website chat
Visitor session.
Current page URL.
Device.
Referrer.
Anonymous visitor.

Logic bisnis tetap sama, adapter channel yang menangani perbedaannya.

32. Flow Instagram Comment

Komentar publik sebaiknya memiliki tampilan khusus.

Komentar masuk
↓
Moderation
↓
Klasifikasi:
├── Pertanyaan
├── Pujian
├── Minat membeli
├── Komplain
├── Spam
└── Toxic
↓
Aksi:
├── Reply public
├── Kirim DM
├── Hide
├── Delete
├── Ignore
└── Handoff

Context yang ditampilkan:

Caption postingan
Thumbnail postingan
Komentar parent
Reply sebelumnya
Username
33. Bulk Actions

Pada panel list, admin dapat memilih beberapa conversation.

Bulk action:

Assign
Add tag
Resolve
Mark read
Mark spam
Move team
Export

Hindari bulk delete permanen.

34. Keyboard Shortcuts

Untuk mempercepat kerja agent:

R      Reply
N      Private note
A      Assign
T      Create ticket
B      Create booking
S      Snooze
E      Resolve
Ctrl+Enter  Send

Shortcut dapat dinonaktifkan.

35. Notifikasi

Agent menerima notifikasi ketika:

Conversation di-assign.
Customer membalas.
SLA hampir habis.
Mention pada private note.
Ticket urgent dibuat.
Snooze berakhir.
AI melakukan handoff.

Jenis notifikasi:

In-app
Desktop
Email
Telegram
WhatsApp internal
36. Real-Time Flow

Gunakan WebSocket atau Server-Sent Events.

Pesan baru masuk
↓
Backend menyimpan message
↓
Publish event
↓
Inbox menerima event
↓
Conversation list diperbarui
↓
Unread count bertambah
↓
Jika conversation sedang dibuka
↓
Pesan tampil langsung

Contoh event:

{
  "event": "message.created",
  "data": {
    "conversation_id": "conv_123",
    "message_id": "msg_987",
    "sender_type": "customer"
  }
}
37. API Utama
Mendapatkan conversation list
GET /api/conversations

Parameter:

status
channel
team_id
agent_id
tag
intent
priority
unread
search
sort
cursor
Mendapatkan detail
GET /api/conversations/:id
Mendapatkan pesan
GET /api/conversations/:id/messages
Mengirim pesan
POST /api/conversations/:id/messages
Take over
POST /api/conversations/:id/takeover
Assign
POST /api/conversations/:id/assign
Resolve
POST /api/conversations/:id/resolve
Snooze
POST /api/conversations/:id/snooze
Mengaktifkan AI
POST /api/conversations/:id/ai/enable
Menonaktifkan AI
POST /api/conversations/:id/ai/disable
38. Struktur Database
conversations
id
tenant_id
contact_id
channel_account_id
status
priority
ai_enabled
assigned_team_id
assigned_agent_id
intent
sentiment
last_message_at
last_customer_message_at
last_agent_message_at
first_response_at
resolved_at
snoozed_until
created_at
updated_at
messages
id
tenant_id
conversation_id
external_message_id
sender_type
sender_id
message_type
content
reply_to_message_id
delivery_status
is_private_note
ai_generated
metadata
sent_at
created_at
conversation_assignments
id
conversation_id
team_id
agent_id
assigned_by
assigned_at
unassigned_at
reason
conversation_tags
conversation_id
tag_id
created_at
conversation_events
id
conversation_id
event_type
actor_type
actor_id
payload
created_at
message_attachments
id
message_id
file_name
mime_type
file_size
storage_url
thumbnail_url
created_at
39. State Management Frontend

Untuk Zustand:

conversationList
selectedConversation
messages
filters
draftMessages
typingState
connectionStatus
unreadCounts

Pisahkan state:

useInboxStore
useConversationStore
useComposerStore
useInboxRealtimeStore

Jangan menyimpan seluruh riwayat chat dalam satu global store yang besar.

40. Struktur Komponen Next.js
app/
└── inbox/
    ├── page.tsx
    ├── loading.tsx
    ├── error.tsx
    └── components/
        ├── inbox-header.tsx
        ├── inbox-filters.tsx
        ├── conversation-list.tsx
        ├── conversation-list-item.tsx
        ├── conversation-header.tsx
        ├── message-list.tsx
        ├── message-bubble.tsx
        ├── message-composer.tsx
        ├── private-note-composer.tsx
        ├── ai-suggestion.tsx
        ├── customer-context.tsx
        ├── assignment-dialog.tsx
        ├── snooze-dialog.tsx
        ├── resolve-dialog.tsx
        └── quick-actions.tsx
41. Loading State

Gunakan skeleton.

Panel kiri:
Skeleton conversation item

Panel tengah:
Skeleton message bubbles

Panel kanan:
Skeleton profile cards

Jangan menampilkan layar kosong saat pindah conversation.

42. Empty State
Belum ada conversation
Belum ada percakapan.

Hubungkan channel agar pesan customer dapat masuk ke Unified Inbox.

[Hubungkan Channel]
Filter tidak menemukan hasil
Tidak ada percakapan yang sesuai filter.

Coba hapus sebagian filter atau ubah rentang tanggal.
Belum memilih conversation
Pilih percakapan untuk mulai membalas customer.
43. Error State

Contoh:

Pesan belum berhasil dikirim.

[Coba Lagi]

Jika token channel bermasalah:

Pesan tidak dapat dikirim karena koneksi WhatsApp bermasalah.

[Periksa Channel]

Jangan hilangkan draft ketika pengiriman gagal.

44. Offline dan Reconnect

Ketika koneksi dashboard terputus:

Koneksi terputus. Pesan baru mungkin belum tampil.
[Menghubungkan kembali...]

Draft admin harus tetap disimpan di browser.

Saat reconnect:

Fetch pesan terbaru
↓
Deduplikasi
↓
Sinkronkan status
↓
Tampilkan pesan yang tertinggal
45. Security

Unified Inbox menangani data sensitif. Terapkan:

Role-based access control.
Team-based conversation scope.
Audit log.
Data masking.
Encryption.
Signed media URL.
Rate limiting.
Webhook signature validation.
Session timeout.
Sensitive-data redaction.
Tidak menampilkan API token.

Contoh masking:

+62 812-****-1234
cu***@email.com

Agent tertentu dapat melihat penuh sesuai permission.

46. Audit Log

Simpan setiap tindakan:

Conversation dibuka
Agent mengambil alih
Agent mengirim pesan
AI diaktifkan
AI dinonaktifkan
Conversation di-assign
Tag ditambahkan
Ticket dibuat
Conversation diselesaikan
Customer diblokir

Contoh:

{
  "event": "conversation.takeover",
  "actor_id": "user_123",
  "conversation_id": "conv_456",
  "created_at": "2026-06-17T11:00:00+07:00"
}
47. Mobile Layout

Pada mobile gunakan tiga layar terpisah:

1. Conversation List
2. Chat Detail
3. Customer Detail

Flow:

Conversation List
↓
Tap conversation
↓
Chat Detail
↓
Tap customer name
↓
Customer Detail

Action utama mobile:

Reply
Take Over
Assign
Ticket
Resolve
48. UX agar Mudah Digunakan

Gunakan prinsip:

Chat urgent selalu di atas.
Filter umum tampil sebagai tab.
Advanced filter disembunyikan dalam drawer.
Tombol utama tidak lebih dari lima.
AI status selalu terlihat.
Admin dapat take over dengan satu klik.
Context customer tampil tanpa pindah halaman.
Draft tersimpan otomatis.
Setiap error punya solusi.
Keyboard shortcut tersedia untuk agent aktif.
49. Urutan Pengembangan
Fase 1 — Core Inbox
Conversation list
Message history
Manual reply
Channel identity
Unread status
Search
Basic filter
Realtime message
Fase 2 — Human Operation
Assignment
Take over
AI pause/resume
Private notes
Quick replies
Resolve
Snooze
Tags
Fase 3 — Business Integration
Customer context
Create ticket
Create booking
Create order
Create deal
SLA
Workload allocation
Fase 4 — Advanced AI
AI suggested reply
Conversation summary
Intent
Sentiment
Next action
Automatic handoff
AI evaluation
Fase 5 — Enterprise
Saved views
Bulk action
Data masking
Advanced permission
Audit logs
Export
Supervisor monitoring
50. Tampilan Final Unified Inbox
Unified Inbox
────────────────────────────────────────────────────────────

[Search] [Semua Channel] [Semua Status] [Assigned to Me]

[Semua 128] [Unread 12] [Need Admin 8] [AI Active 42]

┌───────────────────┬──────────────────────────┬────────────────────┐
│ Budi Santoso      │ Budi Santoso             │ Customer Context   │
│ Service CVT...    │ WhatsApp · Human Active  │                    │
│ Need Admin        │                          │ Hot Lead           │
│                   │ Customer:                │ Intent: Service    │
│ @rianmotor        │ Kak, service CVT berapa? │ Booking: None      │
│ Sudah dibalas AI  │                          │ Ticket: Active     │
│ AI Active         │ AI:                      │                    │
│                   │ Estimasi mulai dari...   │ [Create Booking]   │
│ Siti              │                          │ [Create Ticket]    │
│ Booking besok     │ Admin:                   │ [Add Tag]          │
│ Waiting Customer  │ Boleh info motornya?     │                    │
│                   │                          │ AI Summary         │
│                   │ [Ketik balasan...]       │ ...                │
└───────────────────┴──────────────────────────┴────────────────────┘