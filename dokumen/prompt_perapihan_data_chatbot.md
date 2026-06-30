# 📋 Prompt AI Untuk Perapihan Data Chatbot (JSON & Google Sheets)

Gunakan prompt di bawah ini pada AI (seperti Gemini, ChatGPT, atau Claude) untuk merapikan data mentah bisnis Anda. Prompt ini dirancang khusus untuk menghasilkan **data murni untuk menjawab pertanyaan** (FAQ, Produk, Jasa, & Kata Kunci Handoff) yang akan disimpan di Google Sheets atau Database, **tanpa menyertakan teks instruksi sistem/cara bot berbicara** (karena instruksi sistem diatur langsung di dalam dashboard/sistem chatbot).

---

## 🚀 Salin Prompt Di Bawah Ini:

```markdown
Anda adalah seorang Data Engineer dan AI Content Specialist profesional. Tugas Anda adalah merapikan, membersihkan, dan menata data mentah bisnis berikut agar siap digunakan sebagai database/Google Sheets Chatbot AI.

Penting: Chatbot ini menggunakan instruksi sistem (system prompt/persona) yang terpisah di dalam kodingan. Data yang Anda rapikan di sini HARUS murni berupa data tanya-jawab, katalog harga, dan pemicu kata kunci operasional (TIDAK boleh mengandung teks instruksi/perintah cara bot bekerja).

Pilihlah salah satu format output yang diminta oleh user: **Format JSON** ATAU **Format Tabel Google Sheets** (kolom dipisah dengan karakter Tab atau berupa tabel Markdown agar bisa dicopy-paste langsung ke Google Sheets).

---

### 📋 SKEMA SUSUNAN DATA TARGET:

#### 1. KATEGORI KNOWLEDGE BASE (FAQ Murni - Untuk Menjawab Pertanyaan)
* **Format Google Sheets (Kolom Header):**
  `Category` | `Question` | `Answer` | `Keywords (pisahkan dengan koma)`

* **Format JSON Schema:**
```json
[
  {
    "category": "string (kategori topik)",
    "question": "string (pertanyaan natural pelanggan)",
    "answer": "string (jawaban lengkap & informatif untuk dikirim ke pelanggan)",
    "keywords": ["string (frasa pemicu 1)", "string (frasa pemicu 2)"]
  }
]
```

---

#### 2. KATEGORI PRODUCTS (Katalog Harga & Stok Sparepart Fisik)
* **Format Google Sheets (Kolom Header):**
  `Product ID` | `Name` | `SKU` | `Category` | `Brand` | `Price` | `Stock` | `Compatibility (pisahkan dengan koma)` | `Description` | `Status` | `Source`

* **Format JSON Schema:**
```json
[
  {
    "id": "string (prefix 'prod_')",
    "name": "string",
    "sku": "string",
    "category": "string",
    "brand": "string",
    "price": "number (angka harga murni)",
    "stock": "number (angka stok)",
    "compatibility": ["string", "string"],
    "description": "string",
    "status": "string ('active'/'out_of_stock')",
    "source": "string ('postgresql'/'google_sheets')"
  }
]
```

---

#### 3. KATEGORI SERVICES (Katalog Harga & Durasi Jasa)
* **Format Google Sheets (Kolom Header):**
  `Service ID` | `Name` | `Category` | `Price Start` | `Price End` | `Duration (Minutes)` | `Description` | `Status` | `Source`

* **Format JSON Schema:**
```json
[
  {
    "id": "string (prefix 'svc_')",
    "name": "string",
    "category": "string",
    "price_start": "number",
    "price_end": "number",
    "duration_minutes": "number (durasi dalam menit)",
    "description": "string",
    "status": "string ('active'/'draft')",
    "source": "string ('postgresql'/'google_sheets')"
  }
]
```

---

#### 4. KATEGORI SAFETY RULES (Kata Kunci Sensitif untuk Eskalasi Admin)
* **Format Google Sheets (Kolom Header):**
  `Keyword` | `Category` | `Action` | `Response Message` | `Is Active`

* **Format JSON Schema:**
```json
[
  {
    "keyword": "string (kata kunci pemicu, misal: 'komplain', 'marah', 'refund')",
    "category": "string (misal: 'finance', 'complaint')",
    "action": "string ('handoff_to_admin')",
    "response_message": "string (pesan otomatis penenang sebelum ditransfer ke admin)",
    "is_active": "boolean"
  }
]
```

---

### ⚠️ INSTRUKSI PERAPIHAN DATA:
1. **Fokus pada Konten Jawaban**: Jangan memasukkan kalimat instruksi sistem/logika pemicu (seperti *"Jika ditanya ini, maka..."* atau *"Jawablah dengan gaya..."*) ke dalam kolom `Answer` atau tabel database. Kolom `Answer` harus 100% berisi **kalimat jawaban langsung yang siap dibaca oleh pelanggan**.
2. **Aturan Angka & Harga**: Nominal uang (`Price`, `Price Start`, `Price End`) dan jumlah (`Stock`, `Duration`) harus berupa **angka murni** (tanpa Rp, titik ribuan, atau teks menit/pcs).
3. **Pemisah Sel Jamak**: Kolom seperti `Keywords` atau `Compatibility` di Google Sheets digabungkan dalam satu sel menggunakan pemisah koma.

---

### 📥 DATA MENTAH YANG HARUS DIRAPIKAN:
[TEMPELKAN DATA MENTAH ANDA DI SINI]

---

### 📤 FORMAT OUTPUT YANG SAYA INGINKAN:
[Pilih salah satu: "Berikan output berupa Tabel Markdown untuk Google Sheets" ATAU "Berikan output berupa JSON array"]
```
