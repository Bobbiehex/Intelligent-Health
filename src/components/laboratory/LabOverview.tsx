import React, { useState, useEffect } from 'react';
import { 
  FlaskConical, 
  Beaker, 
  ClipboardList, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  TrendingUp,
  Activity,
  UserPlus,
  ShieldAlert
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  LineChart, 
  Line,
  Cell,
  PieChart,
  Pie
} from 'recharts';
import { motion } from 'motion/react';

interface LabAnalytics {
  totalTests: number;
  pendingRequests: number;
  completedToday: number;
  urgentRequests: number;
  emergencyRequests: number;
  aiInteractions: number;
  aiFeedback: number;
  acceptedAIRate: number;
}

export const LabOverview: React.FC = () => {
  const [analytics, setAnalytics] = useState<LabAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const response = await fetch('/api/lab/analytics', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await response.json();
      setAnalytics(data);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    { title: 'Pending Requests', value: analytics?.pendingRequests || 0, icon: ClipboardList, color: 'blue', trend: '+5% from yesterday' },
    { title: 'Samples Today', value: analytics?.completedToday || 0, icon: Beaker, color: 'emerald', trend: 'On track' },
    { title: 'Urgent/Emergency', value: (analytics?.urgentRequests || 0) + (analytics?.emergencyRequests || 0), icon: ShieldAlert, color: 'rose', trend: 'High priority' },
    { title: 'Total Reports', value: analytics?.totalTests || 0, icon: CheckCircle2, color: 'amber', trend: 'Overall output' },
  ];

  const chartData = [
    { name: 'Mon', tests: 45, samples: 32 },
    { name: 'Tue', tests: 52, samples: 41 },
    { name: 'Wed', tests: 48, samples: 38 },
    { name: 'Thu', tests: 61, samples: 45 },
    { name: 'Fri', tests: 55, samples: 42 },
    { name: 'Sat', tests: 32, samples: 25 },
    { name: 'Sun', tests: 28, samples: 20 },
  ];

  const departmentData = [
    { name: 'Hematology', value: 35 },
    { name: 'Chemistry', value: 25 },
    { name: 'Microbiology', value: 20 },
    { name: 'Immunology', value: 15 },
    { name: 'Other', value: 5 },
  ];

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Activity className="h-8 w-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Laboratory Command Center</h1>
          <p className="text-gray-500 mt-1 font-medium">Monitoring real-time diagnostic performance & AI assistance</p>
        </div>
        <div className="flex items-center gap-3 bg-white p-2 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 px-3 py-1 bg-blue-50 rounded-xl">
            <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
            <span className="text-xs font-bold text-blue-700 uppercase tracking-wider">System Live</span>
          </div>
          <span className="text-xs font-medium text-gray-400 px-2">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="bg-white border border-gray-100 p-6 rounded-3xl shadow-sm hover:shadow-md transition-all group"
          >
            <div className="flex justify-between items-start mb-4">
              <div className={`p-3 rounded-2xl transition-transform group-hover:scale-110 ${
                card.color === 'blue' ? 'bg-blue-50' : 
                card.color === 'emerald' ? 'bg-emerald-50' : 
                card.color === 'rose' ? 'bg-rose-50' : 
                'bg-amber-50'
              }`}>
                <card.icon className={`h-6 w-6 ${
                  card.color === 'blue' ? 'text-blue-500' : 
                  card.color === 'emerald' ? 'text-emerald-500' : 
                  card.color === 'rose' ? 'text-rose-500' : 
                  'text-amber-500'
                }`} />
              </div>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider bg-gray-50 px-2 py-1 rounded-lg">Today</span>
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">{card.title}</h3>
              <p className="text-3xl font-bold text-gray-900 tracking-tight">{card.value}</p>
            </div>
            <div className="mt-4 flex items-center gap-2 text-xs font-medium text-gray-400">
              <TrendingUp className="h-3 w-3 text-emerald-500" />
              <span>{card.trend}</span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Activity Chart */}
        <div className="lg:col-span-2 bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-lg font-bold text-gray-900 tracking-tight">Test Volume Trends</h3>
              <p className="text-sm text-gray-500">Weekly comparison of requested vs completed analysis</p>
            </div>
            <select className="bg-gray-50 border-none text-xs font-bold text-gray-500 rounded-xl px-3 py-2 outline-none cursor-pointer">
              <option>Last 7 Days</option>
              <option>Last 30 Days</option>
            </select>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#9ca3af', fontSize: 12, fontWeight: 500 }} 
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#9ca3af', fontSize: 12, fontWeight: 500 }} 
                />
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  cursor={{ fill: '#f9fafb' }}
                />
                <Bar dataKey="tests" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={20} />
                <Bar dataKey="samples" fill="#10b981" radius={[4, 4, 0, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* AI Performance Card */}
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-indigo-50 rounded-xl">
                <Activity className="h-5 w-5 text-indigo-500" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 tracking-tight">AI Assistant Insights</h3>
            </div>
            
            <div className="space-y-6">
              <div className="bg-indigo-50 p-6 rounded-2xl border border-indigo-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-bold text-indigo-700 uppercase tracking-wider">Acceptance Rate</span>
                  <span className="text-2xl font-black text-indigo-900">{analytics?.acceptedAIRate.toFixed(1) || 0}%</span>
                </div>
                <div className="w-full bg-indigo-200 h-2 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${analytics?.acceptedAIRate || 0}%` }}
                    className="bg-indigo-600 h-full rounded-full"
                  />
                </div>
                <p className="text-[10px] text-indigo-400 mt-3 font-bold uppercase tracking-widest">Reinforcement Learning Target: 98%</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Interactions</p>
                  <p className="text-xl font-bold text-gray-900">{analytics?.aiInteractions || 0}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Feedback</p>
                  <p className="text-xl font-bold text-gray-900">{analytics?.aiFeedback || 0}</p>
                </div>
              </div>

              <button className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold text-sm transition-all shadow-lg shadow-indigo-200 flex items-center justify-center gap-2 group">
                Review AI Recommendations
                <TrendingUp className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
          <div className="absolute -right-8 -bottom-8 opacity-[0.03] scale-150 rotate-12">
            <FlaskConical className="h-48 w-48 text-indigo-900" />
          </div>
        </div>
      </div>

      {/* Distribution Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 tracking-tight mb-8">Departmental Test Distribution</h3>
          <div className="h-[250px] flex items-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={departmentData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {departmentData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-3 pr-8">
              {departmentData.map((dept, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <div className="h-3 w-3 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">{dept.name}</span>
                  <span className="text-xs font-bold text-gray-900 ml-auto">{dept.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-lg font-bold text-gray-900 tracking-tight">Recent Activity Log</h3>
            <button className="text-xs font-bold text-blue-600 hover:text-blue-700">View All Audit Logs</button>
          </div>
          <div className="space-y-6">
            {[
              { action: 'Sample Received', detail: 'Blood sample for patient PAT-882 received.', time: '10 mins ago', type: 'info' },
              { action: 'High Glucose Alert', detail: 'Critical result detected for patient ID-229.', time: '25 mins ago', type: 'warning' },
              { action: 'Report Verified', detail: 'Technician Sarah approved Hemoglobin A1c report.', time: '1 hour ago', type: 'success' },
              { action: 'AI Assisted', detail: 'AI provided interpretation for Histopathology ID-901.', time: '2 hours ago', type: 'ai' },
            ].map((log, idx) => (
              <div key={idx} className="flex items-start gap-4">
                <div className={`mt-1 h-2 w-2 rounded-full shrink-0 ${
                  log.type === 'warning' ? 'bg-rose-500 animate-pulse' :
                  log.type === 'success' ? 'bg-emerald-500' :
                  log.type === 'ai' ? 'bg-indigo-500' :
                  'bg-blue-500'
                }`} />
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <h4 className="text-sm font-bold text-gray-900">{log.action}</h4>
                    <span className="text-[10px] font-bold text-gray-400 uppercase">{log.time}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">{log.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
