import React, { useState, useEffect } from 'react';
import { 
  Plus, TrendingUp, History, Thermometer, 
  Heart, Activity, Wind, Droplets, Ruler, Weight 
} from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, AreaChart, Area 
} from 'recharts';
import { VitalsLog } from '../../types';

interface VitalsManagementProps {
  patientId: string;
  token: string;
}

export default function VitalsManagement({ patientId, token }: VitalsManagementProps) {
  const [vitals, setVitals] = useState<VitalsLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    bloodPressure: '',
    heartRate: '',
    temperature: '',
    respiratoryRate: '',
    oxygenSaturation: '',
    bloodSugar: '',
    weight: '',
    height: '',
    bmi: ''
  });

  useEffect(() => {
    fetchVitals();
  }, [patientId]);

  const fetchVitals = async () => {
    try {
      const res = await fetch(`/api/doctor/patients/${patientId}/vitals`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setVitals(data);
    } catch (err: any) {
      console.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/doctor/patients/${patientId}/vitals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          ...formData,
          heartRate: parseInt(formData.heartRate),
          temperature: parseFloat(formData.temperature),
          respiratoryRate: parseInt(formData.respiratoryRate),
          oxygenSaturation: parseInt(formData.oxygenSaturation),
          bloodSugar: parseFloat(formData.bloodSugar),
          weight: parseFloat(formData.weight),
          height: parseFloat(formData.height),
          bmi: parseFloat(formData.bmi)
        })
      });
      if (!res.ok) throw new Error('Failed to record vitals');
      setShowForm(false);
      fetchVitals();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const chartData = [...vitals].reverse().map(v => ({
    date: new Date(v.recordedAt).toLocaleDateString(),
    hr: v.heartRate,
    temp: v.temperature,
    sys: parseInt(v.bloodPressure?.split('/')?.[0] || '0'),
    dia: parseInt(v.bloodPressure?.split('/')?.[1] || '0'),
  }));

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
          <VitalMiniCard icon={<Heart className="text-rose-500" />} label="BP" value={vitals[0]?.bloodPressure || '—'} />
          <VitalMiniCard icon={<Activity className="text-emerald-500" />} label="HR" value={vitals[0]?.heartRate ? `${vitals[0].heartRate} bpm` : '—'} />
          <VitalMiniCard icon={<Thermometer className="text-orange-500" />} label="Temp" value={vitals[0]?.temperature ? `${vitals[0].temperature}°C` : '—'} />
          <VitalMiniCard icon={<Wind className="text-blue-500" />} label="SpO2" value={vitals[0]?.oxygenSaturation ? `${vitals[0].oxygenSaturation}%` : '—'} />
        </div>
        <button 
          onClick={() => setShowForm(!showForm)}
          className="bg-indigo-50 hover:bg-indigo-100 text-indigo-600 px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap"
        >
          <Plus className="h-4 w-4" />
          Update Vitals
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-gray-50/50 border border-gray-100 rounded-3xl p-6 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 animate-in fade-in slide-in-from-top-4">
          <Input label="BP (e.g. 120/80)" name="bloodPressure" value={formData.bloodPressure} onChange={(v) => setFormData({...formData, bloodPressure: v})} />
          <Input label="HR (bpm)" name="heartRate" value={formData.heartRate} onChange={(v) => setFormData({...formData, heartRate: v})} type="number" />
          <Input label="Temp (°C)" name="temperature" value={formData.temperature} onChange={(v) => setFormData({...formData, temperature: v})} type="number" />
          <Input label="SpO2 (%)" name="oxygenSaturation" value={formData.oxygenSaturation} onChange={(v) => setFormData({...formData, oxygenSaturation: v})} type="number" />
          <Input label="Respiration" name="respiratoryRate" value={formData.respiratoryRate} onChange={(v) => setFormData({...formData, respiratoryRate: v})} type="number" />
          <div className="col-span-full flex justify-end gap-3 mt-2">
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-xs font-medium text-gray-500 hover:text-gray-700">Cancel</button>
            <button type="submit" className="bg-indigo-600 text-white px-6 py-2 rounded-xl text-xs font-bold shadow-md shadow-indigo-100">Save Metrics</button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="h-[200px] bg-gray-50/30 rounded-3xl p-4 border border-gray-50">
          <span className="text-[10px] font-bold text-gray-400 uppercase mb-4 block">Heart Rate History</span>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
              <XAxis dataKey="date" hide />
              <YAxis hide domain={['dataMin - 10', 'dataMax + 10']} />
              <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', fontSize: '10px' }} />
              <Line type="monotone" dataKey="hr" stroke="#f43f5e" strokeWidth={2} dot={{ r: 4, fill: '#f43f5e' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="h-[200px] bg-gray-50/30 rounded-3xl p-4 border border-gray-50">
          <span className="text-[10px] font-bold text-gray-400 uppercase mb-4 block">Temperature Trends</span>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorTemp" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
              <XAxis dataKey="date" hide />
              <YAxis hide domain={['35', '42']} />
              <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', fontSize: '10px' }} />
              <Area type="monotone" dataKey="temp" stroke="#f59e0b" fillOpacity={1} fill="url(#colorTemp)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function VitalMiniCard({ icon, label, value }: any) {
  return (
    <div className="flex items-center gap-3 bg-gray-50/50 border border-gray-100 p-3 rounded-2xl min-w-[120px]">
      <div className="p-2 bg-white rounded-xl shadow-sm">{icon}</div>
      <div>
        <p className="text-[10px] font-bold text-gray-400 uppercase leading-none mb-1">{label}</p>
        <p className="text-xs font-bold text-gray-900">{value}</p>
      </div>
    </div>
  );
}

function Input({ label, value, onChange, type = 'text' }: any) {
  return (
    <div className="space-y-1">
      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">{label}</label>
      <input 
        type={type} 
        value={value} 
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-white border border-gray-100 rounded-xl p-2.5 text-xs focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
      />
    </div>
  );
}
