import React, { useState } from 'react';
import { 
  Users, Search, RefreshCw, Eye, GitMerge, FileText, Calendar, Trash2, Heart, AlertCircle, ShieldAlert
} from 'lucide-react';
import { toast } from 'sonner';

interface PatientsTabProps {
  patients: any[];
  token: string;
  onRefresh: () => void;
}

export default function PatientsTab({ patients, token, onRefresh }: PatientsTabProps) {
  const [search, setSearch] = useState('');
  const [viewHistoryPatient, setViewHistoryPatient] = useState<any | null>(null);
  const [historyLogs, setHistoryLogs] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Merge states
  const [isMerging, setIsMerging] = useState(false);
  const [sourceId, setSourceId] = useState('');
  const [targetId, setTargetId] = useState('');
  const [submittingMerge, setSubmittingMerge] = useState(false);

  // Toggle active patient status
  const handleToggleActive = async (patientId: string, currentStatus: boolean, patientName: string) => {
    try {
      const res = await fetch(`/api/admin/users/${patientId}/management`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ isActive: !currentStatus })
      });
      if (!res.ok) throw new Error('Failed to update patient file status');
      toast.success(`Patient record of "${patientName}" ${!currentStatus ? 'Activated' : 'Suspended'}`);
      onRefresh();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  // View patient action history
  const handleViewHistory = async (patient: any) => {
    setViewHistoryPatient(patient);
    setLoadingHistory(true);
    try {
      const res = await fetch(`/api/admin/patients/${patient.id}/audits`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setHistoryLogs(data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingHistory(false);
    }
  };

  // Execute patient file merge
  const handleMergeRecords = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sourceId || !targetId) {
      toast.error('Please select both the source and target clinical records.');
      return;
    }
    if (sourceId === targetId) {
      toast.error('The source record and target record must be distinct clinical files.');
      return;
    }

    const sourcePatient = patients.find(p => p.id === sourceId);
    const targetPatient = patients.find(p => p.id === targetId);

    const message = `⚠️ CRITICAL MERGE NOTICE! ⚠️\n\n` +
      `This action consolidates ALL clinical data associated with "${sourcePatient?.name}" into the target medical file of "${targetPatient?.name}".\n\n` +
      `This will completely REASSIGN:\n` +
      `• Appointments & Consultation SOPs\n` +
      `• Lab Requests & Analysis results\n` +
      `• Prescriptions & Dispensing Records\n` +
      `• Vitals Logs & Conditions\n\n` +
      `The source user profile of "${sourcePatient?.name}" will be PERMANENTLY DELETED.\n\n` +
      `Are you absolutely certain you wish to proceed? Type 'CONFIRM' to execute:`;

    const validation = prompt(message);
    if (validation !== 'CONFIRM') {
      toast.info('Merge aborted by administrator.');
      return;
    }

    setSubmittingMerge(true);
    try {
      const res = await fetch('/api/admin/patients/merge', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ sourcePatientId: sourceId, targetPatientId: targetId })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Clinical merge transaction failed');

      toast.success(`Duplicate record successfully consolidated into ${targetPatient?.name}!`);
      setIsMerging(false);
      setSourceId('');
      setTargetId('');
      onRefresh();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSubmittingMerge(false);
    }
  };

  const filteredPatients = patients.filter(p => {
    const query = search.toLowerCase();
    return p.name.toLowerCase().includes(query) || 
           p.email.toLowerCase().includes(query) ||
           (p.phone && p.phone.toLowerCase().includes(query)) ||
           (p.patientId && p.patientId.toLowerCase().includes(query));
  });

  return (
    <div className="space-y-6">
      {/* Patient Action panel */}
      <div className="bg-white border border-gray-100 rounded-3xl p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="text-[10px] text-gray-400 font-mono uppercase block">Medical Registry Controls</span>
          <h4 className="font-bold text-sm text-gray-800">Comprehensive Patient Directory & Clinical Merging</h4>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setIsMerging(!isMerging)}
            className="bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-bold px-4 py-2.5 rounded-xl transition-all cursor-pointer flex items-center space-x-2 hover:bg-indigo-100/50"
          >
            <GitMerge className="h-4 w-4" />
            <span>{isMerging ? 'Dismiss Record Consolidation' : 'Merge Duplicate Patient Files'}</span>
          </button>
        </div>
      </div>

      {/* Merge Duplicate warning and action panel */}
      {isMerging && (
        <form onSubmit={handleMergeRecords} className="bg-rose-50/20 border border-rose-100 rounded-3xl p-6 space-y-4 animate-fadeIn">
          <div className="flex items-start space-x-3 text-rose-800">
            <ShieldAlert className="h-5 w-5 shrink-0 mt-0.5" />
            <div>
              <h5 className="font-bold text-xs uppercase tracking-wider font-mono">Consolidate Duplicate Patient Records</h5>
              <p className="text-[10px] text-rose-600 mt-0.5 leading-normal">
                Carefully select duplicate entries below to merge all clinical records into a single medical file. The duplicate account will be deleted.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-bold text-gray-500 font-mono block mb-1">DUPLICATE PROFILE TO DELETE (SOURCE RECORD)</label>
              <select
                required
                value={sourceId}
                onChange={e => setSourceId(e.target.value)}
                className="w-full text-xs py-2 px-3 border border-gray-200 rounded-xl focus:outline-none bg-white font-semibold text-gray-700"
              >
                <option value="">Select source patient file...</option>
                {patients.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.patientId || p.email})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[10px] font-bold text-gray-500 font-mono block mb-1">STABLE PROFILE TO RETAIN (TARGET CONSOLIDATION RECORD)</label>
              <select
                required
                value={targetId}
                onChange={e => setTargetId(e.target.value)}
                className="w-full text-xs py-2 px-3 border border-gray-200 rounded-xl focus:outline-none bg-white font-semibold text-gray-700"
              >
                <option value="">Select target consolidated record...</option>
                {patients.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.patientId || p.email})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-end pt-2 border-t border-gray-100">
            <button
              type="submit"
              disabled={submittingMerge}
              className="bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold px-5 py-2.5 rounded-xl transition-colors disabled:opacity-50 cursor-pointer"
            >
              {submittingMerge ? 'Consolidating records...' : 'Trigger Clinical Merge Transaction'}
            </button>
          </div>
        </form>
      )}

      {/* Registry Database List */}
      <div className="bg-white border border-gray-100 rounded-3xl p-6">
        <div className="flex items-center justify-between border-b border-gray-50 pb-4 mb-4 gap-4">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-gray-300" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name, MRN, NHS number..."
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

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-gray-100 text-gray-400 font-mono uppercase tracking-wider text-[10px] pb-2">
                <th className="py-2">Registry Details</th>
                <th className="py-2">MRN/ID</th>
                <th className="py-2">Demographics</th>
                <th className="py-2">Allergies/History</th>
                <th className="py-2 text-center">Status</th>
                <th className="py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredPatients.length > 0 ? (
                filteredPatients.map((patient) => (
                  <tr key={patient.id} className="hover:bg-gray-50/50">
                    <td className="py-3">
                      <div className="font-bold text-gray-800">{patient.name}</div>
                      <div className="text-gray-400 text-[10px]">{patient.email}</div>
                    </td>
                    <td className="py-3 font-mono font-bold text-indigo-600 text-[11px]">
                      {patient.patientId || 'PENDING'}
                    </td>
                    <td className="py-3 space-y-0.5">
                      <div className="text-gray-700 font-medium">DOB: {patient.dob || '—'}</div>
                      <div className="text-gray-400 text-[10px] uppercase font-mono">{patient.gender} • Blood: {patient.bloodGroup || '—'}</div>
                    </td>
                    <td className="py-3 max-w-xs truncate text-gray-500" title={patient.medicalHistoryNotes || 'None'}>
                      {patient.medicalHistoryNotes || 'No recorded history notes'}
                    </td>
                    <td className="py-3 text-center">
                      <button
                        onClick={() => handleToggleActive(patient.id, patient.isActive, patient.name)}
                        className={`font-mono text-[9px] font-bold px-2 py-1 rounded-xl transition-colors cursor-pointer border ${
                          patient.isActive 
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-100' 
                            : 'bg-rose-50 text-rose-700 border-rose-100 hover:bg-rose-100'
                        }`}
                      >
                        {patient.isActive ? '● ACTIVE' : '○ SUSPENDED'}
                      </button>
                    </td>
                    <td className="py-3 text-right">
                      <button
                        onClick={() => handleViewHistory(patient)}
                        className="text-gray-400 hover:text-indigo-600 p-1.5 transition-colors cursor-pointer"
                        title="View Patient System Audit Logs"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="text-center text-gray-400 py-8 font-mono">No patients match search parameters.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Patient System logs modal / section */}
      {viewHistoryPatient && (
        <div className="bg-white border border-gray-100 rounded-3xl p-6 space-y-4 animate-fadeIn">
          <div className="flex justify-between items-start border-b border-gray-50 pb-3">
            <div>
              <h5 className="font-bold text-xs text-gray-700 uppercase tracking-wider font-mono">System Footprint Logs</h5>
              <h4 className="font-bold text-sm text-gray-800">Security & Operational trail: {viewHistoryPatient.name}</h4>
            </div>
            <button
              onClick={() => setViewHistoryPatient(null)}
              className="text-gray-400 hover:text-rose-500 font-bold text-xs"
            >
              Dismiss Logs
            </button>
          </div>

          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {loadingHistory ? (
              <div className="text-center py-4 font-mono text-xs text-gray-400">Loading audit history...</div>
            ) : historyLogs.length > 0 ? (
              historyLogs.map((log: any) => (
                <div key={log.id} className="p-2.5 bg-gray-50 rounded-xl flex justify-between items-start text-[11px] gap-4">
                  <div>
                    <span className="font-bold text-gray-800 block">{log.action}</span>
                    <span className="text-gray-500 block leading-normal">{log.details}</span>
                  </div>
                  <span className="font-mono text-gray-400 text-[10px] shrink-0">
                    {new Date(log.timestamp).toLocaleString()}
                  </span>
                </div>
              ))
            ) : (
              <div className="text-center py-4 font-mono text-xs text-gray-400">No history logged for this identity.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
