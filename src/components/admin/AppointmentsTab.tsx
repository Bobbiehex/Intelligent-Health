import React, { useState, useEffect } from 'react';
import { 
  Calendar, Search, RefreshCw, Clock, Tag, CheckCircle2, AlertCircle, PlayCircle, MoreHorizontal, Hourglass
} from 'lucide-react';
import { toast } from 'sonner';

interface AppointmentsTabProps {
  token: string;
}

export default function AppointmentsTab({ token }: AppointmentsTabProps) {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/appointments', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setAppointments(data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Filter list
  const filteredAppointments = appointments.filter(app => {
    const query = search.toLowerCase();
    const patientName = app.patient?.name?.toLowerCase() || '';
    const doctorName = app.doctor?.name?.toLowerCase() || '';
    const deptName = app.doctor?.department?.toLowerCase() || '';
    const matchesSearch = patientName.includes(query) || doctorName.includes(query) || deptName.includes(query);

    if (statusFilter === 'All') return matchesSearch;
    return matchesSearch && app.status === statusFilter;
  });

  return (
    <div className="bg-white border border-gray-100 rounded-3xl p-6 space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-50 pb-4">
        <div>
          <h3 className="font-bold text-sm text-gray-800 flex items-center space-x-2">
            <Calendar className="h-5 w-5 text-rose-500" />
            <span>Clinic Oversight & Scheduling Registry</span>
          </h3>
          <p className="text-[10px] text-gray-400 font-mono mt-0.5">MONITOR SCHEDULING DISPATCH, QUEUES AND WAITING TIMES</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-gray-300" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search patient, doctor, unit..."
              className="pl-8 pr-4 py-1.5 text-xs border border-gray-200 rounded-xl bg-gray-50 focus:outline-none w-full sm:w-60"
            />
          </div>
          
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="border border-gray-200 text-xs rounded-xl bg-gray-50 py-1.5 px-3 focus:outline-none"
          >
            <option value="All">All Statuses</option>
            <option value="PENDING">PENDING</option>
            <option value="CHECKED_IN">CHECKED IN (WAITING)</option>
            <option value="IN_CONSULTATION">IN CONSULTATION</option>
            <option value="COMPLETED">COMPLETED</option>
            <option value="CANCELLED">CANCELLED</option>
          </select>

          <button 
            onClick={fetchAppointments}
            className="bg-gray-50 border border-gray-200 p-2 rounded-xl hover:bg-gray-100 text-gray-600 transition-all flex items-center justify-center"
            title="Refresh list"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Directory Table */}
      <div className="overflow-x-auto text-xs">
        {loading ? (
          <div className="text-center py-8 font-mono text-gray-400">Compiling schedules...</div>
        ) : (
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-100 text-gray-400 font-mono uppercase tracking-wider text-[10px]">
                <th className="py-2.5">Date & Time</th>
                <th className="py-2.5">Patient Details</th>
                <th className="py-2.5">Assigned Clinician</th>
                <th className="py-2.5">Department / Clinic</th>
                <th className="py-2.5">Status</th>
                <th className="py-2.5 text-right">Reason</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredAppointments.length > 0 ? (
                filteredAppointments.map((app) => (
                  <tr key={app.id} className="hover:bg-gray-50/50">
                    <td className="py-3 font-mono text-gray-500 font-bold">
                      {app.dateTime}
                    </td>
                    <td className="py-3">
                      <div className="font-bold text-gray-800">{app.patient?.name || 'Walk-In'}</div>
                      <div className="text-[10px] text-gray-400 font-mono">ID: {app.patient?.patientId || '—'}</div>
                    </td>
                    <td className="py-3 font-semibold text-gray-700">
                      {app.doctor?.name || 'Unassigned GP'}
                    </td>
                    <td className="py-3 font-semibold text-indigo-600">
                      {app.doctor?.department || 'General Medicine'}
                    </td>
                    <td className="py-3">
                      <span className={`font-mono font-bold text-[9px] px-1.5 py-0.5 rounded border uppercase flex items-center w-fit space-x-1 ${
                        app.status === 'COMPLETED' 
                          ? 'bg-emerald-50 border-emerald-100 text-emerald-600' 
                          : app.status === 'IN_CONSULTATION'
                          ? 'bg-indigo-50 border-indigo-100 text-indigo-600'
                          : app.status === 'CHECKED_IN'
                          ? 'bg-amber-50 border-amber-100 text-amber-600'
                          : app.status === 'CANCELLED'
                          ? 'bg-rose-50 border-rose-100 text-rose-600'
                          : 'bg-gray-50 border-gray-100 text-gray-600'
                      }`}>
                        {app.status === 'COMPLETED' && <CheckCircle2 className="h-3 w-3 inline shrink-0" />}
                        {app.status === 'IN_CONSULTATION' && <PlayCircle className="h-3 w-3 inline shrink-0" />}
                        {app.status === 'CHECKED_IN' && <Hourglass className="h-3 w-3 inline shrink-0" />}
                        <span>{app.status}</span>
                      </span>
                    </td>
                    <td className="py-3 text-right text-gray-500 max-w-xs truncate" title={app.reason}>
                      {app.reason}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="text-center text-gray-400 py-8 font-mono">No appointment files found.</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
