1. Tujuan Dashboard

Dashboard harus menjawab pertanyaan berikut:

Berapa chat yang masuk hari ini?
Berapa chat yang belum ditangani?
Berapa chat yang berhasil ditangani AI?
Berapa percakapan yang perlu admin?
Apakah ada ticket urgent atau SLA yang hampir terlambat?
Berapa booking dan order baru?
Apakah channel aktif atau bermasalah?
Bagaimana performa AI dan admin?
Apa yang harus dilakukan sekarang?

Dashboard tidak digunakan untuk mengedit data secara mendalam. Setiap card mengarahkan pengguna ke modul terkait.

2. Flow Pengguna
User Login
↓
Sistem membaca role dan permission
↓
Memuat data bisnis hari ini
↓
Menampilkan Dashboard sesuai role
↓
User melihat ringkasan kondisi
↓
User melihat bagian "Perlu Ditangani"
↓
User klik card atau item
↓
Dialihkan ke modul terkait
↓
Melakukan aksi
↓
Dashboard diperbarui

Contoh:

Admin melihat "12 Chat Butuh Admin"
↓
Klik card
↓
Masuk Unified Inbox
↓
Filter otomatis: Need Admin
↓
Admin mengambil percakapan
↓
Status conversation berubah
↓
Jumlah di Dashboard berkurang
3. Struktur Tampilan Utama

Gunakan layout berikut:

┌─────────────────────────────────────────────────────────────────┐
│ Header                                                          │
│ Sapaan | Rentang waktu | Filter channel | Refresh | Notifikasi  │
├─────────────────────────────────────────────────────────────────┤
│ Alert / Action Required                                         │
├─────────────────────────────────────────────────────────────────┤
│ KPI Cards                                                       │
│ Chat | Need Admin | AI Rate | Booking | Ticket | Revenue        │
├──────────────────────────────────┬──────────────────────────────┤
│ Grafik Percakapan                │ Aktivitas Hari Ini           │
├──────────────────────────────────┼──────────────────────────────┤
│ Performa AI                      │ Ticket & SLA                 │
├──────────────────────────────────┼──────────────────────────────┤
│ Channel Status                   │ Booking / Sales Funnel       │
├──────────────────────────────────┴──────────────────────────────┤
│ Performa Tim                                                   │
└─────────────────────────────────────────────────────────────────┘
4. Header Dashboard
Bagian kiri
Selamat pagi, Iky
Berikut ringkasan operasional bisnis hari ini.

Tambahkan informasi:

Nama bisnis aktif
Workspace aktif
Tanggal
Status jam operasional

Contoh:

Johan Garage
Rabu, 17 Juni 2026
Status: Jam Operasional Aktif
Bagian kanan

Gunakan komponen berikut:

[ Hari Ini ▼ ]
[ Semua Channel ▼ ]
[ Semua Tim ▼ ]
[ ↻ Refresh ]
[ 🔔 ]
Filter global

Filter yang tersedia:

Hari ini
Kemarin
7 hari terakhir
30 hari terakhir
Bulan ini
Custom date
Channel
Team
Agent
AI Agent

Semua komponen dashboard harus mengikuti filter global.

5. Bagian Action Required

Ini harus ditempatkan paling atas setelah header karena berisi hal yang perlu segera ditangani.

Contoh:

Perlu Ditangani

🔴 3 ticket melewati SLA
🟠 12 percakapan menunggu admin
🟡 5 booking belum dikonfirmasi
🔵 2 channel mengalami gangguan

Setiap item bisa diklik.

Flow action
User klik "12 percakapan menunggu admin"
↓
Buka Unified Inbox
↓
Filter status = need_admin
↓
Urutkan berdasarkan waktu terlama
Prioritas warna
Kondisi	Prioritas
SLA terlewati	Merah
Ticket urgent	Merah
Channel disconnected	Merah
Menunggu admin	Oranye
Booking belum dikonfirmasi	Kuning
Knowledge perlu ditinjau	Biru

Jangan memakai lebih dari empat warna status agar tampilan tidak membingungkan.

6. KPI Cards

Gunakan maksimal 6 card utama dalam satu baris desktop.

Card 1 — Total Percakapan
Total Percakapan
1.284
↑ 12,5% dibanding periode sebelumnya

Saat diklik:

Buka Unified Inbox
Filter: Semua percakapan
Periode: mengikuti filter Dashboard
Card 2 — Butuh Admin
Butuh Admin
23
8 sudah menunggu lebih dari 10 menit

Saat diklik:

Buka Unified Inbox
Filter: Need Admin
Sort: waktu tunggu terlama
Card 3 — AI Resolution Rate
Diselesaikan AI
78%
742 dari 951 percakapan

Rumus:

Percakapan selesai tanpa human handoff
÷
Total percakapan yang ditangani AI
× 100

Saat diklik:

Buka Reports
Tab: AI Performance
Card 4 — Booking Baru
Booking Baru
18
5 belum dikonfirmasi

Saat diklik:

Buka Booking
Filter: tanggal sesuai Dashboard
Card 5 — Ticket Aktif
Ticket Aktif
14
3 urgent

Saat diklik:

Buka Tickets
Filter: open + in_progress
Card 6 — Revenue atau Conversion

Untuk bisnis penjualan:

Pendapatan
Rp12.450.000
↑ 8,2%

Untuk bisnis yang belum menggunakan pembayaran:

Conversion
24,8%
42 dari 169 leads

Card ini sebaiknya dapat dikonfigurasi berdasarkan jenis bisnis.

7. Grafik Percakapan

Gunakan grafik garis atau bar sederhana.

Data yang ditampilkan
Percakapan masuk
Dijawab AI
Dijawab admin
Percakapan selesai
Handoff
Filter internal
[ Percakapan ] [ AI vs Admin ] [ Handoff ]
Contoh data
08:00  15 chat
09:00  27 chat
10:00  42 chat
11:00  31 chat
Interaksi

Ketika user hover:

10:00
Percakapan masuk: 42
AI handled: 31
Admin handled: 11
Handoff: 7

Ketika user klik titik grafik:

Buka Unified Inbox
Filter berdasarkan rentang waktu tersebut
8. Aktivitas Hari Ini

Panel ini menampilkan event penting, bukan semua log teknis.

Contoh:

10:42  Ticket #TK-1042 dibuat oleh AI
10:39  Booking baru dari WhatsApp
10:36  Admin Rina mengambil alih percakapan
10:31  Payment order #ORD-291 berhasil
10:25  Instagram terhubung kembali
Event yang ditampilkan
Ticket dibuat
Booking dibuat
Order dibayar
Admin mengambil alih
Campaign dimulai
Channel terputus
SLA terlewati
AI gagal menjawab
Knowledge dipublikasikan

Sediakan tombol:

Lihat Semua Aktivitas

Arahkan ke audit log atau activity log.

9. Performa AI

Panel AI harus sederhana tetapi informatif.

Metrics
AI Reply Rate          84%
Resolution Rate        78%
Handoff Rate           22%
Retrieval Success      91%
Average Response       2,4 detik
Unanswered Questions   17
Bagian tambahan

Tampilkan tiga intent paling sering:

Top Intent

1. Tanya Harga       324
2. Booking           182
3. Tanya Stok        143

Tampilkan juga masalah utama:

AI Perlu Diperbaiki

- 17 pertanyaan belum memiliki jawaban
- 6 kegagalan pencarian produk
- 3 jawaban ditandai salah oleh admin

Tombol:

Lihat Performa AI
Perbaiki Knowledge
10. Ticket dan SLA

Panel ini harus menampilkan beban operasional.

Ticket Aktif          24
Urgent                 3
Mendekati SLA          5
SLA Terlewati          2
Waiting Customer       7
Daftar ticket prioritas
TK-1042  Komplain pembayaran      Urgent   4 menit tersisa
TK-1038  Booking tidak masuk      High     SLA terlewati
TK-1031  Produk salah kirim       High     18 menit tersisa

Ketika diklik:

Buka detail ticket

Tombol:

Lihat Semua Ticket
11. Status Channel

Tampilkan channel dalam bentuk compact cards.

WhatsApp       Connected
Instagram      Connected
Telegram       Connected
Website Chat   Connected
Email          Warning
Facebook       Disconnected

Informasi tambahan:

Last event
Token status
Webhook status
Error count

Contoh:

Instagram
Connected
Event terakhir: 12 detik lalu

Jika bermasalah:

Facebook
Disconnected
Token kedaluwarsa
[ Hubungkan Ulang ]

Jangan menampilkan API key atau data sensitif di Dashboard.

12. Booking dan Sales Funnel
Untuk bisnis jasa

Tampilkan booking funnel:

Booking Requested     28
Pending Confirmation   7
Confirmed              16
Completed               4
Cancelled               1

Visual:

Requested → Confirmed → Completed
   28          16           4
Untuk bisnis penjualan

Tampilkan sales funnel:

New Lead       120
Qualified       74
Quotation       32
Negotiation     19
Won             11

User dapat memilih widget:

[ Booking Funnel ▼ ]

Pilihan:

Booking Funnel
Sales Funnel
Order Funnel
Campaign Funnel
13. Performa Tim

Gunakan tabel ringkas.

Agent	Status	Active Chat	Avg Response	Resolved	CSAT
Rina	Online	8	1m 42s	32	4.8
Andi	Busy	10	2m 16s	28	4.6
Johan	Away	3	3m 04s	19	4.7
Indikator overload
Rina     8/10
Andi    10/10  Overload
Johan    3/10

Jika agent overload, supervisor dapat:

Reassign conversation
Ubah status agent
Tambah capacity
Pindahkan ke team lain
14. Quick Actions

Tambahkan tombol aksi cepat, tetapi maksimal 5.

+ Buat Contact
+ Buat Booking
+ Buat Ticket
+ Buat Campaign
+ Tambah Knowledge

Posisi terbaik:

Dropdown Quick Create di header
Atau floating button untuk mobile

Jangan memenuhi Dashboard dengan terlalu banyak tombol.

15. Dashboard Berdasarkan Role

Dashboard sebaiknya berbeda sesuai role.

Owner

Melihat:

Semua KPI
Revenue
AI performance
Team performance
Campaign
Channel health
Supervisor

Melihat:

Queue
Need admin
Ticket SLA
Agent workload
Handoff
Escalation
Agent

Melihat:

Assigned conversation
Unread chat
Ticket pribadi
Task pribadi
Booking hari ini
Performa pribadi
Marketing

Melihat:

Campaign aktif
Delivery
Read rate
Reply rate
Leads
Conversion
Teknisi

Melihat:

Ticket teknis
Booking servis
Customer complaint
Assigned cases
16. Flow Data Dashboard

Jangan mengambil data dengan banyak query dari frontend.

Gunakan endpoint agregasi:

GET /api/dashboard/overview

Parameter:

from
to
channel_id
team_id
agent_id
timezone

Contoh response:

{
  "summary": {
    "conversations": 1284,
    "need_admin": 23,
    "ai_resolution_rate": 78.2,
    "new_bookings": 18,
    "active_tickets": 14,
    "revenue": 12450000
  },
  "alerts": [
    {
      "type": "sla_breached",
      "severity": "critical",
      "count": 3
    }
  ],
  "conversation_chart": [],
  "ai_performance": {},
  "ticket_summary": {},
  "channel_health": [],
  "team_performance": []
}
17. Backend Aggregation Flow
Dashboard Request
↓
Validasi user dan tenant
↓
Baca role dan permission
↓
Validasi date range
↓
Ambil cached dashboard data
↓
Jika cache tersedia
├── Return cache
└── Jika tidak tersedia
    ↓
    Query aggregate PostgreSQL
    ↓
    Gabungkan metrics
    ↓
    Simpan cache
    ↓
    Return response

Gunakan Redis cache:

dashboard:{tenant_id}:{role}:{date_range}:{filters}

TTL rekomendasi:

30–60 detik

Untuk data kritis seperti channel status dan SLA, gunakan update real-time melalui WebSocket atau Server-Sent Events.

18. Real-Time Update

Data yang harus diperbarui secara real-time:

Pesan baru
Need admin
Ticket baru
SLA warning
Booking baru
Channel disconnected
Agent status
Order/payment status

Flow:

Event terjadi
↓
Backend menyimpan data
↓
Publish event ke Redis
↓
WebSocket server menerima
↓
Dashboard menerima update
↓
Card diperbarui tanpa reload

Contoh event:

{
  "event": "dashboard.metric.updated",
  "data": {
    "metric": "need_admin",
    "value": 24
  }
}
19. Loading, Empty dan Error State
Loading

Gunakan skeleton, bukan spinner besar.

[ Skeleton card ]
[ Skeleton chart ]
[ Skeleton list ]
Empty state

Contoh jika belum ada channel:

Belum ada channel yang terhubung.

Hubungkan WhatsApp, Instagram, atau channel lain
untuk mulai menerima percakapan.

[ Hubungkan Channel ]
Tidak ada data pada periode
Belum ada aktivitas pada periode ini.

Coba ubah rentang tanggal atau filter channel.
Error state
Data Dashboard belum berhasil dimuat.

[ Coba Lagi ]

Untuk admin teknis:

[ Lihat Detail Error ]
20. Responsive Design
Desktop
Sidebar tetap
6 KPI cards
2-column widgets
Full table
Tablet
Sidebar collapsible
3 KPI per baris
Widget satu atau dua kolom
Mobile

Urutan mobile:

Header
Action Required
KPI cards horizontal scroll
Need Admin
Ticket Urgent
Booking Today
Conversation Chart
AI Performance
Channel Status
Team Performance

Di mobile, tampilkan hanya data yang paling penting.

21. Struktur Komponen Frontend

Untuk Next.js:

app/
└── dashboard/
    ├── page.tsx
    ├── loading.tsx
    ├── error.tsx
    └── components/
        ├── dashboard-header.tsx
        ├── dashboard-filters.tsx
        ├── action-required.tsx
        ├── metric-card.tsx
        ├── conversation-chart.tsx
        ├── activity-feed.tsx
        ├── ai-performance-card.tsx
        ├── ticket-sla-card.tsx
        ├── channel-health-card.tsx
        ├── booking-funnel.tsx
        ├── team-performance-table.tsx
        └── quick-create.tsx

Pisahkan logic:

services/
└── dashboard.service.ts

hooks/
├── use-dashboard.ts
└── use-dashboard-realtime.ts

types/
└── dashboard.types.ts
22. Flow Klik Antarfitur
Komponen Dashboard	Tujuan
Total Conversations	Unified Inbox
Need Admin	Unified Inbox dengan filter
AI Resolution	AI Reports
New Booking	Booking
Active Tickets	Tickets
Revenue	Orders/CRM Reports
Unanswered Questions	Knowledge Base
Channel Error	Channels
Agent Performance	Team Reports
Campaign Conversion	Campaign Reports

Filter dari Dashboard harus tetap dibawa ke halaman tujuan.

Contoh:

/dashboard?range=today&channel=instagram
↓
Klik Need Admin
↓
/inbox?status=need_admin&range=today&channel=instagram
23. Urutan Implementasi
Tahap 1 — Wajib
Header dan global filters
Action Required
6 KPI cards
Conversation chart
Recent activities
Navigation ke modul lain
Loading, error dan empty state
Tahap 2 — Operasional
AI performance
Ticket dan SLA
Channel status
Booking funnel
Team workload
Tahap 3 — Advanced
Role-based dashboard
Custom widgets
Drag-and-drop widgets
Saved views
Export report
Real-time updates
AI business summary
24. Tampilan Final yang Direkomendasikan
Dashboard
────────────────────────────────────────────────────

Selamat pagi, Iky
Ringkasan operasional Johan Garage hari ini.

[Hari Ini] [Semua Channel] [Semua Tim] [Refresh]

PERLU DITANGANI
[3 SLA terlewati] [12 Butuh Admin] [5 Booking Pending]

RINGKASAN
[Total Chat] [Need Admin] [AI Resolution]
[Booking] [Ticket] [Revenue]

[Grafik Percakapan................] [Aktivitas Hari Ini....]

[Performa AI......................] [Ticket & SLA..........]

[Channel Status...................] [Booking Funnel.........]

[Performa Tim........................................]
25. Prinsip UX yang Harus Dijaga
Informasi terpenting selalu di bagian atas.
Maksimal enam KPI utama.
Setiap card harus dapat diklik.
Dashboard tidak boleh menjadi tempat konfigurasi.
Status kritis harus terlihat tanpa scroll.
Gunakan bahasa bisnis, bukan istilah teknis.
Semua angka harus memiliki konteks perbandingan.
Filter global berlaku untuk seluruh widget.
Role berbeda mendapatkan Dashboard berbeda.
Mobile fokus pada antrean dan tindakan penting.