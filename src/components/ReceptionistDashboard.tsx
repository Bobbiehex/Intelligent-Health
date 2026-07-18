import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Menu, X } from 'lucide-react';
import Sidebar from './receptionist/Sidebar';
import DashboardOverview from './receptionist/DashboardOverview';
import PatientRegistration from './receptionist/PatientRegistration';
import AppointmentManager from './receptionist/AppointmentManager';
import QueueManager from './receptionist/QueueManager';
import PatientManagement from './receptionist/PatientManagement';
import Reports from './receptionist/Reports';
import Profile from './receptionist/Profile';
import { useSWR, registerSseListener } from '../utils/apiClient';

interface ReceptionistDashboardProps {
  user: any;
  token: string;
}

export default function ReceptionistDashboard({ user, token }: ReceptionistDashboardProps) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const { data: dashboardData, mutate } = useSWR<any>(
    activeTab === 'dashboard' ? '/api/dashboard-summary' : null,
    { token }
  );

  useEffect(() => {
    const unsubscribe = registerSseListener(() => {
      if (activeTab === 'dashboard') {
        mutate();
      }
    });
    return () => unsubscribe();
  }, [activeTab, mutate]);

  const stats = dashboardData?.receptionist?.stats || {
    totalPatients: 0,
    todayAppointments: 0,
    waitingPatients: 0,
    completedToday: 0
  };
  const activities = dashboardData?.receptionist?.recentActivities || [];

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardOverview stats={stats} activities={activities} onTabChange={setActiveTab} />;
      case 'patients':
        return (
          <div className="space-y-8">
            <div className="flex border-b border-gray-100">
              <button 
                onClick={() => setActiveTab('patients')}
                className="px-6 py-3 text-xs font-bold text-rose-500 border-b-2 border-rose-500"
              >
                Directory
              </button>
              <button 
                onClick={() => setActiveTab('registration')}
                className="px-6 py-3 text-xs font-bold text-gray-400 hover:text-gray-600"
              >
                New Registration
              </button>
            </div>
            <PatientManagement token={token} />
          </div>
        );
      case 'registration':
        return (
          <div className="space-y-8">
            <div className="flex border-b border-gray-100">
              <button 
                onClick={() => setActiveTab('patients')}
                className="px-6 py-3 text-xs font-bold text-gray-400 hover:text-gray-600"
              >
                Directory
              </button>
              <button 
                onClick={() => setActiveTab('registration')}
                className="px-6 py-3 text-xs font-bold text-rose-500 border-b-2 border-rose-500"
              >
                New Registration
              </button>
            </div>
            <PatientRegistration token={token} onSuccess={() => setActiveTab('patients')} />
          </div>
        );
      case 'appointments':
        return <AppointmentManager token={token} />;
      case 'queue':
        return <QueueManager token={token} />;
      case 'reports':
        return <Reports token={token} />;
      case 'profile':
        return <Profile user={user} token={token} />;
      default:
        return <DashboardOverview stats={stats} activities={activities} onTabChange={setActiveTab} />;
    }
  };

  return (
    <div className="flex h-full bg-gray-50/30 overflow-hidden">
      <div className="hidden lg:block">
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} userName={user.name} />
      </div>
      
      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 bg-white">
            <Sidebar 
              activeTab={activeTab} 
              setActiveTab={(tab) => {
                setActiveTab(tab);
                setIsMobileMenuOpen(false);
              }} 
              userName={user.name} 
            />
            <button 
              onClick={() => setIsMobileMenuOpen(false)} 
              className="absolute top-4 right-4 p-2 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors"
            >
              <X className="h-5 w-5 text-gray-600" />
            </button>
          </div>
        </div>
      )}

      <main className="flex-1 overflow-y-auto flex flex-col">
        {/* Mobile Header */}
        <header className="lg:hidden bg-white border-b border-gray-100 p-4 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 hover:bg-gray-50 rounded-xl">
              <Menu className="h-5 w-5 text-gray-600" />
            </button>
            <span className="font-bold text-gray-900 text-sm">Reception Desk</span>
          </div>
        </header>

        <div className="p-4 sm:p-8 lg:p-12 flex-1">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              {renderContent()}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
