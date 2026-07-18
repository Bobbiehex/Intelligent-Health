import React, { useState, useEffect } from 'react';
import { 
  Ticket, User, ArrowRight, UserMinus, 
  UserCheck, AlertCircle, Clock, Volume2,
  SkipForward, ChevronRight, Play, CheckCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { registerSseListener } from '../../utils/apiClient';

interface QueueManagerProps {
  token: string;
}

export default function QueueManager({ token }: QueueManagerProps) {
  const [queue, setQueue] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchQueue();
    const unsubscribe = registerSseListener(() => {
      fetchQueue();
    });
    return () => unsubscribe();
  }, []);

  const fetchQueue = async () => {
    try {
      const res = await fetch('/api/queue', { headers: { 'Authorization': `Bearer ${token}` } });
      const data = await res.json();
      if (Array.isArray(data)) {
        setQueue(data);
      } else if (data.error) {
        toast.error(`Queue: ${data.error}`);
        setQueue([]);
      } else {
        setQueue([]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      const res = await fetch(`/api/queue/${id}/status`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ status })
      });
      if (!res.ok) throw new Error(`Failed to update status to ${status}`);
      
      const statusMsgs: Record<string, string> = {
        'Calling': 'Patient notified and called to consultation.',
        'Accepted': 'Patient has accepted the call.',
        'With Doctor': 'Patient is now with the physician.',
        'Absent': 'Patient marked as absent.',
        'Completed': 'Patient consultation finished.'
      };
      
      toast.success(statusMsgs[status] || 'Status updated');
      fetchQueue();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleDischarge = async (id: string) => {
    handleUpdateStatus(id, 'Discharged');
  };

  const currentPatient = queue.find(q => q.status === 'Calling' || q.status === 'Accepted' || q.status === 'With Doctor') || queue[0];
  const waitingQueue = queue.filter(q => q.id !== currentPatient?.id && q.status === 'Waiting');

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display font-bold text-gray-900 text-xl">Live Clinic Queue</h2>
          <p className="text-sm text-gray-400">Real-time patient flow and waiting room management</p>
        </div>
        <div className="flex items-center space-x-3 bg-white border border-gray-100 px-4 py-2 rounded-2xl shadow-sm">
          <div className="flex -space-x-2">
            {[1,2,3].map(i => (
              <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-gray-100" />
            ))}
          </div>
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">{queue.length} Active Patients</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Main Board: Current Serving */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-gray-900 rounded-[2.5rem] p-10 text-white relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 p-12 opacity-10">
              <Ticket className="w-64 h-64 -rotate-12" />
            </div>

            <div className="relative z-10">
              <div className="flex items-center space-x-3 mb-8">
                <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center backdrop-blur-sm">
                  <Volume2 className="h-5 w-5 text-rose-400" />
                </div>
                <span className="text-xs font-bold text-rose-400 uppercase tracking-[0.2em]">
                  {currentPatient?.status === 'With Doctor' ? 'In Consultation' : 
                   currentPatient?.status === 'Accepted' ? 'Call Accepted ✓' : 'Now Calling'}
                </span>
              </div>

              {currentPatient ? (
                <div className="space-y-8">
                  <div className="flex items-baseline space-x-6">
                    <h3 className="text-7xl font-display font-black tracking-tighter">#{currentPatient.tokenNumber}</h3>
                    <div className="h-10 w-px bg-white/10" />
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <p className="text-2xl font-bold text-white/90">{currentPatient.patientName}</p>
                        {currentPatient.priority === 'Emergency' && (
                          <span className="bg-rose-500 text-[8px] font-black uppercase px-2 py-0.5 rounded-full">Emergency</span>
                        )}
                      </div>
                      <p className="text-sm text-white/50">Please proceed to {currentPatient.department} Wing (Dr. {currentPatient.doctorName})</p>
                      {currentPatient.startedAt && (
                        <div className="mt-2 flex items-center space-x-1.5 text-emerald-300 font-bold text-xs">
                          <Clock className="h-3 w-3" />
                          <span>Duration: {Math.floor((new Date().getTime() - new Date(currentPatient.startedAt).getTime()) / 60000)}m in session</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-4 pt-6">
                    {currentPatient.status === 'Waiting' && (
                      <button 
                        onClick={() => handleUpdateStatus(currentPatient.id, 'Calling')}
                        className="bg-rose-500 hover:bg-rose-600 text-white font-bold px-8 py-4 rounded-2xl flex items-center space-x-3 transition-all shadow-xl shadow-rose-950/20"
                      >
                        <Play className="h-5 w-5 fill-current" />
                        <span>Announce & Call</span>
                      </button>
                    )}
                    {(currentPatient.status === 'Calling' || currentPatient.status === 'Accepted') && (
                      <button 
                        onClick={() => handleUpdateStatus(currentPatient.id, 'With Doctor')}
                        className={`font-bold px-8 py-4 rounded-2xl flex items-center space-x-3 transition-all shadow-xl ${
                          currentPatient.status === 'Accepted'
                            ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-950/20 animate-pulse'
                            : 'bg-indigo-500 hover:bg-indigo-600 text-white shadow-indigo-950/20'
                        }`}
                      >
                        <UserCheck className="h-5 w-5" />
                        <span>
                          {currentPatient.status === 'Accepted' 
                            ? 'Patient Accepted - Start Consultation' 
                            : 'Consultation Started'}
                        </span>
                      </button>
                    )}
                    {(currentPatient.status === 'With Doctor' || currentPatient.status === 'Calling' || currentPatient.status === 'Accepted') && (
                      <button 
                        onClick={() => handleUpdateStatus(currentPatient.id, 'Completed')}
                        className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-8 py-4 rounded-2xl flex items-center space-x-3 transition-all shadow-xl shadow-emerald-950/20"
                      >
                        <CheckCircle className="h-5 w-5" />
                        <span>Finalize Visit</span>
                      </button>
                    )}
                    <button 
                      onClick={() => handleUpdateStatus(currentPatient.id, 'Absent')}
                      className="bg-white/10 hover:bg-white/20 text-white font-bold px-8 py-4 rounded-2xl flex items-center space-x-3 transition-all backdrop-blur-sm"
                    >
                      <UserMinus className="h-5 w-5" />
                      <span>Mark Absent</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="py-12 text-center border-2 border-dashed border-white/10 rounded-3xl">
                  <p className="text-white/40 text-sm italic font-mono">WAITING FOR NEXT PATIENT...</p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white border border-gray-100 rounded-[2rem] p-8 shadow-sm">
            <h3 className="font-display font-bold text-gray-900 text-base mb-6 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Clock className="h-5 w-5 text-amber-500" />
                <span>Waiting List</span>
              </div>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{waitingQueue.length} Pending</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {waitingQueue.length > 0 ? waitingQueue.map((item, idx) => (
                <div key={item.id} className={`p-5 border ${item.priority === 'Emergency' ? 'border-rose-200 bg-rose-50/30' : 'border-gray-100'} rounded-2xl flex items-center justify-between hover:border-rose-100 transition-all group`}>
                  <div className="flex items-center space-x-4">
                    <div className={`w-12 h-12 ${item.priority === 'Emergency' ? 'bg-rose-100' : 'bg-gray-50'} rounded-xl flex flex-col items-center justify-center font-mono group-hover:bg-rose-50 transition-colors`}>
                      <span className="text-[10px] text-gray-400 leading-none">NO.</span>
                      <span className={`text-lg font-bold ${item.priority === 'Emergency' ? 'text-rose-600' : 'text-gray-700'} group-hover:text-rose-600`}>{item.tokenNumber}</span>
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <p className="text-sm font-bold text-gray-900">{item.patientName}</p>
                        {item.priority === 'Emergency' && <AlertCircle className="h-3 w-3 text-rose-500 animate-pulse" />}
                      </div>
                      <p className="text-[10px] text-gray-400 mt-1 uppercase tracking-wider">{item.department} • Dr. {item.doctorName}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => handleUpdateStatus(item.id, 'Calling')}
                      className="p-2 text-gray-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all" 
                      title="Call Now"
                    >
                      <Play className="h-4 w-4" />
                    </button>
                    <button 
                      onClick={() => handleUpdateStatus(item.id, 'Skipped')}
                      className="p-2 text-gray-400 hover:text-amber-500 hover:bg-amber-50 rounded-lg transition-all" 
                      title="Skip"
                    >
                      <SkipForward className="h-4 w-4" />
                    </button>
                    <button 
                      onClick={() => handleDischarge(item.id)}
                      className="p-2 text-gray-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all" 
                      title="Remove"
                    >
                      <UserMinus className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )) : (
                <div className="col-span-2 py-12 text-center">
                  <p className="text-sm text-gray-400 font-mono italic">QUEUE IS EMPTY</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar: Queue Stats */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-amber-50 border border-amber-100 p-6 rounded-3xl">
            <h4 className="text-amber-900 font-bold text-sm mb-4">Queue Insights</h4>
            <div className="space-y-4">
              <div className="flex justify-between items-center py-3 border-b border-amber-200/50">
                <span className="text-xs text-amber-800/70 font-medium">Avg. Wait Time</span>
                <span className="text-sm font-bold text-amber-900">18 Mins</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-amber-200/50">
                <span className="text-xs text-amber-800/70 font-medium">Serving Pace</span>
                <span className="text-sm font-bold text-amber-900">4.2 Patients/Hr</span>
              </div>
              <div className="flex justify-between items-center py-3">
                <span className="text-xs text-amber-800/70 font-medium">Busiest Department</span>
                <span className="text-sm font-bold text-amber-900">Cardiology</span>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-100 p-6 rounded-3xl shadow-sm">
            <h4 className="text-gray-900 font-bold text-sm mb-6">Recent Discharges</h4>
            <div className="space-y-4">
              {[1, 2].map(i => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-emerald-50 text-emerald-500 rounded-lg flex items-center justify-center">
                      <UserCheck className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-bold text-gray-800">Patient #{120 + i}</p>
                      <p className="text-[10px] text-gray-400">Completed at {4 + i}:20 PM</p>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-gray-300" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
