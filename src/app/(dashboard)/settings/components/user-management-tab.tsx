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
  ChevronRight,
  X
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Dropdown } from "@/components/ui/dropdown";

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

const INITIAL_USERS: UserProfile[] = [];

const getStatusColor = (status: UserStatus) => {
  switch (status) {
    case "Online": return "bg-emerald-500";
    case "Offline": return "bg-slate-400";
    case "Away": return "bg-amber-500";
    case "Busy": return "bg-red-500";
    case "Inactive": return "bg-slate-300";
    case "Invited": return "bg-blue-500";
    default: return "bg-slate-400";
  }
};

const getRoleBadgeVariant = (role: UserRole) => {
  switch (role) {
    case "Owner": return "warning";
    case "Admin": return "default";
    case "Supervisor": return "secondary";
    case "Agent": return "success";
    case "Viewer": return "outline";
    default: return "secondary";
  }
};

export function UserManagementTab() {
  const [users, setUsers] = useState<UserProfile[]>(INITIAL_USERS);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [deptFilter, setDeptFilter] = useState("All");

  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;
  
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
      alert("Reset password link berhasil dikirim.");
    }
    
    setConfirmModal({ ...confirmModal, isOpen: false });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            User Management
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Kelola anggota tim, role, status, dan hak akses pengguna di dalam sistem.
          </p>
        </div>
        <Button onClick={() => setShowAddModal(true)} variant="primary" size="sm" className="gap-1.5">
          <UserPlus className="h-4 w-4" /> Add New User
        </Button>
      </div>

      <Card className="p-5 border-slate-200 bg-white shadow-2xs space-y-4">
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input 
              placeholder="Search users..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 text-xs w-full bg-slate-50 border-slate-200" 
            />
          </div>
          
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-slate-400 shrink-0" />
            <select 
              value={roleFilter} 
              onChange={(e) => setRoleFilter(e.target.value)}
              className="h-9 rounded-md border border-slate-200 bg-slate-50 px-3 text-xs font-semibold text-slate-900 focus:outline-none focus:border-blue-600"
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
              className="h-9 rounded-md border border-slate-200 bg-slate-50 px-3 text-xs font-semibold text-slate-900 focus:outline-none focus:border-blue-600"
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
              className="h-9 rounded-md border border-slate-200 bg-slate-50 px-3 text-xs font-semibold text-slate-900 focus:outline-none focus:border-blue-600"
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
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-2xs">
          <table className="w-full text-xs text-slate-700">
            <thead className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500 font-bold border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 text-left font-bold">Name</th>
                <th className="px-4 py-3 text-left font-bold">Contact</th>
                <th className="px-4 py-3 text-left font-bold">Role & Dept</th>
                <th className="px-4 py-3 text-left font-bold">Status</th>
                <th className="px-4 py-3 text-left font-bold">Last Active</th>
                <th className="px-4 py-3 text-right font-bold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-slate-500 text-xs font-medium">
                    {searchQuery ? "Tidak ada user yang cocok dengan pencarian." : "Belum ada user. Tambahkan user pertama untuk mulai mengelola akses tim."}
                  </td>
                </tr>
              ) : (
                paginatedUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50/70 transition">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-50 border border-blue-200 font-bold uppercase text-blue-600 text-xs">
                          {user.name.substring(0, 2)}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 text-xs">{user.name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs">
                      <div className="font-semibold text-slate-900">{user.phoneNumber}</div>
                      <div className="text-slate-500 text-[11px]">{user.email}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col items-start gap-1">
                        <Badge variant={getRoleBadgeVariant(user.role)} className="text-[9px]">
                          {user.role}
                        </Badge>
                        <span className="text-[10px] text-slate-500 font-medium">{user.department}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 font-medium text-xs">
                        <span className={`h-2 w-2 rounded-full ${getStatusColor(user.status)}`} />
                        <span>{user.status}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500 font-medium">
                      {user.lastActive}
                    </td>
                    <td className="px-4 py-3 text-right relative">
                      <Dropdown
                        align="right"
                        trigger={
                          <button className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition cursor-pointer">
                            <MoreVertical className="h-4 w-4" />
                          </button>
                        }
                        items={[
                          { label: "View Detail", icon: <Eye className="h-4 w-4" />, onClick: () => {} },
                          { label: "Edit User", icon: <Edit2 className="h-4 w-4" />, onClick: () => {} },
                          { label: "Change Role", icon: <Shield className="h-4 w-4" />, onClick: () => handleAction("role", user.id, "Admin") },
                          { label: "Reset Password", icon: <KeyRound className="h-4 w-4" />, onClick: () => handleAction("reset", user.id) },
                          { label: "Deactivate", icon: <Ban className="h-4 w-4" />, onClick: () => handleAction("deactivate", user.id), danger: true },
                          { label: "Delete User", icon: <Trash2 className="h-4 w-4" />, onClick: () => handleAction("delete", user.id), danger: true },
                        ]}
                      />
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
            <span className="text-xs text-slate-500 font-medium">
              Menampilkan {(currentPage - 1) * rowsPerPage + 1} - {Math.min(currentPage * rowsPerPage, filteredUsers.length)} dari {filteredUsers.length} users
            </span>
            <div className="flex items-center gap-1">
              <Button 
                variant="secondary"
                size="sm"
                className="h-7 w-7 p-0"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => p - 1)}
              >
                <ChevronLeft className="h-3 w-3" />
              </Button>
              <div className="px-2 text-xs text-slate-700 font-bold">{currentPage} / {totalPages}</div>
              <Button 
                variant="secondary"
                size="sm"
                className="h-7 w-7 p-0"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => p + 1)}
              >
                <ChevronRight className="h-3 w-3" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Modals */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Add New User</h3>
                <p className="text-xs text-slate-500">Undang anggota baru ke dalam tim.</p>
              </div>
              <button onClick={() => setShowAddModal(false)} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-900 cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-900">Full Name</label>
                <Input placeholder="Nama Lengkap" className="h-9 text-xs bg-slate-50" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-900">Email</label>
                <Input placeholder="Alamat Email" type="email" className="h-9 text-xs bg-slate-50" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-900">Role</label>
                <select className="w-full h-9 rounded-md border border-slate-200 bg-slate-50 px-3 text-xs font-semibold text-slate-900 focus:outline-none focus:border-blue-600">
                  <option>Admin</option>
                  <option>Agent</option>
                  <option>Supervisor</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <Button variant="secondary" size="sm" onClick={() => setShowAddModal(false)}>Cancel</Button>
              <Button variant="primary" size="sm" onClick={() => setShowAddModal(false)}>Send Invitation</Button>
            </div>
          </div>
        </div>
      )}

      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl text-center space-y-3">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-600">
              <Trash2 className="h-6 w-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">
              {confirmModal.type === "delete" ? "Delete User" : 
               confirmModal.type === "deactivate" ? "Deactivate User" :
               confirmModal.type === "role" ? "Change Role" : "Confirm Action"}
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              {confirmModal.type === "delete" ? "Apakah Anda yakin ingin menghapus user ini? Riwayat aktivitas user tetap disimpan untuk audit." :
               confirmModal.type === "deactivate" ? "User ini tidak akan bisa login lagi jika dinonaktifkan." :
               "Lanjutkan aksi ini?"}
            </p>
            <div className="flex justify-center gap-2 pt-2">
              <Button variant="secondary" size="sm" onClick={() => setConfirmModal({ ...confirmModal, isOpen: false })}>Batal</Button>
              <Button variant="destructive" size="sm" onClick={confirmAction}>Ya, Lanjutkan</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
