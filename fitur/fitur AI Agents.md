# PLAN FITUR: AI Agents

## Modul: Bot & Automation > AI Agents

## 1. Tujuan Fitur

Fitur **AI Agents** berfungsi sebagai pusat pengelolaan bot pintar berbasis AI yang mampu memahami pesan pelanggan, menjawab berdasarkan data internal, menjalankan aksi otomatis, dan meneruskan percakapan ke human agent jika dibutuhkan.

AI Agent berbeda dari chatbot flow biasa.
Jika **Conversations** digunakan untuk membuat alur percakapan berbasis node, maka **AI Agents** digunakan untuk membuat asisten AI yang bisa memahami bahasa natural dan menjawab secara fleksibel berdasarkan training sources.

---

## 2. Fungsi Utama AI Agents

AI Agents harus memiliki kapabilitas utama berikut:

1. Natural Language Processing
2. Knowledge Base / Training Sources
3. Agentic Actions
4. Identity & Persona Rules
5. Seamless Human Handover
6. Integrasi ke Conversation Builder

---

## 3. Struktur Halaman

Halaman berada di menu:

```txt
Bot & Automation > AI Agents
```

Struktur utama halaman:

1. Header halaman
2. Empty state jika belum ada AI Agent
3. Tombol Create AI Agent
4. Daftar AI Agents
5. Status agent
6. Detail konfigurasi agent
7. Training Sources
8. Actions
9. Human Handover Rules
10. Integration Guide ke Conversations

---

## 4. Header Halaman

### Elemen:

* Judul halaman: **AI Agents**
* Deskripsi singkat:

```txt
Buat dan kelola asisten AI yang dapat memahami pesan pelanggan, menjawab berdasarkan data internal, menjalankan aksi otomatis, dan meneruskan percakapan ke human agent jika diperlukan.
```

### Tombol utama:

```txt
Create AI Agent
```

Tombol ini digunakan untuk membuat AI Agent baru.

---

## 5. Empty State

Karena kondisi awal dashboard adalah **No AI agent yet**, tampilkan empty state.

### Teks utama:

```txt
No AI agent yet
```

### Deskripsi:

```txt
Buat AI Agent pertama Anda untuk membantu menjawab pesan pelanggan secara otomatis berdasarkan data bisnis internal.
```

### Tombol:

```txt
Create AI Agent
```

### Visual:

Gunakan icon:

* Robot
* Chat bubble
* Sparkle AI
* Brain / knowledge icon

---

## 6. Create AI Agent

Saat user klik tombol **Create AI Agent**, tampilkan modal atau halaman form pembuatan agent baru.

### Field utama:

```txt
Agent Name
Agent Description
AI Prompt
Tone of Voice
Training Sources
Allowed Actions
Handover Rules
Status
```

---

## 7. Form Create AI Agent

### 7.1 Agent Name

Nama AI Agent.

Placeholder:

```txt
Contoh: Johan Garage Assistant
```

Contoh nama:

```txt
Johan Garage Assistant
Service Advisor Bot
Sparepart Assistant
Booking AI Agent
Customer Support Agent
```

---

### 7.2 Agent Description

Deskripsi singkat peran AI Agent.

Placeholder:

```txt
Contoh: Asisten AI untuk membantu pelanggan Johan Garage terkait servis, harga, booking, dan informasi produk.
```

---

### 7.3 AI Prompt

Textarea untuk mengatur instruksi utama AI Agent.

Contoh prompt:

```txt
Kamu adalah asisten teknis yang bertugas melayani pelanggan Johan Garage. Jawab pertanyaan seputar jadwal servis, estimasi biaya perbaikan, produk sparepart, dan booking layanan secara ramah, ringkas, dan profesional. Jangan menjawab topik di luar layanan Johan Garage. Jika pelanggan membutuhkan bantuan kompleks, arahkan ke admin manusia.
```

---

## 8. Identity & Persona Rules

Tambahkan section khusus untuk mengatur identitas dan gaya bahasa AI Agent.

### Field:

```txt
Bot Identity
Main Task
Response Limitation
Tone of Voice
Fallback Behavior
Forbidden Topics
```

### Contoh isi:

#### Bot Identity

```txt
Asisten virtual Johan Garage.
```

#### Main Task

```txt
Membantu pelanggan mendapatkan informasi layanan servis, harga sparepart, booking, dan status antrean.
```

#### Response Limitation

```txt
Hanya menjawab berdasarkan data bisnis yang tersedia di training sources.
```

#### Tone of Voice

Pilihan:

```txt
Formal
Ramah
Santai
Profesional
Singkat
```

#### Fallback Behavior

```txt
Jika tidak tahu jawaban, jangan mengarang. Sampaikan bahwa informasi belum tersedia dan tawarkan untuk menghubungkan pelanggan ke admin.
```

#### Forbidden Topics

```txt
Politik
SARA
Judi
Pornografi
Topik di luar layanan bisnis
Harga yang tidak ada di database
Janji servis tanpa jadwal tersedia
```

---

## 9. Natural Language Processing

AI Agent harus mampu memahami pesan pelanggan dalam bentuk bahasa bebas.

### Fungsi:

AI dapat membaca maksud pelanggan meskipun pesan tidak sesuai format.

### Contoh pesan pelanggan:

```txt
Motor saya bunyi kasar pas digas, kira-kira kenapa ya?
```

AI harus memahami bahwa intensi pelanggan adalah:

```txt
Keluhan servis motor
```

### Contoh lain:

```txt
Besok masih bisa booking servis?
```

AI harus memahami bahwa intensi pelanggan adalah:

```txt
Booking jadwal servis
```

### Intent yang perlu didukung:

```txt
Tanya layanan
Tanya harga
Booking servis
Keluhan motor
Tanya sparepart
Tanya jam buka
Tanya lokasi
Minta bicara admin
Komplain
Follow up antrean
```

---

## 10. Knowledge Base / Training Sources

AI Agent harus belajar dari data internal bisnis.

### Tujuan:

Agar AI menjawab secara faktual dan tidak mengarang jawaban.

### Jenis data yang bisa diunggah:

```txt
FAQ
SOP
PDF
Dokumen layanan
Katalog produk
Daftar harga sparepart
Jam buka
Informasi garansi
Kebijakan booking
Data promo
Panduan servis
```

### Format file yang didukung:

```txt
PDF
DOCX
TXT
CSV
XLSX
Markdown
URL knowledge source
```

### Tampilan Training Sources:

Tabel berisi:

| Kolom       | Fungsi                        |
| ----------- | ----------------------------- |
| Source Name | Nama dokumen atau sumber data |
| Type        | Jenis file atau sumber        |
| Uploaded At | Waktu upload                  |
| Status      | Indexed, Processing, Failed   |
| Actions     | View, Re-upload, Delete       |

---

## 11. Status Training Sources

Gunakan status berikut:

```txt
Processing
Indexed
Failed
```

### Penjelasan:

| Status     | Fungsi                                         |
| ---------- | ---------------------------------------------- |
| Processing | Data sedang diproses                           |
| Indexed    | Data berhasil digunakan sebagai knowledge base |
| Failed     | Data gagal diproses                            |

---

## 12. Agentic Actions

AI Agent dapat menjalankan aksi mandiri sesuai izin yang diberikan.

### Contoh action:

```txt
Create Lead
Update Ticket Status
Create Booking
Assign Conversation
Send Data to API
Save Customer Info
Escalate to Human Agent
```

### Tampilan Allowed Actions:

Gunakan checkbox atau toggle.

Contoh:

```txt
[ ] Membalas pesan pelanggan
[ ] Mencatat prospek/deal
[ ] Membuat reservasi jadwal
[ ] Memperbarui status tiket
[ ] Mengirim data ke API eksternal
[ ] Meneruskan ke human agent
```

### Catatan penting:

Tidak semua action harus aktif secara default.
Gunakan permission agar AI tidak menjalankan aksi sensitif tanpa izin.

---

## 13. Human Handover Rules

AI Agent harus bisa meneruskan percakapan ke admin manusia.

### Trigger handover:

```txt
Pelanggan meminta bicara dengan admin
Pelanggan marah atau komplain berat
AI tidak menemukan jawaban
Percakapan terlalu kompleks
Pelanggan mengirim kata kasar
Pelanggan ingin negosiasi harga
Pelanggan ingin konfirmasi booking manual
```

### Field konfigurasi:

```txt
Enable Human Handover
Assign To Team
Assign To Agent
Idle Action
Fallback Message
```

### Contoh fallback handover:

```txt
Baik kak, saya teruskan percakapan ini ke admin Johan Garage agar bisa dibantu lebih lanjut.
```

---

## 14. List AI Agents

Jika sudah ada AI Agent, tampilkan dalam bentuk tabel atau card list.

### Kolom tabel:

| Kolom            | Fungsi                               |
| ---------------- | ------------------------------------ |
| Agent Name       | Nama AI Agent                        |
| Description      | Peran singkat agent                  |
| Training Sources | Jumlah sumber data                   |
| Actions Enabled  | Jumlah action aktif                  |
| Channel Usage    | Channel atau flow yang memakai agent |
| Last Update      | Waktu terakhir diperbarui            |
| Status           | Active, Draft, Inactive              |
| Actions          | Edit, Duplicate, Test, Delete        |

---

## 15. Status AI Agent

Gunakan status berikut:

```txt
Active
Draft
Inactive
```

### Penjelasan:

| Status   | Fungsi                            |
| -------- | --------------------------------- |
| Active   | AI Agent aktif dan bisa digunakan |
| Draft    | AI Agent masih dalam konfigurasi  |
| Inactive | AI Agent dimatikan sementara      |

Badge warna:

* Active: hijau
* Draft: kuning/oranye
* Inactive: abu-abu

---

## 16. Actions Dropdown

Setiap AI Agent memiliki dropdown actions.

### Isi menu:Co

```txt
Edit
Duplicate
Test Agent
Deactivate
Delete
```

### Fungsi:

#### Edit

Mengubah konfigurasi AI Agent.

#### Duplicate

Menggandakan agent dengan konfigurasi yang sama.

#### Test Agent

Membuka panel simulasi chat untuk menguji jawaban AI.

#### Deactivate

Mematikan sementara agent.

#### Delete

Menghapus AI Agent dengan confirmation modal.

---

## 17. Test Agent Panel

Tambahkan fitur testing sebelum AI Agent dipasang ke conversation flow.

### Fungsi:

User bisa mengirim contoh pesan dan melihat respons AI.

### UI:

* Chat preview
* Input test message
* Response result
* Source reference
* Confidence score
* Handover detection

### Contoh test:

User mengetik:

```txt
Motor saya susah nyala pagi hari, bisa servis?
```

AI menjawab:

```txt
Bisa kak. Untuk motor yang susah menyala saat pagi, biasanya perlu pengecekan aki, busi, injeksi atau karburator. Kakak bisa booking servis dengan mengirim nama, jenis motor, dan jadwal yang diinginkan.
```

---

## 18. Integration dengan Conversations

AI Agent tidak berjalan sendiri.
AI Agent harus bisa dipasang ke flow pada menu:

```txt
Bot & Automation > Conversations
```

### Cara integrasi:

1. User masuk ke menu Conversations.
2. User membuat conversation flow baru.
3. User menambahkan node:

```txt
AI Agent
```

4. User memilih AI Agent yang ingin digunakan.
5. User mengatur kapan AI Agent aktif.
6. User publish conversation.

### Node AI Agent berisi:

```txt
Select AI Agent
Fallback Message
Handover Rule
Allowed Intent
Response Mode
```

---

## 19. Response Mode

Tambahkan pengaturan mode respons AI.

Pilihan:

```txt
Answer Only
Answer + Suggest Menu
Answer + Execute Action
Answer + Handover if Needed
```

### Penjelasan:

| Mode                        | Fungsi                                   |
| --------------------------- | ---------------------------------------- |
| Answer Only                 | AI hanya menjawab pesan                  |
| Answer + Suggest Menu       | AI menjawab dan memberi pilihan menu     |
| Answer + Execute Action     | AI boleh menjalankan action              |
| Answer + Handover if Needed | AI menjawab dan bisa meneruskan ke admin |

---

## 20. Contoh Konfigurasi AI Agent Johan Garage

### Agent Name

```txt
Johan Garage Assistant
```

### Agent Description

```txt
Asisten AI untuk membantu pelanggan Johan Garage terkait servis motor, sparepart, booking, harga, dan informasi toko.
```

### AI Prompt

```txt
Kamu adalah asisten virtual Johan Garage. Tugasmu membantu pelanggan dengan jawaban singkat, jelas, ramah, dan profesional. Jawab hanya berdasarkan informasi bisnis yang tersedia di training sources. Jangan mengarang harga, stok, promo, atau jadwal jika datanya tidak tersedia. Jika pertanyaan pelanggan terlalu kompleks atau membutuhkan keputusan manusia, teruskan ke admin.
```

### Tone of Voice

```txt
Ramah, singkat, profesional.
```

### Allowed Actions

```txt
Membalas pesan pelanggan
Membuat booking servis
Mencatat data pelanggan
Meneruskan ke admin
```

### Handover Message

```txt
Baik kak, saya teruskan ke admin Johan Garage agar bisa dibantu lebih lanjut.
```

---

## 21. Data Dummy Awal

Gunakan data dummy berikut untuk tampilan awal setelah ada agent:

```ts
const aiAgents = [
  {
    id: "agent_001",
    name: "Johan Garage Assistant",
    description: "Asisten AI untuk layanan servis, booking, harga, dan sparepart.",
    trainingSources: 8,
    actionsEnabled: 4,
    channelUsage: "WhatsApp - Johan Garage",
    lastUpdate: "25 Jun 2026, 15:20",
    status: "Active",
  },
  {
    id: "agent_002",
    name: "Sparepart Advisor",
    description: "AI untuk menjawab pertanyaan seputar produk dan stok sparepart.",
    trainingSources: 3,
    actionsEnabled: 2,
    channelUsage: "Instagram DM",
    lastUpdate: "24 Jun 2026, 10:45",
    status: "Draft",
  },
  {
    id: "agent_003",
    name: "Booking Service Agent",
    description: "AI untuk membantu pelanggan membuat reservasi servis.",
    trainingSources: 5,
    actionsEnabled: 3,
    channelUsage: "Not connected",
    lastUpdate: "23 Jun 2026, 18:10",
    status: "Inactive",
  },
];
```

---

## 22. Komponen yang Perlu Dibuat

Buat komponen berikut:

```txt
AIAgentsPage
AIAgentsHeader
CreateAIAgentButton
EmptyAIAgentState
AIAgentTable
AIAgentCard
AIAgentStatusBadge
AIAgentActionsDropdown
CreateAIAgentModal
EditAIAgentModal
DeleteAIAgentModal
TrainingSourcesPanel
UploadTrainingSourceModal
AgenticActionsPanel
PersonaRulesPanel
HumanHandoverPanel
TestAgentPanel
ConversationIntegrationPanel
```

---

## 23. Alur Interaksi Create AI Agent

1. User masuk ke halaman AI Agents.
2. Jika belum ada agent, tampilkan empty state.
3. User klik Create AI Agent.
4. User mengisi Agent Name.
5. User mengisi Agent Description.
6. User mengatur AI Prompt.
7. User memilih Tone of Voice.
8. User menambahkan Training Sources.
9. User memilih Allowed Actions.
10. User mengatur Human Handover Rules.
11. User menyimpan sebagai Draft atau Active.
12. AI Agent muncul di daftar agent.

---

## 24. Alur Upload Training Sources

1. User membuka detail AI Agent.
2. User masuk ke section Training Sources.
3. User klik Upload Source.
4. User memilih file.
5. Sistem menampilkan status Processing.
6. Jika berhasil, status berubah menjadi Indexed.
7. Jika gagal, status berubah menjadi Failed.
8. AI Agent hanya boleh menjawab berdasarkan sumber yang sudah Indexed.

---

## 25. Alur Test AI Agent

1. User membuka detail AI Agent.
2. User klik Test Agent.
3. Panel simulasi chat terbuka.
4. User mengirim contoh pesan.
5. AI menampilkan jawaban.
6. Sistem menampilkan source reference jika tersedia.
7. User dapat memperbaiki prompt atau training sources jika jawaban belum sesuai.

---

## 26. Alur Pasang AI Agent ke Conversations

1. User masuk ke menu Conversations.
2. User membuat atau mengedit conversation flow.
3. User menambahkan node AI Agent.
4. User memilih AI Agent yang sudah dibuat.
5. User menentukan response mode.
6. User mengatur fallback dan handover.
7. User publish conversation.
8. AI Agent mulai merespons pesan dari channel yang dipilih.

---

## 27. Loading State

Saat data sedang dimuat, tampilkan:

```txt
Skeleton header
Skeleton empty/card state
Skeleton table rows
Skeleton training source list
```

---

## 28. Error State

Jika data gagal dimuat, tampilkan:

```txt
Gagal memuat data AI Agents. Silakan coba lagi.
```

Tambahkan tombol:

```txt
Retry
```

---

## 29. Confirmation Modal

Gunakan confirmation modal untuk delete AI Agent.

### Pesan:

```txt
Apakah Anda yakin ingin menghapus AI Agent ini? Agent yang sudah dihapus tidak dapat digunakan lagi di conversation flow.
```

### Tombol:

```txt
Cancel
Delete AI Agent
```

---

## 30. Desain UI

Gunakan desain dashboard modern dan clean.

### Rekomendasi visual:

* Card agent dengan rounded corner
* Badge status yang jelas
* Icon robot untuk AI Agent
* Icon database/file untuk Training Sources
* Icon workflow untuk Agentic Actions
* Icon user switch untuk Human Handover
* Empty state yang rapi dan informatif
* Test chat panel seperti tampilan inbox mini

---

## 31. Catatan Batasan Fitur

Fitur AI Agents tidak boleh dicampur dengan:

```txt
Conversations
Ticketing
Booking Management
Knowledge Base Page utama
Inbox
Customer Database
```

AI Agents hanya fokus pada:

```txt
Membuat AI Agent
Mengatur prompt
Mengatur persona
Menghubungkan training sources
Mengatur action yang boleh dilakukan AI
Mengatur human handover
Testing AI Agent
Menghubungkan agent ke conversation flow
```

---

## 32. Acceptance Criteria

Fitur dianggap selesai jika:

* Halaman AI Agents tampil dengan header dan deskripsi.
* Empty state muncul saat belum ada agent.
* Tombol Create AI Agent tersedia.
* User bisa membuat AI Agent baru.
* User bisa mengatur Agent Name dan Description.
* User bisa mengisi AI Prompt.
* User bisa memilih Tone of Voice.
* User bisa menambahkan Training Sources.
* Training Sources memiliki status Processing, Indexed, dan Failed.
* User bisa mengatur Allowed Actions.
* User bisa mengatur Human Handover Rules.
* User bisa melakukan Test Agent.
* AI Agent muncul di daftar agent.
* Status Active, Draft, dan Inactive tampil sebagai badge.
* Dropdown actions tersedia.
* User bisa Edit, Duplicate, Test, Deactivate, dan Delete AI Agent.
* AI Agent bisa dipilih pada node AI Agent di menu Conversations.