import React, { useState, useEffect } from 'react';
import { 
  Clock, LogOut, LogIn, ClipboardList, RefreshCw, 
  CheckCircle2, Users, AlertTriangle, ShieldCheck
} from 'lucide-react';
import { toast } from 'sonner';

interface ShiftManagementProps {
  token: string;
}

export default function ShiftManagement({ token }: ShiftManagementProps) {
  const [loading, setLoading] = useState(false);
  const [currentShift, setCurrentShift] = useState<any>(null);
  const [fetching, setFetching] = useState(true);
  const [report, setReport] = useState('');
  const [ward, setWard] = useState('General Medicine');

  const fetchShift = async () => {
    setFetching(true);
    try {
      const res = await fetch('/api/nurse/shift/current', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setCurrentShift(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    fetchShift();
  }, []);

  const handleStart = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/nurse/shift/start', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ ward })
      });
      if (res.ok) {
        toast.success('Shift started');
        fetchShift();
      }
    } catch (err) {
      toast.error('Failed to start shift');
    } finally {
      setLoading(false);
    }
  };

  const handleEnd = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/nurse/shift/end', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ id: currentShift.id, reportContent: report })
      });
      if (res.ok) {
        toast.success('Shift ended and report submitted');
        setCurrentShift(null);
        setReport('');
      }
    } catch (err) {
      toast.error('Failed to end shift');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm h-full flex flex-col">
      <div className="mb-6">
        <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
          <Clock className="h-4 w-4 text-rose-500" />
          Shift Management & Handoff
        </h3>
        <p className="text-[10px] text-gray-400 font-mono uppercase tracking-wider mt-0.5">Control active duty status and shift reporting</p>
      </div>

      <div className="flex-1 space-y-8 overflow-y-auto pr-2">
        {fetching ? (
          <div className="py-12 flex flex-col items-center justify-center space-y-4">
            <div className="h-8 w-8 border-2 border-rose-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-[10px] text-gray-400 font-mono uppercase tracking-widest">Checking duty status...</p>
          </div>
        ) : !currentShift ? (
          <div className="space-y-6">
            <div className="bg-rose-50/50 border border-rose-100 p-8 rounded-[2rem] text-center space-y-4">
              <div className="h-16 w-16 bg-white rounded-full flex items-center justify-center mx-auto shadow-sm">
                <LogIn className="h-8 w-8 text-rose-400" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-gray-900">Ready to Start Duty?</h4>
                <p className="text-[10px] text-gray-500 max-w-[200px] mx-auto mt-1 leading-relaxed">Ensure you have completed all handoff protocols with the previous shift nurse.</p>
              </div>
              <div className="space-y-1.5 text-left max-w-[240px] mx-auto">
                <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest pl-1">Assigned Ward</label>
                <select 
                  className="w-full px-4 py-2 bg-white border border-gray-100 rounded-xl text-xs outline-none appearance-none"
                  value={ward}
                  onChange={(e) => setWard(e.target.value)}
                >
                  {['General Medicine', 'Surgical', 'ICU', 'Pediatric', 'Emergency'].map(w => <option key={w} value={w}>{w}</option>)}
                </select>
              </div>
              <button 
                onClick={handleStart}
                disabled={loading}
                className="bg-gray-900 text-white px-8 py-3 rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:bg-black transition-all active:scale-95 shadow-xl shadow-black/10"
              >
                {loading ? 'Starting...' : 'Clock In / Start Shift'}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
            <div className="bg-emerald-50 border border-emerald-100 p-6 rounded-3xl">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-white rounded-xl flex items-center justify-center shadow-sm border border-emerald-100">
                    <CheckCircle2 className="h-6 w-6 text-emerald-500" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-gray-900 uppercase">On Duty • {currentShift.ward}</h4>
                    <p className="text-[10px] text-emerald-600 font-mono mt-0.5 uppercase">Started: {new Date(currentShift.startTime).toLocaleString([], { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                </div>
                <span className="animate-pulse flex items-center gap-1.5 px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[9px] font-bold uppercase rounded-md border border-emerald-200">
                  <div className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
                  Active
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2 px-1">
                <ClipboardList className="h-3.5 w-3.5 text-gray-400" />
                <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">End of Shift Handoff Report</h4>
              </div>
              <textarea 
                rows={8}
                placeholder="Detail patient stability, pending tasks, medication updates, and critical concerns for the next shift nurse..."
                className="w-full p-4 bg-gray-50 border border-gray-100 rounded-3xl text-xs outline-none focus:bg-white focus:ring-2 focus:ring-rose-500/10 focus:border-rose-500 transition-all resize-none leading-relaxed"
                value={report}
                onChange={(e) => setReport(e.target.value)}
              />
            </div>

            <button 
              onClick={handleEnd}
              disabled={loading || !report.trim()}
              className="w-full bg-rose-500 text-white py-4 rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:bg-rose-600 transition-all flex items-center justify-center gap-2 shadow-xl shadow-rose-500/20"
            >
              {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <><LogOut className="h-4 w-4" /> End Shift & Handover</>}
            </button>
          </div>
        )}

        <div className="p-4 bg-blue-50/50 border border-blue-100 rounded-2xl space-y-3 mt-4">
          <h4 className="text-[10px] font-bold text-blue-900 uppercase tracking-widest flex items-center gap-2">
            <ShieldCheck className="h-3.5 w-3.5 text-blue-500" />
            Duty Protocol
          </h4>
          <ul className="space-y-2">
            {[
              'Review all physician treatment plan updates',
              'Verify controlled medication cabinet inventory',
              'Brief next shift on "Condition Yellow" patients',
              'Update IV fluid balances for all admitted patients'
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-[10px] text-blue-700 font-medium leading-tight">
                <div className="h-1 w-1 rounded-full bg-blue-400 mt-1 shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
