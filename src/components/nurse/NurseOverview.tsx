import React from 'react';
import { 
  Users, Activity, ClipboardList, Pill, AlertTriangle, 
  CheckCircle2, Clock, Calendar, ArrowUpRight, TrendingUp
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, AreaChart, Area
} from 'recharts';

interface NurseOverviewProps {
  stats: any;
  loading: boolean;
}

export default function NurseOverview({ stats, loading }: NurseOverviewProps) {
  if (loading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-32 bg-gray-100 rounded-3xl" />
          ))}
        </div>
        <div className="h-64 bg-gray-100 rounded-3xl" />
      </div>
    );
  }

  const statCards = [
    { 
      title: 'Admitted Patients', 
      value: stats?.totalAdmitted || 0, 
      icon: Users, 
      color: 'blue',
      trend: '+2 from yesterday'
    },
    { 
      title: 'Awaiting Vitals', 
      value: stats?.awaitingVitals || 0, 
      icon: Activity, 
      color: 'rose',
      trend: '3 critical'
    },
    { 
      title: 'Awaiting Meds', 
      value: stats?.awaitingMeds || 0, 
      icon: Pill, 
      color: 'emerald',
      trend: 'Next due in 15m'
    },
    { 
      title: 'Tasks Completed', 
      value: stats?.tasksCompletedToday || 0, 
      icon: CheckCircle2, 
      color: 'amber',
      trend: '85% efficiency'
    }
  ];

  const chartData = [
    { time: '08:00', patients: 12, vitals: 10, meds: 8 },
    { time: '10:00', patients: 15, vitals: 14, meds: 12 },
    { time: '12:00', patients: 14, vitals: 12, meds: 15 },
    { time: '14:00', patients: 18, vitals: 16, meds: 14 },
    { time: '16:00', patients: 16, vitals: 15, meds: 18 },
    { time: '18:00', patients: 13, vitals: 12, meds: 10 },
  ];

  return (
    <div className="space-y-8" id="nurse-overview">
      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card, idx) => (
          <div key={idx} className="bg-white border border-gray-100 p-6 rounded-3xl shadow-sm hover:shadow-md transition-all group">
            <div className="flex justify-between items-start mb-4">
              <div className={`p-3 rounded-2xl transition-transform group-hover:scale-110 ${
                card.color === 'blue' ? 'bg-blue-50' : 
                card.color === 'rose' ? 'bg-rose-50' : 
                card.color === 'emerald' ? 'bg-emerald-50' : 
                'bg-amber-50'
              }`}>
                <card.icon className={`h-6 w-6 ${
                  card.color === 'blue' ? 'text-blue-500' : 
                  card.color === 'rose' ? 'text-rose-500' : 
                  card.color === 'emerald' ? 'text-emerald-500' : 
                  'text-amber-500'
                }`} />
              </div>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider bg-gray-50 px-2 py-1 rounded-lg">Today</span>
            </div>
            <div className="space-y-1">
              <h4 className="text-2xl font-bold text-gray-900">{card.value}</h4>
              <p className="text-xs font-medium text-gray-500">{card.title}</p>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-50 flex items-center text-[10px] text-gray-400 font-medium">
              <TrendingUp className="h-3 w-3 mr-1 text-emerald-500" />
              {card.trend}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Activity Chart */}
        <div className="lg:col-span-8 bg-white border border-gray-100 rounded-3xl p-6 shadow-sm">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h3 className="text-sm font-bold text-gray-800">Ward Activity Overview</h3>
              <p className="text-[10px] text-gray-400 font-mono uppercase tracking-wider mt-0.5">Vitals & Medication Administration Trends</p>
            </div>
            <div className="flex gap-4">
              <div className="flex items-center gap-1.5">
                <div className="h-2 w-2 rounded-full bg-blue-500" />
                <span className="text-[10px] font-medium text-gray-500 uppercase">Vitals</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-2 w-2 rounded-full bg-emerald-500" />
                <span className="text-[10px] font-medium text-gray-500 uppercase">Meds</span>
              </div>
            </div>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorVitals" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorMeds" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="time" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fontSize: 10, fill: '#94a3b8', fontWeight: 500}}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fontSize: 10, fill: '#94a3b8', fontWeight: 500}}
                />
                <Tooltip 
                  contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                />
                <Area type="monotone" dataKey="vitals" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorVitals)" />
                <Area type="monotone" dataKey="meds" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorMeds)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Activity Log */}
        <div className="lg:col-span-4 bg-white border border-gray-100 rounded-3xl p-6 shadow-sm flex flex-col">
          <div className="mb-6">
            <h3 className="text-sm font-bold text-gray-800">Recent Nursing Activities</h3>
            <p className="text-[10px] text-gray-400 font-mono uppercase tracking-wider mt-0.5">Audit Trail of your actions</p>
          </div>
          <div className="flex-1 space-y-4 overflow-y-auto pr-1">
            {stats?.recentLogs?.length > 0 ? (
              stats.recentLogs.map((log: any, idx: number) => (
                <div key={idx} className="flex gap-4 group">
                  <div className="flex flex-col items-center">
                    <div className="h-8 w-8 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center group-hover:bg-blue-50 group-hover:border-blue-100 transition-colors">
                      <Clock className="h-3.5 w-3.5 text-gray-400 group-hover:text-blue-500" />
                    </div>
                    {idx !== stats.recentLogs.length - 1 && <div className="w-px flex-1 bg-gray-100 my-1" />}
                  </div>
                  <div className="pb-4 flex-1">
                    <p className="text-[11px] font-bold text-gray-900 leading-tight">{log.action}</p>
                    <p className="text-[10px] text-gray-500 mt-1 leading-relaxed">{log.details}</p>
                    <p className="text-[9px] text-gray-400 font-mono mt-1.5 uppercase">{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-2">
                <ClipboardList className="h-8 w-8 text-gray-200" />
                <p className="text-[10px] text-gray-400 font-medium">No activity logged for this shift yet.</p>
              </div>
            )}
          </div>
          <button className="w-full mt-4 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest border border-gray-50 rounded-xl hover:bg-gray-50 hover:text-gray-600 transition-all">
            View All Logs
          </button>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-gray-900 rounded-[2rem] p-8 text-white">
        <div className="flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="space-y-2 text-center md:text-left">
            <h3 className="text-xl font-bold font-display">Rapid Clinical Workflow</h3>
            <p className="text-xs text-gray-400 max-w-sm">Access frequently used nursing modules instantly to optimize patient care delivery.</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full md:w-auto">
            {[
              { label: 'Admission', color: 'bg-blue-500' },
              { label: 'Vital Signs', color: 'bg-rose-500' },
              { label: 'Nursing Note', color: 'bg-amber-500' },
              { label: 'Medication', color: 'bg-emerald-500' }
            ].map((btn, i) => (
              <button key={i} className={`${btn.color} px-6 py-3 rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:opacity-90 active:scale-95 transition-all shadow-lg shadow-black/20`}>
                {btn.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
