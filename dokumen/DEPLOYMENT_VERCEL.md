# Deployment Guide - Vercel
sekarang buatkan agar data yang ada pada 
## Setup untuk Vercel

Proyek Balesin Desk sudah dikonfigurasi untuk deploy ke Vercel dengan file konfigurasi berikut:
- `vercel.json` - Konfigurasi deployment
- `.vercelignore` - Files yang di-skip saat deployment

## Langkah-langkah Deployment

### 1. Connect Repository ke Vercel

```bash
# Opsi A: Via Vercel CLI
npm i -g vercel
vercel login
vercel
```

Atau

**Opsi B: Via Vercel Web Dashboard**
- Buka https://vercel.com
- Klik "Add New..." → "Project"
- Import GitHub repository: `Rizkymema/Balasin-Ai`
- Vercel akan auto-detect Next.js project

### 2. Atur Environment Variables di Vercel

Di Vercel Dashboard → Settings → Environment Variables, tambahkan:

```env
NEXT_PUBLIC_APP_NAME=Balesin Desk
NEXT_PUBLIC_APP_URL=https://yourdomain.vercel.app
SESSION_COOKIE_NAME=balesin_session
SESSION_SECRET=your-very-secure-random-secret-here
WORKER_SECRET=your-very-secure-random-secret-here
AUTH_ALLOWED_EMAILS=admin@yourdomain.com
AUTH_ALLOWED_DOMAINS=
WEBCHAT_WEBHOOK_SECRET=your-very-secure-webchat-secret-here
WHATSAPP_BASE_URL=https://graph.facebook.com
WHATSAPP_API_VERSION=v21.0
```

**Catatan Penting:**
- Jangan gunakan default `balesin-demo-*` di production
- Isi `AUTH_ALLOWED_EMAILS` atau `AUTH_ALLOWED_DOMAINS` sebelum mengaktifkan Google login production.
- Isi `WEBCHAT_WEBHOOK_SECRET` dan kirim token tersebut dari widget/webhook webchat.
- Generate secret yang aman:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```
- Copy output dan gunakan untuk `SESSION_SECRET` dan `WORKER_SECRET`

### 3. Deploy

```bash
# Via CLI
vercel --prod

# Atau langsung push ke main/master branch, Vercel akan auto-deploy
git push origin master
```

## Catatan Penting untuk Vercel

### Database & Storage
- **SQLite tidak persisten** di Vercel (ephemeral filesystem)
- Untuk production, gunakan salah satu opsi:
  - **PostgreSQL** (recommended): Deploy database terpisah
  - **Prisma + Planetscale**: Managed MySQL
  - **MongoDB Atlas**: NoSQL alternative
  - **Vercel Storage (Beta)**: Use Vercel's blob/kv storage

**Untuk saat ini** (development/demo):
- Database akan reset setiap deployment
- Data hanya tersimpan dalam session request
- Install `@vercel/kv` untuk persistent cache jika diperlukan

### Troubleshooting

#### Build Error: "ENOENT: no such file or directory, open 'data/balesin.sqlite'"
✅ **Solution**: Sudah di-handle dengan conditional initialization di `src/server/db.ts`

#### Timeout Error di Build
- Max function duration: 30 detik (sesuai `vercel.json`)
- API routes lebih dari 30s akan timeout
- Gunakan Background Jobs untuk long-running tasks

#### Environment Variable Missing
- Pastikan semua variables sudah di-set di Vercel Dashboard
- Rebuild project setelah ubah variables:
```bash
vercel --prod --force
```

## Test Deployment

```bash
# Test build lokal dengan Vercel CLI
vercel build

# Test production build
vercel dev
```

## Links Useful

- Docs: https://vercel.com/docs
- Vercel Limits: https://vercel.com/docs/concepts/limits/overview
- Next.js on Vercel: https://nextjs.org/docs/deployment/vercel

---

**Next Steps untuk Production-Ready:**
1. ✅ Deploy ke Vercel
2. Setup custom domain
3. Migrate ke persistent database
4. Setup CI/CD pipeline
5. Add monitoring & logging
6. Setup backup strategy
