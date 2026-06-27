# PLAN FITUR: Chatbot Settings

## Modul: Bot & Automation > Chatbot Settings

## 1. Tujuan Fitur

Fitur **Chatbot Settings** berfungsi sebagai pusat konfigurasi teknis untuk mengatur perilaku bot, batas respons AI, idle session, integrasi API, dan sinkronisasi CRM.

Menu ini digunakan untuk memastikan chatbot berjalan stabil, tidak membalas secara berlebihan, bisa melakukan handover ke human agent, serta dapat terhubung dengan sistem eksternal seperti database, inventory, booking system, dan CRM.

---

## 2. Struktur Menu Chatbot Settings

Halaman **Chatbot Settings** memiliki 4 sub-menu utama:

```txt
AI Configuration
Idle Action
API Integration
CRM Integration
```

Setiap sub-menu memiliki fungsi berbeda, tetapi semuanya berhubungan dengan pengaturan teknis chatbot.

---

# 3. AI Configuration

## 3.1 Tujuan

Menu **AI Configuration** digunakan untuk mengatur parameter dasar perilaku AI saat membalas pesan pelanggan.

Fitur ini menjaga agar AI tidak terlalu sering membalas, tidak menjawab terlalu cepat, dan dapat melakukan handover jika percakapan sudah melebihi batas tertentu.

---

## 3.2 Field Utama

```txt
AI Message Threshold
Listen Time
Human Agent Handover
Handover Target
Handover Message
```

---

## 3.3 AI Message Threshold

### Fungsi

Mengatur batas maksimal jumlah pesan yang boleh dijawab oleh AI dalam satu sesi percakapan.

Jika jumlah balasan AI melebihi batas ini, sistem akan menghentikan sesi AI dan meneruskan percakapan ke human agent.

### Contoh value:

```txt
10 messages
```

### Use case:

Jika pelanggan terus bertanya dan AI sudah membalas 10 kali, maka sistem menganggap percakapan perlu ditangani oleh manusia.

### Contoh logic:

```txt
Jika aiMessageCount >= aiMessageThreshold:
  triggerHumanHandover()
```

---

## 3.4 Listen Time

### Fungsi

Mengatur waktu tunggu sebelum bot membalas pesan pelanggan.

Fitur ini penting agar bot tidak langsung merespons ketika pelanggan masih mengetik beberapa pesan secara berurutan.

### Contoh value:

```txt
2 seconds
```

### Contoh masalah yang dicegah:

Pelanggan mengirim pesan seperti ini:

```txt
Kak
Motor saya
Susah nyala
Kalau pagi
```

Tanpa Listen Time, bot bisa membalas setiap potongan pesan secara terpisah.

Dengan Listen Time, bot menunggu beberapa detik agar pesan pelanggan terkumpul dulu sebelum menjawab.

---

## 3.5 Human Agent Handover

### Fungsi

Mengatur kapan AI harus meneruskan percakapan ke admin manusia.

### Trigger handover:

```txt
AI Message Threshold tercapai
Pelanggan meminta admin
Pelanggan marah atau komplain berat
AI tidak menemukan jawaban
Pelanggan mengirim pertanyaan kompleks
Pelanggan membutuhkan keputusan manual
```

---

## 3.6 Handover Target

User dapat memilih tujuan handover.

### Pilihan:

```txt
Any available agent
Specific team
Specific agent
```

### Contoh team:

```txt
Admin
Customer Service
Mekanik
Sales
Booking Team
```

---

## 3.7 Handover Message

Pesan transisi sebelum percakapan dialihkan ke human agent.

### Contoh:

```txt
Baik kak, saya teruskan percakapan ini ke admin Johan Garage agar bisa dibantu lebih lanjut.
```

---

# 4. Idle Action

## 4.1 Tujuan

Menu **Idle Action** digunakan untuk mengatur tindakan otomatis ketika percakapan tidak aktif dalam periode tertentu.

Fitur ini berguna untuk menjaga inbox tetap rapi, mencegah penumpukan sesi tidak aktif, dan memastikan status percakapan tetap akurat.

---

## 4.2 Field Utama

```txt
Enable Idle Action
Idle Timeout
Idle Trigger Target
Action Type
Idle Message
Auto Close Status
Assign After Idle
```

---

## 4.3 Idle Timeout

### Fungsi

Mengatur batas waktu percakapan dianggap idle atau tidak aktif.

### Contoh value:

```txt
24 hours
2 days
3 days
```

---

## 4.4 Idle Trigger Target

Menentukan siapa yang menjadi dasar pengecekan idle.

### Pilihan:

```txt
Customer inactive
Agent inactive
Both customer and agent inactive
```

---

## 4.5 Action Type

Aksi otomatis yang dijalankan ketika percakapan idle.

### Pilihan action:

```txt
Send reminder message
Mark as resolved
Close conversation
Assign to agent
Move to specific inbox
Add label
Trigger webhook
```

---

## 4.6 Idle Message

Pesan otomatis ketika pelanggan tidak membalas dalam waktu tertentu.

### Contoh:

```txt
Halo kak, apakah masih membutuhkan bantuan? Jika tidak ada balasan, percakapan ini akan kami tutup otomatis.
```

---

## 4.7 Auto Close Conversation

Jika aktif, sistem akan menutup percakapan otomatis setelah timeout tertentu.

### Contoh logic:

```txt
Jika customer tidak membalas selama 2 hari:
  kirim idle message
  tunggu 1 jam
  close conversation
```

---

# 5. API Integration

## 5.1 Tujuan

Menu **API Integration** digunakan untuk menghubungkan chatbot dengan sistem eksternal menggunakan HTTP/REST API.

Fitur ini memungkinkan bot mengambil, mengirim, atau memperbarui data secara otomatis dari backend bisnis.

---

## 5.2 Field Utama

```txt
API Name
HTTP Method
Endpoint URL
Headers
Authentication Type
Request Body
Response Mapping
Test API
Status
```

---

## 5.3 HTTP Method

Pilihan metode API:

```txt
GET
POST
PUT
PATCH
DELETE
```

---

## 5.4 Endpoint URL

Input URL API tujuan.

### Contoh:

```txt
https://api.johangarage.com/service-status
```

---

## 5.5 Authentication Type

Pilihan autentikasi:

```txt
No Auth
Bearer Token
API Key
Basic Auth
Custom Header
```

---

## 5.6 Headers

User dapat menambahkan header untuk kebutuhan autentikasi atau konfigurasi request.

### Contoh:

```json
{
  "Authorization": "Bearer YOUR_TOKEN",
  "Content-Type": "application/json"
}
```

---

## 5.7 Request Body

Digunakan untuk mengirim data ke server.

### Contoh:

```json
{
  "phone": "{{customer.phone}}",
  "plate_number": "{{conversation.plate_number}}"
}
```

---

## 5.8 Response Mapping

Digunakan untuk mengambil hasil response API dan menyimpannya sebagai variable.

### Contoh response:

```json
{
  "status": "In Progress",
  "mechanic": "Budi",
  "estimated_finish": "25 Jun 2026, 17:00"
}
```

### Mapping:

```txt
serviceStatus = response.status
mechanicName = response.mechanic
estimatedFinish = response.estimated_finish
```

---

## 5.9 Test API

Tambahkan tombol:

```txt
Test API
```

### Fungsi:

Untuk mengecek apakah endpoint API berhasil dipanggil sebelum digunakan dalam flow chatbot.

Status hasil test:

```txt
Success
Failed
Timeout
Unauthorized
Invalid Response
```

---

## 5.10 Contoh Penggunaan API

Bot dapat menggunakan API untuk:

```txt
Cek status servis motor
Cek stok sparepart
Cek harga produk
Validasi member
Membuat booking servis
Mengirim data pelanggan ke backend
Mengambil status pembayaran
Mengambil nomor antrean
```

---

# 6. CRM Integration

## 6.1 Tujuan

Menu **CRM Integration** digunakan untuk menyinkronkan data pelanggan dari percakapan chatbot ke sistem CRM.

Fitur ini membantu bisnis mencatat leads, membuat kontak baru, memperbarui pipeline, dan menyimpan riwayat interaksi pelanggan secara otomatis.

---

## 6.2 Field Utama

```txt
Enable CRM Integration
CRM Provider
Sync Trigger
Contact Mapping
Deal Mapping
Ticket Mapping
Duplicate Handling
Sync Status
```

---

## 6.3 CRM Provider

Pilihan CRM:

```txt
Internal CRM
Mekari CRM
HubSpot
Zoho CRM
Salesforce
Custom CRM API
```

---

## 6.4 Sync Trigger

Menentukan kapan data dikirim ke CRM.

### Pilihan:

```txt
When new conversation starts
When customer shares phone number
When customer selects booking menu
When conversation is handed over
When conversation is closed
When lead intent is detected
```

---

## 6.5 Contact Mapping

Mapping data pelanggan ke CRM.

### Contoh:

```txt
Customer Name -> CRM Contact Name
Customer Phone -> CRM Phone Number
Customer Email -> CRM Email
Customer Channel -> CRM Source
```

---

## 6.6 Deal Mapping

Mapping data peluang penjualan atau prospek.

### Contoh:

```txt
Intent -> Deal Name
Service Type -> Deal Category
Estimated Price -> Deal Value
Conversation Status -> Deal Stage
```

---

## 6.7 Ticket Mapping

Mapping data komplain atau permintaan bantuan.

### Contoh:

```txt
Customer Complaint -> Ticket Description
Priority -> Ticket Priority
Assigned Agent -> Ticket Owner
Conversation Link -> Ticket Reference
```

---

## 6.8 Duplicate Handling

Mengatur apa yang dilakukan sistem jika pelanggan sudah ada di CRM.

### Pilihan:

```txt
Update existing contact
Create new contact anyway
Merge with existing contact
Skip duplicate contact
```

---

# 7. Contoh Use Case Keseluruhan

## Case: Pelanggan Menanyakan Status Servis Motor

### 1. AI Configuration

Bot menunggu selama 2 detik menggunakan Listen Time agar pesan pelanggan terkumpul.

Contoh pesan pelanggan:

```txt
Kak, motor saya yang kemarin servis sudah selesai belum?
```

---

### 2. API Integration

Bot mengambil data status servis dari backend Johan Garage.

Contoh request:

```json
{
  "phone": "{{customer.phone}}",
  "plate_number": "{{conversation.plate_number}}"
}
```

Contoh response:

```json
{
  "status": "Masih dicek mekanik",
  "mechanic": "Budi",
  "estimated_finish": "Hari ini pukul 17:00"
}
```

---

### 3. Bot Response

Bot membalas pelanggan:

```txt
Motor kakak masih dalam pengecekan oleh mekanik Budi. Estimasi selesai hari ini pukul 17:00.
```

---

### 4. Human Handover

Jika pelanggan masih bingung atau sudah melewati batas 10 pesan AI, sistem meneruskan percakapan ke tim mekanik.

Contoh pesan:

```txt
Baik kak, saya teruskan ke tim mekanik agar bisa dibantu lebih detail.
```

---

### 5. CRM Integration

Sistem menyimpan update ke CRM:

```txt
Customer: Rizky
Intent: Cek status servis
Status: Handover to Mechanic
Ticket: Updated
```

---

### 6. Idle Action

Jika pelanggan tidak membalas selama 2 hari, sistem mengirim reminder.

Contoh:

```txt
Halo kak, apakah masih membutuhkan bantuan terkait servis motor? Jika tidak ada balasan, percakapan ini akan kami tutup otomatis.
```

Jika tetap tidak ada respons, conversation ditutup otomatis.

---

# 8. Data Dummy Awal

Gunakan data dummy berikut untuk tampilan awal:

```ts
const chatbotSettings = {
  aiConfiguration: {
    aiMessageThreshold: 10,
    listenTime: 2,
    handoverEnabled: true,
    handoverTargetType: "Specific team",
    handoverTarget: "Mekanik",
    handoverMessage:
      "Baik kak, saya teruskan percakapan ini ke admin Johan Garage agar bisa dibantu lebih lanjut.",
  },

  idleAction: {
    enabled: true,
    idleTimeout: 48,
    idleTimeoutUnit: "hours",
    triggerTarget: "Customer inactive",
    actionType: "Send reminder then close",
    idleMessage:
      "Halo kak, apakah masih membutuhkan bantuan? Jika tidak ada balasan, percakapan ini akan kami tutup otomatis.",
    autoClose: true,
  },

  apiIntegration: [
    {
      id: "api_001",
      name: "Check Service Status",
      method: "POST",
      endpoint: "https://api.johangarage.com/service-status",
      authType: "Bearer Token",
      status: "Active",
      lastTest: "Success",
    },
    {
      id: "api_002",
      name: "Check Sparepart Stock",
      method: "GET",
      endpoint: "https://api.johangarage.com/spareparts",
      authType: "API Key",
      status: "Draft",
      lastTest: "Not tested",
    },
  ],

  crmIntegration: {
    enabled: true,
    provider: "Internal CRM",
    syncTrigger: "When lead intent is detected",
    duplicateHandling: "Update existing contact",
    status: "Connected",
  },
};
```

---

# 9. Komponen yang Perlu Dibuat

Buat komponen berikut:

```txt
ChatbotSettingsPage
ChatbotSettingsTabs
AIConfigurationPanel
AIMessageThresholdInput
ListenTimeInput
HandoverSettingsPanel
IdleActionPanel
IdleTimeoutInput
IdleActionTypeSelect
APIIntegrationPanel
APITable
CreateAPIModal
EditAPIModal
TestAPIPanel
CRMIntegrationPanel
CRMProviderSelect
CRMMappingTable
SaveSettingsButton
ResetSettingsButton
SettingsStatusBadge
```

---

# 10. Struktur Tab UI

Gunakan layout tab agar rapi.

```txt
[AI Configuration] [Idle Action] [API Integration] [CRM Integration]
```

Setiap tab memiliki:

```txt
Title
Short description
Form settings
Save button
Reset button
Status indicator
```

---

# 11. Alur Interaksi AI Configuration

1. User membuka tab AI Configuration.
2. User mengatur AI Message Threshold.
3. User mengatur Listen Time.
4. User mengaktifkan Human Agent Handover.
5. User memilih handover target.
6. User menulis handover message.
7. User klik Save Settings.
8. Sistem menyimpan konfigurasi.

---

# 12. Alur Interaksi Idle Action

1. User membuka tab Idle Action.
2. User mengaktifkan Enable Idle Action.
3. User menentukan Idle Timeout.
4. User memilih target idle.
5. User memilih action type.
6. User menulis idle message.
7. User mengaktifkan Auto Close jika diperlukan.
8. User klik Save Settings.

---

# 13. Alur Interaksi API Integration

1. User membuka tab API Integration.
2. User klik Create API.
3. User mengisi API Name.
4. User memilih HTTP Method.
5. User mengisi Endpoint URL.
6. User mengatur Authentication.
7. User mengisi Headers.
8. User mengisi Request Body.
9. User mengatur Response Mapping.
10. User klik Test API.
11. Jika berhasil, user klik Save API.
12. API muncul di daftar integration.

---

# 14. Alur Interaksi CRM Integration

1. User membuka tab CRM Integration.
2. User mengaktifkan CRM Integration.
3. User memilih CRM Provider.
4. User memilih Sync Trigger.
5. User mengatur Contact Mapping.
6. User mengatur Deal Mapping.
7. User mengatur Ticket Mapping.
8. User memilih Duplicate Handling.
9. User klik Save Settings.

---

# 15. Loading State

Saat data setting dimuat, tampilkan:

```txt
Skeleton tabs
Skeleton form fields
Skeleton save button
Skeleton table rows untuk API Integration
```

---

# 16. Error State

Jika data gagal dimuat, tampilkan pesan:

```txt
Gagal memuat Chatbot Settings. Silakan coba lagi.
```

Tambahkan tombol:

```txt
Retry
```

---

# 17. Success State

Setelah user berhasil menyimpan pengaturan, tampilkan toast:

```txt
Chatbot settings berhasil disimpan.
```

---

# 18. Confirmation State

Jika user mengubah setting penting seperti API token, threshold, atau CRM mapping, tampilkan confirmation modal.

### Contoh pesan:

```txt
Perubahan ini dapat memengaruhi cara chatbot merespons pelanggan. Apakah Anda yakin ingin menyimpan perubahan?
```

---

# 19. Security Notes

Untuk data sensitif seperti token API, gunakan input password/masked field.

### Data sensitif:

```txt
Bearer Token
API Key
Basic Auth Password
CRM Token
Webhook Secret
```

Jangan tampilkan token secara penuh setelah disimpan.

Contoh tampilan:

```txt
sk_live_***************
```

---

# 20. Batasan Modul

Fitur Chatbot Settings tidak boleh dicampur dengan:

```txt
AI Agents
Conversations Builder
Inbox
Ticket Detail
Customer Database
Knowledge Base Page
Booking Management
```

Chatbot Settings hanya fokus pada:

```txt
Konfigurasi AI behavior
Idle session handling
API integration
CRM synchronization
Technical bot settings
```

---

# 21. Acceptance Criteria

Fitur dianggap selesai jika:

* Halaman Chatbot Settings tampil dengan layout tab.
* Tab AI Configuration tersedia.
* User bisa mengatur AI Message Threshold.
* User bisa mengatur Listen Time.
* User bisa mengatur Human Agent Handover.
* Tab Idle Action tersedia.
* User bisa mengatur timeout idle.
* User bisa memilih action ketika conversation idle.
* Tab API Integration tersedia.
* User bisa membuat, mengedit, mengetes, dan menghapus API integration.
* API mendukung method GET, POST, PUT, PATCH, DELETE.
* Header, auth, body, dan response mapping bisa dikonfigurasi.
* Tab CRM Integration tersedia.
* User bisa memilih CRM provider.
* User bisa mengatur sync trigger.
* User bisa mapping contact, deal, dan ticket.
* Data sensitif seperti API key/token disembunyikan.
* Loading, error, success, dan confirmation state tersedia.
* Semua pengaturan bisa disimpan dan dimuat ulang.
