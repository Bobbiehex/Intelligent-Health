import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  ClipboardList, 
  Pill, 
  Package, 
  ShoppingCart, 
  UserCircle,
  Search,
  LogOut,
  Menu,
  X,
  Bot,
  History as HistoryIcon,
  FileText,
  Settings
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { PharmacyOverview } from './PharmacyOverview';
import { PrescriptionManagement } from './PrescriptionManagement';
import { InventoryManagement } from './InventoryManagement';
import { PurchaseOrders } from './PurchaseOrders';
import { AIPharmacyAssistant } from './AIPharmacyAssistant';

type PharmacyView = 'OVERVIEW' | 'PRESCRIPTIONS' | 'INVENTORY' | 'PURCHASE_ORDERS' | 'AI_ASSISTANT' | 'HISTORY' | 'PROFILE';

interface PharmacistDashboardProps {
  user: any;
  token: string;
}

export const PharmacistDashboard: React.FC<PharmacistDashboardProps> = ({ user, token }) => {
  const [activeView, setActiveView] = useState<PharmacyView>('OVERVIEW');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const navItems = [
    { id: 'OVERVIEW', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'PRESCRIPTIONS', label: 'Prescriptions', icon: ClipboardList },
    { id: 'INVENTORY', label: 'Medicine Stock', icon: Package },
    { id: 'PURCHASE_ORDERS', label: 'Procurement', icon: ShoppingCart },
    { id: 'AI_ASSISTANT', label: 'AI Clinical Assist', icon: Bot },
    { id: 'HISTORY', label: 'Dispense History', icon: HistoryIcon },
  ];

  const renderView = () => {
    switch (activeView) {
      case 'OVERVIEW': return <PharmacyOverview token={token} />;
      case 'PRESCRIPTIONS': return <PrescriptionManagement token={token} user={user} />;
      case 'INVENTORY': return <InventoryManagement token={token} user={user} />;
      case 'PURCHASE_ORDERS': return <PurchaseOrders token={token} user={user} />;
      case 'AI_ASSISTANT': return <AIPharmacyAssistant token={token} user={user} />;
      default: return <PharmacyOverview token={token} />;
    }
  };

  return (
    <div className="flex h-full bg-[#F8FAFC] overflow-hidden font-sans">
      {/* Sidebar Navigation */}
      <AnimatePresence mode="wait">
        {sidebarOpen && (
          <motion.aside 
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 300, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            className="hidden lg:flex bg-white border-r border-slate-200 flex-col h-full z-30 shadow-sm"
          >
            {/* Logo Section */}
            <div className="p-8 flex items-center gap-4">
              <div className="h-10 w-10 bg-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-100 shrink-0">
                <Pill className="h-5 w-5 text-white" />
              </div>
              <div className="min-w-0">
                <h1 className="text-lg font-black text-slate-900 tracking-tight leading-none truncate">IntelliPharmacy</h1>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">AI Care Systems</p>
              </div>
            </div>

            {/* Nav Menu */}
            <nav className="flex-1 px-4 space-y-1.5 overflow-y-auto custom-scrollbar pt-4">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 ml-4">Main Menu</p>
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveView(item.id as PharmacyView)}
                  className={`w-full flex items-center gap-3.5 px-5 py-3.5 rounded-xl font-bold text-sm transition-all group ${
                    activeView === item.id 
                      ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-100' 
                      : 'text-slate-500 hover:bg-slate-50 hover:text-emerald-600'
                  }`}
                >
                  <item.icon className={`h-5 w-5 transition-transform group-hover:scale-110 shrink-0 ${activeView === item.id ? 'text-white' : 'text-slate-400 group-hover:text-emerald-600'}`} />
                  <span className="tracking-tight truncate">{item.label}</span>
                  {activeView === item.id && (
                    <motion.div layoutId="active-pill-pharmacy" className="ml-auto h-1.5 w-1.5 rounded-full bg-white shrink-0" />
                  )}
                </button>
              ))}
            </nav>

            {/* User Footer */}
            <div className="p-6 mt-auto border-t border-slate-100">
              <div className="flex items-center gap-3.5 p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="h-9 w-9 bg-white rounded-lg flex items-center justify-center border border-slate-200 shrink-0">
                  <UserCircle className="h-5 w-5 text-slate-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-slate-900 truncate">{user.name}</p>
                  <p className="text-[9px] font-bold text-emerald-600 uppercase tracking-wider">Pharmacist</p>
                </div>
                <button className="p-2 hover:bg-rose-50 text-slate-300 hover:text-rose-500 rounded-lg transition-all shrink-0">
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
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setSidebarOpen(true)} />
            <motion.div 
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', bounce: 0, duration: 0.3 }}
              className="relative w-72 bg-white h-full shadow-2xl flex flex-col"
            >
              <div className="p-6 flex items-center justify-between border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 bg-emerald-600 rounded-lg flex items-center justify-center shadow-md">
                    <Pill className="h-4 w-4 text-white" />
                  </div>
                  <span className="font-bold text-slate-900 text-sm">IntelliPharmacy</span>
                </div>
                <button onClick={() => setSidebarOpen(true)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-500">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                {navItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveView(item.id as PharmacyView);
                      setSidebarOpen(true);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all ${
                      activeView === item.id 
                        ? 'bg-emerald-50 text-emerald-600' 
                        : 'text-slate-500 hover:bg-slate-50'
                    }`}
                  >
                    <item.icon className={`h-5 w-5 ${activeView === item.id ? 'text-emerald-600' : 'text-slate-400'}`} />
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
        <header className="h-20 bg-white border-b border-slate-200 px-4 sm:px-8 flex items-center justify-between sticky top-0 z-20 shrink-0">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2.5 bg-slate-50 hover:bg-slate-100 rounded-xl transition-all"
            >
              <Menu className="h-5 w-5 text-slate-600" />
            </button>
            <div className="relative group hidden lg:block">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
              <input 
                type="text" 
                placeholder="Search prescriptions, medicines..."
                className="pl-11 pr-6 py-2.5 bg-slate-50 border-none rounded-xl text-xs font-bold text-slate-600 focus:ring-2 focus:ring-emerald-500 outline-none w-64 lg:w-72 transition-all shadow-sm"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <div className="hidden sm:flex bg-slate-50 p-1 rounded-xl">
              <button className="p-2.5 hover:bg-white hover:text-emerald-600 hover:shadow-sm text-slate-400 rounded-lg transition-all">
                <Settings className="h-4 w-4" />
              </button>
            </div>
            <div className="hidden sm:block h-8 w-[1px] bg-slate-200 mx-2" />
            <button className="flex items-center gap-2 px-3 sm:px-5 py-2 sm:py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-[10px] sm:text-xs shadow-md transition-all active:scale-95">
              <FileText className="h-3.5 w-3.5 hidden sm:block" />
              Report
            </button>
          </div>
        </header>

        {/* View Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 custom-scrollbar scroll-smooth">
          <motion.div
            key={activeView}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
          >
            {renderView()}
          </motion.div>
        </div>
      </main>
    </div>
  );
};
