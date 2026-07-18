import React from 'react';
import { 
  Calendar, Users, FileCheck, Clock, AlertTriangle, 
  Beaker, Activity, Sparkles, TrendingUp, Bell, ChevronRight, Stethoscope
} from 'lucide-react';
import { motion } from 'motion/react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, AreaChart, Area
} from 'recharts';

interface DoctorOverviewProps {
  stats: {
    todayAppointments: number;
    upcomingAppointments: number;
    completedConsultations: number;
    pendingConsultations: number;
    assignedPatients: number;
    labResults: number;
    labRequests: number;
    aiRecommendations: number;
  };
  queue: any[];
  activeConsultation?: any;
  onStartConsultation: (patient: any) => void;
  onResumeConsultation: () => void;
}

const mockChartData = [
  { name: 'Mon', consultations: 12, aiAcceptance: 85 },
  { name: 'Tue', consultations: 18, aiAcceptance: 88 },
  { name: 'Wed', consultations: 15, aiAcceptance: 92 },
  { name: 'Thu', consultations: 22, aiAcceptance: 90 },
  { name: 'Fri', consultations: 20, aiAcceptance: 95 },
  { name: 'Sat', consultations: 8, aiAcceptance: 88 },
  { name: 'Sun', consultations: 5, aiAcceptance: 90 },
];

export default function DoctorOverview({ stats, queue, activeConsultation, onStartConsultation, onResumeConsultation }: DoctorOverviewProps) {
  return (
    <div className="space-y-6">
      {/* Active Consultation Banner */}
      {activeConsultation && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-indigo-600 p-6 rounded-[2.5rem] text-white shadow-xl shadow-indigo-200 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
          <div className="flex items-center gap-5 relative z-10">
            <div className="h-16 w-16 bg-white/10 rounded-3xl flex items-center justify-center backdrop-blur-md border border-white/20 animate-pulse">
              <Stethoscope className="h-8 w-8 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-100">Live Encounter in Progress</span>
              </div>
              <h3 className="text-xl font-bold mt-1">Resuming with {activeConsultation.patient?.name}</h3>
              <p className="text-xs text-indigo-100/80 mt-0.5">The clinical encounter file is open and awaiting your finalization.</p>
            </div>
          </div>
          <button 
            onClick={onResumeConsultation}
            className="bg-white text-indigo-600 px-8 py-3.5 rounded-2xl font-bold shadow-lg hover:bg-indigo-50 transition-all flex items-center gap-2 relative z-10 active:scale-95"
          >
            <span>Resume Encounter</span>
            <ChevronRight className="h-4 w-4" />
          </button>
        </motion.div>
      )}

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Today's Appointments" 
          value={stats.todayAppointments} 
          icon={<Calendar className="h-5 w-5 text-blue-500" />}
          trend="+12% from yesterday"
        />
        <StatCard 
          title="Assigned Patients" 
          value={stats.assignedPatients} 
          icon={<Users className="h-5 w-5 text-indigo-500" />}
          trend="+3 new this week"
        />
        <StatCard 
          title="Lab Results Ready" 
          value={stats.labResults} 
          icon={<Beaker className="h-5 w-5 text-emerald-500" />}
          trend="4 urgent flags"
          variant="warning"
        />
        <StatCard 
          title="AI Suggestions" 
          value={stats.aiRecommendations} 
          icon={<Sparkles className="h-5 w-5 text-rose-500" />}
          trend="8 awaiting review"
          variant="ai"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Main Chart */}
        <div className="lg:col-span-8 space-y-6">
          {/* Active Queue Section */}
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-sm font-bold text-gray-900">Consultation Queue</h3>
                <p className="text-xs text-gray-400">Patients assigned to you for encounter</p>
              </div>
              <span className="px-2.5 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-[10px] font-bold uppercase tracking-wider">
                {queue.length} Patients Waiting
              </span>
            </div>

            {queue.length > 0 ? (
              <div className="space-y-3">
                {queue.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-4 bg-gray-50/50 hover:bg-white border border-transparent hover:border-gray-100 rounded-2xl transition-all group">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600 font-bold">
                        {item.patient?.name?.charAt(0) || 'P'}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-gray-900">{item.patient?.name}</h4>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase ${
                            item.priority === 'Emergency' ? 'bg-rose-100 text-rose-700' : 
                            item.priority === 'Urgent' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
                          }`}>
                            {item.priority}
                          </span>
                          <span className="text-[10px] text-gray-400 font-mono">Token #{item.tokenNumber}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right hidden sm:block">
                        <p className="text-[10px] text-gray-400 font-bold uppercase">Status</p>
                        <p className={`text-xs font-bold ${
                          item.status === 'Calling' ? 'text-rose-600 animate-pulse' :
                          item.status === 'Accepted' ? 'text-emerald-600' : 
                          item.status === 'Completed' ? 'text-slate-600' : 'text-gray-600'
                        }`}>{item.status}</p>
                      </div>
                      <button 
                        onClick={() => onStartConsultation(item.patient)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                          item.status === 'Accepted' || item.status === 'With Doctor'
                            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100'
                            : 'bg-white border border-gray-100 text-gray-400 cursor-not-allowed'
                        }`}
                        disabled={item.status !== 'Accepted' && item.status !== 'With Doctor'}
                      >
                        Start Consultation
                        <ChevronRight className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center">
                <Users className="h-10 w-10 text-gray-100 mx-auto mb-3" />
                <p className="text-xs text-gray-400">No patients currently in your queue.</p>
              </div>
            )}
          </div>

          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-sm font-bold text-gray-900">Consultation Volume & AI Acceptance</h3>
                <p className="text-xs text-gray-400">Weekly performance metrics</p>
              </div>
              <select className="text-xs border-none bg-gray-50 rounded-lg px-3 py-1.5 focus:ring-0">
                <option>Last 7 Days</option>
                <option>Last 30 Days</option>
              </select>
            </div>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={mockChartData}>
                  <defs>
                    <linearGradient id="colorCons" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#9ca3af'}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#9ca3af'}} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                  <Area type="monotone" dataKey="consultations" stroke="#3b82f6" fillOpacity={1} fill="url(#colorCons)" strokeWidth={2} />
                  <Line type="monotone" dataKey="aiAcceptance" stroke="#f43f5e" strokeWidth={2} dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Sidebar Status */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
            <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Clock className="h-4 w-4 text-orange-500" />
              Pending Actions
            </h3>
            <div className="space-y-4">
              <ActionItem 
                title="Review Lab Results" 
                desc="Patient John Doe #PAT-102"
                time="2h ago"
                type="lab"
              />
              <ActionItem 
                title="AI Diagnosis Review" 
                desc="Patient Sarah Smith #PAT-205"
                time="4h ago"
                type="ai"
              />
              <ActionItem 
                title="Prescription Renewal" 
                desc="Patient Robert Lee #PAT-089"
                time="5h ago"
                type="rx"
              />
            </div>
          </div>

          <div className="bg-indigo-600 p-6 rounded-3xl text-white overflow-hidden relative shadow-lg">
            <Sparkles className="absolute -right-4 -bottom-4 h-24 w-24 text-white/10 rotate-12" />
            <h4 className="text-sm font-bold mb-2">AI RL Progress</h4>
            <p className="text-xs text-indigo-100 mb-4">Your feedback helped improve AI diagnosis accuracy by 4.2% this month.</p>
            <div className="w-full bg-indigo-500/50 rounded-full h-2 mb-2">
              <div className="bg-white h-2 rounded-full" style={{ width: '88%' }}></div>
            </div>
            <div className="flex justify-between text-[10px] font-mono">
              <span>Current Accuracy: 88%</span>
              <span>Target: 95%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, trend, variant = 'default' }: any) {
  const bgColor = variant === 'warning' ? 'bg-amber-50' : variant === 'ai' ? 'bg-rose-50' : 'bg-white';
  return (
    <div className={`${bgColor} p-5 rounded-3xl border border-gray-100 shadow-sm`}>
      <div className="flex justify-between items-start mb-4">
        <div className="p-2.5 bg-gray-50 rounded-2xl">
          {icon}
        </div>
        <span className="text-[10px] font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">
          {trend}
        </span>
      </div>
      <h4 className="text-xs text-gray-400 font-medium">{title}</h4>
      <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
    </div>
  );
}

function ActionItem({ title, desc, time, type }: any) {
  return (
    <div className="flex items-start gap-3 group cursor-pointer">
      <div className={`mt-1 h-2 w-2 rounded-full ${type === 'lab' ? 'bg-emerald-500' : type === 'ai' ? 'bg-rose-500' : 'bg-blue-500'}`} />
      <div className="flex-1 min-w-0">
        <h5 className="text-xs font-semibold text-gray-800 group-hover:text-indigo-600 transition-colors">{title}</h5>
        <p className="text-[11px] text-gray-400 truncate">{desc}</p>
        <span className="text-[10px] text-gray-300">{time}</span>
      </div>
      <button className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-50 rounded-lg transition-all">
        <ChevronRight className="h-3 w-3 text-gray-400" />
      </button>
    </div>
  );
}
