import React, { useState, useEffect } from 'react';
import { Activity, ShieldCheck, HeartPulse } from 'lucide-react';
import { Toaster } from 'sonner';
import Navbar from './components/Navbar';
import Login from './components/Login';
import PatientDashboard from './components/patient/PatientDashboard';
import DoctorDashboard from './components/DoctorDashboard';
import NurseDashboard from './components/NurseDashboard';
import ReceptionistDashboard from './components/ReceptionistDashboard';
import { PharmacistDashboard } from './components/pharmacy/PharmacistDashboard';
import { LaboratoryDashboard as LabDashboard } from './components/laboratory/LaboratoryDashboard';
import AdminDashboard from './components/AdminDashboard';
import { User } from './types';

export default function App() {
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const tryTokenRefresh = async (): Promise<string | null> => {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) return null;
    try {
      const res = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken })
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data.accessToken) {
          localStorage.setItem('token', data.accessToken);
          setToken(data.accessToken);
          return data.accessToken;
        }
      }
    } catch (err) {
      console.error('Failed to refresh token silently:', err);
    }
    return null;
  };

  const fetchProfile = async (accessToken: string) => {
    try {
      const res = await fetch('/api/auth/me', {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      if (res.ok) {
        let data: any;
        try {
          data = await res.json();
        } catch (err) {
          console.error('Failed to parse session profile JSON:', err);
          handleLogout();
          return;
        }
        setUser(data);
      } else {
        // Attempt token refresh before logging out
        const newToken = await tryTokenRefresh();
        if (newToken) {
          await fetchProfile(newToken);
        } else {
          handleLogout();
        }
      }
    } catch (err) {
      console.error('Session validation error:', err);
      // Attempt token refresh on error too (could be a transient connection issue or token expiry)
      const newToken = await tryTokenRefresh();
      if (newToken) {
        await fetchProfile(newToken);
      } else {
        handleLogout();
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchProfile(token);
    } else {
      setLoading(false);
    }
  }, [token]);

  const handleLoginSuccess = (data: { accessToken: string; refreshToken: string; user: any }) => {
    localStorage.setItem('token', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    setToken(data.accessToken);
    setUser(data.user);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    setToken(null);
    setUser(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fafafa] flex flex-col justify-center items-center font-mono text-gray-500">
        <Activity className="h-10 w-10 animate-spin text-rose-500 mb-4" />
        <span className="text-xs font-semibold uppercase tracking-widest text-gray-400">Verifying authorized clinical session...</span>
      </div>
    );
  }

  // Session Active Dashboard Routing
  return (
    <div className="h-screen bg-[#fafafa] flex flex-col overflow-hidden">
      <Toaster position="top-right" richColors closeButton />
      {user && token ? (
        <>
          <Navbar user={user} token={token} onLogout={handleLogout} />
          <main className="flex-1 min-h-0 overflow-hidden flex flex-col">
            {user.role === 'PATIENT' && <PatientDashboard user={user} token={token} />}
            {user.role === 'DOCTOR' && <DoctorDashboard user={user} token={token} />}
            {user.role === 'NURSE' && <NurseDashboard user={user} token={token} />}
            {user.role === 'RECEPTIONIST' && <ReceptionistDashboard user={user} token={token} />}
            {user.role === 'PHARMACIST' && <PharmacistDashboard user={user} token={token} />}
            {user.role === 'LABORATORY' && <LabDashboard user={user} token={token} />}
            {user.role === 'ADMIN' && <AdminDashboard user={user} token={token} />}
          </main>
        </>
      ) : (
        <div className="flex-1 overflow-y-auto flex flex-col">
          <Login onLoginSuccess={handleLoginSuccess} />
        </div>
      )}
    </div>
  );
}
