import React, { useState } from 'react';
import { 
  Users, UserPlus, Search, RefreshCw, Award, FileSpreadsheet, ShieldCheck, Mail, Phone, Calendar, Clock, BookOpen, Briefcase
} from 'lucide-react';
import { toast } from 'sonner';

interface StaffTabProps {
  staff: any[];
  token: string;
  onRefresh: () => void;
}

export default function StaffTab({ staff, token, onRefresh }: StaffTabProps) {
  const [search, setSearch] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  // Form Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('DOCTOR');
  const [department, setDepartment] = useState('General Medicine');
  const [specialization, setSpecialization] = useState('');
  const [workSchedule, setWorkSchedule] = useState('Mon - Fri, 09:00 - 17:00');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [qualification, setQualification] = useState('');
  const [employmentDate, setEmploymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [submitting, setSubmitting] = useState(false);

  // Handle staff registration
  const handleRegisterStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !role) {
      toast.error('Name, Email, and Role are required.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/admin/staff', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name, email, phone, password, role, department,
          specialization, workSchedule, licenseNumber, qualification, employmentDate
        })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to register staff');
      }

      toast.success(`Staff member Dr./Nurse/Mr./Ms. ${name} registered successfully!`);
      setIsCreating(false);
      onRefresh();

      // Clear Form
      setName('');
      setEmail('');
      setPhone('');
      setPassword('');
      setRole('DOCTOR');
      setDepartment('General Medicine');
      setSpecialization('');
      setWorkSchedule('Mon - Fri, 09:00 - 17:00');
      setLicenseNumber('');
      setQualification('');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Archive staff
  const handleArchiveStaff = async (staffId: string, staffName: string) => {
    const confirmed = confirm(`Are you sure you want to archive staff member "${staffName}"? This registers them as a former employee and revokes active clinic access.`);
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/admin/staff/${staffId}/archive`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to archive staff');
      }

      toast.success(`Staff member "${staffName}" successfully moved to Former Employees directory.`);
      onRefresh();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const filteredStaff = staff.filter(s => {
    const query = search.toLowerCase();
    return s.name.toLowerCase().includes(query) || 
           s.email.toLowerCase().includes(query) ||
           (s.department && s.department.toLowerCase().includes(query)) ||
           (s.qualification && s.qualification.toLowerCase().includes(query));
  });

  return (
    <div className="space-y-6">
      {/* Registration & Directory Action bar */}
      <div className="bg-white border border-gray-100 rounded-3xl p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="text-[10px] text-gray-400 font-mono uppercase block">Clinical Staff Directory</span>
          <h4 className="font-bold text-sm text-gray-800">Licensing, Qualifications & Work Schedules</h4>
        </div>

        <div className="flex gap-2 w-full sm:w-auto">
          <button
            onClick={() => setIsCreating(!isCreating)}
            className="bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-colors cursor-pointer flex items-center space-x-2"
          >
            <UserPlus className="h-4 w-4" />
            <span>{isCreating ? 'Hide Register Form' : 'Register New Staff'}</span>
          </button>
        </div>
      </div>

      {/* Register Staff Panel */}
      {isCreating && (
        <form onSubmit={handleRegisterStaff} className="bg-white border border-gray-100 rounded-3xl p-6 space-y-4 animate-fadeIn">
          <div className="border-b border-gray-50 pb-2">
            <h5 className="font-bold text-xs text-gray-700 uppercase tracking-wider font-mono">Staff Onboarding Protocol</h5>
            <p className="text-[10px] text-gray-400 leading-normal">Ensure all fields align with local regulatory clinical registries.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Identity */}
            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-bold text-gray-500 font-mono block mb-1">FULL NAME *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dr. Arthur Pendragon"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full text-xs py-1.5 px-3 border border-gray-200 rounded-xl focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-500 font-mono block mb-1">EMAIL ADDRESS *</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. arthur@hospital.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full text-xs py-1.5 px-3 border border-gray-200 rounded-xl focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-500 font-mono block mb-1">TELEPHONE NUMBER</label>
                <input
                  type="tel"
                  placeholder="e.g. +44 7911 123456"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className="w-full text-xs py-1.5 px-3 border border-gray-200 rounded-xl focus:outline-none"
                />
              </div>
            </div>

            {/* Department / Roles */}
            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-bold text-gray-500 font-mono block mb-1">RBAC POSITION (ROLE) *</label>
                <select
                  value={role}
                  onChange={e => setRole(e.target.value)}
                  className="w-full text-xs py-1.5 px-3 border border-gray-200 rounded-xl focus:outline-none bg-white"
                >
                  <option value="DOCTOR">DOCTOR (MD/GP)</option>
                  <option value="NURSE">REGISTERED NURSE (RN)</option>
                  <option value="PHARMACIST">CLINICAL PHARMACIST</option>
                  <option value="LABORATORY">LAB SCIENTIST</option>
                  <option value="RECEPTIONIST">RECEPTIONIST</option>
                  <option value="ADMIN">ADMINISTRATIVE OFFICER</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-500 font-mono block mb-1">CLINICAL DEPARTMENT</label>
                <input
                  type="text"
                  placeholder="e.g. Cardiology, Radiology, General"
                  value={department}
                  onChange={e => setDepartment(e.target.value)}
                  className="w-full text-xs py-1.5 px-3 border border-gray-200 rounded-xl focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-500 font-mono block mb-1">SPECIALISATION (SUB-DISCIPLINE)</label>
                <input
                  type="text"
                  placeholder="e.g. Pediatric Cardiology, ICU Care"
                  value={specialization}
                  onChange={e => setSpecialization(e.target.value)}
                  className="w-full text-xs py-1.5 px-3 border border-gray-200 rounded-xl focus:outline-none"
                />
              </div>
            </div>

            {/* Qualifications / License */}
            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-bold text-gray-500 font-mono block mb-1">CLINICAL LICENSE NUMBER (GMC / NMC)</label>
                <input
                  type="text"
                  placeholder="e.g. GMC-7463529"
                  value={licenseNumber}
                  onChange={e => setLicenseNumber(e.target.value)}
                  className="w-full text-xs py-1.5 px-3 border border-gray-200 rounded-xl focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-500 font-mono block mb-1">QUALIFICATION CREDENTIALS</label>
                <input
                  type="text"
                  placeholder="e.g. MBChB, FRCP, Ph.D. in Medicine"
                  value={qualification}
                  onChange={e => setQualification(e.target.value)}
                  className="w-full text-xs py-1.5 px-3 border border-gray-200 rounded-xl focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[9px] font-bold text-gray-500 font-mono block mb-1">ONBOARD DATE</label>
                  <input
                    type="date"
                    value={employmentDate}
                    onChange={e => setEmploymentDate(e.target.value)}
                    className="w-full text-xs py-1 px-1.5 border border-gray-200 rounded-xl focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[9px] font-bold text-gray-500 font-mono block mb-1">PASSWORD</label>
                  <input
                    type="password"
                    placeholder="StaffPass123!"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full text-xs py-1 px-1.5 border border-gray-200 rounded-xl focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold text-gray-500 font-mono block mb-1">SCHEDULED ROTATION SCHEDULE</label>
            <input
              type="text"
              placeholder="e.g. Mon, Wed, Fri 08:00 - 20:00 (A Shift)"
              value={workSchedule}
              onChange={e => setWorkSchedule(e.target.value)}
              className="w-full text-xs py-1.5 px-3 border border-gray-200 rounded-xl focus:outline-none"
            />
          </div>

          <div className="flex justify-end pt-2 border-t border-gray-50">
            <button
              type="submit"
              disabled={submitting}
              className="bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold px-5 py-2 rounded-xl transition-colors disabled:opacity-50 cursor-pointer"
            >
              {submitting ? 'Registering...' : 'Complete Registration'}
            </button>
          </div>
        </form>
      )}

      {/* Directory List View */}
      <div className="bg-white border border-gray-100 rounded-3xl p-6">
        <div className="flex items-center justify-between border-b border-gray-50 pb-4 mb-4 gap-4">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-gray-300" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name, department, credentials..."
              className="pl-8 pr-4 py-1.5 text-xs border border-gray-200 rounded-xl bg-gray-50 focus:outline-none w-full"
            />
          </div>

          <button 
            onClick={onRefresh}
            className="bg-gray-50 border border-gray-200 p-2 rounded-xl hover:bg-gray-100 text-gray-600 shrink-0"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredStaff.length > 0 ? (
            filteredStaff.map((member) => (
              <div 
                key={member.id} 
                className={`border border-gray-100 rounded-2xl p-5 space-y-4 hover:border-gray-200 transition-all ${
                  member.isArchived ? 'bg-gray-50 opacity-60' : 'bg-white'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-bold text-sm text-gray-800">{member.name}</span>
                      {member.isArchived && (
                        <span className="bg-gray-200 text-gray-600 text-[8px] font-mono px-1 rounded uppercase font-bold">Former Employee</span>
                      )}
                    </div>
                    <span className="bg-rose-50 border border-rose-100/50 text-rose-700 font-mono font-bold text-[9px] px-1.5 py-0.5 rounded uppercase">
                      {member.role}
                    </span>
                  </div>

                  {!member.isArchived && (
                    <button
                      onClick={() => handleArchiveStaff(member.id, member.name)}
                      className="text-[9px] font-bold text-rose-500 hover:text-rose-700 bg-rose-50/50 hover:bg-rose-50 border border-rose-100/50 py-1 px-2 rounded-lg cursor-pointer transition-colors"
                      title="Archive staff profile (Decommission)"
                    >
                      Archive Staff
                    </button>
                  )}
                </div>

                <div className="space-y-2 text-xs text-gray-500 border-t border-gray-50 pt-3">
                  <div className="flex items-center">
                    <Briefcase className="h-3.5 w-3.5 mr-2 text-gray-400 shrink-0" />
                    <span className="font-semibold text-gray-700">{member.department || 'General Medicine'}</span>
                    {member.specialization && (
                      <span className="text-gray-400 ml-1">({member.specialization})</span>
                    )}
                  </div>

                  {member.licenseNumber && (
                    <div className="flex items-center">
                      <Award className="h-3.5 w-3.5 mr-2 text-gray-400 shrink-0" />
                      <span className="font-mono text-gray-600 text-[11px] font-bold">License: {member.licenseNumber}</span>
                    </div>
                  )}

                  {member.qualification && (
                    <div className="flex items-center">
                      <BookOpen className="h-3.5 w-3.5 mr-2 text-gray-400 shrink-0" />
                      <span>{member.qualification}</span>
                    </div>
                  )}

                  <div className="flex items-center">
                    <Clock className="h-3.5 w-3.5 mr-2 text-gray-400 shrink-0" />
                    <span className="text-[11px] leading-relaxed">{member.workSchedule || 'No schedule assigned'}</span>
                  </div>

                  <div className="flex items-center">
                    <Calendar className="h-3.5 w-3.5 mr-2 text-gray-400 shrink-0" />
                    <span className="text-[10px] text-gray-400">Employed: {member.employmentDate || 'N/A'}</span>
                  </div>
                </div>

                <div className="flex justify-between items-center text-[10px] text-gray-400 font-mono border-t border-gray-50 pt-2.5">
                  <span className="truncate max-w-[150px]">{member.email}</span>
                  <span>{member.phone || 'No phone'}</span>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full text-center text-gray-400 py-8 font-mono">No clinical staff profiles match query parameters.</div>
          )}
        </div>
      </div>
    </div>
  );
}
