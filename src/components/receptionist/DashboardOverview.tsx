import React from 'react';
import { 
  Users, Calendar, Clock, Ticket, CheckCircle, 
  AlertCircle, TrendingUp, ArrowRight 
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, BarChart, Bar 
} from 'recharts';

interface DashboardOverviewProps {
  stats: any;
  activities: any[];
  onTabChange: (tab: string) => void;
}

export default function DashboardOverview({ stats, activities, onTabChange }: DashboardOverviewProps) {
  const chartData = [
    { name: 'Mon', count: 45 },
    { name: 'Tue', count: 52 },
    { name: 'Wed', count: 48 },
    { name: 'Thu', count: 61 },
    { name: 'Fri', count: 55 },
    { name: 'Sat', count: 32 },
    { name: 'Sun', count: 28 },
  ];

  const cards = [
    { label: 'Total Patients', value: stats.totalPatients, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Today\'s Appointments', value: stats.todayAppointments, icon: Calendar, color: 'text-rose-600', bg: 'bg-rose-50' },
    { label: 'Waiting Patients', value: stats.waitingPatients, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Completed Today', value: stats.completedToday, icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card, idx) => (
          <div key={idx} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all">
            <div className={`w-12 h-12 ${card.bg} rounded-2xl flex items-center justify-center mb-4`}>
              <card.icon className={`h-6 w-6 ${card.color}`} />
            </div>
            <p className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-wider">{card.label}</p>
            <h3 className="text-2xl font-display font-bold text-gray-900 mt-1">{card.value}</h3>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Registration Trends */}
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="font-display font-bold text-gray-900 text-base">Weekly Attendance Trends</h3>
              <p className="text-xs text-gray-400 mt-1">Snapshot of daily clinic traffic</p>
            </div>
            <div className="flex items-center space-x-2 bg-gray-50 px-3 py-1.5 rounded-xl">
              <TrendingUp className="h-4 w-4 text-emerald-500" />
              <span className="text-xs font-semibold text-gray-600">+12% vs last week</span>
            </div>
          </div>

          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94a3b8', fontSize: 10 }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94a3b8', fontSize: 10 }}
                />
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="count" 
                  stroke="#f43f5e" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorCount)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Activity Log */}
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
          <h3 className="font-display font-bold text-gray-900 text-base mb-6">Recent Frontdesk Activity</h3>
          <div className="space-y-6">
            {activities.length > 0 ? activities.map((log, idx) => (
              <div key={idx} className="flex items-start space-x-4">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                  log.action.includes('Register') ? 'bg-emerald-50' : 
                  log.action.includes('Check-In') ? 'bg-blue-50' : 'bg-gray-50'
                }`}>
                  <AlertCircle className={`h-4 w-4 ${
                    log.action.includes('Register') ? 'text-emerald-500' : 
                    log.action.includes('Check-In') ? 'text-blue-500' : 'text-gray-500'
                  }`} />
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-800">{log.action}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">{log.details}</p>
                  <p className="text-[9px] font-mono text-gray-300 mt-1 uppercase">
                    {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            )) : (
              <p className="text-xs text-gray-400 text-center py-8 italic">No recent activity recorded.</p>
            )}
          </div>
          <button 
            onClick={() => onTabChange('reports')}
            className="w-full mt-6 flex items-center justify-center space-x-2 text-xs font-bold text-rose-500 hover:text-rose-600 py-3 bg-rose-50/50 rounded-2xl transition-all"
          >
            <span>View All Logs</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
