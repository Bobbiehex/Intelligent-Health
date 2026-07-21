import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, User, Calendar, Clipboard, MessageSquare, 
  BookOpen, LineChart, Shield, LogOut, Search, Menu, X, Sparkles, Pill, Activity, Phone
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { User as UserType, QueueItem } from '../../types';
import { registerSseListener } from '../../utils/apiClient';
import PatientOverview from './PatientOverview';
import PatientProfile from './PatientProfile';
import AppointmentManagement from './AppointmentManagement';
import MedicalRecords from './MedicalRecords';
import SecureMessaging from './SecureMessaging';
import EducationLibrary from './EducationLibrary';
import HealthAnalytics from './HealthAnalytics';
import MedicationReminders from './MedicationReminders';
import AIAssistant from './AIAssistant';

interface PatientDashboardProps {
  user: UserType;
  token: string;
}

export default function PatientDashboard({ user, token }: PatientDashboardProps) {
  const [activeTab, setActiveTab] = useState(() => localStorage.getItem('patientDashboard_activeTab') || 'overview');
  
  useEffect(() => {
    localStorage.setItem('patientDashboard_activeTab', activeTab);
  }, [activeTab]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [hiddenQueueIds, setHiddenQueueIds] = useState<string[]>([]);

  const [activeQueueItem, setActiveQueueItem] = useState<QueueItem | null>(null);
  const [acceptingCall, setAcceptingCall] = useState(false);
  const [actingOnAbsent, setActingOnAbsent] = useState(false);

  const fetchQueueStatus = async () => {
    try {
      const res = await fetch(`/api/patients/${user.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setActiveQueueItem(data.activeQueueItem || null);
      }
    } catch (err) {
      console.error('Failed to fetch patient queue status:', err);
    }
  };

  useEffect(() => {
    fetchQueueStatus();
    const unsubscribe = registerSseListener(() => {
      fetchQueueStatus();
    });
    return () => unsubscribe();
  }, [user.id]);

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
      fetchQueueStatus();
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
      fetchQueueStatus();
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
      fetchQueueStatus();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setActingOnAbsent(false);
    }
  };

  const menuItems = [
    { id: 'overview', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'appointments', label: 'Appointments', icon: Calendar },
    { id: 'records', label: 'Medical Records', icon: Clipboard },
    { id: 'medication', label: 'Medication Reminders', icon: Pill },
    { id: 'assistant', label: 'AI Health Assistant', icon: Sparkles },
    { id: 'analytics', label: 'Health Analytics', icon: LineChart },
    { id: 'messages', label: 'Messages', icon: MessageSquare },
    { id: 'library', label: 'Health Library', icon: BookOpen },
    { id: 'profile', label: 'Personal Profile', icon: User },
  ];

  return (
    <div className="flex flex-1 w-full h-full min-h-0 bg-[#F8FAFC] overflow-hidden">
      {/* Sidebar */}
      <aside 
        className={`hidden lg:flex ${
          isSidebarOpen ? 'w-64' : 'w-20'
        } bg-white border-r border-slate-200 transition-all duration-300 flex-col z-50`}
      >
        <div className="p-6 flex items-center justify-between border-b border-slate-100">
          {isSidebarOpen && (
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                <Shield className="text-white w-5 h-5" />
              </div>
              <span className="font-display font-bold text-slate-800 tracking-tight">PatientPortal</span>
            </div>
          )}
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 hover:bg-slate-50 rounded-lg transition-colors text-slate-400"
          >
            {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center ${
                  isSidebarOpen ? 'px-4' : 'justify-center'
                } py-3 rounded-xl transition-all duration-200 ${
                  isActive 
                    ? 'bg-indigo-50 text-indigo-600 shadow-sm' 
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                }`}
              >
                <Icon size={20} className={isActive ? 'text-indigo-600' : ''} />
                {isSidebarOpen && <span className="ml-3 font-medium text-sm">{item.label}</span>}
                {isActive && isSidebarOpen && (
                  <motion.div 
                    layoutId="activeTab"
                    className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-600"
                  />
                )}
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-100 space-y-2">
          {isSidebarOpen && (
            <div className="px-4 py-3 bg-slate-50 rounded-2xl mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold text-xs uppercase">
                  {user.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-800 truncate">{user.name}</p>
                  <p className="text-[10px] text-slate-400 font-mono tracking-wider uppercase">PATIENT ID: {user.patientId || 'Pending'}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full min-h-0 overflow-hidden relative">
        {/* Header */}
        <header className="h-20 bg-white border-b border-slate-200 px-4 sm:px-8 flex items-center justify-between sticky top-0 z-40">
          <div className="flex items-center gap-3 w-full max-w-md">
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden p-2 hover:bg-slate-50 rounded-lg text-slate-500 transition-colors"
            >
              <Menu size={24} />
            </button>
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input 
                type="text" 
                placeholder="Search records..." 
                className="w-full bg-slate-50 border-none rounded-2xl py-2.5 pl-11 pr-4 text-sm focus:ring-2 focus:ring-indigo-500/20 transition-all outline-none"
              />
            </div>
          </div>

          <div className="flex items-center space-x-2 sm:space-x-4">
            <div className="flex items-center space-x-3">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-bold text-slate-800">{user.name}</p>
                <p className="text-[10px] text-slate-400 font-medium">Standard Plan</p>
              </div>
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-slate-100 rounded-2xl flex items-center justify-center text-indigo-600 font-bold shadow-sm text-xs sm:text-base">
                {user.name.charAt(0)}
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className={`flex-1 ${activeTab === 'messages' || activeTab === 'assistant' ? 'overflow-hidden' : 'overflow-y-auto'} bg-[#F8FAFC] flex flex-col min-h-0`}>
          <div className={`${activeTab === 'messages' || activeTab === 'assistant' ? 'p-0 w-full' : 'p-4 sm:p-8 lg:p-12 w-full max-w-7xl'} mx-auto flex-1 flex flex-col min-h-0`}>
            
            {/* Real-time Queue Alert when being called, accepted, in consultation, or absent */}
            {activeQueueItem && !hiddenQueueIds.includes(activeQueueItem.id) && (
              <div className={`shrink-0 mb-4 sm:mb-8 p-4 sm:p-6 rounded-2xl sm:rounded-3xl border shadow-lg relative overflow-hidden transition-all duration-300 ${
                activeTab === 'messages' || activeTab === 'assistant' ? 'mx-4 sm:mx-8 mt-4 sm:mt-8' : ''
              } ${
                activeQueueItem.status === 'Calling'
                  ? 'bg-rose-50 border-rose-100 text-rose-900 animate-pulse'
                  : activeQueueItem.status === 'Accepted'
                  ? 'bg-emerald-50 border-emerald-100 text-emerald-900'
                  : activeQueueItem.status === 'With Doctor'
                  ? 'bg-indigo-50 border-indigo-100 text-indigo-900'
                  : activeQueueItem.status === 'Absent'
                  ? 'bg-amber-50 border-amber-100 text-amber-900'
                  : 'bg-indigo-50 border-indigo-100 text-indigo-900'
              }`}>
                <div className="absolute top-4 right-4 z-20">
                  <button 
                    onClick={() => setHiddenQueueIds(prev => [...prev, activeQueueItem.id])}
                    className="p-2 text-slate-400 hover:text-slate-600 hover:bg-white/50 rounded-full transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 z-10 relative">
                  <div className="flex items-start space-x-4">
                    <div className={`h-12 w-12 rounded-2xl flex items-center justify-center shrink-0 ${
                      activeQueueItem.status === 'Calling'
                        ? 'bg-rose-500 text-white animate-bounce'
                        : activeQueueItem.status === 'Accepted'
                        ? 'bg-emerald-500 text-white'
                        : activeQueueItem.status === 'With Doctor'
                        ? 'bg-indigo-500 text-white'
                        : activeQueueItem.status === 'Absent'
                        ? 'bg-amber-500 text-white'
                        : 'bg-indigo-500 text-white'
                    }`}>
                      <Activity className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="font-display font-extrabold text-base tracking-tight">
                        {activeQueueItem.status === 'Calling' && '🔔 Consultation Call: Action Required'}
                        {activeQueueItem.status === 'Accepted' && '✅ Call Accepted'}
                        {activeQueueItem.status === 'With Doctor' && '🩺 In Consultation with Doctor'}
                        {activeQueueItem.status === 'Absent' && '⚠️ Marked as Absent'}
                        {activeQueueItem.status === 'Waiting' && '⏳ You are in the Queue'}
                        {activeQueueItem.status === 'Completed' && '✅ Consultation Concluded'}
                      </h3>
                      <p className="text-sm mt-1 opacity-90">
                        {activeQueueItem.status === 'Calling' && (
                          <div className="mt-4 space-y-4">
                            <p className="text-sm opacity-90 leading-relaxed">
                              You are being called for your appointment with <strong>Dr. {activeQueueItem.doctorName}</strong> in the <strong>{activeQueueItem.department} Wing</strong>. Please accept below to notify the clinical team.
                            </p>
                            <div className="flex gap-3">
                              <button
                                onClick={() => handleAcceptCall(activeQueueItem.id)}
                                disabled={acceptingCall}
                                className="flex-1 bg-white text-indigo-600 font-bold py-3.5 rounded-2xl shadow-lg hover:bg-indigo-50 transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
                              >
                                {acceptingCall ? (
                                  <div className="animate-spin h-4 w-4 border-2 border-indigo-600 border-t-transparent rounded-full" />
                                ) : (
                                  <>
                                    <Phone className="h-4 w-4" />
                                    <span>Accept & Join Consultation</span>
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        )}
                        {activeQueueItem.status === 'Accepted' && (
                          <>
                            Thank you! Please proceed immediately to <strong>{activeQueueItem.department} Wing</strong>. <strong>Dr. {activeQueueItem.doctorName}</strong> is expecting you.
                          </>
                        )}
                        {activeQueueItem.status === 'With Doctor' && (
                          <>
                            You are currently in consultation with <strong>Dr. {activeQueueItem.doctorName}</strong>.
                          </>
                        )}
                        {activeQueueItem.status === 'Absent' && (
                          <>
                            You were marked as absent when called. You can <strong>re-book</strong> your spot to get a new queue number, or <strong>cancel</strong> the appointment.
                          </>
                        )}
                        {activeQueueItem.status === 'Waiting' && (
                          <>
                            Your token number is <strong>#{activeQueueItem.tokenNumber}</strong>. Please wait in the waiting lounge until you are called.
                          </>
                        )}
                        {activeQueueItem.status === 'Completed' && (
                          <>
                            Your consultation with <strong>Dr. {activeQueueItem.doctorName}</strong> has finished. Please check your medical records for updates.
                          </>
                        )}
                      </p>
                      <div className="mt-2 text-xs font-mono font-semibold opacity-75">
                        Token: #{activeQueueItem.tokenNumber} • Status: {activeQueueItem.status.toUpperCase()}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 shrink-0 self-start sm:self-center">
                    {activeQueueItem.status === 'Calling' && (
                      <button
                        type="button"
                        disabled={acceptingCall}
                        onClick={() => handleAcceptCall(activeQueueItem.id)}
                        className="bg-rose-600 hover:bg-rose-700 text-white font-bold px-6 py-3 rounded-2xl transition-all shadow-md hover:shadow-lg disabled:opacity-50 cursor-pointer text-sm"
                      >
                        {acceptingCall ? 'Accepting...' : 'Accept Call'}
                      </button>
                    )}
                    {activeQueueItem.status === 'Absent' && (
                      <>
                        <button
                          type="button"
                          disabled={actingOnAbsent}
                          onClick={() => handleRebookCall(activeQueueItem.id)}
                          className="bg-amber-600 hover:bg-amber-700 text-white font-bold px-5 py-2.5 rounded-2xl transition-all shadow-sm hover:shadow-md disabled:opacity-50 cursor-pointer text-xs"
                        >
                          {actingOnAbsent ? 'Re-booking...' : 'Re-book Spot'}
                        </button>
                        <button
                          type="button"
                          disabled={actingOnAbsent}
                          onClick={() => handleCancelQueue(activeQueueItem.id)}
                          className="bg-rose-600 hover:bg-rose-700 text-white font-bold px-5 py-2.5 rounded-2xl transition-all shadow-sm hover:shadow-md disabled:opacity-50 cursor-pointer text-xs"
                        >
                          {actingOnAbsent ? 'Cancelling...' : 'Cancel Appt'}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}

            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className={`${activeTab === 'messages' || activeTab === 'assistant' ? 'pb-0' : 'pb-12'} flex-1 flex flex-col w-full h-full min-h-0`}
              >
                {activeTab === 'overview' && <PatientOverview user={user} token={token} onTabChange={setActiveTab} />}
                {activeTab === 'appointments' && <AppointmentManagement user={user} token={token} />}
                {activeTab === 'records' && <MedicalRecords user={user} token={token} />}
                {activeTab === 'medication' && <MedicationReminders token={token} />}
                {activeTab === 'assistant' && <AIAssistant user={user} token={token} />}
                {activeTab === 'analytics' && <HealthAnalytics user={user} token={token} />}
                {activeTab === 'messages' && (
                  <div className="flex-1 w-full h-full flex flex-col">
                    <SecureMessaging user={user} token={token} />
                  </div>
                )}
                {activeTab === 'library' && <EducationLibrary user={user} token={token} />}
                {activeTab === 'profile' && <PatientProfile user={user} token={token} />}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </main>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-72 bg-white p-6 overflow-y-auto animate-in slide-in-from-left duration-300">
            <div className="flex justify-between items-center mb-8">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                  <Shield className="text-white w-5 h-5" />
                </div>
                <span className="font-display font-bold text-slate-800 tracking-tight">PatientPortal</span>
              </div>
              <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
                <X className="h-5 w-5 text-slate-600" />
              </button>
            </div>
            <nav className="space-y-1">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center px-4 py-3 rounded-xl transition-all duration-200 ${
                      isActive 
                        ? 'bg-indigo-50 text-indigo-600 shadow-sm' 
                        : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                    }`}
                  >
                    <Icon size={20} className={isActive ? 'text-indigo-600' : ''} />
                    <span className="ml-3 font-medium text-sm">{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>
      )}
    </div>
  );
}
