import React, { useState } from 'react';
import { 
  ClipboardList, CheckCircle2, AlertTriangle, Brain, 
  Activity, Droplets, Thermometer, Accessibility, Pizza
} from 'lucide-react';
import { toast } from 'sonner';

interface NursingAssessmentProps {
  patientId: string;
  token: string;
  onRefresh: () => void;
}

export default function NursingAssessment({ patientId, token, onRefresh }: NursingAssessmentProps) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    chiefComplaint: '',
    mentalStatus: 'Alert',
    painLevel: 0,
    skinAssessment: 'Intact',
    mobilityAssessment: 'Ambulatory',
    nutritionalStatus: 'Normal',
    hydrationStatus: 'Adequate',
    fallRisk: 'Low',
    infectionRisk: 'Low',
    pressureUlcerRisk: 'Low',
    observations: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/nurse/assessments', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ ...form, patientId })
      });

      if (res.ok) {
        toast.success('Nursing assessment completed');
        onRefresh();
      } else {
        throw new Error('Failed to save assessment');
      }
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const sections = [
    { label: 'Mental Status', field: 'mentalStatus', options: ['Alert', 'Confused', 'Lethargic', 'Obtunded', 'Unresponsive'], icon: Brain },
    { label: 'Skin Assessment', field: 'skinAssessment', options: ['Intact', 'Dry', 'Bruised', 'Laceration', 'Pressure Ulcer'], icon: Accessibility },
    { label: 'Mobility', field: 'mobilityAssessment', options: ['Ambulatory', 'Assist Required', 'Bed Bound', 'Paralyzed'], icon: Activity },
    { label: 'Nutritional', field: 'nutritionalStatus', options: ['Normal', 'Poor', 'NPO', 'Enteral', 'Parenteral'], icon: Pizza }
  ];

  const risks = [
    { label: 'Fall Risk', field: 'fallRisk' },
    { label: 'Infection Risk', field: 'infectionRisk' },
    { label: 'Pressure Ulcer', field: 'pressureUlcerRisk' }
  ];

  return (
    <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm">
      <div className="mb-8">
        <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
          <ClipboardList className="h-4 w-4 text-rose-500" />
          Comprehensive Nursing Assessment
        </h3>
        <p className="text-[10px] text-gray-400 font-mono uppercase tracking-wider mt-0.5">Physical and clinical baseline evaluation</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Chief Complaint (Nursing Perspective)</label>
            <input 
              className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-xs outline-none focus:ring-2 focus:ring-rose-500/20"
              placeholder="e.g. Patient reports sharp pain in lower abdomen, increased nausea..."
              value={form.chiefComplaint}
              onChange={(e) => setForm({...form, chiefComplaint: e.target.value})}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {sections.map((sec, i) => (
              <div key={i} className="space-y-2">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5 pl-1">
                  <sec.icon className="h-3 w-3" />
                  {sec.label}
                </label>
                <select 
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-100 rounded-xl text-[11px] outline-none appearance-none"
                  value={(form as any)[sec.field]}
                  onChange={(e) => setForm({...form, [sec.field]: e.target.value})}
                >
                  {sec.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Pain Level (0-10)</label>
              <input 
                type="range" min="0" max="10" step="1"
                className="w-full accent-rose-500"
                value={form.painLevel}
                onChange={(e) => setForm({...form, painLevel: parseInt(e.target.value)})}
              />
              <div className="flex justify-between text-[10px] font-bold text-gray-400">
                <span>0 (None)</span>
                <span className="text-rose-500">{form.painLevel}</span>
                <span>10 (Severe)</span>
              </div>
            </div>

            {risks.map((risk, i) => (
              <div key={i} className="space-y-2">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">{risk.label}</label>
                <div className="flex gap-2">
                  {['Low', 'Medium', 'High'].map(lv => (
                    <button 
                      key={lv} type="button"
                      onClick={() => setForm({...form, [risk.field]: lv})}
                      className={`flex-1 py-1.5 rounded-lg text-[9px] font-bold uppercase transition-all border ${
                        (form as any)[risk.field] === lv 
                          ? 'bg-rose-50 border-rose-200 text-rose-700' 
                          : 'bg-white border-gray-100 text-gray-400'
                      }`}
                    >
                      {lv}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Detailed Observations</label>
            <textarea 
              rows={4}
              placeholder="Record any additional findings, patient behaviors, or critical nursing concerns..."
              className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-xs outline-none focus:ring-2 focus:ring-rose-500/20 transition-all resize-none leading-relaxed"
              value={form.observations}
              onChange={(e) => setForm({...form, observations: e.target.value})}
            />
          </div>
        </div>

        <div className="flex gap-4">
          <button 
            type="submit"
            disabled={loading}
            className="flex-1 bg-gray-900 text-white py-4 rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:bg-black transition-all flex items-center justify-center gap-2"
          >
            {loading ? <div className="h-4 w-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <><CheckCircle2 className="h-4 w-4" /> Save Final Assessment</>}
          </button>
          <button type="button" className="px-8 bg-gray-50 text-gray-400 py-4 rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:bg-gray-100 hover:text-gray-600 transition-all">
            Clear
          </button>
        </div>
      </form>
    </div>
  );
}
