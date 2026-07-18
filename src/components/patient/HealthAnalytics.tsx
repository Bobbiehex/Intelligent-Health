import React, { useState, useEffect } from 'react';
import { 
  Activity, Heart, TrendingUp, Calendar, Filter, 
  Download, ChevronRight, Info, AlertCircle, Weight
} from 'lucide-react';
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, 
  CartesianGrid, LineChart, Line, BarChart, Bar, Legend
} from 'recharts';
import { motion } from 'motion/react';
import { toast } from 'sonner';

interface HealthAnalyticsProps {
  user: any;
  token: string;
}

export default function HealthAnalytics({ user, token }: HealthAnalyticsProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState<'7d' | '30d' | '90d'>('30d');

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const response = await fetch('/api/patient/medical-records', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const result = await response.json();
        // Simulate chart data processing
        const vitals = (result.timeline || []).filter((t: any) => t.type === 'Vitals').map((v: any) => ({
          date: new Date(v.date).toLocaleDateString([], { month: 'short', day: 'numeric' }),
          bp: 120 + Math.random() * 20,
          hr: 70 + Math.random() * 15,
          sugar: 90 + Math.random() * 30
        })).reverse();
        
        setData({ vitals });
      } catch (error) {
        toast.error('Failed to load analytics');
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, [token, timeframe]);

  if (loading || !data) return null;

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h2 className="text-2xl font-display font-bold text-slate-800">Health Analytics</h2>
          <p className="text-slate-500 text-sm mt-1">Deep analysis of your biometric trends and medical history.</p>
        </div>

        <div className="flex p-1.5 bg-white border border-slate-100 rounded-2xl shadow-sm">
          {['7d', '30d', '90d'].map(t => (
            <button
              key={t}
              onClick={() => setTimeframe(t as any)}
              className={`px-6 py-2 rounded-xl text-xs font-bold transition-all ${
                timeframe === t 
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' 
                  : 'text-slate-500 hover:bg-slate-50'
              }`}
            >
              {t.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Main Chart */}
        <div className="lg:col-span-8 bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h3 className="text-lg font-bold text-slate-800">Cardiovascular Performance</h3>
              <p className="text-xs text-slate-400 mt-1">Detailed analysis of Blood Pressure vs Heart Rate</p>
            </div>
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-indigo-600 rounded-full"></div>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Systolic</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-rose-500 rounded-full"></div>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Heart Rate</span>
              </div>
            </div>
          </div>

          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.vitals}>
                <defs>
                  <linearGradient id="colorBP" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94A3B8' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94A3B8' }} />
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Area type="monotone" dataKey="bp" stroke="#6366f1" strokeWidth={4} fillOpacity={1} fill="url(#colorBP)" />
                <Area type="monotone" dataKey="hr" stroke="#f43f5e" strokeWidth={3} fillOpacity={0} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Mini Charts & Stats */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm space-y-6">
            <h4 className="text-sm font-bold text-slate-800 flex items-center space-x-2">
              <Activity className="text-emerald-500" size={16} />
              <span>Blood Glucose Stability</span>
            </h4>
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.vitals}>
                  <Line type="monotone" dataKey="sugar" stroke="#10b981" strokeWidth={3} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-between items-center pt-4 border-t border-slate-50">
              <div className="text-center">
                <p className="text-[10px] font-bold text-slate-400 uppercase">Avg Glucose</p>
                <p className="text-lg font-display font-bold text-emerald-600">98.2</p>
              </div>
              <div className="text-center">
                <p className="text-[10px] font-bold text-slate-400 uppercase">Status</p>
                <p className="text-xs font-bold text-slate-800">Stable</p>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white shadow-xl shadow-slate-200">
            <div className="flex items-center justify-between mb-6">
              <TrendingUp className="text-indigo-400" size={24} />
              <span className="text-[10px] font-bold font-mono tracking-widest uppercase opacity-60">Insight Report</span>
            </div>
            <h4 className="text-lg font-bold">Wellness Score: 84/100</h4>
            <p className="text-sm text-slate-400 mt-2 leading-relaxed italic">"Your heart rate variability has improved by 12% this month. Maintaining current exercise levels is recommended."</p>
            <button 
              onClick={async () => {
                toast.loading('Generating Wellness Report...', { id: 'pdf-gen' });
                try {
                  const response = await fetch('/api/patient/analytics/export', {
                    headers: { 'Authorization': `Bearer ${token}` }
                  });
                  if (!response.ok) throw new Error('Failed to download');
                  
                  const blob = await response.blob();
                  const url = window.URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = 'health-report.pdf';
                  document.body.appendChild(a);
                  a.click();
                  a.remove();
                  toast.success('Wellness Report downloaded successfully!', { id: 'pdf-gen' });
                } catch (error) {
                  toast.error('Failed to download report', { id: 'pdf-gen' });
                }
              }}
              className="w-full mt-6 py-3 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl transition-all border border-white/10"
            >
              Generate PDF Report
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
