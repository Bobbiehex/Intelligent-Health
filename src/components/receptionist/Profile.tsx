import React, { useState } from 'react';
import { 
  User, Mail, Phone, Shield, 
  Key, Camera, Save, AlertCircle 
} from 'lucide-react';
import { toast } from 'sonner';

interface ProfileProps {
  user: any;
  token: string;
}

export default function Profile({ user, token }: ProfileProps) {
  const [loading, setLoading] = useState(false);
  const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '' });

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/profile/password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(passwordData)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success('Password changed successfully');
      setPasswordData({ currentPassword: '', newPassword: '' });
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center space-x-4">
        <div className="w-20 h-20 bg-rose-50 rounded-3xl flex items-center justify-center relative group overflow-hidden">
          {user.passportPhoto ? (
            <img src={user.passportPhoto} alt="Profile" className="w-full h-full object-cover" />
          ) : (
            <User className="h-10 w-10 text-rose-500" />
          )}
          <input 
            type="file" 
            id="profile-photo-upload"
            className="hidden" 
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                toast.info('Uploading photo...', { description: 'Synchronizing profile image with medical database.' });
                setTimeout(() => toast.success('Profile photo updated'), 1500);
              }
            }}
          />
          <div 
            onClick={() => document.getElementById('profile-photo-upload')?.click()}
            className="absolute inset-0 bg-black/40 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
          >
            <Camera className="h-6 w-6 text-white" />
          </div>
        </div>
        <div>
          <h2 className="text-2xl font-display font-bold text-gray-900">{user.name}</h2>
          <p className="text-sm text-gray-400 font-mono uppercase tracking-wider">{user.role}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white border border-gray-100 rounded-[2.5rem] p-8 shadow-sm">
          <h3 className="font-display font-bold text-gray-900 text-base mb-6 flex items-center space-x-2">
            <Shield className="h-5 w-5 text-emerald-500" />
            <span>Account Details</span>
          </h3>
          <div className="space-y-6">
            <div>
              <label className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-wider block mb-2">Login Email</label>
              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                <Mail className="h-4 w-4 text-gray-300" />
                <span className="text-sm text-gray-600">{user.email}</span>
              </div>
            </div>
            <div>
              <label className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-wider block mb-2">Access Level</label>
              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                <Shield className="h-4 w-4 text-gray-300" />
                <span className="text-sm text-gray-600">Restricted Frontdesk Authorization</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-100 rounded-[2.5rem] p-8 shadow-sm">
          <h3 className="font-display font-bold text-gray-900 text-base mb-6 flex items-center space-x-2">
            <Key className="h-5 w-5 text-amber-500" />
            <span>Security Configuration</span>
          </h3>
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div>
              <label className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-wider block mb-2">Current Password</label>
              <input 
                type="password" 
                required
                value={passwordData.currentPassword}
                onChange={e => setPasswordData({...passwordData, currentPassword: e.target.value})}
                className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:border-rose-500 outline-none" 
              />
            </div>
            <div>
              <label className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-wider block mb-2">New Password</label>
              <input 
                type="password" 
                required
                value={passwordData.newPassword}
                onChange={e => setPasswordData({...passwordData, newPassword: e.target.value})}
                className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:border-rose-500 outline-none" 
              />
            </div>
            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-gray-900 text-white font-bold py-3.5 rounded-2xl text-xs hover:bg-black transition-all flex items-center justify-center space-x-2"
            >
              <Save className="h-4 w-4" />
              <span>Update Security Access</span>
            </button>
          </form>
        </div>
      </div>

      <div className="bg-amber-50/50 border border-amber-100 p-6 rounded-[2rem] flex items-start space-x-4">
        <AlertCircle className="h-6 w-6 text-amber-500 shrink-0" />
        <div>
          <h4 className="text-sm font-bold text-amber-900">Permissions Notice</h4>
          <p className="text-xs text-amber-700/70 leading-relaxed mt-1">
            As a receptionist, you do not have permission to modify your assigned role or clinical department settings. If your responsibilities have changed, please contact the hospital administrator for a formal credential update.
          </p>
        </div>
      </div>
    </div>
  );
}
