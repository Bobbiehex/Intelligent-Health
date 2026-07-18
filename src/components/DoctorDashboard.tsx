import React, { useState, useEffect } from 'react';
import { 
  Users, Activity, ClipboardList, PlusCircle, AlertCircle, Sparkles, 
  Search, ShieldAlert, Heart, RefreshCw, Send, CheckCircle2, 
  ChevronRight, BookOpen, FileText, LayoutDashboard, Stethoscope, 
  Pill, History, BarChart3, User as UserIcon, Menu, X, MessageSquare
} from 'lucide-react';
import { User, Appointment } from '../types';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';
import DoctorOverview from './doctor/DoctorOverview';
import PatientList from './doctor/PatientList';
import ConsultationModule from './doctor/ConsultationModule';
import PrescriptionModule from './doctor/PrescriptionModule';
import PatientTimeline from './doctor/PatientTimeline';
import DoctorAnalytics from './doctor/DoctorAnalytics';
import DoctorProfile from './doctor/DoctorProfile';
import DoctorMessages from './doctor/DoctorMessages';
import { useSWR, registerSseListener } from '../utils/apiClient';

interface DoctorDashboardProps {
  user: any;
  token: string;
}

type DashboardView = 'overview' | 'patients' | 'consultation' | 'prescriptions' | 'messages' | 'analytics' | 'profile';

export default function DoctorDashboard({ user, token }: DoctorDashboardProps) {
  const [activeView, setActiveView] = useState<DashboardView>('overview');
  const [selectedPatient, setSelectedPatient] = useState<User | null>(null);
  const [activeConsultation, setActiveConsultation] = useState<any | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [completedPatient, setCompletedPatient] = useState<User | null>(null);

  const { data: dashboardData, mutate: mutateStats } = useSWR<any>(
    '/api/dashboard-summary',
    { token }
  );

  const { data: queueItems, mutate: mutateQueue } = useSWR<any[]>(
    '/api/doctor/queue',
    { token }
  );

  const { data: patientsData, isLoading: loading, mutate: mutatePatients } = useSWR<User[]>(
    '/api/doctor/patients',
    { token }
  );

  useEffect(() => {
    const unsubscribe = registerSseListener(() => {
      mutateStats();
      mutateQueue();
      mutatePatients();
    });
    return () => unsubscribe();
  }, [mutateStats, mutateQueue, mutatePatients]);

  useEffect(() => {
    const checkActiveConsultation = async () => {
      try {
        const res = await fetch('/api/doctor/consultations/active', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          if (data && data.patient) {
            setActiveConsultation(data);
            setSelectedPatient(data.patient);
            setActiveView('consultation');
            // toast.info(`Resuming active consultation with ${data.patient.name}`);
          }
        }
      } catch (error) {
        console.error('Failed to check active consultation:', error);
      }
    };
    checkActiveConsultation();
  }, [token]);

  const stats = dashboardData?.doctor || {
    todayAppointments: 0,
    upcomingAppointments: 0,
    completedConsultations: 0,
    pendingConsultations: 0,
    assignedPatients: 0,
    labResults: 0,
    labRequests: 0,
    aiRecommendations: 0
  };

  const patients = patientsData || [];
  const queue = queueItems || [];

  const getNextPatientInQueue = () => {
    // Find the first patient in queue who is 'Waiting' or 'Accepted'
    const nextInQueue = queue.find(item => item.status === 'Accepted' || item.status === 'Waiting');
    if (!nextInQueue) return null;
    
    // Find full patient object
    return patients.find(p => p.id === nextInQueue.patientId);
  };

  const nextPatient = getNextPatientInQueue();

  const navItems = [
    { id: 'overview', label: 'Dashboard', icon: <LayoutDashboard /> },
    { id: 'consultation', label: 'Consultation', icon: <Stethoscope />, disabled: !selectedPatient },
    { id: 'prescriptions', label: 'Prescriptions', icon: <Pill />, disabled: !selectedPatient },
    { id: 'messages', label: 'Chats & Messages', icon: <MessageSquare /> },
    { id: 'analytics', label: 'Analytics', icon: <BarChart3 /> },
    { id: 'profile', label: 'My Profile', icon: <UserIcon /> },
  ];

  const handleStartConsultation = async (patient: any) => {
    try {
      const res = await fetch('/api/doctor/consultations/start', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ patientId: patient.id })
      });
      if (res.ok) {
        setCompletedPatient(null);
        setSelectedPatient(patient);
        setActiveView('consultation');
        toast.success(`Consultation started with ${patient.name}`);
      } else {
        toast.error('Failed to start consultation.');
      }
    } catch (error) {
      toast.error('Error starting consultation.');
    }
  };

  const handleConsultationComplete = () => {
    mutateStats();
    mutateQueue();
    setActiveConsultation(null);
    setCompletedPatient(selectedPatient);
    setSelectedPatient(null);
    setActiveView('overview');
  };

  const renderView = () => {
    switch (activeView) {
      case 'overview': return (
        <div className="space-y-6">
          {completedPatient && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-emerald-50 border border-emerald-100 p-6 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-6"
            >
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 bg-emerald-100 rounded-2xl flex items-center justify-center text-emerald-600">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-bold text-emerald-900">Encounter Concluded Successfully</h3>
                  <p className="text-xs text-emerald-700">Record for {completedPatient.name} has been archived.</p>
                </div>
              </div>

              {nextPatient ? (
                <div className="flex items-center gap-4 bg-white/50 p-3 rounded-2xl border border-emerald-200/50">
                  <div className="text-right">
                    <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Up Next</p>
                    <p className="text-sm font-bold text-gray-900">{nextPatient.name}</p>
                  </div>
                  <button 
                    onClick={() => handleStartConsultation(nextPatient)}
                    className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-md hover:bg-indigo-700 transition-all flex items-center gap-2"
                  >
                    <span>Start Consultation</span>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <p className="text-xs text-emerald-600 font-medium italic">No further patients in queue.</p>
              )}
            </motion.div>
          )}

          <DoctorOverview 
            stats={stats} 
            queue={queue} 
            activeConsultation={activeConsultation}
            onStartConsultation={handleStartConsultation}
            onResumeConsultation={() => setActiveView('consultation')}
          />
        </div>
      );
      case 'patients': return (
        <div className="flex flex-col lg:grid lg:grid-cols-12 gap-8 lg:flex-1 lg:h-full">
          <div className="lg:col-span-4 lg:h-full h-[60vh]">
            <PatientList 
              patients={patients} 
              onSelectPatient={(p) => {
                setCompletedPatient(null);
                setSelectedPatient(p);
                setActiveView('consultation');
              }} 
              loading={loading} 
            />
          </div>
          <div className="lg:col-span-8 lg:h-full h-[60vh]">
            {selectedPatient ? (
              <PatientTimeline patientId={selectedPatient.id} token={token} />
            ) : (
              <div className="bg-white rounded-3xl border border-dashed border-gray-100 flex flex-col items-center justify-center text-center p-12 text-gray-400 h-full">
                <Users className="h-12 w-12 mb-4 opacity-20" />
                <p className="text-sm">Select a patient from the list to view their full medical timeline.</p>
              </div>
            )}
          </div>
        </div>
      );
      case 'consultation': return selectedPatient ? (
        <ConsultationModule 
          patient={selectedPatient} 
          token={token} 
          onConsultationComplete={handleConsultationComplete}
        />
      ) : null;
      case 'prescriptions': return selectedPatient ? (
        <PrescriptionModule patientId={selectedPatient.id} token={token} />
      ) : null;
      case 'messages': return (
        <div className="flex-1 w-full h-full flex flex-col">
          <DoctorMessages token={token} user={user} />
        </div>
      );
      case 'analytics': return <DoctorAnalytics />;
      case 'profile': return <DoctorProfile user={user} token={token} />;
      default: return (
        <DoctorOverview 
          stats={stats} 
          queue={queue} 
          activeConsultation={activeConsultation}
          onStartConsultation={handleStartConsultation}
          onResumeConsultation={() => setActiveView('consultation')}
        />
      );
    }
  };

  return (
    <div className="h-full bg-gray-50 flex overflow-hidden w-full">
      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex w-72 bg-white border-r border-gray-100 flex-col sticky top-0 h-full">
        <div className="p-8">
          <div className="flex items-center gap-3 mb-10">
            <div className="h-10 w-10 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-100">
              <Activity className="h-6 w-6" />
            </div>
            <div>
              <h1 className="font-display font-bold text-gray-900 leading-tight">HealthPortal</h1>
              <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest">Doctor Module</p>
            </div>
          </div>

          <nav className="space-y-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => !item.disabled && setActiveView(item.id as DashboardView)}
                disabled={item.disabled}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold transition-all ${
                  activeView === item.id 
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' 
                    : item.disabled
                    ? 'text-gray-300 cursor-not-allowed opacity-50'
                    : 'text-gray-500 hover:bg-gray-50 hover:text-indigo-600'
                }`}
              >
                {React.cloneElement(item.icon as React.ReactElement, { className: 'h-5 w-5' })}
                {item.label}
                {item.id === 'consultation' && selectedPatient && (
                  <span className="ml-auto h-2 w-2 rounded-full bg-emerald-400" />
                )}
              </button>
            ))}
          </nav>
        </div>

        <div className="mt-auto p-8">
          <div className="bg-gray-50 rounded-3xl p-4 flex items-center gap-3 border border-gray-100">
            <div className="h-10 w-10 bg-white rounded-xl flex items-center justify-center text-indigo-600 shadow-sm">
              <UserIcon className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-gray-900 truncate">{user.name}</p>
              <p className="text-[10px] text-gray-400 uppercase font-bold tracking-tight truncate">{user.department || 'Cardiology'}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-gray-100 sticky top-0 z-30 px-4 sm:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden p-2 hover:bg-gray-100 rounded-xl transition-colors"
            >
              <Menu className="h-6 w-6 text-gray-600" />
            </button>
            <div>
              <h2 className="text-sm font-bold text-gray-900">
                {selectedPatient ? `Active Encounter: ${selectedPatient.name}` : 'Clinical Overview'}
              </h2>
              <p className="text-[10px] text-gray-400 font-medium">
                {new Date().toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long' })}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-3 pl-2">
              <div className="text-right">
                <p className="text-xs font-bold text-gray-900 leading-tight">Online</p>
                <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider">Sync Active</p>
              </div>
              <div className="h-10 w-10 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 font-bold">
                {user.name.charAt(0)}
              </div>
            </div>
          </div>
        </header>

        {/* View Content */}
        <div className={`flex-1 ${activeView === 'messages' ? 'p-0' : 'p-4 sm:p-8'} ${activeView === 'messages' ? 'overflow-hidden' : 'overflow-y-auto'} flex flex-col`}>
          {renderView()}
        </div>
      </main>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-72 bg-white p-8 animate-in slide-in-from-left duration-300">
            <div className="flex justify-between items-center mb-10">
              <Activity className="h-8 w-8 text-indigo-600" />
              <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                <X className="h-6 w-6 text-gray-600" />
              </button>
            </div>
            <nav className="space-y-1">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    if (!item.disabled) {
                      setActiveView(item.id as DashboardView);
                      setIsMobileMenuOpen(false);
                    }
                  }}
                  disabled={item.disabled}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold transition-all ${
                    activeView === item.id 
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' 
                      : item.disabled
                      ? 'text-gray-300 cursor-not-allowed opacity-50'
                      : 'text-gray-500 hover:bg-gray-50 hover:text-indigo-600'
                  }`}
                >
                  {React.cloneElement(item.icon as React.ReactElement, { className: 'h-5 w-5' })}
                  {item.label}
                </button>
              ))}
            </nav>
          </div>
        </div>
      )}
    </div>
  );
}
