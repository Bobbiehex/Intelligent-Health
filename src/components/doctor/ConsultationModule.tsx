import React, { useState, useEffect } from 'react';
import { 
  Play, StopCircle, Save, FileText, Activity, 
  Sparkles, Stethoscope, Thermometer, User, Clock, 
  ChevronRight, AlertCircle, CheckCircle2, History,
  Phone, PhoneOff, Video, VideoOff, Mic, MicOff,
  UserCheck, Send, Clipboard, Heart
} from 'lucide-react';
import { User as Patient, Consultation, AIRecommendation } from '../../types';
import AIClinicalSupport from './AIClinicalSupport';
import VitalsManagement from './VitalsManagement';
import { toast } from 'sonner';

interface ConsultationModuleProps {
  patient: Patient;
  token: string;
  onConsultationComplete: () => void;
}

export default function ConsultationModule({ patient, token, onConsultationComplete }: ConsultationModuleProps) {
  const [activeConsultation, setActiveConsultation] = useState<Consultation | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Interactive Call Simulation States
  const [callStatus, setCallStatus] = useState<'idle' | 'calling' | 'connected'>('idle');
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);

  // Nurse communication
  const [nurseNote, setNurseNote] = useState('');
  const [sendingNurseNote, setSendingNurseNote] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    chiefComplaint: '',
    symptoms: '',
    physicalExamination: '',
    provisionalDiagnosis: '',
    finalDiagnosis: '',
    treatmentPlan: '',
    followUpInstructions: '',
    notes: ''
  });

  useEffect(() => {
    const restoreActive = async () => {
      try {
        const res = await fetch('/api/doctor/consultations/active', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          if (data && data.patientId === patient.id) {
            setActiveConsultation(data);
            setFormData({
              chiefComplaint: data.chiefComplaint || '',
              symptoms: data.symptoms || '',
              physicalExamination: data.physicalExamination || '',
              provisionalDiagnosis: data.provisionalDiagnosis || '',
              finalDiagnosis: data.finalDiagnosis || '',
              treatmentPlan: data.treatmentPlan || '',
              followUpInstructions: data.followUpInstructions || '',
              notes: data.notes || ''
            });
          }
        }
      } catch (err) {
        console.error('Failed to restore active consultation:', err);
      }
    };
    restoreActive();
  }, [patient.id, token]);

  const startConsultation = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/doctor/consultations/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ 
          patientId: patient.id, 
          appointmentId: latestAppointment?.id,
          department: 'General Practice' 
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setActiveConsultation(data);
      toast.success('Consultation encounter started');
    } catch (err: any) {
      toast.error(err.message || 'Failed to start consultation');
    } finally {
      setLoading(false);
    }
  };

  const endConsultation = async () => {
    if (!activeConsultation) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/doctor/consultations/${activeConsultation.id}/end`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(formData)
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error);
      }
      setActiveConsultation(null);
      toast.success('Consultation ended and medical record updated');
      onConsultationComplete();
    } catch (err: any) {
      toast.error(err.message || 'Failed to end consultation');
    } finally {
      setSaving(false);
    }
  };
  
  const saveProgress = async () => {
    if (!activeConsultation) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/doctor/consultations/${activeConsultation.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(formData)
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error);
      }
      toast.success('Encounter progress saved');
    } catch (err: any) {
      toast.error(err.message || 'Failed to save progress');
    } finally {
      setSaving(false);
    }
  };

  const handleForwardToNurse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nurseNote.trim()) return;

    setSendingNurseNote(true);
    try {
      const res = await fetch('/api/doctor/nurse-instructions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          patientId: patient.id,
          note: nurseNote
        })
      });

      if (!res.ok) throw new Error('Failed to send care details to nurse');
      
      toast.success('Patient instructions forwarded to Ward Nurses successfully');
      setNurseNote('');
    } catch (err: any) {
      toast.error(err.message || 'Failed to forward details to nurse');
    } finally {
      setSendingNurseNote(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const startCall = () => {
    setCallStatus('calling');
    toast.info('Initiating secure telehealth call...', { description: 'Ringing receptionist or patient...' });
    
    // Simulate patient or receptionist accepting the call after 2.5 seconds
    setTimeout(() => {
      setCallStatus('connected');
      toast.success('Call accepted', { description: 'The patient has successfully joined the secure session.' });
    }, 2500);
  };

  const endCall = () => {
    setCallStatus('idle');
    toast.info('Call disconnected');
  };

  const latestAppointment = patient.patientAppointments && patient.patientAppointments[0];
  const appointmentDateFormatted = latestAppointment
    ? new Date(latestAppointment.dateTime).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
    : null;
  const appointmentTimeFormatted = latestAppointment
    ? new Date(latestAppointment.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : null;

  if (!activeConsultation) {
    return (
      <div className="space-y-8 max-w-4xl mx-auto">
        <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm grid grid-cols-1 md:grid-cols-12 gap-8">
          
          {/* Patient Overview Section */}
          <div className="md:col-span-7 space-y-6">
            <div className="flex items-start gap-4">
              <div className="h-16 w-16 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 font-bold text-2xl shadow-inner">
                {patient.name.charAt(0)}
              </div>
              <div>
                <span className="bg-indigo-100 text-indigo-800 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider font-mono">
                  Selected Patient
                </span>
                <h3 className="text-xl font-display font-bold text-gray-900 mt-1">{patient.name}</h3>
                <p className="text-xs text-gray-400 mt-0.5 font-mono">MRN: {patient.mrn || 'N/A'} • ID: {patient.patientId || 'Pending'}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-50">
              <div className="p-4 bg-gray-50/60 rounded-2xl">
                <span className="text-[10px] font-bold text-gray-400 block uppercase tracking-wider mb-1">Blood Group</span>
                <span className="text-sm font-bold text-rose-600">{patient.bloodGroup || 'Not Checked'}</span>
              </div>
              <div className="p-4 bg-gray-50/60 rounded-2xl">
                <span className="text-[10px] font-bold text-gray-400 block uppercase tracking-wider mb-1">Genotype</span>
                <span className="text-sm font-bold text-indigo-600">{patient.genotype || 'Not Checked'}</span>
              </div>
            </div>

            {/* Appointment Schedule Info */}
            <div className="p-5 bg-indigo-50/40 border border-indigo-100/30 rounded-2xl space-y-3">
              <h4 className="text-xs font-bold text-indigo-900 uppercase tracking-widest flex items-center gap-2 font-mono">
                <Clock className="h-4 w-4" />
                <span>Scheduled Appointment Details</span>
              </h4>
              {latestAppointment ? (
                <div className="space-y-1">
                  <p className="text-xs font-bold text-gray-800">
                    {appointmentDateFormatted} at {appointmentTimeFormatted}
                  </p>
                  <p className="text-xs text-gray-500 italic">
                    Reason: {latestAppointment.reason || 'General clinical review'}
                  </p>
                </div>
              ) : (
                <p className="text-xs text-indigo-600 italic">
                  No active scheduled appointments recorded. This encounter is a direct walk-in.
                </p>
              )}
            </div>
          </div>

          {/* Interactive Telehealth/Teleconsult Panel */}
          <div className="md:col-span-5 bg-gray-900 rounded-[2rem] p-6 text-white flex flex-col justify-between min-h-[300px] shadow-lg relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/80 pointer-events-none z-10" />
            
            {/* Call State Mockups */}
            {callStatus === 'idle' && (
              <div className="my-auto text-center space-y-4 z-20">
                <div className="h-14 w-14 bg-white/10 rounded-full flex items-center justify-center mx-auto animate-pulse">
                  <Video className="h-6 w-6 text-indigo-400" />
                </div>
                <div>
                  <h4 className="font-bold text-sm">Virtual Encounter Call</h4>
                  <p className="text-[10px] text-gray-400 mt-1 max-w-[200px] mx-auto leading-relaxed">
                    Initiate a live virtual consultation with the patient or their care team.
                  </p>
                </div>
                <button 
                  onClick={startCall}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-6 py-2.5 rounded-xl transition-all shadow-md mx-auto flex items-center gap-2"
                >
                  <Phone className="h-3.5 w-3.5" />
                  Initiate Tele-Call
                </button>
              </div>
            )}

            {callStatus === 'calling' && (
              <div className="my-auto text-center space-y-4 z-20">
                <div className="relative inline-block">
                  <div className="absolute inset-0 rounded-full bg-indigo-500 animate-ping opacity-30" />
                  <div className="h-16 w-16 bg-indigo-600 rounded-full flex items-center justify-center mx-auto relative">
                    <Phone className="h-6 w-6 text-white animate-bounce" />
                  </div>
                </div>
                <div>
                  <h4 className="font-bold text-sm animate-pulse">Calling Consultation Desk...</h4>
                  <p className="text-[10px] text-gray-400 mt-1">Waiting for patient or receptionist to accept</p>
                </div>
                <button 
                  onClick={endCall}
                  className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs px-6 py-2.5 rounded-xl transition-all shadow-md mx-auto"
                >
                  Cancel Ring
                </button>
              </div>
            )}

            {callStatus === 'connected' && (
              <div className="h-full flex flex-col justify-between z-20">
                {/* Simulated video frame */}
                <div className="flex justify-between items-start">
                  <div className="bg-black/60 px-2.5 py-1 rounded-lg text-[9px] font-mono uppercase tracking-widest text-emerald-400 flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
                    <span>Live Call Accepted</span>
                  </div>
                  <div className="h-16 w-12 bg-white/20 rounded-lg border border-white/10 overflow-hidden shadow-inner">
                    <div className="h-full w-full bg-slate-800 flex items-center justify-center text-[10px] font-bold text-white">
                      Doc
                    </div>
                  </div>
                </div>

                <div className="my-auto py-4 text-center">
                  <div className="h-14 w-14 bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 rounded-full flex items-center justify-center mx-auto mb-2">
                    <UserCheck className="h-6 w-6" />
                  </div>
                  <h5 className="font-bold text-xs text-gray-200">Patient Feed Active</h5>
                  <p className="text-[9px] text-emerald-400 font-mono mt-0.5">Receptionist / Patient Connected</p>
                </div>

                {/* Call Controls */}
                <div className="flex justify-center gap-3">
                  <button 
                    onClick={() => setIsMuted(!isMuted)}
                    className={`p-2.5 rounded-xl transition-all ${isMuted ? 'bg-rose-600 text-white' : 'bg-white/10 text-white hover:bg-white/20'}`}
                  >
                    {isMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                  </button>
                  <button 
                    onClick={() => setIsVideoOff(!isVideoOff)}
                    className={`p-2.5 rounded-xl transition-all ${isVideoOff ? 'bg-rose-600 text-white' : 'bg-white/10 text-white hover:bg-white/20'}`}
                  >
                    {isVideoOff ? <VideoOff className="h-4 w-4" /> : <Video className="h-4 w-4" />}
                  </button>
                  <button 
                    onClick={endCall}
                    className="p-2.5 rounded-xl bg-rose-600 text-white hover:bg-rose-700 transition-all"
                  >
                    <PhoneOff className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}

          </div>

        </div>

        {/* Start Action Card */}
        <div className="flex flex-col items-center justify-center p-12 bg-white rounded-3xl border border-gray-100 shadow-sm">
          <div className="h-20 w-20 bg-indigo-50 rounded-full flex items-center justify-center mb-6">
            <Stethoscope className="h-10 w-10 text-indigo-600" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">Initialize Physical Encounter File</h3>
          <p className="text-gray-400 text-sm mb-8 text-center max-w-md">
            Begin the formal clinical consultation encounter for {patient.name}. The system will track encounter duration and activate clinical support tools.
          </p>
          <button 
            onClick={startConsultation}
            disabled={loading}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3.5 rounded-2xl font-bold shadow-lg shadow-indigo-100 transition-all flex items-center gap-2 text-sm"
          >
            {loading ? (
              <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
            ) : (
              <>
                <Play className="h-4 w-4 fill-current" />
                <span>Start Consultation Encounter</span>
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Consultation Forms */}
      <div className="lg:col-span-8 space-y-6">
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-50 flex justify-between items-center bg-gray-50/30">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-bold text-gray-900">Encounter Records: {patient.name}</h2>
                <div className="flex items-center gap-2 text-[10px] text-gray-400 font-mono">
                  <span className="bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded uppercase font-bold tracking-wider">LIVE RECORDING</span>
                  <span>ID: {activeConsultation.id.slice(0, 8)}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button 
                onClick={saveProgress}
                disabled={saving}
                className="bg-indigo-50 hover:bg-indigo-100 text-indigo-600 px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2"
              >
                <Save className="h-4 w-4" />
                <span>Save Progress</span>
              </button>
              <button 
                onClick={endConsultation}
                disabled={saving}
                className="bg-rose-50 hover:bg-rose-100 text-rose-600 px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2"
              >
                {saving ? 'Ending...' : (
                  <>
                    <StopCircle className="h-4 w-4" />
                    End Encounter
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField 
                label="Chief Complaint" 
                name="chiefComplaint" 
                value={formData.chiefComplaint} 
                onChange={handleInputChange}
                placeholder="What is the primary reason for the visit?"
              />
              <FormField 
                label="Symptoms" 
                name="symptoms" 
                value={formData.symptoms} 
                onChange={handleInputChange}
                placeholder="List presenting symptoms..."
              />
            </div>

            <FormField 
              label="Physical Examination Findings" 
              name="physicalExamination" 
              value={formData.physicalExamination} 
              onChange={handleInputChange}
              rows={3}
              placeholder="Record findings from physical exam..."
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField 
                label="Provisional Diagnosis" 
                name="provisionalDiagnosis" 
                value={formData.provisionalDiagnosis} 
                onChange={handleInputChange}
                placeholder="Preliminary assessment..."
              />
              <FormField 
                label="Treatment Plan" 
                name="treatmentPlan" 
                value={formData.treatmentPlan} 
                onChange={handleInputChange}
                placeholder="Proposed course of action..."
              />
            </div>

            <FormField 
              label="Consultation Notes (Auto-save enabled)" 
              name="notes" 
              value={formData.notes} 
              onChange={handleInputChange}
              rows={4}
              placeholder="General clinical observations..."
            />
          </div>
        </div>

        {/* Vitals in Consultation Context */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
          <h3 className="text-sm font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Activity className="h-4 w-4 text-emerald-500" />
            Vitals History & Capture
          </h3>
          <VitalsManagement patientId={patient.id} token={token} />
        </div>
      </div>

      {/* AI Assistant & Nurse Communication Sidebar */}
      <div className="lg:col-span-4 space-y-6">
        
        {/* Forward to Nurse Care Desk */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 space-y-4">
          <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
            <Clipboard className="h-4 w-4 text-indigo-600" />
            <span>Nurse Coordination Ward Notes</span>
          </h3>
          <p className="text-[11px] text-gray-400 leading-relaxed">
            Forward real-time instructions, medication administration guidelines, or admission detail notes straight to the floor nurses.
          </p>
          <form onSubmit={handleForwardToNurse} className="space-y-3">
            <textarea
              value={nurseNote}
              onChange={(e) => setNurseNote(e.target.value)}
              placeholder="Write ward instructions (e.g. Please check BP hourly, Patient has O+ blood, prepare bed 4 in male ward...)"
              rows={4}
              className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-3 text-xs focus:ring-2 focus:ring-indigo-500/10 focus:bg-white outline-none transition-all placeholder:text-gray-300"
            />
            <button
              type="submit"
              disabled={sendingNurseNote || !nurseNote.trim()}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-3 rounded-2xl shadow-md flex items-center justify-center gap-2 disabled:opacity-40 transition-all"
            >
              {sendingNurseNote ? (
                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
              ) : (
                <>
                  <Send className="h-3.5 w-3.5" />
                  <span>Forward Details to Nurse</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* AI Support */}
        <div className="sticky top-8">
          <AIClinicalSupport 
            consultationId={activeConsultation.id} 
            patientContext={`Patient: ${patient.name}. Complaint: ${formData.chiefComplaint}. Symptoms: ${formData.symptoms}.`}
            token={token} 
          />
        </div>
      </div>
    </div>
  );
}

function FormField({ label, name, value, onChange, placeholder, rows = 1 }: any) {
  return (
    <div className="space-y-1.5">
      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider font-mono">{label}</label>
      {rows > 1 ? (
        <textarea
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          rows={rows}
          className="w-full bg-gray-50/50 border border-gray-100 rounded-2xl p-3 text-xs focus:ring-2 focus:ring-indigo-500/10 focus:bg-white transition-all placeholder:text-gray-300"
        />
      ) : (
        <input
          type="text"
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className="w-full bg-gray-50/50 border border-gray-100 rounded-2xl p-3 text-xs focus:ring-2 focus:ring-indigo-500/10 focus:bg-white transition-all placeholder:text-gray-300"
        />
      )}
    </div>
  );
}
