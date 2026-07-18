import React, { useState } from 'react';
import { 
  UserPlus, Upload, Shield, Phone, Mail, 
  MapPin, Heart, Briefcase, Globe, Fingerprint, 
  Camera, Info
} from 'lucide-react';
import { toast } from 'sonner';

interface PatientRegistrationProps {
  token: string;
  onSuccess: () => void;
}

export default function PatientRegistration({ token, onSuccess }: PatientRegistrationProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '', lastName: '', middleName: '', gender: 'Male', dob: '', phone: '', email: '',
    address: '', city: '', state: '', country: 'Nigeria',
    emergencyContactName: '', emergencyContactPhone: '',
    bloodGroup: 'O+', genotype: 'AA', maritalStatus: 'Single',
    occupation: '', nationality: 'Nigerian', idNumber: '',
    passportPhoto: '', password: 'Clinic' + Math.floor(1000 + Math.random() * 9000)
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/receptionist/patients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast.success('Patient Registered Successfully!', {
        description: `ID: ${data.patientId} | MRN: ${data.mrn}`
      });
      onSuccess();
    } catch (err: any) {
      toast.error(err.message || 'Failed to register patient');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto animate-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="flex items-center space-x-3 mb-8">
        <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center">
          <UserPlus className="h-6 w-6 text-emerald-500" />
        </div>
        <div>
          <h2 className="font-display font-bold text-gray-900 text-xl">Register New Patient</h2>
          <p className="text-sm text-gray-400">Initialize a new secure medical record and profile</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Section 1: Basic Information */}
        <div className="bg-white border border-gray-100 rounded-[2rem] p-8 shadow-sm">
          <div className="flex items-center space-x-2 text-rose-500 font-bold text-xs uppercase tracking-widest mb-6">
            <Fingerprint className="h-4 w-4" />
            <span>Identity & Basic Details</span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-wider block mb-2">First Name *</label>
              <input required name="firstName" value={formData.firstName} onChange={handleChange} className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:border-rose-500 focus:ring-2 focus:ring-rose-500/10 outline-none transition-all" placeholder="John" />
            </div>
            <div>
              <label className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-wider block mb-2">Last Name *</label>
              <input required name="lastName" value={formData.lastName} onChange={handleChange} className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:border-rose-500 outline-none transition-all" placeholder="Doe" />
            </div>
            <div>
              <label className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-wider block mb-2">Middle Name</label>
              <input name="middleName" value={formData.middleName} onChange={handleChange} className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:border-rose-500 outline-none transition-all" placeholder="Quincy" />
            </div>
            <div>
              <label className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-wider block mb-2">Gender *</label>
              <select name="gender" value={formData.gender} onChange={handleChange} className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:border-rose-500 outline-none transition-all bg-white">
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-wider block mb-2">Date of Birth *</label>
              <input required type="date" name="dob" value={formData.dob} onChange={handleChange} className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:border-rose-500 outline-none transition-all" />
            </div>
            <div>
              <label className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-wider block mb-2">Identification No.</label>
              <input name="idNumber" value={formData.idNumber} onChange={handleChange} className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:border-rose-500 outline-none transition-all" placeholder="NIN / Driver's License" />
            </div>
          </div>
        </div>

        {/* Section 2: Contact Information */}
        <div className="bg-white border border-gray-100 rounded-[2rem] p-8 shadow-sm">
          <div className="flex items-center space-x-2 text-blue-500 font-bold text-xs uppercase tracking-widest mb-6">
            <Phone className="h-4 w-4" />
            <span>Contact & Residential Info</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-wider block mb-2">Phone Number *</label>
              <input required type="tel" name="phone" value={formData.phone} onChange={handleChange} className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:border-rose-500 outline-none transition-all" placeholder="+234 800 000 0000" />
            </div>
            <div>
              <label className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-wider block mb-2">Email Address *</label>
              <input required type="email" name="email" value={formData.email} onChange={handleChange} className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:border-rose-500 outline-none transition-all" placeholder="john.doe@example.com" />
            </div>
            <div className="md:col-span-2">
              <label className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-wider block mb-2">Home Address</label>
              <input name="address" value={formData.address} onChange={handleChange} className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:border-rose-500 outline-none transition-all" placeholder="123 Health Ave, Clinic Estate" />
            </div>
            <div className="grid grid-cols-3 md:col-span-2 gap-4">
              <div>
                <label className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-wider block mb-2">City</label>
                <input name="city" value={formData.city} onChange={handleChange} className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:border-rose-500 outline-none transition-all" placeholder="Lagos" />
              </div>
              <div>
                <label className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-wider block mb-2">State</label>
                <input name="state" value={formData.state} onChange={handleChange} className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:border-rose-500 outline-none transition-all" placeholder="Lagos State" />
              </div>
              <div>
                <label className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-wider block mb-2">Country</label>
                <input name="country" value={formData.country} onChange={handleChange} className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:border-rose-500 outline-none transition-all" />
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Clinical & Emergency */}
        <div className="bg-white border border-gray-100 rounded-[2rem] p-8 shadow-sm">
          <div className="flex items-center space-x-2 text-emerald-500 font-bold text-xs uppercase tracking-widest mb-6">
            <Heart className="h-4 w-4" />
            <span>Clinical & Emergency Data</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-wider block mb-2">Blood Group</label>
                <select name="bloodGroup" value={formData.bloodGroup} onChange={handleChange} className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:border-rose-500 outline-none transition-all bg-white">
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-wider block mb-2">Genotype</label>
                <select name="genotype" value={formData.genotype} onChange={handleChange} className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:border-rose-500 outline-none transition-all bg-white">
                  <option value="AA">AA</option>
                  <option value="AS">AS</option>
                  <option value="SS">SS</option>
                  <option value="AC">AC</option>
                </select>
              </div>
            </div>
            <div>
              <label className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-wider block mb-2">Marital Status</label>
              <select name="maritalStatus" value={formData.maritalStatus} onChange={handleChange} className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:border-rose-500 outline-none transition-all bg-white">
                <option value="Single">Single</option>
                <option value="Married">Married</option>
                <option value="Divorced">Divorced</option>
                <option value="Widowed">Widowed</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-wider block mb-2">Emergency Contact Name</label>
              <input name="emergencyContactName" value={formData.emergencyContactName} onChange={handleChange} className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:border-rose-500 outline-none transition-all" placeholder="Next of Kin Name" />
            </div>
            <div>
              <label className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-wider block mb-2">Emergency Contact Phone</label>
              <input name="emergencyContactPhone" value={formData.emergencyContactPhone} onChange={handleChange} className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:border-rose-500 outline-none transition-all" placeholder="+234..." />
            </div>
          </div>
        </div>

        {/* Section 4: Employment & Passport */}
        <div className="bg-white border border-gray-100 rounded-[2rem] p-8 shadow-sm">
          <div className="flex items-center space-x-2 text-amber-500 font-bold text-xs uppercase tracking-widest mb-6">
            <Briefcase className="h-4 w-4" />
            <span>Social & Media Profile</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div>
                <label className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-wider block mb-2">Occupation</label>
                <input name="occupation" value={formData.occupation} onChange={handleChange} className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:border-rose-500 outline-none transition-all" placeholder="Software Engineer" />
              </div>
              <div>
                <label className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-wider block mb-2">Nationality</label>
                <input name="nationality" value={formData.nationality} onChange={handleChange} className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:border-rose-500 outline-none transition-all" />
              </div>
            </div>
            
            <div className="border-2 border-dashed border-gray-100 rounded-[2rem] p-8 flex flex-col items-center justify-center text-center space-y-3 bg-gray-50/30">
              <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center overflow-hidden">
                {formData.passportPhoto ? (
                  <img src={formData.passportPhoto} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <Camera className="h-8 w-8 text-gray-300" />
                )}
              </div>
              <div>
                <p className="text-xs font-bold text-gray-600">Passport Photograph</p>
                <p className="text-[10px] text-gray-400 mt-1">Upload JPG or PNG (Max 2MB)</p>
              </div>
              <input 
                type="file" 
                id="passport-upload"
                className="hidden" 
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                      setFormData(prev => ({ ...prev, passportPhoto: reader.result as string }));
                      toast.success('Photo preview loaded');
                    };
                    reader.readAsDataURL(file);
                  }
                }}
              />
              <button 
                type="button" 
                onClick={() => document.getElementById('passport-upload')?.click()}
                className="text-[10px] font-bold text-rose-500 bg-white border border-gray-100 px-4 py-2 rounded-xl hover:bg-rose-50 transition-all"
              >
                Choose File
              </button>
            </div>
          </div>
        </div>

        {/* Security Info */}
        <div className="bg-rose-50/50 border border-rose-100 p-6 rounded-[2rem] flex items-start space-x-4">
          <Shield className="h-6 w-6 text-rose-500 shrink-0" />
          <div className="flex-1">
            <h4 className="text-sm font-bold text-rose-900">Security & Privacy Acknowledgement</h4>
            <p className="text-xs text-rose-700/70 leading-relaxed mt-1">
              By registering this patient, you confirm that all information provided is accurate and obtained with the patient's consent. A default password <span className="font-mono font-bold text-rose-600 bg-white px-1 rounded">{formData.password}</span> has been generated. The patient will be prompted to change this upon their first login.
            </p>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gray-900 hover:bg-black text-white font-bold py-5 rounded-[2rem] text-sm transition-all shadow-xl shadow-gray-200 flex items-center justify-center space-x-3 disabled:opacity-50"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <UserPlus className="h-5 w-5" />
              <span>Finalize & Create Medical Record</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}
