# Setup Supabase

Project ini sekarang mendukung Supabase sebagai database utama.

## Env yang dipakai

```env
NEXT_PUBLIC_SUPABASE_URL=https://cykgkflnafcsaehirobi.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_z5CXvcct2eDX_vrsKFynbQ_7x-_2ufK
SUPABASE_SERVICE_ROLE_KEY=
```

Catatan:
- `NEXT_PUBLIC_SUPABASE_URL` dan `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` sudah cukup untuk mode dasar.
- `SUPABASE_SERVICE_ROLE_KEY` sangat direkomendasikan untuk production yang lebih aman.

## Langkah setup

1. Buka Supabase project Anda.
2. Masuk ke `SQL Editor`.
3. Jalankan isi file [schema.sql](/d:/Project%20Apk-Web/chatbotAI/supabase/schema.sql).
4. Tambahkan env Supabase ke `.env.local`.
5. Tambahkan env yang sama ke Vercel Project Settings.
6. Redeploy aplikasi.

## Tabel yang dipakai aplikasi

- `app_config`
- `knowledge_faqs`
- `knowledge_documents`
- `knowledge_chunks`
- `conversations`
- `customers`
- `bookings`
- `tickets`
- `products`
- `services`
- `broadcasts`
- `jobs`
- `webhook_events`

## Prioritas storage

Urutan storage sekarang:

1. Supabase
2. Vercel Blob
3. SQLite lokal

Jadi jika env Supabase aktif, dashboard akan memakai Supabase sebagai source of truth utama.
