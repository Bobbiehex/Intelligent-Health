import React, { useState, useEffect } from 'react';
import { 
  Droplets, Plus, History, RefreshCw, 
  Trash2, TrendingUp, AlertTriangle, Scale
} from 'lucide-react';
import { toast } from 'sonner';

interface IntakeOutputTrackerProps {
  patientId: string;
  token: string;
}

export default function IntakeOutputTracker({ patientId, token }: IntakeOutputTrackerProps) {
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [logs, setLogs] = useState<any[]>([]);
  const [form, setForm] = useState({
    type: 'Intake',
    category: 'Oral Fluid',
    amount: 0
  });

  const fetchLogs = async () => {
    setFetching(true);
    try {
      const res = await fetch(`/api/nurse/patients/${patientId}/intake-output`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setLogs(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [patientId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.amount <= 0) return;

    setLoading(true);
    try {
      const res = await fetch('/api/nurse/intake-output', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ ...form, patientId })
      });

      if (res.ok) {
        toast.success('Fluid record saved');
        setForm({ ...form, amount: 0 });
        fetchLogs();
      } else {
        throw new Error('Failed to save record');
      }
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const categories = {
    Intake: ['Oral Fluid', 'IV Fluid', 'Tube Feeding'],
    Output: ['Urine', 'Stool', 'Vomitus', 'Drain', 'Gastric']
  };

  const calculateTotals = () => {
    const today = new Date().toDateString();
    const todayLogs = logs.filter(l => new Date(l.timestamp).toDateString() === today);
    const intake = todayLogs.filter(l => l.type === 'Intake').reduce((acc, l) => acc + l.amount, 0);
    const output = todayLogs.filter(l => l.type === 'Output').reduce((acc, l) => acc + l.amount, 0);
    return { intake, output, balance: intake - output };
  };

  const totals = calculateTotals();

  return (
    <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm flex flex-col h-full">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
            <Droplets className="h-4 w-4 text-blue-500" />
            Intake & Output Balance
          </h3>
          <p className="text-[10px] text-gray-400 font-mono uppercase tracking-wider mt-0.5">Monitor fluid volume homeostasis</p>
        </div>
        <button onClick={fetchLogs} className="p-2 hover:bg-gray-50 rounded-xl transition-colors">
          <RefreshCw className={`h-4 w-4 text-gray-400 ${fetching ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 flex-1 overflow-hidden">
        {/* Input Form & Daily Summary */}
        <div className="space-y-8 overflow-y-auto pr-2">
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-blue-50 border border-blue-100 p-4 rounded-2xl text-center">
              <span className="block text-[9px] font-bold text-blue-400 uppercase tracking-widest mb-1">Total Intake</span>
              <span className="text-lg font-bold text-blue-900">{totals.intake}ml</span>
            </div>
            <div className="bg-rose-50 border border-rose-100 p-4 rounded-2xl text-center">
              <span className="block text-[9px] font-bold text-rose-400 uppercase tracking-widest mb-1">Total Output</span>
              <span className="text-lg font-bold text-rose-900">{totals.output}ml</span>
            </div>
            <div className={`p-4 rounded-2xl text-center border ${totals.balance >= 0 ? 'bg-emerald-50 border-emerald-100' : 'bg-amber-50 border-amber-100'}`}>
              <span className={`block text-[9px] font-bold uppercase tracking-widest mb-1 ${totals.balance >= 0 ? 'text-emerald-400' : 'text-amber-400'}`}>Balance</span>
              <span className={`text-lg font-bold ${totals.balance >= 0 ? 'text-emerald-900' : 'text-amber-900'}`}>{totals.balance}ml</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="bg-gray-50/50 border border-gray-100 p-6 rounded-3xl space-y-4">
            <div className="flex gap-2">
              {['Intake', 'Output'].map(t => (
                <button 
                  key={t} type="button"
                  onClick={() => setForm({ ...form, type: t, category: categories[t as 'Intake' | 'Output'][0] })}
                  className={`flex-1 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${
                    form.type === t ? 'bg-gray-900 text-white' : 'bg-white text-gray-400 border border-gray-100 hover:bg-gray-100'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Category</label>
              <select 
                className="w-full px-4 py-3 bg-white border border-gray-100 rounded-2xl text-xs outline-none focus:ring-2 focus:ring-blue-500/20 appearance-none"
                value={form.category}
                onChange={(e) => setForm({...form, category: e.target.value})}
              >
                {categories[form.type as 'Intake' | 'Output'].map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Volume (ml)</label>
              <div className="relative">
                <input 
                  type="number"
                  className="w-full px-4 py-3 bg-white border border-gray-100 rounded-2xl text-xs font-mono outline-none focus:ring-2 focus:ring-blue-500/20"
                  value={form.amount || ''}
                  onChange={(e) => setForm({...form, amount: parseFloat(e.target.value)})}
                  placeholder="500"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-gray-300 uppercase">ml</span>
              </div>
            </div>

            <button 
              type="submit"
              disabled={loading || form.amount <= 0}
              className="w-full bg-blue-500 text-white py-3.5 rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:bg-blue-600 transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-500/10"
            >
              {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <><Plus className="h-4 w-4" /> Record Volume</>}
            </button>
          </form>
        </div>

        {/* History Log */}
        <div className="flex flex-col overflow-hidden">
          <div className="mb-3 flex items-center gap-2">
            <History className="h-3.5 w-3.5 text-gray-400" />
            <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Fluid History Log</h4>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 pr-2 scrollbar-thin scrollbar-thumb-gray-100">
            {fetching ? (
              <div className="py-12 flex flex-col items-center justify-center space-y-3">
                <div className="h-6 w-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-[9px] text-gray-400 font-mono uppercase">Retrieving balance sheet...</p>
              </div>
            ) : logs.length > 0 ? (
              logs.map((log) => (
                <div key={log.id} className="bg-white border border-gray-100 rounded-2xl p-3 flex justify-between items-center group hover:border-blue-200 transition-all">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${log.type === 'Intake' ? 'bg-blue-50 text-blue-500' : 'bg-rose-50 text-rose-500'}`}>
                      <Droplets className="h-3.5 w-3.5" />
                    </div>
                    <div>
                      <h5 className="text-[11px] font-bold text-gray-800">{log.category}</h5>
                      <p className="text-[9px] text-gray-400 font-medium uppercase">{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`text-xs font-bold font-mono ${log.type === 'Intake' ? 'text-blue-600' : 'text-rose-600'}`}>
                      {log.type === 'Intake' ? '+' : '-'}{log.amount}ml
                    </span>
                    <p className="text-[8px] text-gray-300 font-bold uppercase tracking-widest mt-0.5">Staff: {log.nurseId.slice(0, 5)}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-12 flex flex-col items-center justify-center text-center space-y-3 opacity-30">
                <Scale className="h-10 w-10 text-gray-300" />
                <p className="text-xs text-gray-400 font-medium italic">No fluid transactions recorded.</p>
              </div>
            )}
          </div>

          <div className="mt-4 p-3 bg-amber-50 border border-amber-100 rounded-2xl flex items-start gap-2">
            <AlertTriangle className="h-3.5 w-3.5 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-[9px] leading-relaxed text-amber-800 font-medium">
              Report immediately if net fluid balance shows significant deficit or excessive retention over 24 hours.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
