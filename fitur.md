Blueprint Final Dashboard AI Omnichannel CRM
1. Dashboard Overview

Ini halaman utama setelah login.

Fitur:

Fitur	Fungsi
Total Chat Masuk	Jumlah chat dari WhatsApp, IG DM, IG Comment, Telegram, Website
Chat Aktif	Chat yang belum selesai
Chat Pending	Chat yang menunggu admin
Chat AI Terjawab	Jumlah chat yang berhasil dijawab AI
Chat Handoff	Chat yang diteruskan ke manusia
Total Lead	Customer yang berpotensi beli/booking
Total Booking	Booking servis/produk
Total Komplain	Tiket komplain aktif
Response Time	Rata-rata waktu balas admin/AI
Conversion Rate	Chat menjadi booking/order
CSAT	Nilai kepuasan customer

Contoh card dashboard:

Total Chat Hari Ini: 382
AI Resolved: 246
Need Admin: 41
Booking Masuk: 23
Komplain Aktif: 7
Average Response Time: 12 detik
2. Unified Inbox / Omnichannel Inbox

Ini fitur paling penting. Semua pesan dari banyak channel masuk ke satu tempat. Qontak memang punya konsep omnichannel dashboard untuk mengelola berbagai channel seperti WhatsApp, Instagram, Shopee, Tokopedia, dan channel lain dari satu dashboard.

Channel yang perlu kamu dukung
Channel	Status Prioritas
WhatsApp Business API	Wajib
Instagram DM	Wajib
Instagram Comment	Wajib
Facebook Messenger	Opsional
Telegram Bot	Wajib untuk sistem kamu
Website Live Chat	Wajib
Email	Opsional
Shopee/Tokopedia Chat	Advanced
Manual Input Admin	Wajib
Fitur Inbox
Fitur	Fungsi
Semua chat satu layar	Admin tidak perlu buka banyak aplikasi
Filter by channel	WA, IG, Telegram, Website
Filter by status	Open, Pending, Assigned, Resolved
Filter by intent	Booking, Produk, Komplain, FAQ, Spam
Assign ke admin	Chat bisa diarahkan ke admin tertentu
Internal notes	Catatan internal yang tidak terlihat customer
Customer profile sidebar	Data customer tampil di kanan
Chat history	Riwayat semua percakapan
AI suggestion reply	AI bantu rekomendasikan balasan
Manual takeover	Admin ambil alih dari AI
Resolve chat	Tandai chat selesai
Reopen chat	Buka ulang chat lama
Status Chat
NEW
AI_HANDLING
WAITING_CUSTOMER
WAITING_ADMIN
ASSIGNED_TO_AGENT
HUMAN_TAKEOVER
RESOLVED
SPAM
DELETED
3. AI Chatbot & Intent Classification

Qontak memiliki fitur AI chatbot dan chatbot dapat terhubung ke API untuk mengambil, menyimpan, atau mengirim data dari sistem client.

Fitur AI yang wajib ada
Fitur	Fungsi
Intent Classification	AI membaca maksud pesan
Auto Reply	AI membalas otomatis
Confidence Score	Nilai keyakinan AI
Knowledge Base Search	AI mencari data dari KB
Product Search	AI mencari produk/sparepart
Booking Assistant	AI bantu proses booking
Complaint Detection	AI deteksi komplain
Spam Detection	AI deteksi komentar sampah
Sentiment Analysis	Positif, netral, negatif
Human Handoff	Kalau AI tidak yakin, teruskan ke admin
Intent utama untuk Johan Garage
BOOKING_SERVICE
PRODUCT_INQUIRY
SPAREPART_STOCK
PRICE_INQUIRY
TECHNICAL_PROBLEM
FAQ_LOCATION
FAQ_OPEN_HOURS
PROMO_INQUIRY
COMPLAINT
NEGATIVE_COMMENT
SPAM
UNKNOWN
Logic aman AI
Jika confidence >= 0.80:
    AI boleh jawab otomatis

Jika confidence 0.50 - 0.79:
    AI kasih jawaban aman + tawarkan admin

Jika confidence < 0.50:
    Jangan jawab teknis
    Teruskan ke admin

Jika pertanyaan menyangkut kerusakan serius:
    Beri estimasi umum
    Sarankan cek langsung ke bengkel

Jika data produk/harga tidak ditemukan:
    Jangan mengarang
    Teruskan ke admin
4. Chatbot Flow Builder

Ini fitur untuk membuat alur chatbot seperti menu, pertanyaan, form, dan routing. Qontak juga mendukung penggunaan WhatsApp Flow dalam chatbot, yaitu form interaktif di dalam percakapan WhatsApp.

Fitur Flow Builder
Fitur	Fungsi
Drag & drop flow	Buat alur chatbot tanpa coding
Trigger node	Pesan masuk, keyword, channel, jam kerja
Message node	Kirim teks/gambar/link
Question node	Tanya data customer
Condition node	Jika A maka ke flow B
AI node	AI klasifikasi intent
API node	Ambil data dari database/API
Google Sheets node	Simpan data ke Sheets
PostgreSQL node	Ambil data produk/booking
Handoff node	Teruskan ke admin
Delay node	Tunggu beberapa menit/jam
Resolve node	Tutup chat otomatis
Contoh flow booking
Customer: mau booking servis
↓
AI Classification: BOOKING_SERVICE
↓
Bot tanya:
- Nama
- Tipe motor
- Keluhan
- Tanggal booking
- Jam booking
↓
Cek slot booking
↓
Simpan ke database
↓
Kirim konfirmasi ke customer
↓
Assign ke Admin Servis
5. Human Handoff & Agent Management

Qontak punya fitur agent allocation, termasuk pengaturan apakah agent boleh mengambil chat yang belum assigned.

Fitur Agent Management
Fitur	Fungsi
Assign chat manual	Owner/admin assign chat ke agent
Auto assign	Sistem bagi chat otomatis
Round robin	Chat dibagi merata ke admin
Skill-based routing	Chat teknis ke mekanik, order ke sales
Manual takeover	Admin ambil alih dari AI
Agent status	Online, busy, offline
Agent performance	Jumlah chat, response time, resolved
Internal note	Catatan antar admin
Mention admin	Tag admin tertentu
Escalation	Naikkan ke supervisor/owner
Status admin
ONLINE
BUSY
BREAK
OFFLINE
Routing yang cocok untuk dashboard kamu
Intent	Route
Booking servis	Admin Servis
Produk/sparepart	Admin Sales
Keluhan teknis	Mekanik/Admin Teknis
Komplain	Supervisor/Owner
Spam/negatif	Auto hide/delete/review
Unknown	Admin utama
6. Customer Profile / CRM

Qontak memiliki fitur CRM untuk manajemen database customer, sales pipeline, dan data customer secara terpusat.

Data customer yang perlu disimpan
Data	Contoh
Nama	Andi
Nomor WhatsApp	628xxxx
Username IG	@andi_motor
Channel asal	Instagram Comment
Lokasi	Bekasi
Tipe motor	Vario 150
Minat	Bore up, CVT, oli
Riwayat chat	Semua percakapan
Riwayat booking	Pernah servis tanggal sekian
Status customer	New lead, active, repeat, lost
Tags	VIP, komplain, hot lead
Last interaction	Tanggal terakhir chat
Customer status
NEW_LEAD
PROSPECT
ACTIVE_CUSTOMER
REPEAT_CUSTOMER
VIP
COMPLAINT_CUSTOMER
LOST
BLOCKED
7. Ticketing / Customer Service

Qontak memiliki fitur Tickets untuk membantu agent melacak masalah customer dalam proses customer service.

Fitur ticketing
Fitur	Fungsi
Buat ticket dari chat	Chat komplain jadi tiket
Ticket priority	Low, Medium, High, Urgent
Ticket category	Komplain, garansi, refund, teknis
Assign ticket	Ke admin/mekanik tertentu
SLA timer	Batas waktu penanganan
Status ticket	Open, In Progress, Waiting, Solved
Attachment	Foto motor, bukti transfer, invoice
Internal discussion	Diskusi tim
Resolution note	Catatan penyelesaian
Reopen ticket	Buka ulang jika belum selesai
Status ticket
OPEN
IN_PROGRESS
WAITING_CUSTOMER
WAITING_INTERNAL
SOLVED
CLOSED
REOPENED
8. Broadcast & Campaign Management

Qontak memiliki fitur Broadcast untuk mengirim pesan ke banyak kontak sekaligus, misalnya promo, reminder, dan campaign.

Fitur broadcast
Fitur	Fungsi
Broadcast WhatsApp	Kirim pesan massal
Broadcast IG DM	Jika API memungkinkan
Segment audience	Pilih customer berdasarkan tag
Template message	Pesan promo siap pakai
Schedule campaign	Kirim otomatis sesuai jadwal
Campaign analytics	Delivered, read, replied, failed
Follow-up otomatis	Jika customer belum balas
A/B testing	Coba 2 versi pesan
Opt-out management	Customer bisa berhenti menerima promo
Segmentasi campaign
Customer pernah servis
Customer tanya bore up
Customer tanya CVT
Customer belum booking
Customer komplain
Customer repeat order
Customer dari IG
Customer dari WhatsApp
9. WhatsApp API Management

Qontak menyediakan WhatsApp API resmi dan integrasi WhatsApp Business API melalui menu channel integration.

Fitur WhatsApp API
Fitur	Fungsi
Connect WABA	Hubungkan WhatsApp Business API
Template message	Buat template WhatsApp
Template approval status	Pending, approved, rejected
Session message	Balas dalam 24 jam
Media message	Gambar, dokumen, video
Button message	Tombol cepat
List message	Pilihan menu
WhatsApp Flow/Form	Form booking/order
Webhook status	Delivered, read, failed
Balance/usage tracking	Pantau biaya pesan
Template wajib
booking_confirmation
booking_reminder
service_followup
promo_broadcast
order_confirmation
complaint_received
admin_handoff
10. Instagram DM & Comment Management

Qontak memiliki integrasi Instagram, termasuk fitur comment integration melalui menu Channel Integration.

Fitur Instagram
Fitur	Fungsi
IG DM inbox	Semua DM masuk dashboard
IG Comment inbox	Komentar masuk dashboard
Auto reply comment	Balas komentar otomatis
Comment moderation	Hide/delete komentar negatif
Negative keyword filter	Deteksi kata kasar/spam
Mention detection	Deteksi mention brand
Post context	AI paham konten postingan
DM follow-up	Komentar diarahkan ke DM
Comment to lead	Komentar minat jadi lead
Logic komentar negatif
Jika komentar mengandung kata kasar:
    Hide comment
    Simpan ke moderation log

Jika komentar menuduh/komplain:
    Jangan hapus otomatis
    Buat ticket komplain
    Assign ke admin

Jika komentar spam/link:
    Hide/Delete
    Tambahkan ke blacklist

Jika komentar pertanyaan normal:
    AI boleh balas
11. Knowledge Base Management

Ini bagian penting agar AI tidak asal jawab.

Fitur knowledge base
Fitur	Fungsi
Upload dokumen	PDF, DOCX, TXT, CSV
Manual article	Tulis artikel KB
FAQ builder	Buat pertanyaan-jawaban
Category	Layanan, produk, teknis, harga
Versioning	Riwayat perubahan KB
Approval	Artikel harus disetujui owner
Search	Cari isi KB
AI retrieval	AI mengambil jawaban dari KB
Source citation internal	AI tahu sumber jawabannya
Expired article	Tandai data lama/tidak valid
KB wajib untuk Johan Garage
Alamat bengkel
Jam operasional
Link booking
Daftar layanan
Daftar harga
Produk/sparepart
FAQ umum
SOP booking
SOP komplain
Diagnosa ringan motor
Kebijakan garansi
Metode pembayaran
Promo aktif
12. Product, Sparepart & Service Catalog

Karena project kamu untuk bengkel/omnichannel, ini wajib ada.

Fitur katalog
Fitur	Fungsi
Data produk	Oli, ban, aki, busi, sparepart
Data jasa	Servis CVT, tune up, bore up
Harga	Harga produk/jasa
Stok	Available, low stock, kosong
Kategori	Oli, CVT, mesin, ban
Kompatibilitas motor	Cocok untuk Beat, Vario, Aerox
Foto produk	Gambar produk
Deskripsi	Penjelasan singkat
Supplier	Data supplier
Margin	Harga modal dan jual
AI product lookup	AI cari produk otomatis
Status stok
IN_STOCK
LOW_STOCK
OUT_OF_STOCK
PRE_ORDER
DISCONTINUED
13. Booking Management

Ini fitur yang Qontak tidak spesifik untuk bengkel, tapi dashboard kamu perlu punya agar lebih unggul.

Fitur booking
Fitur	Fungsi
Booking service	Customer pilih jadwal
Calendar view	Tampilan kalender booking
Slot management	Atur jam tersedia
Mechanic assignment	Assign ke mekanik
Booking status	Pending, confirmed, done
Reminder otomatis	H-1 atau beberapa jam sebelum datang
Reschedule	Ubah jadwal
Cancel booking	Batalkan booking
Payment status	Belum bayar, DP, lunas
Follow-up otomatis	Setelah servis selesai
Status booking
REQUESTED
CONFIRMED
RESCHEDULED
IN_PROGRESS
DONE
CANCELLED
NO_SHOW
14. Automation Workflow

Qontak memiliki area operation & workflow automation.

Fitur automation
Fitur	Fungsi
Trigger automation	Pesan masuk, booking dibuat, ticket open
Condition	Jika channel = IG, jika intent = komplain
Action	Kirim pesan, assign admin, buat ticket
Delay	Tunggu 1 jam/1 hari
Webhook	Kirim data ke sistem lain
Google Sheets integration	Simpan lead/booking
PostgreSQL integration	Ambil/simpan data
Notification	Kirim notif Telegram/Email
Retry failed action	Ulang jika gagal
Error log	Catat error automation
Contoh automation
Trigger:
Customer komentar "harga berapa?"

Process:
AI klasifikasi sebagai PRICE_INQUIRY
Cari produk/jasa di database
Jika data ada → balas otomatis
Jika data tidak ada → assign admin

Output:
Komentar/DM terbalas + lead tersimpan
15. API, Webhook & Integration Center

Qontak mendukung integrasi API pada chatbot untuk mengambil, menyimpan, atau mengirim data ke sistem client.

Fitur integrasi
Fitur	Fungsi
API Key management	Buat token API
Webhook incoming	Terima data dari channel
Webhook outgoing	Kirim data ke sistem lain
n8n integration	Hubungkan ke workflow n8n
Google Sheets	Simpan lead/booking
PostgreSQL	Database utama
Supabase	Opsional backend cepat
Payment gateway	Midtrans/Xendit
Google Calendar	Jadwal booking
Telegram notification	Notif ke owner/admin
OpenAI/OpenRouter	AI response
Meta Graph API	WA/IG integration
16. Notification Center

Qontak memiliki fitur notification untuk chat baru, customer reply, assigned chat, dan resolved chat.

Fitur notifikasi
Fitur	Fungsi
New chat notification	Ada chat masuk
Assigned chat notification	Chat diberikan ke admin
Customer reply	Customer membalas
Ticket urgent	Ada komplain penting
Booking reminder	Booking mendekati jadwal
Failed automation	Workflow error
Broadcast failed	Campaign gagal terkirim
Daily report	Ringkasan harian
Channel notifikasi
Dashboard notification
Email
Telegram
WhatsApp internal admin
Browser push notification
17. Analytics & Reporting

Qontak memiliki fitur real-time reporting untuk memantau performa bisnis, broadcast, dan operasional customer engagement.

Report wajib
Report	Isi
Chat report	Total chat, channel, status
Agent report	Performa admin
AI report	Akurasi AI, fallback, handoff
Booking report	Total booking, no-show, selesai
Sales report	Lead, deal, closing
Campaign report	Delivered, read, replied
Ticket report	Komplain, SLA, solved
Product inquiry report	Produk paling sering ditanya
Channel report	WA vs IG vs Telegram
Response time report	Waktu respon AI/admin
Metric penting
Total Conversations
Open Conversations
Resolved Conversations
AI Resolution Rate
Human Handoff Rate
Average First Response Time
Average Resolution Time
Lead Conversion Rate
Booking Conversion Rate
Customer Satisfaction Score
Broadcast Delivery Rate
Broadcast Reply Rate
18. Package Usage / Billing Usage

Qontak memiliki menu Package Usage untuk melihat penggunaan conversation, top-up, dan balance tertentu.

Untuk dashboard kamu, fitur ini berguna untuk SaaS multi-user.

Fitur usage
Fitur	Fungsi
Total chat usage	Jumlah chat per bulan
AI token usage	Pemakaian token AI
WhatsApp cost usage	Biaya pesan WA
Broadcast usage	Jumlah broadcast
Storage usage	File/media yang tersimpan
Plan limit	Limit paket user
Top-up balance	Tambah saldo
Invoice	Tagihan
Payment history	Riwayat pembayaran
19. Admin, Role & Permission
Role wajib
Role	Akses
Owner	Semua akses
Admin Manager	Inbox, agent, report
Agent CS	Balas chat dan ticket
Sales	Lead, deal, broadcast terbatas
Mekanik/Teknis	Lihat ticket teknis
Marketing	Campaign dan broadcast
Viewer	Hanya lihat report
Permission detail
can_view_inbox
can_reply_chat
can_takeover_ai
can_delete_comment
can_create_broadcast
can_manage_agent
can_manage_kb
can_view_report
can_manage_billing
can_manage_integration
20. Security, Audit Log & Compliance
Fitur security
Fitur	Fungsi
Login secure	Email/password atau OAuth
2FA	Keamanan tambahan
Role-based access	Hak akses per role
Audit log	Catat semua aktivitas
Data masking	Sembunyikan nomor/email sensitif
API key rotation	Ganti token API
Webhook signature	Validasi webhook
Rate limit	Cegah abuse
Spam protection	Anti spam
Backup database	Cadangan data
Export data	Ekspor customer/chat
Delete customer data	Hapus data jika diminta
Struktur Menu Sidebar Final

Ini struktur dashboard yang bisa langsung kamu pakai:

1. Dashboard
2. Inbox
   - All Conversations
   - WhatsApp
   - Instagram DM
   - Instagram Comments
   - Telegram
   - Website Chat
   - Assigned to Me
   - Pending Admin
   - Resolved

3. AI Assistant
   - Intent Settings
   - AI Prompt
   - Knowledge Base
   - AI Logs
   - Fallback Rules
   - Test Playground

4. Chatbot Builder
   - Flow Builder
   - Conversation Flow
   - WhatsApp Flow/Form
   - Auto Reply Rules
   - Keyword Rules

5. Contacts / CRM
   - Customers
   - Segments
   - Tags
   - Customer Timeline
   - Import/Export

6. Tickets
   - All Tickets
   - Complaint
   - Technical Issue
   - Warranty
   - SLA Monitor

7. Sales Pipeline
   - Leads
   - Deals
   - Follow-up
   - Tasks
   - Closing Report

8. Booking
   - Calendar
   - Booking List
   - Slot Settings
   - Mechanic Assignment
   - Reminder

9. Products & Services
   - Product Catalog
   - Sparepart Stock
   - Service Catalog
   - Price List
   - Compatibility Motor

10. Broadcast / Campaign
    - Create Campaign
    - WhatsApp Broadcast
    - Segment Audience
    - Templates
    - Campaign Report

11. Automation
    - Workflow Builder
    - Triggers
    - Actions
    - Webhooks
    - Error Logs

12. Channels
    - WhatsApp API
    - Instagram
    - Telegram
    - Website Chat
    - Email
    - Marketplace

13. Reports
    - Chat Report
    - Agent Report
    - AI Report
    - Ticket Report
    - Sales Report
    - Campaign Report
    - Booking Report

14. Team
    - Agents
    - Roles
    - Permissions
    - Agent Allocation

15. Settings
    - Business Profile
    - Operating Hours
    - Templates
    - Notifications
    - API Keys
    - Billing / Usage
    - Security
Database Table Final

Minimal table yang perlu kamu siapkan:

users
roles
permissions
workspaces
channels
conversations
messages
customers
customer_tags
agents
agent_status
conversation_assignments
ai_logs
ai_intents
knowledge_base
knowledge_documents
products
services
stock_items
bookings
tickets
ticket_comments
broadcast_campaigns
broadcast_recipients
message_templates
automation_workflows
automation_logs
webhook_logs
notifications
audit_logs
usage_logs
billing_plans
api_keys
Prioritas Development
MVP — Versi 1

Ini yang harus kamu buat dulu.

Dashboard
Unified Inbox
WhatsApp Integration
Instagram DM/Comment Integration
AI Intent Classification
AI Auto Reply
Human Handoff
Customer CRM
Knowledge Base
Booking Management
Product/Service Catalog
Ticketing
Basic Broadcast
Basic Report
Role Admin/Agent
Versi 2
Flow Builder
Automation Builder
Advanced Broadcast
Agent Allocation
SLA Ticketing
AI Reply Suggestion
AI Sentiment Analysis
AI Spam Detection
Google Sheets Integration
Telegram Notification
Campaign Analytics
Versi 3
Marketplace Chat
Call Center
Payment Integration
Advanced Sales Pipeline
Multi-workspace SaaS
Billing Usage
AI Training Dashboard
A/B Testing Campaign
Advanced Security
Mobile App
Fitur Pembeda agar Lebih Bagus dari Qontak

Supaya dashboard kamu bukan cuma “mirip Qontak”, tapi bisa lebih menarik:

Fitur Pembeda	Nilai Lebih
AI Confidence Score	Admin tahu AI yakin atau tidak
AI Reason Log	Lihat alasan AI menjawab
Prompt Control Panel	Owner bisa edit prompt tanpa coding
Knowledge Gap Detection	Sistem tahu pertanyaan yang belum ada jawabannya
Auto KB Suggestion	AI menyarankan artikel KB baru
Comment Moderation AI	Komentar negatif bisa di-hide otomatis
Post Context AI	AI paham konteks postingan Instagram
Admin Training Mode	Jawaban admin dipelajari untuk perbaikan AI
Service Motor Diagnosis Flow	Khusus bengkel, lebih tajam dari CRM umum
Booking + Sparepart + Mekanik	Cocok untuk bengkel, bukan hanya chat
Kesimpulan Final

Agar dashboard kamu setara seperti Qontak, bangun dengan konsep ini:

Omnichannel Inbox
+ AI Chatbot
+ Human Handoff
+ CRM Customer
+ Ticketing
+ Broadcast Campaign
+ Booking
+ Product/Service Catalog
+ Automation Workflow
+ Analytics
+ Role & Permission
+ API/Webhook Integration