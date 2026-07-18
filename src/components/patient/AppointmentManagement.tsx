import React, { useState, useEffect } from 'react';
import { 
  Calendar, Clock, User, Briefcase, Plus, Search, 
  ChevronRight, AlertCircle, CheckCircle2, XCircle, MoreVertical
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { Appointment } from '../../types';

interface AppointmentManagementProps {
  user: any;
  token: string;
}

export default function AppointmentManagement({ user, token }: AppointmentManagementProps) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBooking, setShowBooking] = useState(false);

  // Booking Form State
  const [formData, setFormData] = useState({
    doctorId: '',
    dateTime: '',
    reason: '',
    department: '',
    type: 'Consultation'
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, [token]);

  const fetchData = async () => {
    try {
      const [appRes, docRes] = await Promise.all([
        fetch('/api/patient/appointments', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/patient/doctors', { headers: { 'Authorization': `Bearer ${token}` } })
      ]);
      const appData = await appRes.json();
      const docData = await docRes.json();
      setAppointments(appData);
      setDoctors(docData);
    } catch (error) {
      toast.error('Failed to load appointments');
    } finally {
      setLoading(false);
    }
  };

  const handleBook = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const response = await fetch('/api/patient/appointments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Booking failed');
      }
      toast.success('Appointment booked successfully!');
      setShowBooking(false);
      setFormData({ doctorId: '', dateTime: '', reason: '', department: '', type: 'Consultation' });
      fetchData();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const cancelAppointment = async (id: string) => {
    if (!confirm('Are you sure you want to cancel this appointment?')) return;
    try {
      const response = await fetch(`/api/patient/appointments/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: 'Cancelled' })
      });
      if (!response.ok) throw new Error('Cancellation failed');
      toast.success('Appointment cancelled');
      fetchData();
    } catch (error) {
      toast.error('Failed to cancel appointment');
    }
  };

  if (loading) return null;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-display font-bold text-slate-800 tracking-tight">Appointment Management</h2>
          <p className="text-slate-500 text-sm mt-1">Book and manage your clinical consultations.</p>
        </div>
        <button 
          onClick={() => setShowBooking(true)}
          className="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-bold flex items-center space-x-2 shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all"
        >
          <Plus size={18} />
          <span>New Appointment</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Appointments List */}
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-white p-4 rounded-3xl border border-slate-100 flex items-center space-x-4 mb-6">
            <Search className="text-slate-400 ml-2" size={18} />
            <input 
              type="text" 
              placeholder="Filter by doctor or department..." 
              className="flex-1 bg-transparent border-none text-sm outline-none focus:ring-0"
            />
          </div>

          <AnimatePresence mode="popLayout">
            {appointments.length > 0 ? appointments.map((app) => (
              <motion.div 
                layout
                key={app.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center justify-between group hover:border-indigo-100 transition-all"
              >
                <div className="flex items-center space-x-6">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-colors ${
                    app.status === 'Confirmed' ? 'bg-emerald-50 text-emerald-600' : 
                    app.status === 'Cancelled' ? 'bg-rose-50 text-rose-600' :
                    'bg-slate-50 text-slate-400'
                  }`}>
                    <Calendar size={24} />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h4 className="font-bold text-slate-800">Dr. {app.doctor?.name}</h4>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">• {app.doctor?.department}</span>
                    </div>
                    <div className="flex items-center space-x-4 mt-2">
                      <div className="flex items-center text-xs text-slate-500 font-medium">
                        <Clock size={14} className="mr-1.5 text-indigo-500" />
                        {new Date(app.dateTime).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                      </div>
                      <div className="flex items-center text-xs text-slate-500 font-medium">
                        <Briefcase size={14} className="mr-1.5 text-indigo-500" />
                        {app.reason}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <div className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest border ${
                    app.status === 'Confirmed' ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 
                    app.status === 'Cancelled' ? 'bg-rose-50 border-rose-100 text-rose-600' :
                    'bg-slate-50 border-slate-100 text-slate-500'
                  }`}>
                    {app.status}
                  </div>
                  
                  {app.status === 'Pending' && (
                    <button 
                      onClick={() => cancelAppointment(app.id)}
                      className="p-2.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                    >
                      <XCircle size={18} />
                    </button>
                  )}
                </div>
              </motion.div>
            )) : (
              <div className="text-center py-20 bg-white rounded-[3rem] border border-slate-100 border-dashed">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                  <Calendar size={32} />
                </div>
                <h3 className="text-slate-800 font-bold">No Appointments Found</h3>
                <p className="text-slate-400 text-sm mt-1">Book your first consultation to get started.</p>
              </div>
            )}
          </AnimatePresence>
        </div>

        {/* Sidebar Info */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-indigo-600 p-8 rounded-[2.5rem] text-white shadow-xl shadow-indigo-100">
            <h3 className="text-lg font-bold">Booking Policies</h3>
            <ul className="mt-6 space-y-4 text-sm opacity-90">
              <li className="flex items-start space-x-3">
                <CheckCircle2 size={16} className="mt-0.5" />
                <span>Cancellations must be made 24h in advance.</span>
              </li>
              <li className="flex items-start space-x-3">
                <CheckCircle2 size={16} className="mt-0.5" />
                <span>Confirmations are sent via SMS and Email.</span>
              </li>
              <li className="flex items-start space-x-3">
                <CheckCircle2 size={16} className="mt-0.5" />
                <span>Telemedicine links active 10min before.</span>
              </li>
            </ul>
          </div>

          <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
            <h4 className="text-sm font-bold text-slate-800 mb-4 flex items-center space-x-2">
              <AlertCircle size={16} className="text-indigo-500" />
              <span>Available Departments</span>
            </h4>
            <div className="flex flex-wrap gap-2">
              {['Cardiology', 'Neurology', 'Pediatrics', 'Dental', 'Eye Care', 'Pharmacy'].map(dept => (
                <span key={dept} className="px-3 py-1.5 bg-slate-50 text-slate-600 text-[10px] font-bold rounded-lg border border-slate-100">
                  {dept}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Booking Modal */}
      <AnimatePresence>
        {showBooking && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden"
            >
              <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <h3 className="text-xl font-bold text-slate-800">Book Appointment</h3>
                <button 
                  onClick={() => setShowBooking(false)}
                  className="p-2 hover:bg-white rounded-xl text-slate-400 transition-all"
                >
                  <XCircle size={20} />
                </button>
              </div>

              <form onSubmit={handleBook} className="p-8 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Department</label>
                    <select 
                      required
                      className="w-full bg-slate-50 border-none rounded-2xl py-3 px-4 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20"
                      onChange={(e) => setFormData({...formData, department: e.target.value})}
                    >
                      <option value="">Select Dept</option>
                      {['Cardiology', 'Neurology', 'Pediatrics', 'General'].map(d => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Doctor</label>
                    <select 
                      required
                      value={formData.doctorId}
                      className="w-full bg-slate-50 border-none rounded-2xl py-3 px-4 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20"
                      onChange={(e) => setFormData({...formData, doctorId: e.target.value})}
                    >
                      <option value="">Select Doctor</option>
                      {doctors.filter(d => !formData.department || d.department === formData.department).map(d => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Preferred Date & Time</label>
                  <input 
                    required
                    type="datetime-local" 
                    className="w-full bg-slate-50 border-none rounded-2xl py-3 px-4 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20"
                    onChange={(e) => setFormData({...formData, dateTime: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Reason for visit</label>
                  <textarea 
                    required
                    rows={3}
                    placeholder="Describe your symptoms or reason for consultation..."
                    className="w-full bg-slate-50 border-none rounded-2xl py-3 px-4 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 resize-none"
                    onChange={(e) => setFormData({...formData, reason: e.target.value})}
                  />
                </div>

                <div className="flex gap-4 pt-4">
                  <button 
                    type="button"
                    onClick={() => setShowBooking(false)}
                    className="flex-1 py-4 bg-slate-100 text-slate-600 font-bold rounded-2xl hover:bg-slate-200 transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    disabled={submitting}
                    className="flex-[2] py-4 bg-indigo-600 text-white font-bold rounded-2xl shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all disabled:opacity-50"
                  >
                    {submitting ? 'Confirming...' : 'Confirm Appointment'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
