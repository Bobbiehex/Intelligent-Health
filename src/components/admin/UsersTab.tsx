import React, { useState } from 'react';
import { 
  Users, Search, RefreshCw, Key, UserMinus, Shield, Mail, Phone, Trash2, CheckCircle2, XCircle
} from 'lucide-react';
import { toast } from 'sonner';

interface UsersTabProps {
  users: any[];
  currentUser: any;
  token: string;
  onRefresh: () => void;
}

export default function UsersTab({ users, currentUser, token, onRefresh }: UsersTabProps) {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [editingPasswordUser, setEditingPasswordUser] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');

  // Handle update role
  const handleUpdateRole = async (userId: string, newRole: string) => {
    try {
      const res = await fetch(`/api/admin/users/${userId}/management`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ role: newRole })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update role.');
      
      toast.success(`Role updated successfully for ${data.name}`);
      onRefresh();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  // Handle active status toggle
  const handleToggleStatus = async (userId: string, currentStatus: boolean) => {
    try {
      const res = await fetch(`/api/admin/users/${userId}/management`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ isActive: !currentStatus })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update user status.');
      
      toast.success(`Account ${!currentStatus ? 'activated' : 'deactivated'} for ${data.name}`);
      onRefresh();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  // Handle password reset
  const handleResetPassword = async (userId: string) => {
    if (!newPassword) {
      toast.error('Please enter a new password');
      return;
    }
    try {
      const res = await fetch(`/api/admin/users/${userId}/management`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ password: newPassword })
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to update password');
      }
      toast.success('Password updated successfully');
      setEditingPasswordUser(null);
      setNewPassword('');
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  // Handle account deletion
  const handleDeleteUser = async (userId: string, userName: string) => {
    if (currentUser.id === userId) {
      toast.error('You cannot delete your own session account.');
      return;
    }
    const confirmed = confirm(`Are you sure you want to permanently delete user "${userName}"? This action is irreversible.`);
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/admin/users/${userId}/management`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ isArchived: true, isActive: false })
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete account');
      }
      toast.success(`User ${userName} has been successfully deleted.`);
      onRefresh();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const filteredUsers = users.filter(u => {
    if (u.isArchived) return false;
    const query = search.toLowerCase();
    const matchesSearch = u.name.toLowerCase().includes(query) || 
                          u.email.toLowerCase().includes(query) ||
                          (u.phone && u.phone.toLowerCase().includes(query));
    if (roleFilter === 'All') return matchesSearch;
    return matchesSearch && u.role === roleFilter;
  });

  return (
    <div className="bg-white border border-gray-100 rounded-3xl p-6 space-y-6">
      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-50 pb-4">
        <div>
          <h3 className="font-bold text-sm text-gray-800 flex items-center space-x-2">
            <Users className="h-5 w-5 text-rose-500" />
            <span>User Accounts & RBAC Directory</span>
          </h3>
          <p className="text-[10px] text-gray-400 font-mono mt-0.5">MANAGE SYSTEM ACCESS CREDENTIALS AND CLINICAL ROLES</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-gray-300" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search user identity..."
              className="pl-8 pr-4 py-1.5 text-xs border border-gray-200 rounded-xl bg-gray-50 focus:outline-none w-full sm:w-60"
            />
          </div>
          
          <select
            value={roleFilter}
            onChange={e => setRoleFilter(e.target.value)}
            className="border border-gray-200 text-xs rounded-xl bg-gray-50 py-1.5 px-3 focus:outline-none"
          >
            <option value="All">All Roles</option>
            <option value="ADMIN">ADMIN</option>
            <option value="DOCTOR">DOCTOR</option>
            <option value="NURSE">NURSE</option>
            <option value="RECEPTIONIST">RECEPTIONIST</option>
            <option value="PHARMACIST">PHARMACIST</option>
            <option value="LABORATORY">LABORATORY</option>
            <option value="PATIENT">PATIENT</option>
          </select>

          <button 
            onClick={onRefresh}
            className="bg-gray-50 border border-gray-200 p-2 rounded-xl hover:bg-gray-100 text-gray-600 transition-all flex items-center justify-center"
            title="Refresh list"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Directory Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-gray-100 text-gray-400 font-mono uppercase tracking-wider text-[10px] pb-2">
              <th className="py-2">Staff Identity</th>
              <th className="py-2">Contact Details</th>
              <th className="py-2">Security Role (RBAC)</th>
              <th className="py-2">Department</th>
              <th className="py-2 text-center">System Access</th>
              <th className="py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filteredUsers.length > 0 ? (
              filteredUsers.map((u) => {
                const isSelf = currentUser.id === u.id;
                return (
                  <tr key={u.id} className="hover:bg-gray-50/50">
                    <td className="py-3">
                      <div className="font-semibold text-gray-800 flex items-center space-x-1.5">
                        <span>{u.name}</span>
                        {isSelf && (
                          <span className="bg-rose-50 text-rose-600 text-[8px] font-mono px-1 rounded uppercase font-bold">You</span>
                        )}
                      </div>
                      <span className="text-[10px] text-gray-400 font-mono">ID: {u.id.substring(0, 8)}...</span>
                    </td>
                    <td className="py-3 space-y-0.5">
                      <div className="flex items-center text-gray-500 text-[11px]">
                        <Mail className="h-3 w-3 mr-1 text-gray-400 shrink-0" />
                        <span>{u.email}</span>
                      </div>
                      {u.phone && (
                        <div className="flex items-center text-gray-400 text-[10px]">
                          <Phone className="h-2.5 w-2.5 mr-1 text-gray-300 shrink-0" />
                          <span>{u.phone}</span>
                        </div>
                      )}
                    </td>
                    <td className="py-3">
                      {isSelf ? (
                        <span className="bg-indigo-50 border border-indigo-100 text-indigo-700 font-mono font-bold text-[9px] px-2 py-0.5 rounded-lg uppercase">
                          {u.role}
                        </span>
                      ) : (
                        <select
                          value={u.role}
                          onChange={(e) => handleUpdateRole(u.id, e.target.value)}
                          className="border border-gray-200 text-xs rounded-xl py-1 px-2.5 focus:outline-none bg-white font-semibold text-gray-700"
                        >
                          <option value="ADMIN">ADMIN</option>
                          <option value="DOCTOR">DOCTOR</option>
                          <option value="NURSE">NURSE</option>
                          <option value="RECEPTIONIST">RECEPTIONIST</option>
                          <option value="PHARMACIST">PHARMACIST</option>
                          <option value="LABORATORY">LABORATORY</option>
                          <option value="PATIENT">PATIENT</option>
                        </select>
                      )}
                    </td>
                    <td className="py-3 font-semibold text-indigo-600">{u.department || '—'}</td>
                    <td className="py-3 text-center">
                      <button
                        onClick={() => handleToggleStatus(u.id, u.isActive)}
                        disabled={isSelf}
                        className={`font-mono text-[9px] font-bold px-2 py-1 rounded-xl transition-colors cursor-pointer border ${
                          u.isActive 
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-100' 
                            : 'bg-rose-50 text-rose-700 border-rose-100 hover:bg-rose-100'
                        } disabled:opacity-50`}
                      >
                        {u.isActive ? '● ACTIVE' : '○ DEACTIVATED'}
                      </button>
                    </td>
                    <td className="py-3 text-right">
                      <div className="flex items-center justify-end space-x-1">
                        <button
                          onClick={() => setEditingPasswordUser(editingPasswordUser === u.id ? null : u.id)}
                          className="text-gray-400 hover:text-indigo-600 p-1.5 transition-colors"
                          title="Reset security password"
                        >
                          <Key className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteUser(u.id, u.name)}
                          disabled={isSelf}
                          className="text-gray-400 hover:text-rose-600 p-1.5 transition-colors disabled:opacity-30"
                          title="Delete User account"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={6} className="text-center text-gray-400 py-8 font-mono">No clinical identities match query parameters.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Inline Password Editor */}
      {editingPasswordUser && (
        <div className="mt-4 p-4 bg-gray-50 border border-gray-100 rounded-2xl flex flex-col sm:flex-row items-end gap-3 max-w-md">
          <div className="flex-1 space-y-1">
            <span className="text-[10px] font-mono text-gray-400 block uppercase">SECURE PASSKEY RESET</span>
            <input
              type="password"
              placeholder="Enter new strong password..."
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              className="w-full text-xs py-1.5 px-3 border border-gray-200 rounded-xl focus:outline-none bg-white"
            />
          </div>
          <div className="flex gap-1.5">
            <button
              onClick={() => handleResetPassword(editingPasswordUser)}
              className="bg-rose-500 hover:bg-rose-600 text-white text-[11px] font-bold px-3 py-2 rounded-xl transition-colors cursor-pointer"
            >
              Save Password
            </button>
            <button
              onClick={() => { setEditingPasswordUser(null); setNewPassword(''); }}
              className="bg-gray-200 hover:bg-gray-300 text-gray-600 text-[11px] font-bold px-3 py-2 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
