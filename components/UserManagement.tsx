import React, { useState, useEffect, useCallback } from "react";
import { Button } from "./ui/button";
import {
  signUp,
  updateUserProfileAdmin,
  deleteAuthUser,
  adminUpdatePassword,
  UserProfile,
} from "../lib/auth";
import { supabase } from "../lib/supabaseClient";
import { useToast } from "./ui/toast";

interface UserRow {
  id: string;
  email: string;
  full_name: string | null;
  role: "admin" | "nakes" | "farmasi";
  roles: string[];
  created_at: string;
  updated_at: string;
  last_sign_in_at?: string | null;
}

const ROLE_OPTIONS = [
  {
    value: "admin",
    label: "Admin",
    color:
      "bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400",
  },
  {
    value: "farmasi",
    label: "Farmasi",
    color: "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400",
  },
  {
    value: "nakes",
    label: "Nakes",
    color:
      "bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400",
  },
] as const;

type RoleValue = (typeof ROLE_OPTIONS)[number]["value"];

const isRoleValue = (role: string): role is RoleValue => {
  return role === "admin" || role === "farmasi" || role === "nakes";
};

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserRow | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState("Semua");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const { showToast } = useToast();

  // Form state for add/edit
  const [formEmail, setFormEmail] = useState("");
  const [formName, setFormName] = useState("");
  const [formRoles, setFormRoles] = useState<RoleValue[]>(["nakes"]);
  const [formPassword, setFormPassword] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      // RLS allows any logged-in user to read profiles and user_roles
      const { data: profiles, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      const { data: userRoles, error: userRolesError } = await supabase
        .from("user_roles")
        .select("user_id, role");

      if (profileError) throw profileError;
      if (userRolesError) throw userRolesError;

      const rolesMap = (userRoles || []).reduce<Record<string, string[]>>(
        (acc, item) => {
          if (!item.user_id || !item.role) return acc;
          if (!acc[item.user_id]) {
            acc[item.user_id] = [];
          }
          if (!acc[item.user_id].includes(item.role)) {
            acc[item.user_id].push(item.role);
          }
          return acc;
        },
        {},
      );

      const mergedUsers: UserRow[] = (profiles || []).map((p) => ({
        ...p,
        roles: rolesMap[p.id] || (p.role ? [p.role] : []),
      }));

      // Get last sign in from auth.users via edge function or admin API
      // For now we just use profiles data
      setUsers(mergedUsers);
    } catch (err: any) {
      setError("Gagal memuat data pengguna: " + err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Auto-dismiss messages
  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError(null);
        setSuccess(null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [error, success]);

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.full_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole =
      filterRole === "Semua" || u.roles.includes(filterRole);
    return matchesSearch && matchesRole;
  });

  const resetForm = () => {
    setFormEmail("");
    setFormName("");
    setFormRoles(["nakes"]);
    setFormPassword("");
    setNewPassword("");
    setShowPassword(false);
    setEditEmail("");
    setError(null);
  };

  const handleAdd = async () => {
    if (!formEmail || !formPassword || !formName) {
      setError("Email, nama, dan password wajib diisi.");
      return;
    }
    if (formPassword.length < 6) {
      setError("Password minimal 6 karakter.");
      return;
    }
    if (formRoles.length === 0) {
      setError("Pilih minimal satu role.");
      return;
    }

    setIsSubmitting(true);
    try {
      await signUp(formEmail, formPassword, formName, formRoles);

      // Insert profile manually in case trigger doesn't fire
      // The signUp function uses supabase.auth.signUp which should trigger the profile creation
      // But let's also upsert the profile just in case
      setSuccess(`Pengguna ${formEmail} berhasil ditambahkan!`);
      setShowAddModal(false);
      resetForm();
      // Wait a moment for the trigger to fire
      setTimeout(() => fetchUsers(), 1500);
    } catch (err: any) {
      showToast("Gagal menambah pengguna.", "error");
      console.error("Error adding user:", err);
      setError("Gagal menambah pengguna: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = async () => {
    if (!selectedUser) return;
    if (!formName) {
      setError("Nama wajib diisi.");
      return;
    }
    if (!editEmail || !editEmail.includes("@")) {
      setError("Email tidak valid.");
      return;
    }

    setIsSubmitting(true);
    try {
      await updateUserProfileAdmin(selectedUser.id, {
        full_name: formName,
        roles: formRoles,
        email: editEmail,
      });
      setSuccess(`Profil ${selectedUser.email} berhasil diperbarui!`);
      setShowEditModal(false);
      resetForm();
      fetchUsers();
    } catch (err: any) {
      setError("Gagal memperbarui pengguna: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedUser) return;

    setIsSubmitting(true);
    try {
      // Delete from auth.users (profile will cascade-delete)
      await deleteAuthUser(selectedUser.id);

      setSuccess(`Pengguna ${selectedUser.email} berhasil dihapus!`);
      setShowDeleteConfirm(false);
      setSelectedUser(null);
      fetchUsers();
    } catch (err: any) {
      setError("Gagal menghapus pengguna: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEdit = (user: UserRow) => {
    const selectedRoles = (user.roles || []).filter(isRoleValue);
    setSelectedUser(user);
    setFormName(user.full_name || "");
    setFormRoles(
      selectedRoles.length > 0 ? selectedRoles : [user.role || "nakes"],
    );
    setEditEmail(user.email);
    setShowEditModal(true);
    setError(null);
  };

  const openDelete = (user: UserRow) => {
    setSelectedUser(user);
    setShowDeleteConfirm(true);
  };

  const openResetPassword = (user: UserRow) => {
    setSelectedUser(user);
    setNewPassword("");
    setShowPassword(false);
    setShowResetPasswordModal(true);
    setError(null);
  };

  const handleChangePassword = async () => {
    if (!selectedUser) return;
    if (!newPassword) {
      setError("Password baru wajib diisi.");
      return;
    }

    setIsSubmitting(true);
    try {
      await adminUpdatePassword(selectedUser.id, newPassword);
      setSuccess(`Password ${selectedUser.full_name || selectedUser.email} berhasil diubah!`);
      setShowResetPasswordModal(false);
      setNewPassword("");
      setShowPassword(false);
    } catch (err: any) {
      setError("Gagal mengubah password: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getRoleBadges = (roles: string[]) => {
    return (
      <div className="flex flex-wrap items-center gap-1.5">
        {roles.map((role) => {
          const opt = ROLE_OPTIONS.find((r) => r.value === role);
          return (
            <span
              key={role}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${opt?.color || "bg-gray-100 text-gray-600"}`}
            >
              <span className="material-icons-round text-xs">
                {role === "admin"
                  ? "admin_panel_settings"
                  : role === "farmasi"
                    ? "medication"
                    : "health_and_safety"}
              </span>
              {opt?.label || role}
            </span>
          );
        })}
      </div>
    );
  };

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold text-text-primary-light dark:text-white">
              Manajemen Pengguna
            </h2>
            <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
              Kelola akun pengguna dan hak akses sistem.
            </p>
          </div>
          <Button
            onClick={() => {
              resetForm();
              setShowAddModal(true);
            }}
            className="bg-primary text-white px-6 py-2.5 rounded-xl font-bold shadow-lg hover:bg-blue-700 transition-all h-auto flex items-center gap-2"
          >
            <span className="material-icons-round text-base">person_add</span>
            Tambah Pengguna
          </Button>
        </div>

        {/* Toast Messages - Fixed Position */}
        {error && (
          <div className="fixed top-4 right-4 z-[60] bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 text-red-700 dark:text-red-400 px-4 py-3 rounded-xl flex items-center gap-2 animate-[fadeIn_0.3s] shadow-lg max-w-md">
            <span className="material-icons-round text-base">error</span>
            {error}
          </div>
        )}
        {success && (
          <div className="fixed top-4 right-4 z-[60] bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/30 text-green-700 dark:text-green-400 px-4 py-3 rounded-xl flex items-center gap-2 animate-[fadeIn_0.3s] shadow-lg max-w-md">
            <span className="material-icons-round text-base">check_circle</span>
            {success}
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-card-light dark:bg-card-dark rounded-2xl p-5 shadow-soft">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <span className="material-icons-round text-primary">group</span>
              </div>
              <div>
                <p className="text-2xl font-bold text-text-primary-light dark:text-white">
                  {users.length}
                </p>
                <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark">
                  Total Pengguna
                </p>
              </div>
            </div>
          </div>
          {ROLE_OPTIONS.map((role) => (
            <div
              key={role.value}
              className="bg-card-light dark:bg-card-dark rounded-2xl p-5 shadow-soft"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-xl ${role.value === "admin" ? "bg-purple-100 dark:bg-purple-500/20" : role.value === "farmasi" ? "bg-blue-100 dark:bg-blue-500/20" : "bg-green-100 dark:bg-green-500/20"} flex items-center justify-center`}
                >
                  <span
                    className={`material-icons-round ${role.value === "admin" ? "text-purple-600 dark:text-purple-400" : role.value === "farmasi" ? "text-blue-600 dark:text-blue-400" : "text-green-600 dark:text-green-400"}`}
                  >
                    {role.value === "admin"
                      ? "admin_panel_settings"
                      : role.value === "farmasi"
                        ? "medication"
                        : "health_and_safety"}
                  </span>
                </div>
                <div>
                  <p className="text-2xl font-bold text-text-primary-light dark:text-white">
                    {users.filter((u) => u.roles.includes(role.value)).length}
                  </p>
                  <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark">
                    {role.label}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Filter Bar */}
        <div className="bg-card-light dark:bg-card-dark rounded-2xl p-4 shadow-soft flex flex-wrap items-center gap-4">
          <div className="relative flex-1 min-w-[200px]">
            <span className="material-icons-round absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary-light text-lg">
              search
            </span>
            <input
              type="text"
              placeholder="Cari nama atau email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-background-dark text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
            />
          </div>
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-background-dark text-sm px-4 py-2.5 focus:ring-2 focus:ring-primary/30"
          >
            <option value="Semua">Semua Role</option>
            <option value="admin">Admin</option>
            <option value="farmasi">Farmasi</option>
            <option value="nakes">Nakes</option>
          </select>
        </div>

        {/* User Table */}
        <div className="bg-card-light dark:bg-card-dark rounded-2xl shadow-soft overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 dark:bg-white/5">
                <tr className="text-xs uppercase font-bold text-text-secondary-light dark:text-text-secondary-dark">
                  <th className="px-6 py-4">Pengguna</th>
                  <th className="px-6 py-4">Role</th>
                  <th className="px-6 py-4">Dibuat</th>
                  <th className="px-6 py-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {isLoading ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center">
                      <span className="material-icons-round text-primary text-3xl animate-spin">
                        refresh
                      </span>
                      <p className="mt-2 text-sm text-text-secondary-light">
                        Memuat data...
                      </p>
                    </td>
                  </tr>
                ) : filteredUsers.length > 0 ? (
                  filteredUsers.map((user) => (
                    <tr
                      key={user.id}
                      className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors group"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center font-bold text-primary text-sm uppercase">
                            {(user.full_name || user.email)?.[0] || "?"}
                          </div>
                          <div>
                            <p className="font-bold text-text-primary-light dark:text-white">
                              {user.full_name || "-"}
                            </p>
                            <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark">
                              {user.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">{getRoleBadges(user.roles)}</td>
                      <td className="px-6 py-4 text-sm text-text-secondary-light dark:text-text-secondary-dark">
                        {user.created_at
                          ? new Date(user.created_at).toLocaleDateString(
                            "id-ID",
                            {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            },
                          )
                          : "-"}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEdit(user)}
                            className="h-8 w-8 text-text-secondary-light hover:text-primary transition-colors"
                            title="Edit"
                          >
                            <span className="material-icons-round text-base">
                              edit
                            </span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openResetPassword(user)}
                            className="h-8 w-8 text-text-secondary-light hover:text-amber-500 transition-colors"
                            title="Reset Password"
                          >
                            <span className="material-icons-round text-base">
                              lock_reset
                            </span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openDelete(user)}
                            className="h-8 w-8 text-text-secondary-light hover:text-red-500 transition-colors"
                            title="Hapus"
                          >
                            <span className="material-icons-round text-base">
                              delete
                            </span>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center opacity-40">
                        <span className="material-icons-round text-5xl mb-2">
                          person_off
                        </span>
                        <p className="font-bold text-sm">
                          Tidak ada pengguna ditemukan.
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add User Modal */}
      {showAddModal && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setShowAddModal(false)}
        >
          <div
            className="bg-card-light dark:bg-card-dark rounded-2xl shadow-xl w-full max-w-md p-6 space-y-5 animate-[fadeIn_0.2s]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-text-primary-light dark:text-white flex items-center gap-2">
                <span className="material-icons-round text-primary">
                  person_add
                </span>
                Tambah Pengguna Baru
              </h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowAddModal(false)}
                className="h-8 w-8 hover:bg-red-50 hover:text-red-500"
              >
                <span className="material-icons-round">close</span>
              </Button>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase text-text-secondary-light">
                  Nama Lengkap
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Masukkan nama lengkap"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-background-dark text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase text-text-secondary-light">
                  Email
                </label>
                <input
                  type="email"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  placeholder="contoh@pmbanita.com"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-background-dark text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase text-text-secondary-light">
                  Password
                </label>
                <input
                  type="password"
                  value={formPassword}
                  onChange={(e) => setFormPassword(e.target.value)}
                  placeholder="Minimal 6 karakter"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-background-dark text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase text-text-secondary-light">
                  Role
                </label>
                <div className="space-y-2">
                  {ROLE_OPTIONS.map((opt) => (
                    <label
                      key={opt.value}
                      className="flex items-center gap-3 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-700/20 hover:bg-gray-50 dark:hover:bg-gray-700/30 cursor-pointer transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={formRoles.includes(opt.value)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormRoles([...formRoles, opt.value]);
                          } else {
                            const filtered = formRoles.filter((r) => r !== opt.value);
                            setFormRoles(filtered.length ? filtered : [opt.value]);
                          }
                        }}
                        className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary/30"
                      />
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${opt.color}`}
                      >
                        {opt.label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => setShowAddModal(false)}
                className="flex-1 rounded-xl font-bold h-auto py-2.5"
              >
                Batal
              </Button>
              <Button
                onClick={handleAdd}
                disabled={isSubmitting}
                className="flex-1 bg-primary text-white rounded-xl font-bold shadow-lg hover:bg-blue-700 h-auto py-2.5"
              >
                {isSubmitting ? "Menyimpan..." : "Simpan"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditModal && selectedUser && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setShowEditModal(false)}
        >
          <div
            className="bg-card-light dark:bg-card-dark rounded-2xl shadow-xl w-full max-w-md p-6 space-y-5 animate-[fadeIn_0.2s]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-text-primary-light dark:text-white flex items-center gap-2">
                <span className="material-icons-round text-primary">edit</span>
                Edit Pengguna
              </h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowEditModal(false)}
                className="h-8 w-8 hover:bg-red-50 hover:text-red-500"
              >
                <span className="material-icons-round">close</span>
              </Button>
            </div>

            <div className="bg-gray-50 dark:bg-white/5 rounded-xl p-3 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center font-bold text-primary text-sm uppercase">
                {(selectedUser.full_name || selectedUser.email)?.[0] || "?"}
              </div>
              <div>
                <p className="font-bold text-sm text-text-primary-light dark:text-white">
                  {selectedUser.email}
                </p>
                <p className="text-xs text-text-secondary-light">
                  ID: {selectedUser.id.slice(0, 8)}...
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase text-text-secondary-light">
                  Nama Lengkap
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-background-dark text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase text-text-secondary-light">
                  Email
                </label>
                <input
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  placeholder="email@contoh.com"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-background-dark text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary"
                />
                <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                  <span className="material-icons-round text-xs align-text-bottom">
                    info
                  </span>
                  Email akan diperbarui di profil. Untuk mengubah email login,
                  gunakan fitur reset password.
                </p>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase text-text-secondary-light">
                  Role
                </label>
                <div className="space-y-2">
                  {ROLE_OPTIONS.map((opt) => (
                    <label
                      key={opt.value}
                      className="flex items-center gap-3 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-700/20 hover:bg-gray-50 dark:hover:bg-gray-700/30 cursor-pointer transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={formRoles.includes(opt.value)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormRoles([...formRoles, opt.value]);
                          } else {
                            const filtered = formRoles.filter((r) => r !== opt.value);
                            setFormRoles(filtered.length ? filtered : [opt.value]);
                          }
                        }}
                        className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary/30"
                      />
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${opt.color}`}
                      >
                        {opt.label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => setShowEditModal(false)}
                className="flex-1 rounded-xl font-bold h-auto py-2.5"
              >
                Batal
              </Button>
              <Button
                onClick={handleEdit}
                disabled={isSubmitting}
                className="flex-1 bg-primary text-white rounded-xl font-bold shadow-lg hover:bg-blue-700 h-auto py-2.5"
              >
                {isSubmitting ? "Menyimpan..." : "Simpan Perubahan"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && selectedUser && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setShowDeleteConfirm(false)}
        >
          <div
            className="bg-card-light dark:bg-card-dark rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-5 animate-[fadeIn_0.2s]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center">
              <div className="w-14 h-14 rounded-full bg-red-100 dark:bg-red-500/20 flex items-center justify-center mx-auto mb-4">
                <span className="material-icons-round text-red-500 text-3xl">
                  warning
                </span>
              </div>
              <h3 className="text-lg font-bold text-text-primary-light dark:text-white">
                Hapus Pengguna?
              </h3>
              <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark mt-2">
                Anda akan menghapus profil{" "}
                <strong>{selectedUser.full_name || selectedUser.email}</strong>.
                Tindakan ini tidak dapat dibatalkan.
              </p>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 rounded-xl font-bold h-auto py-2.5"
              >
                Batal
              </Button>
              <Button
                onClick={handleDelete}
                disabled={isSubmitting}
                className="flex-1 bg-red-500 text-white rounded-xl font-bold shadow-lg hover:bg-red-600 h-auto py-2.5"
              >
                {isSubmitting ? "Menghapus..." : "Hapus"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Ubah Password Modal */}
      {showResetPasswordModal && selectedUser && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setShowResetPasswordModal(false)}
        >
          <div
            className="bg-card-light dark:bg-card-dark rounded-2xl shadow-xl w-full max-w-md p-6 space-y-5 animate-[fadeIn_0.2s]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-text-primary-light dark:text-white flex items-center gap-2">
                <span className="material-icons-round text-amber-500">
                  lock_reset
                </span>
                Ubah Password
              </h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowResetPasswordModal(false)}
                className="h-8 w-8 hover:bg-red-50 hover:text-red-500"
              >
                <span className="material-icons-round">close</span>
              </Button>
            </div>

            <div className="bg-gray-50 dark:bg-white/5 rounded-xl p-3 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center font-bold text-primary text-sm uppercase">
                {(selectedUser.full_name || selectedUser.email)?.[0] || "?"}
              </div>
              <div>
                <p className="font-bold text-sm text-text-primary-light dark:text-white">
                  {selectedUser.full_name || "-"}
                </p>
                <p className="text-xs text-text-secondary-light">
                  {selectedUser.email}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase text-text-secondary-light">
                  Password Baru
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimal 8 karakter"
                    className="w-full px-4 py-2.5 pr-12 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-background-dark text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary-light hover:text-primary transition-colors"
                  >
                    <span className="material-icons-round text-lg">
                      {showPassword ? "visibility_off" : "visibility"}
                    </span>
                  </button>
                </div>
                <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark mt-1">
                  Harus mengandung huruf besar, huruf kecil, dan angka.
                </p>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => setShowResetPasswordModal(false)}
                className="flex-1 rounded-xl font-bold h-auto py-2.5"
              >
                Batal
              </Button>
              <Button
                onClick={handleChangePassword}
                disabled={isSubmitting || !newPassword}
                className="flex-1 bg-amber-500 text-white rounded-xl font-bold shadow-lg hover:bg-amber-600 h-auto py-2.5 disabled:opacity-50"
              >
                {isSubmitting ? "Menyimpan..." : "Simpan Password"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default UserManagement;
