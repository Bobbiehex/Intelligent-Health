import React, { useState } from 'react';
import { User, Mail, Shield, MapPin, Phone, Briefcase, Clock, Camera, Save, Lock } from 'lucide-react';

interface DoctorProfileProps {
  user: any;
  token: string;
}

export default function DoctorProfile({ user, token }: DoctorProfileProps) {
  const [formData, setFormData] = useState({
    name: user.name,
    email: user.email,
    department: user.department || 'General Practice',
    phone: user.phone || '',
    consultationHours: '9:00 AM - 5:00 PM',
    specialization: 'Internal Medicine, Cardiology'
  });

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="h-32 bg-gradient-to-r from-indigo-600 to-rose-500 relative">
          <div className="absolute -bottom-12 left-8">
            <div className="h-24 w-24 rounded-3xl bg-white p-1 shadow-xl">
              <div className="h-full w-full bg-gray-100 rounded-2xl flex items-center justify-center text-indigo-600 overflow-hidden relative group cursor-pointer">
                <User className="h-10 w-10" />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Camera className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-16 pb-8 px-8 flex justify-between items-end">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{user.name}</h2>
            <p className="text-sm text-gray-400 font-medium">Medical Officer • {formData.department}</p>
          </div>
          <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl text-xs font-bold shadow-lg shadow-indigo-200 transition-all flex items-center gap-2">
            <Save className="h-4 w-4" />
            Save Changes
          </button>
        </div>

        <div className="p-8 border-t border-gray-50 grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <ProfileField icon={<User />} label="Full Name" value={formData.name} onChange={(v) => setFormData({...formData, name: v})} />
            <ProfileField icon={<Mail />} label="Email Address" value={formData.email} onChange={(v) => setFormData({...formData, email: v})} readOnly />
            <ProfileField icon={<Briefcase />} label="Department" value={formData.department} onChange={(v) => setFormData({...formData, department: v})} />
          </div>
          <div className="space-y-6">
            <ProfileField icon={<Phone />} label="Phone Number" value={formData.phone} onChange={(v) => setFormData({...formData, phone: v})} />
            <ProfileField icon={<Clock />} label="Consultation Hours" value={formData.consultationHours} onChange={(v) => setFormData({...formData, consultationHours: v})} />
            <ProfileField icon={<Shield />} label="Specialization" value={formData.specialization} onChange={(v) => setFormData({...formData, specialization: v})} />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8">
        <h3 className="text-sm font-bold text-gray-900 mb-6 flex items-center gap-2">
          <Lock className="h-4 w-4 text-rose-500" />
          Security & Authentication
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Current Password</label>
            <input type="password" placeholder="••••••••" className="w-full bg-gray-50 border-none rounded-xl p-3 text-sm focus:ring-2 focus:ring-rose-500/10 transition-all" />
          </div>
          <div className="space-y-4">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">New Password</label>
            <input type="password" placeholder="Enter new password" className="w-full bg-gray-50 border-none rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-500/10 transition-all" />
          </div>
        </div>
        <button className="mt-6 text-xs font-bold text-indigo-600 hover:text-indigo-700 transition-colors">Change Password</button>
      </div>
    </div>
  );
}

function ProfileField({ icon, label, value, onChange, readOnly = false }: any) {
  return (
    <div className="space-y-1.5">
      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider font-mono flex items-center gap-2">
        {React.cloneElement(icon, { className: 'h-3 w-3' })}
        {label}
      </label>
      <input 
        type="text" 
        value={value} 
        onChange={(e) => onChange(e.target.value)}
        readOnly={readOnly}
        className={`w-full border-none rounded-xl p-3 text-xs focus:ring-2 focus:ring-indigo-500/10 transition-all ${readOnly ? 'bg-gray-50 text-gray-400 cursor-not-allowed' : 'bg-gray-50/50 hover:bg-gray-50'}`}
      />
    </div>
  );
}
