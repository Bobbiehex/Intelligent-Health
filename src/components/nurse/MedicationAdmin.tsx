import React, { useState, useEffect } from 'react';
import { 
  Pill, Clock, CheckCircle2, AlertCircle, 
  Calendar, RefreshCw, Info, History, ShieldCheck
} from 'lucide-react';
import { toast } from 'sonner';

interface MedicationAdminProps {
  patient: any;
  token: string;
  onRefresh: () => void;
}

export default function MedicationAdmin({ patient, token, onRefresh }: MedicationAdminProps) {
  const [loading, setLoading] = useState(false);
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [fetching, setFetching] = useState(true);

  const fetchMeds = async () => {
    setFetching(true);
    try {
      const res = await fetch(`/api/nurse/patients/${patient.id}/medication-schedule`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setPrescriptions(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    fetchMeds();
  }, [patient.id]);

  const handleAdminister = async (item: any) => {
    setLoading(true);
    try {
      const res = await fetch('/api/nurse/medications/administer', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({
          patientId: patient.id,
          prescriptionItemId: item.id,
          dosageGiven: item.dosage,
          route: 'Oral', // Default, should ideally be in schema
          status: 'Given'
        })
      });

      if (res.ok) {
        toast.success(`Administered ${item.medicineName} successfully`);
        fetchMeds();
        onRefresh();
      } else {
        throw new Error('Failed to record administration');
      }
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm flex flex-col h-full">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
            <Pill className="h-4 w-4 text-emerald-500" />
            Medication Administration
          </h3>
          <p className="text-[10px] text-gray-400 font-mono uppercase tracking-wider mt-0.5">Track and record prescribed medication delivery</p>
        </div>
        <button onClick={fetchMeds} className="p-2 hover:bg-gray-50 rounded-xl transition-colors">
          <RefreshCw className={`h-4 w-4 text-gray-400 ${fetching ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto pr-2">
        {fetching ? (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <div className="h-8 w-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-[10px] text-gray-400 font-mono uppercase tracking-widest">Loading medication schedule...</p>
          </div>
        ) : prescriptions.length > 0 ? (
          prescriptions.map((rx: any) => (
            <div key={rx.id} className="space-y-3">
              <div className="flex items-center gap-2 px-1">
                <Calendar className="h-3 w-3 text-gray-400" />
                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Ordered: {new Date(rx.createdAt).toLocaleDateString()}</span>
              </div>
              
              {rx.items.map((item: any) => {
                const lastAdmin = item.medicationLogs?.[0];
                const isDueToday = !lastAdmin || new Date(lastAdmin.administeredAt).toDateString() !== new Date().toDateString();

                return (
                  <div key={item.id} className="bg-gray-50/50 border border-gray-100 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 group hover:border-emerald-200 hover:bg-emerald-50/20 transition-all">
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-xl ${isDueToday ? 'bg-amber-50 text-amber-500' : 'bg-emerald-100 text-emerald-600'}`}>
                        {isDueToday ? <Clock className="h-5 w-5" /> : <CheckCircle2 className="h-5 w-5" />}
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-xs font-bold text-gray-900">{item.medicineName}</h4>
                        <div className="flex items-center gap-2 text-[10px] text-gray-500 font-medium">
                          <span>{item.dosage}</span>
                          <span className="w-1 h-1 rounded-full bg-gray-300" />
                          <span>{item.frequency}</span>
                          <span className="w-1 h-1 rounded-full bg-gray-300" />
                          <span className="text-emerald-600">{item.duration}</span>
                        </div>
                        {lastAdmin && (
                          <p className="text-[9px] text-gray-400 font-mono italic">Last given: {new Date(lastAdmin.administeredAt).toLocaleString()}</p>
                        )}
                      </div>
                    </div>

                    <button 
                      onClick={() => handleAdminister(item)}
                      disabled={loading || !isDueToday}
                      className={`px-6 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${
                        isDueToday 
                          ? 'bg-gray-900 text-white hover:bg-black active:scale-95 shadow-md shadow-black/10' 
                          : 'bg-emerald-100 text-emerald-700 cursor-default font-extrabold'
                      }`}
                    >
                      {isDueToday ? 'Administer Now' : 'Completed Today'}
                    </button>
                  </div>
                );
              })}
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <ShieldCheck className="h-10 w-10 text-gray-100 mb-2" />
            <p className="text-xs text-gray-400 font-medium italic">No active prescriptions for this patient.</p>
          </div>
        )}
      </div>

      <div className="mt-6 p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-start gap-3">
        <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
        <p className="text-[10px] leading-relaxed text-emerald-800 font-medium italic">
          "I have verified the 5 rights of medication administration: Right Patient, Right Drug, Right Dose, Right Route, Right Time."
        </p>
      </div>
    </div>
  );
}
