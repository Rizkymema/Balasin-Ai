# PLAN FITUR: Inbox

## Modul: Settings > Inbox

## 1. Tujuan Fitur

Fitur **Inbox** pada halaman Settings berfungsi sebagai pusat konfigurasi operasional percakapan pelanggan.

Melalui menu ini, user dapat mengatur:

* Pesan balasan otomatis.
* Jam operasional bisnis.
* Template atau quick replies.
* Tag kategori percakapan.
* Aturan customer idle.
* Auto close conversation.
* Standarisasi respons agen.
* Kerapian antrean percakapan.

Fitur ini membantu tim customer service, sales, admin, atau mekanik agar dapat menangani chat pelanggan dengan lebih cepat, konsisten, dan terstruktur.

---

## 2. Lokasi Menu

Menu ini berada di:

```txt id="lm7k91"
Settings > Inbox
```

Struktur halaman menggunakan tab navigation di bagian atas panel utama.

---

## 3. Struktur Tab Inbox

Buat 5 tab utama:

```txt id="ep3p2e"
Auto Responder
Office Hours
Templates
Tags
Customer Idle
```

Setiap tab memiliki fungsi berbeda, tetapi semuanya berkaitan dengan pengaturan operasional inbox.

---

# 4. Auto Responder

## 4.1 Tujuan

Tab **Auto Responder** digunakan untuk mengatur pesan balasan otomatis yang dikirim sistem sebelum percakapan ditangani oleh agen.

Fitur ini berguna untuk:

* Menyambut pelanggan baru.
* Memberikan respons instan saat pesan masuk.
* Memberi tahu pelanggan saat admin sedang sibuk.
* Memberi tahu pelanggan saat bisnis di luar jam kerja.
* Mengurangi waktu tunggu awal pelanggan.

---

## 4.2 Fitur Utama

User dapat:

```txt id="v8zqbm"
Membuat auto responder baru
Mengedit auto responder
Menghapus auto responder
Mengaktifkan atau menonaktifkan auto responder
Memilih channel
Memilih trigger
Mengatur delay sebelum pesan dikirim
Menulis isi pesan otomatis
```

---

## 4.3 Field Auto Responder

```txt id="wjx70i"
Responder Name
Responder Type
Channel
Trigger
Message Content
Delay Before Send
Status
```

---

## 4.4 Responder Type

Pilihan tipe auto responder:

```txt id="gz13eq"
Greeting Message
Away Message
Outside Office Hours Message
Busy Agent Message
Queue Waiting Message
Conversation Closed Message
```

---

## 4.5 Trigger Auto Responder

Pilihan trigger:

```txt id="ks5f7s"
First incoming message
Every new conversation
Outside office hours
All agents busy
All agents offline
Customer enters queue
Conversation resolved
```

---

## 4.6 Contoh Auto Responder

### Greeting Message

```txt id="g5gy56"
Halo kak, selamat datang di Johan Garage. Pesan kakak sudah kami terima. Ada yang bisa kami bantu?
```

### Away Message

```txt id="vjca5j"
Mohon maaf kak, admin sedang tidak tersedia saat ini. Pesan kakak akan kami balas secepatnya.
```

### Outside Office Hours Message

```txt id="sv4rxk"
Mohon maaf kak, saat ini kami sedang di luar jam operasional. Kami akan membalas pesan kakak saat jam kerja aktif kembali.
```

---

# 5. Office Hours

## 5.1 Tujuan

Tab **Office Hours** digunakan untuk mengatur jadwal operasional bisnis.

Sistem menggunakan jadwal ini untuk mengetahui kapan bisnis sedang aktif dan kapan bisnis sedang offline.

Office Hours dapat dihubungkan dengan Auto Responder agar sistem mengirim pesan otomatis ketika pelanggan menghubungi di luar jam kerja.

---

## 5.2 Fitur Utama

User dapat:

```txt id="uu6yox"
Mengaktifkan office hours
Memilih timezone
Mengatur hari kerja
Mengatur jam buka dan jam tutup
Menambahkan waktu istirahat
Menambahkan jadwal libur khusus
Mengatur pesan di luar jam kerja
```

---

## 5.3 Field Office Hours

```txt id="tvdd3w"
Enable Office Hours
Timezone
Working Days
Start Time
End Time
Break Time
Holiday Schedule
Outside Hours Message
```

---

## 5.4 Contoh Jadwal Operasional

```txt id="r1iyzt"
Senin - Jumat: 08:00 - 17:00
Sabtu: 09:00 - 15:00
Minggu: Tutup
Timezone: Asia/Jakarta
```

---

## 5.5 Contoh Outside Hours Message

```txt id="d3kgxo"
Mohon maaf kak, Johan Garage sedang di luar jam operasional. Kami buka kembali besok pukul 08:00 WIB.
```

---

# 6. Templates

## 6.1 Tujuan

Tab **Templates** digunakan untuk membuat, menyimpan, dan mengelola pesan standar yang dapat digunakan ulang oleh agen.

Templates membantu agen menjawab pertanyaan pelanggan lebih cepat tanpa harus mengetik ulang pesan yang sama.

---

## 6.2 Fitur Utama

User dapat:

```txt id="g6q2tf"
Membuat template baru
Mengedit template
Menghapus template
Mengatur kategori template
Mengatur channel template
Menggunakan variable dinamis
Melihat status template
Menggunakan template sebagai quick reply
```

---

## 6.3 Field Templates

```txt id="m0t3cm"
Template Name
Category
Channel
Language
Message Body
Variables
Approval Status
Status
```

---

## 6.4 Kategori Template

```txt id="lmqd4d"
Greeting
FAQ
Booking
Payment
Service Update
Complaint
Follow Up
Reminder
Promotion
Closing
```

---

## 6.5 Variable Dinamis

Template harus mendukung variable agar pesan bisa otomatis menyesuaikan data pelanggan.

Contoh variable:

```txt id="a6iawc"
{{customer_name}}
{{agent_name}}
{{service_date}}
{{booking_code}}
{{invoice_number}}
{{estimated_finish}}
```

---

## 6.6 Contoh Template

### Booking Confirmation

```txt id="qgmj77"
Halo kak {{customer_name}}, booking servis kakak sudah kami terima untuk tanggal {{service_date}}. Kode booking: {{booking_code}}.
```

### Service Update

```txt id="p9nwgp"
Halo kak {{customer_name}}, motor kakak sedang dalam proses pengecekan. Estimasi selesai: {{estimated_finish}}.
```

### Closing Message

```txt id="vmnzm6"
Terima kasih sudah menghubungi kami. Jika ada pertanyaan lain, silakan hubungi kembali kapan saja.
```

---

## 6.7 Status Template

Gunakan status berikut:

```txt id="ic466i"
Draft
Pending Approval
Approved
Rejected
Inactive
```

---

# 7. Tags

## 7.1 Tujuan

Tab **Tags** digunakan untuk membuat label atau kategori yang dapat disematkan pada chat, pelanggan, atau tiket.

Tags membantu tim melakukan filter, pelaporan, dan analisis tren percakapan.

---

## 7.2 Fitur Utama

User dapat:

```txt id="e3v35e"
Membuat tag baru
Mengedit tag
Menghapus tag
Memilih warna tag
Mengatur kategori tag
Mengatur visibility tag
Menggunakan tag pada chat pelanggan
```

---

## 7.3 Field Tags

```txt id="l3ww7h"
Tag Name
Tag Color
Category
Description
Visibility
Status
```

---

## 7.4 Contoh Tags

```txt id="p5w4uh"
Komplain
Tanya Harga
Booking Servis
VIP Customer
Butuh Mekanik
Follow Up
Pembayaran
Garansi
Sparepart
Bug Report
```

---

## 7.5 Kategori Tags

```txt id="kyeel7"
Sales
Support
Service
Complaint
Payment
Technical
Priority
Internal
```

---

## 7.6 Visibility Tags

Pilihan visibility:

```txt id="fn7j3c"
All agents
Specific division
Supervisor only
Admin only
```

---

# 8. Customer Idle

## 8.1 Tujuan

Tab **Customer Idle** digunakan untuk mengatur otomatisasi ketika pelanggan tidak merespons dalam waktu tertentu.

Fitur ini berguna untuk menjaga antrean chat tetap bersih dan mencegah percakapan menggantung terlalu lama di inbox agen.

---

## 8.2 Fitur Utama

User dapat:

```txt id="e4bw5f"
Mengaktifkan customer idle rule
Mengatur durasi idle
Mengirim reminder otomatis
Menutup percakapan otomatis
Menambahkan tag setelah idle
Mengubah status percakapan
Mengurangi workload agen
```

---

## 8.3 Field Customer Idle

```txt id="z8hxve"
Enable Customer Idle
Idle Duration
Reminder Message
Reminder Delay
Auto Resolve
Resolve Status
Add Tag After Idle
Apply To Channel
```

---

## 8.4 Contoh Customer Idle Logic

```txt id="khx95k"
Jika pelanggan tidak membalas selama 24 jam:
  Sistem mengirim reminder message.

Jika pelanggan tetap tidak membalas setelah 1 jam:
  Sistem mengubah status conversation menjadi Resolved.
  Sistem menambahkan tag Customer Idle.
  Sistem mengurangi workload aktif agen.
```

---

## 8.5 Contoh Reminder Message

```txt id="vheq8l"
Halo kak, apakah masih membutuhkan bantuan? Jika tidak ada balasan, percakapan ini akan kami tutup otomatis.
```

---

# 9. Langkah Konfigurasi

## 9.1 Cara Membuka Menu Inbox

1. Masuk ke halaman **Settings**.
2. Pilih menu **Inbox** pada sidebar kiri.
3. Pada panel utama sebelah kanan, pilih tab yang ingin dikonfigurasi.

---

## 9.2 Konfigurasi Auto Responder

1. Buka tab **Auto Responder**.
2. Klik **Create Auto Responder**.
3. Pilih tipe pesan, seperti Greeting Message atau Away Message.
4. Pilih channel.
5. Pilih trigger.
6. Tulis isi pesan otomatis.
7. Atur delay jika diperlukan.
8. Klik **Save**.

---

## 9.3 Konfigurasi Office Hours

1. Buka tab **Office Hours**.
2. Aktifkan Office Hours.
3. Pilih timezone.
4. Tentukan hari kerja.
5. Atur jam buka dan jam tutup.
6. Tulis pesan di luar jam kerja.
7. Klik **Save Settings**.

---

## 9.4 Konfigurasi Templates

1. Buka tab **Templates**.
2. Klik **Create Template**.
3. Isi nama template.
4. Pilih kategori.
5. Pilih channel.
6. Tulis isi pesan.
7. Tambahkan variable jika diperlukan.
8. Simpan sebagai Draft atau aktifkan template.

---

## 9.5 Konfigurasi Tags

1. Buka tab **Tags**.
2. Klik **Create Tag**.
3. Isi nama tag.
4. Pilih warna tag.
5. Pilih kategori.
6. Atur visibility.
7. Klik **Save**.

---

## 9.6 Konfigurasi Customer Idle

1. Buka tab **Customer Idle**.
2. Aktifkan customer idle rule.
3. Tentukan durasi idle.
4. Tulis reminder message.
5. Aktifkan auto resolve jika diperlukan.
6. Pilih tag yang akan ditambahkan setelah idle.
7. Klik **Save Settings**.

---

# 10. Data Dummy Awal

Gunakan data dummy berikut untuk tampilan awal:

```ts id="fpk0ak"
const inboxSettings = {
  autoResponders: [
    {
      id: "responder_001",
      name: "Greeting Message",
      type: "Greeting Message",
      channel: "WhatsApp",
      trigger: "First incoming message",
      message: "Halo kak, selamat datang di Johan Garage. Ada yang bisa kami bantu?",
      delaySeconds: 1,
      status: "Active",
    },
    {
      id: "responder_002",
      name: "Outside Office Hours",
      type: "Outside Office Hours Message",
      channel: "WhatsApp",
      trigger: "Outside office hours",
      message: "Mohon maaf kak, saat ini kami sedang di luar jam operasional.",
      delaySeconds: 2,
      status: "Active",
    },
  ],

  officeHours: {
    enabled: true,
    timezone: "Asia/Jakarta",
    workingDays: [
      { day: "Monday", enabled: true, startTime: "08:00", endTime: "17:00" },
      { day: "Tuesday", enabled: true, startTime: "08:00", endTime: "17:00" },
      { day: "Wednesday", enabled: true, startTime: "08:00", endTime: "17:00" },
      { day: "Thursday", enabled: true, startTime: "08:00", endTime: "17:00" },
      { day: "Friday", enabled: true, startTime: "08:00", endTime: "17:00" },
      { day: "Saturday", enabled: true, startTime: "09:00", endTime: "15:00" },
      { day: "Sunday", enabled: false, startTime: null, endTime: null },
    ],
    outsideHoursMessage:
      "Mohon maaf kak, kami sedang di luar jam operasional. Kami akan membalas saat buka kembali.",
  },

  templates: [
    {
      id: "template_001",
      name: "Booking Confirmation",
      category: "Booking",
      channel: "WhatsApp",
      language: "Indonesian",
      body: "Halo kak {{customer_name}}, booking servis kakak sudah kami terima untuk tanggal {{service_date}}.",
      variables: ["customer_name", "service_date"],
      approvalStatus: "Approved",
      status: "Active",
    },
  ],

  tags: [
    {
      id: "tag_001",
      name: "Tanya Harga",
      color: "blue",
      category: "Sales",
      visibility: "All agents",
      status: "Active",
    },
    {
      id: "tag_002",
      name: "Komplain",
      color: "red",
      category: "Complaint",
      visibility: "Supervisor only",
      status: "Active",
    },
    {
      id: "tag_003",
      name: "Booking Servis",
      color: "green",
      category: "Service",
      visibility: "All agents",
      status: "Active",
    },
  ],

  customerIdle: {
    enabled: true,
    idleDuration: 24,
    idleDurationUnit: "hours",
    reminderEnabled: true,
    reminderDelay: 1,
    reminderDelayUnit: "hours",
    reminderMessage:
      "Halo kak, apakah masih membutuhkan bantuan? Jika tidak ada balasan, percakapan ini akan kami tutup otomatis.",
    autoResolve: true,
    resolveStatus: "Resolved",
    addTagAfterIdle: "Customer Idle",
    applyToChannel: ["WhatsApp", "Instagram DM", "Website Chat"],
  },
};
```

---

# 11. Komponen yang Perlu Dibuat

Buat komponen berikut:

```txt id="togemq"
InboxSettingsPage
InboxSettingsTabs
AutoResponderPanel
AutoResponderTable
CreateAutoResponderModal
EditAutoResponderModal
OfficeHoursPanel
WorkingDaysScheduler
HolidaySchedulePanel
TemplatesPanel
TemplatesTable
CreateTemplateModal
EditTemplateModal
TemplateVariableBuilder
TagsPanel
TagsTable
CreateTagModal
EditTagModal
TagColorPicker
CustomerIdlePanel
CustomerIdleRuleForm
SaveSettingsButton
ResetSettingsButton
SettingsStatusBadge
ConfirmationModal
```

---

# 12. Struktur UI

Gunakan tab layout:

```txt id="w7ycef"
[Auto Responder] [Office Hours] [Templates] [Tags] [Customer Idle]
```

Setiap tab harus memiliki:

```txt id="hhozc7"
Title
Short description
Main content
Table or form
Save button
Reset button
Status indicator
```

---

# 13. Loading State

Saat data dimuat, tampilkan:

```txt id="cu33ek"
Skeleton tabs
Skeleton table
Skeleton form fields
Skeleton buttons
```

---

# 14. Error State

Jika data gagal dimuat, tampilkan pesan:

```txt id="vfv40f"
Gagal memuat Inbox Settings. Silakan coba lagi.
```

Tambahkan tombol:

```txt id="jho5es"
Retry
```

---

# 15. Success State

Setelah pengaturan berhasil disimpan, tampilkan toast:

```txt id="r09pz2"
Inbox settings berhasil disimpan.
```

---

# 16. Confirmation State

Jika user mengubah pengaturan penting seperti Office Hours, Auto Responder, atau Customer Idle, tampilkan confirmation modal.

Contoh pesan:

```txt id="a60xhr"
Perubahan ini dapat memengaruhi respons otomatis dan status percakapan pelanggan. Apakah Anda yakin ingin menyimpan perubahan?
```

---

# 17. Batasan Modul

Fitur Inbox Settings tidak boleh dicampur dengan:

```txt id="az517a"
Conversation Builder
AI Agents
Chatbot Settings
Agent Management
Ticket Detail
Customer Database
Campaign Builder
CRM Pipeline
```

Inbox Settings hanya fokus pada:

```txt id="ujro57"
Auto responder
Office hours
Templates
Tags
Customer idle
Konfigurasi operasional inbox
```

---

# 18. Acceptance Criteria

Fitur dianggap selesai jika:

* Halaman Inbox Settings tampil dengan tab navigation.
* Tab Auto Responder tersedia.
* User bisa membuat, mengedit, menghapus, dan mengaktifkan auto responder.
* User bisa memilih trigger auto responder.
* User bisa mengatur delay pesan otomatis.
* Tab Office Hours tersedia.
* User bisa mengatur timezone.
* User bisa mengatur hari kerja.
* User bisa mengatur jam buka dan jam tutup.
* User bisa menambahkan holiday schedule.
* User bisa mengatur outside hours message.
* Tab Templates tersedia.
* User bisa membuat, mengedit, dan menghapus template.
* Template mendukung variable dinamis.
* Template bisa digunakan sebagai quick reply.
* Tab Tags tersedia.
* User bisa membuat, mengedit, dan menghapus tag.
* User bisa memilih warna, kategori, dan visibility tag.
* Tab Customer Idle tersedia.
* User bisa mengatur durasi idle pelanggan.
* User bisa mengirim reminder otomatis.
* User bisa mengaktifkan auto resolve.
* User bisa menambahkan tag setelah idle.
* Loading, error, success, dan confirmation state tersedia.
* Semua pengaturan dapat disimpan dan dimuat ulang.
