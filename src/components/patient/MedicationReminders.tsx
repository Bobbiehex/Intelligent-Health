import React, { useState, useEffect } from 'react';
import { 
  Pill, Clock, Calendar, CheckCircle2, AlertCircle, 
  Plus, Bell, BellOff, MoreVertical, Trash2, 
  RotateCcw, ShieldCheck, Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { useSWR } from '../../utils/apiClient';

interface Reminder {
  id: string;
  medicineName: string;
  dosage: string;
  time: string;
  frequency: string;
  isActive: boolean;
  lastTaken: string | null;
  adherenceLogs: { status: string; timestamp: string }[];
}

interface MedicationRemindersProps {
  token: string;
}

export default function MedicationReminders({ token }: MedicationRemindersProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [newReminder, setNewReminder] = useState({
    medicineName: '',
    dosage: '',
    time: '08:00',
    frequency: 'Daily'
  });

  const { data: remindersData, isLoading, mutate } = useSWR<Reminder[]>('/api/patient/medication-reminders', { token });
  const reminders = Array.isArray(remindersData) ? remindersData : [];

  const handleAddReminder = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/patient/medication-reminders', {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newReminder)
      });
      if (res.ok) {
        toast.success('Reminder scheduled successfully');
        setShowAddModal(false);
        setNewReminder({ medicineName: '', dosage: '', time: '08:00', frequency: 'Daily' });
        mutate();
      }
    } catch (error) {
      toast.error('Failed to schedule reminder');
    }
  };

  const handleToggleActive = async (id: string, current: boolean) => {
    try {
      const res = await fetch(`/api/patient/medication-reminders/${id}`, {
        method: 'PATCH',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ isActive: !current })
      });
      if (res.ok) {
        mutate();
        toast.success(current ? 'Reminder muted' : 'Reminder activated');
      }
    } catch (error) {
      toast.error('Failed to update reminder status');
    }
  };

  const handleLogAdherence = async (id: string, status: 'Taken' | 'Missed') => {
    try {
      const res = await fetch(`/api/patient/medication-reminders/${id}/log`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        toast.success(status === 'Taken' ? 'Medication logged as taken' : 'Medication logged as missed');
        mutate();
      }
    } catch (error) {
      toast.error('Failed to log adherence');
    }
  };

  if (isLoading) return null;

  const totalDoses = reminders.reduce((acc, r) => acc + (r.adherenceLogs?.length || 0), 0);
  const takenDoses = reminders.reduce((acc, r) => acc + (r.adherenceLogs?.filter(l => l.status === 'Taken').length || 0), 0);
  const missedDoses = totalDoses - takenDoses;
  const adherenceRate = totalDoses > 0 ? Math.round((takenDoses / totalDoses) * 100) : 100;

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-2xl font-display font-bold text-slate-800">Medication Reminders</h2>
          <p className="text-slate-500 text-sm mt-1">Manage your prescriptions and daily adherence schedule.</p>
        </div>
        
        <button 
          onClick={() => setShowAddModal(true)}
          className="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-bold text-sm shadow-lg shadow-indigo-100 flex items-center justify-center hover:bg-indigo-700 transition-all active:scale-95"
        >
          <Plus size={18} className="mr-2" />
          Schedule New
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          {reminders.length === 0 ? (
            <div className="bg-white rounded-[2.5rem] border border-dashed border-slate-200 p-12 text-center">
              <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300 mx-auto mb-4">
                <Pill size={32} />
              </div>
              <h3 className="text-slate-800 font-bold">No Active Reminders</h3>
              <p className="text-slate-400 text-sm mt-1 max-w-xs mx-auto">
                You haven't scheduled any medication reminders yet. Add one to stay on track with your health.
              </p>
            </div>
          ) : (
            reminders.map((reminder) => (
              <motion.div 
                key={reminder.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className={`bg-white rounded-[2rem] border ${reminder.isActive ? 'border-slate-100' : 'border-slate-50 opacity-60'} p-6 shadow-sm hover:shadow-md transition-all group relative`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-5">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${
                      reminder.isActive ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-50 text-slate-400'
                    } shrink-0`}>
                      <Pill size={24} />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">
                        {reminder.medicineName}
                      </h4>
                      <p className="text-xs text-slate-400 mt-1 flex items-center">
                        <Clock size={12} className="mr-1" />
                        {reminder.time} • {reminder.dosage} • {reminder.frequency}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button 
                      onClick={() => handleToggleActive(reminder.id, reminder.isActive)}
                      className={`p-2 rounded-xl transition-all ${
                        reminder.isActive 
                          ? 'text-indigo-600 hover:bg-indigo-50' 
                          : 'text-slate-400 hover:bg-slate-100'
                      }`}
                    >
                      {reminder.isActive ? <Bell size={18} /> : <BellOff size={18} />}
                    </button>
                    <button className="p-2 text-slate-400 hover:bg-slate-50 rounded-xl transition-all">
                      <MoreVertical size={18} />
                    </button>
                  </div>
                </div>

                {reminder.isActive && (
                  <div className="mt-6 pt-6 border-t border-slate-50 flex flex-wrap items-center gap-4">
                    <button 
                      onClick={() => handleLogAdherence(reminder.id, 'Taken')}
                      className="bg-emerald-50 text-emerald-600 px-5 py-2 rounded-xl text-xs font-bold hover:bg-emerald-100 transition-all flex items-center"
                    >
                      <CheckCircle2 size={14} className="mr-2" />
                      Mark as Taken
                    </button>
                    <button 
                      onClick={() => handleLogAdherence(reminder.id, 'Missed')}
                      className="bg-rose-50 text-rose-600 px-5 py-2 rounded-xl text-xs font-bold hover:bg-rose-100 transition-all flex items-center"
                    >
                      <AlertCircle size={14} className="mr-2" />
                      Missed Dose
                    </button>
                    
                    {reminder.lastTaken && (
                      <span className="text-[10px] font-bold text-slate-300 uppercase ml-auto">
                        Last taken: {new Date(reminder.lastTaken).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}
                  </div>
                )}
              </motion.div>
            ))
          )}
        </div>

        <div className="space-y-8">
          <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-xl shadow-slate-200">
            <h3 className="font-bold flex items-center">
              <ShieldCheck size={20} className="mr-2 text-emerald-400" />
              Adherence Report
            </h3>
            <p className="text-slate-400 text-xs mt-2 leading-relaxed">
              Based on your logs for the last 7 days, your medication adherence is at:
            </p>
            
            <div className="mt-8 relative h-48 flex items-center justify-center">
              <svg className="w-32 h-32 transform -rotate-90">
                <circle
                  cx="64" cy="64" r="58"
                  fill="transparent"
                  stroke="currentColor"
                  strokeWidth="8"
                  className="text-slate-800"
                />
                <circle
                  cx="64" cy="64" r="58"
                  fill="transparent"
                  stroke="currentColor"
                  strokeWidth="8"
                  strokeDasharray={364.4}
                  strokeDashoffset={364.4 * (1 - adherenceRate / 100)}
                  className="text-emerald-500"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold">{adherenceRate}%</span>
                <span className="text-[10px] text-slate-400 uppercase tracking-widest font-mono">
                  {adherenceRate >= 90 ? 'Excellent' : adherenceRate >= 70 ? 'Good' : 'Needs Improvement'}
                </span>
              </div>
            </div>

            <div className="mt-8 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Total Doses</span>
                <span className="font-bold">{totalDoses}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Taken</span>
                <span className="font-bold text-emerald-400">{takenDoses}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Missed</span>
                <span className="font-bold text-rose-400">{missedDoses}</span>
              </div>
            </div>
          </div>

          <div className="bg-indigo-50/50 p-8 rounded-[2.5rem] border border-indigo-100/50">
            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-indigo-600 shadow-sm mb-4">
              <Info size={24} />
            </div>
            <h4 className="font-bold text-slate-800">Clinical Safety</h4>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              If you miss a dose, do not take a double dose to make up for it unless instructed by your physician. 
            </p>
            <button className="mt-4 text-[10px] font-bold text-indigo-600 uppercase tracking-widest hover:underline">
              Read Safety Guide
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddModal(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-[2.5rem] p-8 shadow-2xl overflow-hidden"
            >
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-bold text-slate-800">Schedule Reminder</h3>
                <button 
                  onClick={() => setShowAddModal(false)}
                  className="p-2 hover:bg-slate-50 rounded-xl transition-all"
                >
                  <RotateCcw size={18} className="text-slate-400" />
                </button>
              </div>

              <form onSubmit={handleAddReminder} className="space-y-6">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Medication Name</label>
                  <input 
                    required
                    type="text" 
                    value={newReminder.medicineName}
                    onChange={e => setNewReminder({ ...newReminder, medicineName: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-6 text-sm outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all"
                    placeholder="e.g. Atorvastatin"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Dosage</label>
                    <input 
                      required
                      type="text" 
                      value={newReminder.dosage}
                      onChange={e => setNewReminder({ ...newReminder, dosage: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-6 text-sm outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all"
                      placeholder="e.g. 20mg"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Time</label>
                    <input 
                      required
                      type="time" 
                      value={newReminder.time}
                      onChange={e => setNewReminder({ ...newReminder, time: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-6 text-sm outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Frequency</label>
                  <select 
                    value={newReminder.frequency}
                    onChange={e => setNewReminder({ ...newReminder, frequency: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-6 text-sm outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all"
                  >
                    <option>Daily</option>
                    <option>Every 12 Hours</option>
                    <option>Weekly</option>
                    <option>As Needed</option>
                  </select>
                </div>

                <div className="pt-4 flex gap-4">
                  <button 
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 bg-slate-50 text-slate-500 py-4 rounded-2xl font-bold text-sm hover:bg-slate-100 transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 bg-indigo-600 text-white py-4 rounded-2xl font-bold text-sm shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all"
                  >
                    Schedule Now
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
