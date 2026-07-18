import React, { useState, useEffect } from 'react';
import { 
  Search, Filter, MoreHorizontal, User, 
  Mail, Phone, Calendar, Download, Eye,
  Edit2, Printer, ArrowRight, MapPin, 
  ShieldAlert, History
} from 'lucide-react';
import { toast } from 'sonner';

interface PatientManagementProps {
  token: string;
}

export default function PatientManagement({ token }: PatientManagementProps) {
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<any | null>(null);

  useEffect(() => {
    fetchPatients();
  }, [token]);

  const fetchPatients = async () => {
    try {
      const res = await fetch('/api/patients', { headers: { 'Authorization': `Bearer ${token}` } });
      const data = await res.json();
      if (Array.isArray(data)) {
        setPatients(data);
      } else if (data.error) {
        toast.error(data.error);
        setPatients([]);
      } else {
        setPatients([]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredPatients = patients.filter(p => 
    p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.patientId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.mrn?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.phone?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const viewProfile = async (id: string) => {
    try {
      const res = await fetch(`/api/patients/${id}`, { headers: { 'Authorization': `Bearer ${token}` } });
      const data = await res.json();
      setSelectedPatient(data);
    } catch (err) {
      toast.error('Failed to fetch patient profile');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display font-bold text-gray-900 text-xl">Patient Directory</h2>
          <p className="text-sm text-gray-400">Search, view and manage medical record demographics</p>
        </div>
        <div className="flex items-center space-x-3">
          <button 
            onClick={async () => {
              toast.loading('Generating patient export...', { id: 'patient-gen' });
              try {
                const response = await fetch(`/api/patient/export?title=Patient-Directory-Export`, {
                  headers: { 'Authorization': `Bearer ${token}` }
                });
                if (!response.ok) throw new Error('Failed to generate export');
                
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `patient-directory-export.pdf`;
                document.body.appendChild(a);
                a.click();
                a.remove();
                toast.success('Patient list exported!', { id: 'patient-gen' });
              } catch (error) {
                console.error(error);
                toast.error('Failed to export patient list', { id: 'patient-gen' });
              }
            }}
            className="bg-gray-50 hover:bg-gray-100 text-gray-600 font-bold px-4 py-2.5 rounded-2xl flex items-center space-x-2 transition-all"
          >
            <Download className="h-4 w-4" />
            <span className="text-xs">Export List</span>
          </button>
        </div>
      </div>

      {!selectedPatient ? (
        <div className="space-y-6">
          {/* Search Bar */}
          <div className="bg-white border border-gray-100 p-4 rounded-3xl shadow-sm flex items-center space-x-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-300" />
              <input 
                type="text" 
                placeholder="Search by Patient ID, Name, MRN or Phone..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-gray-50 rounded-2xl text-sm border-none focus:ring-2 focus:ring-rose-500/10 outline-none transition-all"
              />
            </div>
            <div className="flex items-center space-x-2 px-4 py-3 bg-gray-50 rounded-2xl border border-gray-100 cursor-pointer hover:bg-gray-100 transition-all">
              <Filter className="h-4 w-4 text-gray-400" />
              <span className="text-xs font-semibold text-gray-500">Filters</span>
            </div>
          </div>

          {/* Patient Table */}
          <div className="bg-white border border-gray-100 rounded-[2rem] overflow-hidden shadow-sm">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100">
                  <th className="px-6 py-4 text-[10px] font-mono font-bold text-gray-400 uppercase tracking-wider">Patient ID / MRN</th>
                  <th className="px-6 py-4 text-[10px] font-mono font-bold text-gray-400 uppercase tracking-wider">Full Name</th>
                  <th className="px-6 py-4 text-[10px] font-mono font-bold text-gray-400 uppercase tracking-wider">Gender / DOB</th>
                  <th className="px-6 py-4 text-[10px] font-mono font-bold text-gray-400 uppercase tracking-wider">Contact Info</th>
                  <th className="px-6 py-4 text-[10px] font-mono font-bold text-gray-400 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredPatients.map((patient) => (
                  <tr key={patient.id} className="hover:bg-gray-50/50 transition-all group">
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <span className="text-xs font-mono font-bold text-rose-500 bg-rose-50 px-2 py-0.5 rounded uppercase">{patient.patientId || 'NEW'}</span>
                        <span className="block text-[10px] text-gray-400 font-mono">{patient.mrn || 'PENDING'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center text-gray-400 group-hover:bg-white group-hover:shadow-sm transition-all">
                          <User className="h-5 w-5" />
                        </div>
                        <span className="text-sm font-bold text-gray-800">{patient.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-xs text-gray-600">
                        <p>{patient.gender || 'Not set'}</p>
                        <p className="text-[10px] text-gray-400 mt-0.5">{patient.dob || 'DOB Pending'}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2 text-[11px] text-gray-500">
                          <Phone className="h-3 w-3" />
                          <span>{patient.phone || 'N/A'}</span>
                        </div>
                        <div className="flex items-center space-x-2 text-[11px] text-gray-500">
                          <Mail className="h-3 w-3" />
                          <span>{patient.email}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => viewProfile(patient.id)}
                        className="p-2.5 text-gray-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                      >
                        <Eye className="h-5 w-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredPatients.length === 0 && (
              <div className="py-20 text-center">
                <Search className="h-12 w-12 text-gray-100 mx-auto mb-4" />
                <p className="text-gray-400 text-sm">No patients found matching your search</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="animate-in slide-in-from-right-4 duration-500 space-y-8">
          <button 
            onClick={() => setSelectedPatient(null)}
            className="flex items-center space-x-2 text-xs font-bold text-gray-500 hover:text-gray-700 mb-4 transition-all"
          >
            <ArrowRight className="h-4 w-4 rotate-180" />
            <span>Back to Directory</span>
          </button>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Patient Hero Card */}
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-white border border-gray-100 rounded-[2.5rem] p-8 shadow-sm text-center">
                <div className="w-24 h-24 bg-rose-50 rounded-full mx-auto mb-6 flex items-center justify-center">
                  {selectedPatient.passportPhoto ? (
                    <img src={selectedPatient.passportPhoto} alt="Passport" className="w-full h-full rounded-full object-cover" />
                  ) : (
                    <User className="h-12 w-12 text-rose-500" />
                  )}
                </div>
                <h3 className="text-xl font-display font-bold text-gray-900">{selectedPatient.name}</h3>
                <div className="flex items-center justify-center space-x-2 mt-2">
                  <span className="text-[10px] font-mono font-bold text-rose-500 bg-rose-50 px-2 py-0.5 rounded uppercase">{selectedPatient.patientId}</span>
                  <span className="w-1.5 h-1.5 bg-gray-300 rounded-full" />
                  <span className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest">{selectedPatient.mrn}</span>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-8 pt-8 border-t border-gray-50">
                  <div className="text-left">
                    <p className="text-[9px] font-mono font-bold text-gray-400 uppercase tracking-wider">Registration</p>
                    <p className="text-xs font-bold text-gray-700 mt-1">{new Date(selectedPatient.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div className="text-left">
                    <p className="text-[9px] font-mono font-bold text-gray-400 uppercase tracking-wider">Status</p>
                    <p className="text-xs font-bold text-emerald-500 mt-1 flex items-center">
                      <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-1.5" />
                      Active
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2 mt-8">
                  <button onClick={handlePrint} className="flex-1 bg-gray-900 text-white font-bold py-3.5 rounded-2xl text-xs hover:bg-black transition-all flex items-center justify-center space-x-2 shadow-lg">
                    <Printer className="h-4 w-4" />
                    <span>Print Records</span>
                  </button>
                  <button 
                    onClick={() => toast.info('Updating Demographics', { description: 'Please navigate to the registration tab to modify patient records.' })}
                    className="p-3.5 bg-gray-50 text-gray-400 rounded-2xl hover:bg-gray-100 transition-all border border-gray-100"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="bg-rose-50 border border-rose-100 p-6 rounded-[2rem]">
                <div className="flex items-center space-x-2 text-rose-600 font-bold text-xs uppercase tracking-widest mb-4">
                  <ShieldAlert className="h-4 w-4" />
                  <span>Restricted Access</span>
                </div>
                <p className="text-[11px] text-rose-700/70 leading-relaxed italic">
                  Note: As a Receptionist, you cannot view confidential clinical diagnosis, prescriptions, or physician private notes.
                </p>
              </div>
            </div>

            {/* Profile Tabs/Info */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white border border-gray-100 rounded-[2.5rem] p-8 shadow-sm">
                <h4 className="font-display font-bold text-gray-900 text-base mb-8">Personal Demographics</h4>
                
                <div className="grid grid-cols-2 gap-y-8 gap-x-12">
                  <div>
                    <p className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-wider mb-1">Full Identity</p>
                    <p className="text-sm font-semibold text-gray-700">{selectedPatient.firstName} {selectedPatient.middleName} {selectedPatient.lastName}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-wider mb-1">Gender / Bio</p>
                    <p className="text-sm font-semibold text-gray-700">{selectedPatient.gender} • {selectedPatient.bloodGroup} / {selectedPatient.genotype || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-wider mb-1">Marital Status</p>
                    <p className="text-sm font-semibold text-gray-700">{selectedPatient.maritalStatus || 'Single'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-wider mb-1">Occupation</p>
                    <p className="text-sm font-semibold text-gray-700">{selectedPatient.occupation || 'Not specified'}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-wider mb-1">Home Address</p>
                    <div className="flex items-start space-x-2 text-sm font-semibold text-gray-700">
                      <MapPin className="h-4 w-4 text-gray-300 mt-0.5" />
                      <span>{selectedPatient.address}, {selectedPatient.city}, {selectedPatient.state}, {selectedPatient.country}</span>
                    </div>
                  </div>
                  <div className="col-span-2 pt-8 border-t border-gray-50 grid grid-cols-2 gap-8">
                    <div>
                      <p className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-wider mb-1">Emergency Contact</p>
                      <p className="text-sm font-bold text-gray-700">{selectedPatient.emergencyContactName || 'None'}</p>
                      <p className="text-xs text-gray-400 mt-1">{selectedPatient.emergencyContactPhone || 'No contact number'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-wider mb-1">Identification</p>
                      <p className="text-sm font-bold text-gray-700">{selectedPatient.idNumber || 'No ID on file'}</p>
                      <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest mt-1">Verified</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-gray-100 rounded-[2.5rem] p-8 shadow-sm">
                <div className="flex items-center justify-between mb-8">
                  <h4 className="font-display font-bold text-gray-900 text-base">Visit & Scheduling History</h4>
                  <History className="h-5 w-5 text-gray-300" />
                </div>
                
                <div className="space-y-4">
                  {selectedPatient.patientAppointments && selectedPatient.patientAppointments.length > 0 ? (
                    selectedPatient.patientAppointments.slice(0, 5).map((app: any) => (
                      <div key={app.id} className="flex items-center justify-between py-4 border-b border-gray-50 last:border-0">
                        <div className="flex items-center space-x-4">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                            app.status === 'Completed' ? 'bg-emerald-50 text-emerald-500' : 'bg-rose-50 text-rose-500'
                          }`}>
                            <Calendar className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-gray-800">{app.reason}</p>
                            <p className="text-[10px] text-gray-400 mt-0.5">{new Date(app.dateTime).toLocaleDateString()} • {app.status}</p>
                          </div>
                        </div>
                        <ArrowRight className="h-4 w-4 text-gray-300" />
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-gray-400 py-4 italic">No previous appointments found for this patient.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
