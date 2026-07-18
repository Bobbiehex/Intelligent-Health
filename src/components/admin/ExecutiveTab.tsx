import React from 'react';
import { 
  Users, Activity, Calendar, ShieldCheck, Heart, Sparkles, TrendingUp, HelpCircle, AlertTriangle, Monitor, Database
} from 'lucide-react';
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar, Cell
} from 'recharts';

interface ExecutiveTabProps {
  stats: any;
  loading: boolean;
  onRefresh: () => void;
}

export default function ExecutiveTab({ stats, loading, onRefresh }: ExecutiveTabProps) {
  if (loading) {
    return (
      <div className="bg-white border border-gray-100 rounded-3xl p-12 text-center text-gray-400 font-mono">
        <Activity className="h-8 w-8 animate-spin text-rose-500 mx-auto mb-4" />
        <p className="text-xs font-semibold uppercase tracking-wider">Analyzing system parameters & compiling live analytics...</p>
      </div>
    );
  }

  // Format currency
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(val);
  };

  // Recharts data
  const revenueTrend = [
    { name: '08:00', Revenue: (stats.totalRevenue * 0.1) },
    { name: '10:00', Revenue: (stats.totalRevenue * 0.25) },
    { name: '12:00', Revenue: (stats.totalRevenue * 0.45) },
    { name: '14:00', Revenue: (stats.totalRevenue * 0.6) },
    { name: '16:00', Revenue: (stats.totalRevenue * 0.85) },
    { name: '18:00', Revenue: stats.totalRevenue },
  ];

  const aiAccuracyData = [
    { name: 'Triage AI', requests: Math.round(stats.totalAIUsage * 0.4), accuracy: 94.5 },
    { name: 'Lab AI', requests: Math.round(stats.totalAIUsage * 0.3), accuracy: 96.2 },
    { name: 'Rx AI', requests: Math.round(stats.totalAIUsage * 0.3), accuracy: 98.1 },
  ];

  return (
    <div className="space-y-6">
      {/* Real-time stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Patients */}
        <div className="bg-white border border-gray-100 p-5 rounded-2xl flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 bg-rose-50 text-rose-500 rounded-xl flex items-center justify-center">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <span className="text-[10px] text-gray-400 block font-mono">TOTAL PATIENTS</span>
              <span className="text-lg font-bold text-gray-800">{stats.totalPatients}</span>
            </div>
          </div>
          <span className="text-[10px] bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded font-bold font-mono">LIVE</span>
        </div>

        {/* Total Revenue */}
        <div className="bg-white border border-gray-100 p-5 rounded-2xl flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 bg-emerald-50 text-emerald-500 rounded-xl flex items-center justify-center">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              <span className="text-[10px] text-gray-400 block font-mono">TOTAL REVENUE</span>
              <span className="text-lg font-bold text-gray-800">{formatCurrency(stats.totalRevenue)}</span>
            </div>
          </div>
          <span className="text-[10px] bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded font-bold font-mono">+12%</span>
        </div>

        {/* AI Inferences */}
        <div className="bg-white border border-gray-100 p-5 rounded-2xl flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 bg-indigo-50 text-indigo-500 rounded-xl flex items-center justify-center">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <span className="text-[10px] text-gray-400 block font-mono">AI INFERENCES</span>
              <span className="text-lg font-bold text-gray-800">{stats.totalAIUsage} Queries</span>
            </div>
          </div>
          <span className="text-[10px] bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded font-bold font-mono">GEMINI</span>
        </div>

        {/* RL Feedback rating */}
        <div className="bg-white border border-gray-100 p-5 rounded-2xl flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 bg-amber-50 text-amber-500 rounded-xl flex items-center justify-center">
              <Heart className="h-5 w-5" />
            </div>
            <div>
              <span className="text-[10px] text-gray-400 block font-mono">RL COGNITIVE RATING</span>
              <span className="text-lg font-bold text-gray-800">{stats.rlAverageRating.toFixed(2)} ★</span>
            </div>
          </div>
          <span className="text-[10px] bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded font-bold font-mono">{stats.rlFeedbackTotal} reviews</span>
        </div>
      </div>

      {/* Operations sub-grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-white border border-gray-100 p-4 rounded-xl text-center">
          <span className="text-[9px] text-gray-400 font-mono block">ACTIVE DOCTORS</span>
          <span className="text-base font-bold text-gray-800 font-mono">{stats.activeDoctors}</span>
        </div>
        <div className="bg-white border border-gray-100 p-4 rounded-xl text-center">
          <span className="text-[9px] text-gray-400 font-mono block">ACTIVE NURSES</span>
          <span className="text-base font-bold text-gray-800 font-mono">{stats.activeNurses}</span>
        </div>
        <div className="bg-white border border-gray-100 p-4 rounded-xl text-center">
          <span className="text-[9px] text-gray-400 font-mono block">RECEPTIONISTS</span>
          <span className="text-base font-bold text-gray-800 font-mono">{stats.activeReceptionists}</span>
        </div>
        <div className="bg-white border border-gray-100 p-4 rounded-xl text-center">
          <span className="text-[9px] text-gray-400 font-mono block">LAB / PHARMA STAFF</span>
          <span className="text-base font-bold text-gray-800 font-mono">{stats.activeLabStaff + stats.activePharmacists}</span>
        </div>
        <div className="bg-white border border-gray-100 p-4 rounded-xl text-center">
          <span className="text-[9px] text-gray-400 font-mono block">WAITING QUEUE</span>
          <span className={`text-base font-bold font-mono ${stats.waitingPatients > 5 ? 'text-rose-500' : 'text-gray-800'}`}>
            {stats.waitingPatients}
          </span>
        </div>
        <div className="bg-white border border-gray-100 p-4 rounded-xl text-center">
          <span className="text-[9px] text-gray-400 font-mono block">ONLINE SESSIONS</span>
          <span className="text-base font-bold text-emerald-500 font-mono">{stats.onlineUsers} Active</span>
        </div>
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue performance */}
        <div className="bg-white border border-gray-100 p-6 rounded-3xl">
          <h4 className="font-bold text-sm text-gray-800 mb-4 flex items-center justify-between">
            <span>Intraday Revenue Performance</span>
            <span className="text-[10px] text-gray-400 font-mono">REAL-TIME AGGREGATE</span>
          </h4>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueTrend}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="name" stroke="#9ca3af" fontSize={10} tickLine={false} />
                <YAxis stroke="#9ca3af" fontSize={10} tickLine={false} tickFormatter={(v) => `£${v}`} />
                <Tooltip formatter={(value) => [`£${value}`, 'Revenue']} />
                <Area type="monotone" dataKey="Revenue" stroke="#10b981" fillOpacity={1} fill="url(#colorRevenue)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* AI Cognitive Accuracy performance */}
        <div className="bg-white border border-gray-100 p-6 rounded-3xl">
          <h4 className="font-bold text-sm text-gray-800 mb-4 flex items-center justify-between">
            <span>AI Assistant Diagnostics & Accuracy</span>
            <span className="text-[10px] text-gray-400 font-mono">COGNITIVE METRICS</span>
          </h4>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={aiAccuracyData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="name" stroke="#9ca3af" fontSize={10} tickLine={false} />
                <YAxis stroke="#9ca3af" fontSize={10} tickLine={false} unit="%" domain={[90, 100]} />
                <Tooltip formatter={(value, name) => [name === 'accuracy' ? `${value}%` : value, name === 'accuracy' ? 'Clinician Acceptance Rate' : 'Inferences Run']} />
                <Bar dataKey="accuracy" fill="#6366f1" radius={[4, 4, 0, 0]}>
                  {aiAccuracyData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === 0 ? '#fb7185' : index === 1 ? '#6366f1' : '#34d399'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Activity Logs & Security Alerts side-by-side */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Real-time system activity stream */}
        <div className="bg-white border border-gray-100 p-6 rounded-3xl lg:col-span-7 space-y-4">
          <div>
            <h4 className="font-bold text-sm text-gray-800 flex items-center space-x-2">
              <Activity className="h-4 w-4 text-rose-500 animate-pulse" />
              <span>Real-Time Clinical Operations Stream</span>
            </h4>
            <p className="text-[9px] font-mono text-gray-400">LIVE SYSTEM ACTIVITY & TRANSACTIONS</p>
          </div>

          <div className="space-y-3 max-h-[340px] overflow-y-auto pr-2 divide-y divide-gray-50">
            {stats.recentAudits && stats.recentAudits.length > 0 ? (
              stats.recentAudits.map((log: any) => (
                <div key={log.id} className="pt-3 first:pt-0 flex items-start justify-between text-xs">
                  <div className="space-y-0.5">
                    <span className="font-semibold text-gray-700 block">{log.action}</span>
                    <span className="text-gray-400 block text-[10px] leading-relaxed">{log.details}</span>
                    <span className="text-[9px] font-mono text-gray-300 block">
                      Issued by {log.userName} • {log.role}
                    </span>
                  </div>
                  <span className="text-[9px] font-mono text-gray-400 whitespace-nowrap ml-4">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-400 font-mono text-xs">No active operations detected.</div>
            )}
          </div>
        </div>

        {/* Security Alerts and Telemetry */}
        <div className="bg-white border border-gray-100 p-6 rounded-3xl lg:col-span-5 space-y-4">
          <div>
            <h4 className="font-bold text-sm text-gray-800 flex items-center space-x-2">
              <ShieldCheck className="h-4 w-4 text-emerald-500" />
              <span>Security Telemetry & Health</span>
            </h4>
            <p className="text-[9px] font-mono text-gray-400">SECURITY PROTOCOLS & INTEGRITY</p>
          </div>

          {/* System Health Indicators */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-50 border border-gray-100/50 p-3 rounded-xl flex items-center space-x-2.5">
              <Monitor className="h-4 w-4 text-indigo-500" />
              <div>
                <span className="text-[8px] text-gray-400 font-mono block">CPU UTILISATION</span>
                <span className="text-xs font-bold text-gray-700 font-mono">{stats.systemHealth.cpu}</span>
              </div>
            </div>
            <div className="bg-gray-50 border border-gray-100/50 p-3 rounded-xl flex items-center space-x-2.5">
              <Database className="h-4 w-4 text-rose-500" />
              <div>
                <span className="text-[8px] text-gray-400 font-mono block">DB ENGINE</span>
                <span className="text-xs font-bold text-emerald-500 font-mono">{stats.systemHealth.database}</span>
              </div>
            </div>
          </div>

          {/* Alerts Feed */}
          <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
            {stats.securityAlerts && stats.securityAlerts.length > 0 ? (
              stats.securityAlerts.map((alert: any) => (
                <div key={alert.id} className="p-2.5 bg-rose-50/50 border border-rose-100/50 rounded-xl flex items-start space-x-2.5">
                  <AlertTriangle className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />
                  <div className="text-[11px] leading-snug">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-rose-700 font-mono uppercase text-[9px]">{alert.severity} SEVERITY</span>
                      <span className="text-[9px] font-mono text-rose-400">{new Date(alert.timestamp).toLocaleTimeString()}</span>
                    </div>
                    <p className="text-gray-700 font-medium mt-0.5">{alert.action}</p>
                    <p className="text-gray-500 text-[10px] mt-0.5 leading-relaxed">{alert.details}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-6 text-gray-400 font-mono text-xs border border-dashed border-gray-100 rounded-xl bg-emerald-50/10">
                <ShieldCheck className="h-5 w-5 text-emerald-500 mx-auto mb-1" />
                <span className="text-emerald-700 font-semibold text-[10px]">ALL SHIELDS DEPLOYED & COMPLIANT</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
