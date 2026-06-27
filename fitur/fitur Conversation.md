# PLAN FITUR: Conversations

## Modul: Bot & Automation > Conversations

## 1. Tujuan Fitur

Fitur **Conversations** berfungsi sebagai pusat manajemen chatbot untuk membuat, mengatur, dan memantau alur percakapan otomatis.

Melalui halaman ini, user dapat:

* Membuat flow chatbot baru.
* Mengatur trigger atau pemicu bot.
* Mengatur pesan balasan otomatis.
* Menambahkan menu interaktif seperti tombol atau daftar pilihan.
* Menghubungkan bot ke channel tertentu seperti WhatsApp.
* Memantau performa bot berdasarkan jumlah response.
* Mengatur status chatbot seperti Published, Draft, atau Inactive.
* Mengelola chatbot melalui aksi Edit, Duplicate, Deactivate, dan Delete.

Fitur ini harus menjadi **dashboard utama untuk seluruh chatbot conversation flow** sebelum percakapan diteruskan ke human agent.

---

## 2. Struktur Halaman

Halaman berada di menu:

```txt
Bot & Automation > Conversations
```

Tampilan halaman terdiri dari beberapa bagian utama:

1. Header halaman
2. Bot Response Quota
3. Search Conversations
4. Tabel Conversations
5. Pagination
6. Tombol Create Conversation
7. Dropdown Actions per chatbot

---

## 3. Header Halaman

### Elemen:

* Judul halaman: **Conversations**
* Deskripsi singkat:

  > Kelola alur percakapan otomatis untuk merespons pelanggan secara instan berdasarkan trigger, channel, dan kondisi tertentu.

### Tombol utama:

```txt
Create Conversation
```

Tombol ini digunakan untuk membuat alur chatbot baru.

---

## 4. Bot Response Quota

Tambahkan card informasi kuota bot response.

### Isi card:

* Label: **Bot Response Quota**
* Value contoh:

```txt
999.999.996
```

* Deskripsi:

  > Sisa kuota balasan otomatis bot yang dapat digunakan oleh perusahaan.

### Fungsi:

Card ini menampilkan informasi real-time mengenai sisa limit balasan bot yang tersedia. Fitur ini penting agar user mengetahui apakah operasional bot masih aman atau mendekati batas kuota.

---

## 5. Search Conversations

Tambahkan input pencarian di atas tabel.

### Placeholder:

```txt
Search conversations...
```

### Fungsi:

Digunakan untuk mencari chatbot berdasarkan:

* Conversation name
* Channel
* Status

Search harus bersifat real-time atau minimal filter setelah user mengetik.

---

## 6. Tabel Conversations

Tabel digunakan untuk menampilkan seluruh chatbot conversation flow yang sudah dibuat.

### Kolom tabel:

| Kolom             | Fungsi                                     |
| ----------------- | ------------------------------------------ |
| Conversation Name | Nama identifikasi chatbot                  |
| Bot Response      | Jumlah balasan otomatis yang sudah dikirim |
| Channel           | Channel tempat bot berjalan                |
| Last Update       | Tanggal dan waktu terakhir bot diperbarui  |
| Status            | Status operasional bot                     |
| Actions           | Menu aksi untuk mengelola bot              |

---

## 7. Detail Kolom Tabel

### 7.1 Conversation Name

Menampilkan nama chatbot.

Contoh:

```txt
Chatbot Jam Kerja
Greeting Johan Garage
FAQ Servis Motor
Booking Service Bot
```

---

### 7.2 Bot Response

Menampilkan jumlah response yang sudah dikirimkan oleh bot.

Contoh:

```txt
1.245 responses
320 responses
0 responses
```

---

### 7.3 Channel

Menampilkan channel tempat bot aktif.

Contoh:

```txt
WhatsApp - Johan Garage
Instagram DM - Johan Garage
Website Chat Widget
```

---

### 7.4 Last Update

Menampilkan waktu terakhir flow diperbarui.

Format contoh:

```txt
25 Jun 2026, 14:30
24 Jun 2026, 09:15
```

---

### 7.5 Status

Status chatbot terdiri dari:

```txt
Published
Draft
Inactive
```

### Penjelasan status:

| Status    | Fungsi                                 |
| --------- | -------------------------------------- |
| Published | Bot aktif dan sedang berjalan          |
| Draft     | Bot masih dalam konsep dan belum aktif |
| Inactive  | Bot dimatikan sementara                |

Gunakan badge warna berbeda:

* Published: hijau
* Draft: kuning/oranye
* Inactive: abu-abu

---

## 8. Actions Dropdown

Setiap baris chatbot memiliki tombol actions berupa dropdown.

### Isi menu actions:

```txt
Edit
Duplicate
Deactivate
Delete
```

### Fungsi masing-masing:

#### Edit

Membuka halaman atau canvas builder untuk mengubah flow chatbot.

#### Duplicate

Menggandakan flow chatbot agar bisa digunakan kembali untuk channel lain.

#### Deactivate

Mematikan sementara chatbot tanpa menghapus datanya.

Jika status bot masih Draft atau Inactive, opsi ini bisa berubah menjadi:

```txt
Activate
```

#### Delete

Menghapus conversation flow. Sebelum menghapus, tampilkan confirmation modal.

Contoh pesan:

```txt
Apakah Anda yakin ingin menghapus conversation ini? Tindakan ini tidak dapat dibatalkan.
```

---

## 9. Create Conversation

Saat user klik tombol **Create Conversation**, sistem membuka halaman atau modal pembuatan chatbot baru.

### Field utama:

```txt
Conversation Name
Channel
Trigger
Initial Message
Interactive Menu
Fallback Message
Human Agent Handoff
Status
```

---

## 10. Form Create Conversation

### 10.1 Conversation Name

Input nama chatbot.

Placeholder:

```txt
Contoh: Greeting Johan Garage
```

---

### 10.2 Channel

Dropdown pilihan channel.

Contoh pilihan:

```txt
WhatsApp - Johan Garage
Instagram DM
Website Chat Widget
Telegram
```

---

### 10.3 Trigger

Dropdown trigger bot.

Contoh pilihan:

```txt
Pesan pertama masuk
Di luar jam kerja
Keyword tertentu
Pelanggan memilih menu
Tidak ada balasan dari agent
```

---

### 10.4 Initial Message

Textarea untuk pesan awal bot.

Contoh:

```txt
Halo! Selamat datang di Johan Garage. Ada yang bisa kami bantu?
```

---

### 10.5 Interactive Menu

User bisa menambahkan menu tombol.

Contoh menu:

```txt
Cek Servis
Tanya Harga
Booking Service
Bicara dengan Admin
```

Setiap menu bisa memiliki response masing-masing.

---

### 10.6 Fallback Message

Pesan fallback jika bot tidak memahami input user.

Contoh:

```txt
Maaf kak, saya belum memahami pertanyaannya. Silakan pilih menu yang tersedia atau hubungi admin.
```

---

### 10.7 Human Agent Handoff

Toggle untuk meneruskan percakapan ke admin manusia.

Label:

```txt
Forward to Human Agent
```

Jika aktif, user dapat memilih kondisi handoff:

```txt
Saat pelanggan memilih Bicara dengan Admin
Saat bot tidak memahami pertanyaan
Saat pelanggan mengirim keyword tertentu
```

---

### 10.8 Status

Pilihan status ketika disimpan:

```txt
Save as Draft
Publish
```

---

## 11. Contoh Flow Greeting Chatbot

Gunakan contoh ini sebagai seed data atau sample flow.

### Nama Conversation:

```txt
Greeting Johan Garage
```

### Channel:

```txt
WhatsApp - Johan Garage
```

### Trigger:

```txt
Pesan Pertama Masuk
```

### Initial Message:

```txt
Halo! Selamat datang di Johan Garage. Ada yang bisa kami bantu?
```

### Menu Button:

```txt
1. Cek Servis
2. Tanya Harga
3. Booking Service
4. Bicara dengan Admin
```

### Response Menu:

#### Cek Servis

```txt
Silakan pilih jenis servis yang dibutuhkan: servis ringan, servis lengkap, atau pengecekan motor.
```

#### Tanya Harga

```txt
Untuk info harga, silakan sebutkan produk atau layanan yang ingin ditanyakan.
```

#### Booking Service

```txt
Silakan kirim nama, jenis motor, tanggal booking, dan keluhan motor.
```

#### Bicara dengan Admin

```txt
Baik kak, percakapan akan kami teruskan ke admin.
```

---

## 12. Empty State

Jika belum ada conversation, tampilkan empty state.

### Teks:

```txt
Belum ada conversation.
Buat conversation pertama Anda untuk mulai mengatur chatbot otomatis.
```

### Tombol:

```txt
Create Conversation
```

---

## 13. Loading State

Saat data sedang dimuat, tampilkan skeleton table.

Komponen skeleton:

* Skeleton card quota
* Skeleton search input
* Skeleton table rows

---

## 14. Error State

Jika data gagal dimuat, tampilkan pesan:

```txt
Gagal memuat data conversations. Silakan coba lagi.
```

Tambahkan tombol:

```txt
Retry
```

---

## 15. Pagination

Pagination berada di bagian bawah tabel.

### Elemen:

```txt
Previous
Page number
Next
Rows per page
```

### Fungsi:

Digunakan untuk navigasi jika jumlah chatbot sudah banyak.

---

## 16. Data Dummy Awal

Gunakan data dummy berikut untuk tampilan awal:

```ts
const conversations = [
  {
    id: "conv_001",
    name: "Greeting Johan Garage",
    botResponse: 1245,
    channel: "WhatsApp - Johan Garage",
    lastUpdate: "25 Jun 2026, 14:30",
    status: "Published",
  },
  {
    id: "conv_002",
    name: "Chatbot Jam Kerja",
    botResponse: 890,
    channel: "WhatsApp - Johan Garage",
    lastUpdate: "24 Jun 2026, 09:15",
    status: "Published",
  },
  {
    id: "conv_003",
    name: "FAQ Servis Motor",
    botResponse: 320,
    channel: "Instagram DM",
    lastUpdate: "23 Jun 2026, 18:40",
    status: "Draft",
  },
  {
    id: "conv_004",
    name: "Booking Service Bot",
    botResponse: 0,
    channel: "Website Chat Widget",
    lastUpdate: "22 Jun 2026, 11:05",
    status: "Inactive",
  },
];
```

---

## 17. Komponen yang Perlu Dibuat

Buat komponen berikut:

```txt
ConversationsPage
ConversationHeader
BotResponseQuotaCard
ConversationSearchBar
ConversationTable
ConversationStatusBadge
ConversationActionsDropdown
CreateConversationModal
DeleteConversationModal
ConversationPagination
EmptyConversationState
```

---

## 18. Alur Interaksi

### Create Conversation

1. User klik tombol Create Conversation.
2. Modal atau halaman builder terbuka.
3. User mengisi nama conversation.
4. User memilih channel.
5. User memilih trigger.
6. User mengisi pesan awal.
7. User menambahkan menu interaktif.
8. User memilih Save as Draft atau Publish.
9. Data baru muncul di tabel.

---

### Edit Conversation

1. User klik Actions.
2. Pilih Edit.
3. Sistem membuka detail conversation.
4. User mengubah data.
5. User klik Save Changes.
6. Last update diperbarui.

---

### Duplicate Conversation

1. User klik Actions.
2. Pilih Duplicate.
3. Sistem membuat salinan flow.
4. Nama conversation baru diberi suffix:

```txt
Copy
```

Contoh:

```txt
Greeting Johan Garage Copy
```

---

### Deactivate Conversation

1. User klik Actions.
2. Pilih Deactivate.
3. Status berubah dari Published menjadi Inactive.
4. Bot berhenti berjalan sementara.

---

### Delete Conversation

1. User klik Actions.
2. Pilih Delete.
3. Tampilkan confirmation modal.
4. Jika user konfirmasi, hapus data conversation dari tabel.

---

## 19. Desain UI

Gunakan style modern dashboard.

### Rekomendasi style:

* Background: clean light atau dark dashboard
* Card dengan rounded corner
* Table rapi dan readable
* Badge status jelas
* Button primary untuk Create Conversation
* Dropdown actions minimalis
* Search input dengan icon search
* Empty state dengan icon bot/chat

---

## 20. Acceptance Criteria

Fitur dianggap selesai jika:

* Halaman Conversations tampil dengan rapi.
* Bot Response Quota muncul.
* User bisa mencari conversation.
* Tabel menampilkan data chatbot.
* Status badge tampil sesuai status.
* Dropdown actions tersedia di setiap row.
* Create Conversation dapat membuka modal/form.
* User bisa menambah conversation baru.
* User bisa duplicate conversation.
* User bisa deactivate conversation.
* User bisa delete conversation dengan confirmation modal.
* Pagination tersedia.
* Empty state, loading state, dan error state tersedia.


jangan buat fitur Conversation ini tercampur dengan fitur FAQ, Ticket, Booking, atau Knowledge Base