import React, { useState, useEffect } from 'react';
import { 
  User, Phone, MapPin, Mail, Calendar, Droplets, 
  Shield, CreditCard, Lock, Save, Camera, AlertCircle, Heart
} from 'lucide-react';
import { motion } from 'motion/react';
import { toast } from 'sonner';

interface PatientProfileProps {
  user: any;
  token: string;
}

export default function PatientProfile({ user, token }: PatientProfileProps) {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<any>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch('/api/patient/profile', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Failed to fetch profile');
        const data = await response.json();
        setProfile(data);
        setFormData(data);
      } catch (error) {
        toast.error('Failed to load profile');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [token]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const response = await fetch('/api/patient/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      if (!response.ok) throw new Error('Update failed');
      const updated = await response.json();
      setProfile(updated);
      setIsEditing(false);
      toast.success('Profile updated successfully');
    } catch (error) {
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handlePhotoUpload = () => {
    fileInputRef.current?.click();
  };

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      toast.info('Uploading photo...', { description: 'Please wait while we secure your clinical profile image.' });
      // In a real app, upload to storage and update profile
      setTimeout(() => {
        toast.success('Profile photo updated');
      }, 1500);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-slate-400 font-mono text-xs">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4" />
        <span>Authenticating secure profile...</span>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-slate-400 bg-white rounded-[2.5rem] border border-dashed border-slate-200 p-12">
        <AlertCircle className="mb-4 text-rose-500" size={48} />
        <h3 className="text-slate-800 font-bold text-lg">Profile Not Found</h3>
        <p className="text-slate-500 text-sm mt-2 text-center max-w-xs">
          We were unable to retrieve your clinical profile. Please try refreshing the page or contact support.
        </p>
        <button 
          onClick={() => window.location.reload()}
          className="mt-6 bg-indigo-600 text-white px-8 py-3 rounded-2xl font-bold text-sm shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-display font-bold text-slate-800">Personal Information</h2>
        <button 
          onClick={() => setIsEditing(!isEditing)}
          className={`px-6 py-2.5 rounded-2xl text-sm font-bold transition-all ${
            isEditing 
              ? 'bg-slate-100 text-slate-600 hover:bg-slate-200' 
              : 'bg-indigo-600 text-white shadow-lg shadow-indigo-100 hover:bg-indigo-700'
          }`}
        >
          {isEditing ? 'Cancel Editing' : 'Edit Profile'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        {/* Profile Card */}
        <div className="md:col-span-4 space-y-6">
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm text-center">
            <div className="relative inline-block group">
              <div className="w-32 h-32 bg-slate-100 rounded-[2rem] flex items-center justify-center text-indigo-600 font-bold text-4xl shadow-inner mx-auto mb-4 border-4 border-white">
                {profile.passportPhoto ? (
                  <img src={profile.passportPhoto} alt="Profile" className="w-full h-full object-cover rounded-[1.8rem]" />
                ) : profile.name.charAt(0)}
              </div>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={onFileChange} 
                className="hidden" 
                accept="image/*"
              />
              <button 
                onClick={handlePhotoUpload}
                className="absolute bottom-4 right-0 w-10 h-10 bg-white shadow-lg rounded-2xl flex items-center justify-center text-slate-500 hover:text-indigo-600 transition-all border border-slate-50"
              >
                <Camera size={18} />
              </button>
            </div>
            <h3 className="text-lg font-bold text-slate-800">{profile.name}</h3>
            <p className="text-xs text-slate-400 mt-1 font-mono tracking-widest uppercase">ID: {profile.patientId || 'Pending'}</p>
            
            <div className="mt-8 pt-8 border-t border-slate-50 grid grid-cols-2 gap-4">
              <div className="p-3 bg-slate-50 rounded-2xl">
                <span className="text-[10px] font-bold text-slate-400 block uppercase mb-1">Blood</span>
                <span className="text-sm font-bold text-rose-600">{profile.bloodGroup || '—'}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-2xl">
                <span className="text-[10px] font-bold text-slate-400 block uppercase mb-1">Genotype</span>
                <span className="text-sm font-bold text-indigo-600">{profile.genotype || '—'}</span>
              </div>
            </div>
          </div>

          <div className="bg-rose-50 border border-rose-100 p-6 rounded-[2rem] space-y-4">
            <h4 className="text-sm font-bold text-rose-800 flex items-center space-x-2">
              <AlertCircle size={16} />
              <span>Allergies & Risks</span>
            </h4>
            <div className="space-y-2">
              {profile.allergies?.length > 0 ? profile.allergies.map((a: any, i: number) => (
                <div key={i} className="text-xs font-bold text-rose-700 bg-white/50 px-3 py-2 rounded-xl">
                  {a.allergen}
                </div>
              )) : (
                <p className="text-[10px] text-rose-600 italic">No allergies registered.</p>
              )}
            </div>
          </div>
        </div>

        {/* Details Form */}
        <div className="md:col-span-8">
          <form onSubmit={handleUpdate} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input 
                    type="text" 
                    value={formData.name || ''}
                    disabled
                    className="w-full bg-slate-50 border-none rounded-2xl py-3 pl-12 pr-4 text-sm text-slate-500 font-medium cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input 
                    type="email" 
                    value={formData.email || ''}
                    disabled
                    className="w-full bg-slate-50 border-none rounded-2xl py-3 pl-12 pr-4 text-sm text-slate-500 font-medium cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Phone Number</label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input 
                    type="text" 
                    value={formData.phone || ''}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    disabled={!isEditing}
                    className={`w-full ${isEditing ? 'bg-white border-slate-200 focus:ring-2 focus:ring-indigo-500/20' : 'bg-slate-50 border-none'} border rounded-2xl py-3 pl-12 pr-4 text-sm transition-all outline-none`}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Date of Birth</label>
                <div className="relative">
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input 
                    type="text" 
                    value={formData.dob || ''}
                    disabled
                    className="w-full bg-slate-50 border-none rounded-2xl py-3 pl-12 pr-4 text-sm text-slate-500 font-medium cursor-not-allowed"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Residential Address</label>
              <div className="relative">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input 
                  type="text" 
                  value={formData.address || ''}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                  disabled={!isEditing}
                  placeholder="Street Address"
                  className={`w-full ${isEditing ? 'bg-white border-slate-200 focus:ring-2 focus:ring-indigo-500/20' : 'bg-slate-50 border-none'} border rounded-2xl py-3 pl-12 pr-4 text-sm transition-all outline-none`}
                />
              </div>
              <div className="grid grid-cols-2 gap-4 mt-2">
                <input 
                  type="text" 
                  placeholder="City"
                  value={formData.city || ''}
                  onChange={(e) => setFormData({...formData, city: e.target.value})}
                  disabled={!isEditing}
                  className={`w-full ${isEditing ? 'bg-white border-slate-200' : 'bg-slate-50 border-none'} border rounded-2xl py-3 px-4 text-sm outline-none`}
                />
                <input 
                  type="text" 
                  placeholder="State/Province"
                  value={formData.state || ''}
                  onChange={(e) => setFormData({...formData, state: e.target.value})}
                  disabled={!isEditing}
                  className={`w-full ${isEditing ? 'bg-white border-slate-200' : 'bg-slate-50 border-none'} border rounded-2xl py-3 px-4 text-sm outline-none`}
                />
              </div>
            </div>

            <div className="border-t border-slate-100 pt-8 mt-8 space-y-6">
              <h4 className="text-sm font-bold text-slate-800 flex items-center space-x-2">
                <Shield size={16} className="text-indigo-600" />
                <span>Emergency Contact</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Contact Name</label>
                  <input 
                    type="text" 
                    value={formData.emergencyContactName || ''}
                    onChange={(e) => setFormData({...formData, emergencyContactName: e.target.value})}
                    disabled={!isEditing}
                    className={`w-full ${isEditing ? 'bg-white border-slate-200' : 'bg-slate-50 border-none'} border rounded-2xl py-3 px-4 text-sm outline-none`}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Contact Phone</label>
                  <input 
                    type="text" 
                    value={formData.emergencyContactPhone || ''}
                    onChange={(e) => setFormData({...formData, emergencyContactPhone: e.target.value})}
                    disabled={!isEditing}
                    className={`w-full ${isEditing ? 'bg-white border-slate-200' : 'bg-slate-50 border-none'} border rounded-2xl py-3 px-4 text-sm outline-none`}
                  />
                </div>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-8 mt-8 space-y-6">
              <h4 className="text-sm font-bold text-slate-800 flex items-center space-x-2">
                <Heart size={16} className="text-rose-500" />
                <span>Clinical / Medical Details</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Blood Group</label>
                  <select 
                    value={formData.bloodGroup || ''}
                    onChange={(e) => setFormData({...formData, bloodGroup: e.target.value})}
                    disabled={!isEditing}
                    className={`w-full ${isEditing ? 'bg-white border-slate-200' : 'bg-slate-50 border-none'} border rounded-2xl py-3 px-4 text-sm outline-none`}
                  >
                    <option value="">Select Blood Group</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Genotype</label>
                  <select 
                    value={formData.genotype || ''}
                    onChange={(e) => setFormData({...formData, genotype: e.target.value})}
                    disabled={!isEditing}
                    className={`w-full ${isEditing ? 'bg-white border-slate-200' : 'bg-slate-50 border-none'} border rounded-2xl py-3 px-4 text-sm outline-none`}
                  >
                    <option value="">Select Genotype</option>
                    <option value="AA">AA</option>
                    <option value="AS">AS</option>
                    <option value="SS">SS</option>
                    <option value="AC">AC</option>
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Personal Medical History / Notes</label>
                <textarea 
                  value={formData.medicalHistoryNotes || ''}
                  onChange={(e) => setFormData({...formData, medicalHistoryNotes: e.target.value})}
                  disabled={!isEditing}
                  placeholder="Record any personal chronic conditions, surgeries, or major past medical logs..."
                  rows={3}
                  className={`w-full ${isEditing ? 'bg-white border-slate-200 focus:ring-2 focus:ring-indigo-500/20' : 'bg-slate-50 border-none'} border rounded-2xl py-3 px-4 text-sm outline-none transition-all`}
                />
              </div>
            </div>

            {isEditing && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="pt-6"
              >
                <button 
                  type="submit"
                  disabled={saving}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-2xl shadow-lg shadow-indigo-100 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
                >
                  {saving ? (
                    <span className="animate-pulse">Saving changes...</span>
                  ) : (
                    <>
                      <Save size={18} />
                      <span>Update Profile Information</span>
                    </>
                  )}
                </button>
              </motion.div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
