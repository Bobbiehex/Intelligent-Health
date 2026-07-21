import React, { useState, useEffect } from 'react';
import { 
  Activity, Users, Shield, Calendar, Building, ShieldCheck, Megaphone, Settings, Database, Sparkles, RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';

// Import Modular Tabs
import ExecutiveTab from './admin/ExecutiveTab';
import UsersTab from './admin/UsersTab';
import StaffTab from './admin/StaffTab';
import PatientsTab from './admin/PatientsTab';
import DepartmentsTab from './admin/DepartmentsTab';
import AppointmentsTab from './admin/AppointmentsTab';
import ResourcesTab from './admin/ResourcesTab';
import AiRlTab from './admin/AiRlTab';
import BroadcastTab from './admin/BroadcastTab';
import SettingsTab from './admin/SettingsTab';
import SecurityBackupTab from './admin/SecurityBackupTab';

interface AdminDashboardProps {
  user: any;
  token: string;
}

type AdminTab = 
  | 'executive'
  | 'users'
  | 'staff'
  | 'patients'
  | 'departments'
  | 'appointments'
  | 'resources'
  | 'ai_rl'
  | 'broadcast'
  | 'settings'
  | 'security_backup';

export default function AdminDashboard({ user, token }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<AdminTab>(() => (localStorage.getItem('adminDashboard_activeTab') as AdminTab) || 'executive');
  
  useEffect(() => {
    localStorage.setItem('adminDashboard_activeTab', activeTab);
  }, [activeTab]);
  const [stats, setStats] = useState<any>(null);
  const [loadingStats, setLoadingStats] = useState(true);
  
  const [usersList, setUsersList] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  const [staffList, setStaffList] = useState<any[]>([]);
  const [loadingStaff, setLoadingStaff] = useState(false);

  const [patientsList, setPatientsList] = useState<any[]>([]);
  const [loadingPatients, setLoadingPatients] = useState(false);

  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loadingAudits, setLoadingAudits] = useState(false);

  useEffect(() => {
    // Initial fetch
    fetchStats();
    fetchUsers();
    fetchStaff();
    fetchPatients();
    fetchAuditLogs();

    // Setup Server-Sent Events (SSE) for Real-Time synchronization
    const sseUrl = `/api/admin/realtime-stream?token=${token}`;
    const eventSource = new EventSource(sseUrl);

    eventSource.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data);
        console.log('Real-Time Admin Sync Event received:', parsed);
        
        // Dynamic re-fetch stats & audits on any state updates
        fetchStats();
        fetchAuditLogs();
        
        // Toast notifications for alerts or major actions
        if (parsed.type === 'AUDIT_LOG_CREATED' && parsed.data?.severity === 'High') {
          toast.warning(`Security Warning: ${parsed.data.action} by ${parsed.data.userName}`);
        }
      } catch (err) {
        console.error('Failed to parse real-time event packet:', err);
      }
    };

    return () => {
      eventSource.close();
    };
  }, [token]);

  const fetchStats = async () => {
    setLoadingStats(true);
    try {
      const res = await fetch('/api/admin/dashboard-stats', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (err) {
      console.error('Failed to fetch dashboard stats:', err);
    } finally {
      setLoadingStats(false);
    }
  };

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const res = await fetch('/api/admin/users', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUsersList(data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingUsers(false);
    }
  };

  const fetchStaff = async () => {
    setLoadingStaff(true);
    try {
      const res = await fetch('/api/admin/staff', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setStaffList(data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingStaff(false);
    }
  };

  const fetchPatients = async () => {
    setLoadingPatients(true);
    try {
      const res = await fetch('/api/admin/patients', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setPatientsList(data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingPatients(false);
    }
  };

  const fetchAuditLogs = async () => {
    setLoadingAudits(true);
    try {
      const res = await fetch('/api/admin/audit-logs', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setAuditLogs(data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAudits(false);
    }
  };

  const handlePurgeAuditLogs = async () => {
    const confirmed = confirm('Are you absolutely sure you want to permanently purge all security audit trails? This is irreversible.');
    if (!confirmed) return;

    try {
      const res = await fetch('/api/admin/audit-logs', {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!res.ok) throw new Error('Purge failed');

      toast.success('HIPAA Compliance audit logs purged!');
      fetchAuditLogs();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleRefreshAll = () => {
    fetchStats();
    fetchUsers();
    fetchStaff();
    fetchPatients();
    fetchAuditLogs();
    toast.info('Synchronising hospital systems state...');
  };

  // Extract doctors for department assignment
  const doctorsOnly = staffList.filter(s => s.role === 'DOCTOR');

  return (
    <div className="h-full overflow-y-auto overflow-x-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* suite header */}
      <div className="bg-white border border-gray-100 p-6 rounded-3xl shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="text-[10px] font-mono text-gray-400 uppercase tracking-widest block">Chief Administrative Officer Suite</span>
          <h2 className="font-display font-bold text-gray-900 text-lg">Intelligent Healthcare Administration Platform</h2>
          <p className="text-xs text-gray-400 mt-0.5">Welcome, {user.name} • Master command and control center</p>
        </div>
        
        <div className="flex space-x-2 shrink-0">
          <button 
            onClick={handleRefreshAll}
            className="bg-gray-50 border border-gray-100 p-2.5 rounded-xl hover:bg-gray-100 text-gray-600 transition-colors cursor-pointer flex items-center space-x-1"
            title="Refresh All Registries"
          >
            <RefreshCw className="h-4 w-4" />
            <span className="text-xs font-bold font-mono">SYNC</span>
          </button>
        </div>
      </div>

      {/* Tabs Menu Navigation */}
      <div className="flex border-b border-gray-100 gap-1 overflow-x-auto pb-0.5 no-scrollbar scroll-smooth">
        <button
          onClick={() => setActiveTab('executive')}
          className={`pb-3 text-xs font-semibold transition-all px-3 flex items-center space-x-2 border-b-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'executive' ? 'border-rose-500 text-rose-500 font-bold' : 'border-transparent text-gray-400 hover:text-gray-600'
          }`}
        >
          <Activity className="h-3.5 w-3.5" />
          <span>Executive Dashboard</span>
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`pb-3 text-xs font-semibold transition-all px-3 flex items-center space-x-2 border-b-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'users' ? 'border-rose-500 text-rose-500 font-bold' : 'border-transparent text-gray-400 hover:text-gray-600'
          }`}
        >
          <Users className="h-3.5 w-3.5" />
          <span>User Directory</span>
        </button>

        <button
          onClick={() => setActiveTab('staff')}
          className={`pb-3 text-xs font-semibold transition-all px-3 flex items-center space-x-2 border-b-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'staff' ? 'border-rose-500 text-rose-500 font-bold' : 'border-transparent text-gray-400 hover:text-gray-600'
          }`}
        >
          <ShieldCheck className="h-3.5 w-3.5" />
          <span>Staff Scheduling</span>
        </button>

        <button
          onClick={() => setActiveTab('patients')}
          className={`pb-3 text-xs font-semibold transition-all px-3 flex items-center space-x-2 border-b-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'patients' ? 'border-rose-500 text-rose-500 font-bold' : 'border-transparent text-gray-400 hover:text-gray-600'
          }`}
        >
          <Users className="h-3.5 w-3.5" />
          <span>Patient Registry</span>
        </button>

        <button
          onClick={() => setActiveTab('departments')}
          className={`pb-3 text-xs font-semibold transition-all px-3 flex items-center space-x-2 border-b-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'departments' ? 'border-rose-500 text-rose-500 font-bold' : 'border-transparent text-gray-400 hover:text-gray-600'
          }`}
        >
          <Building className="h-3.5 w-3.5" />
          <span>Departments</span>
        </button>

        <button
          onClick={() => setActiveTab('appointments')}
          className={`pb-3 text-xs font-semibold transition-all px-3 flex items-center space-x-2 border-b-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'appointments' ? 'border-rose-500 text-rose-500 font-bold' : 'border-transparent text-gray-400 hover:text-gray-600'
          }`}
        >
          <Calendar className="h-3.5 w-3.5" />
          <span>Appointments</span>
        </button>

        <button
          onClick={() => setActiveTab('resources')}
          className={`pb-3 text-xs font-semibold transition-all px-3 flex items-center space-x-2 border-b-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'resources' ? 'border-rose-500 text-rose-500 font-bold' : 'border-transparent text-gray-400 hover:text-gray-600'
          }`}
        >
          <Building className="h-3.5 w-3.5" />
          <span>Resource Assets</span>
        </button>

        <button
          onClick={() => setActiveTab('ai_rl')}
          className={`pb-3 text-xs font-semibold transition-all px-3 flex items-center space-x-2 border-b-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'ai_rl' ? 'border-rose-500 text-rose-500 font-bold' : 'border-transparent text-gray-400 hover:text-gray-600'
          }`}
        >
          <Sparkles className="h-3.5 w-3.5" />
          <span>AI & RL Performance</span>
        </button>

        <button
          onClick={() => setActiveTab('broadcast')}
          className={`pb-3 text-xs font-semibold transition-all px-3 flex items-center space-x-2 border-b-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'broadcast' ? 'border-rose-500 text-rose-500 font-bold' : 'border-transparent text-gray-400 hover:text-gray-600'
          }`}
        >
          <Megaphone className="h-3.5 w-3.5" />
          <span>Broadcasting</span>
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={`pb-3 text-xs font-semibold transition-all px-3 flex items-center space-x-2 border-b-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'settings' ? 'border-rose-500 text-rose-500 font-bold' : 'border-transparent text-gray-400 hover:text-gray-600'
          }`}
        >
          <Settings className="h-3.5 w-3.5" />
          <span>Settings</span>
        </button>

        <button
          onClick={() => setActiveTab('security_backup')}
          className={`pb-3 text-xs font-semibold transition-all px-3 flex items-center space-x-2 border-b-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'security_backup' ? 'border-rose-500 text-rose-500 font-bold' : 'border-transparent text-gray-400 hover:text-gray-600'
          }`}
        >
          <Database className="h-3.5 w-3.5" />
          <span>Security & Backup</span>
        </button>
      </div>

      {/* Render selected views */}
      <div className="space-y-6">
        {activeTab === 'executive' && (
          <ExecutiveTab 
            stats={stats} 
            loading={loadingStats} 
            onRefresh={fetchStats} 
          />
        )}

        {activeTab === 'users' && (
          <UsersTab 
            users={usersList} 
            currentUser={user} 
            token={token} 
            onRefresh={fetchUsers} 
          />
        )}

        {activeTab === 'staff' && (
          <StaffTab 
            staff={staffList} 
            token={token} 
            onRefresh={fetchStaff} 
          />
        )}

        {activeTab === 'patients' && (
          <PatientsTab 
            patients={patientsList} 
            token={token} 
            onRefresh={fetchPatients} 
          />
        )}

        {activeTab === 'departments' && (
          <DepartmentsTab 
            token={token} 
            doctors={doctorsOnly} 
          />
        )}

        {activeTab === 'appointments' && (
          <AppointmentsTab 
            token={token} 
          />
        )}

        {activeTab === 'resources' && (
          <ResourcesTab 
            token={token} 
          />
        )}

        {activeTab === 'ai_rl' && stats && (
          <AiRlTab 
            token={token} 
            stats={stats} 
          />
        )}

        {activeTab === 'broadcast' && (
          <BroadcastTab 
            token={token} 
          />
        )}

        {activeTab === 'settings' && (
          <SettingsTab 
            token={token} 
          />
        )}

        {activeTab === 'security_backup' && (
          <SecurityBackupTab 
            token={token} 
            auditLogs={auditLogs} 
            onRefreshAudit={fetchAuditLogs} 
            onPurgeAudit={handlePurgeAuditLogs} 
          />
        )}
      </div>
    </div>
    </div>
  );
}
