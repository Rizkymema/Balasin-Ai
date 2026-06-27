# Plan Integrasi Automation dan Unified Inbox

## Tujuan

Membuat seluruh fitur pada modul `Automation` benar-benar berfungsi dan terintegrasi dengan `Unified Inbox`, sehingga:

- `Unified Inbox` tetap menjadi pusat operasional percakapan.
- `Automation` menjadi mesin rule yang merespons event dari inbox.
- Semua konfigurasi di halaman automation tidak hanya tersimpan sebagai UI state, tetapi benar-benar memengaruhi runtime aplikasi.

---

## Prinsip Arsitektur

1. `Unified Inbox` adalah source of truth untuk state percakapan.
2. `Automation` adalah orchestration layer untuk trigger, condition, action, delay, dan worker job.
3. Semua event penting dari inbox harus bisa memicu automation.
4. Semua hasil automation harus bisa dilihat kembali dari inbox oleh operator/admin.

---

## Kondisi Saat Ini

### Sudah Berfungsi

- Inbound webhook sudah masuk ke runtime inbox.
- `Knowledge Base` sudah dibaca oleh reply engine AI.
- Aksi inbox seperti reply, update status, notes, dan create ticket sudah punya route dan service backend.
- Worker dasar untuk follow-up, booking reminder, dan broadcast sudah ada.

### Belum Terintegrasi Penuh

- `Automation > Conversations` masih sebatas konfigurasi flow UI.
- `Automation > AI Agents` sudah tersimpan, tetapi runtime inbox masih memakai satu `aiAgent` global.
- `Automation > Chatbot Settings` masih local state dan belum tersimpan ke backend.
- Belum ada orchestration layer yang menghubungkan event inbox ke rule automation.
- Belum ada observability yang cukup untuk melihat flow/agent/job yang aktif dari inbox.

---

## Target Integrasi

Setelah integrasi selesai:

- Pesan baru yang masuk ke inbox akan dipetakan ke flow automation yang aktif.
- Sistem memilih AI agent yang sesuai berdasarkan channel, flow, dan aturan runtime.
- Rule handoff, idle action, follow-up, reminder, API call, dan CRM sync benar-benar berjalan.
- Operator bisa melihat alasan handoff, flow aktif, agent aktif, dan job automation langsung dari inbox.

---

## Plan Implementasi

### Fase 1 - Definisi Kontrak Integrasi

Tujuan:
Membakukan hubungan antara inbox dan automation agar implementasi berikutnya tidak membingungkan.

Pekerjaan:

- Tetapkan `Unified Inbox` sebagai source of truth operasional.
- Tetapkan `Automation` sebagai event-driven rule engine.
- Definisikan event utama yang bisa memicu automation:
  - `message_received`
  - `manual_reply_sent`
  - `conversation_status_changed`
  - `ticket_created`
  - `booking_created`
  - `conversation_resolved`
  - `schedule_reached`

Output:

- Kontrak event internal yang jelas untuk dipakai service backend.

---

### Fase 2 - Rapikan Model Data Runtime

Tujuan:
Menjadikan data automation executable, bukan hanya konfigurasi tampilan.

Pekerjaan:

- Tambahkan field runtime pada conversation:
  - `activeFlowId`
  - `activeAgentId`
  - `aiReplyCount`
  - `lastInboundAt`
  - `lastOutboundAt`
  - `handoffReason`
  - `automationState`
- Tambahkan schema config untuk chatbot settings:
  - `aiConfig`
  - `idleAction`
  - `apiIntegrations`
  - `crmIntegration`
- Pastikan config tersebut tersimpan di persistence layer yang sama dengan dashboard config.

Output:

- Data conversation cukup kaya untuk dibaca automation engine.
- Semua setting automation punya tempat persist yang resmi.

---

### Fase 3 - Buat Automation Orchestrator

Tujuan:
Membuat satu service backend sebagai pusat keputusan automation.

Pekerjaan:

- Tambahkan service baru, misalnya `automation-orchestrator`.
- Service ini menerima event dari:
  - webhook inbound
  - reply manual admin
  - status change inbox
  - ticket creation
  - booking creation/update
  - worker scheduler
- Service menentukan:
  - rule mana yang match
  - AI agent mana yang aktif
  - action apa yang harus dijalankan
  - apakah action sinkron atau masuk queue

Output:

- Satu orchestration layer yang rapi dan mudah dikembangkan.

---

### Fase 4 - Hubungkan Conversations ke Runtime Inbox

Tujuan:
Membuat flow pada `Automation > Conversations` benar-benar mengendalikan perilaku percakapan.

Pekerjaan:

- Ubah flow conversation dari sekadar list konfigurasi menjadi rule runtime.
- Implementasikan trigger minimal:
  - first incoming message
  - keyword match
  - outside office hours
  - customer asks admin
  - complaint or high-risk message
  - booking intent
- Implementasikan action minimal:
  - send message
  - assign admin/agent
  - add tag
  - create ticket
  - create booking
  - pause AI

Output:

- Flow conversation di halaman automation langsung memengaruhi chat di inbox.

---

### Fase 5 - Hubungkan AI Agents ke Runtime

Tujuan:
Membuat AI agent yang dipilih di automation benar-benar dipakai saat menjawab chat.

Pekerjaan:

- Tambahkan pemilihan agent berdasarkan:
  - channel
  - flow
  - status agent
  - allowed actions
- Runtime harus menghormati:
  - `allowedActions`
  - `responseMode`
  - `handover.enabled`
  - `handover.assignTeam`
  - `handover.fallbackMessage`
- Simpan agent aktif ke state conversation.

Output:

- Inbox tidak lagi bergantung pada satu AI global.
- Setiap conversation punya agent aktif yang jelas.

---

### Fase 6 - Aktifkan Chatbot Settings

Tujuan:
Mengubah halaman `Chatbot Settings` dari placeholder UI menjadi konfigurasi runtime sungguhan.

Pekerjaan:

- Persist `AI Configuration` ke backend.
- Persist `Idle Action` ke backend.
- Persist `API Integration` ke backend.
- Persist `CRM Integration` ke backend.
- Terapkan ke runtime:
  - `aiMessageThreshold`
  - `listenTime`
  - `handover target`
  - `handover message`
  - `idle action`
  - `trigger webhook`
  - `CRM sync trigger`

Output:

- Semua tab pada `Chatbot Settings` benar-benar memengaruhi perilaku sistem.

---

### Fase 7 - Jadikan Aksi Inbox sebagai Trigger Automation

Tujuan:
Membuat sinkronisasi dua arah antara inbox dan automation.

Pekerjaan:

- Saat admin mengirim reply manual, trigger automation untuk:
  - mark human active
  - pause AI jika diperlukan
- Saat status conversation berubah:
  - `assigned_to_admin` memicu handoff workflow
  - `waiting_customer` memicu follow-up workflow
  - `resolved` memicu close/CSAT workflow
- Saat ticket dibuat, trigger escalation workflow.
- Saat booking dibuat, trigger reminder workflow.

Output:

- Setiap aksi operasional di inbox punya konsekuensi automation yang konsisten.

---

### Fase 8 - Perluas Worker dan Queue

Tujuan:
Menjalankan automation yang tertunda atau terjadwal secara aman.

Pekerjaan:

- Sempurnakan job:
  - `lead_followup`
  - `handoff_notify`
  - `booking_reminder`
  - `idle_reminder`
  - `auto_close_conversation`
  - `sla_escalation`
  - `crm_sync`
  - `api_call`
  - `webhook_dispatch`
- Pastikan ada dedupe dan retry aman.
- Simpan hasil job untuk debugging dan audit operasional.

Output:

- Automation yang berbasis delay, schedule, dan queue benar-benar siap dipakai.

---

### Fase 9 - Tambahkan Observability di Unified Inbox

Tujuan:
Membuat operator mengerti apa yang sedang terjadi pada sebuah conversation.

Pekerjaan:

- Tampilkan pada detail inbox:
  - flow aktif
  - AI agent aktif
  - alasan handoff
  - rule terakhir yang dijalankan
  - job pending
  - idle countdown
  - log automation singkat

Output:

- Inbox menjadi panel operasional yang transparan, bukan black box.

---

### Fase 10 - QA, Hardening, dan Validasi End-to-End

Tujuan:
Memastikan integrasi stabil dan tidak merusak perilaku inbox yang sudah berjalan.

Pekerjaan:

- Uji end-to-end untuk:
  - WhatsApp inbound
  - Instagram DM inbound
  - Instagram comment inbound
  - Website chat inbound
  - AI auto reply
  - admin takeover
  - follow-up delay
  - booking reminder
  - ticket escalation
  - CRM sync
  - API integration
- Tambahkan fallback aman jika:
  - rule tidak valid
  - config belum lengkap
  - job gagal
  - provider channel gagal mengirim pesan

Output:

- Integrasi production-ready dan aman untuk dioperasikan.

---

## Prioritas Eksekusi

Urutan implementasi yang direkomendasikan:

1. Persist `Chatbot Settings` dan rapikan schema runtime.
2. Buat `automation-orchestrator`.
3. Hubungkan `Conversations` ke runtime inbox.
4. Hubungkan `AI Agents` ke runtime selection.
5. Aktifkan trigger automation dari aksi inbox.
6. Perluas worker untuk idle, reminder, handoff, CRM, dan API.
7. Tambahkan observability pada inbox.
8. Lakukan QA end-to-end.

---

## Deliverable per Fase

### Fase 1

- Kontrak event inbox-automation terdokumentasi.

### Fase 2

- Schema config dan conversation runtime siap dipakai backend.

### Fase 3

- Service orchestrator tersedia dan dipakai oleh route/service terkait.

### Fase 4

- Flow conversation automation aktif di runtime inbox.

### Fase 5

- AI agent selection aktif dan tersimpan di state conversation.

### Fase 6

- Semua tab `Chatbot Settings` persist ke backend dan aktif di runtime.

### Fase 7

- Aksi inbox memicu automation dengan benar.

### Fase 8

- Worker queue menangani follow-up, reminder, escalation, API, dan CRM sync.

### Fase 9

- Inbox menampilkan status automation secara jelas.

### Fase 10

- Skenario QA lulus dan fallback aman terverifikasi.

---

## Acceptance Criteria

Integrasi dianggap selesai jika:

1. Semua setting penting di `Automation` benar-benar memengaruhi perilaku `Unified Inbox`.
2. Setiap pesan baru di inbox bisa dipetakan ke `flow` dan `AI agent` yang aktif.
3. Manual takeover admin menghentikan AI sesuai rule yang dikonfigurasi.
4. Idle action, follow-up, reminder, handoff, dan escalation berjalan lewat worker tanpa duplikasi berbahaya.
5. Operator dapat melihat alasan automation dari tampilan inbox.
6. Integrasi tetap aman walau sebagian config kosong atau provider channel gagal.

---

## Catatan Implementasi

- Jangan ubah kontrak inbox yang sudah stabil secara sembarangan.
- Pisahkan logic orchestration dari komponen UI.
- Semua config sensitif tetap memakai env/config persistence yang aman.
- Prioritaskan integrasi bertahap agar tidak merusak webhook dan runtime inbox yang sudah aktif.
