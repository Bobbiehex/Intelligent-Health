import React, { useState, useEffect } from 'react';
import { 
  ClipboardList, 
  Package, 
  AlertTriangle, 
  CheckCircle2, 
  TrendingUp, 
  Activity,
  ArrowUpRight,
  Clock,
  User,
  ArrowRight
} from 'lucide-react';
import { motion } from 'motion/react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area,
  Cell
} from 'recharts';

interface PharmacyOverviewProps {
  token: string;
}

export const PharmacyOverview: React.FC<PharmacyOverviewProps> = ({ token }) => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/pharmacy/analytics', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to fetch');
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const cards = [
    { 
      label: 'Total Prescriptions', 
      value: stats?.summary?.totalPrescriptions || 0, 
      icon: ClipboardList, 
      color: 'blue',
      trend: '+12% from last week'
    },
    { 
      label: 'Dispensed Today', 
      value: stats?.summary?.dispensedCount || 0, 
      icon: CheckCircle2, 
      color: 'emerald',
      trend: '+5% from yesterday'
    },
    { 
      label: 'Low Stock Alert', 
      value: stats?.summary?.lowStockCount || 0, 
      icon: AlertTriangle, 
      color: 'amber',
      trend: 'Requires urgent reorder'
    },
    { 
      label: 'Expired Meds', 
      value: stats?.summary?.expiredCount || 0, 
      icon: Activity, 
      color: 'rose',
      trend: 'Need immediate disposal'
    },
  ];

  const chartData = [
    { name: 'Mon', count: 45 },
    { name: 'Tue', count: 52 },
    { name: 'Wed', count: 38 },
    { name: 'Thu', count: 65 },
    { name: 'Fri', count: 48 },
    { name: 'Sat', count: 32 },
    { name: 'Sun', count: 20 },
  ];

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
    </div>
  );

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Operations Center</h2>
          <p className="text-slate-500 font-medium mt-1">Real-time pharmacy performance & supply chain tracking</p>
        </div>
        <div className="flex items-center gap-3 bg-white p-1.5 rounded-2xl shadow-sm border border-slate-100">
          <button className="px-4 py-2 text-xs font-bold bg-slate-900 text-white rounded-xl shadow-sm">Real-time</button>
          <button className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-50 rounded-xl transition-all">Weekly</button>
          <button className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-50 rounded-xl transition-all">Monthly</button>
        </div>
      </div>

      {/* Summary Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {cards.map((card, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: idx * 0.05 }}
            className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 transition-all group"
          >
            <div className="flex items-start justify-between mb-6">
              <div className={`p-4 rounded-2xl bg-${card.color}-50 text-${card.color}-600 group-hover:scale-110 transition-transform`}>
                <card.icon className="h-6 w-6" />
              </div>
              <div className="flex items-center gap-1 text-emerald-500 bg-emerald-50 px-2 py-1 rounded-lg text-[10px] font-bold">
                <TrendingUp className="h-3 w-3" />
                <span>Active</span>
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-3xl font-black text-slate-900 tracking-tight">{card.value}</p>
              <p className="text-sm font-bold text-slate-500">{card.label}</p>
            </div>
            <div className="mt-6 pt-6 border-t border-slate-50">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{card.trend}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Main Analytics Row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Prescription Volume Chart */}
        <div className="xl:col-span-2 bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-xl font-black text-slate-900 tracking-tight">Prescription Volume</h3>
              <p className="text-slate-400 text-sm font-bold mt-1">Dispensing trends over the last 7 days</p>
            </div>
            <button className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-emerald-600 bg-emerald-50 rounded-xl hover:bg-emerald-100 transition-all">
              Detailed View <ArrowRight className="h-3 w-3" />
            </button>
          </div>
          
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#94A3B8', fontSize: 12, fontWeight: 700}}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#94A3B8', fontSize: 12, fontWeight: 700}}
                />
                <Tooltip 
                  contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '16px' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="count" 
                  stroke="#10b981" 
                  strokeWidth={4}
                  fillOpacity={1} 
                  fill="url(#colorCount)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Activity Log */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-black text-slate-900 tracking-tight">Recent Activity</h3>
            <div className="h-8 w-8 bg-slate-50 rounded-full flex items-center justify-center">
              <Clock className="h-4 w-4 text-slate-400" />
            </div>
          </div>

          <div className="flex-1 space-y-6 overflow-y-auto max-h-[400px] pr-2 custom-scrollbar">
            {stats?.recentActivity?.length > 0 ? (
              stats.recentActivity.map((activity: any, idx: number) => (
                <div key={idx} className="flex gap-4 group">
                  <div className="relative">
                    <div className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center shrink-0 group-hover:bg-emerald-50 transition-colors">
                      <User className="h-5 w-5 text-slate-400 group-hover:text-emerald-500 transition-colors" />
                    </div>
                    {idx !== stats.recentActivity.length - 1 && (
                      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-0.5 h-10 bg-slate-50" />
                    )}
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-slate-900">
                      {activity.medicine.name} <span className="text-slate-400 font-medium">dispensed to</span> {activity.prescription.patient.name}
                    </p>
                    <div className="flex items-center gap-3">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        {new Date(activity.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                      <div className="h-1 w-1 rounded-full bg-slate-200" />
                      <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Verified</p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center space-y-3 opacity-50">
                <div className="p-4 rounded-full bg-slate-50">
                  <Activity className="h-8 w-8 text-slate-300" />
                </div>
                <p className="text-sm font-bold text-slate-400">No recent activity detected</p>
              </div>
            )}
          </div>
          
          <button className="w-full mt-8 py-4 bg-slate-50 hover:bg-slate-100 text-slate-900 font-bold text-xs rounded-2xl transition-all flex items-center justify-center gap-2">
            View All History <ArrowUpRight className="h-3 w-3" />
          </button>
        </div>
      </div>
    </div>
  );
};
