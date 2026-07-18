import React, { useState } from 'react';
import { 
  Plus, Trash2, AlertCircle, Sparkles, Send, 
  Pill, Clock, FileText, CheckCircle2, History 
} from 'lucide-react';

import { toast } from 'sonner';

interface PrescriptionModuleProps {
  patientId: string;
  token: string;
  onComplete?: () => void;
}

export default function PrescriptionModule({ patientId, token, onComplete }: PrescriptionModuleProps) {
  const [items, setItems] = useState([{ medicineName: '', dosage: '', frequency: 'Once daily', duration: '7 days', instructions: '', drugType: 'Tablet' }]);
  const [loading, setLoading] = useState(false);
  const [warnings, setWarnings] = useState<string | null>(null);
  const [sendToPatient, setSendToPatient] = useState(true);

  const addItem = () => setItems([...items, { medicineName: '', dosage: '', frequency: 'Once daily', duration: '7 days', instructions: '', drugType: 'Tablet' }]);
  const removeItem = (index: number) => setItems(items.filter((_, i) => i !== index));

  const updateItem = (index: number, field: string, value: string) => {
    const newItems = [...items];
    (newItems[index] as any)[field] = value;
    setItems(newItems);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setWarnings(null);
    try {
      const res = await fetch('/api/doctor/prescriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ patientId, items, sendToPatient })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      if (data.aiInteractionWarnings) {
        setWarnings(data.aiInteractionWarnings);
      }
      
      toast.success('Digital script authorized and issued successfully');
      if (onComplete) onComplete();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden flex flex-col max-h-[calc(100vh-180px)]">
      <div className="p-6 border-b border-gray-50 bg-gray-50/30 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-100">
            <Pill className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-bold text-gray-900">E-Prescription Formulary</h2>
            <p className="text-[10px] text-gray-400 font-mono uppercase tracking-wider">Gemini interaction scanning active</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-6 flex-1 overflow-y-auto">
        <div className="space-y-4">
          {items.map((item, index) => (
            <div key={index} className="group relative bg-gray-50/50 p-6 rounded-3xl border border-gray-100 grid grid-cols-1 md:grid-cols-4 gap-4 animate-in fade-in zoom-in-95 duration-200">
              <div className="md:col-span-2 space-y-1.5">
                <label className="text-[10px] font-bold text-gray-400 uppercase font-mono">Medication Name</label>
                <input 
                  required
                  placeholder="e.g. Lisinopril"
                  value={item.medicineName}
                  onChange={(e) => updateItem(index, 'medicineName', e.target.value)}
                  className="w-full bg-white border border-gray-100 rounded-xl p-3 text-xs focus:ring-2 focus:ring-indigo-500/10 transition-all"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-400 uppercase font-mono">Dosage</label>
                <input 
                  required
                  placeholder="e.g. 10mg"
                  value={item.dosage}
                  onChange={(e) => updateItem(index, 'dosage', e.target.value)}
                  className="w-full bg-white border border-gray-100 rounded-xl p-3 text-xs focus:ring-2 focus:ring-indigo-500/10 transition-all"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-400 uppercase font-mono">Frequency</label>
                <select 
                  value={item.frequency}
                  onChange={(e) => updateItem(index, 'frequency', e.target.value)}
                  className="w-full bg-white border border-gray-100 rounded-xl p-3 text-xs focus:ring-2 focus:ring-indigo-500/10 transition-all"
                >
                  <option>Once daily</option>
                  <option>Twice daily</option>
                  <option>Three times daily</option>
                  <option>Four times daily</option>
                  <option>As needed (PRN)</option>
                  <option>Before meals</option>
                  <option>At bedtime</option>
                </select>
              </div>
              <div className="md:col-span-2 space-y-1.5">
                <label className="text-[10px] font-bold text-gray-400 uppercase font-mono">Specific Instructions</label>
                <input 
                  placeholder="e.g. Take with food, avoid alcohol..."
                  value={item.instructions}
                  onChange={(e) => updateItem(index, 'instructions', e.target.value)}
                  className="w-full bg-white border border-gray-100 rounded-xl p-3 text-xs focus:ring-2 focus:ring-indigo-500/10 transition-all"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-400 uppercase font-mono">Drug Type</label>
                <select 
                  value={item.drugType || 'Tablet'}
                  onChange={(e) => updateItem(index, 'drugType', e.target.value)}
                  className="w-full bg-white border border-gray-100 rounded-xl p-3 text-xs focus:ring-2 focus:ring-indigo-500/10 transition-all font-medium"
                >
                  <option value="Tablet">Tablet</option>
                  <option value="Capsule">Capsule</option>
                  <option value="Injection">Injection</option>
                  <option value="Syrup">Syrup</option>
                  <option value="Cream">Cream</option>
                  <option value="Inhaler">Inhaler</option>
                  <option value="Drops">Drops</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-400 uppercase font-mono">Duration</label>
                <input 
                  required
                  placeholder="e.g. 14 days"
                  value={item.duration}
                  onChange={(e) => updateItem(index, 'duration', e.target.value)}
                  className="w-full bg-white border border-gray-100 rounded-xl p-3 text-xs focus:ring-2 focus:ring-indigo-500/10 transition-all"
                />
              </div>

              {items.length > 1 && (
                <button 
                  type="button" 
                  onClick={() => removeItem(index)}
                  className="absolute -right-2 -top-2 h-8 w-8 bg-white border border-gray-100 text-rose-500 rounded-full shadow-sm flex items-center justify-center hover:bg-rose-50 transition-all opacity-0 group-hover:opacity-100"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
        </div>

        <button 
          type="button" 
          onClick={addItem}
          className="w-full py-4 border-2 border-dashed border-gray-100 rounded-3xl text-gray-400 hover:text-indigo-600 hover:border-indigo-100 hover:bg-indigo-50/30 transition-all flex items-center justify-center gap-2 text-xs font-bold"
        >
          <Plus className="h-4 w-4" />
          Add Medication to Script
        </button>

        <div className="flex items-center gap-3 p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100/50">
          <input 
            type="checkbox" 
            id="sendToPatient" 
            checked={sendToPatient} 
            onChange={(e) => setSendToPatient(e.target.checked)}
            className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
          />
          <label htmlFor="sendToPatient" className="text-xs font-bold text-indigo-900">Send prescription directly to patient dashboard</label>
        </div>

        {warnings && (
          <div className="bg-amber-50 border border-amber-100 rounded-3xl p-4 flex gap-3 animate-in shake-1 duration-500">
            <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold text-amber-900 mb-1">AI Interaction Warning detected</h4>
              <p className="text-[11px] text-amber-700 leading-relaxed whitespace-pre-line">{warnings}</p>
            </div>
          </div>
        )}

        <div className="flex gap-4">
          <button 
            type="submit" 
            disabled={loading}
            className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-2xl font-bold shadow-lg shadow-indigo-200 transition-all flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
            ) : (
              <>
                <Sparkles className="h-5 w-5" />
                Authorize & Issue Digital Script
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
