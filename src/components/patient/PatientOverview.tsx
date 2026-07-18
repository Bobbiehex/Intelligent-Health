import React, { useState, useEffect } from 'react';
import { 
  Calendar, Clock, Pill, Activity, User, Heart, 
  TrendingUp, Bell, ChevronRight, Download, Sparkles, AlertCircle
} from 'lucide-react';
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, 
  CartesianGrid, BarChart, Bar, Cell
} from 'recharts';
import { motion } from 'motion/react';
import { toast } from 'sonner';
import { Appointment, Prescription, LabReport, VitalsLog, Condition } from '../../types';

interface PatientOverviewProps {
  user: any;
  token: string;
  onTabChange: (tab: string) => void;
}

interface DashboardData {
  upcomingAppointments: Appointment[];
  activePrescriptions: Prescription[];
  recentLabs: LabReport[];
  conditions: Condition[];
  vitals: VitalsLog[];
  assignedDoctor: { name: string; department: string } | null;
  summary: {
    totalAppointments: number;
    activeMedications: number;
    pendingLabs: number;
  };
}

export default function PatientOverview({ user, token, onTabChange }: PatientOverviewProps) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/patient/dashboard', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Failed to fetch dashboard');
        const result = await response.json();
        setData(result);
      } catch (error) {
        toast.error('Could not load health summary');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [token]);

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[400px] text-slate-400 font-mono text-xs">
      <Activity className="animate-spin mb-4 text-indigo-600" size={32} />
      <span>INITIALIZING AI HEALTH ANALYTICS...</span>
    </div>
  );

  if (!data) return null;

  const vitalsChartData = [...data.vitals].reverse().map(v => ({
    date: new Date(v.recordedAt).toLocaleDateString([], { month: 'short', day: 'numeric' }),
    sys: parseInt(v.bloodPressure?.split('/')[0] || '120'),
    dia: parseInt(v.bloodPressure?.split('/')[1] || '80'),
    hr: v.heartRate
  }));

  const handleDownload = (type: string, id: string) => {
    toast.success(`Generating ${type} report...`, {
      description: 'Your secure document is being prepared for download.'
    });
    // In a real production app, this would fetch a PDF blob from the server
    setTimeout(() => {
      window.print();
    }, 1000);
  };

  return (
    <div className="space-y-8">
      {/* Welcome & Stats Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-8 space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-display font-bold text-slate-800 tracking-tight">Good morning, {user.name.split(' ')[0]}!</h1>
              <p className="text-slate-500 mt-1">Here is your clinical health summary and upcoming schedule.</p>
            </div>
            <div className="flex items-center space-x-2 bg-indigo-50 px-4 py-2 rounded-2xl text-indigo-700 text-sm font-bold border border-indigo-100 shadow-sm">
              <Sparkles size={16} />
              <span>AI Insights Ready</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              { label: 'Active Medications', value: data.summary.activeMedications, icon: Pill, color: 'emerald', trend: 'Compliance: 98%' },
              { label: 'Upcoming Consults', value: data.summary.totalAppointments, icon: Calendar, color: 'indigo', trend: 'Next: 2 days' },
              { label: 'Pending Lab Reports', value: data.summary.pendingLabs, icon: Activity, color: 'rose', trend: 'Results soon' },
            ].map((stat, i) => {
              const Icon = stat.icon;
              return (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  key={i}
                  className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm group hover:shadow-md transition-all cursor-pointer"
                >
                  <div className={`w-12 h-12 bg-${stat.color}-50 rounded-2xl flex items-center justify-center text-${stat.color}-600 mb-4 group-hover:scale-110 transition-transform`}>
                    <Icon size={24} />
                  </div>
                  <p className="text-slate-400 text-xs font-bold font-mono uppercase tracking-wider">{stat.label}</p>
                  <div className="flex items-baseline space-x-2 mt-1">
                    <h3 className="text-3xl font-display font-bold text-slate-800">{stat.value}</h3>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">{stat.trend}</span>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Vitals Trends Chart */}
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-lg font-bold text-slate-800 flex items-center space-x-2">
                  <Heart className="text-rose-500" size={20} />
                  <span>Biometric Trends</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Historical blood pressure and heart rate analysis</p>
              </div>
              <button 
                onClick={() => onTabChange('analytics')}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center"
              >
                Full Analytics <ChevronRight size={14} className="ml-1" />
              </button>
            </div>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={vitalsChartData}>
                  <defs>
                    <linearGradient id="colorSys" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94A3B8' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94A3B8' }} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                  />
                  <Area type="monotone" dataKey="sys" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorSys)" name="Systolic BP" />
                  <Area type="monotone" dataKey="dia" stroke="#818cf8" strokeWidth={2} fillOpacity={0} name="Diastolic BP" strokeDasharray="5 5" />
                  <Area type="monotone" dataKey="hr" stroke="#f43f5e" strokeWidth={3} fillOpacity={0} name="Heart Rate" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Sidebar Widgets */}
        <div className="lg:col-span-4 space-y-8">
          {/* Doctor Card */}
          <div className="bg-indigo-600 p-8 rounded-[2.5rem] text-white shadow-lg shadow-indigo-200 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
            <div className="relative z-10">
              <span className="text-[10px] font-bold font-mono tracking-widest uppercase opacity-60">Primary Care Provider</span>
              <h3 className="text-xl font-bold mt-2">Dr. {data.assignedDoctor?.name || 'Assigned Physician'}</h3>
              <p className="text-indigo-100 text-sm mt-1">{data.assignedDoctor?.department || 'General Medicine'}</p>
              
              <div className="mt-8 pt-6 border-t border-white/10 flex items-center justify-between">
                <button 
                  onClick={() => onTabChange('messages')}
                  className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all border border-white/5"
                >
                  Send Message
                </button>
                <button 
                  onClick={() => onTabChange('appointments')}
                  className="bg-white text-indigo-600 px-4 py-2 rounded-xl text-xs font-bold shadow-sm hover:bg-slate-50 transition-all"
                >
                  Book Appointment
                </button>
              </div>
            </div>
          </div>

          {/* Upcoming Appointment */}
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
            <h4 className="text-sm font-bold text-slate-800 mb-4 flex items-center space-x-2">
              <Calendar className="text-indigo-500" size={16} />
              <span>Next Consultation</span>
            </h4>
            {data.upcomingAppointments[0] ? (
              <div className="space-y-4">
                <div className="bg-slate-50 p-4 rounded-2xl">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold font-mono text-indigo-600 uppercase tracking-widest">
                      {new Date(data.upcomingAppointments[0].dateTime).toLocaleDateString([], { month: 'long', day: 'numeric' })}
                    </span>
                    <span className="text-xs font-bold text-slate-800">{data.upcomingAppointments[0].status}</span>
                  </div>
                  <p className="text-sm font-bold text-slate-800">Dr. {data.upcomingAppointments[0].doctor?.name}</p>
                  <p className="text-xs text-slate-500 mt-1 flex items-center">
                    <Clock size={12} className="mr-1" />
                    {new Date(data.upcomingAppointments[0].dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <button 
                  onClick={() => onTabChange('appointments')}
                  className="w-full py-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-xl text-xs font-bold transition-all"
                >
                  View Details
                </button>
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">No upcoming appointments found.</p>
            )}
          </div>

          {/* Active Conditions */}
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
            <h4 className="text-sm font-bold text-slate-800 mb-4 flex items-center space-x-2">
              <AlertCircle className="text-rose-500" size={16} />
              <span>Chronic Conditions</span>
            </h4>
            <div className="space-y-2">
              {data.conditions.length > 0 ? data.conditions.map((c, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                  <span className="text-xs font-bold text-slate-700">{c.name}</span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase font-mono">ACTIVE</span>
                </div>
              )) : (
                <p className="text-xs text-slate-400 italic">No chronic conditions listed.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Prescriptions & Labs Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-slate-800 flex items-center space-x-2">
              <Pill className="text-emerald-500" size={20} />
              <span>Recent Prescriptions</span>
            </h3>
            <button 
              onClick={() => onTabChange('records')}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-700"
            >
              All Records
            </button>
          </div>
          <div className="space-y-4">
            {data.activePrescriptions.map((rx, i) => (
              <div key={i} className="flex items-center justify-between p-4 border border-slate-50 rounded-2xl hover:bg-slate-50 transition-all cursor-pointer group">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
                    <Pill size={18} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800">{rx.items[0]?.medicineName || 'Medication'}</p>
                    <p className="text-xs text-slate-400 mt-0.5">Dr. {rx.doctor?.name} • {new Date(rx.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
                <button 
                  onClick={() => handleDownload('Prescription', rx.id)}
                  className="p-2 hover:bg-white rounded-xl text-slate-300 hover:text-indigo-600 transition-all"
                >
                  <Download size={16} />
                </button>
              </div>
            ))}
            {data.summary.activeMedications === 0 && <p className="text-center text-slate-400 py-8 text-xs italic">No active prescriptions.</p>}
          </div>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-slate-800 flex items-center space-x-2">
              <Activity className="text-indigo-500" size={20} />
              <span>Laboratory Reports</span>
            </h3>
            <button 
              onClick={() => onTabChange('records')}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-700"
            >
              All Reports
            </button>
          </div>
          <div className="space-y-4">
            {data.recentLabs.map((lab, i) => (
              <div key={i} className="flex items-center justify-between p-4 border border-slate-50 rounded-2xl hover:bg-slate-50 transition-all cursor-pointer group">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                    <Activity size={18} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800">{lab.testName}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{lab.status} • {new Date(lab.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
                <button 
                  onClick={() => onTabChange('records')}
                  className="p-2 hover:bg-white rounded-xl text-slate-300 hover:text-indigo-600 transition-all"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            ))}
            {data.recentLabs.length === 0 && <p className="text-center text-slate-400 py-8 text-xs italic">No recent lab reports.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
