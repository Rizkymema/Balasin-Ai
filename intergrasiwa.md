# Dokumentasi Integrasi WhatsApp & Instagram – Balesin AI

## Ringkasan

Dokumen ini menjelaskan cara menghubungkan channel WhatsApp Business dan Instagram Business ke dashboard Balesin AI menggunakan **Meta Embedded Signup** (OAuth one-click), sehingga tidak perlu copy-paste token manual.

---

## Daftar Isi

1. [Prasyarat](#1-prasyarat)
2. [Cara Setup Meta App](#2-cara-setup-meta-app)
3. [Konfigurasi Environment Variable](#3-konfigurasi-environment-variable)
4. [Flow Koneksi WhatsApp (OAuth)](#4-flow-koneksi-whatsapp-oauth)
5. [Flow Koneksi Instagram (OAuth)](#5-flow-koneksi-instagram-oauth)
6. [Cara Kerja Teknis di Dalam Sistem](#6-cara-kerja-teknis-di-dalam-sistem)
7. [Setup Manual (Advanced)](#7-setup-manual-advanced)
8. [Webhook Callback URL](#8-webhook-callback-url)
9. [Troubleshooting](#9-troubleshooting)

---

## 1. Prasyarat

Sebelum bisa menggunakan tombol **Connect via Facebook**, pastikan hal-hal berikut:

### Untuk WhatsApp:
- Anda memiliki akun **Facebook Business Manager** (`business.facebook.com`)
- Anda memiliki **WhatsApp Business Account (WABA)** yang aktif, atau bersedia membuat yang baru
- Nomor telepon yang akan diverifikasi belum terdaftar di WhatsApp Business lain

### Untuk Instagram:
- Akun Instagram Anda bertipe **Business** atau **Creator** (bukan Personal)
- Akun Instagram sudah **terhubung ke halaman Facebook** milik bisnis Anda
- Anda adalah Admin halaman Facebook tersebut

### Untuk Sistem (Developer):
- Anda punya akun di `developers.facebook.com`
- URL aplikasi Anda sudah menggunakan **HTTPS** (Vercel, ngrok, atau domain sendiri)
- Environment variable `NEXT_PUBLIC_META_APP_ID` dan `META_APP_SECRET` sudah diisi

---

## 2. Cara Setup Meta App

### Langkah A: Buat App di Meta Developer

1. Buka [developers.facebook.com/apps](https://developers.facebook.com/apps)
2. Klik **Create App**
3. Pilih type app: **Business**
4. Isi nama app, email kontak, lalu klik **Create App**

### Langkah B: Tambahkan Produk WhatsApp

1. Di dashboard app, klik **Add Product**
2. Cari **WhatsApp** → klik **Set Up**
3. Di menu kiri akan muncul: **WhatsApp > Configuration**

### Langkah C: Aktifkan Embedded Signup

1. Di menu kiri, klik **WhatsApp > Configuration**
2. Scroll ke bagian **Embedded Signup**
3. Aktifkan dan ikuti instruksi Meta untuk review (Development Mode tidak butuh review)

### Langkah D: Tambahkan Produk Instagram (opsional)

1. Di dashboard app, klik **Add Product**
2. Cari **Instagram Graph API** → klik **Set Up**

### Langkah E: Ambil App ID dan App Secret

1. Buka **App Settings > Basic**
2. Salin **App ID** (ini akan diisi ke `NEXT_PUBLIC_META_APP_ID`)
3. Klik **Show** pada App Secret, salin (ini akan diisi ke `META_APP_SECRET`)

---

## 3. Konfigurasi Environment Variable

Tambahkan dua variable berikut ke file `.env.local` (untuk lokal) dan ke Vercel Environment Variables (untuk production):

```env
# Meta App ID (boleh publik, dipakai oleh Facebook SDK di browser)
NEXT_PUBLIC_META_APP_ID=123456789012345

# Meta App Secret (RAHASIA, hanya dipakai di server)
META_APP_SECRET=abcdef1234567890abcdef1234567890
```

> ⚠️ **Jangan pernah expose `META_APP_SECRET` ke client/browser.** Variable ini hanya boleh ada di server-side code.

---

## 4. Flow Koneksi WhatsApp (OAuth)

### Cara User Menghubungkan WhatsApp:

```
Dashboard → Menu: Channels → Tab: WhatsApp
→ Klik tombol biru "Connect via Facebook"
→ Popup Facebook Login muncul
→ User login ke akun Facebook Business
→ Pilih Business Portfolio yang ingin digunakan
→ Buat WABA baru atau pilih yang sudah ada
→ Verifikasi nomor telepon WhatsApp
→ Klik "Finish" di wizard Meta
→ Popup tertutup
→ Sistem otomatis menyimpan Phone Number ID & Access Token
→ Status channel berubah jadi: ● Connected ✅
```

### Apa yang Terjadi di Balik Layar:

```
1. FB SDK dipanggil: FB.login({ scope: "whatsapp_business_management,..." })
2. User menyelesaikan wizard Meta → callback berisi short-lived token
3. Frontend mengirim POST /api/channels/whatsapp/connect dengan short-lived token
4. Server menukar token: graph.facebook.com/oauth/access_token → long-lived token
5. Server memanggil: graph.facebook.com/me/businesses → ambil WABA ID
6. Server memanggil: graph.facebook.com/{waba_id}/phone_numbers → ambil Phone Number ID
7. Server mengembalikan: { phoneNumberId, accessToken, wabaId, businessName }
8. Frontend menyimpan ke dashboardConfig (localStorage)
9. Status channel: "connected", webhook otomatis aktif
```

---

## 5. Flow Koneksi Instagram (OAuth)

### Cara User Menghubungkan Instagram:

```
Dashboard → Menu: Channels → Tab: Instagram
→ Klik tombol gradient "Connect Instagram via Facebook"
→ Popup Facebook Login muncul
→ User login ke akun Facebook
→ Pilih halaman Facebook yang terhubung ke Instagram Business
→ Berikan permission: DM, Comment, Pages
→ Popup tertutup
→ Sistem otomatis menyimpan Instagram Account ID & Access Token
→ Status channel berubah jadi: ● Connected ✅
```

### Apa yang Terjadi di Balik Layar:

```
1. FB SDK dipanggil: FB.login({ scope: "instagram_basic,instagram_manage_messages,..." })
2. User memberikan permission → callback berisi short-lived token
3. Frontend mengirim POST /api/channels/instagram/connect dengan short-lived token
4. Server menukar token → long-lived token
5. Server memanggil: graph.facebook.com/me/accounts?fields=instagram_business_account
6. Server menemukan halaman Facebook yang punya Instagram Business Account
7. Server mengembalikan: { accountId, accessToken, username, pageId }
8. Frontend menyimpan ke dashboardConfig
9. Status channel: "connected"
```

---

## 6. Cara Kerja Teknis di Dalam Sistem

### File-File yang Terlibat:

| File | Fungsi |
|------|--------|
| `src/hooks/use-meta-connect.ts` | Hook utama: load FB SDK, trigger popup, kirim token ke server |
| `src/app/api/channels/whatsapp/connect/route.ts` | Server: tukar token + ambil Phone Number ID |
| `src/app/api/channels/instagram/connect/route.ts` | Server: tukar token + ambil IG Account ID |
| `src/app/(dashboard)/channels/page.tsx` | UI: tombol connect, status card, collapsible advanced |

### Struktur Data yang Disimpan (WhatsApp):

```json
{
  "channels": {
    "whatsapp": {
      "enabled": true,
      "status": "connected",
      "businessLabel": "Johan Garage WA",
      "phoneNumberId": "123456789012345",
      "accessToken": "EAABwzLixnjYBO...",
      "verifyToken": "balesin_verify",
      "webhookUrl": "https://yourdomain.com/api/webhooks/whatsapp",
      "autoReply": true
    }
  }
}
```

### Struktur Data yang Disimpan (Instagram):

```json
{
  "channels": {
    "instagram": {
      "enabled": true,
      "status": "connected",
      "username": "johangarage.id",
      "accountId": "17841400000000000",
      "accessToken": "EAABwzLixnjYBO...",
      "verifyToken": "balesin_verify",
      "autoReplyDm": true,
      "commentGuard": true,
      "commentToDm": true
    }
  }
}
```

---

## 7. Setup Manual (Advanced)

Form manual tetap tersedia di dalam **collapsible section** ("Setup manual / Konfigurasi Advanced") di bawah tombol OAuth.

Gunakan setup manual jika:
- Anda tidak ingin menggunakan OAuth dan sudah punya token dari Meta Developer Console
- Anda ingin override token yang sudah di-set via OAuth
- Perlu debugging konfigurasi secara langsung

### Data yang Dibutuhkan untuk Setup Manual:

**WhatsApp:**
- **Label nomor bisnis** — nama bisnis Anda (hanya untuk tampilan)
- **Phone Number ID** — dari Meta Developer > WhatsApp > Configuration
- **Permanent access token** — System User Token dari Meta Business Suite
- **Verify token** — string bebas yang sama dengan yang diisi di Meta webhook setup

**Instagram:**
- **Username Instagram** — `@namaakun` tanpa `@`
- **Instagram Account ID** — dari Meta Developer > Instagram Graph API
- **Meta access token** — Page Access Token yang punya permission IG
- **Verify token** — string bebas yang sama dengan yang diisi di Meta webhook setup

---

## 8. Webhook Callback URL

Setelah channel terhubung, daftarkan URL webhook berikut di Meta Developer:

**WhatsApp Webhook:**
```
https://yourdomain.com/api/webhooks/whatsapp
```

**Instagram Webhook:**
```
https://yourdomain.com/api/webhooks/instagram
```

> Ganti `yourdomain.com` dengan URL publik aplikasi Anda (dari Vercel atau ngrok).

### Cara Mendaftarkan Webhook di Meta Developer:

1. Buka App Anda di `developers.facebook.com/apps`
2. WhatsApp: klik **WhatsApp > Configuration > Webhooks**
3. Instagram: klik **Instagram > Webhooks**
4. Klik **Add Callback URL**
5. Isi **Callback URL** dan **Verify Token** yang sama dengan yang ada di dashboard Balesin
6. Klik **Verify and Save**
7. Subscribe ke fields: `messages`, `messaging_postbacks` (WhatsApp) atau `messages`, `comments` (Instagram)

---

## 9. Troubleshooting

### ❌ "NEXT_PUBLIC_META_APP_ID belum dikonfigurasi"
**Penyebab:** Variable environment belum diisi.  
**Solusi:** Isi `NEXT_PUBLIC_META_APP_ID` di `.env.local` atau Vercel Dashboard > Settings > Environment Variables, lalu restart server.

---

### ❌ "Gagal memuat Facebook SDK"
**Penyebab:** Script `connect.facebook.net` diblokir (VPN, browser extension, koneksi lambat).  
**Solusi:** Nonaktifkan ad-blocker atau VPN, coba di browser yang bersih (mode incognito).

---

### ❌ "Login Facebook dibatalkan atau gagal"
**Penyebab:** User menutup popup, atau belum punya akun Facebook Business.  
**Solusi:** Pastikan user memiliki akun Facebook dengan akses Business Manager. Coba lagi klik tombol Connect.

---

### ❌ "Tidak ada halaman Facebook yang terhubung ke Instagram Business Account"
**Penyebab:** Akun Instagram adalah Personal (bukan Business/Creator), atau belum terhubung ke halaman Facebook.  
**Solusi:**  
1. Di Instagram: Pengaturan > Akun > Beralih ke Akun Profesional
2. Di Facebook: Pengaturan Halaman > Instagram > Hubungkan Akun
3. Coba koneksi ulang dari dashboard

---

### ❌ Token langsung expired setelah connect
**Penyebab:** Server gagal menukar short-lived ke long-lived token, `META_APP_SECRET` salah atau belum diisi.  
**Solusi:** Verifikasi `META_APP_SECRET` di `.env.local` sudah benar (bukan yang dipublish, tapi App Secret dari Basic Settings).

---

### ❌ Webhook tidak menerima pesan setelah connect
**Penyebab:** Callback URL belum didaftarkan di Meta Developer.  
**Solusi:** Daftarkan webhook URL seperti di [bagian 8](#8-webhook-callback-url).

---

## Referensi

- [Meta Embedded Signup Docs](https://developers.facebook.com/docs/whatsapp/embedded-signup)
- [WhatsApp Cloud API Docs](https://developers.facebook.com/docs/whatsapp/cloud-api)
- [Instagram Graph API Docs](https://developers.facebook.com/docs/instagram-api)
- [Meta Webhook Docs](https://developers.facebook.com/docs/graph-api/webhooks)
