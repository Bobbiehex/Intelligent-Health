import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  ClipboardList, 
  FlaskConical, 
  Settings, 
  PieChart, 
  UserCircle,
  Search,
  LogOut,
  Microscope,
  Menu,
  X,
  CheckCircle2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { LabOverview } from './LabOverview';
import { RequestQueue } from './RequestQueue';
import { SampleTracking } from './SampleTracking';
import { TestProcessing } from './TestProcessing';
import { ResultVerification } from './ResultVerification';
import { EquipmentManagement } from './EquipmentManagement';

type LabView = 'OVERVIEW' | 'QUEUE' | 'SAMPLES' | 'PROCESSING' | 'VERIFICATION' | 'INSTRUMENTS' | 'ANALYTICS' | 'PROFILE';

interface LaboratoryDashboardProps {
  user: any;
  token: string;
}

export const LaboratoryDashboard: React.FC<LaboratoryDashboardProps> = ({ user, token }) => {
  const [activeView, setActiveView] = useState<LabView>('OVERVIEW');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const navItems = [
    { id: 'OVERVIEW', label: 'Command Center', icon: LayoutDashboard },
    { id: 'QUEUE', label: 'Work Queue', icon: ClipboardList },
    { id: 'SAMPLES', label: 'Specimen Registry', icon: Microscope },
    { id: 'PROCESSING', label: 'Analysis Workspace', icon: FlaskConical },
    { id: 'VERIFICATION', label: 'Result Verification', icon: CheckCircle2 },
    { id: 'INSTRUMENTS', label: 'Instrumentation', icon: Settings },
    { id: 'ANALYTICS', label: 'System Analytics', icon: PieChart },
  ];

  const renderView = () => {
    switch (activeView) {
      case 'OVERVIEW': return <LabOverview />;
      case 'QUEUE': return <RequestQueue />;
      case 'SAMPLES': return <SampleTracking />;
      case 'PROCESSING': return <TestProcessing />;
      case 'VERIFICATION': return <ResultVerification />;
      case 'INSTRUMENTS': return <EquipmentManagement />;
      default: return <LabOverview />;
    }
  };

  return (
    <div className="flex h-full bg-gray-50 overflow-hidden font-sans">
      {/* Sidebar Navigation */}
      <AnimatePresence mode="wait">
        {sidebarOpen && (
          <motion.aside 
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 320, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            className="hidden lg:flex bg-white border-r border-gray-100 flex-col h-full z-30 shadow-2xl shadow-gray-200/50 shrink-0"
          >
            {/* Logo Section */}
            <div className="p-8 pb-12 flex items-center gap-4">
              <div className="h-12 w-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-200 shrink-0">
                <FlaskConical className="h-6 w-6 text-white" />
              </div>
              <div className="min-w-0">
                <h1 className="text-xl font-black text-gray-900 tracking-tight leading-none truncate">IntelliLab</h1>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Smart Diagnostics</p>
              </div>
            </div>

            {/* Nav Menu */}
            <nav className="flex-1 px-4 space-y-2 overflow-y-auto custom-scrollbar">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4 ml-4">Management</p>
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveView(item.id as LabView)}
                  className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-bold text-sm transition-all group ${
                    activeView === item.id 
                      ? 'bg-blue-600 text-white shadow-xl shadow-blue-100' 
                      : 'text-gray-500 hover:bg-gray-50 hover:text-blue-600'
                  }`}
                >
                  <item.icon className={`h-5 w-5 transition-transform group-hover:scale-110 shrink-0 ${activeView === item.id ? 'text-white' : 'text-gray-400 group-hover:text-blue-600'}`} />
                  <span className="tracking-tight truncate">{item.label}</span>
                  {activeView === item.id && (
                    <motion.div layoutId="active-pill" className="ml-auto h-1.5 w-1.5 rounded-full bg-white shadow-sm shrink-0" />
                  )}
                </button>
              ))}
            </nav>

            {/* User Footer */}
            <div className="p-6 mt-auto border-t border-gray-50 bg-gray-50/30">
              <div className="flex items-center gap-4 p-4 bg-white rounded-3xl border border-gray-100 shadow-sm">
                <div className="h-10 w-10 bg-gray-100 rounded-xl flex items-center justify-center shrink-0">
                  <UserCircle className="h-6 w-6 text-gray-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-900 truncate">{user.name}</p>
                  <p className="text-[10px] font-bold text-blue-500 uppercase tracking-wider truncate">{user.role}</p>
                </div>
                <button className="p-2 hover:bg-rose-50 text-gray-300 hover:text-rose-500 rounded-lg transition-all shrink-0">
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {!sidebarOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex">
            <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={() => setSidebarOpen(true)} />
            <motion.div 
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', bounce: 0, duration: 0.3 }}
              className="relative w-72 bg-white h-full shadow-2xl flex flex-col"
            >
              <div className="p-6 flex items-center justify-between border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-md">
                    <FlaskConical className="h-4 w-4 text-white" />
                  </div>
                  <span className="font-bold text-gray-900 text-sm">IntelliLab</span>
                </div>
                <button onClick={() => setSidebarOpen(true)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                {navItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveView(item.id as LabView);
                      setSidebarOpen(true);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all ${
                      activeView === item.id 
                        ? 'bg-blue-50 text-blue-600' 
                        : 'text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    <item.icon className={`h-5 w-5 ${activeView === item.id ? 'text-blue-600' : 'text-gray-400'}`} />
                    <span>{item.label}</span>
                  </button>
                ))}
              </nav>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col relative overflow-hidden min-w-0">
        {/* Top Header Bar */}
        <header className="h-20 sm:h-24 bg-white border-b border-gray-100 px-4 sm:px-10 flex items-center justify-between sticky top-0 z-20 shrink-0">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2.5 sm:p-3 bg-gray-50 hover:bg-gray-100 rounded-xl sm:rounded-2xl transition-all group"
            >
              <Menu className="h-4 w-4 sm:h-5 sm:w-5 text-gray-500" />
            </button>
            <div className="relative group hidden lg:block">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
              <input 
                type="text" 
                placeholder="Universal Search (Ctrl + K)"
                className="pl-12 pr-6 py-3 bg-gray-50 border-none rounded-2xl text-xs font-bold text-gray-600 focus:ring-2 focus:ring-blue-500 outline-none w-64 lg:w-80 transition-all shadow-sm"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <div className="flex bg-gray-50 p-1 rounded-xl sm:rounded-2xl">
              <button 
                onClick={() => setActiveView('PROFILE')}
                className="p-3 hover:bg-white hover:text-blue-600 hover:shadow-sm text-gray-400 rounded-xl transition-all"
              >
                <UserCircle className="h-5 w-5" />
              </button>
            </div>
            <div className="hidden sm:block h-10 w-[1px] bg-gray-100 mx-2" />
            <button className="flex items-center gap-3 px-4 py-2.5 sm:px-6 sm:py-3 bg-gray-900 hover:bg-gray-800 text-white rounded-xl sm:rounded-2xl font-bold text-[10px] sm:text-xs shadow-lg transition-all active:scale-95">
              Report
            </button>
          </div>
        </header>

        {/* View Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-10 custom-scrollbar scroll-smooth">
          <motion.div
            key={activeView}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {renderView()}
          </motion.div>
        </div>
      </main>
    </div>
  );
};
