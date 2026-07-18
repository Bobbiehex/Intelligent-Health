import React from 'react';
import { 
  LayoutDashboard, Users, Calendar, Ticket, 
  FileText, UserCircle, LogOut, Settings 
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  userName: string;
}

export default function Sidebar({ activeTab, setActiveTab, userName }: SidebarProps) {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'patients', label: 'Patients', icon: Users },
    { id: 'appointments', label: 'Appointments', icon: Calendar },
    { id: 'queue', label: 'Live Queue', icon: Ticket },
    { id: 'reports', label: 'Reports', icon: FileText },
    { id: 'profile', label: 'My Profile', icon: UserCircle },
  ];

  return (
    <div className="w-64 bg-white border-r border-gray-100 flex flex-col h-full">
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 bg-rose-500 rounded-xl flex items-center justify-center">
            <span className="text-white font-bold">HC</span>
          </div>
          <div>
            <h1 className="font-display font-bold text-gray-900 text-sm">HealthClinic</h1>
            <p className="text-[10px] text-gray-400 font-mono">RECEPTION DESK</p>
          </div>
        </div>
        
        <div className="bg-gray-50 rounded-2xl p-4">
          <p className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-wider mb-1">Logged In As</p>
          <p className="text-xs font-semibold text-gray-700 truncate">{userName}</p>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                isActive 
                  ? 'bg-rose-50 text-rose-600 font-semibold shadow-sm' 
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
              }`}
            >
              <Icon className={`h-5 w-5 ${isActive ? 'text-rose-600' : 'text-gray-400'}`} />
              <span className="text-sm">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-100">
        <button className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-gray-500 hover:bg-rose-50 hover:text-rose-600 transition-all duration-200">
          <LogOut className="h-5 w-5" />
          <span className="text-sm">Sign Out</span>
        </button>
      </div>
    </div>
  );
}
