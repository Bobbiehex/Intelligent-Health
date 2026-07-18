import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  MoreVertical, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  AlertTriangle,
  FlaskConical,
  User,
  Activity,
  ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface LabRequest {
  id: string;
  testName: string;
  department: string;
  priority: 'ROUTINE' | 'URGENT' | 'EMERGENCY';
  status: string;
  createdAt: string;
  patient: {
    name: string;
    patientId: string;
    gender: string;
    dob: string;
  };
  doctor: {
    name: string;
    department: string;
  };
}

export const RequestQueue: React.FC = () => {
  const [requests, setRequests] = useState<LabRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [selectedRequest, setSelectedRequest] = useState<LabRequest | null>(null);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const response = await fetch('/api/lab/requests', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await response.json();
      setRequests(data);
    } catch (error) {
      console.error('Failed to fetch requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateRequestStatus = async (id: string, status: string) => {
    try {
      const response = await fetch(`/api/lab/requests/${id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}` 
        },
        body: JSON.stringify({ status })
      });
      if (response.ok) {
        fetchRequests();
        setSelectedRequest(null);
      }
    } catch (error) {
      console.error('Failed to update request:', error);
    }
  };

  const filteredRequests = requests.filter(req => {
    const matchesSearch = req.patient.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         req.testName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         req.patient.patientId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'ALL' || req.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'EMERGENCY': return 'bg-rose-50 text-rose-600 border-rose-100';
      case 'URGENT': return 'bg-amber-50 text-amber-600 border-amber-100';
      default: return 'bg-blue-50 text-blue-600 border-blue-100';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'text-amber-500 bg-amber-50';
      case 'ACCEPTED': return 'text-blue-500 bg-blue-50';
      case 'COMPLETED': return 'text-emerald-500 bg-emerald-50';
      case 'CANCELLED':
      case 'REJECTED': return 'text-rose-500 bg-rose-50';
      default: return 'text-gray-500 bg-gray-50';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-gray-900 tracking-tight">Work Queue</h2>
          <p className="text-sm text-gray-500 font-medium">Manage incoming laboratory requests and priorities</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
            <input 
              type="text" 
              placeholder="Search patient, ID, or test..."
              className="pl-11 pr-4 py-3 bg-gray-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-blue-500 outline-none w-64 transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 bg-gray-50 p-1 rounded-2xl border border-gray-100">
            {['ALL', 'PENDING', 'ACCEPTED', 'COMPLETED'].map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-4 py-2 text-[10px] font-bold rounded-xl uppercase tracking-wider transition-all ${
                  filterStatus === status 
                    ? 'bg-white text-blue-600 shadow-sm' 
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Requests Table */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100">
                <th className="px-6 py-4 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Patient Details</th>
                <th className="px-6 py-4 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Test Requested</th>
                <th className="px-6 py-4 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Priority</th>
                <th className="px-6 py-4 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Requested At</th>
                <th className="px-6 py-4 text-right text-[10px] font-bold text-gray-400 uppercase tracking-widest">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <Activity className="h-6 w-6 text-blue-500 animate-spin mx-auto mb-2" />
                    <p className="text-sm font-medium text-gray-400">Loading requests...</p>
                  </td>
                </tr>
              ) : filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <p className="text-sm font-medium text-gray-400">No requests found matching filters.</p>
                  </td>
                </tr>
              ) : filteredRequests.map((req, idx) => (
                <motion.tr 
                  key={req.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: idx * 0.05 }}
                  className="hover:bg-gray-50/50 transition-colors group"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 bg-blue-50 rounded-xl flex items-center justify-center">
                        <User className="h-5 w-5 text-blue-500" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900 leading-none">{req.patient.name}</p>
                        <p className="text-[10px] font-bold text-gray-400 mt-1 uppercase tracking-wider">{req.patient.patientId}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <p className="text-sm font-bold text-gray-900 leading-none">{req.testName}</p>
                      <p className="text-[10px] font-bold text-blue-500 mt-1 uppercase tracking-wider">{req.department}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${getPriorityColor(req.priority)}`}>
                      {req.priority}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${getStatusColor(req.status)}`}>
                      {req.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-gray-400">
                      <Clock className="h-3 w-3" />
                      <span className="text-[10px] font-bold">{new Date(req.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      {req.status === 'PENDING' && (
                        <>
                          <button 
                            onClick={() => updateRequestStatus(req.id, 'ACCEPTED')}
                            className="p-2 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100 transition-colors"
                            title="Accept Request"
                          >
                            <CheckCircle2 className="h-4 w-4" />
                          </button>
                          <button 
                            onClick={() => updateRequestStatus(req.id, 'REJECTED')}
                            className="p-2 bg-rose-50 text-rose-600 rounded-lg hover:bg-rose-100 transition-colors"
                            title="Reject Request"
                          >
                            <XCircle className="h-4 w-4" />
                          </button>
                        </>
                      )}
                      <button 
                        onClick={() => setSelectedRequest(req)}
                        className="p-2 bg-gray-50 text-gray-400 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <ArrowRight className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal / Slide-over (Simple placeholder for now) */}
      <AnimatePresence>
        {selectedRequest && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedRequest(null)}
              className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative bg-white w-full max-w-2xl rounded-[40px] shadow-2xl p-10 overflow-hidden"
            >
              <div className="flex items-start justify-between mb-8">
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 bg-blue-50 rounded-[20px] flex items-center justify-center">
                    <FlaskConical className="h-8 w-8 text-blue-500" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-gray-900 tracking-tight">{selectedRequest.testName}</h3>
                    <p className="text-gray-400 font-bold uppercase text-xs tracking-widest">{selectedRequest.department}</p>
                  </div>
                </div>
                <button onClick={() => setSelectedRequest(null)} className="p-3 hover:bg-gray-50 rounded-2xl transition-colors">
                  <XCircle className="h-6 w-6 text-gray-300" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div>
                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3">Patient Information</h4>
                    <div className="bg-gray-50 p-6 rounded-3xl space-y-4 border border-gray-100">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-gray-400">Name</span>
                        <span className="text-sm font-bold text-gray-900">{selectedRequest.patient.name}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-gray-400">ID Number</span>
                        <span className="text-sm font-bold text-gray-900">{selectedRequest.patient.patientId}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-gray-400">Gender/Age</span>
                        <span className="text-sm font-bold text-gray-900">{selectedRequest.patient.gender} • {new Date().getFullYear() - new Date(selectedRequest.patient.dob).getFullYear()}Y</span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3">Ordering Physician</h4>
                    <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100">
                      <p className="text-sm font-bold text-gray-900">{selectedRequest.doctor.name}</p>
                      <p className="text-[10px] font-bold text-blue-500 mt-1 uppercase tracking-wider">{selectedRequest.doctor.department}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3">Priority Status</h4>
                    <div className={`p-6 rounded-3xl border flex items-center justify-between ${getPriorityColor(selectedRequest.priority)}`}>
                      <span className="text-lg font-black">{selectedRequest.priority}</span>
                      <AlertTriangle className="h-6 w-6" />
                    </div>
                  </div>

                  {selectedRequest.status === 'ACCEPTED' && (
                    <button 
                      className="w-full py-6 bg-blue-600 hover:bg-blue-700 text-white rounded-3xl font-black text-sm transition-all shadow-xl shadow-blue-100 uppercase tracking-widest flex items-center justify-center gap-3"
                    >
                      <CheckCircle2 className="h-5 w-5" />
                      Proceed to Sample Collection
                    </button>
                  )}
                  
                  {selectedRequest.status === 'PENDING' && (
                    <div className="grid grid-cols-2 gap-4">
                      <button 
                        onClick={() => updateRequestStatus(selectedRequest.id, 'ACCEPTED')}
                        className="py-6 bg-emerald-500 hover:bg-emerald-600 text-white rounded-3xl font-black text-sm transition-all shadow-xl shadow-emerald-100 uppercase tracking-widest"
                      >
                        Accept
                      </button>
                      <button 
                        onClick={() => updateRequestStatus(selectedRequest.id, 'REJECTED')}
                        className="py-6 bg-rose-500 hover:bg-rose-600 text-white rounded-3xl font-black text-sm transition-all shadow-xl shadow-rose-100 uppercase tracking-widest"
                      >
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
