import React, { useState, useEffect } from 'react';
import { 
  Calendar, Stethoscope, Pill, Beaker, 
  Camera, FileText, ChevronDown, ChevronUp, Clock 
} from 'lucide-react';

interface TimelineItem {
  type: string;
  date: string;
  data: any;
}

interface PatientTimelineProps {
  patientId: string;
  token: string;
}

export default function PatientTimeline({ patientId, token }: PatientTimelineProps) {
  const [timeline, setTimeline] = useState<TimelineItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    fetchTimeline();
  }, [patientId]);

  const fetchTimeline = async () => {
    try {
      const res = await fetch(`/api/doctor/patients/${patientId}/timeline`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setTimeline(data);
    } catch (err: any) {
      console.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'Appointment': return <Calendar className="h-4 w-4" />;
      case 'Consultation': return <Stethoscope className="h-4 w-4" />;
      case 'Prescription': return <Pill className="h-4 w-4" />;
      case 'Lab': return <Beaker className="h-4 w-4" />;
      case 'Radiology': return <Camera className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const getColor = (type: string) => {
    switch (type) {
      case 'Appointment': return 'bg-blue-500';
      case 'Consultation': return 'bg-indigo-500';
      case 'Prescription': return 'bg-rose-500';
      case 'Lab': return 'bg-emerald-500';
      case 'Radiology': return 'bg-amber-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 overflow-hidden">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-lg font-bold text-gray-900">Patient Medical Journey</h2>
        <div className="flex gap-2">
          {['All', 'Clinical', 'Tests', 'Meds'].map(f => (
            <button key={f} className="px-3 py-1 rounded-lg text-[10px] font-bold bg-gray-50 text-gray-400 hover:bg-gray-100 transition-all uppercase tracking-wider">{f}</button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center text-gray-300">
          <Clock className="h-10 w-10 animate-spin mx-auto mb-4 opacity-20" />
          <p className="text-sm">Synthesizing timeline records...</p>
        </div>
      ) : (
        <div className="relative">
          {/* Vertical Line */}
          <div className="absolute left-6 top-0 bottom-0 w-px bg-gray-100" />

          <div className="space-y-8">
            {timeline.map((item, idx) => (
              <div key={idx} className="relative pl-12">
                {/* Dot */}
                <div className={`absolute left-4 top-1 h-4 w-4 rounded-full border-4 border-white shadow-sm z-10 ${getColor(item.type)}`} />
                
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-gray-400 font-mono uppercase tracking-widest">
                      {new Date(item.date).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                    <span className={`text-[9px] font-bold text-white px-2 py-0.5 rounded-full uppercase ${getColor(item.type)}`}>
                      {item.type}
                    </span>
                  </div>
                  
                  <div 
                    onClick={() => setExpandedId(expandedId === `${idx}` ? null : `${idx}`)}
                    className="bg-gray-50/50 hover:bg-gray-50 border border-gray-100 p-4 rounded-2xl cursor-pointer transition-all group"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-sm font-bold text-gray-800">
                          {item.type === 'Appointment' ? item.data.reason : 
                           item.type === 'Consultation' ? (item.data.finalDiagnosis || 'Ongoing Consultation') :
                           item.type === 'Prescription' ? `${item.data.items.length} Medications Prescribed` :
                           item.type === 'Lab' ? item.data.testName :
                           item.type === 'Radiology' ? item.data.studyType : 'Medical Event'}
                        </h4>
                        <p className="text-xs text-gray-500 mt-1 line-clamp-1 group-hover:line-clamp-none transition-all">
                          {item.type === 'Consultation' ? item.data.chiefComplaint : 
                           item.type === 'Lab' ? `Ordered by Dr. ${item.data.orderedBy}` : 
                           item.type === 'Diagnosis' ? item.data.primaryDiagnosis : ''}
                        </p>
                      </div>
                      {expandedId === `${idx}` ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
                    </div>

                    {expandedId === `${idx}` && (
                      <div className="mt-4 pt-4 border-t border-gray-100 animate-in fade-in slide-in-from-top-2">
                        <div className="grid grid-cols-1 gap-4 text-xs text-gray-600">
                          {item.type === 'Prescription' && (
                            <div className="space-y-2">
                              {item.data.items.map((m: any, i: number) => (
                                <div key={i} className="flex justify-between p-2 bg-white rounded-lg border border-gray-100">
                                  <span className="font-bold text-gray-800">{m.medicineName}</span>
                                  <span className="text-gray-400">{m.dosage} • {m.frequency}</span>
                                </div>
                              ))}
                            </div>
                          )}
                          {item.type === 'Consultation' && (
                            <div className="space-y-3">
                              <p><span className="font-bold text-gray-800 uppercase text-[10px] block mb-1">Chief Complaint:</span> {item.data.chiefComplaint}</p>
                              <p><span className="font-bold text-gray-800 uppercase text-[10px] block mb-1">Assessment:</span> {item.data.notes}</p>
                              <p><span className="font-bold text-gray-800 uppercase text-[10px] block mb-1">Plan:</span> {item.data.treatmentPlan}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
