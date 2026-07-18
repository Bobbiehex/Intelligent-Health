import React, { useState } from 'react';
import { 
  Bed, DoorOpen, ClipboardList, MapPin, 
  Clock, CheckCircle2, AlertTriangle, ArrowRightLeft
} from 'lucide-react';
import { toast } from 'sonner';

interface AdmissionManagerProps {
  patient: any;
  token: string;
  onRefresh: () => void;
}

export default function AdmissionManager({ patient, token, onRefresh }: AdmissionManagerProps) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    ward: '',
    bedNumber: '',
    observations: ''
  });

  const handleAdmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.ward || !form.bedNumber) {
      toast.error('Ward and Bed Number are required');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/nurse/admissions', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({
          patientId: patient.id,
          ward: form.ward,
          bedNumber: form.bedNumber,
          observations: form.observations
        })
      });

      if (res.ok) {
        toast.success('Patient admitted successfully');
        setForm({ ward: '', bedNumber: '', observations: '' });
        onRefresh();
      } else {
        const data = await res.json();
        throw new Error(data.error || 'Failed to admit patient');
      }
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const wards = ['General Medicine', 'Surgical', 'Pediatric', 'Cardiology', 'Neurology', 'ICU', 'Maternity'];

  return (
    <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm space-y-6">
      <div>
        <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
          <DoorOpen className="h-4 w-4 text-blue-500" />
          Patient Admission Manager
        </h3>
        <p className="text-[10px] text-gray-400 font-mono uppercase tracking-wider mt-0.5">Assign ward and bed for inpatient care</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <form onSubmit={handleAdmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Assign Ward</label>
              <select 
                className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-xs outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all appearance-none"
                value={form.ward}
                onChange={(e) => setForm({...form, ward: e.target.value})}
              >
                <option value="">Select Ward...</option>
                {wards.map(w => <option key={w} value={w}>{w}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Bed Number</label>
              <input 
                type="text"
                placeholder="e.g. B-102"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-xs outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                value={form.bedNumber}
                onChange={(e) => setForm({...form, bedNumber: e.target.value})}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Admission Observations</label>
            <textarea 
              rows={4}
              placeholder="Record initial clinical observations, stability, and immediate nursing requirements..."
              className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-xs outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none leading-relaxed"
              value={form.observations}
              onChange={(e) => setForm({...form, observations: e.target.value})}
            />
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-gray-900 text-white py-4 rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:bg-black transition-all flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="h-4 w-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4" />
                Process Admission
              </>
            )}
          </button>
        </form>

        <div className="space-y-4">
          <div className="p-4 bg-blue-50/50 border border-blue-100 rounded-2xl">
            <h4 className="text-[10px] font-bold text-blue-900 uppercase tracking-widest mb-2 flex items-center gap-2">
              <ClipboardList className="h-3.5 w-3.5" />
              Admission Prerequisites
            </h4>
            <ul className="space-y-2">
              {[
                'Verify Patient Identity (Wristband Check)',
                'Initial Vital Signs Assessment',
                'Orientation to Ward and Bed',
                'Verify Consent Forms for Inpatient Care'
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-2 text-[10px] text-blue-700 font-medium leading-tight">
                  <div className="h-1 w-1 rounded-full bg-blue-400 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl">
            <h4 className="text-[10px] font-bold text-amber-900 uppercase tracking-widest mb-2 flex items-center gap-2">
              <AlertTriangle className="h-3.5 w-3.5" />
              Staff Protocol
            </h4>
            <p className="text-[10px] leading-relaxed text-amber-800 font-medium">
              Ensure the ward transfer checklist is completed in the system. Notify the attending physician once the patient is comfortably bedded.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
