import React, { useState, useEffect } from 'react';
import { 
  Calendar as CalendarIcon, Clock, User, 
  Stethoscope, MapPin, Plus, ChevronLeft, 
  ChevronRight, CheckCircle, XCircle, AlertCircle,
  MoreVertical, Search, Filter, Inbox, Check, Ban, 
  ArrowRight, ShieldAlert, FileText, ClipboardList
} from 'lucide-react';
import { toast } from 'sonner';

interface AppointmentManagerProps {
  token: string;
}

export default function AppointmentManager({ token }: AppointmentManagerProps) {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [subTab, setSubTab] = useState<'requests' | 'confirmed' | 'history'>('requests');
  const [showDirectForm, setShowDirectForm] = useState(false);
  const [selectedApp, setSelectedApp] = useState<any | null>(null);
  
  // Direct booking form (receptionist creates confirmed directly)
  const [directForm, setDirectForm] = useState({
    patientId: '', doctorId: '', dateTime: '', reason: '', 
    type: 'Consultation', department: 'General Medicine', notes: '', priority: 'Normal'
  });

  // Triage / Review Assign fields
  const [assignDoctorId, setAssignDoctorId] = useState('');
  const [assignDept, setAssignDept] = useState('General Medicine');
  const [assignRoom, setAssignRoom] = useState('');
  const [assignDateTime, setAssignDateTime] = useState('');
  const [assignPriority, setAssignPriority] = useState('Normal');
  const [internalNotes, setInternalNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [isRejecting, setIsRejecting] = useState(false);

  // Search & filter for Confirmed / History
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 15000);
    return () => clearInterval(interval);
  }, [token]);

  // Sync review states when selection shifts
  useEffect(() => {
    if (selectedApp) {
      setAssignDoctorId(selectedApp.doctorId || '');
      setAssignDept(selectedApp.department || 'General Medicine');
      setAssignRoom(selectedApp.consultationRoom || '');
      setAssignDateTime(selectedApp.dateTime || '');
      setAssignPriority(selectedApp.priority || 'Normal');
      setInternalNotes(selectedApp.notes || '');
      setRejectionReason('');
      setIsRejecting(false);
    }
  }, [selectedApp]);

  const fetchData = async () => {
    try {
      const [resApp, resPat, resDoc] = await Promise.all([
        fetch('/api/appointments', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/patients', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/admin/users', { headers: { 'Authorization': `Bearer ${token}` } })
      ]);
      
      const [dataApp, dataPat, dataDoc] = await Promise.all([
        resApp.json(), resPat.json(), resDoc.json()
      ]);

      const appList = Array.isArray(dataApp) ? dataApp : [];
      setAppointments(appList);
      setPatients(Array.isArray(dataPat) ? dataPat : []);
      
      const doctorsList = Array.isArray(dataDoc) ? dataDoc.filter((u: any) => u.role === 'DOCTOR') : [];
      setDoctors(doctorsList);

      // Auto-select first pending request if none is selected
      const pendingList = appList.filter((a: any) => a.status?.toUpperCase() === 'PENDING');
      if (pendingList.length > 0 && !selectedApp) {
        setSelectedApp(pendingList[0]);
      }
    } catch (err) {
      console.error('Error fetching clinical dataset:', err);
    } finally {
      setLoading(false);
    }
  };

  // Direct confirmation by receptionist
  const handleDirectSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(directForm)
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || 'Failed to schedule appointment.');
      }
      toast.success('Appointment Scheduled & Confirmed!');
      setShowDirectForm(false);
      setDirectForm({
        patientId: '', doctorId: '', dateTime: '', reason: '', 
        type: 'Consultation', department: 'General Medicine', notes: '', priority: 'Normal'
      });
      fetchData();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  // Review & Approve / Assign
  const handleApprove = async () => {
    if (!selectedApp) return;
    if (!assignDoctorId) {
      toast.error('Workflow requirement: You must assign a qualified doctor to approve and confirm this request.');
      return;
    }
    if (!assignDateTime) {
      toast.error('Workflow requirement: Please set the confirmed date and time slot.');
      return;
    }

    try {
      const res = await fetch(`/api/appointments/${selectedApp.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          status: 'CONFIRMED',
          doctorId: assignDoctorId,
          department: assignDept,
          dateTime: assignDateTime,
          priority: assignPriority,
          consultationRoom: assignRoom,
          notes: internalNotes
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to approve request.');

      toast.success(`Request successfully approved & Dr. ${data.doctor?.name || 'Physician'} assigned.`);
      setSelectedApp(null);
      fetchData();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  // Reject Request
  const handleReject = async () => {
    if (!selectedApp) return;
    if (!rejectionReason.trim()) {
      toast.error('Workflow requirement: Please enter a clear rejection reason to notify the patient.');
      return;
    }

    try {
      const res = await fetch(`/api/appointments/${selectedApp.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          status: 'REJECTED',
          rejectionReason,
          notes: internalNotes
        })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to reject request.');
      }

      toast.success('Appointment request was rejected. Patient notified.');
      setSelectedApp(null);
      setIsRejecting(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  // Check-In Patient (Enters Waiting Queue)
  const handleCheckIn = async (appId: string, customPriority: string = 'Normal') => {
    try {
      const res = await fetch(`/api/receptionist/appointments/${appId}/check-in`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ waitingRoom: 'Main Lounge', priority: customPriority })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to check in patient.');

      toast.success(`Check-In Successful! Token #${data.queueItem.tokenNumber} issued (Queue position: ${data.position}, Est. wait: ${data.estimatedWaitTimeMinutes} mins)`);
      fetchData();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleTriageCheckIn = (appId: string) => {
    toast('Triage Priority Select', {
      description: 'Select urgency level to assign waiting priority:',
      action: {
        label: 'Urgent / Emergency',
        onClick: () => handleCheckIn(appId, 'Emergency')
      },
      cancel: {
        label: 'Routine Visit',
        onClick: () => handleCheckIn(appId, 'Normal')
      }
    });
  };

  // Status updates (Reschedule, Cancel, etc.)
  const handleGeneralStatus = async (appId: string, status: string) => {
    try {
      const res = await fetch(`/api/appointments/${appId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ status })
      });
      if (!res.ok) throw new Error('Failed to update status');
      toast.success(`Appointment marked as ${status}`);
      fetchData();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  // Filter lists based on states
  const pendingRequests = appointments.filter(a => a.status?.toUpperCase() === 'PENDING');
  
  const confirmedSchedule = appointments.filter(a => {
    const status = a.status?.toUpperCase();
    const matchesStatus = status === 'CONFIRMED' || status === 'WAITING' || status === 'CHECKED_IN';
    const matchesDate = a.dateTime.startsWith(filterDate);
    const matchesSearch = searchTerm === '' || 
      a.patient?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.doctor?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.reason?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesDate && matchesSearch;
  });

  const historySchedule = appointments.filter(a => {
    const status = a.status?.toUpperCase();
    const matchesStatus = status === 'COMPLETED' || status === 'REJECTED' || status === 'CANCELLED';
    const matchesSearch = searchTerm === '' || 
      a.patient?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.reason?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* Upper header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 pb-5">
        <div>
          <h2 className="font-display font-bold text-gray-900 text-xl flex items-center gap-2">
            <ClipboardList className="h-6 w-6 text-rose-500" />
            Hospital Appointment Coordinator
          </h2>
          <p className="text-sm text-gray-400">Receptionist review-centric clinical intake hub</p>
        </div>
        <div className="flex items-center space-x-2">
          <button 
            onClick={() => setShowDirectForm(!showDirectForm)}
            className="bg-gray-900 hover:bg-black text-white font-bold px-5 py-2.5 rounded-xl text-xs flex items-center space-x-2 transition-all shadow-md"
          >
            <Plus className="h-4 w-4" />
            <span>Direct Intake Booking</span>
          </button>
        </div>
      </div>

      {/* Direct Booking Drawer/Section */}
      {showDirectForm && (
        <div className="bg-white border border-rose-100 rounded-3xl p-6 shadow-xl shadow-rose-50/50 animate-in slide-in-from-top-4 duration-300">
          <div className="flex items-center justify-between mb-4 border-b border-gray-50 pb-2">
            <h3 className="text-sm font-bold text-gray-900">Direct Patient Intake Form</h3>
            <button onClick={() => setShowDirectForm(false)} className="text-xs font-semibold text-rose-500 hover:underline">Dismiss</button>
          </div>
          <form onSubmit={handleDirectSchedule} className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-[10px] font-mono font-bold text-gray-400 uppercase block mb-1">Select Patient</label>
              <select 
                required 
                value={directForm.patientId} 
                onChange={e => setDirectForm({...directForm, patientId: e.target.value})}
                className="w-full border border-gray-200 rounded-xl p-2.5 text-xs focus:border-rose-500 outline-none transition-all bg-white"
              >
                <option value="">-- Choose Patient --</option>
                {patients.map(p => <option key={p.id} value={p.id}>{p.name} ({p.patientId})</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-mono font-bold text-gray-400 uppercase block mb-1">Assign Doctor</label>
              <select 
                required 
                value={directForm.doctorId} 
                onChange={e => setDirectForm({...directForm, doctorId: e.target.value})}
                className="w-full border border-gray-200 rounded-xl p-2.5 text-xs focus:border-rose-500 outline-none transition-all bg-white"
              >
                <option value="">-- Choose Specialist --</option>
                {doctors.map(d => <option key={d.id} value={d.id}>{d.name} ({d.department})</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-mono font-bold text-gray-400 uppercase block mb-1">Date & Time</label>
              <input 
                required 
                type="datetime-local" 
                value={directForm.dateTime} 
                onChange={e => setDirectForm({...directForm, dateTime: e.target.value})}
                className="w-full border border-gray-200 rounded-xl p-2.5 text-xs focus:border-rose-500 outline-none transition-all" 
              />
            </div>
            <div>
              <label className="text-[10px] font-mono font-bold text-gray-400 uppercase block mb-1">Priority</label>
              <select 
                value={directForm.priority} 
                onChange={e => setDirectForm({...directForm, priority: e.target.value})}
                className="w-full border border-gray-200 rounded-xl p-2.5 text-xs focus:border-rose-500 outline-none transition-all bg-white"
              >
                <option value="Normal">Normal / Routine</option>
                <option value="Urgent">Urgent</option>
                <option value="Emergency">Critical / Emergency</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-mono font-bold text-gray-400 uppercase block mb-1">Department</label>
              <select 
                value={directForm.department} 
                onChange={e => setDirectForm({...directForm, department: e.target.value})}
                className="w-full border border-gray-200 rounded-xl p-2.5 text-xs focus:border-rose-500 outline-none transition-all bg-white"
              >
                <option value="General Medicine">General Medicine</option>
                <option value="Cardiology">Cardiology</option>
                <option value="Pediatrics">Pediatrics</option>
                <option value="Neurology">Neurology</option>
                <option value="Orthopedics">Orthopedics</option>
              </select>
            </div>
            <div className="md:col-span-3">
              <label className="text-[10px] font-mono font-bold text-gray-400 uppercase block mb-1">Intake Complaint & Reason</label>
              <input 
                required 
                value={directForm.reason} 
                onChange={e => setDirectForm({...directForm, reason: e.target.value})}
                className="w-full border border-gray-200 rounded-xl p-2.5 text-xs focus:border-rose-500 outline-none transition-all" 
                placeholder="Chief medical complaints or symptoms"
              />
            </div>
            <div className="md:col-span-4 flex justify-end space-x-2 pt-2 border-t border-gray-50">
              <button 
                type="button" 
                onClick={() => setShowDirectForm(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-gray-500 hover:bg-gray-50 transition-all"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="bg-rose-500 text-white font-bold px-6 py-2 rounded-xl text-xs hover:bg-rose-600 transition-all"
              >
                Confirm Booking
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Main workflow sub-navigation tabs */}
      <div className="flex border-b border-gray-100 bg-white p-1 rounded-2xl shadow-sm max-w-lg">
        <button
          onClick={() => setSubTab('requests')}
          className={`flex-1 py-3 text-xs font-bold rounded-xl transition-all flex items-center justify-center space-x-2 ${
            subTab === 'requests' 
              ? 'bg-rose-500 text-white shadow-md' 
              : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          <span>Pending Requests</span>
          {pendingRequests.length > 0 && (
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${subTab === 'requests' ? 'bg-white text-rose-500' : 'bg-rose-100 text-rose-500'}`}>
              {pendingRequests.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setSubTab('confirmed')}
          className={`flex-1 py-3 text-xs font-bold rounded-xl transition-all flex items-center justify-center space-x-2 ${
            subTab === 'confirmed' 
              ? 'bg-rose-500 text-white shadow-md' 
              : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          <span>Confirmed Schedule</span>
        </button>
        <button
          onClick={() => setSubTab('history')}
          className={`flex-1 py-3 text-xs font-bold rounded-xl transition-all flex items-center justify-center space-x-2 ${
            subTab === 'history' 
              ? 'bg-rose-500 text-white shadow-md' 
              : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          <span>Archive</span>
        </button>
      </div>

      {/* RENDER VIEW: PENDING REQUESTS WORKFLOW */}
      {subTab === 'requests' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Left panel: List of pending requests */}
          <div className="lg:col-span-5 space-y-3">
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider px-1">Unprocessed Patient Submissions</h4>
            
            {pendingRequests.length > 0 ? (
              pendingRequests.map((app) => (
                <div 
                  key={app.id}
                  onClick={() => setSelectedApp(app)}
                  className={`border p-5 rounded-2xl cursor-pointer transition-all ${
                    selectedApp?.id === app.id 
                      ? 'border-rose-500 bg-rose-50/20 shadow-md shadow-rose-100/20' 
                      : 'border-gray-100 bg-white hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-rose-500">
                        <User className="h-5 w-5" />
                      </div>
                      <div>
                        <h5 className="font-bold text-gray-900 text-sm">{app.patient?.name}</h5>
                        <p className="text-[10px] text-gray-400 flex items-center mt-1">
                          <CalendarIcon className="h-3 w-3 mr-1 text-gray-300" />
                          Requested: {new Date(app.dateTime).toLocaleDateString()}
                          <span className="mx-1.5">•</span>
                          {new Date(app.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                    <span className="bg-amber-50 text-amber-600 border border-amber-100 px-2.5 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase">
                      Pending Review
                    </span>
                  </div>
                  <div className="mt-3 text-xs text-gray-500 font-medium">
                    <span className="text-[10px] font-mono font-bold text-gray-400 uppercase block mb-1">Reason for consultation</span>
                    <p className="line-clamp-2 bg-gray-50 p-2.5 rounded-xl border border-gray-100/50 italic text-[11px]">{app.reason}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-white border border-gray-100 rounded-3xl p-16 text-center shadow-sm">
                <Inbox className="h-10 w-10 text-gray-200 mx-auto mb-3" />
                <h5 className="text-gray-900 font-bold text-sm">Perfect Clearance</h5>
                <p className="text-xs text-gray-400 mt-1">All pending patient requests have been coordinated</p>
              </div>
            )}
          </div>

          {/* Right panel: Active review & workflow decision card */}
          <div className="lg:col-span-7">
            {selectedApp ? (
              <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm space-y-6">
                
                {/* Header info */}
                <div className="flex items-center justify-between border-b border-gray-50 pb-4">
                  <div>
                    <span className="text-[9px] font-mono font-bold bg-rose-50 text-rose-500 px-2.5 py-1 rounded-full uppercase tracking-wider">Active Review</span>
                    <h3 className="font-display font-bold text-gray-900 text-base mt-2">Request ID: {selectedApp.id.substring(0, 8)}</h3>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-gray-900">{selectedApp.patient?.name}</p>
                    <p className="text-[10px] text-gray-400">Preferred Dept: <span className="font-semibold text-rose-500">{selectedApp.department || 'General Medicine'}</span></p>
                  </div>
                </div>

                {/* Patient complaints */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                    <span className="text-[9px] font-mono font-bold text-gray-400 uppercase block mb-1">Chief Complaint</span>
                    <p className="text-xs font-semibold text-gray-700">{selectedApp.reason}</p>
                  </div>
                  <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                    <span className="text-[9px] font-mono font-bold text-gray-400 uppercase block mb-1">Patient Comments / Notes</span>
                    <p className="text-xs text-gray-500 italic">{selectedApp.notes || 'No supporting files or custom comments attached.'}</p>
                  </div>
                </div>

                {/* Real Hospital Assignment Form */}
                <div className="border-t border-gray-50 pt-5 space-y-4">
                  <h4 className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                    <ClipboardList className="h-4 w-4 text-rose-500" />
                    Receptionist Intake Assignment & Schedule Validation
                  </h4>

                  {!isRejecting ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      
                      <div>
                        <label className="text-[10px] font-mono font-bold text-gray-400 uppercase block mb-1.5">1. Assign Qualified Physician *</label>
                        <select 
                          required 
                          value={assignDoctorId} 
                          onChange={e => setAssignDoctorId(e.target.value)}
                          className="w-full border border-gray-200 rounded-xl p-2.5 text-xs focus:border-rose-500 outline-none transition-all bg-white font-medium text-gray-700"
                        >
                          <option value="">-- Assign Doctor --</option>
                          {doctors.map(d => (
                            <option key={d.id} value={d.id}>Dr. {d.name} ({d.department || 'General'})</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="text-[10px] font-mono font-bold text-gray-400 uppercase block mb-1.5">2. Confirmed Department</label>
                        <select 
                          value={assignDept} 
                          onChange={e => setAssignDept(e.target.value)}
                          className="w-full border border-gray-200 rounded-xl p-2.5 text-xs focus:border-rose-500 outline-none transition-all bg-white font-medium text-gray-700"
                        >
                          <option value="General Medicine">General Medicine</option>
                          <option value="Cardiology">Cardiology</option>
                          <option value="Pediatrics">Pediatrics</option>
                          <option value="Neurology">Neurology</option>
                          <option value="Orthopedics">Orthopedics</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-[10px] font-mono font-bold text-gray-400 uppercase block mb-1.5">3. Room / Consultation Area</label>
                        <input 
                          type="text" 
                          placeholder="e.g. Consultation Room 204"
                          value={assignRoom}
                          onChange={e => setAssignRoom(e.target.value)}
                          className="w-full border border-gray-200 rounded-xl p-2.5 text-xs focus:border-rose-500 outline-none transition-all font-medium text-gray-700"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-mono font-bold text-gray-400 uppercase block mb-1.5">4. Urgency Priority Level</label>
                        <select 
                          value={assignPriority} 
                          onChange={e => setAssignPriority(e.target.value)}
                          className="w-full border border-gray-200 rounded-xl p-2.5 text-xs focus:border-rose-500 outline-none transition-all bg-white font-medium text-gray-700"
                        >
                          <option value="Normal">Normal</option>
                          <option value="Urgent">Urgent</option>
                          <option value="Emergency">Emergency</option>
                        </select>
                      </div>

                      <div className="md:col-span-2">
                        <label className="text-[10px] font-mono font-bold text-gray-400 uppercase block mb-1.5">5. Confirmed Appointment Slot *</label>
                        <input 
                          type="datetime-local" 
                          value={assignDateTime}
                          onChange={e => setAssignDateTime(e.target.value)}
                          className="w-full border border-gray-200 rounded-xl p-2.5 text-xs focus:border-rose-500 outline-none transition-all font-semibold text-gray-700"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="text-[10px] font-mono font-bold text-gray-400 uppercase block mb-1.5">6. Internal Coordination Notes (Optional)</label>
                        <textarea 
                          rows={2}
                          placeholder="Add clinical coordination notes (e.g. requires wheelchair, needs pre-vitals check)"
                          value={internalNotes}
                          onChange={e => setInternalNotes(e.target.value)}
                          className="w-full border border-gray-200 rounded-xl p-2.5 text-xs focus:border-rose-500 outline-none transition-all font-medium text-gray-700"
                        />
                      </div>

                      {/* Finalize action triggers */}
                      <div className="md:col-span-2 flex justify-between pt-4 border-t border-gray-50">
                        <button 
                          type="button"
                          onClick={() => setIsRejecting(true)}
                          className="px-5 py-2.5 rounded-xl border border-gray-200 text-rose-500 font-bold text-xs hover:bg-rose-50/30 flex items-center gap-1.5 transition-colors"
                        >
                          <Ban className="h-4 w-4" />
                          Reject Request
                        </button>
                        <button 
                          type="button"
                          onClick={handleApprove}
                          className="bg-gray-900 hover:bg-black text-white px-7 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-md"
                        >
                          <Check className="h-4 w-4" />
                          Approve and Confirm
                        </button>
                      </div>

                    </div>
                  ) : (
                    // Rejection Mode UI Flow
                    <div className="space-y-4 bg-rose-50/10 p-5 border border-rose-100 rounded-2xl">
                      <div>
                        <label className="text-[10px] font-mono font-bold text-rose-500 uppercase block mb-1.5">Rejection Reason *</label>
                        <textarea 
                          rows={3}
                          required
                          placeholder="Provide a clear clinical reason why this request cannot be approved (e.g. clinic fully booked, please select another department, patient needs immediate emergency services)..."
                          value={rejectionReason}
                          onChange={e => setRejectionReason(e.target.value)}
                          className="w-full border border-rose-200 rounded-xl p-3 text-xs focus:border-rose-500 outline-none transition-all bg-white text-gray-700"
                        />
                      </div>
                      <div className="flex justify-end space-x-2">
                        <button 
                          type="button" 
                          onClick={() => setIsRejecting(false)}
                          className="px-4 py-2 rounded-xl text-xs font-bold text-gray-500 hover:bg-gray-100 transition-colors"
                        >
                          Cancel
                        </button>
                        <button 
                          type="button" 
                          onClick={handleReject}
                          className="bg-rose-500 text-white font-bold px-6 py-2 rounded-xl text-xs hover:bg-rose-600 transition-colors shadow-md"
                        >
                          Confirm Rejection
                        </button>
                      </div>
                    </div>
                  )}

                </div>

              </div>
            ) : (
              <div className="bg-white border border-gray-50 rounded-3xl p-24 text-center text-gray-300">
                <FileText className="h-12 w-12 mx-auto text-gray-200 mb-3" />
                <h5 className="font-bold text-gray-400">Select a patient request to review</h5>
                <p className="text-xs text-gray-400 mt-1">Review, approve, reject, or assign doctors and rooms</p>
              </div>
            )}
          </div>

        </div>
      )}

      {/* RENDER VIEW: CONFIRMED ACTIVE SCHEDULE */}
      {subTab === 'confirmed' && (
        <div className="space-y-6">
          
          {/* Confirmed filters */}
          <div className="bg-white border border-gray-100 rounded-3xl p-4 flex flex-wrap items-center justify-between gap-4 shadow-sm">
            <div className="flex items-center space-x-3 flex-1 min-w-[280px]">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-300" />
                <input 
                  type="text" 
                  placeholder="Filter confirmed by patient name, physician..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-gray-50 rounded-xl text-xs border-none outline-none transition-all"
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <input 
                type="date" 
                value={filterDate} 
                onChange={e => setFilterDate(e.target.value)}
                className="text-xs font-semibold text-gray-600 bg-gray-50 border border-gray-100 rounded-xl px-3 py-2 outline-none" 
              />
            </div>
          </div>

          {/* Active list */}
          <div className="grid grid-cols-1 gap-4">
            {confirmedSchedule.length > 0 ? (
              confirmedSchedule.map((app) => (
                <div key={app.id} className="group bg-white border border-gray-100 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all">
                  <div className="flex flex-wrap items-center justify-between gap-6">
                    
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center group-hover:bg-rose-50 transition-colors">
                        <User className="h-5 w-5 text-gray-400 group-hover:text-rose-500" />
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900 text-sm">{app.patient?.name}</h4>
                        <p className="text-[10px] text-gray-400 flex items-center mt-1">
                          <Clock className="h-3 w-3 mr-1" />
                          {new Date(app.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          <span className="mx-2">•</span>
                          Priority: 
                          <span className={`ml-1 font-semibold ${
                            app.priority === 'Emergency' ? 'text-rose-500' :
                            app.priority === 'Urgent' ? 'text-amber-500' : 'text-gray-500'
                          }`}>
                            {app.priority || 'Normal'}
                          </span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-8">
                      <div>
                        <p className="text-[9px] font-mono font-bold text-gray-400 uppercase tracking-wider mb-1">Physician</p>
                        <div className="flex items-center space-x-2 text-xs font-semibold text-gray-700">
                          <Stethoscope className="h-4 w-4 text-rose-400" />
                          <span>Dr. {app.doctor?.name || 'Unassigned'}</span>
                        </div>
                      </div>
                      <div>
                        <p className="text-[9px] font-mono font-bold text-gray-400 uppercase tracking-wider mb-1">Department & Room</p>
                        <div className="flex items-center space-x-2 text-xs font-semibold text-gray-700">
                          <MapPin className="h-4 w-4 text-indigo-400" />
                          <span>{app.department || 'Medicine'} {app.consultationRoom ? `(${app.consultationRoom})` : ''}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4">
                      <span className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        app.status === 'WAITING' || app.status === 'Checked-In'
                          ? 'bg-amber-50 text-amber-600 border border-amber-100' 
                          : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                      }`}>
                        {app.status === 'WAITING' ? 'Waiting in Queue' : app.status}
                      </span>
                      
                      <div className="flex items-center space-x-1.5">
                        {app.status?.toUpperCase() === 'CONFIRMED' && (
                          <button 
                            onClick={() => handleTriageCheckIn(app.id)}
                            className="text-xs font-bold px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-100/70 transition-all flex items-center space-x-1"
                            title="Check-In Patient and Generate Queue Token"
                          >
                            <CheckCircle className="h-4 w-4" />
                            <span>Check-In</span>
                          </button>
                        )}
                        <button 
                          onClick={() => handleGeneralStatus(app.id, 'CANCELLED')}
                          className="p-2 bg-rose-50 text-rose-500 rounded-xl hover:bg-rose-100 transition-all"
                          title="Cancel Booking"
                        >
                          <XCircle className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                  </div>
                </div>
              ))
            ) : (
              <div className="bg-white border border-gray-100 rounded-3xl p-16 text-center shadow-sm">
                <CalendarIcon className="h-10 w-10 text-gray-200 mx-auto mb-3" />
                <h4 className="text-gray-900 font-bold text-sm">No scheduled items</h4>
                <p className="text-xs text-gray-400 mt-1">No confirmed patients found for {new Date(filterDate).toLocaleDateString()}</p>
              </div>
            )}
          </div>

        </div>
      )}

      {/* RENDER VIEW: ARCHIVE / HISTORY */}
      {subTab === 'history' && (
        <div className="space-y-4">
          <div className="bg-white border border-gray-100 rounded-3xl p-4 flex flex-wrap items-center justify-between gap-4 shadow-sm">
            <div className="relative flex-1 min-w-[280px]">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-300" />
              <input 
                type="text" 
                placeholder="Search archive..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-50 rounded-xl text-xs border-none outline-none transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {historySchedule.length > 0 ? (
              historySchedule.map((app) => (
                <div key={app.id} className="bg-white border border-gray-50 rounded-2xl p-5 flex items-center justify-between text-xs">
                  <div>
                    <h5 className="font-bold text-gray-900">{app.patient?.name}</h5>
                    <p className="text-gray-400 mt-1">Type: {app.type || 'Consultation'} • Slot: {new Date(app.dateTime).toLocaleString()}</p>
                    {app.rejectionReason && (
                      <p className="text-rose-500 mt-1 font-semibold">Rejected Reason: {app.rejectionReason}</p>
                    )}
                  </div>
                  <span className={`px-3 py-1 rounded-full font-bold uppercase tracking-wider text-[9px] ${
                    app.status?.toUpperCase() === 'COMPLETED' ? 'bg-emerald-50 text-emerald-600' :
                    app.status?.toUpperCase() === 'REJECTED' ? 'bg-rose-50 text-rose-600' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {app.status}
                  </span>
                </div>
              ))
            ) : (
              <div className="bg-white border border-gray-50 rounded-2xl p-12 text-center text-gray-300">
                No archived appointments found.
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
