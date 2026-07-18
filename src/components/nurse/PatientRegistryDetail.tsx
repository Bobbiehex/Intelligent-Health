import React from 'react';
import { 
  User, Pill, Activity, ShieldAlert, Heart, Calendar, 
  Phone, Hash, FileText, Info, Clock, CheckCircle2
} from 'lucide-react';
import { User as UserType } from '../../types';

interface PatientRegistryDetailProps {
  patient: UserType & {
    vitalsLogs?: any[];
    patientPrescriptions?: any[];
    allergies?: any[];
    conditions?: any[];
  };
  onClose?: () => void;
}

export default function PatientRegistryDetail({ patient, onClose }: PatientRegistryDetailProps) {
  // Get latest vitals
  const latestVitals = patient.vitalsLogs?.[0];

  // Get all prescribed items across all prescriptions
  const allPrescribedItems = patient.patientPrescriptions?.flatMap((rx: any) => 
    rx.items.map((item: any) => ({
      ...item,
      prescriptionCreatedAt: rx.createdAt,
      prescriptionStatus: rx.status
    }))
  ) || [];

  return (
    <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm flex flex-col h-full overflow-y-auto space-y-6" id="patient-registry-detail">
      {/* Header */}
      <div className="flex justify-between items-start pb-4 border-b border-gray-50">
        <div>
          <span className="px-2.5 py-1 bg-rose-50 text-rose-600 border border-rose-100 rounded-lg text-[9px] font-bold uppercase tracking-wider font-mono">
            Active Clinical Record
          </span>
          <h3 className="text-base font-bold text-gray-900 mt-2">{patient.name}</h3>
          <p className="text-[10px] text-gray-400 font-mono uppercase tracking-wider mt-0.5">
            MRN: {patient.mrn || `MRN-${patient.id.slice(0, 8).toUpperCase()}`}
          </p>
        </div>
        {onClose && (
          <button 
            onClick={onClose}
            className="text-xs text-gray-400 hover:text-gray-900 font-mono px-3 py-1.5 bg-gray-50 hover:bg-gray-100 rounded-xl transition-all"
          >
            Close File
          </button>
        )}
      </div>

      {/* Patient Vitals Overview (Highlighting Blood Pressure) */}
      <div className="space-y-3">
        <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest font-mono flex items-center gap-1.5">
          <Activity className="h-3.5 w-3.5 text-rose-500" />
          Latest Vital Signs
        </h4>
        
        {latestVitals ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {/* Blood Pressure Card - Highlighted */}
            <div className="bg-rose-50/50 border border-rose-100 p-3.5 rounded-2xl flex flex-col justify-between">
              <span className="text-[9px] font-bold text-rose-500 uppercase font-mono">Blood Pressure</span>
              <div className="mt-2">
                <span className="text-lg font-black text-rose-700 font-mono">
                  {latestVitals.bloodPressure || 'N/A'}
                </span>
                <span className="text-[9px] text-rose-500 font-bold ml-1 uppercase font-mono">mmHg</span>
              </div>
            </div>

            <div className="bg-blue-50/30 border border-blue-100/50 p-3.5 rounded-2xl flex flex-col justify-between">
              <span className="text-[9px] font-bold text-blue-500 uppercase font-mono">Heart Rate</span>
              <div className="mt-2">
                <span className="text-base font-black text-blue-700 font-mono">
                  {latestVitals.heartRate ? `${latestVitals.heartRate}` : 'N/A'}
                </span>
                <span className="text-[9px] text-blue-500 font-bold ml-1 uppercase font-mono">BPM</span>
              </div>
            </div>

            <div className="bg-amber-50/40 border border-amber-100/50 p-3.5 rounded-2xl flex flex-col justify-between">
              <span className="text-[9px] font-bold text-amber-600 uppercase font-mono">Temp / SpO2</span>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-xs font-black text-amber-800 font-mono">
                  {latestVitals.temperature ? `${latestVitals.temperature}°C` : 'N/A'}
                </span>
                <span className="text-[10px] text-gray-300">|</span>
                <span className="text-xs font-black text-amber-800 font-mono">
                  {latestVitals.oxygenSaturation ? `${latestVitals.oxygenSaturation}%` : 'N/A'}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-gray-50/50 border border-gray-100 p-4 rounded-2xl text-center">
            <p className="text-[10px] text-gray-400 font-medium italic">No vitals logs recorded for this patient.</p>
          </div>
        )}
      </div>

      {/* Patient Information Grid */}
      <div className="space-y-3">
        <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest font-mono flex items-center gap-1.5">
          <Info className="h-3.5 w-3.5 text-gray-400" />
          Demographic & Clinical Details
        </h4>
        <div className="bg-gray-50/50 border border-gray-100 rounded-2xl p-4 grid grid-cols-2 gap-y-4 gap-x-6 text-xs">
          <div className="space-y-1">
            <span className="text-[9px] text-gray-400 font-bold uppercase font-mono flex items-center gap-1">
              <Calendar className="h-3 w-3" /> DOB / Age
            </span>
            <p className="font-semibold text-gray-800">
              {patient.dob ? new Date(patient.dob).toLocaleDateString() : 'N/A'}{' '}
              {patient.dob && `(${new Date().getFullYear() - new Date(patient.dob).getFullYear()} years)`}
            </p>
          </div>
          <div className="space-y-1">
            <span className="text-[9px] text-gray-400 font-bold uppercase font-mono">Gender</span>
            <p className="font-semibold text-gray-800 capitalize">{patient.gender || 'N/A'}</p>
          </div>
          <div className="space-y-1">
            <span className="text-[9px] text-gray-400 font-bold uppercase font-mono flex items-center gap-1">
              <Heart className="h-3 w-3 text-rose-500" /> Blood details
            </span>
            <p className="font-semibold text-gray-800">
              Type: {patient.bloodGroup || 'N/A'} • Genotype: {patient.genotype || 'N/A'}
            </p>
          </div>
          <div className="space-y-1">
            <span className="text-[9px] text-gray-400 font-bold uppercase font-mono flex items-center gap-1">
              <Phone className="h-3 w-3" /> Contact Number
            </span>
            <p className="font-semibold text-gray-800">{patient.phone || 'N/A'}</p>
          </div>
          <div className="col-span-2 space-y-1 border-t border-gray-100/80 pt-3">
            <span className="text-[9px] text-gray-400 font-bold uppercase font-mono flex items-center gap-1">
              <FileText className="h-3 w-3" /> Medical History Notes
            </span>
            <p className="text-[11px] font-medium leading-relaxed text-gray-600 italic">
              {patient.medicalHistoryNotes || 'No medical history or notes recorded.'}
            </p>
          </div>
        </div>
      </div>

      {/* Drugs & Prescriptions Section */}
      <div className="space-y-3 flex-1 flex flex-col">
        <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest font-mono flex items-center gap-1.5">
          <Pill className="h-3.5 w-3.5 text-emerald-500" />
          Prescribed Medications & Usage
        </h4>

        <div className="space-y-3 flex-1 overflow-y-auto max-h-[320px] pr-1">
          {allPrescribedItems.length > 0 ? (
            allPrescribedItems.map((item: any, i: number) => (
              <div 
                key={i} 
                className="bg-white border border-gray-100 hover:border-emerald-200 hover:bg-emerald-50/10 p-4 rounded-2xl shadow-sm transition-all flex flex-col gap-2.5"
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                      <Pill className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-900">{item.medicineName}</p>
                      <p className="text-[9px] text-emerald-600 font-mono uppercase tracking-wider">
                        {item.dosage} • {item.drugType || 'Tablet'}
                      </p>
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[8px] font-extrabold uppercase tracking-widest font-mono ${
                    item.prescriptionStatus === 'Dispensed' 
                      ? 'bg-emerald-50 text-emerald-700' 
                      : 'bg-amber-50 text-amber-700'
                  }`}>
                    {item.prescriptionStatus}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-gray-50 text-[10px]">
                  <div className="space-y-0.5">
                    <span className="text-[8px] font-bold text-gray-400 uppercase tracking-wider font-mono">Frequency</span>
                    <p className="font-semibold text-gray-700">{item.frequency}</p>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[8px] font-bold text-gray-400 uppercase tracking-wider font-mono">Duration</span>
                    <p className="font-semibold text-gray-700">{item.duration}</p>
                  </div>
                  <div className="col-span-2 space-y-0.5">
                    <span className="text-[8px] font-bold text-gray-400 uppercase tracking-wider font-mono">How to use (Instructions)</span>
                    <p className="font-semibold text-gray-600 bg-gray-50 p-2 rounded-lg italic">
                      {item.instructions || 'Take as directed by doctor'}
                    </p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="bg-gray-50/50 border border-gray-100 p-8 rounded-2xl text-center space-y-2">
              <Pill className="h-8 w-8 text-gray-200 mx-auto" />
              <p className="text-xs text-gray-400 font-medium italic">No active medications or prescribed drugs found.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
