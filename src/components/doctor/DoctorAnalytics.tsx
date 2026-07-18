import React from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line
} from 'recharts';
import { TrendingUp, Users, Stethoscope, Sparkles, Target, ThumbsUp } from 'lucide-react';

const diagnosisData = [
  { name: 'Hypertension', value: 45 },
  { name: 'Diabetes', value: 32 },
  { name: 'Respiratory', value: 28 },
  { name: 'Infectious', value: 20 },
  { name: 'Other', value: 15 },
];

const aiPerformanceData = [
  { month: 'Jan', accuracy: 82, acceptance: 75 },
  { month: 'Feb', accuracy: 84, acceptance: 78 },
  { month: 'Mar', accuracy: 85, acceptance: 82 },
  { month: 'Apr', accuracy: 88, acceptance: 85 },
  { month: 'May', accuracy: 90, acceptance: 88 },
  { month: 'Jun', accuracy: 92, acceptance: 90 },
];

const COLORS = ['#6366f1', '#f43f5e', '#10b981', '#f59e0b', '#94a3b8'];

export default function DoctorAnalytics() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <MetricCard 
          title="Avg Consultation Time" 
          value="18.5 min" 
          trend="-2.4 min from last month"
          icon={<Stethoscope className="text-indigo-600" />}
        />
        <MetricCard 
          title="AI Acceptance Rate" 
          value="92.4%" 
          trend="+5.2% accuracy boost"
          icon={<Sparkles className="text-rose-600" />}
        />
        <MetricCard 
          title="Patient Satisfaction" 
          value="4.9/5" 
          trend="Based on 240 reviews"
          icon={<ThumbsUp className="text-emerald-600" />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
          <h3 className="text-sm font-bold text-gray-900 mb-6">Top Diagnoses Distribution</h3>
          <div className="h-[300px] flex items-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={diagnosisData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {diagnosisData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2 ml-4">
              {diagnosisData.map((d, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                  <span className="text-[10px] font-bold text-gray-500 uppercase">{d.name}</span>
                  <span className="text-xs font-bold text-gray-900 ml-auto">{d.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
          <h3 className="text-sm font-bold text-gray-900 mb-6">RL & AI Performance Growth</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={aiPerformanceData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#9ca3af'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#9ca3af'}} />
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Line type="monotone" dataKey="accuracy" stroke="#6366f1" strokeWidth={3} dot={{ r: 4, fill: '#6366f1' }} name="AI Accuracy" />
                <Line type="monotone" dataKey="acceptance" stroke="#f43f5e" strokeWidth={3} dot={{ r: 4, fill: '#f43f5e' }} name="Dr. Acceptance" />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100/30">
            <p className="text-[10px] text-indigo-700 leading-relaxed italic">
              "Your reinforcement learning feedback is continuously training the local Gemini instances, resulting in higher precision for Cardiology-specific diagnoses."
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ title, value, trend, icon }: any) {
  return (
    <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-4">
      <div className="p-3 bg-gray-50 rounded-2xl">
        {icon}
      </div>
      <div>
        <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{title}</h4>
        <p className="text-xl font-bold text-gray-900">{value}</p>
        <span className="text-[10px] text-emerald-600 font-medium">{trend}</span>
      </div>
    </div>
  );
}
