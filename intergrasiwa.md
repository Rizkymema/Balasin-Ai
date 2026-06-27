. Buat Meta Developer App

Masuk ke:

developers.facebook.com

Lalu buat app untuk WhatsApp Business Platform.

Meta Cloud API Get Started menjelaskan setup dasar mencakup registrasi sebagai developer, membuat Meta app, mengirim pesan pertama, dan menyiapkan test webhook.

2. Tambahkan produk WhatsApp

Di app Anda, tambahkan:

WhatsApp
Facebook Login for Business
Webhooks

Embedded Signup v4 dikonfigurasi lewat Facebook Login for Business > Configurations, lalu memilih Embedded Signup sebagai login variation.

3. Buat webhook sekali saja

Anda buat endpoint backend:

https://domainanda.com/api/webhook/whatsapp

Webhook ini menerima semua pesan masuk dari nomor-nomor yang sudah connect ke sistem Anda.

Meta menjelaskan webhook WhatsApp adalah HTTP request berisi payload JSON yang dikirim server Meta ke endpoint Anda.

4. Buat tombol “Connect WhatsApp” di dashboard Anda

Contoh di dashboard:

[ Connect WhatsApp ]

Saat diklik:

Buka popup Meta Embedded Signup

Customer tidak perlu kasih token manual. Mereka cukup login Facebook dan verifikasi nomor.

5. Setelah signup selesai, backend Anda simpan data

Data yang harus disimpan:

business_id
waba_id
phone_number_id
display_phone_number
access_token / token reference
status nomor
tenant_id / user_id

Ini penting karena setiap nomor WhatsApp punya Phone Number ID sendiri.

Flow onboarding customer di sistem Anda

Misalnya Anda bikin SaaS bernama Hermes WA Gateway.

1. Customer daftar akun di website Anda
2. Customer buka dashboard
3. Klik "Connect WhatsApp"
4. Popup Meta muncul
5. Customer login Facebook
6. Customer pilih / buat Business Portfolio
7. Customer buat / pilih WhatsApp Business Account
8. Customer isi display name
9. Customer masukkan nomor aktif
10. Customer verifikasi OTP
11. Sistem Anda menerima WABA ID dan Phone Number ID
12. Backend Anda subscribe webhook ke WABA tersebut
13. Customer bisa mulai pakai inbox/chatbot di sistem Anda
Flow setelah nomor aktif
Customer kirim pesan ke nomor WA
   ↓
Meta kirim webhook ke backend Anda
   ↓
Backend Anda baca pesan
   ↓
Sistem chatbot / AI memproses
   ↓
Backend kirim balasan lewat Cloud API
   ↓
Pesan terkirim ke WhatsApp customer
Yang Anda butuhkan di sistem sendiri
Backend
/api/meta/embedded-signup/callback
/api/webhook/whatsapp
/api/send-message
/api/inbox
/api/chatbot-flow
/api/templates
Database

Minimal tabel:

users
businesses
whatsapp_accounts
phone_numbers
conversations
messages
chatbot_flows
message_templates
Dashboard

Fitur awal:

- Connect WhatsApp
- Status nomor
- Inbox chat
- Auto-reply chatbot
- Flow builder sederhana
- Riwayat pesan
- Assign ke agent
- Kirim template message
Bedanya dengan Qontak
Bagian	Pakai Qontak	Sistem sendiri
Facebook Developer	Tidak perlu Anda urus	Perlu
Meta App	Punya Qontak	Punya Anda
Embedded Signup	Disediakan Qontak	Anda buat sendiri
Webhook	Qontak yang pegang	Backend Anda
Token Meta	Qontak kelola	Anda kelola
Inbox	Qontak Inbox	Buat sendiri
Chatbot	Qontak Chatbot	Buat sendiri
Biaya	Bayar Qontak	Bayar Meta + server + development
Jadi urutan paling benar untuk Anda
Tahap 1 — Versi MVP untuk diri sendiri

Jangan langsung bikin seperti Qontak dulu. Mulai dari:

1. Buat Meta Developer App
2. Hubungkan 1 nomor WhatsApp Cloud API
3. Buat webhook backend sendiri
4. Buat inbox sederhana
5. Buat chatbot auto-reply
6. Buat tombol WhatsApp di website

Ini untuk membuktikan sistem Anda jalan.

Tahap 2 — Versi seperti Qontak

Setelah MVP jalan, baru buat:

1. Embedded Signup
2. Multi-user / multi-tenant
3. Connect WhatsApp dari dashboard
4. Simpan banyak WABA dan Phone Number ID
5. Inbox multi-agent
6. Chatbot flow builder
7. Template message manager
8. Billing / paket langganan
Kesimpulan singkat

Kalau target Anda:

“Saya mau bangun sistem sendiri tapi setup awalnya semudah Qontak”

Maka jawabannya:

Gunakan Meta Embedded Signup.

Flow akhirnya:

User dashboard Anda
→ Connect WhatsApp
→ Login Facebook
→ Pilih Business Portfolio
→ Buat WABA
→ Verifikasi nomor
→ Sistem Anda simpan Phone Number ID
→ Webhook Anda aktif
→ Chat masuk ke inbox/chatbot buatan Anda 