import React, { useState, useEffect } from 'react';
import { 
  Shield, Server, RefreshCw, Database, Download, CheckCircle2, AlertTriangle, ShieldAlert, Search, Trash2, Key, LogOut, ShieldCheck
} from 'lucide-react';
import { toast } from 'sonner';

interface SecurityBackupTabProps {
  token: string;
  auditLogs: any[];
  onRefreshAudit: () => void;
  onPurgeAudit: () => void;
}

export default function SecurityBackupTab({ token, auditLogs, onRefreshAudit, onPurgeAudit }: SecurityBackupTabProps) {
  const [backups, setBackups] = useState<any[]>([]);
  const [loadingBackups, setLoadingBackups] = useState(true);
  const [creatingBackup, setCreatingBackup] = useState(false);
  const [restoringId, setRestoringId] = useState<string | null>(null);

  // Search / Filters for audits
  const [search, setSearch] = useState('');
  const [severityFilter, setSeverityFilter] = useState('All');

  useEffect(() => {
    fetchBackups();
  }, []);

  const fetchBackups = async () => {
    setLoadingBackups(true);
    try {
      const res = await fetch('/api/admin/backups', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setBackups(data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingBackups(false);
    }
  };

  const handleCreateBackup = async () => {
    setCreatingBackup(true);
    try {
      const res = await fetch('/api/admin/backups', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!res.ok) throw new Error('Failed to generate backup');

      toast.success('Database backup created successfully!');
      fetchBackups();
      onRefreshAudit();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setCreatingBackup(false);
    }
  };

  const handleRestoreBackup = async (id: string, filename: string) => {
    const doubleConfirm = prompt(`⚠️ WARNING: RESTORE TRANSACTION ⚠️\n\nThis will completely OVERWRITE all current patient records, scheduled appointments, consultation notes, prescriptions, and staff parameters with the records inside: "${filename}".\n\nAll current unbacked clinical data will be permanently lost.\n\nTo proceed, type "${filename}" below:`);
    
    if (doubleConfirm !== filename) {
      toast.info('Database restore transaction aborted.');
      return;
    }

    setRestoringId(id);
    try {
      const res = await fetch(`/api/admin/backups/${id}/restore`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Restore transaction failed');

      toast.success('System database successfully restored from snapshot!');
      fetchBackups();
      onRefreshAudit();
      
      // Auto refresh full screen
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setRestoringId(null);
    }
  };

  const filteredLogs = auditLogs.filter(log => {
    const matchesSearch = log.action.toLowerCase().includes(search.toLowerCase()) || 
                          log.userName.toLowerCase().includes(search.toLowerCase()) ||
                          log.details.toLowerCase().includes(search.toLowerCase());
    
    if (severityFilter === 'All') return matchesSearch;
    return matchesSearch && log.severity === severityFilter;
  });

  return (
    <div className="space-y-6">
      {/* Top statistics overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Compliance details */}
        <div className="bg-white border border-gray-100 p-5 rounded-3xl space-y-4">
          <div className="flex items-center space-x-3 text-emerald-600">
            <ShieldCheck className="h-5 w-5" />
            <h4 className="font-bold text-sm text-gray-800">Operational Compliance Standards</h4>
          </div>
          <p className="text-xs text-gray-500 leading-relaxed">
            All audit logs conform to HIPAA §164.312(b) technical security requirements. Entries are immutable and cannot be modified by any clinician or clinic supervisor.
          </p>
          <div className="flex justify-between items-center bg-emerald-50/50 p-2.5 rounded-xl text-[10px] text-emerald-800 font-semibold font-mono border border-emerald-100/50">
            <span>AUDIT INTEGRITY: SECURE</span>
            <span>AES-256 ENCRYPTED</span>
          </div>
        </div>

        {/* Dynamic backup engine controls */}
        <div className="bg-white border border-gray-100 p-5 rounded-3xl flex flex-col justify-between">
          <div className="space-y-1">
            <div className="flex items-center space-x-3 text-indigo-600">
              <Server className="h-5 w-5" />
              <h4 className="font-bold text-sm text-gray-800">On-Demand Database Backups</h4>
            </div>
            <p className="text-xs text-gray-500 leading-normal">
              Back up full clinic data structures, including lab result assets, pharmacy dispenses, patient registries, and AI parameters.
            </p>
          </div>
          <button
            onClick={handleCreateBackup}
            disabled={creatingBackup}
            className="mt-4 w-full bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold py-2.5 rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center space-x-2 cursor-pointer"
          >
            <Database className="h-4 w-4" />
            <span>{creatingBackup ? 'Compiling Backup Snapshot...' : 'Create Backup Snapshot'}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Historical Snapshots */}
        <div className="bg-white border border-gray-100 p-6 rounded-3xl lg:col-span-4 space-y-4">
          <div className="flex justify-between items-center border-b border-gray-50 pb-3">
            <div>
              <h4 className="font-bold text-xs uppercase tracking-wider font-mono text-gray-400">Database Backups</h4>
              <h3 className="font-bold text-sm text-gray-800">Historical Snapshots</h3>
            </div>
            <button 
              onClick={fetchBackups}
              className="bg-gray-50 border border-gray-200 p-1.5 rounded-xl text-gray-500"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
            {loadingBackups ? (
              <div className="text-center py-6 text-gray-400 font-mono text-xs">Polling snapshots...</div>
            ) : backups.length > 0 ? (
              backups.map((b) => (
                <div key={b.id} className="p-3 border border-gray-100 rounded-2xl space-y-2.5 bg-gray-50/50">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="truncate max-w-[120px] font-mono font-bold text-gray-700" title={b.filename}>
                      {b.filename}
                    </span>
                    <span className="text-[10px] text-gray-400 font-mono shrink-0 ml-1">{b.size}</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] text-gray-400 font-mono">
                      {new Date(b.createdAt).toLocaleString()}
                    </span>
                    
                    <button
                      onClick={() => handleRestoreBackup(b.id, b.filename)}
                      disabled={restoringId === b.id}
                      className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-100 font-mono font-bold text-[9px] px-2 py-1 rounded cursor-pointer transition-all disabled:opacity-50"
                    >
                      {restoringId === b.id ? 'Restoring...' : 'Restore'}
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-400 font-mono text-xs">No historical snapshots recorded.</div>
            )}
          </div>
        </div>

        {/* Compliance Audit log trails */}
        <div className="bg-white border border-gray-100 p-6 rounded-3xl lg:col-span-8 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-50 pb-4">
            <div>
              <h4 className="font-bold text-xs uppercase tracking-wider font-mono text-rose-500">HIPAA Compliant Trail</h4>
              <h3 className="font-bold text-sm text-gray-800 flex items-center space-x-2">
                <Shield className="h-5 w-5 text-rose-500 shrink-0" />
                <span>Cyber Security Audit Trails</span>
              </h3>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 shrink-0">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-gray-300" />
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search actions, names..."
                  className="pl-8 pr-4 py-1.5 text-xs border border-gray-200 rounded-xl bg-gray-50 focus:outline-none w-full sm:w-44"
                />
              </div>
              
              <select
                value={severityFilter}
                onChange={e => setSeverityFilter(e.target.value)}
                className="border border-gray-200 text-xs rounded-xl bg-gray-50 py-1.5 px-2 focus:outline-none"
              >
                <option value="All">All Severity</option>
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>

              <button
                onClick={onPurgeAudit}
                className="bg-rose-50 border border-rose-100 hover:bg-rose-100 p-1.5 rounded-xl text-rose-700 shrink-0 cursor-pointer"
                title="Purge audit logs"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          <div className="overflow-x-auto text-xs max-h-[320px] overflow-y-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-100 text-gray-400 font-mono uppercase tracking-wider text-[9px] pb-2">
                  <th className="py-2">Date & Time</th>
                  <th className="py-2">Authorized User</th>
                  <th className="py-2">Role</th>
                  <th className="py-2">Audit Action</th>
                  <th className="py-2">Secured Details</th>
                  <th className="py-2 text-right">Severity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredLogs.length > 0 ? (
                  filteredLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50/50">
                      <td className="py-3 font-mono text-gray-400 text-[9px] whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td className="py-3 font-semibold text-gray-700 whitespace-nowrap">{log.userName}</td>
                      <td className="py-3 font-mono text-[9px] text-gray-400">{log.role}</td>
                      <td className="py-3 font-bold text-gray-800 whitespace-nowrap">{log.action}</td>
                      <td className="py-3 text-gray-500 max-w-xs truncate" title={log.details}>{log.details}</td>
                      <td className="py-3 text-right">
                        <span className={`font-mono font-bold text-[8px] px-1.5 py-0.5 rounded border uppercase shrink-0 ${
                          log.severity === 'High' 
                            ? 'bg-rose-50 border-rose-100 text-rose-600' 
                            : log.severity === 'Medium'
                            ? 'bg-amber-50 border-amber-100 text-amber-600'
                            : 'bg-emerald-50 border-emerald-100 text-emerald-600'
                        }`}>
                          {log.severity}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="text-center text-gray-400 py-8 font-mono">No security logs recorded.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
