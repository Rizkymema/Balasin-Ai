# 📱 Panduan Integrasi WhatsApp Bot & Dashboard Scan QR Code

Panduan ini menjelaskan cara mengintegrasikan **Evolution API** ke dalam sistem website chatbot Anda, sehingga pengguna dapat membuat sesi WhatsApp, melihat QR Code (barcode) langsung dari website, melakukan scan, dan mendaftarkan webhook secara otomatis.

---

## 🛠️ LANGKAH 1: Setup Evolution API di Server (Docker Compose / Docker Run)

Penggunaan `docker-compose.yml` **tidak wajib**, tetapi sangat direkomendasikan agar pengelolaan container lebih mudah. Anda juga bisa menggunakan perintah Docker biasa (`docker run`) atau menjalankan Evolution API tanpa Docker.

Pilih salah satu metode di bawah ini untuk menjalankan Evolution API dengan konfigurasi **CORS** aktif (wajib diaktifkan agar browser website Anda dapat memanggil API ini secara langsung):

### Opsi A: Menggunakan Docker Compose (Direkomendasikan)
Tambahkan service berikut ke file `docker-compose.yml` Anda, lalu jalankan `docker-compose up -d`:

```yaml
version: '3.8'

services:
  evolution-api:
    image: atendareceita/evolution-api:v2.1.1
    container_name: jorg-wa-gateway
    restart: unless-stopped
    ports:
      - "8085:8080"
    environment:
      - PORT=8080
      - DATABASE_ENABLED=false
      - CACHE_REDIS_ENABLED=false
      - API_KEY=JohanGarageWA2026SecretKey
      - LOG_LEVEL=ERROR
      # --- KONFIGURASI CORS (BATASI HANYA UNTUK DOMAIN WEBSITE ANDA) ---
      - CORS_ENABLED=true
      # Ganti '*' dengan domain website chatbot Anda agar tidak bisa diakses dari website lain!
      # Contoh: - CORS_ORIGIN=https://johangarage.com atau https://n8n-jorg.duckdns.org
      - CORS_ORIGIN=https://n8n-jorg.duckdns.org
      - CORS_METHODS=GET,POST,PUT,DELETE,OPTIONS
      - CORS_HEADERS=Content-Type,apikey,Authorization
    networks:
      - johan-network

networks:
  johan-network:
    external: true
```

### Opsi B: Menggunakan Docker Run (Tanpa docker-compose.yml)
Jika Anda tidak ingin menggunakan file Compose, Anda bisa langsung menjalankan perintah satu baris berikut di terminal server Anda (ganti `https://n8n-jorg.duckdns.org` dengan domain website chatbot Anda):

```bash
docker run -d \
  --name jorg-wa-gateway \
  --restart unless-stopped \
  -p 8085:8080 \
  -e PORT=8080 \
  -e DATABASE_ENABLED=false \
  -e CACHE_REDIS_ENABLED=false \
  -e API_KEY=JohanGarageWA2026SecretKey \
  -e LOG_LEVEL=ERROR \
  -e CORS_ENABLED=true \
  -e CORS_ORIGIN="https://n8n-jorg.duckdns.org" \
  -e CORS_METHODS="GET,POST,PUT,DELETE,OPTIONS" \
  -e CORS_HEADERS="Content-Type,apikey,Authorization" \
  atendareceita/evolution-api:v2.1.1
```

*Catatan: Ganti `johan-network` dengan nama network internal n8n/bot Anda.*

---

## 🌐 LANGKAH 2: Kode Dashboard HTML/JS untuk Website Chatbot

Berikut adalah kode lengkap HTML + CSS + JS yang dapat Anda pasang langsung di website dashboard admin Anda. 
Kode ini sudah mendukung:
1. Menyimpan konfigurasi secara lokal di browser (`localStorage`).
2. Membuat/menghubungkan instance WhatsApp secara dinamis.
3. Menampilkan QR Code/Barcode langsung di layar.
4. Melakukan pengecekan status koneksi secara otomatis (polling).
5. Mendaftarkan Webhook untuk n8n/chatbot dengan sekali klik.

Buat file baru bernama `whatsapp_dashboard.html` atau salin kode berikut ke halaman dashboard chatbot Anda:

```html
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>WhatsApp Integration Dashboard</title>
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <style>
        :root {
            --bg-primary: #0b0f19;
            --bg-secondary: #111827;
            --bg-card: #1f2937;
            --accent: #3b82f6;
            --accent-hover: #2563eb;
            --success: #10b981;
            --warning: #f59e0b;
            --danger: #ef4444;
            --text-main: #f3f4f6;
            --text-muted: #9ca3af;
            --border: #374151;
        }

        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
            font-family: 'Outfit', sans-serif;
            transition: all 0.3s ease;
        }

        body {
            background-color: var(--bg-primary);
            color: var(--text-main);
            padding: 2rem;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
        }

        .container {
            width: 100%;
            max-width: 950px;
            background: rgba(17, 24, 39, 0.7);
            backdrop-filter: blur(16px);
            border: 1px solid var(--border);
            border-radius: 24px;
            padding: 2.5rem;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
        }

        h1 {
            font-size: 2rem;
            font-weight: 700;
            background: linear-gradient(135deg, #60a5fa, #3b82f6);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            margin-bottom: 0.5rem;
        }

        .subtitle {
            color: var(--text-muted);
            margin-bottom: 2rem;
            font-size: 1rem;
        }

        .grid {
            display: grid;
            grid-template-columns: 1.2fr 1fr;
            gap: 2.5rem;
        }

        @media (max-width: 768px) {
            .grid {
                grid-template-columns: 1fr;
            }
        }

        /* Form Styling */
        .form-group {
            margin-bottom: 1.25rem;
        }

        label {
            display: block;
            font-size: 0.875rem;
            font-weight: 500;
            color: var(--text-muted);
            margin-bottom: 0.5rem;
        }

        input {
            width: 100%;
            padding: 0.75rem 1rem;
            background: var(--bg-card);
            border: 1px solid var(--border);
            border-radius: 12px;
            color: var(--text-main);
            font-size: 0.95rem;
        }

        input:focus {
            outline: none;
            border-color: var(--accent);
            box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.25);
        }

        /* Action Buttons */
        .btn-group {
            display: flex;
            gap: 1rem;
            margin-top: 1.5rem;
        }

        .btn {
            flex: 1;
            padding: 0.85rem;
            border: none;
            border-radius: 12px;
            font-weight: 600;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 0.5rem;
            font-size: 0.95rem;
        }

        .btn-primary {
            background: var(--accent);
            color: white;
        }

        .btn-primary:hover {
            background: var(--accent-hover);
        }

        .btn-secondary {
            background: transparent;
            border: 1px solid var(--border);
            color: var(--text-main);
        }

        .btn-secondary:hover {
            background: var(--border);
        }

        .btn-danger {
            background: rgba(239, 68, 68, 0.1);
            border: 1px solid var(--danger);
            color: var(--danger);
        }

        .btn-danger:hover {
            background: var(--danger);
            color: white;
        }

        /* Status & QR Container */
        .qr-card {
            background: var(--bg-card);
            border: 1px solid var(--border);
            border-radius: 20px;
            padding: 2rem;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            text-align: center;
            position: relative;
            min-height: 350px;
        }

        .status-badge {
            padding: 0.4rem 1rem;
            border-radius: 50px;
            font-size: 0.85rem;
            font-weight: 600;
            margin-bottom: 1.5rem;
            text-transform: uppercase;
        }

        .status-disconnected {
            background: rgba(239, 68, 68, 0.15);
            color: var(--danger);
            border: 1px solid rgba(239, 68, 68, 0.3);
        }

        .status-connecting {
            background: rgba(245, 158, 11, 0.15);
            color: var(--warning);
            border: 1px solid rgba(245, 158, 11, 0.3);
        }

        .status-connected {
            background: rgba(16, 185, 129, 0.15);
            color: var(--success);
            border: 1px solid rgba(16, 185, 129, 0.3);
        }

        .qr-placeholder {
            width: 250px;
            height: 250px;
            border: 2px dashed var(--border);
            border-radius: 16px;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            color: var(--text-muted);
            margin-bottom: 1rem;
            font-size: 0.9rem;
        }

        .qr-image {
            width: 250px;
            height: 250px;
            border-radius: 16px;
            border: 4px solid white;
            background: white;
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
            margin-bottom: 1rem;
            display: none;
        }

        /* Loading Spinner */
        .spinner {
            border: 4px solid rgba(255, 255, 255, 0.1);
            width: 40px;
            height: 40px;
            border-radius: 50%;
            border-left-color: var(--accent);
            animation: spin 1s linear infinite;
            display: none;
            margin-bottom: 1rem;
        }

        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }

        /* Notifications */
        .toast {
            position: fixed;
            bottom: 20px;
            right: 20px;
            padding: 1rem 1.5rem;
            border-radius: 12px;
            color: white;
            font-weight: 500;
            box-shadow: 0 10px 15px rgba(0,0,0,0.3);
            transform: translateY(150%);
            opacity: 0;
            z-index: 1000;
        }

        .toast.show {
            transform: translateY(0);
            opacity: 1;
        }

        .toast-success { background: var(--success); }
        .toast-error { background: var(--danger); }
        .toast-info { background: var(--accent); }
    </style>
</head>
<body>

    <div class="container">
        <h1>📱 Hubungkan WhatsApp Bot</h1>
        <p class="subtitle">Integrasikan nomor WhatsApp ke sistem chatbot dan n8n Anda secara instan.</p>

        <div class="grid">
            <!-- Left Side: Config & Actions -->
            <div>
                <div class="form-group">
                    <label for="apiUrl">Evolution API URL</label>
                    <input type="text" id="apiUrl" placeholder="Contoh: https://n8n-jorg.duckdns.org:8085">
                </div>
                
                <div class="form-group">
                    <label for="apiKey">Global API Key / Token Keamanan</label>
                    <input type="password" id="apiKey" placeholder="Masukkan API Key Global">
                </div>

                <div class="form-group">
                    <label for="instanceName">Nama Instansi (Sesi WA)</label>
                    <input type="text" id="instanceName" placeholder="Contoh: keuangan-johan">
                </div>

                <div class="form-group">
                    <label for="webhookUrl">n8n Webhook URL</label>
                    <input type="text" id="webhookUrl" placeholder="Contoh: https://n8n-jorg.duckdns.org/webhook/...">
                </div>

                <div class="btn-group">
                    <button class="btn btn-primary" onclick="initiateConnection()">
                        🔌 Hubungkan / Generate QR
                    </button>
                    <button class="btn btn-secondary" onclick="checkStatus()">
                        🔄 Cek Status
                    </button>
                </div>

                <div class="btn-group">
                    <button class="btn btn-secondary" onclick="setupWebhook()">
                        🔗 Daftarkan Webhook
                    </button>
                    <button class="btn btn-danger" onclick="logoutInstance()">
                        ⚠️ Disconnect
                    </button>
                </div>
            </div>

            <!-- Right Side: QR Display & Real-time Info -->
            <div class="qr-card">
                <div id="statusBadge" class="status-badge status-disconnected">Terputus</div>
                
                <div id="spinner" class="spinner"></div>
                
                <div id="qrPlaceholder" class="qr-placeholder">
                    <span style="font-size: 2.5rem; margin-bottom: 0.5rem;">📱</span>
                    <span>Klik tombol hubungkan untuk membuat QR Code</span>
                </div>
                
                <img id="qrImage" class="qr-image" src="" alt="WhatsApp QR Code">
                
                <p id="helperText" style="font-size: 0.875rem; color: var(--text-muted); margin-top: 1rem; max-width: 250px;">
                    Buka WhatsApp > Linked Devices > Link a Device pada ponsel Anda untuk scan.
                </p>
            </div>
        </div>
    </div>

    <!-- Alert toast -->
    <div id="toast" class="toast">Notifikasi</div>

    <script>
        // Load configurations from localStorage on load
        window.onload = function() {
            document.getElementById('apiUrl').value = localStorage.getItem('wa_api_url') || 'https://n8n-jorg.duckdns.org:8085';
            document.getElementById('apiKey').value = localStorage.getItem('wa_api_key') || 'JohanGarageWA2026SecretKey';
            document.getElementById('instanceName').value = localStorage.getItem('wa_instance') || 'keuangan-johan';
            document.getElementById('webhookUrl').value = localStorage.getItem('wa_webhook') || 'https://n8n-jorg.duckdns.org/webhook/whatsapp-keuangan';
            
            // Check status immediately
            checkStatus(true);
        };

        // Helper to save settings
        function saveSettings() {
            localStorage.setItem('wa_api_url', document.getElementById('apiUrl').value.trim());
            localStorage.setItem('wa_api_key', document.getElementById('apiKey').value.trim());
            localStorage.setItem('wa_instance', document.getElementById('instanceName').value.trim());
            localStorage.setItem('wa_webhook', document.getElementById('webhookUrl').value.trim());
        }

        // Show toast notification
        function showNotification(text, type = 'info') {
            const toast = document.getElementById('toast');
            toast.className = `toast toast-${type} show`;
            toast.innerText = text;
            setTimeout(() => {
                toast.classList.remove('show');
            }, 3500);
        }

        // Get config values
        function getConfig() {
            saveSettings();
            return {
                apiUrl: document.getElementById('apiUrl').value.trim().replace(/\/$/, ""),
                apiKey: document.getElementById('apiKey').value.trim(),
                instanceName: document.getElementById('instanceName').value.trim(),
                webhookUrl: document.getElementById('webhookUrl').value.trim()
            };
        }

        let pollingInterval = null;

        function startStatusPolling() {
            if (pollingInterval) clearInterval(pollingInterval);
            pollingInterval = setInterval(() => {
                checkStatus(false, true); // silent check status
            }, 4000);
        }

        function stopStatusPolling() {
            if (pollingInterval) {
                clearInterval(pollingInterval);
                pollingInterval = null;
            }
        }

        // Initiate WhatsApp Connection (Create instance or fetch QR)
        async function initiateConnection() {
            const { apiUrl, apiKey, instanceName } = getConfig();
            if (!apiUrl || !apiKey || !instanceName) {
                showNotification("Silakan isi semua kolom data API", "error");
                return;
            }

            // Show loading
            document.getElementById('spinner').style.display = 'block';
            document.getElementById('qrPlaceholder').style.display = 'none';
            document.getElementById('qrImage').style.display = 'none';
            document.getElementById('helperText').innerText = "Sedang menghubungkan ke server...";

            showNotification("Memulai sesi atau mengambil QR Code...", "info");

            try {
                // Step A: Coba panggil connect jika instansi sudah ada
                let connectUrl = `${apiUrl}/instance/connect/${instanceName}`;
                let response = await fetch(connectUrl, {
                    method: 'GET',
                    headers: { 'apikey': apiKey }
                });

                if (response.ok) {
                    let data = await response.json();
                    if (data.base64) {
                        displayQR(data.base64);
                        startStatusPolling();
                        return;
                    }
                }

                // Step B: Jika gagal / belum ada, buat baru
                let createUrl = `${apiUrl}/instance/create`;
                let createResponse = await fetch(createUrl, {
                    method: 'POST',
                    headers: {
                        'apikey': apiKey,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        instanceName: instanceName,
                        token: "JohanKeuanganToken2026",
                        qrcode: true
                    })
                });

                let createData = await createResponse.json();
                
                if (createResponse.ok) {
                    if (createData.qrcode && createData.qrcode.base64) {
                        displayQR(createData.qrcode.base64);
                        startStatusPolling();
                    } else {
                        // Terkoneksi tapi tidak ada QR (Mungkin statusnya sudah OPEN)
                        checkStatus();
                    }
                } else {
                    throw new Error(createData.message || "Gagal membuat instansi");
                }

            } catch (err) {
                console.error(err);
                document.getElementById('spinner').style.display = 'none';
                document.getElementById('qrPlaceholder').style.display = 'flex';
                document.getElementById('helperText').innerText = "Koneksi gagal. Cek detail API dan CORS Anda.";
                showNotification(`Gagal: ${err.message}`, "error");
            }
        }

        function displayQR(base64Data) {
            document.getElementById('spinner').style.display = 'none';
            document.getElementById('qrPlaceholder').style.display = 'none';
            
            const qrImage = document.getElementById('qrImage');
            qrImage.src = base64Data.startsWith('data:') ? base64Data : `data:image/png;base64,${base64Data}`;
            qrImage.style.display = 'block';

            document.getElementById('helperText').innerText = "QR Code siap. Silakan scan dari HP WhatsApp Anda.";
            updateStatusUI('connecting');
            showNotification("QR Code berhasil dibuat!", "success");
        }

        // Check Connection Status
        async function checkStatus(silent = false, fromPoll = false) {
            const { apiUrl, apiKey, instanceName } = getConfig();
            if (!apiUrl || !apiKey || !instanceName) {
                if (!silent) showNotification("Detail API tidak lengkap", "error");
                return;
            }

            try {
                let statusUrl = `${apiUrl}/instance/fetchInstances`;
                let response = await fetch(statusUrl, {
                    method: 'GET',
                    headers: { 'apikey': apiKey }
                });

                if (response.ok) {
                    let instances = await response.json();
                    let targetInstance = instances.find(i => 
                        (i.name === instanceName) || 
                        (i.instance && i.instance.instanceName === instanceName)
                    );

                    if (targetInstance) {
                        let state = targetInstance.connectionStatus || targetInstance.state || (targetInstance.instance && targetInstance.instance.status);
                        
                        if (state === 'open' || state === 'connected') {
                            updateStatusUI('connected');
                            document.getElementById('qrImage').style.display = 'none';
                            document.getElementById('qrPlaceholder').style.display = 'flex';
                            document.getElementById('qrPlaceholder').innerHTML = '<span style="font-size: 3.5rem; color:#10b981">✅</span><span style="font-weight:600; color:#10b981; margin-top:0.5rem">WhatsApp Terhubung</span>';
                            document.getElementById('helperText').innerText = `Terkoneksi ke nomor: ${targetInstance.ownerJid || 'N/A'}`;
                            
                            stopStatusPolling();
                            if (!silent) showNotification("WhatsApp Berhasil Terhubung!", "success");
                        } else if (state === 'connecting') {
                            updateStatusUI('connecting');
                            if (!silent) showNotification("Menunggu proses pemindaian...", "info");
                        } else {
                            updateStatusUI('disconnected');
                            if (!silent && !fromPoll) showNotification("Sesi terputus. Silakan klik Hubungkan.", "info");
                        }
                    } else {
                        updateStatusUI('disconnected');
                        if (!silent && !fromPoll) showNotification("Instansi tidak ditemukan di server.", "error");
                    }
                }
            } catch (err) {
                console.error(err);
                if (!silent) showNotification("Gagal terhubung ke API Server", "error");
            }
        }

        function updateStatusUI(status) {
            const badge = document.getElementById('statusBadge');
            badge.className = 'status-badge';
            
            if (status === 'connected') {
                badge.classList.add('status-connected');
                badge.innerText = 'Connected';
            } else if (status === 'connecting') {
                badge.classList.add('status-connecting');
                badge.innerText = 'Scan QR';
            } else {
                badge.classList.add('status-disconnected');
                badge.innerText = 'Disconnected';
            }
        }

        // Set Webhook URL to Evolution API
        async function setupWebhook() {
            const { apiUrl, apiKey, instanceName, webhookUrl } = getConfig();
            if (!apiUrl || !apiKey || !instanceName || !webhookUrl) {
                showNotification("Kolom API & Webhook URL harus diisi!", "error");
                return;
            }

            showNotification("Mendaftarkan webhook...", "info");

            try {
                let whUrl = `${apiUrl}/webhook/set/${instanceName}`;
                let response = await fetch(whUrl, {
                    method: 'POST',
                    headers: {
                        'apikey': apiKey,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        enabled: true,
                        url: webhookUrl,
                        byEvents: true,
                        events: ["messages.upsert"]
                    })
                });

                if (response.ok) {
                    showNotification("Webhook n8n Berhasil Didaftarkan!", "success");
                } else {
                    let errData = await response.json();
                    throw new Error(errData.message || "Gagal menyetel webhook");
                }
            } catch (err) {
                console.error(err);
                showNotification(`Gagal set webhook: ${err.message}`, "error");
            }
        }

        // Logout Instance
        async function logoutInstance() {
            const { apiUrl, apiKey, instanceName } = getConfig();
            if (!apiUrl || !apiKey || !instanceName) return;

            if (!confirm("Apakah Anda yakin ingin memutuskan koneksi WhatsApp?")) return;

            showNotification("Disconnecting...", "info");

            try {
                let logoutUrl = `${apiUrl}/instance/logout/${instanceName}`;
                let response = await fetch(logoutUrl, {
                    method: 'POST',
                    headers: { 'apikey': apiKey }
                });

                if (response.ok) {
                    stopStatusPolling();
                    updateStatusUI('disconnected');
                    document.getElementById('qrImage').style.display = 'none';
                    document.getElementById('qrPlaceholder').style.display = 'flex';
                    document.getElementById('qrPlaceholder').innerHTML = '<span style="font-size: 2.5rem; margin-bottom: 0.5rem;">📱</span><span>Sesi Berhasil Diputuskan</span>';
                    document.getElementById('helperText').innerText = "Silakan klik Hubungkan untuk memindai ulang.";
                    showNotification("WhatsApp berhasil diputus!", "success");
                } else {
                    showNotification("Gagal memutus sesi WhatsApp", "error");
                }
            } catch (err) {
                console.error(err);
                showNotification("Terjadi kesalahan koneksi", "error");
            }
        }
    </script>
</body>
</html>
```

---

## 🔁 LANGKAH 3: Penanganan Webhook (FastAPI Backend / n8n Workflow)

Agar bot Anda dapat merespons secara otomatis, Evolution API akan mengirimkan payload JSON ke webhook URL Anda setiap kali ada pesan masuk.

### Opsi A: Menggunakan FastAPI (Python)
Gunakan logika penanganan pesan berikut di backend Anda untuk menghindari loop (ketika bot membalas pesannya sendiri):

```python
import logging
import httpx
from fastapi import FastAPI, Request, BackgroundTasks

app = FastAPI()
logger = logging.getLogger(__name__)

# Penyimpanan memori sementara untuk melacak ID pesan yang telah dikirim bot
SENT_MESSAGE_IDS = []

WA_API_URL = "https://n8n-jorg.duckdns.org:8085"
WA_APIKEY = "JohanGarageWA2026SecretKey"
INSTANCE_NAME = "keuangan-johan"

async def send_whatsapp_message(remote_jid: str, text: str):
    """Kirim balasan chat via Evolution API"""
    url = f"{WA_API_URL}/message/sendText/{INSTANCE_NAME}"
    headers = {"apikey": WA_APIKEY, "Content-Type": "application/json"}
    payload = {
        "number": remote_jid,
        "text": text,
        "options": {"delay": 1000, "presence": "composing"}
    }
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.post(url, headers=headers, json=payload)
            resp_json = resp.json()
            # Catat ID pesan keluar
            msg_id = resp_json.get("key", {}).get("id") or resp_json.get("id")
            if msg_id:
                SENT_MESSAGE_IDS.append(str(msg_id))
                if len(SENT_MESSAGE_IDS) > 1000:
                    SENT_MESSAGE_IDS.pop(0)
    except Exception as exc:
        logger.exception("Gagal mengirim balasan ke %s: %s", remote_jid, exc)

@app.post("/webhook/whatsapp-keuangan")
async def handle_webhook(request: Request, background_tasks: BackgroundTasks):
    payload = await request.json()
    
    # Hanya tangani pesan baru masuk
    if payload.get("event") != "messages.upsert":
        return {"status": "ignored"}
        
    data = payload.get("data", {})
    key = data.get("key", {})
    msg_id = key.get("id", "")
    from_me = key.get("fromMe", False)
    
    # 1. Proteksi Loop: Abaikan jika pesan dikirim oleh bot itu sendiri
    if msg_id in SENT_MESSAGE_IDS:
        return {"status": "ignored"}
        
    # 2. Ekstrak pesan teks
    message_content = data.get("message", {})
    text = ""
    if "conversation" in message_content:
        text = message_content["conversation"]
    elif "extendedTextMessage" in message_content:
        text = message_content["extendedTextMessage"].get("text", "")
    elif "imageMessage" in message_content:
        text = message_content["imageMessage"].get("caption", "")

    if not text:
        return {"status": "no_text"}

    # Jalankan proses logika balasan chatbot secara asynchronous
    background_tasks.add_task(
        process_bot_logic,
        remote_jid=key.get("remoteJid", ""),
        incoming_text=text
    )
    return {"status": "queued"}

async def process_bot_logic(remote_jid: str, incoming_text: str):
    # --- LOGIKA CHATBOT ANDA DI SINI ---
    # Contoh: Cari data di Google Sheets / AI model response
    reply_text = f"Halo! Kami telah menerima pesan Anda: '{incoming_text}'"
    await send_whatsapp_message(remote_jid, reply_text)
```

### Opsi B: Menggunakan n8n Workflow
Hubungkan webhook Anda ke alur n8n:
1. Pasang node **Webhook (HTTP)** dengan metode `POST` dan path `/webhook/whatsapp-keuangan`.
2. Di dalam n8n, buat pengecekan switch/filter untuk memastikan:
   - `body.event` bernilai `messages.upsert`.
   - `body.data.key.fromMe` bernilai `false` (agar tidak membalas chat keluar).
3. Teruskan pesan teks (`body.data.message.conversation`) ke node AI/Google Sheets, lalu balas menggunakan node **HTTP Request** ke endpoint Evolution API:
   `POST https://n8n-jorg.duckdns.org:8085/message/sendText/keuangan-johan`.

---

## 🔍 TROUBLESHOOTING & SOLUSI CORS ERROR

Jika saat mengeklik **Hubungkan** di dashboard web Anda mendapatkan error di console browser seperti *Blocked by CORS policy*:

### Solusi 1: Pastikan Variabel Lingkungan CORS di Docker Benar
Pastikan Anda sudah me-restart container dengan konfigurasi CORS yang benar:
```bash
docker-compose down
docker-compose up -d
```

### Solusi 2: Melalui Konfigurasi Reverse Proxy (Nginx)
Jika Anda menggunakan Nginx sebagai reverse proxy untuk Evolution API, pastikan header CORS diatur di konfigurasi server block Nginx Anda:
```nginx
location / {
    # Tambahkan header CORS
    add_header 'Access-Control-Allow-Origin' '*' always;
    add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS' always;
    add_header 'Access-Control-Allow-Headers' 'Content-Type, apikey, Authorization' always;

    if ($request_method = 'OPTIONS') {
        return 204;
    }

    proxy_pass http://localhost:8085; # sesuaikan port evolution api Anda
    ...
}
```
