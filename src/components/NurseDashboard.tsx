import React, { useState, useEffect } from 'react';
import { 
  Users, Activity, ClipboardList, PlusCircle, AlertCircle, 
  Search, Heart, RefreshCw, CheckCircle2, ChevronRight, 
  FileText, Pill, LayoutDashboard, DoorOpen, Droplets, 
  Sparkles, Clock, BarChart3, UserCircle, Menu, X
} from 'lucide-react';
import { User, Prescription, VitalsLog } from '../types';
import { toast } from 'sonner';
import { useSWR } from '../utils/apiClient';

// Subcomponents
import NurseOverview from './nurse/NurseOverview';
import PatientRegistry from './nurse/PatientRegistry';
import AdmissionManager from './nurse/AdmissionManager';
import VitalsTracker from './nurse/VitalsTracker';
import NursingAssessment from './nurse/NursingAssessment';
import MedicationAdmin from './nurse/MedicationAdmin';
import NursingNotes from './nurse/NursingNotes';
import IntakeOutputTracker from './nurse/IntakeOutputTracker';
import AINurseAssistant from './nurse/AINurseAssistant';
import ShiftManagement from './nurse/ShiftManagement';
import PatientRegistryDetail from './nurse/PatientRegistryDetail';

interface NurseDashboardProps {
  user: any;
  token: string;
}

type NurseView = 'OVERVIEW' | 'PATIENTS' | 'ADMISSION' | 'VITALS' | 'ASSESSMENT' | 'MEDICATION' | 'INTAKE_OUTPUT' | 'NOTES' | 'AI_ASSIST' | 'SHIFT' | 'ANALYTICS' | 'PROFILE';

export default function NurseDashboard({ user, token }: NurseDashboardProps) {
  const [activeView, setActiveView] = useState<NurseView>('OVERVIEW');
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [selectedPatient, setSelectedPatient] = useState<User | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const { data: dashboardData, mutate: mutateStats } = useSWR<any>(
    '/api/dashboard-summary',
    { token }
  );

  const { data: patientsData, isLoading: loading, mutate: mutatePatients } = useSWR<User[]>(
    '/api/patients',
    { token }
  );

  const stats = dashboardData?.nurse || null;
  const patients = patientsData || [];

  const fetchPatientDetail = async (id: string) => {
    try {
      const res = await fetch(`/api/patients/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSelectedPatient(data);
      }
    } catch (err) {
      console.error('Failed to load patient chart:', err);
    }
  };

  useEffect(() => {
    if (selectedPatientId) {
      fetchPatientDetail(selectedPatientId);
    }
  }, [selectedPatientId]);

  const menuItems = [
    { id: 'OVERVIEW', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'PATIENTS', label: 'Patient Registry', icon: Users },
    { id: 'ADMISSION', label: 'Admission Manager', icon: DoorOpen },
    { id: 'VITALS', label: 'Vital Signs', icon: Activity },
    { id: 'ASSESSMENT', label: 'Nursing Assessment', icon: ClipboardList },
    { id: 'MEDICATION', label: 'Medication Admin', icon: Pill },
    { id: 'INTAKE_OUTPUT', label: 'Intake & Output', icon: Droplets },
    { id: 'NOTES', label: 'Clinical Notes', icon: FileText },
    { id: 'AI_ASSIST', label: 'Nursing AI Assist', icon: Sparkles },
    { id: 'SHIFT', label: 'Shift & Handover', icon: Clock },
    { id: 'ANALYTICS', label: 'Analytics', icon: BarChart3 },
    { id: 'PROFILE', label: 'My Profile', icon: UserCircle },
  ];

  const handlePatientSelect = (id: string) => {
    setSelectedPatientId(id);
    // Stay in PATIENTS view so the nurse can examine the patient file details immediately!
  };

  return (
    <div className="flex h-full bg-[#FAFAFA] overflow-hidden w-full" id="nurse-dashboard-container">
      
      {/* Sidebar Navigation */}
      <aside 
        className={`hidden lg:flex ${sidebarOpen ? 'w-64' : 'w-20'} bg-white border-r border-gray-100 flex-col transition-all duration-300 relative z-20`}
        id="nurse-sidebar"
      >
        <div className="p-6 flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-rose-500 flex items-center justify-center text-white shadow-lg shadow-rose-500/20 shrink-0">
            <Heart className="h-6 w-6" />
          </div>
          {sidebarOpen && (
            <div className="flex flex-col">
              <span className="font-bold text-gray-900 tracking-tight leading-tight">Staff Nurse</span>
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-none mt-0.5">Clinic Portal</span>
            </div>
          )}
        </div>

        <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id as NurseView)}
              className={`w-full flex items-center gap-3 p-3.5 rounded-2xl transition-all group ${
                activeView === item.id 
                  ? 'bg-gray-900 text-white shadow-xl shadow-black/10' 
                  : 'text-gray-400 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <item.icon className={`h-5 w-5 shrink-0 ${activeView === item.id ? 'text-rose-400' : 'group-hover:text-rose-500'}`} />
              {sidebarOpen && <span className="text-xs font-bold tracking-tight">{item.label}</span>}
              {activeView === item.id && sidebarOpen && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)]" />
              )}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-50">
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="w-full flex items-center justify-center p-3 rounded-xl bg-gray-50 text-gray-400 hover:text-gray-600 transition-colors"
          >
            {sidebarOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0">
        
        {/* Top App Bar */}
        <header className="h-20 bg-white border-b border-gray-100 px-4 sm:px-8 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-3 sm:gap-4">
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden p-2 hover:bg-gray-100 rounded-xl transition-colors"
            >
              <Menu className="h-6 w-6 text-gray-600" />
            </button>
            <h2 className="text-sm sm:text-lg font-bold text-gray-900 tracking-tight">
              {menuItems.find(i => i.id === activeView)?.label}
            </h2>
            {selectedPatient && activeView !== 'OVERVIEW' && activeView !== 'PATIENTS' && (
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-rose-50 border border-rose-100 rounded-xl">
                <div className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
                <span className="text-[10px] font-bold text-rose-700 uppercase tracking-widest">
                  Patient: {selectedPatient.name}
                </span>
                <span className="text-[9px] font-mono text-rose-400">({selectedPatient.mrn || selectedPatient.id.slice(0, 8)})</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 sm:gap-6">
            <div className="hidden sm:flex items-center gap-3">
              <div className="text-right">
                <p className="text-xs font-bold text-gray-900 leading-tight">{user.name}</p>
                <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-widest leading-none mt-0.5">Online • Staff Nurse</p>
              </div>
              <div className="h-10 w-10 rounded-2xl bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-400 font-bold text-sm">
                {user.name.charAt(0)}
              </div>
            </div>
          </div>
        </header>

        {/* View Content */}
        <div className={`p-8 ${activeView === 'AI_ASSIST' ? 'overflow-hidden' : 'overflow-y-auto'} flex-1 flex flex-col`}>
          {activeView === 'OVERVIEW' && (
            <NurseOverview stats={stats} loading={loading} />
          )}

          {activeView === 'PATIENTS' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 flex-1 h-full">
              <div className={`${selectedPatientId ? 'lg:col-span-5' : 'lg:col-span-12'} h-full transition-all duration-300`}>
                <PatientRegistry patients={patients} loading={loading} onSelect={handlePatientSelect} />
              </div>
              {selectedPatientId && selectedPatient && (
                <div className="lg:col-span-7 h-full animate-in fade-in slide-in-from-right-8 duration-300">
                  <PatientRegistryDetail 
                    patient={selectedPatient as any} 
                    onClose={() => setSelectedPatientId(null)} 
                  />
                </div>
              )}
            </div>
          )}

          {activeView !== 'OVERVIEW' && activeView !== 'PATIENTS' && activeView !== 'SHIFT' && activeView !== 'ANALYTICS' && activeView !== 'PROFILE' && !selectedPatientId && (
            <div className="h-full flex flex-col items-center justify-center text-center p-12 space-y-4">
              <div className="h-20 w-20 rounded-[2rem] bg-gray-50 border border-gray-100 flex items-center justify-center">
                <Users className="h-10 w-10 text-gray-200" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-800 tracking-tight">No Patient Selected</h3>
                <p className="text-xs text-gray-400 max-w-sm mx-auto mt-1">Please select a patient from the registry to access clinical management modules.</p>
              </div>
              <button 
                onClick={() => setActiveView('PATIENTS')}
                className="bg-gray-900 text-white px-8 py-3 rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:bg-black transition-all shadow-xl shadow-black/10"
              >
                Go to Patient Registry
              </button>
            </div>
          )}

          {selectedPatientId && selectedPatient && (
            <div className={`${activeView === 'AI_ASSIST' ? 'h-full flex-1 flex flex-col' : 'space-y-8'} animate-in fade-in slide-in-from-bottom-4 duration-500`}>
              {activeView === 'ADMISSION' && (
                <AdmissionManager patient={selectedPatient} token={token} onRefresh={() => fetchPatientDetail(selectedPatientId)} />
              )}
              {activeView === 'VITALS' && (
                <VitalsTracker patient={selectedPatient} token={token} onRefresh={() => fetchPatientDetail(selectedPatientId)} />
              )}
              {activeView === 'ASSESSMENT' && (
                <NursingAssessment patientId={selectedPatientId} token={token} onRefresh={() => fetchPatientDetail(selectedPatientId)} />
              )}
              {activeView === 'MEDICATION' && (
                <MedicationAdmin patient={selectedPatient} token={token} onRefresh={() => fetchPatientDetail(selectedPatientId)} />
              )}
              {activeView === 'INTAKE_OUTPUT' && (
                <IntakeOutputTracker patientId={selectedPatientId} token={token} />
              )}
              {activeView === 'NOTES' && (
                <NursingNotes patientId={selectedPatientId} token={token} />
              )}
              {activeView === 'AI_ASSIST' && (
                <AINurseAssistant patient={selectedPatient} token={token} />
              )}
            </div>
          )}

          {activeView === 'SHIFT' && (
            <div className="max-w-3xl mx-auto h-full">
              <ShiftManagement token={token} />
            </div>
          )}

          {(activeView === 'ANALYTICS' || activeView === 'PROFILE') && (
            <div className="h-full flex flex-col items-center justify-center text-center p-12 space-y-4 opacity-50 grayscale">
              <LayoutDashboard className="h-16 w-16 text-gray-200" />
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Module Under Maintenance</h3>
                <p className="text-[10px] text-gray-400 font-medium">This module is currently being optimized for high-performance clinical analytics.</p>
              </div>
            </div>
          )}
        </div>

      </main>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-72 bg-white p-6 overflow-y-auto animate-in slide-in-from-left duration-300">
            <div className="flex justify-between items-center mb-8">
              <div className="flex items-center gap-2">
                <Heart className="h-6 w-6 text-rose-500" />
                <span className="font-bold text-gray-900 text-sm">Staff Nurse</span>
              </div>
              <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                <X className="h-5 w-5 text-gray-600" />
              </button>
            </div>
            <nav className="space-y-1">
              {menuItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveView(item.id as NurseView);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold transition-all ${
                    activeView === item.id 
                      ? 'bg-gray-900 text-white shadow-lg shadow-black/10' 
                      : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <item.icon className={`h-5 w-5 ${activeView === item.id ? 'text-rose-400' : ''}`} />
                  {item.label}
                </button>
              ))}
            </nav>
          </div>
        </div>
      )}

      {/* Global Clinical Disclaimer Overlay (Optional for certain views) */}
      {activeView === 'AI_ASSIST' && (
        <div className="fixed bottom-8 right-8 max-w-xs z-50 pointer-events-none">
          <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl shadow-2xl animate-in zoom-in slide-in-from-right-8">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
              <p className="text-[9px] font-bold text-amber-900 uppercase tracking-tight leading-relaxed">
                Decision Support Only: All AI outputs must be verified by a licensed professional.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
