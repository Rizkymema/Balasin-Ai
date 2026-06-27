# PLAN FITUR: User Management
IGAAOo56nKZBeJBZAGFJUjJJN1BkdGEwS3ZARVG9uLXNpLTRleF9aY0Y2YUJKMDdENUdyb3pKbVZA1MFlFaF9JUldNcG5qSkVwSFAxOGduelNRVVNYOExianVVbjNxRU1VYU83UXdQRnhjQW9RUjVIMC1yTm5fb0ZALOVNNOFZAsVzBjNAZDZD

## Modul: Settings > User Management

## 1. Tujuan Fitur

Fitur **User Management** berfungsi sebagai pusat kontrol administrator untuk menambah, memantau, mengedit, dan mengelola hak akses seluruh anggota tim di dalam dashboard.

Melalui fitur ini, admin dapat:

* Menambahkan user baru.
* Mengedit data user.
* Mengatur role user.
* Melihat status online/offline user.
* Memantau informasi kontak user.
* Menonaktifkan atau menghapus akun user.
* Mengatur hak akses berdasarkan role.
* Menjaga keamanan sistem dengan prinsip least privilege.

---

## 2. Struktur Halaman

Halaman berada di:

```txt id="s4u9h8"
Settings > User Management
```

Struktur halaman:

```txt id="nzi4yy"
Header
Add New User Button
Search Users
Role / Department Filter
Users Table
Actions Dropdown
Pagination
```

---

# 3. Header Halaman

## Elemen

```txt id="fnm3vg"
Title: User Management
Description: Kelola anggota tim, role, status, dan hak akses pengguna di dalam sistem.
```

## Tombol utama

```txt id="t2hlgv"
Add New User
```

Tombol ini digunakan untuk menambahkan atau mengundang user baru ke dashboard.

---

# 4. Add New User

## 4.1 Tujuan

Fitur **Add New User** digunakan untuk membuat akun baru atau mengundang staf baru agar dapat mengakses sistem.

---

## 4.2 Field Form Add New User

```txt id="ye57vc"
Full Name
Profile Photo / Avatar
Phone Number
Email
Role
Department / Division
Password / Invite Link
Status
```

---

## 4.3 Role User

Role yang disarankan:

```txt id="sxojgf"
Owner
Admin
Supervisor
Agent
Viewer
```

---

## 4.4 Penjelasan Role

| Role       | Fungsi                                                                  |
| ---------- | ----------------------------------------------------------------------- |
| Owner      | Akses penuh ke seluruh sistem, billing, security, dan konfigurasi utama |
| Admin      | Mengelola user, setting, channel, automation, dan data operasional      |
| Supervisor | Memantau performa agen, mengatur assignment, melihat laporan            |
| Agent      | Menangani percakapan pelanggan dan menggunakan template/tag             |
| Viewer     | Hanya dapat melihat data tertentu tanpa mengubah konfigurasi            |

---

## 4.5 Status Awal User

Pilihan status saat user dibuat:

```txt id="ai8t2z"
Active
Invited
Inactive
```

---

# 5. Search & Dropdown Filter

## 5.1 Search Users

Input pencarian untuk mencari user secara cepat.

Placeholder:

```txt id="f4p56r"
Search users...
```

Search dapat mencari berdasarkan:

```txt id="h25j38"
Name
Email
Phone number
Role
Department
```

---

## 5.2 Dropdown Filter

Tambahkan filter untuk menyaring daftar user.

Filter yang disarankan:

```txt id="xevhul"
All Roles
Owner
Admin
Supervisor
Agent
Viewer
```

Filter tambahan:

```txt id="6uucbo"
All Status
Online
Offline
Active
Invited
Inactive
```

Filter department:

```txt id="rdeflp"
All Departments
Customer Service
Sales
Mekanik
Admin
Support
```

---

# 6. Users Table

## 6.1 Tujuan

Tabel digunakan untuk menampilkan daftar seluruh user secara rapi dan mudah dikelola.

---

## 6.2 Kolom Tabel

| Kolom        | Fungsi                       |
| ------------ | ---------------------------- |
| Name         | Nama lengkap dan avatar user |
| Status       | Status ketersediaan user     |
| Phone Number | Nomor telepon user           |
| Email        | Email user                   |
| Role         | Hak akses user               |
| Department   | Divisi user                  |
| Last Active  | Aktivitas terakhir user      |
| Actions      | Menu aksi pengelolaan user   |

---

# 7. Detail Kolom

## 7.1 Name

Menampilkan:

```txt id="wrfg3h"
Avatar
Full Name
Optional username
```

Contoh:

```txt id="f21ohf"
Budi Santoso
Siti Rahma
Admin Johan
```

---

## 7.2 Status

Menampilkan status ketersediaan user.

Status real-time:

```txt id="ik75tf"
Online
Offline
Away
Busy
Inactive
Invited
```

### Badge / Indicator

```txt id="u3yj67"
Online: green dot
Offline: gray dot
Away: yellow dot
Busy: red dot
Inactive: gray badge
Invited: blue badge
```

---

## 7.3 Phone Number

Menampilkan nomor telepon user.

Contoh format:

```txt id="wrsk2s"
+62 812 3456 7890
```

---

## 7.4 Email

Menampilkan alamat email user.

Contoh:

```txt id="v4vdgp"
agent@example.com
supervisor@example.com
admin@example.com
```

---

## 7.5 Role

Menampilkan role user.

Contoh:

```txt id="xcpqbi"
Admin
Supervisor
Agent
Viewer
```

Gunakan badge role agar mudah dibaca.

---

## 7.6 Department

Menampilkan divisi user.

Contoh:

```txt id="8hyx99"
Customer Service
Sales
Mekanik
Admin
Support
```

---

## 7.7 Last Active

Menampilkan waktu terakhir user aktif.

Contoh:

```txt id="7d73nh"
Online now
5 minutes ago
2 hours ago
Yesterday
```

---

# 8. Actions Dropdown

Setiap user memiliki menu actions.

## Isi Actions

```txt id="rk78s9"
View Detail
Edit User
Change Role
Reset Password
Deactivate User
Delete User
```

---

## 8.1 View Detail

Menampilkan detail user:

```txt id="bknn3n"
Profile
Role
Department
Assigned conversations
Performance summary
Login history
Activity logs
```

---

## 8.2 Edit User

Digunakan untuk mengubah:

```txt id="3ra1kp"
Full Name
Phone Number
Email
Role
Department
Profile Photo
Status
```

---

## 8.3 Change Role

Digunakan untuk memperbarui hak akses user.

Contoh:

```txt id="99c4rw"
Agent -> Supervisor
Supervisor -> Admin
Admin -> Agent
```

Perubahan role harus menampilkan confirmation modal.

---

## 8.4 Reset Password

Admin dapat mengirim link reset password ke email user.

Toast sukses:

```txt id="01bjqr"
Reset password link berhasil dikirim.
```

---

## 8.5 Deactivate User

Menonaktifkan user tanpa menghapus data.

Efek:

```txt id="4o3v05"
User tidak bisa login
Assignment baru ke user dihentikan
Riwayat percakapan tetap tersimpan
```

---

## 8.6 Delete User

Menghapus user dari sistem.

Sebelum delete, tampilkan confirmation modal.

Pesan:

```txt id="488vly"
Apakah Anda yakin ingin menghapus user ini? Riwayat aktivitas user tetap disimpan untuk audit.
```

---

# 9. Pagination

Pagination berada di bagian bawah tabel.

## Elemen

```txt id="uk2ktq"
Rows per page
Current page
Previous
Next
Total users
```

Contoh:

```txt id="xj66za"
Rows per page: 10
Page 1 of 5
```

---

# 10. Permission Matrix

Gunakan permission matrix agar akses user lebih aman.

| Feature            | Owner | Admin | Supervisor | Agent |    Viewer |
| ------------------ | ----: | ----: | ---------: | ----: | --------: |
| View users         |   Yes |   Yes |        Yes |    No | View only |
| Add user           |   Yes |   Yes |         No |    No |        No |
| Edit user          |   Yes |   Yes |    Limited |    No |        No |
| Change role        |   Yes |   Yes |         No |    No |        No |
| Deactivate user    |   Yes |   Yes |         No |    No |        No |
| Delete user        |   Yes |   Yes |         No |    No |        No |
| View activity logs |   Yes |   Yes |        Yes |    No | View only |
| Reset password     |   Yes |   Yes |         No |    No |        No |

---

# 11. Security Rules

## 11.1 Least Privilege

Jangan berikan akses Admin ke semua user.

Aturan:

```txt id="0k9bd1"
Owner hanya untuk pemilik bisnis.
Admin hanya untuk pengelola sistem.
Supervisor untuk pemimpin tim.
Agent untuk staf operasional.
Viewer untuk pengguna yang hanya perlu melihat data.
```

---

## 11.2 Sensitive Actions Confirmation

Aksi berikut wajib menggunakan confirmation modal:

```txt id="kz3a5o"
Change Role
Deactivate User
Delete User
Reset Password
```

---

## 11.3 Audit Log

Simpan log untuk perubahan penting:

```txt id="7j8cgw"
User created
User updated
Role changed
Password reset requested
User deactivated
User deleted
User login
User logout
```

---

## 11.4 Prevent Last Owner Deletion

Sistem tidak boleh menghapus atau menonaktifkan Owner terakhir.

Error message:

```txt id="s88cbx"
Tidak dapat menghapus Owner terakhir. Sistem harus memiliki minimal satu Owner aktif.
```

---

# 12. Data Dummy Awal

Gunakan data dummy berikut untuk tampilan awal:

```ts id="mif8eu"
const users = [
  {
    id: "user_001",
    name: "Rizky Admin",
    avatar: "/avatars/rizky.png",
    status: "Online",
    phoneNumber: "+62 812 3456 7890",
    email: "rizky.admin@example.com",
    role: "Owner",
    department: "Admin",
    lastActive: "Online now",
  },
  {
    id: "user_002",
    name: "Budi Santoso",
    avatar: "/avatars/budi.png",
    status: "Online",
    phoneNumber: "+62 813 2222 1111",
    email: "budi.cs@example.com",
    role: "Agent",
    department: "Customer Service",
    lastActive: "Online now",
  },
  {
    id: "user_003",
    name: "Siti Rahma",
    avatar: "/avatars/siti.png",
    status: "Away",
    phoneNumber: "+62 821 3333 4444",
    email: "siti.supervisor@example.com",
    role: "Supervisor",
    department: "Customer Service",
    lastActive: "5 minutes ago",
  },
  {
    id: "user_004",
    name: "Andi Mekanik",
    avatar: "/avatars/andi.png",
    status: "Offline",
    phoneNumber: "+62 822 5555 6666",
    email: "andi.mekanik@example.com",
    role: "Agent",
    department: "Mekanik",
    lastActive: "2 hours ago",
  },
];
```

---

# 13. Komponen yang Perlu Dibuat

Buat komponen berikut:

```txt id="sbswir"
UserManagementPage
UserManagementHeader
AddNewUserButton
UserSearchBar
UserRoleFilter
UserStatusFilter
UserDepartmentFilter
UsersTable
UserAvatar
UserStatusIndicator
UserRoleBadge
UserActionsDropdown
AddUserModal
EditUserModal
ChangeRoleModal
ResetPasswordModal
DeactivateUserModal
DeleteUserModal
UserDetailDrawer
PermissionMatrixTable
AuditLogPanel
UserPagination
EmptyUsersState
```

---

# 14. Alur Interaksi Add New User

1. User membuka halaman User Management.
2. User klik Add New User.
3. Modal form terbuka.
4. User mengisi Full Name.
5. User mengisi Phone Number.
6. User mengisi Email.
7. User memilih Role.
8. User memilih Department.
9. User memilih metode akses: Invite Link atau Password sementara.
10. User klik Save / Send Invitation.
11. User baru muncul di tabel dengan status Invited atau Active.

---

# 15. Alur Interaksi Search & Filter

1. User mengetik nama/email/phone di search box.
2. Sistem memfilter data secara real-time.
3. User memilih role filter.
4. User memilih status filter.
5. User memilih department filter.
6. Tabel hanya menampilkan user yang sesuai.

---

# 16. Alur Interaksi Change Role

1. User klik Actions pada salah satu user.
2. Pilih Change Role.
3. Modal Change Role terbuka.
4. User memilih role baru.
5. Sistem menampilkan confirmation message.
6. User klik Confirm.
7. Role user diperbarui.
8. Audit log tersimpan.

---

# 17. Alur Interaksi Deactivate User

1. User klik Actions.
2. Pilih Deactivate User.
3. Tampilkan confirmation modal.
4. User mengisi alasan opsional.
5. User klik Deactivate.
6. Status user berubah menjadi Inactive.
7. User tidak bisa login.
8. Audit log tersimpan.

---

# 18. Loading State

Saat data dimuat, tampilkan:

```txt id="pav6fm"
Skeleton header
Skeleton search and filters
Skeleton table rows
Skeleton pagination
```

---

# 19. Empty State

Jika belum ada user, tampilkan:

```txt id="zus9zy"
Belum ada user.
Tambahkan user pertama untuk mulai mengelola akses tim.
```

Tombol:

```txt id="w0aa2t"
Add New User
```

---

# 20. Error State

Jika data gagal dimuat, tampilkan pesan:

```txt id="yjjmgi"
Gagal memuat User Management. Silakan coba lagi.
```

Tombol:

```txt id="kam824"
Retry
```

---

# 21. Success State

Toast sukses:

```txt id="c65lux"
User berhasil ditambahkan.
User berhasil diperbarui.
Role user berhasil diubah.
User berhasil dinonaktifkan.
Reset password link berhasil dikirim.
```

---

# 22. Rekomendasi Operasional

## 22.1 Keamanan Role

Gunakan prinsip **least privilege**.

```txt id="85rv1f"
Jangan jadikan semua user sebagai Admin.
Berikan role sesuai kebutuhan kerja.
Role Agent cukup untuk staf operasional.
Role Supervisor cukup untuk pemimpin tim.
Role Admin hanya untuk pengelola sistem.
Role Owner hanya untuk pemilik bisnis.
```

---

## 22.2 Disiplin Status Agent

Agent harus mengubah status menjadi Offline saat:

```txt id="qf0ggf"
Jam istirahat
Selesai shift
Tidak sedang membuka dashboard
Sedang tidak siap menerima chat baru
```

Jika tidak, sistem bisa salah mendistribusikan chat ke agent yang sebenarnya tidak aktif.

---

# 23. Batasan Modul

Fitur User Management tidak boleh dicampur dengan:

```txt id="x8vwb6"
Agent Management
Inbox Settings
Conversation Builder
AI Agents
Chatbot Settings
Live Inbox
CRM Pipeline
Billing
```

User Management hanya fokus pada:

```txt id="go2x6p"
Data user
Role user
Status user
Akses user
Permission
Audit log user
Invite user
Deactivate user
Delete user
```

---

# 24. Acceptance Criteria

Fitur dianggap selesai jika:

* Halaman User Management tampil dengan header.
* Tombol Add New User tersedia.
* Search users tersedia.
* Filter role, status, dan department tersedia.
* Tabel user tampil lengkap.
* Kolom Name menampilkan avatar      nama user.
* Kolom Status menampilkan indikator Online/Offline/Away/Busy.
* Kolom Phone Number tampil.
* Kolom Email tampil.
* Kolom Role tampil sebagai badge.
* Kolom Department tampil.
* Kolom Last Active tampil.
* Actions dropdown tersedia di setiap user.
* User bisa ditambahkan.
* User bisa diedit.
* Role user bisa diubah.
* User bisa dinonaktifkan.
* User bisa dihapus dengan confirmation modal.
* Reset password bisa dikirim.
* Pagination tersedia.
* Empty, loading, error, dan success state tersedia.
* Permission matrix tersedia.
* Audit log tersimpan untuk aksi penting.
* Sistem mencegah penghapusan Owner terakhir.
