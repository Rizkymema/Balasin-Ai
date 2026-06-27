"use client";

import { useState, useMemo } from "react";
import {
  Search,
  Filter,
  MoreVertical,
  Edit2,
  Trash2,
  Shield,
  KeyRound,
  Eye,
  UserPlus,
  Ban,
  CheckCircle2,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type UserRole = "Owner" | "Admin" | "Supervisor" | "Agent" | "Viewer";
type UserStatus = "Online" | "Offline" | "Away" | "Busy" | "Inactive" | "Invited";

interface UserProfile {
  id: string;
  name: string;
  avatar: string;
  status: UserStatus;
  phoneNumber: string;
  email: string;
  role: UserRole;
  department: string;
  lastActive: string;
}

const DUMMY_USERS: UserProfile[] = [
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

const getStatusColor = (status: UserStatus) => {
  switch (status) {
    case "Online": return "bg-emerald-400";
    case "Offline": return "bg-slate-400";
    case "Away": return "bg-amber-400";
    case "Busy": return "bg-red-400";
    case "Inactive": return "bg-slate-600";
    case "Invited": return "bg-cyan-400";
    default: return "bg-slate-400";
  }
};

const getRoleColor = (role: UserRole) => {
  switch (role) {
    case "Owner": return "bg-fuchsia-500/10 text-fuchsia-400 border-fuchsia-500/20";
    case "Admin": return "bg-purple-500/10 text-purple-400 border-purple-500/20";
    case "Supervisor": return "bg-blue-500/10 text-blue-400 border-blue-500/20";
    case "Agent": return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
    case "Viewer": return "bg-slate-500/10 text-slate-400 border-slate-500/20";
    default: return "bg-slate-500/10 text-slate-400 border-slate-500/20";
  }
};

export function UserManagementTab() {
  const [users, setUsers] = useState<UserProfile[]>(DUMMY_USERS);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [deptFilter, setDeptFilter] = useState("All");

  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;

  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  
  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    type: "delete" | "deactivate" | "role" | "reset";
    userId: string;
    payload?: any;
  }>({ isOpen: false, type: "delete", userId: "" });

  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const matchSearch = user.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          user.phoneNumber.includes(searchQuery);
      const matchRole = roleFilter === "All" || user.role === roleFilter;
      const matchStatus = statusFilter === "All" || user.status === statusFilter;
      const matchDept = deptFilter === "All" || user.department === deptFilter;
      
      return matchSearch && matchRole && matchStatus && matchDept;
    });
  }, [users, searchQuery, roleFilter, statusFilter, deptFilter]);

  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return filteredUsers.slice(start, start + rowsPerPage);
  }, [filteredUsers, currentPage]);

  const totalPages = Math.ceil(filteredUsers.length / rowsPerPage);

  const handleAction = (type: "delete" | "deactivate" | "role" | "reset", userId: string, payload?: any) => {
    setConfirmModal({ isOpen: true, type, userId, payload });
    setActiveDropdown(null);
  };

  const confirmAction = () => {
    const { type, userId, payload } = confirmModal;
    if (type === "delete") {
      const targetUser = users.find(u => u.id === userId);
      if (targetUser?.role === "Owner" && users.filter(u => u.role === "Owner").length === 1) {
        alert("Tidak dapat menghapus Owner terakhir. Sistem harus memiliki minimal satu Owner aktif.");
        setConfirmModal({ ...confirmModal, isOpen: false });
        return;
      }
      setUsers(users.filter(u => u.id !== userId));
    } else if (type === "deactivate") {
      setUsers(users.map(u => u.id === userId ? { ...u, status: "Inactive" } : u));
    } else if (type === "role") {
      setUsers(users.map(u => u.id === userId ? { ...u, role: payload } : u));
    } else if (type === "reset") {
      // simulate sending email
      alert("Reset password link berhasil dikirim.");
    }
    
    setConfirmModal({ ...confirmModal, isOpen: false });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            User Management
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Kelola anggota tim, role, status, dan hak akses pengguna di dalam sistem.
          </p>
        </div>
        <Button onClick={() => setShowAddModal(true)} className="bg-cyan-500 text-slate-950 hover:bg-cyan-400 text-xs px-4 h-9">
          <UserPlus className="mr-1.5 h-4 w-4" /> Add New User
        </Button>
      </div>

      <div className="glass-panel rounded-xl p-6 border-white/8 space-y-4">
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input 
              placeholder="Search users..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 text-xs w-full bg-white/[0.02]" 
            />
          </div>
          
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-slate-400" />
            <select 
              value={roleFilter} 
              onChange={(e) => setRoleFilter(e.target.value)}
              className="h-9 rounded-md border border-white/10 bg-[#080c18] px-3 py-1 text-xs text-slate-300 focus:border-cyan-500 focus:outline-none"
            >
              <option value="All">All Roles</option>
              <option value="Owner">Owner</option>
              <option value="Admin">Admin</option>
              <option value="Supervisor">Supervisor</option>
              <option value="Agent">Agent</option>
              <option value="Viewer">Viewer</option>
            </select>
            
            <select 
              value={statusFilter} 
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-9 rounded-md border border-white/10 bg-[#080c18] px-3 py-1 text-xs text-slate-300 focus:border-cyan-500 focus:outline-none"
            >
              <option value="All">All Status</option>
              <option value="Online">Online</option>
              <option value="Offline">Offline</option>
              <option value="Away">Away</option>
              <option value="Busy">Busy</option>
              <option value="Inactive">Inactive</option>
              <option value="Invited">Invited</option>
            </select>

            <select 
              value={deptFilter} 
              onChange={(e) => setDeptFilter(e.target.value)}
              className="h-9 rounded-md border border-white/10 bg-[#080c18] px-3 py-1 text-xs text-slate-300 focus:border-cyan-500 focus:outline-none"
            >
              <option value="All">All Depts</option>
              <option value="Admin">Admin</option>
              <option value="Customer Service">Customer Service</option>
              <option value="Sales">Sales</option>
              <option value="Mekanik">Mekanik</option>
              <option value="Support">Support</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-xl border border-white/10">
          <table className="w-full text-sm text-slate-300">
            <thead className="bg-white/[0.02] text-[10px] uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">Name</th>
                <th className="px-4 py-3 text-left font-semibold">Contact</th>
                <th className="px-4 py-3 text-left font-semibold">Role & Dept</th>
                <th className="px-4 py-3 text-left font-semibold">Status</th>
                <th className="px-4 py-3 text-left font-semibold">Last Active</th>
                <th className="px-4 py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.05]">
              {paginatedUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-slate-500 text-sm">
                    {searchQuery ? "Tidak ada user yang cocok dengan pencarian." : "Belum ada user. Tambahkan user pertama untuk mulai mengelola akses tim."}
                  </td>
                </tr>
              ) : (
                paginatedUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-white/[0.01]">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-cyan-400/20 bg-cyan-950 font-bold uppercase text-cyan-400 text-xs">
                          {user.name.substring(0, 2)}
                        </div>
                        <div>
                          <div className="font-bold text-white text-xs">{user.name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs">
                      <div className="text-white">{user.phoneNumber}</div>
                      <div className="text-slate-500">{user.email}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col items-start gap-1">
                        <Badge className={`px-2 py-0.5 text-[9px] font-bold border ${getRoleColor(user.role)}`}>
                          {user.role}
                        </Badge>
                        <span className="text-[10px] text-slate-400">{user.department}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <span className={`h-2 w-2 rounded-full ${getStatusColor(user.status)}`} />
                        <span className="text-xs">{user.status}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-400">
                      {user.lastActive}
                    </td>
                    <td className="px-4 py-3 text-right relative">
                      <button 
                        onClick={() => setActiveDropdown(activeDropdown === user.id ? null : user.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </button>

                      {/* Dropdown Menu */}
                      {activeDropdown === user.id && (
                        <div className="absolute right-8 top-10 z-10 w-48 rounded-lg border border-white/10 bg-[#0a0e1c] shadow-xl overflow-hidden py-1">
                          <button className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-300 hover:bg-white/[0.05] hover:text-white text-left">
                            <Eye className="h-3.5 w-3.5" /> View Detail
                          </button>
                          <button className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-300 hover:bg-white/[0.05] hover:text-white text-left">
                            <Edit2 className="h-3.5 w-3.5" /> Edit User
                          </button>
                          <button 
                            onClick={() => handleAction("role", user.id, "Admin")}
                            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-300 hover:bg-white/[0.05] hover:text-white text-left"
                          >
                            <Shield className="h-3.5 w-3.5" /> Change Role
                          </button>
                          <button 
                            onClick={() => handleAction("reset", user.id)}
                            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-300 hover:bg-white/[0.05] hover:text-white text-left"
                          >
                            <KeyRound className="h-3.5 w-3.5" /> Reset Password
                          </button>
                          <div className="h-px bg-white/10 my-1" />
                          <button 
                            onClick={() => handleAction("deactivate", user.id)}
                            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-amber-400 hover:bg-amber-500/10 text-left"
                          >
                            <Ban className="h-3.5 w-3.5" /> Deactivate
                          </button>
                          <button 
                            onClick={() => handleAction("delete", user.id)}
                            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-400 hover:bg-red-500/10 text-left"
                          >
                            <Trash2 className="h-3.5 w-3.5" /> Delete User
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-2">
            <span className="text-xs text-slate-500">
              Menampilkan {(currentPage - 1) * rowsPerPage + 1} - {Math.min(currentPage * rowsPerPage, filteredUsers.length)} dari {filteredUsers.length} users
            </span>
            <div className="flex items-center gap-1">
              <Button 
                variant="secondary"
                className="h-7 w-7 text-xs border-white/10 bg-transparent text-slate-400 hover:text-white hover:bg-white/5"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => p - 1)}
              >
                <ChevronLeft className="h-3 w-3" />
              </Button>
              <div className="px-2 text-xs text-slate-300 font-semibold">{currentPage} / {totalPages}</div>
              <Button 
                variant="secondary"
                className="h-7 w-7 text-xs border-white/10 bg-transparent text-slate-400 hover:text-white hover:bg-white/5"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => p + 1)}
              >
                <ChevronRight className="h-3 w-3" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Modals placeholders */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0a0e1c] p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white">Add New User</h3>
            <p className="mt-1 text-xs text-slate-400">Undang anggota baru ke dalam tim.</p>
            <div className="mt-4 space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-300">Full Name</label>
                <Input placeholder="Nama Lengkap" className="mt-1 h-9 text-xs" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-300">Email</label>
                <Input placeholder="Alamat Email" type="email" className="mt-1 h-9 text-xs" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-300">Role</label>
                <select className="mt-1 w-full h-9 rounded-md border border-white/10 bg-[#080c18] px-3 py-1 text-xs text-slate-300 focus:border-cyan-500 focus:outline-none">
                  <option>Admin</option>
                  <option>Agent</option>
                  <option>Supervisor</option>
                </select>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <Button variant="secondary" className="h-9 px-4 text-xs text-slate-400 hover:text-white" onClick={() => setShowAddModal(false)}>Cancel</Button>
              <Button className="h-9 px-4 text-xs bg-cyan-500 text-slate-950 hover:bg-cyan-400" onClick={() => setShowAddModal(false)}>Send Invitation</Button>
            </div>
          </div>
        </div>
      )}

      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#0a0e1c] p-6 shadow-2xl text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10">
              <Trash2 className="h-6 w-6 text-red-400" />
            </div>
            <h3 className="text-lg font-bold text-white">
              {confirmModal.type === "delete" ? "Delete User" : 
               confirmModal.type === "deactivate" ? "Deactivate User" :
               confirmModal.type === "role" ? "Change Role" : "Confirm Action"}
            </h3>
            <p className="mt-2 text-sm text-slate-400">
              {confirmModal.type === "delete" ? "Apakah Anda yakin ingin menghapus user ini? Riwayat aktivitas user tetap disimpan untuk audit." :
               confirmModal.type === "deactivate" ? "User ini tidak akan bisa login lagi jika dinonaktifkan." :
               "Lanjutkan aksi ini?"}
            </p>
            <div className="mt-6 flex justify-center gap-3">
              <Button variant="secondary" className="h-9 px-4 text-xs text-slate-400 hover:text-white" onClick={() => setConfirmModal({ ...confirmModal, isOpen: false })}>Batal</Button>
              <Button className="h-9 px-4 text-xs bg-red-500 hover:bg-red-400 text-white" onClick={confirmAction}>Ya, Lanjutkan</Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
