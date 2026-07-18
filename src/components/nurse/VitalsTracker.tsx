import React, { useState } from 'react';
import { 
  Activity, Thermometer, Wind, Droplets, 
  Weight, Ruler, Plus, History, TrendingUp, AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, ReferenceLine 
} from 'recharts';

interface VitalsTrackerProps {
  patient: any;
  token: string;
  onRefresh: () => void;
}

export default function VitalsTracker({ patient, token, onRefresh }: VitalsTrackerProps) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    bloodPressure: '120/80',
    heartRate: 75,
    temperature: 37.0,
    respiratoryRate: 16,
    oxygenSaturation: 98,
    bloodSugar: 100,
    height: 175,
    weight: 70,
    bmi: 22.9
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`/api/patients/${patient.id}/vitals`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({
          ...form,
          recordedBy: 'Nurse' // Would be actual nurse name from auth
        })
      });

      if (res.ok) {
        toast.success('Vital signs recorded');
        onRefresh();
      } else {
        throw new Error('Failed to record vitals');
      }
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const calculateBMI = (w: number, h: number) => {
    if (w > 0 && h > 0) {
      const hMeter = h / 100;
      const bmi = (w / (hMeter * hMeter)).toFixed(1);
      setForm(prev => ({ ...prev, bmi: parseFloat(bmi) }));
    }
  };

  const vitalsHistory = patient.vitalsLogs?.slice(0, 10).reverse().map((v: any) => ({
    time: new Date(v.recordedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    bp: v.bloodPressure,
    hr: v.heartRate,
    temp: v.temperature,
    spo2: v.oxygenSaturation
  })) || [];

  return (
    <div className="space-y-8" id="vitals-tracker">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Vitals Entry Form */}
        <div className="lg:col-span-5 bg-white border border-gray-100 rounded-3xl p-6 shadow-sm">
          <div className="mb-6">
            <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
              <Activity className="h-4 w-4 text-rose-500" />
              Log Current Vitals
            </h3>
            <p className="text-[10px] text-gray-400 font-mono uppercase tracking-wider mt-0.5">Real-time physiological recording</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Blood Pressure</label>
                <div className="relative">
                  <input 
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-xs font-mono outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                    value={form.bloodPressure}
                    onChange={(e) => setForm({...form, bloodPressure: e.target.value})}
                    placeholder="120/80"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[9px] font-bold text-gray-300 uppercase">mmHg</span>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Heart Rate</label>
                <div className="relative">
                  <input 
                    type="number"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-xs font-mono outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                    value={form.heartRate}
                    onChange={(e) => setForm({...form, heartRate: parseInt(e.target.value)})}
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[9px] font-bold text-gray-300 uppercase">bpm</span>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Temp (°C)</label>
                <div className="relative">
                  <input 
                    type="number"
                    step="0.1"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-xs font-mono outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                    value={form.temperature}
                    onChange={(e) => setForm({...form, temperature: parseFloat(e.target.value)})}
                  />
                  <Thermometer className="absolute right-4 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-300" />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">SpO₂ (%)</label>
                <div className="relative">
                  <input 
                    type="number"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-xs font-mono outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                    value={form.oxygenSaturation}
                    onChange={(e) => setForm({...form, oxygenSaturation: parseInt(e.target.value)})}
                  />
                  <Wind className="absolute right-4 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-300" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Weight (kg)</label>
                <input 
                  type="number"
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-100 rounded-xl text-xs font-mono outline-none"
                  value={form.weight}
                  onChange={(e) => {
                    const w = parseFloat(e.target.value);
                    setForm({...form, weight: w});
                    calculateBMI(w, form.height);
                  }}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Height (cm)</label>
                <input 
                  type="number"
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-100 rounded-xl text-xs font-mono outline-none"
                  value={form.height}
                  onChange={(e) => {
                    const h = parseFloat(e.target.value);
                    setForm({...form, height: h});
                    calculateBMI(form.weight, h);
                  }}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">BMI</label>
                <input 
                  type="number"
                  disabled
                  className="w-full px-4 py-2 bg-gray-100 border border-gray-200 rounded-xl text-xs font-mono text-gray-500 outline-none"
                  value={form.bmi}
                />
              </div>
            </div>

            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-rose-500 text-white py-4 rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:bg-rose-600 transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="h-4 w-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  Save Vital Signs
                </>
              )}
            </button>
          </form>
        </div>

        {/* Vitals Trends Chart */}
        <div className="lg:col-span-7 bg-white border border-gray-100 rounded-3xl p-6 shadow-sm flex flex-col">
          <div className="mb-6 flex justify-between items-center">
            <div>
              <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-emerald-500" />
                Vitals Trend Analysis
              </h3>
              <p className="text-[10px] text-gray-400 font-mono uppercase tracking-wider mt-0.5">Historical chart of recent measurements</p>
            </div>
          </div>

          <div className="flex-1 min-h-[300px]">
            {vitalsHistory.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={vitalsHistory}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="time" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fontSize: 10, fill: '#94a3b8'}}
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fontSize: 10, fill: '#94a3b8'}}
                  />
                  <Tooltip 
                    contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                  />
                  <Line type="monotone" dataKey="hr" stroke="#ef4444" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} name="Heart Rate" />
                  <Line type="monotone" dataKey="spo2" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} name="SpO2" />
                  <ReferenceLine y={95} stroke="#10b981" strokeDasharray="3 3" label={{ position: 'right', value: 'SpO2 Ref', fontSize: 8, fill: '#10b981' }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-12 space-y-3">
                <History className="h-10 w-10 text-gray-100" />
                <p className="text-xs text-gray-400 font-medium italic">No historical vital signs available for this patient.</p>
              </div>
            )}
          </div>

          <div className="mt-6 p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-start gap-3">
            <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
            <p className="text-[10px] leading-relaxed text-rose-800 font-medium">
              <span className="font-bold">Urgent Protocol:</span> If SpO₂ drops below 92% or Heart Rate exceeds 120 bpm at rest, initiate high-flow oxygen and notify the duty doctor immediately.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
