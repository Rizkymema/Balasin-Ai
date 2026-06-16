# Cara Penggunaan Dashboard Balesin Desk

Dokumen ini menjelaskan cara memakai dashboard Balesin Desk versi yang ada di repo saat ini. Fokusnya adalah penggunaan operasional harian untuk admin, CS, dan owner.

## 1. Tujuan Dashboard

Dashboard ini dipakai untuk:

- melihat semua percakapan customer dari satu tempat
- mengatur AI assistant dan knowledge base
- mengelola customer, produk, layanan, booking, ticket, dan broadcast
- menyambungkan channel seperti WhatsApp, Instagram, dan web chat
- menjalankan automation dan worker dari dashboard
- membaca laporan operasional dasar

## 2. Cara Akses

### Local

1. Jalankan project:

```bash
npm install
copy .env.example .env.local
npm run dev
```

2. Buka:

```text
http://localhost:3000/login
```

### Production

Jika sudah deploy ke Vercel, buka domain production Anda. Contoh domain yang sedang aktif saat dokumen ini dibuat:

```text
https://balasin-ai-tau.vercel.app/login
```

## 3. Login Dashboard

Versi saat ini masih memakai login demo.

Cara masuk:

1. Buka halaman login.
2. Isi email apa pun.
3. Isi password apa pun.
4. Klik `Masuk Sekarang`.

Catatan:

- Login sekarang hanya memeriksa bahwa email dan password tidak kosong.
- Ini cocok untuk demo, testing alur, dan validasi dashboard.
- Untuk production penuh, auth masih perlu diganti ke sistem login yang proper.

## 4. Alur Setup Awal yang Disarankan

Urutan setup yang paling aman:

1. `Settings`
   Isi nama workspace, email support, business hours, alamat, `Public App URL`, dan `Worker Secret`.
2. `Knowledge Base`
   Isi profil bisnis, FAQ, URL website, dan upload dokumen penting.
3. `Products & Services`
   Isi katalog produk, sparepart, dan layanan yang akan dipakai AI saat menjawab.
4. `AI Assistant`
   Atur tone, threshold confidence, fallback message, blacklist, dan provider AI bila diperlukan.
5. `Channels`
   Sambungkan WhatsApp, Instagram, dan web chat.
6. `Automation`
   Atur handoff threshold, follow-up delay, booking reminder, dan rule aktif.
7. `Inbox`
   Gunakan untuk operasional harian, takeover manual, dan ticketing.

## 5. Ringkasan Menu Dashboard

Dashboard utama yang tersedia saat ini:

- `Dashboard`
- `Unified Inbox`
- `Contacts / CRM`
- `AI Assistant`
- `Knowledge Base`
- `Products & Services`
- `Booking`
- `Tickets`
- `Automation`
- `Broadcast / Campaign`
- `Channels`
- `Reports`
- `Team & Settings`

## 6. Cara Pakai per Modul

### 6.1 Dashboard

Halaman ini dipakai untuk melihat snapshot operasional.

Yang bisa dilakukan:

- melihat jumlah percakapan, ticket, produk, layanan, dan channel aktif
- melihat checklist setup yang belum lengkap
- membuka modul penting dari kartu shortcut

Gunakan halaman ini sebagai halaman kontrol awal sebelum operasional harian dimulai.

### 6.2 Unified Inbox

Halaman ini adalah pusat kerja CS/admin.

Fungsi utama:

- melihat semua percakapan customer
- filter status: `Semua`, `AI Aktif`, `Butuh Admin`, `Menunggu`, `Selesai`, `Spam`
- mencari chat berdasarkan nama, isi pesan, atau tag
- membalas chat manual
- pause AI
- aktifkan AI kembali
- ambil alih chat ke admin
- membuat ticket dari percakapan
- menandai chat selesai
- menyimpan catatan private

Cara pakai:

1. Buka `Inbox`.
2. Klik percakapan di panel kiri.
3. Lihat isi percakapan di panel tengah.
4. Gunakan aksi cepat di header chat:
   - `Ambil alih chat`
   - `Pause AI`
   - `Aktifkan AI`
   - `Buat ticket`
   - `Tandai selesai`
5. Jika perlu balasan manual, ketik pesan di input bawah lalu kirim.
6. Simpan catatan internal di panel kanan.

Catatan status:

- `AI Aktif`: AI masih boleh membalas
- `AI Pause`: AI ditahan sementara
- `Butuh Admin`: percakapan harus ditangani manusia
- `Menunggu Customer`: sistem menunggu balasan customer
- `Selesai`: percakapan sudah ditutup
- `Spam`: percakapan ditandai tidak perlu ditindaklanjuti

### 6.3 Contacts / CRM

Modul ini dipakai untuk melihat dan mengelola data customer.

Gunakan untuk:

- melihat daftar customer
- menyimpan histori dasar interaksi
- membantu segmentasi lead dan follow-up

Praktiknya, modul ini menjadi referensi saat admin ingin tahu siapa customer yang sedang dibalas di inbox.

### 6.4 AI Assistant

Modul ini dipakai untuk mengatur perilaku AI.

Yang bisa diatur:

- nama AI
- bahasa
- tone
- confidence threshold
- fallback message
- blacklist
- auto reply aktif/nonaktif
- safety mode
- provider AI, model, dan vector store

Gunakan modul ini jika:

- AI terlalu agresif membalas
- AI terlalu sering handoff
- Anda ingin mengubah gaya bahasa balasan
- Anda ingin menyalakan provider AI non-demo

### 6.5 Knowledge Base

Knowledge Base adalah sumber jawaban AI.

Tab yang tersedia:

- `Tanya Jawab (FAQ)`
- `Profil Bisnis`
- `Dokumen & Sumber`

Cara pakai:

#### FAQ

- tambah FAQ baru
- hapus FAQ yang tidak relevan
- cari FAQ berdasarkan pertanyaan/jawaban

#### Profil Bisnis

Isi data:

- nama bisnis
- industri
- alamat
- jam operasional
- deskripsi bisnis
- daftar URL sumber informasi

#### Dokumen & Sumber

Upload file seperti:

- SOP
- daftar harga
- dokumen layanan
- panduan internal
- FAQ tambahan

Format yang diterima:

- PDF
- DOCX
- TXT
- MD
- CSV
- JSON
- HTML

Setelah upload berhasil, dokumen masuk ke knowledge pipeline dashboard.

### 6.6 Products & Services

Modul ini dipakai untuk menyimpan data produk, sparepart, dan layanan.

Gunakan untuk:

- mengisi nama produk
- harga
- stok atau status ketersediaan
- daftar layanan servis
- konteks yang dipakai AI saat menjawab pertanyaan harga/produk

Saran penggunaan:

- isi data sespesifik mungkin
- jangan biarkan AI menjawab harga jika katalog belum rapi

### 6.7 Booking

Modul ini dipakai untuk mengelola booking customer.

Gunakan untuk:

- melihat daftar booking
- membaca status booking
- membantu follow-up customer yang ingin servis

Agar booking lebih berguna, isi juga:

- layanan
- customer
- jadwal
- status booking

### 6.8 Tickets

Modul ini dipakai untuk kasus yang perlu handoff atau penanganan manual.

Gunakan untuk:

- membuat ticket dari inbox
- melacak kasus komplain atau kasus teknis
- menandai progress penyelesaian

Saran:

- buat ticket saat percakapan sudah masuk kategori komplain, high risk, atau butuh admin teknis

### 6.9 Automation

Modul ini adalah panel kontrol automation dan worker.

Yang bisa diatur:

- aktif/nonaktif rule
- handoff threshold
- follow-up delay
- booking reminder
- spam guard
- sentiment guard

Yang bisa dilakukan:

- menyimpan rule automation
- melihat preview efek rule
- menjalankan worker manual
- melihat job queue terbaru

Cara pakai:

1. Buka `Automation`.
2. Aktifkan rule yang diperlukan.
3. Atur nilai threshold dan delay.
4. Klik `Simpan automation`.
5. Gunakan `Run worker` jika ingin mengeksekusi queue tanpa menunggu scheduler.

### 6.10 Broadcast / Campaign

Modul ini dipakai untuk kampanye pesan.

Gunakan untuk:

- menyusun campaign
- menjadwalkan broadcast
- melihat status campaign dasar

Karena fitur ini masih baseline, gunakan untuk pengujian alur operasional terlebih dahulu.

### 6.11 Channels

Modul ini dipakai untuk menyambungkan channel masuk dan keluar.

Channel yang tersedia:

- `Website Live Chat`
- `WhatsApp Cloud API`
- `Instagram DM & Comment`

#### Website Live Chat

Yang bisa diatur:

- warna widget
- welcome text
- lead capture
- handoff ke WhatsApp
- embed code

Gunakan embed code yang tersedia untuk menanam widget ke website.

#### WhatsApp Cloud API

Yang bisa diisi:

- label nomor bisnis
- `Phone Number ID`
- `Permanent access token`
- `Verify token`
- auto reply aktif/nonaktif

Dashboard akan menampilkan:

- `Callback URL`
- `Verify Token`

Gunakan data itu untuk setup webhook di Meta/Facebook Developer.

Contoh callback URL production:

```text
https://domain-anda.com/api/webhooks/whatsapp
```

#### Instagram

Yang bisa diisi:

- username
- account ID
- access token
- auto reply DM
- comment guard
- comment to DM

#### Test Channel

Modul Channels juga punya test panel untuk:

- simulasi inbound message
- test outbound message

Ini berguna untuk validasi alur tanpa menunggu webhook provider benar-benar aktif.

### 6.12 Reports / Analytics

Halaman ini dipakai untuk melihat ringkasan data operasional.

Metric yang tersedia saat ini:

- total pesan masuk
- AI auto-reply rate
- eskalasi ke admin
- average first response
- breakdown channel
- open tickets
- jumlah percakapan yang aman untuk AI

Gunakan halaman ini untuk:

- melihat performa awal AI
- melihat beban handoff admin
- membaca distribusi channel

### 6.13 Settings

Halaman `Settings` dipakai untuk konfigurasi workspace dan runtime.

Tab yang tersedia:

- `Workspace`
- `Runtime`
- `Tim & Anggota`
- `Notifikasi`

#### Workspace

Isi:

- nama workspace
- industri
- email support
- deskripsi
- alamat
- jam operasional
- timezone
- bahasa default

#### Runtime

Isi:

- `Public App URL`
- `Worker Secret`

`Public App URL` penting karena dipakai untuk:

- callback URL webhook
- script web chat
- base URL beberapa integrasi dashboard

#### Tim & Anggota

Gunakan untuk:

- melihat anggota tim
- undang anggota baru
- hapus anggota

#### Notifikasi

Gunakan untuk mengatur:

- email digest
- notifikasi handoff instan
- laporan mingguan

## 7. Penggunaan Harian yang Disarankan

Alur kerja admin/CS yang disarankan:

1. Buka `Dashboard`
   Cek checklist setup dan snapshot hari ini.
2. Buka `Inbox`
   Balas chat baru, takeover percakapan yang perlu admin, lalu buat ticket bila perlu.
3. Buka `Tickets`
   Tangani kasus komplain, teknis, atau follow-up yang belum selesai.
4. Buka `Booking`
   Cek permintaan booking baru dan update statusnya.
5. Buka `Automation`
   Jalankan worker jika perlu follow-up, reminder, atau queue.
6. Buka `Analytics`
   Pantau performa AI dan volume handoff.

## 8. Testing yang Bisa Dilakukan dari Dashboard

Testing yang paling cepat:

1. Login ke dashboard.
2. Buka `Channels > WhatsApp` atau `Channels > Instagram`.
3. Gunakan `Simulasi inbound`.
4. Pastikan percakapan baru muncul di `Inbox`.
5. Balas dari inbox.
6. Ubah status menjadi `Butuh Admin`, `Pause AI`, atau `Selesai`.
7. Buat ticket dari percakapan.
8. Jalankan `Automation > Run worker`.
9. Lihat perubahan data di `Analytics`.

## 9. Webhook dan Integrasi

Endpoint penting:

- `POST /api/webhooks/webchat`
- `GET|POST /api/webhooks/whatsapp`
- `POST /api/webhooks/instagram`
- `POST /api/workers/run`

Catatan:

- WhatsApp `GET` dipakai untuk verifikasi webhook.
- Kredensial channel masih diisi dari dashboard.
- `SESSION_SECRET` tetap dikelola dari environment server.

## 10. Batasan Versi Saat Ini

Dokumen ini mengikuti implementasi repo saat ini, jadi ada beberapa batasan:

- login masih mode demo
- SQLite lokal masih dipakai untuk runtime lokal
- jika jalan di Vercel, storage runtime masih bersifat ephemeral
- signature verification webhook provider belum aktif
- role & permission detail belum production-ready
- beberapa modul masih baseline operasional, belum full enterprise

## 11. Rekomendasi Setelah Dashboard Dipakai

Setelah dashboard stabil dipakai untuk demo/internal, prioritas berikutnya:

1. ganti auth demo ke auth production
2. pindahkan storage ke database persisten
3. aktifkan signature validation untuk webhook
4. tambahkan role dan permission yang lebih detail
5. sambungkan provider AI production dan retrieval yang lebih kuat

## 12. Lokasi File Terkait

Dokumen ini melengkapi dokumen lain di repo:

- `README.md`
- `DEPLOYMENT_VERCEL.md`
- `dokumen/INPUT_CHECKLIST.md`
- `fitur.md`
- `flow.md`

