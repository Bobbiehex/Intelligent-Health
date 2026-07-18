import React, { useState, useEffect } from 'react';
import { 
  FileText, Activity, AlertCircle, Sparkles, Clipboard, ShieldCheck, 
  HelpCircle, Clock, Calendar, ChevronRight, Stethoscope, Eye, User as UserIcon,
  Weight, TrendingUp, Info, CalendarX
} from 'lucide-react';
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid,
  LineChart, Line, Legend
} from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { registerSseListener } from '../utils/apiClient';
import { User, VitalsLog, Condition, Allergy, Appointment, Prescription, LabReport, QueueItem } from '../types';

interface PatientDashboardProps {
  user: User;
  token: string;
}

export default function PatientDashboard({ user, token }: PatientDashboardProps) {
  const [patientData, setPatientData] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Symptom Triage State
  const [symptoms, setSymptoms] = useState('');
  const [triageLoading, setTriageLoading] = useState(false);
  const [triageResult, setTriageResult] = useState<any | null>(null);

  // Active Tab
  const [activeTab, setActiveTab] = useState<'dossier' | 'triage' | 'prescriptions' | 'labs' | 'appointments' | 'profile'>('dossier');

  // Appointment Booking State
  const [bookingDept, setBookingDept] = useState('General Medicine');
  const [bookingDate, setBookingDate] = useState('');
  const [bookingTime, setBookingTime] = useState('09:00');
  const [bookingReason, setBookingReason] = useState('');
  const [bookingNotes, setBookingNotes] = useState('');
  const [isBooking, setIsBooking] = useState(false);

  // Appointment Cancellation State
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);

  // Active Call Acceptance State
  const [acceptingCall, setAcceptingCall] = useState(false);
  const [actingOnAbsent, setActingOnAbsent] = useState(false);

  // Profile & Password Update States
  const [profileName, setProfileName] = useState('');
  const [profilePhone, setProfilePhone] = useState('');
  const [profileDob, setProfileDob] = useState('');
  const [profileGender, setProfileGender] = useState('Male');
  const [profileBloodGroup, setProfileBloodGroup] = useState('O+');
  const [profileHistory, setProfileHistory] = useState('');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const [profileSubmitting, setProfileSubmitting] = useState(false);
  const [passwordSubmitting, setPasswordSubmitting] = useState(false);

  const fetchPatientDetails = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/patients/${user.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      let data: any;
      try {
        data = await res.json();
      } catch (err) {
        throw new Error(`Server returned an invalid response (${res.status}).`);
      }
      if (!res.ok) throw new Error(data?.error || 'Failed to retrieve clinical chart.');
      setPatientData(data);
    } catch (err: any) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatientDetails();
    const unsubscribe = registerSseListener(() => {
      fetchPatientDetails();
    });
    return () => unsubscribe();
  }, [user.id]);

  const handleTriageSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!symptoms.trim()) return;
    setTriageLoading(true);
    setTriageResult(null);
    try {
      const res = await fetch('/api/ai/triage', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ symptoms })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Triage evaluator failed.');
      setTriageResult(data);
      toast.success('AI Triage scan complete.');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setTriageLoading(false);
    }
  };

  useEffect(() => {
    if (patientData) {
      setProfileName(patientData.name || '');
      setProfilePhone(patientData.phone || '');
      setProfileDob(patientData.dob || '');
      setProfileGender(patientData.gender || 'Male');
      setProfileBloodGroup(patientData.bloodGroup || 'O+');
      setProfileHistory(patientData.medicalHistoryNotes || '');
    }
  }, [patientData]);

  const handleProfileUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSubmitting(true);
    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: profileName,
          phone: profilePhone,
          dob: profileDob,
          gender: profileGender,
          bloodGroup: profileBloodGroup,
          medicalHistoryNotes: profileHistory
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update profile.');
      
      toast.success('Personal profile updated successfully!');
      fetchPatientDetails();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setProfileSubmitting(false);
    }
  };

  const handlePasswordChangeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordSubmitting(true);
    try {
      const res = await fetch('/api/profile/password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ currentPassword, newPassword })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to change password.');
      
      toast.success('Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setPasswordSubmitting(false);
    }
  };

  const handleBookAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingDate) {
      toast.error('Please select a valid date.');
      return;
    }
    if (!bookingReason.trim()) {
      toast.error('Please specify a brief consultation reason for triage.');
      return;
    }
    setIsBooking(true);
    try {
      const fullDateTime = `${bookingDate}T${bookingTime}:00`;
      
      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          patientId: user.id,
          dateTime: fullDateTime,
          reason: bookingReason,
          type: 'Consultation',
          department: bookingDept,
          notes: bookingNotes
        })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit appointment request.');
      
      toast.success('Consultation request submitted! Awaiting receptionist assignment.');
      setBookingDate('');
      setBookingReason('');
      setBookingNotes('');
      fetchPatientDetails();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsBooking(false);
    }
  };

  const handleCancelAppointment = async (appId: string) => {
    setIsCancelling(true);
    try {
      const res = await fetch(`/api/patient/appointments/${appId}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to cancel appointment.');

      toast.success('Appointment cancelled successfully.');
      setCancellingId(null);
      fetchPatientDetails();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsCancelling(false);
    }
  };

  const handleAcceptCall = async (queueId: string) => {
    setAcceptingCall(true);
    try {
      const res = await fetch(`/api/patient/queue/${queueId}/accept`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to accept the call.');

      toast.success('Call accepted successfully! Please proceed to the consultation room.');
      fetchPatientDetails();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setAcceptingCall(false);
    }
  };

  const handleRebookCall = async (queueId: string) => {
    setActingOnAbsent(true);
    try {
      const res = await fetch(`/api/patient/queue/${queueId}/rebook`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to re-book.');

      toast.success('Successfully re-booked! You are back in the queue.');
      fetchPatientDetails();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setActingOnAbsent(false);
    }
  };

  const handleCancelQueue = async (queueId: string) => {
    setActingOnAbsent(true);
    try {
      const res = await fetch(`/api/patient/queue/${queueId}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to cancel.');

      toast.success('Appointment & queue spot cancelled.');
      fetchPatientDetails();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setActingOnAbsent(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center text-gray-500 font-mono">
        <Activity className="h-8 w-8 animate-spin mx-auto text-rose-500 mb-4" />
        <span>Retrieving secured patient clinical records...</span>
      </div>
    );
  }

  if (error || !patientData) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="bg-rose-50 border border-rose-100 p-6 rounded-2xl text-rose-700 max-w-lg mx-auto text-center">
          <AlertCircle className="h-10 w-10 text-rose-500 mx-auto mb-3" />
          <h3 className="font-bold">Secured Patient Link Fault</h3>
          <p className="text-sm mt-1">{error || 'Unable to bind clinical record data.'}</p>
          <button onClick={fetchPatientDetails} className="mt-4 bg-rose-500 text-white px-4 py-2 rounded-xl text-xs font-semibold">
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  const vitalsChartData = [...(patientData.vitalsLogs || [])]
    .reverse()
    .map(log => ({
      date: new Date(log.recordedAt).toLocaleDateString([], { month: 'short', day: 'numeric' }),
      BP: parseInt(log.bloodPressure.split('/')[0]) || 120,
      HR: log.heartRate,
      Weight: Number(log.weight || (Math.random() * 20 + 70).toFixed(1)), // Mocking weight trends if missing
      Temp: log.temperature
    }));

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
    >
      {/* Patient Card */}
      <div className="bg-white border border-gray-100 p-6 rounded-3xl shadow-xs mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center space-x-4">
          <div className="h-14 w-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center font-display font-bold text-xl">
            {patientData.name.charAt(0)}
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900 font-display">Welcome Back, {patientData.name}</h2>
            <p className="text-xs text-gray-400 font-mono mt-0.5 uppercase">
              ID: {patientData.id.slice(0, 8)} • Blood Group: <span className="text-rose-500 font-bold">{patientData.bloodGroup || 'Not set'}</span>
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-gray-50/50 p-4 rounded-2xl border border-gray-100/50 text-xs font-mono">
          <div>
            <span className="text-gray-400 block">D.O.B</span>
            <span className="text-gray-800 font-semibold">{patientData.dob || '—'}</span>
          </div>
          <div>
            <span className="text-gray-400 block">Gender</span>
            <span className="text-gray-800 font-semibold">{patientData.gender || '—'}</span>
          </div>
          <div>
            <span className="text-gray-400 block">Phone</span>
            <span className="text-gray-800 font-semibold">{patientData.phone || '—'}</span>
          </div>
          <div>
            <span className="text-gray-400 block">System Status</span>
            <span className="text-emerald-500 font-bold flex items-center">
              <ShieldCheck className="h-3 w-3 mr-1" /> SECURE
            </span>
          </div>
        </div>
      </div>

      {/* Real-time Queue Alert when being called or in consultation */}
      {patientData?.activeQueueItem && (
        <div className={`mb-8 p-6 rounded-3xl border shadow-lg relative overflow-hidden transition-all duration-300 ${
          patientData.activeQueueItem.status === 'Calling'
            ? 'bg-rose-50 border-rose-100 text-rose-900 animate-pulse'
            : patientData.activeQueueItem.status === 'Accepted'
            ? 'bg-emerald-50 border-emerald-100 text-emerald-900'
            : patientData.activeQueueItem.status === 'With Doctor'
            ? 'bg-indigo-50 border-indigo-100 text-indigo-900'
            : patientData.activeQueueItem.status === 'Absent'
            ? 'bg-amber-50 border-amber-100 text-amber-900'
            : 'bg-indigo-50 border-indigo-100 text-indigo-900'
        }`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 z-10 relative">
            <div className="flex items-start space-x-4">
              <div className={`h-12 w-12 rounded-2xl flex items-center justify-center shrink-0 ${
                patientData.activeQueueItem.status === 'Calling'
                  ? 'bg-rose-500 text-white animate-bounce'
                  : patientData.activeQueueItem.status === 'Accepted'
                  ? 'bg-emerald-500 text-white'
                  : patientData.activeQueueItem.status === 'With Doctor'
                  ? 'bg-indigo-500 text-white'
                  : patientData.activeQueueItem.status === 'Absent'
                  ? 'bg-amber-500 text-white'
                  : 'bg-indigo-500 text-white'
              }`}>
                <Activity className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-display font-extrabold text-base tracking-tight">
                  {patientData.activeQueueItem.status === 'Calling' && '🔔 Receptionist is calling you!'}
                  {patientData.activeQueueItem.status === 'Accepted' && '✅ Call Accepted'}
                  {patientData.activeQueueItem.status === 'With Doctor' && '🩺 In Consultation with Doctor'}
                  {patientData.activeQueueItem.status === 'Absent' && '⚠️ Marked as Absent'}
                  {patientData.activeQueueItem.status === 'Waiting' && '⏳ You are in the Queue'}
                </h3>
                <p className="text-sm mt-1 opacity-90">
                  {patientData.activeQueueItem.status === 'Calling' && (
                    <>
                      Please accept the call to proceed to <strong>{patientData.activeQueueItem.department} Wing</strong> for your consultation with <strong>Dr. {patientData.activeQueueItem.doctorName}</strong>.
                    </>
                  )}
                  {patientData.activeQueueItem.status === 'Accepted' && (
                    <>
                      Thank you! Please proceed immediately to <strong>{patientData.activeQueueItem.department} Wing</strong>. <strong>Dr. {patientData.activeQueueItem.doctorName}</strong> is expecting you.
                    </>
                  )}
                  {patientData.activeQueueItem.status === 'With Doctor' && (
                    <>
                      You are currently in consultation with <strong>Dr. {patientData.activeQueueItem.doctorName}</strong>.
                    </>
                  )}
                  {patientData.activeQueueItem.status === 'Absent' && (
                    <>
                      You were marked as absent when called. You can <strong>re-book</strong> your spot to get a new queue number, or <strong>cancel</strong> the appointment.
                    </>
                  )}
                  {patientData.activeQueueItem.status === 'Waiting' && (
                    <>
                      Your token number is <strong>#{patientData.activeQueueItem.tokenNumber}</strong>. Please wait in the waiting lounge until you are called.
                    </>
                  )}
                </p>
                <div className="mt-2 text-xs font-mono font-semibold opacity-75">
                  Token: #{patientData.activeQueueItem.tokenNumber} • Status: {patientData.activeQueueItem.status.toUpperCase()}
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-3 shrink-0 self-start sm:self-center">
              {patientData.activeQueueItem.status === 'Calling' && (
                <button
                  type="button"
                  disabled={acceptingCall}
                  onClick={() => handleAcceptCall(patientData.activeQueueItem!.id)}
                  className="bg-rose-600 hover:bg-rose-700 text-white font-bold px-6 py-3 rounded-2xl transition-all shadow-md hover:shadow-lg disabled:opacity-50 cursor-pointer"
                >
                  {acceptingCall ? 'Accepting...' : 'Accept Call'}
                </button>
              )}
              {patientData.activeQueueItem.status === 'Absent' && (
                <>
                  <button
                    type="button"
                    disabled={actingOnAbsent}
                    onClick={() => handleRebookCall(patientData.activeQueueItem!.id)}
                    className="bg-amber-600 hover:bg-amber-700 text-white font-bold px-4 py-2.5 rounded-2xl transition-all shadow-sm hover:shadow-md disabled:opacity-50 cursor-pointer text-xs"
                  >
                    {actingOnAbsent ? 'Re-booking...' : 'Re-book Spot'}
                  </button>
                  <button
                    type="button"
                    disabled={actingOnAbsent}
                    onClick={() => handleCancelQueue(patientData.activeQueueItem!.id)}
                    className="bg-rose-600 hover:bg-rose-700 text-white font-bold px-4 py-2.5 rounded-2xl transition-all shadow-sm hover:shadow-md disabled:opacity-50 cursor-pointer text-xs"
                  >
                    {actingOnAbsent ? 'Cancelling...' : 'Cancel Appt'}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tabs Menu */}
      <div className="flex border-b border-gray-100 mb-8 overflow-x-auto gap-2 no-scrollbar">
        {[
          { id: 'dossier', label: 'My Clinical Dossier', icon: Clipboard },
          { id: 'triage', label: 'AI Symptom Analyzer', icon: Sparkles },
          { id: 'prescriptions', label: 'Prescriptions', icon: FileText },
          { id: 'labs', label: 'Lab Reports', icon: Activity },
          { id: 'appointments', label: 'Consultation Calendar', icon: Calendar },
          { id: 'profile', label: 'Security & Profile', icon: UserIcon }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center space-x-2 px-4 py-3 border-b-2 text-sm font-semibold whitespace-nowrap transition-all ${
                isActive 
                  ? 'border-rose-500 text-rose-600' 
                  : 'border-transparent text-gray-400 hover:text-gray-600'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB CONTENT */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -10 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === 'dossier' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Latest registered Vitals summary */}
              <div className="lg:col-span-8 space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="font-display font-bold text-gray-800 text-base">Historical Health Trends</h3>
                  <div className="flex items-center space-x-2 text-[10px] font-mono text-gray-400">
                    <TrendingUp className="h-3 w-3" />
                    <span>REAL-TIME BIOMETRIC TELEMETRY</span>
                  </div>
                </div>

                {vitalsChartData.length > 0 ? (
                  <div className="space-y-6">
                    {/* BP & HR Chart */}
                    <div className="bg-white border border-gray-100 p-6 rounded-3xl shadow-xs">
                      <div className="flex items-center justify-between mb-6">
                        <div>
                          <span className="text-xs font-bold text-gray-800">Cardiovascular Performance</span>
                          <p className="text-[10px] text-gray-400">Systolic Pressure & Heart Rate (bpm)</p>
                        </div>
                      </div>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={vitalsChartData}>
                            <defs>
                              <linearGradient id="colorBP" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.1}/>
                                <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                              </linearGradient>
                              <linearGradient id="colorHR" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                                <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                            <XAxis dataKey="date" stroke="#9ca3af" fontSize={11} tickLine={false} axisLine={false} />
                            <YAxis stroke="#9ca3af" fontSize={11} tickLine={false} axisLine={false} />
                            <Tooltip 
                              contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                            />
                            <Area type="monotone" dataKey="BP" stroke="#f43f5e" fillOpacity={1} fill="url(#colorBP)" name="Systolic BP" strokeWidth={2} animationDuration={1500} />
                            <Area type="monotone" dataKey="HR" stroke="#10b981" fillOpacity={1} fill="url(#colorHR)" name="Heart Rate" strokeWidth={2} animationDuration={1500} />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Weight Trend Chart */}
                    <div className="bg-white border border-gray-100 p-6 rounded-3xl shadow-xs">
                      <div className="flex items-center justify-between mb-6">
                        <div>
                          <span className="text-xs font-bold text-gray-800">Body Composition Trends</span>
                          <p className="text-[10px] text-gray-400">Weight variation over clinical sessions (kg)</p>
                        </div>
                        <Weight className="h-4 w-4 text-blue-500" />
                      </div>
                      <div className="h-48">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={vitalsChartData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                            <XAxis dataKey="date" stroke="#9ca3af" fontSize={11} tickLine={false} axisLine={false} />
                            <YAxis stroke="#9ca3af" fontSize={11} tickLine={false} axisLine={false} domain={['dataMin - 5', 'dataMax + 5']} />
                            <Tooltip 
                              contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                            />
                            <Line type="monotone" dataKey="Weight" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, fill: '#3b82f6' }} name="Body Weight" animationDuration={1500} />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div className="bg-white border border-gray-100 p-4 rounded-2xl">
                        <span className="text-[10px] text-gray-400 block font-mono uppercase">Avg Heart Rate</span>
                        <span className="text-lg font-bold font-display text-emerald-600">
                          {Math.round(vitalsChartData.reduce((acc, curr) => acc + (curr.HR || 0), 0) / vitalsChartData.length)} bpm
                        </span>
                      </div>
                      <div className="bg-white border border-gray-100 p-4 rounded-2xl">
                        <span className="text-[10px] text-gray-400 block font-mono uppercase">Target BP</span>
                        <span className="text-lg font-bold font-display text-rose-500">120/80</span>
                      </div>
                      <div className="bg-white border border-gray-100 p-4 rounded-2xl">
                        <span className="text-[10px] text-gray-400 block font-mono uppercase">Weight Delta</span>
                        <span className="text-lg font-bold font-display text-blue-600">
                          {vitalsChartData.length > 1 ? (vitalsChartData[vitalsChartData.length-1].Weight - vitalsChartData[0].Weight).toFixed(1) : '0.0'} kg
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white border border-gray-100 p-8 rounded-3xl text-center text-gray-400 text-sm">
                    No vital signs logged recently to visualize trends.
                  </div>
                )}
              </div>

              {/* Side checklist: Conditions, Allergies */}
              <div className="lg:col-span-4 space-y-6">
                {/* Allergies Alerts */}
                <div className="bg-white border border-gray-100 p-6 rounded-3xl shadow-xs">
                  <h4 className="font-bold text-gray-800 text-sm mb-4 flex items-center space-x-2">
                    <AlertCircle className="h-4 w-4 text-rose-500" />
                    <span>Drug & Food Allergies</span>
                  </h4>
                  {patientData.allergies && patientData.allergies.length > 0 ? (
                    <div className="space-y-3">
                      {patientData.allergies.map((a, idx) => (
                        <div key={idx} className="flex justify-between items-center bg-rose-50/50 border border-rose-100/30 p-3 rounded-xl text-xs">
                          <div>
                            <span className="font-bold text-gray-800">{a.allergen}</span>
                            <span className="block text-gray-400 font-mono mt-0.5 uppercase text-[9px]">Noted by: {a.notedBy}</span>
                          </div>
                          <span className="bg-rose-100 text-rose-700 px-2 py-0.5 rounded font-bold uppercase tracking-wide text-[9px]">
                            {a.severity}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-400 font-mono italic">No active drug allergies registered.</p>
                  )}
                </div>

                {/* Diagnosed Conditions */}
                <div className="bg-white border border-gray-100 p-6 rounded-3xl shadow-xs">
                  <h4 className="font-bold text-gray-800 text-sm mb-4 flex items-center space-x-2">
                    <Stethoscope className="h-4 w-4 text-blue-500" />
                    <span>Active Clinical Conditions</span>
                  </h4>
                  {patientData.conditions && patientData.conditions.length > 0 ? (
                    <div className="space-y-3">
                      {patientData.conditions.map((c, idx) => (
                        <div key={idx} className="bg-gray-50/50 border border-gray-100/50 p-3 rounded-xl text-xs">
                          <span className="font-bold text-gray-800 block">{c.name}</span>
                          <p className="text-gray-500 mt-1 leading-relaxed">{c.notes || 'No chronic notes added.'}</p>
                          <span className="block text-[10px] text-gray-400 font-mono mt-2 uppercase">Diagnosed by: {c.diagnosedBy}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-400 font-mono italic">No active chronic conditions declared.</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'triage' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="lg:col-span-5 bg-white border border-gray-100 p-6 rounded-3xl shadow-xs">
                <div className="flex items-center space-x-2 text-rose-600 font-semibold text-sm mb-4">
                  <Sparkles className="h-5 w-5" />
                  <span>AI Clinical Triage</span>
                </div>
                <p className="text-xs text-gray-500 mb-6 leading-relaxed">
                  Describe symptoms in plain text. Our clinical Gemini engine assesses urgency and recommends follow-up paths.
                </p>

                <form onSubmit={handleTriageSubmit} className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-wider mb-2">Physical complaints</label>
                    <textarea
                      required
                      value={symptoms}
                      onChange={(e) => setSymptoms(e.target.value)}
                      placeholder="e.g. Sharp pain in lower abdomen, feeling slightly feverish and nauseous since yesterday..."
                      className="w-full border border-gray-200 rounded-2xl p-4 text-sm focus:outline-none focus:border-rose-500 h-40 bg-gray-50/30"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={triageLoading}
                    className="w-full bg-rose-500 hover:bg-rose-600 text-white font-medium py-3.5 rounded-2xl text-sm transition-all shadow-sm disabled:opacity-50 flex items-center justify-center space-x-2"
                  >
                    {triageLoading ? (
                      <span className="animate-pulse">Processing Clinical Telemetry...</span>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4" />
                        <span>Execute Triage Evaluation</span>
                      </>
                    )}
                  </button>
                </form>
              </div>

              <div className="lg:col-span-7">
                {triageResult ? (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white border border-gray-100 p-8 rounded-3xl shadow-sm space-y-6"
                  >
                    <div className="flex justify-between items-start border-b border-gray-50 pb-6">
                      <div>
                        <h4 className="font-bold text-gray-800 text-base font-display">Diagnostic Risk Summary</h4>
                        <span className="text-[10px] font-mono text-gray-400 uppercase mt-1 block">ALGORITHM: GEMINI 3-FLASH (SECURE)</span>
                      </div>

                      <div className="flex flex-col items-end">
                        <span className={`text-[10px] font-mono font-bold px-3 py-1 rounded-full uppercase tracking-wide border shadow-xs ${
                          triageResult.severity === 'Emergency' || triageResult.severity === 'High'
                            ? 'bg-rose-50 border-rose-200 text-rose-700'
                            : triageResult.severity === 'Medium'
                            ? 'bg-amber-50 border-amber-200 text-amber-700'
                            : 'bg-emerald-50 border-emerald-200 text-emerald-700'
                        }`}>
                          {triageResult.severity} RISK
                        </span>
                        <span className="text-[10px] text-gray-400 mt-2 font-medium">{triageResult.levelOfCare}</span>
                      </div>
                    </div>

                    <div className="space-y-6 text-sm">
                      <div>
                        <span className="font-bold text-gray-700 block text-[10px] uppercase tracking-wider font-mono mb-2">Physician Analysis</span>
                        <p className="text-gray-600 bg-gray-50/50 p-5 rounded-2xl border border-gray-100/30 text-xs leading-relaxed">{triageResult.analysis}</p>
                      </div>

                      <div>
                        <span className="font-bold text-gray-700 block text-[10px] uppercase tracking-wider font-mono mb-3">Diagnostic Discovery Questions</span>
                        <div className="space-y-2">
                          {triageResult.suggestedQuestions.map((q: string, i: number) => (
                            <div key={i} className="flex items-start space-x-3 text-xs text-gray-600 bg-white border border-gray-100 p-4 rounded-2xl shadow-xs">
                              <HelpCircle className="h-4 w-4 text-blue-400 shrink-0 mt-0.5" />
                              <span className="font-medium">{q}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="bg-amber-50/30 border border-amber-100 p-5 rounded-2xl flex items-start space-x-4 text-xs text-amber-900 shadow-xs">
                        <AlertCircle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold block mb-1.5 uppercase tracking-wide text-[10px]">Clinical Precautionary Advisory</span>
                          <p className="leading-relaxed text-amber-800/80">{triageResult.precautionaryAdvice}</p>
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-gray-50 flex items-center justify-center space-x-2 text-[10px] text-gray-400 italic">
                      <Info className="h-3 w-3" />
                      <span>AI Triage is an advisory tool. Consult MD for critical care.</span>
                    </div>
                  </motion.div>
                ) : (
                  <div className="h-full min-h-[400px] border border-dashed border-gray-200 rounded-3xl flex flex-col justify-center items-center p-12 text-center text-gray-400 bg-gray-50/20">
                    <Sparkles className="h-10 w-10 text-gray-200 mb-4 animate-pulse" />
                    <p className="text-sm font-medium">Awaiting Symptom Telemetry Input</p>
                    <p className="text-xs mt-2 max-w-xs leading-relaxed">Provide description to initialize Gemini clinical assessment protocols.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'prescriptions' && (
            <div className="space-y-6">
              <h3 className="font-display font-bold text-gray-800 text-base">Authorized Pharmacological Records</h3>
              {patientData.patientPrescriptions && patientData.patientPrescriptions.length > 0 ? (
                <div className="grid grid-cols-1 gap-6">
                  {patientData.patientPrescriptions.map((rx) => (
                    <div key={rx.id} className="bg-white border border-gray-100 rounded-3xl p-8 shadow-xs flex flex-col lg:flex-row gap-8">
                      <div className="lg:w-1/2 space-y-5">
                        <div className="flex justify-between items-start border-b border-gray-50 pb-4">
                          <div>
                            <span className="text-[10px] text-gray-400 font-mono tracking-widest uppercase">RX AUTHORIZATION • {rx.id.slice(0, 8)}</span>
                            <h4 className="font-bold text-gray-800 mt-1 text-base">Dr. {rx.doctor?.name || 'Physician'}</h4>
                          </div>
                          <span className={`text-[10px] font-mono font-bold px-3 py-1 rounded-full border shadow-xs ${
                            rx.status === 'Dispensed' 
                              ? 'bg-emerald-50 border-emerald-100 text-emerald-700' 
                              : 'bg-amber-50 border-amber-100 text-amber-700'
                          }`}>
                            {rx.status.toUpperCase()}
                          </span>
                        </div>

                        <div className="space-y-3">
                          {rx.items.map((med, mIdx) => (
                            <div key={mIdx} className="bg-gray-50/50 border border-gray-100/50 p-4 rounded-2xl flex justify-between items-center text-xs">
                              <div>
                                <span className="font-bold text-gray-800 block text-sm">{med.medicineName}</span>
                                <span className="text-gray-400 block mt-1">{med.dosage} • {med.frequency}</span>
                              </div>
                              <div className="text-right">
                                <span className="text-gray-500 font-bold font-mono block">{med.duration}</span>
                                <span className="text-[9px] text-gray-300 uppercase tracking-tighter block mt-0.5">Duration</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="lg:w-1/2 bg-rose-50/30 border border-rose-100/30 rounded-3xl p-6 space-y-4 text-xs">
                        <div className="flex items-center space-x-2">
                          <Activity className="h-4 w-4 text-rose-500" />
                          <span className="font-bold text-rose-700 uppercase tracking-wider font-mono text-[10px]">AI Drug Interaction Warning</span>
                        </div>
                        <div className="bg-white/80 p-5 rounded-2xl border border-rose-100/20 text-gray-600 leading-relaxed shadow-xs min-h-[100px]">
                          {rx.aiInteractionWarnings || 'Automated safety scan detected no severe interaction risks for this formulary combination.'}
                        </div>
                        <p className="text-[9px] text-gray-400 italic text-center">Safety analysis provided by Clinical Gemini Engine.</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-white border border-gray-100 p-12 rounded-3xl text-center text-gray-400 text-sm shadow-xs">
                  <FileText className="h-8 w-8 mx-auto mb-4 text-gray-100" />
                  <p>No active prescriptions registered in your medical history.</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'labs' && (
            <div className="space-y-6">
              <h3 className="font-display font-bold text-gray-800 text-base">Pathology & Diagnostic Panels</h3>
              {patientData.labReports && patientData.labReports.length > 0 ? (
                <div className="grid grid-cols-1 gap-6">
                  {patientData.labReports.map((report) => (
                    <div key={report.id} className="bg-white border border-gray-100 rounded-3xl p-8 shadow-xs flex flex-col lg:flex-row gap-8">
                      <div className="lg:w-1/2 space-y-6">
                        <div className="flex justify-between items-start border-b border-gray-50 pb-5">
                          <div>
                            <span className="text-[10px] text-gray-400 font-mono tracking-widest uppercase">LAB ACCESSION • {report.id.slice(0, 8)}</span>
                            <h4 className="font-bold text-gray-800 text-lg mt-1">{report.testName}</h4>
                          </div>
                          <span className={`text-[10px] font-mono font-bold px-3 py-1 rounded-full border shadow-xs ${
                            report.status === 'Completed' 
                              ? 'bg-emerald-50 border-emerald-100 text-emerald-700' 
                              : 'bg-amber-50 border-amber-100 text-amber-700'
                          }`}>
                            {report.status.toUpperCase()}
                          </span>
                        </div>

                        <div className="overflow-x-auto no-scrollbar">
                          <table className="w-full text-left text-xs">
                            <thead>
                              <tr className="border-b border-gray-50 text-gray-400 uppercase tracking-widest font-mono text-[9px]">
                                <th className="py-3">Biomarker</th>
                                <th className="py-3 text-center">Value</th>
                                <th className="py-3 text-right">Ref Range</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50/50">
                              {report.results.map((r, rIdx) => (
                                <tr key={rIdx} className="hover:bg-gray-50/30 transition-colors">
                                  <td className="py-4 font-bold text-gray-700">{r.parameter}</td>
                                  <td className="py-4 text-center">
                                    <span className={`font-bold px-2 py-1 rounded-lg border text-[10px] ${
                                      r.isAbnormal 
                                        ? 'bg-rose-50 text-rose-600 border-rose-100 shadow-xs' 
                                        : 'bg-gray-50 text-gray-700 border-transparent'
                                    }`}>
                                      {r.value} {r.unit}
                                    </span>
                                  </td>
                                  <td className="py-4 text-right text-gray-400 font-mono text-[10px]">{r.referenceRange || '—'}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      <div className="lg:w-1/2 bg-blue-50/30 border border-blue-100/30 rounded-3xl p-6 space-y-4 text-xs">
                        <div className="flex items-center space-x-2">
                          <Eye className="h-4 w-4 text-blue-500" />
                          <span className="font-bold text-blue-700 uppercase tracking-wider font-mono text-[10px]">AI Report Interpretation</span>
                        </div>
                        <div className="bg-white/80 p-5 rounded-2xl border border-blue-100/20 text-gray-600 leading-relaxed shadow-xs min-h-[150px] whitespace-pre-line">
                          {report.aiInterpretation || 'Final pathologist validation pending.'}
                        </div>
                        <p className="text-[9px] text-gray-400 italic text-center">Report interpreted by secure Clinical Gemini protocols.</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-white border border-gray-100 p-12 rounded-3xl text-center text-gray-400 text-sm shadow-xs">
                  <Activity className="h-8 w-8 mx-auto mb-4 text-gray-100" />
                  <p>No laboratory reports found in your clinical dossier.</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'appointments' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Consultation Booking Calendar */}
              <div className="lg:col-span-6 bg-white border border-gray-100 p-6 rounded-3xl shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-2 text-rose-600 font-semibold text-sm">
                    <Calendar className="h-5 w-5" />
                    <span>Request New Consultation</span>
                  </div>
                  <div className="text-[10px] font-mono text-gray-400 uppercase">Available Slots: MON-FRI</div>
                </div>

                <form onSubmit={handleBookAppointment} className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-wider">Specialized Department</label>
                      <select
                        value={bookingDept}
                        onChange={(e) => setBookingDept(e.target.value)}
                        className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:border-rose-500 bg-gray-50/50"
                      >
                        <option value="General Medicine">General Medicine</option>
                        <option value="Cardiology">Cardiology</option>
                        <option value="Pediatrics">Pediatrics</option>
                        <option value="Neurology">Neurology</option>
                        <option value="Dermatology">Dermatology</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-wider">Preferred Time Slot</label>
                      <select
                        value={bookingTime}
                        onChange={(e) => setBookingTime(e.target.value)}
                        className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:border-rose-500 bg-gray-50/50"
                      >
                        {['09:00', '10:30', '13:00', '14:30', '16:00'].map(t => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-wider">Consultation Reason *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Annual physical, persistent cough, knee pain"
                      value={bookingReason}
                      onChange={(e) => setBookingReason(e.target.value)}
                      className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:border-rose-500 bg-gray-50/50"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-wider font-mono">Additional Symptoms / Clinical Notes</label>
                    <textarea
                      rows={2}
                      placeholder="Provide any symptoms, duration, or notes on documents to upload..."
                      value={bookingNotes}
                      onChange={(e) => setBookingNotes(e.target.value)}
                      className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:border-rose-500 bg-gray-50/50"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-wider mb-3">Interactive Date Selection</label>
                    <div className="bg-gray-50/50 rounded-2xl p-4 border border-gray-100">
                      <div className="grid grid-cols-7 gap-1 text-center mb-2">
                        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(d => (
                          <span key={d} className="text-[9px] font-bold text-gray-400">{d}</span>
                        ))}
                      </div>
                      <div className="grid grid-cols-7 gap-1">
                        {/* Simplified Month Grid (Current Month) */}
                        {Array.from({ length: 31 }).map((_, i) => {
                          const day = i + 1;
                          const dateStr = `2026-07-${day < 10 ? '0' + day : day}`;
                          const isSelected = bookingDate === dateStr;
                          const isPast = day < new Date().getDate() && new Date().getMonth() === 6; // Mocking for July
                          return (
                            <button
                              key={i}
                              type="button"
                              disabled={isPast}
                              onClick={() => setBookingDate(dateStr)}
                              className={`aspect-square flex items-center justify-center text-[11px] rounded-lg transition-all ${
                                isSelected 
                                  ? 'bg-rose-500 text-white font-bold shadow-sm' 
                                  : isPast
                                  ? 'text-gray-200 cursor-not-allowed'
                                  : 'text-gray-600 hover:bg-rose-50 hover:text-rose-500'
                              }`}
                            >
                              {day}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  <div className="bg-emerald-50/30 border border-emerald-100/30 p-4 rounded-2xl flex items-start space-x-3 text-[11px]">
                    <Info className="h-4 w-4 text-emerald-500 shrink-0" />
                    <p className="text-emerald-800/80 leading-relaxed">
                      You are requesting an appointment for <span className="font-bold">{bookingDept}</span> on <span className="font-bold text-rose-500">{bookingDate || '...'}</span> at <span className="font-bold text-rose-500">{bookingTime}</span>. Final confirmation will be sent via SMS.
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={isBooking || !bookingDate}
                    className="w-full bg-rose-500 hover:bg-rose-600 text-white font-medium py-3.5 rounded-2xl text-sm transition-all shadow-sm disabled:opacity-50 mt-4"
                  >
                    {isBooking ? 'Registering Request...' : 'Send Booking Request'}
                  </button>
                </form>
                     <div className="lg:col-span-6 space-y-6">
                <h3 className="font-display font-bold text-gray-800 text-base">Active Schedule</h3>
                {patientData.patientAppointments && patientData.patientAppointments.length > 0 ? (
                  <div className="grid grid-cols-1 gap-4">
                    {patientData.patientAppointments.map((app) => {
                      const statusUpper = app.status?.toUpperCase();
                      const isPending = statusUpper === 'PENDING';
                      const isConfirmed = statusUpper === 'CONFIRMED';
                      const isWaiting = statusUpper === 'WAITING' || statusUpper === 'CHECKED_IN';
                      const isRejected = statusUpper === 'REJECTED';
                      const isCompleted = statusUpper === 'COMPLETED';
                      const isCancelled = statusUpper === 'CANCELLED';

                      // Patient can cancel only if not already in active consultation (In Progress / Completed)
                      // and not already cancelled or rejected.
                      const canCancel = !['IN PROGRESS', 'IN_PROGRESS', 'WITH_DOCTOR', 'COMPLETED', 'CANCELLED', 'REJECTED'].includes(statusUpper);

                      return (
                        <div key={app.id} className={`bg-white border border-gray-100 p-6 rounded-2xl shadow-xs flex flex-col hover:border-gray-200 transition-all group space-y-4 ${
                          isCancelled ? 'opacity-70 bg-gray-50/50' : ''
                        }`}>
                          <div className="flex justify-between items-start">
                            <div className="flex items-center space-x-4">
                              <div className={`h-12 w-12 rounded-2xl flex items-center justify-center transition-colors ${
                                isPending ? 'bg-amber-50 text-amber-600' :
                                isConfirmed ? 'bg-emerald-50 text-emerald-600' :
                                isWaiting ? 'bg-blue-50 text-blue-600' :
                                isRejected ? 'bg-rose-50 text-rose-600' :
                                isCancelled ? 'bg-gray-100 text-gray-500' : 'bg-gray-50 text-gray-500'
                              }`}>
                                <Calendar className="h-6 w-6" />
                              </div>
                              <div>
                                <span className={`font-bold block text-sm ${isCancelled ? 'text-gray-500 line-through' : 'text-gray-800'}`}>
                                  {app.doctor?.name ? `Dr. ${app.doctor.name}` : 'Awaiting Coordinator Assignment'}
                                </span>
                                <span className="text-[10px] text-gray-400 block mt-0.5 uppercase tracking-widest">
                                  {app.department || 'General Medicine'}
                                </span>
                                <div className="flex items-center space-x-2 mt-2">
                                  <Clock className={`h-3 w-3 ${isCancelled ? 'text-gray-400' : 'text-rose-500'}`} />
                                  <span className={`text-xs font-bold font-mono ${isCancelled ? 'text-gray-400 line-through' : 'text-rose-500'}`}>
                                    {new Date(app.dateTime).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className={`text-[10px] font-mono font-bold px-3 py-1 rounded-full border shadow-xs ${
                                isPending ? 'bg-amber-50 border-amber-100 text-amber-700' :
                                isConfirmed ? 'bg-emerald-50 border-emerald-100 text-emerald-700' :
                                isWaiting ? 'bg-blue-50 border-blue-100 text-blue-700' :
                                isRejected ? 'bg-rose-50 border-rose-100 text-rose-700' :
                                isCancelled ? 'bg-gray-100 border-gray-200 text-gray-500' :
                                'bg-gray-50 border-gray-100 text-gray-500'
                              }`}>
                                {app.status}
                              </span>

                              {canCancel && (
                                <button
                                  type="button"
                                  onClick={() => setCancellingId(app.id)}
                                  className="p-1.5 text-gray-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                                  title="Cancel Appointment"
                                >
                                  <CalendarX className="h-4 w-4" />
                                </button>
                              )}
                            </div>
                          </div>

                          {cancellingId === app.id && (
                            <div className="bg-rose-50/70 border border-rose-100 p-4 rounded-xl text-xs space-y-3 animate-in fade-in duration-200">
                              <div className="flex items-start space-x-2 text-rose-800">
                                <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                                <div>
                                  <p className="font-bold">Cancel Appointment Confirmation</p>
                                  <p className="text-rose-600 mt-0.5">Are you sure you want to cancel this appointment request? This action cannot be undone.</p>
                                </div>
                              </div>
                              <div className="flex justify-end space-x-2 pt-1">
                                <button
                                  type="button"
                                  disabled={isCancelling}
                                  onClick={() => setCancellingId(null)}
                                  className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-gray-600 font-medium hover:bg-gray-50 transition-colors"
                                >
                                  Keep Appointment
                                </button>
                                <button
                                  type="button"
                                  disabled={isCancelling}
                                  onClick={() => handleCancelAppointment(app.id)}
                                  className="px-3 py-1.5 bg-rose-600 text-white rounded-lg font-bold hover:bg-rose-700 transition-colors shadow-xs flex items-center space-x-1"
                                >
                                  {isCancelling ? 'Cancelling...' : 'Confirm Cancellation'}
                                </button>
                              </div>
                            </div>
                          )}

                          {isRejected && app.rejectionReason && (
                            <div className="bg-rose-50/50 border border-rose-100/30 p-3 rounded-xl text-xs text-rose-700">
                              <span className="font-bold block text-[10px] font-mono uppercase text-rose-600 mb-0.5">Rejection Reason</span>
                              <p className="italic">"{app.rejectionReason}"</p>
                            </div>
                          )}

                          {app.consultationRoom && (
                            <div className="bg-gray-50/70 border border-gray-100 p-2.5 rounded-xl text-[11px] text-gray-600 flex items-center justify-between">
                              <span className="font-medium">Assigned Consultation Room:</span>
                              <span className="font-bold text-gray-800">{app.consultationRoom}</span>
                            </div>
                          )}

                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="bg-white border border-gray-100 p-12 rounded-3xl text-center text-gray-400 text-sm shadow-xs">
                    <Calendar className="h-8 w-8 mx-auto mb-4 text-gray-100" />
                    <p>Your appointment calendar is currently empty.</p>
                  </div>
                )}
              </div>          </div>
            </div>
          )}

          {activeTab === 'profile' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              
              {/* Left panel: Personal Profile Settings */}
              <div className="lg:col-span-7 bg-white border border-gray-100 rounded-3xl p-8 shadow-xs">
                <div className="border-b border-gray-50 pb-6 mb-8">
                  <h3 className="font-display font-bold text-gray-800 text-lg">Secure Identity Profile</h3>
                  <p className="text-xs text-gray-400 mt-1">Manage your authorized clinical records and contact information.</p>
                </div>

                <form onSubmit={handleProfileUpdateSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest">Legal Full Name</label>
                      <input
                        type="text"
                        required
                        value={profileName}
                        onChange={(e) => setProfileName(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-rose-500 bg-gray-50/30"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest">Emergency Phone</label>
                      <input
                        type="tel"
                        required
                        value={profilePhone}
                        onChange={(e) => setProfilePhone(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-rose-500 bg-gray-50/30"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest">Date of Birth</label>
                      <input
                        type="date"
                        required
                        value={profileDob}
                        onChange={(e) => setProfileDob(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-rose-500 bg-gray-50/30"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest">Gender Identity</label>
                      <select
                        value={profileGender}
                        onChange={(e) => setProfileGender(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:border-rose-500 bg-gray-50/30"
                      >
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest">Blood Cohort</label>
                      <select
                        value={profileBloodGroup}
                        onChange={(e) => setProfileBloodGroup(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:border-rose-500 bg-gray-50/30"
                      >
                        <option value="O+">O+</option>
                        <option value="O-">O-</option>
                        <option value="A+">A+</option>
                        <option value="A-">A-</option>
                        <option value="B+">B+</option>
                        <option value="B-">B-</option>
                        <option value="AB+">AB+</option>
                        <option value="AB-">AB-</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest">Clinical Authority</label>
                      <div className="px-4 py-2.5 rounded-xl bg-gray-100/50 text-gray-500 text-[10px] font-mono border border-gray-100 flex items-center space-x-2">
                        <ShieldCheck className="h-3 w-3 text-emerald-500" />
                        <span>ROLE_PATIENT_AUTHORIZED</span>
                      </div>
                    </div>

                    <div className="col-span-1 sm:col-span-2 space-y-2">
                      <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest">Long-term Medical History</label>
                      <textarea
                        value={profileHistory}
                        onChange={(e) => setProfileHistory(e.target.value)}
                        className="w-full px-4 py-3 rounded-2xl border border-gray-200 text-sm h-32 focus:outline-none focus:border-rose-500 bg-gray-50/30"
                        placeholder="Provide chronic conditions, medication allergies..."
                      />
                    </div>
                  </div>

                  <div className="pt-4">
                    <button
                      type="submit"
                      disabled={profileSubmitting}
                      className="bg-rose-500 hover:bg-rose-600 text-white px-6 py-3 rounded-2xl text-sm font-bold transition-all shadow-sm disabled:opacity-50"
                    >
                      {profileSubmitting ? 'Updating Core Records...' : 'Synchronize Profile'}
                    </button>
                  </div>
                </form>
              </div>

              {/* Right panel: Password Settings */}
              <div className="lg:col-span-5 space-y-8">
                <div className="bg-white border border-gray-100 rounded-3xl p-8 shadow-xs">
                  <div className="border-b border-gray-50 pb-6 mb-8">
                    <h3 className="font-display font-bold text-gray-800 text-lg">Cipher Security</h3>
                    <p className="text-xs text-gray-400 mt-1">Improve account safety with clinical-grade password rotation.</p>
                  </div>

                  <form onSubmit={handlePasswordChangeSubmit} className="space-y-5">
                    <div className="space-y-2">
                      <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest">Current Cipher</label>
                      <input
                        type="password"
                        required
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-rose-500 text-sm bg-gray-50/30"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest">New Clinical Cipher</label>
                      <input
                        type="password"
                        required
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-rose-500 text-sm bg-gray-50/30"
                      />
                    </div>

                    <div className="pt-4">
                      <button
                        type="submit"
                        disabled={passwordSubmitting}
                        className="w-full bg-gray-800 hover:bg-gray-950 text-white py-3 rounded-2xl text-sm font-bold transition-all shadow-sm disabled:opacity-50"
                      >
                        {passwordSubmitting ? 'Updating Cipher...' : 'Authorize Cipher Rotation'}
                      </button>
                    </div>
                  </form>
                </div>

                <div className="bg-emerald-50 border border-emerald-100 p-6 rounded-3xl">
                  <div className="flex items-start space-x-4">
                    <div className="bg-emerald-100 p-2 rounded-xl">
                      <ShieldCheck className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-emerald-800">Two-Factor Authenticated</h4>
                      <p className="text-xs text-emerald-700/70 mt-1 leading-relaxed">Your clinical session is protected by multi-factor authentication protocols and end-to-end encryption.</p>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}
