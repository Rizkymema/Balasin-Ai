# INPUT CHECKLIST

## Tujuan

Dokumen ini menjelaskan dengan jelas mana data yang harus diisi manual oleh owner/admin, mana yang diisi lewat dashboard, dan mana yang baru diperlukan saat project masuk ke mode production.

Login saat ini masih **demo**, sesuai keputusan project saat ini.

## Ringkasan Cepat

### Anda isi sendiri

- `SESSION_SECRET`
- Token dan credential channel nyata
- Data bisnis asli

### Dashboard yang dipakai untuk input harian

- Profil workspace
- Public app URL
- Worker secret
- AI provider production
- FAQ
- Knowledge base documents
- Produk dan layanan
- Customer
- Booking
- Ticket
- Automation rules
- Channel settings non-secret

## 1. Wajib Diisi Sendiri di `.env.local`

File yang dipakai:

- `.env.local`

Field minimal:

```env
SESSION_SECRET=isi-dengan-random-secret-yang-panjang
```

Penjelasan:

- `SESSION_SECRET`
  - Secret untuk session/auth.
  - Wajib Anda isi sendiri.
  - Jangan pakai secret pendek atau mudah ditebak.

## 2. Wajib Diisi Sendiri untuk Channel Nyata

Data ini bersifat rahasia atau spesifik ke akun bisnis Anda, jadi memang harus Anda isi sendiri.

### WhatsApp

Yang Anda siapkan:

- `Phone Number ID`
- `Permanent Access Token`
- `Verify Token`
- Label/identitas nomor bisnis

Tempat isi:

- Dashboard `Channels`

### Instagram

Yang Anda siapkan:

- `Instagram Username`
- `Instagram Account ID`
- `Meta Access Token`

Tempat isi:

- Dashboard `Channels`

## 3. AI Production Sekarang Bisa Diisi dari Dashboard

Bagian ini belum wajib jika Anda masih fokus ke dashboard dan alur data.

Kalau Anda ingin AI production aktif, isi dari dashboard `AI Agent`.

Contoh yang nanti Anda tentukan:

- API key LLM provider
- Model yang dipakai
- Vector store / retrieval provider
- Konfigurasi embedding / ingestion

Contoh provider:

- OpenAI
- OpenRouter
- Anthropic
- Gemini
- Supabase Vector
- Pinecone
- PostgreSQL + pgvector

## 4. Diisi Lewat Dashboard

Bagian ini tidak perlu Anda isi di file manual. Cukup lewat dashboard.

### Profil Workspace

Isi dari halaman:

- `Settings`

Data yang perlu diisi:

- Nama bisnis
- Industri
- Deskripsi bisnis
- Alamat
- Jam operasional
- Timezone
- Bahasa utama
- Email support

### Runtime Dashboard

Isi dari halaman:

- `Settings` -> `Runtime`

Data yang perlu diisi:

- Public App URL
- Worker Secret

### AI Provider Production

Isi dari halaman:

- `AI Agent`

Data yang perlu diisi:

- Provider
- API key
- Model utama
- Embedding model
- Base URL jika perlu
- Vector store

### Knowledge Base

Isi dari halaman:

- `Knowledge Base`

Data yang perlu diisi:

- FAQ asli bisnis
- Dokumen pendukung
- URL website yang ingin dijadikan sumber jawaban

Contoh dokumen:

- daftar harga
- SOP layanan
- katalog produk
- syarat garansi
- alur booking

### Produk dan Layanan

Isi dari halaman:

- `Products & Services`

Data yang perlu diisi:

- Nama produk
- SKU
- Kategori
- Brand
- Harga
- Stok
- Kompatibilitas
- Deskripsi
- Status

Untuk layanan:

- Nama layanan
- Kategori
- Harga mulai
- Harga akhir
- Durasi
- Deskripsi
- Status

### Customer / CRM

Isi dari halaman:

- `Customers`

Data yang bisa Anda isi:

- Nama customer
- Channel utama
- Lead status
- Assigned admin/operator
- Nomor telepon
- Email
- Username
- Segment
- Tags
- Catatan internal

### Booking

Isi dari halaman:

- `Booking`

Data yang bisa Anda isi:

- Nama customer
- Nama layanan
- Tanggal
- Slot
- Channel
- Status booking
- Teknisi / PIC
- Cabang
- Catatan

### Ticket

Isi dari halaman:

- `Tickets`

Data yang bisa Anda isi:

- Nama customer
- Jenis issue
- Channel
- Priority
- Status
- Assigned admin
- Ringkasan ticket
- Resolution note

### Automation

Isi dari halaman:

- `Automation`

Data yang bisa Anda isi:

- Handoff threshold
- Follow-up delay
- Booking reminder hours
- Spam guard
- Sentiment guard
- Rule automation

### Channel Settings Non-Secret

Isi dari halaman:

- `Channels`

Data yang bisa Anda atur:

- Status channel
- Web chat welcome message
- Widget color
- Capture lead
- Handoff to WhatsApp
- Auto reply toggle
- Comment guard
- Comment-to-DM behavior

## 5. Mana yang Tidak Bisa Saya Isi Otomatis

Bagian berikut tidak bisa saya isi otomatis tanpa data dari Anda:

- Secret session asli
- Token/API key asli
- Nomor bisnis asli
- Account ID asli
- Dokumen bisnis asli
- FAQ bisnis asli
- Harga dan stok asli
- SOP internal bisnis Anda

Alasannya:

- Data tersebut bersifat rahasia
- Data tersebut spesifik ke bisnis Anda
- Sistem tidak boleh menebak credential production

## 6. Rekomendasi Urutan Pengisian

Urutan paling aman:

1. Isi `.env.local` untuk `SESSION_SECRET`
2. Isi profil workspace
3. Isi `Settings` -> `Runtime`
4. Isi `AI Agent` jika mau provider production
5. Isi FAQ dan knowledge base
6. Isi produk dan layanan
7. Isi channel configuration
8. Isi automation rules
9. Test inbound/outbound channel dari dashboard

## 7. Minimal Agar Bisa Mulai Dipakai

Minimal supaya dashboard mulai usable:

- `SESSION_SECRET`
- Profil workspace dasar
- Minimal 3 FAQ
- Minimal 3 produk atau layanan
- Minimal 1 channel aktif untuk testing

## 8. Status Saat Ini

Saat ini project sudah mendukung:

- Input operasional utama dari dashboard
- CRUD customer
- CRUD booking
- CRUD ticket
- CRUD produk
- CRUD layanan
- Dashboard checklist untuk melihat bagian yang belum lengkap

Yang masih bergantung pada input Anda:

- `SESSION_SECRET`
- Credential channel production
- Knowledge bisnis asli
- Credential AI production
