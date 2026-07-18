import React, { useState, useEffect } from 'react';
import { 
  LogOut, HeartPulse, ShieldAlert, User as UserIcon, Bell, 
  Calendar, Activity, Sparkles, AlertTriangle, CheckCheck, Inbox 
} from 'lucide-react';
import { User, Notification } from '../types';
import { registerSseListener } from '../utils/apiClient';

interface NavbarProps {
  user: User;
  token: string;
  onLogout: () => void;
}

export default function Navbar({ user, token, onLogout }: NavbarProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isNotifOpen, setIsNotifOpen] = useState(false);

  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/notifications', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const res = await fetch('/api/notifications/mark-read', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      }
    } catch (error) {
      console.error('Failed to mark notifications as read:', error);
    }
  };

  useEffect(() => {
    if (token) {
      fetchNotifications();
      const unsubscribe = registerSseListener(() => {
        fetchNotifications();
      });
      return () => unsubscribe();
    }
  }, [token]);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'DOCTOR': return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'PATIENT': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'RECEPTIONIST': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'PHARMACIST': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'LABORATORY': return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'ADMIN': return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'NURSE': return 'bg-teal-50 text-teal-700 border-teal-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getNotifIcon = (type: string) => {
    switch (type) {
      case 'Appointment':
        return <Calendar className="h-4 w-4 text-indigo-500" />;
      case 'Lab':
      case 'Radiology':
        return <Activity className="h-4 w-4 text-emerald-500" />;
      case 'Emergency':
        return <AlertTriangle className="h-4 w-4 text-rose-500" />;
      case 'AI':
        return <Sparkles className="h-4 w-4 text-amber-500" />;
      default:
        return <Bell className="h-4 w-4 text-slate-500" />;
    }
  };

  const getNotifColor = (type: string, isRead: boolean) => {
    if (isRead) return 'bg-slate-50';
    switch (type) {
      case 'Appointment': return 'bg-indigo-50/70 border-l-4 border-indigo-500';
      case 'Lab':
      case 'Radiology': return 'bg-emerald-50/70 border-l-4 border-emerald-500';
      case 'Emergency': return 'bg-rose-50/70 border-l-4 border-rose-500';
      case 'AI': return 'bg-amber-50/70 border-l-4 border-amber-500';
      default: return 'bg-slate-50 border-l-4 border-slate-400';
    }
  };

  return (
    <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <div className="bg-rose-500 text-white p-2 rounded-xl shadow-sm">
              <HeartPulse className="h-6 w-6" />
            </div>
            <div>
              <span className="font-display font-bold text-lg tracking-tight text-gray-900 block">Intelligent Health</span>
              <span className="text-xs font-mono text-gray-400 -mt-1 block">CLINICAL SUITE V1.0</span>
            </div>
          </div>

          {/* User Status / Notification / Logout */}
          <div className="flex items-center space-x-4">
            
            {/* Real-time Notification Dropdown */}
            <div className="lg:relative">
              <button
                onClick={() => setIsNotifOpen(!isNotifOpen)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl relative transition-all duration-200"
                title="Notifications"
                id="btn-notifications-toggle"
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 bg-rose-500 text-white rounded-full text-[9px] font-extrabold h-4.5 w-4.5 flex items-center justify-center border border-white animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </button>

              {isNotifOpen && (
                <>
                  {/* Backdrop overlay to close when clicking outside */}
                  <div 
                    className="fixed inset-0 z-30" 
                    onClick={() => setIsNotifOpen(false)}
                  />
                  
                  <div className="absolute left-4 right-4 lg:left-auto lg:right-0 mt-2 w-auto lg:w-96 max-w-md mx-auto lg:mx-0 bg-white border border-slate-100 rounded-2xl shadow-xl z-40 flex flex-col max-h-[480px] overflow-hidden animate-in fade-in-50 slide-in-from-top-2 duration-200">
                    {/* Header */}
                    <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-sm text-slate-800">Notifications</span>
                        {unreadCount > 0 && (
                          <span className="bg-rose-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">
                            {unreadCount} new
                          </span>
                        )}
                      </div>
                      {unreadCount > 0 && (
                        <button
                          onClick={markAllAsRead}
                          className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold flex items-center space-x-1 hover:underline transition-colors"
                        >
                          <CheckCheck className="h-3.5 w-3.5 mr-0.5" />
                          <span>Mark all read</span>
                        </button>
                      )}
                    </div>

                    {/* Scrollable List */}
                    <div className="flex-1 overflow-y-auto divide-y divide-slate-100 max-h-[360px] no-scrollbar">
                      {notifications.length === 0 ? (
                        <div className="p-8 text-center text-slate-400 flex flex-col items-center justify-center">
                          <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mb-2">
                            <Inbox className="h-6 w-6" />
                          </div>
                          <p className="text-xs font-medium">All caught up!</p>
                          <p className="text-[10px] text-slate-300 mt-0.5">No notifications yet.</p>
                        </div>
                      ) : (
                        notifications.map((notif) => (
                          <div 
                            key={notif.id} 
                            className={`p-4 transition-all duration-200 flex space-x-3 text-left border-b border-slate-50 ${getNotifColor(notif.type, notif.isRead)}`}
                          >
                            <div className="mt-0.5 shrink-0 w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm">
                              {getNotifIcon(notif.type)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-bold text-slate-800 flex items-center justify-between">
                                <span className="truncate">{notif.title}</span>
                                {!notif.isRead && (
                                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0 ml-2" />
                                )}
                              </p>
                              <p className="text-xs text-slate-500 mt-1 leading-relaxed break-words">
                                {notif.message}
                              </p>
                              <p className="text-[9px] text-slate-400 font-mono mt-1">
                                {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {new Date(notif.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                              </p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="hidden sm:flex flex-col items-end">
              <span className="text-sm font-semibold text-gray-800">{user.name}</span>
              <span className="text-xs text-gray-400 font-mono">{user.email}</span>
            </div>

            <div className={`text-xs font-mono font-medium px-2.5 py-1 rounded-full border ${getRoleColor(user.role)}`}>
              {user.role.toUpperCase()}
            </div>

            <div className="h-6 w-[1px] bg-gray-100"></div>

            <button
              onClick={onLogout}
              className="text-gray-400 hover:text-rose-600 p-2 rounded-lg hover:bg-rose-50 transition-colors"
              title="Logout session"
              id="btn-logout"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
