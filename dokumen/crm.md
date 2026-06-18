1. Fungsi Utama Contacts / CRM

Fitur ini harus menangani:

Penyimpanan identitas customer.
Penggabungan customer dari beberapa channel.
Riwayat percakapan dan aktivitas.
Tag dan segmentasi.
Lead scoring.
Pipeline sales.
Deal dan peluang penjualan.
Task dan follow-up.
Customer journey.
Import dan export data.
Custom fields.
Duplicate contact detection.
Consent dan opt-in.
Integrasi ke Inbox, Booking, Ticket, Order, dan Campaign.
2. Struktur Menu Contacts / CRM
Contacts / CRM
├── Contacts
├── Companies
├── Segments
├── Deals & Pipeline
├── Tasks & Activities
├── Customer Journey
├── Lead Scoring
├── Tags
├── Custom Fields
├── Import / Export
└── Duplicate Management

Untuk versi awal, tampilkan menu utama berikut saja:

Contacts
Segments
Deals
Tasks

Fitur lain dapat ditempatkan di tab atau pengaturan lanjutan.

3. Flow Besar Contacts / CRM
Customer menghubungi bisnis
↓
Sistem menerima identitas dari channel
↓
Cari contact berdasarkan:
- External channel ID
- Nomor WhatsApp
- Email
- Username
↓
Contact ditemukan?
├── Ya → Update contact dan last interaction
└── Tidak → Buat contact baru
↓
Hubungkan conversation ke contact
↓
AI menganalisis intent, sentiment, dan kebutuhan
↓
Update tag, segment, dan lead score
↓
Buat aktivitas atau deal jika diperlukan
↓
Simpan customer journey
↓
Tampilkan profil lengkap di CRM
4. Tampilan Halaman Contacts

Gunakan layout berikut:

┌──────────────────────────────────────────────────────────────┐
│ Contacts                                                     │
│ [Search] [Segment] [Tag] [Owner] [Channel] [+ Add Contact]  │
├──────────────────────────────────────────────────────────────┤
│ Filter cepat                                                 │
│ Semua | New Lead | Hot Lead | Customer | Follow-up | Blocked│
├──────────────────────────────────────────────────────────────┤
│ Tabel Contacts                                               │
│ Nama | Kontak | Channel | Segment | Score | Owner | Last Act│
├──────────────────────────────────────────────────────────────┤
│ Pagination / Cursor                                          │
└──────────────────────────────────────────────────────────────┘
5. Kolom Tabel Contacts

Kolom default:

Kolom	Fungsi
Customer	Nama dan foto
Contact	Nomor telepon atau email
Channel	Sumber utama customer
Status	Lead, Customer, VIP, Churned
Segment	Kelompok customer
Lead Score	Tingkat potensi closing
Owner	Admin penanggung jawab
Last Interaction	Aktivitas terakhir
Next Follow-up	Jadwal tindakan berikutnya
Actions	Lihat, edit, assign

Jangan tampilkan terlalu banyak kolom sekaligus. Sediakan:

Customize Columns
6. Quick Filter

Tampilkan quick filter di bagian atas:

Semua Contact
New Lead
Hot Lead
Butuh Follow-up
Pernah Booking
Pernah Order
Komplain Aktif
Tidak Aktif
Blocked

Setiap filter menampilkan jumlah:

Hot Lead           42
Butuh Follow-up    18
Komplain Aktif      6
7. Search Contact

Search harus dapat mencari:

Nama
Nomor telepon
Email
Username Instagram
Telegram ID
Company
Tag
Nomor booking
Nomor order
Nomor ticket
Isi catatan

Contoh:

Search: "Vario 125"

Hasil dapat menampilkan customer yang memiliki kendaraan Vario 125.

8. Detail Contact

Gunakan layout tiga bagian.

┌─────────────────────────────────────────────────────────────┐
│ Header Profil                                               │
│ Nama | Status | Score | Owner | Quick Actions              │
├─────────────────────┬───────────────────────────────────────┤
│ Informasi Customer  │ Timeline Aktivitas                    │
│                     │                                       │
│ Identitas           │ Chat                                  │
│ Tags                │ Booking                               │
│ Segment             │ Ticket                                │
│ Custom Fields       │ Order                                 │
│ Consent             │ Campaign                              │
├─────────────────────┴───────────────────────────────────────┤
│ Related Data: Deals | Tasks | Notes | Files                │
└─────────────────────────────────────────────────────────────┘
9. Header Contact

Contoh:

Budi Santoso
Hot Lead · Score 78

WhatsApp: +62 812-xxxx-1234
Instagram: @budimotor
Owner: Rina

[Send Message] [Create Booking] [Create Ticket]
[Create Deal] [Add Task] [...]

Quick actions utama:

Kirim Pesan
Buat Booking
Buat Ticket
Buat Deal
Tambah Task

Aksi tambahan:

Edit Contact
Merge Contact
Tambah Tag
Block
Export
Delete
10. Identitas Customer

Data standar:

Nama lengkap
Nama panggilan
Nomor telepon
Email
Alamat
Kota
Tanggal lahir
Gender opsional
Company
Job title
Preferred channel
Preferred language
Timezone

Data channel:

WhatsApp ID
Instagram ID
Facebook ID
Telegram ID
Email identity
Website visitor ID
11. Identity Resolution

Satu customer dapat menghubungi dari beberapa channel.

Contoh:

WhatsApp     +62 812-xxxx-1234
Instagram    @budimotor
Email        budi@email.com
Telegram     82394823

Semua identitas harus digabungkan ke satu:

contact_id = contact_001

Flow:

Pesan masuk
↓
Cek external channel ID
↓
Cek nomor telepon
↓
Cek email
↓
Cek identity mapping
↓
Match ditemukan?
├── Ya → Hubungkan ke contact lama
└── Tidak → Buat contact baru
12. Duplicate Contact Detection

Contact dapat duplikat karena:

Nomor ditulis dalam format berbeda.
Customer menggunakan channel berbeda.
Admin mengimpor CSV.
Email berbeda tetapi orang sama.

Contoh normalisasi nomor:

081234567890
6281234567890
+62 812 3456 7890

Semua diubah menjadi:

+6281234567890
Duplicate rule
Exact phone match        → High confidence
Exact email match        → High confidence
Same name + phone suffix → Medium confidence
Same social username     → High confidence
Merge flow
Sistem menemukan kemungkinan duplikat
↓
Tampilkan perbandingan
↓
Admin memilih master contact
↓
Gabungkan:
- Identities
- Conversations
- Bookings
- Tickets
- Orders
- Tags
- Notes
↓
Simpan merge history

Jangan hapus data sumber sebelum merge berhasil.

13. Contact Status dan Lifecycle

Gunakan lifecycle yang jelas:

Visitor
Lead
Qualified Lead
Opportunity
Customer
Repeat Customer
VIP
Inactive
Churned
Blocked

Flow contoh:

Customer pertama kali chat
→ Lead

Customer memberikan kebutuhan jelas
→ Qualified Lead

Customer meminta penawaran atau booking
→ Opportunity

Booking/order selesai
→ Customer

Melakukan transaksi kembali
→ Repeat Customer

Status dapat diperbarui:

Manual oleh admin.
Otomatis melalui automation.
Oleh AI berdasarkan aturan yang aman.
14. Tags

Tags digunakan untuk klasifikasi cepat.

Contoh:

Hot Lead
Tanya Harga
Booking
Service CVT
Komplain
Customer Lama
Belum Bayar
Follow-up
Spam
VIP

Aturan tag:

Tag dapat ditambahkan manual.
Tag dapat ditambahkan AI.
Tag dapat ditambahkan automation.
Tag tidak boleh duplikat.
Tag dapat memiliki warna dan deskripsi.

Jangan menggunakan terlalu banyak tag tanpa kategori.

Kategori tag:

Interest
Customer Status
Product
Service
Risk
Campaign
Operational
15. Segments

Segment adalah kumpulan contact berdasarkan aturan.

Contoh segment:

Hot Lead dari Instagram
Customer belum booking
Customer pernah service CVT
Customer tidak aktif 90 hari
Customer dari campaign Ramadan
VIP Customer
Komplain belum selesai
Segment statis

Admin memilih anggota secara manual.

Segment dinamis

Anggota berubah otomatis berdasarkan kondisi.

Contoh:

Nama segment:
Hot Lead Belum Booking

Conditions:
Lead score ≥ 60
AND booking count = 0
AND last interaction ≤ 14 hari
16. Segment Builder

UI sederhana:

Pilih kondisi:

[Lead Score] [lebih besar dari] [60]
AND
[Booking Count] [sama dengan] [0]
AND
[Last Interaction] [dalam] [14 hari terakhir]

Operator:

Equals
Not equals
Contains
Greater than
Less than
Before
After
Is empty
Is not empty

Gunakan grouping:

Condition A
AND
(Condition B OR Condition C)
17. Lead Scoring

Lead score membantu menentukan prioritas.

Rentang:

0–100

Contoh rule:

Aktivitas	Score
Chat pertama	+5
Tanya harga	+10
Tanya stok	+10
Minta katalog	+10
Tanya lokasi	+5
Membuat booking	+30
Membalas campaign	+15
Membuka payment link	+15
Tidak merespons 14 hari	-10
Membatalkan booking	-15
Menandai spam	-100

Klasifikasi:

0–20    Cold
21–50   Warm
51–75   Hot
76–100  Ready to Close
18. Lead Score Flow
Customer melakukan aktivitas
↓
Activity event dibuat
↓
Scoring engine mencari rule terkait
↓
Tambah atau kurangi score
↓
Perbarui lead score
↓
Cek threshold
↓
Jika masuk Hot Lead
→ Tambah tag
→ Assign sales
→ Buat follow-up task

Score harus memiliki histori:

+10 Tanya harga
+15 Membalas campaign
-10 Tidak aktif 14 hari
19. Deals dan Pipeline

Deals digunakan untuk proses penjualan.

Pipeline umum
New Lead
↓
Contacted
↓
Qualified
↓
Proposal
↓
Negotiation
↓
Won
atau
Lost
Pipeline bengkel
Tanya Layanan
↓
Estimasi Diberikan
↓
Menunggu Booking
↓
Booking Dikonfirmasi
↓
Motor Masuk
↓
Pengerjaan
↓
Selesai
20. Tampilan Pipeline

Gunakan Kanban:

┌──────────────┬──────────────┬──────────────┬──────────────┐
│ New Lead     │ Qualified    │ Booking      │ Won          │
├──────────────┼──────────────┼──────────────┼──────────────┤
│ Budi         │ Rian         │ Siti         │ Andi         │
│ Rp1.200.000  │ Rp850.000    │ Rp2.100.000  │ Rp1.500.000  │
└──────────────┴──────────────┴──────────────┴──────────────┘

Fitur:

Drag and drop
Filter owner
Filter pipeline
Filter source
Search deal
Total value per stage
Overdue activity indicator
21. Data Deal
Deal title
Contact
Company
Pipeline
Stage
Value
Probability
Expected close date
Owner
Source
Product/service
Campaign attribution
Lost reason
Created at
Updated at

Contoh:

Paket Bore Up Vario 150
Value: Rp4.500.000
Stage: Negotiation
Probability: 70%
Owner: Rina
22. Deal Automation
Customer membuat booking
↓
Cari deal aktif
↓
Jika tidak ada
→ Buat deal
↓
Pindahkan stage:
Menunggu Booking → Booking Dikonfirmasi
↓
Assign owner
↓
Buat task follow-up

Saat pembayaran selesai:

Payment received
↓
Deal stage = Won
↓
Contact lifecycle = Customer
↓
Tambah tag Customer
↓
Catat revenue
23. Tasks dan Follow-up

Tasks digunakan agar customer tidak terlupakan.

Jenis task:

Call
WhatsApp Follow-up
Email
Meeting
Send Quotation
Confirm Booking
Check Payment
Technical Follow-up
Other

Data task:

Title
Contact
Related deal
Assigned user
Due date
Priority
Status
Reminder
Description

Status:

Open
In Progress
Completed
Cancelled
Overdue
24. Task Flow
Hot Lead terdeteksi
↓
Buat task:
Follow-up customer
↓
Assign sales owner
↓
Set due date
↓
Kirim reminder
↓
Agent menyelesaikan task
↓
Simpan outcome

Outcome contoh:

Customer tertarik
Customer meminta waktu
Tidak dapat dihubungi
Booking dibuat
Tidak tertarik
25. Timeline Aktivitas

Timeline menjadi pusat histori customer.

Event yang ditampilkan:

Contact dibuat
Pesan diterima
AI menjawab
Admin mengambil alih
Tag ditambahkan
Segment berubah
Lead score berubah
Booking dibuat
Ticket dibuat
Order dibuat
Pembayaran diterima
Deal berpindah stage
Campaign dikirim
Task selesai
Catatan ditambahkan

Contoh:

17 Jun 2026, 10:42
Customer bertanya tentang service CVT melalui WhatsApp.

17 Jun 2026, 10:44
AI menambahkan tag "Service CVT".

17 Jun 2026, 10:47
Booking dibuat untuk 18 Juni 2026.
26. Customer Journey

Customer journey menampilkan perjalanan customer secara kronologis.

Instagram Ad
↓
Instagram DM
↓
Contact Created
↓
AI Conversation
↓
Admin Handoff
↓
Booking Created
↓
Service Completed
↓
CSAT Submitted
↓
Repeat Booking

Setiap event memiliki:

event_type
source
channel
timestamp
campaign
metadata
27. Notes

Admin dapat menambahkan catatan.

Contoh:

Customer lebih nyaman dihubungi sore hari.
Motor sudah pernah bore up.
Jangan berikan estimasi final sebelum pemeriksaan.

Jenis note:

General
Sales
Technical
Complaint
Billing
Private

Aturan:

Note tidak terkirim ke customer.
Note mencatat siapa pembuatnya.
Note sensitif mengikuti permission.
Note tidak dapat dihapus tanpa audit log.
28. Custom Fields

Setiap bisnis memerlukan data berbeda.

Contoh untuk bengkel:

Tipe Motor
Tahun Motor
Nomor Polisi
Kilometer
Jenis Modifikasi
Keluhan Utama
Tanggal Service Terakhir

Contoh untuk rental:

Jenis Mobil
Tanggal Sewa
Durasi
Lokasi Pickup

Field type:

Text
Long text
Number
Currency
Date
Datetime
Dropdown
Multi-select
Checkbox
Phone
Email
URL
Relation
29. Form Add Contact

Buat form singkat terlebih dahulu.

Required
Nama
Minimal satu identitas:
- Phone
- Email
- Social ID
Optional
Owner
Lifecycle
Tags
Company
Source
Notes
Custom Fields

Gunakan progressive disclosure. Jangan tampilkan semua field sekaligus.

30. Import Contacts

Flow:

Admin upload CSV/XLSX
↓
Preview data
↓
Mapping kolom
↓
Validasi format
↓
Deteksi duplicate
↓
Pilih update strategy
↓
Import
↓
Tampilkan result

Pilihan update strategy:

Skip duplicate
Update existing
Create new
Review manually

Hasil import:

Berhasil: 950
Diperbarui: 120
Duplikat: 18
Gagal: 12

Sediakan file error berisi alasan kegagalan.

31. Export Contacts

Filter diterapkan sebelum export.

Pilihan:

Current view
Selected contacts
All contacts
Specific segment

Format:

CSV
XLSX

Data sensitif hanya dapat diekspor oleh role tertentu.

Semua export masuk audit log.

32. Consent dan Opt-in

Simpan status izin komunikasi:

WhatsApp Marketing Opt-in
Email Marketing Opt-in
SMS Opt-in
Privacy Consent
Consent Source
Consent Date
Opt-out Date

Flow:

Customer memberikan consent
↓
Simpan source dan timestamp
↓
Customer dapat masuk campaign

Jika opt-out:

Customer meminta berhenti
↓
Set marketing_opt_in = false
↓
Masukkan suppression list
↓
Hentikan campaign berikutnya
33. Contact Owner

Setiap contact dapat mempunyai owner.

Assignment berdasarkan:

Manual
Round robin
Source channel
Region
Product interest
Lead score
Customer segment
Previous owner

Contoh:

Lead Instagram → Team Sales Digital
Customer bengkel lama → Owner sebelumnya
Komplain → Customer Service Supervisor
34. AI dalam CRM

AI dapat membantu:

Merangkum profil customer
Mengklasifikasi intent
Memberikan tag
Menyarankan segment
Menghitung lead score
Menyarankan next action
Mendeteksi churn risk
Mendeteksi duplicate
Membuat follow-up draft

AI tidak boleh:

Mengubah data transaksi tanpa validasi
Menghapus contact
Menggabungkan duplicate otomatis tanpa confidence tinggi
Mengubah consent
Menandai Won tanpa event bisnis
35. AI Customer Summary

Contoh:

Customer Summary

Budi merupakan hot lead dari WhatsApp.
Ia tertarik pada service CVT untuk Vario 125 dan sudah
bertanya dua kali dalam tujuh hari terakhir.

Booking belum dibuat.

Rekomendasi:
Kirim pilihan jadwal service dan follow-up hari ini.
36. Suggested Next Action

Pilihan:

Follow-up WhatsApp
Kirim daftar harga
Buat booking
Buat quotation
Assign sales
Buat ticket
Tunggu customer

Setiap saran menampilkan alasan:

Disarankan follow-up karena customer telah bertanya harga
dua kali tetapi belum membuat booking.
37. Automation CRM Wajib
Contact baru
Contact created
→ Tambahkan lifecycle Lead
→ Assign owner
→ Tambahkan source tag
Hot lead
Lead score ≥ 60
→ Tambahkan tag Hot Lead
→ Assign sales
→ Buat task follow-up
→ Notifikasi owner
Booking dibuat
Booking created
→ Lifecycle = Opportunity
→ Update deal stage
→ Tambahkan tag Booking
Transaksi selesai
Order/service completed
→ Lifecycle = Customer
→ Deal = Won
→ Tambah transaction count
Tidak aktif
Tidak ada aktivitas 90 hari
→ Lifecycle = Inactive
→ Masuk segment reactivation
Komplain
Complaint detected
→ Tambahkan tag Complaint
→ Buat ticket
→ Pause marketing campaign
38. Hubungan dengan Unified Inbox

Dari Inbox:

Klik nama customer
↓
Buka customer context
↓
Klik View Full Profile
↓
Masuk Contacts / CRM

Dari CRM:

Klik Send Message
↓
Cari conversation aktif
↓
Jika ada → buka conversation
↓
Jika tidak ada → buat outbound conversation sesuai aturan channel
39. Hubungan dengan Booking
Contact
↓
Related Bookings
↓
Lihat semua booking
↓
Create / Reschedule / Cancel

Data booking tidak disalin ke contact. Gunakan relasi:

booking.contact_id
40. Hubungan dengan Tickets
Contact
↓
Related Tickets
↓
Open, In Progress, Resolved

Jika ada ticket urgent, tampilkan warning pada profil:

Customer memiliki 1 ticket urgent aktif.
41. Hubungan dengan Campaign
Segment CRM
↓
Pilih sebagai audience
↓
Validasi consent
↓
Masukkan ke campaign
↓
Simpan campaign attribution

Saat customer membalas:

Campaign reply
↓
Conversation dibuat
↓
Contact timeline diperbarui
↓
Lead score bertambah
42. API Utama
List contacts
GET /api/contacts

Parameter:

search
lifecycle
segment_id
tag_id
owner_id
channel
lead_score_min
lead_score_max
last_interaction_from
last_interaction_to
cursor
Detail contact
GET /api/contacts/:id
Create contact
POST /api/contacts
Update contact
PATCH /api/contacts/:id
Timeline
GET /api/contacts/:id/timeline
Merge contacts
POST /api/contacts/merge
Add tag
POST /api/contacts/:id/tags
Create task
POST /api/contacts/:id/tasks
Create deal
POST /api/contacts/:id/deals
43. Struktur Database
contacts
id
tenant_id
first_name
last_name
display_name
primary_phone
primary_email
lifecycle_stage
lead_score
owner_id
company_id
preferred_channel
preferred_language
timezone
source
status
last_interaction_at
created_at
updated_at
contact_identities
id
tenant_id
contact_id
channel_type
channel_account_id
external_user_id
identity_value
is_primary
verified_at
created_at
contact_tags
contact_id
tag_id
created_by
created_at
tags
id
tenant_id
name
category
color
description
created_at
segments
id
tenant_id
name
segment_type
conditions
contact_count
created_by
created_at
updated_at
contact_events
id
tenant_id
contact_id
event_type
source
reference_type
reference_id
payload
occurred_at
custom_fields
id
tenant_id
entity_type
name
field_key
field_type
options
is_required
created_at
custom_field_values
id
tenant_id
entity_type
entity_id
custom_field_id
value
updated_at
deals
id
tenant_id
contact_id
pipeline_id
stage_id
title
value
probability
owner_id
expected_close_at
status
won_at
lost_at
lost_reason
created_at
updated_at
tasks
id
tenant_id
contact_id
deal_id
title
task_type
assigned_to
priority
status
due_at
completed_at
outcome
created_at
44. Permission
Owner
Semua data
Import/export
Merge
Delete
Custom fields
Lead scoring
Supervisor
Semua contact dalam tim
Assign owner
Merge
Edit segment
Lihat performance
Agent
Contact milik sendiri atau tim
Edit field tertentu
Tambah note
Buat task
Buat deal
Marketing
Segment
Campaign audience
Consent
Limited contact view
Viewer
Read-only
Data masking
Tanpa export
45. Security

Terapkan:

Data masking.
Permission berdasarkan tim.
Audit log.
Export restriction.
Consent tracking.
Encryption.
Duplicate-safe merge.
Soft delete.
Retention policy.
Activity history.

Contoh masking:

+62 812-****-1234
bu***@email.com
46. Loading, Empty, dan Error State
Empty contacts
Belum ada customer.

Customer akan otomatis dibuat ketika pesan masuk,
atau Anda dapat menambahkannya secara manual.

[Tambah Contact] [Import Contact]
Empty segment
Belum ada contact yang memenuhi kondisi segment ini.
Error import
12 data tidak berhasil diimpor.

[Unduh Detail Error]
Duplicate warning
Contact serupa ditemukan.

Budi Santoso
+62 812-xxxx-1234

[Tinjau] [Tetap Buat Baru]
47. Responsive Design
Desktop
Tabel contact
Side detail drawer
Full timeline
Pipeline kanban
Tablet
Tabel ringkas
Filter dalam drawer
Detail contact satu halaman
Mobile
Contact cards
Search
Quick filters
Profile
Timeline
Quick actions

Urutan detail mobile:

Profile
Quick Actions
Summary
Contact Information
Tags
Active Ticket/Booking
Timeline
Deals
Tasks
48. Struktur Komponen Next.js
app/
└── contacts/
    ├── page.tsx
    ├── loading.tsx
    ├── error.tsx
    ├── [contactId]/
    │   └── page.tsx
    └── components/
        ├── contacts-header.tsx
        ├── contacts-table.tsx
        ├── contact-card.tsx
        ├── contact-filters.tsx
        ├── contact-profile-header.tsx
        ├── contact-information.tsx
        ├── contact-timeline.tsx
        ├── contact-tags.tsx
        ├── contact-summary.tsx
        ├── lead-score-card.tsx
        ├── related-bookings.tsx
        ├── related-tickets.tsx
        ├── related-deals.tsx
        ├── task-list.tsx
        ├── merge-contact-dialog.tsx
        └── import-contact-dialog.tsx

Tambahan CRM:

app/
└── crm/
    ├── pipeline/
    ├── deals/
    ├── tasks/
    └── segments/
49. Urutan Pengembangan
Fase 1 — Contact Core
Contact list
Contact detail
Search
Basic filters
Create/edit contact
Channel identities
Conversation history
Tags
Owner
Fase 2 — CRM
Lifecycle
Lead score
Segments
Tasks
Notes
Custom fields
Import/export
Fase 3 — Sales
Deals
Pipeline
Deal stages
Revenue
Sales activities
Lost reasons
Fase 4 — Automation
Auto tagging
Auto scoring
Auto assignment
Follow-up tasks
Segment automation
Lifecycle update
Fase 5 — Advanced
Customer journey
Duplicate merge
Churn prediction
AI customer summary
Next best action
Advanced permission
Consent management
50. Tampilan Final Contacts / CRM
Contacts / CRM
────────────────────────────────────────────────────────────

[Search Customer] [Segment] [Tag] [Owner] [+ Add Contact]

[Semua 2.481] [Hot Lead 42] [Follow-up 18] [Customer 926]

┌──────────────────────────────────────────────────────────────┐
│ Customer       Channel   Status    Score  Owner  Last Active│
├──────────────────────────────────────────────────────────────┤
│ Budi Santoso   WhatsApp  Hot Lead   78    Rina   5 menit    │
│ @rianmotor     Instagram Lead       42    Andi   1 jam      │
│ Siti Aminah    WhatsApp  Customer   85    Rina   Kemarin    │
└──────────────────────────────────────────────────────────────┘

Detail:

Budi Santoso
Hot Lead · Score 78 · Owner Rina

[Send Message] [Create Booking] [Create Ticket]
[Create Deal] [Add Task]

Customer Summary
Customer tertarik service CVT untuk Vario 125.
Belum membuat booking. Disarankan follow-up hari ini.

Tags
Service CVT · Hot Lead · WhatsApp

Timeline
10:42  Menanyakan harga service CVT
10:44  AI memberikan estimasi
10:47  Tag Hot Lead ditambahkan