# PLAN FITUR: Agent Management

## Modul: Settings > Agent Management

## 1. Tujuan Fitur

Fitur **Agent Management** berfungsi sebagai pusat pengaturan tim agen/admin di dalam platform omnichannel.

Melalui fitur ini, user dapat mengatur:

* Divisi atau tim agen.
* Hak akses agen.
* Metode pembagian chat masuk.
* Batas maksimal chat per agen.
* Status idle agen.
* Hak akses broadcast.
* Keamanan data pelanggan melalui contact masking.
* Alur transfer chat antar agen.
* Integrasi custom allocation menggunakan webhook.

Fitur ini penting untuk menjaga distribusi pekerjaan tetap rapi, respons pelanggan lebih cepat, dan operasional customer service berjalan efisien.

---

## 2. Struktur Menu Agent Management

Halaman **Agent Management** memiliki beberapa tab utama:

```txt id="2b4k8m"
Division
Agent Allocation
Broadcast
Workload
Idle Rule
Contact Masking
```

Setiap tab memiliki fungsi berbeda tetapi saling berhubungan dalam pengelolaan agen.

---

# 3. Division

## 3.1 Tujuan

Tab **Division** digunakan untuk mengelompokkan agen ke dalam divisi tertentu.

Contoh divisi:

```txt id="0dnkqc"
Customer Service
Sales
Mekanik
Booking Team
Complaint Team
Admin
Supervisor
```

## 3.2 Fungsi Utama

User dapat:

* Membuat divisi baru.
* Mengedit nama divisi.
* Menambahkan agen ke dalam divisi.
* Menghapus agen dari divisi.
* Mengatur supervisor divisi.
* Menghapus divisi jika tidak digunakan.

## 3.3 Field Division

```txt id="xjn69p"
Division Name
Division Description
Assigned Agents
Supervisor
Status
```

## 3.4 Contoh Data

```ts id="pxr74u"
const divisions = [
  {
    id: "div_001",
    name: "Customer Service",
    description: "Tim utama untuk menangani pertanyaan umum pelanggan.",
    agents: 5,
    supervisor: "Admin Senior",
    status: "Active",
  },
  {
    id: "div_002",
    name: "Mekanik",
    description: "Tim teknis untuk menangani pertanyaan servis dan kerusakan motor.",
    agents: 3,
    supervisor: "Kepala Mekanik",
    status: "Active",
  },
  {
    id: "div_003",
    name: "Sales",
    description: "Tim untuk menangani penjualan produk, sparepart, dan promo.",
    agents: 4,
    supervisor: "Sales Lead",
    status: "Active",
  },
];
```

---

# 4. Agent Allocation

## 4.1 Tujuan

Tab **Agent Allocation** digunakan untuk mengatur cara sistem mendistribusikan chat pelanggan yang masuk kepada agen.

Fitur ini memastikan setiap chat memiliki penanggung jawab yang jelas dan tidak menumpuk di satu agen saja.

---

## 4.2 Field Utama

```txt id="fdw4yo"
Agent can takeover unassigned chat
Agent can assign room to another agent
Auto Agent Allocation
Custom Agent Allocation
Webhook URL
Allocation Method
Fallback Agent
```

---

## 4.3 Agent Can Takeover Unassigned Chat

### Fungsi

Jika fitur ini aktif, agen dapat mengambil sendiri chat yang belum memiliki PIC dari daftar inbox.

### Toggle label:

```txt id="skbnx4"
Allow agents to takeover unassigned chats
```

### Use case

Ketika ada chat pelanggan yang belum otomatis masuk ke agen tertentu, agen yang sedang online dapat mengambil chat tersebut secara manual.

---

## 4.4 Agent Can Assign Room to Another Agent

### Fungsi

Jika fitur ini aktif, agen dapat memindahkan atau mengoper chat pelanggan ke agen lain.

### Toggle label:

```txt id="he8t42"
Allow agents to assign chat to another agent
```

### Use case

Customer Service menerima pertanyaan teknis tentang kerusakan motor, lalu memindahkan chat ke divisi Mekanik.

---

## 4.5 Auto Agent Allocation

### Fungsi

Sistem secara otomatis membagikan chat baru kepada agen yang sedang online dan workload-nya belum penuh.

### Toggle label:

```txt id="w1jv48"
Enable Auto Agent Allocation
```

### Metode alokasi otomatis:

```txt id="70lzf4"
Round Robin
Least Active Agent
Least Workload
Random Available Agent
Priority Based
```

### Penjelasan metode:

| Metode                 | Fungsi                                               |
| ---------------------- | ---------------------------------------------------- |
| Round Robin            | Membagikan chat secara bergantian ke agen aktif      |
| Least Active Agent     | Memilih agen yang paling sedikit aktivitasnya        |
| Least Workload         | Memilih agen dengan jumlah chat aktif paling sedikit |
| Random Available Agent | Memilih agen online secara acak                      |
| Priority Based         | Memilih agen berdasarkan prioritas atau role         |

---

## 4.6 Custom Agent Allocation

### Fungsi

Custom Agent Allocation digunakan jika user ingin memakai logika pembagian chat sendiri melalui webhook eksternal.

Jika fitur ini aktif, sistem tidak menggunakan alokasi otomatis bawaan. Sistem akan mengirim data chat baru ke webhook, lalu server eksternal menentukan agen yang paling sesuai.

### Toggle label:

```txt id="0r1eu5"
Enable Custom Agent Allocation
```

### Field:

```txt id="ocv87t"
Webhook URL
Webhook Secret
Timeout
Fallback Allocation
Retry Attempt
```

---

## 4.7 Webhook URL

Input URL webhook yang akan menerima data chat baru.

### Placeholder:

```txt id="q5nskt"
https://your-domain.com/webhooks/agent-allocation
```

### Contoh payload yang dikirim ke webhook:

```json id="glf7wd"
{
  "conversation_id": "conv_001",
  "customer_name": "Rizky",
  "customer_phone": "+628xxxxxxxxxx",
  "channel": "WhatsApp",
  "message": "Saya mau booking servis motor",
  "intent": "booking_service",
  "priority": "normal",
  "created_at": "2026-06-25T14:30:00Z"
}
```

### Contoh response dari webhook:

```json id="whqwof"
{
  "assigned_agent_id": "agent_003",
  "assigned_team": "Booking Team",
  "reason": "Customer intent detected as booking service"
}
```

---

## 4.8 Fallback Allocation

Jika webhook gagal, timeout, atau tidak mengembalikan agent ID, sistem harus memiliki fallback.

### Pilihan fallback:

```txt id="rqfjau"
Assign to any available agent
Assign to default team
Keep as unassigned
Assign to supervisor
```

---

# 5. Broadcast

## 5.1 Tujuan

Tab **Broadcast** digunakan untuk mengatur hak akses agen dalam mengirim pesan massal ke pelanggan.

Fitur ini penting agar hanya agen tertentu yang bisa mengirim campaign atau broadcast.

---

## 5.2 Field Utama

```txt id="ebtxdo"
Allow agent to create broadcast
Allow agent to send broadcast
Require approval before sending
Broadcast audience limitation
Broadcast template access
```

---

## 5.3 Permission Broadcast

Role yang bisa diatur:

```txt id="mtmpks"
Admin
Supervisor
Sales
Customer Service
Agent
```

### Contoh aturan:

| Role             | Create Broadcast | Send Broadcast | Need Approval |
| ---------------- | ---------------: | -------------: | ------------: |
| Admin            |              Yes |            Yes |            No |
| Supervisor       |              Yes |            Yes |            No |
| Sales            |              Yes |             No |           Yes |
| Customer Service |               No |             No |           Yes |
| Agent            |               No |             No |           Yes |

---

# 6. Workload

## 6.1 Tujuan

Tab **Workload** digunakan untuk membatasi jumlah maksimal chat aktif yang bisa ditangani oleh satu agen.

Fitur ini mencegah agen overload dan menjaga kualitas respons.

---

## 6.2 Field Utama

```txt id="qe49nr"
Enable Workload Limit
Max Active Chats Per Agent
Max Pending Chats Per Agent
Apply Limit By Division
Overflow Rule
```

---

## 6.3 Max Active Chats

Menentukan jumlah maksimal chat aktif per agen.

### Contoh value:

```txt id="mkpoym"
5 active chats
10 active chats
15 active chats
```

---

## 6.4 Apply Limit By Division

User dapat mengatur workload berbeda untuk setiap divisi.

### Contoh:

```ts id="iuajqn"
const workloadRules = [
  {
    division: "Customer Service",
    maxActiveChats: 10,
    maxPendingChats: 20,
  },
  {
    division: "Mekanik",
    maxActiveChats: 5,
    maxPendingChats: 10,
  },
  {
    division: "Sales",
    maxActiveChats: 15,
    maxPendingChats: 25,
  },
];
```

---

## 6.5 Overflow Rule

Jika semua agen penuh, sistem harus menentukan tindakan.

### Pilihan:

```txt id="nui00v"
Keep in queue
Assign to supervisor
Assign to overflow team
Send waiting message to customer
Trigger bot response
```

### Contoh waiting message:

```txt id="1ajltp"
Mohon tunggu sebentar kak, semua admin sedang melayani pelanggan lain. Chat kakak sudah masuk antrean dan akan segera kami bantu.
```

---

# 7. Idle Rule

## 7.1 Tujuan

Tab **Idle Rule** digunakan untuk mengatur status agen secara otomatis jika agen tidak aktif dalam waktu tertentu.

Fitur ini membantu menjaga data availability agen tetap akurat.

---

## 7.2 Field Utama

```txt id="j1kn2u"
Enable Agent Idle Rule
Idle Time Threshold
Idle Status
Auto Offline
Notify Supervisor
Return Online Detection
```

---

## 7.3 Idle Time Threshold

Waktu maksimal agen tidak aktif sebelum statusnya berubah.

### Contoh value:

```txt id="t5r6ms"
5 minutes
10 minutes
15 minutes
30 minutes
```

---

## 7.4 Idle Status

Status yang diterapkan setelah agen idle.

```txt id="hpbkc7"
Away
Busy
Offline
Inactive
```

---

## 7.5 Notify Supervisor

Jika aktif, supervisor mendapat notifikasi saat agen terlalu lama idle.

### Contoh notifikasi:

```txt id="hcykxp"
Agent Budi sudah idle selama 15 menit.
```

---

# 8. Contact Masking

## 8.1 Tujuan

Tab **Contact Masking** digunakan untuk menyembunyikan data sensitif pelanggan dari layar agen.

Fitur ini penting untuk mengurangi risiko penyalahgunaan data pelanggan.

---

## 8.2 Data yang Bisa Disembunyikan

```txt id="mhe8y8"
Nomor telepon
Email
Alamat
Nomor kendaraan
Nomor invoice
Nomor member
Catatan internal tertentu
```

---

## 8.3 Masking Format

Contoh format masking:

```txt id="2pm1ym"
Phone: +62812******90
Email: r*****@gmail.com
Plate Number: DB **** XY
Invoice: INV-****-2026
```

---

## 8.4 Permission

User dapat memilih role yang boleh melihat data penuh.

```txt id="cwtymu"
Admin
Supervisor
Owner
Specific Agent
```

### Contoh aturan:

| Role       | View Full Contact | View Masked Contact |
| ---------- | ----------------: | ------------------: |
| Owner      |               Yes |                  No |
| Admin      |               Yes |                  No |
| Supervisor |               Yes |                  No |
| Agent      |                No |                 Yes |
| Sales      |                No |                 Yes |

---

# 9. Data Dummy Awal

Gunakan data dummy berikut untuk tampilan awal:

```ts id="ts0x1g"
const agentManagementSettings = {
  division: [
    {
      id: "div_001",
      name: "Customer Service",
      description: "Menangani pertanyaan umum pelanggan.",
      agents: 5,
      supervisor: "Admin Senior",
      status: "Active",
    },
    {
      id: "div_002",
      name: "Mekanik",
      description: "Menangani pertanyaan teknis servis motor.",
      agents: 3,
      supervisor: "Kepala Mekanik",
      status: "Active",
    },
    {
      id: "div_003",
      name: "Sales",
      description: "Menangani penjualan produk dan sparepart.",
      agents: 4,
      supervisor: "Sales Lead",
      status: "Active",
    },
  ],

  agentAllocation: {
    canTakeoverUnassignedChat: true,
    canAssignToAnotherAgent: true,
    autoAgentAllocation: false,
    customAgentAllocation: true,
    allocationMethod: "Custom Webhook",
    webhookUrl: "https://your-domain.com/webhooks/agent-allocation",
    webhookSecret: "***************",
    timeoutSeconds: 5,
    retryAttempt: 3,
    fallbackAllocation: "Assign to any available agent",
  },

  broadcast: {
    allowCreateBroadcast: true,
    allowSendBroadcast: true,
    requireApproval: true,
    allowedRoles: ["Admin", "Supervisor", "Sales"],
    restrictedRoles: ["Agent"],
  },

  workload: {
    enabled: true,
    defaultMaxActiveChats: 10,
    defaultMaxPendingChats: 20,
    applyByDivision: true,
    overflowRule: "Keep in queue",
  },

  idleRule: {
    enabled: true,
    idleTimeThreshold: 15,
    idleTimeUnit: "minutes",
    idleStatus: "Away",
    autoOffline: true,
    notifySupervisor: true,
  },

  contactMasking: {
    enabled: true,
    maskedFields: ["phone", "email", "plate_number", "invoice_number"],
    allowedFullViewRoles: ["Owner", "Admin", "Supervisor"],
    defaultAgentView: "Masked",
  },
};
```

---

# 10. Komponen yang Perlu Dibuat

Buat komponen berikut:

```txt id="mh0vuc"
AgentManagementPage
AgentManagementTabs
DivisionPanel
DivisionTable
CreateDivisionModal
EditDivisionModal
AgentAllocationPanel
AgentAllocationToggle
CustomAllocationWebhookForm
BroadcastPermissionPanel
BroadcastPermissionTable
WorkloadPanel
WorkloadRuleTable
IdleRulePanel
ContactMaskingPanel
MaskedFieldSelector
AgentPermissionTable
SaveSettingsButton
ResetSettingsButton
SettingsStatusBadge
ConfirmationModal
```

---

# 11. Struktur UI

Gunakan layout tab:

```txt id="suon9r"
[Division] [Agent Allocation] [Broadcast] [Workload] [Idle Rule] [Contact Masking]
```

Setiap tab memiliki:

```txt id="v5zucb"
Title
Short description
Main settings form
Save button
Reset button
Status indicator
```

---

# 12. Alur Interaksi Division

1. User membuka tab Division.
2. User melihat daftar divisi.
3. User klik Create Division.
4. User mengisi nama divisi.
5. User menambahkan deskripsi.
6. User memilih agen yang masuk ke divisi.
7. User memilih supervisor.
8. User klik Save.
9. Divisi baru muncul di tabel.

---

# 13. Alur Interaksi Agent Allocation

1. User membuka tab Agent Allocation.
2. User mengaktifkan atau mematikan takeover unassigned chat.
3. User mengatur permission assign chat ke agen lain.
4. User memilih Auto Agent Allocation atau Custom Agent Allocation.
5. Jika Auto aktif, user memilih metode alokasi.
6. Jika Custom aktif, user mengisi Webhook URL.
7. User mengatur timeout, retry, dan fallback.
8. User klik Save Settings.

---

# 14. Alur Interaksi Broadcast

1. User membuka tab Broadcast.
2. User menentukan role yang boleh membuat broadcast.
3. User menentukan role yang boleh mengirim broadcast.
4. User mengaktifkan approval sebelum broadcast dikirim.
5. User mengatur batas audience jika diperlukan.
6. User klik Save Settings.

---

# 15. Alur Interaksi Workload

1. User membuka tab Workload.
2. User mengaktifkan Workload Limit.
3. User mengatur maksimal active chats per agent.
4. User mengatur maksimal pending chats per agent.
5. User memilih apakah aturan berlaku global atau per division.
6. User mengatur overflow rule.
7. User klik Save Settings.

---

# 16. Alur Interaksi Idle Rule

1. User membuka tab Idle Rule.
2. User mengaktifkan Agent Idle Rule.
3. User mengatur idle time threshold.
4. User memilih status setelah idle.
5. User mengaktifkan auto offline jika diperlukan.
6. User mengaktifkan notify supervisor jika diperlukan.
7. User klik Save Settings.

---

# 17. Alur Interaksi Contact Masking

1. User membuka tab Contact Masking.
2. User mengaktifkan contact masking.
3. User memilih field yang ingin disembunyikan.
4. User mengatur format masking.
5. User memilih role yang boleh melihat data penuh.
6. User klik Save Settings.

---

# 18. Use Case Operasional

## Case: Chat Masuk dan Dialokasikan ke Agen

### 1. Pelanggan mengirim pesan

```txt id="o2ezg8"
Halo kak, saya mau booking servis motor besok.
```

---

### 2. Sistem membaca intent

Intent pelanggan terdeteksi sebagai:

```txt id="isnl4w"
Booking Service
```

---

### 3. Agent Allocation berjalan

Jika **Auto Agent Allocation** aktif, sistem mencari agen online dengan workload paling rendah.

Jika **Custom Agent Allocation** aktif, sistem mengirim data ke webhook eksternal.

Contoh request:

```json id="cqw601"
{
  "conversation_id": "conv_001",
  "customer_phone": "+628xxxxxxxxxx",
  "intent": "booking_service",
  "channel": "WhatsApp",
  "priority": "normal"
}
```

---

### 4. Webhook menentukan agen

Contoh response:

```json id="h3riqb"
{
  "assigned_agent_id": "agent_004",
  "assigned_team": "Booking Team",
  "reason": "Booking intent should be handled by booking team"
}
```

---

### 5. Chat masuk ke agen

Sistem menampilkan chat di inbox agen yang dipilih.

---

### 6. Jika agen penuh

Sistem menjalankan overflow rule.

Contoh:

```txt id="mbxvll"
Semua admin sedang melayani pelanggan lain. Chat pelanggan masuk ke antrean.
```

---

# 19. Loading State

Saat data dimuat, tampilkan:

```txt id="6t2tit"
Skeleton tabs
Skeleton setting cards
Skeleton table rows
Skeleton webhook form
```

---

# 20. Error State

Jika data gagal dimuat, tampilkan pesan:

```txt id="uw44k0"
Gagal memuat Agent Management. Silakan coba lagi.
```

Tambahkan tombol:

```txt id="jn9yqa"
Retry
```

---

# 21. Success State

Setelah pengaturan berhasil disimpan, tampilkan toast:

```txt id="vxow7h"
Agent Management settings berhasil disimpan.
```

---

# 22. Confirmation State

Jika user mengubah aturan penting seperti Custom Allocation, Workload, atau Contact Masking, tampilkan confirmation modal.

### Contoh pesan:

```txt id="egc1sg"
Perubahan ini dapat memengaruhi distribusi chat dan akses data pelanggan. Apakah Anda yakin ingin menyimpan perubahan?
```

---

# 23. Security Notes

Data sensitif harus disembunyikan.

### Data sensitif:

```txt id="tvhkaq"
Webhook Secret
Customer Phone
Customer Email
Customer Address
Vehicle Plate Number
Invoice Number
Internal Notes
```

### Aturan keamanan:

```txt id="ny4n0i"
Masking data pelanggan untuk role tertentu
Webhook Secret tidak boleh tampil penuh
Audit log untuk perubahan permission
Validasi URL webhook sebelum disimpan
Batasi akses contact masking hanya untuk Owner/Admin
```

---

# 24. Batasan Modul

Fitur Agent Management tidak boleh dicampur dengan:

```txt id="d2is3i"
Bot Conversation Builder
AI Agents
Chatbot Settings
Inbox Detail
Ticket Detail
Customer Database
Booking Management
Campaign Builder
```

Agent Management hanya fokus pada:

```txt id="i5s5x8"
Pengaturan divisi
Pengaturan hak akses agen
Pengaturan alokasi chat
Pengaturan workload agen
Pengaturan status idle agen
Pengaturan broadcast permission
Pengaturan contact masking
```

---

# 25. Acceptance Criteria

Fitur dianggap selesai jika:

* Halaman Agent Management tampil dengan layout tab.
* Tab Division tersedia.
* User bisa membuat, mengedit, dan menghapus division.
* User bisa mengatur agen ke dalam division.
* Tab Agent Allocation tersedia.
* User bisa mengaktifkan takeover unassigned chat.
* User bisa mengaktifkan assign chat ke agent lain.
* User bisa memilih Auto Agent Allocation.
* User bisa memilih Custom Agent Allocation.
* User bisa mengisi Webhook URL.
* User bisa mengatur fallback allocation.
* Tab Broadcast tersedia.
* User bisa mengatur permission broadcast berdasarkan role.
* Tab Workload tersedia.
* User bisa mengatur batas maksimal chat per agen.
* User bisa mengatur workload per division.
* User bisa mengatur overflow rule.
* Tab Idle Rule tersedia.
* User bisa mengatur status agen saat idle.
* User bisa mengaktifkan auto offline.
* User bisa mengaktifkan notify supervisor.
* Tab Contact Masking tersedia.
* User bisa memilih data pelanggan yang disembunyikan.
* User bisa mengatur role yang boleh melihat data penuh.
* Data sensitif seperti webhook secret dan nomor pelanggan dimasking.
* Loading, error, success, dan confirmation state tersedia.
* Semua pengaturan bisa disimpan dan dimuat ulang.
