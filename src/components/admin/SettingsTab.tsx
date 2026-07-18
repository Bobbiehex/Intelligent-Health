import React, { useState, useEffect } from 'react';
import { 
  Settings, Save, RefreshCw, Clock, ShieldCheck, Mail, Phone, MapPin, Globe, Lock
} from 'lucide-react';
import { toast } from 'sonner';

interface SettingsTabProps {
  token: string;
}

export default function SettingsTab({ token }: SettingsTabProps) {
  const [loading, setLoading] = useState(true);
  
  // Settings values
  const [hospitalName, setHospitalName] = useState('Intelligent Health Clinic');
  const [hospitalLogo, setHospitalLogo] = useState('');
  const [address, setAddress] = useState('77 Innovation Way, London');
  const [contactPhone, setContactPhone] = useState('+44 20 7946 0192');
  const [timezone, setTimezone] = useState('Europe/London');
  const [businessHours, setBusinessHours] = useState('08:00 - 18:00');
  const [appointmentDuration, setAppointmentDuration] = useState('15');
  const [queueNumberFormat, setQueueNumberFormat] = useState('TOKEN-{NUM}');
  const [supportedLanguages, setSupportedLanguages] = useState('English, Spanish');
  const [passwordPolicy, setPasswordPolicy] = useState('Strong');
  const [sessionTimeout, setSessionTimeout] = useState('30');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/settings', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setHospitalName(data.hospitalName || 'Intelligent Health Clinic');
        setHospitalLogo(data.hospitalLogo || '');
        setAddress(data.address || '77 Innovation Way, London');
        setContactPhone(data.contactPhone || '+44 20 7946 0192');
        setTimezone(data.timezone || 'Europe/London');
        setBusinessHours(data.businessHours || '08:00 - 18:00');
        setAppointmentDuration(data.appointmentDuration || '15');
        setQueueNumberFormat(data.queueNumberFormat || 'TOKEN-{NUM}');
        setSupportedLanguages(data.supportedLanguages || 'English, Spanish');
        setPasswordPolicy(data.passwordPolicy || 'Strong');
        setSessionTimeout(data.sessionTimeout || '30');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          hospitalName, hospitalLogo, address, contactPhone, timezone,
          businessHours, appointmentDuration, queueNumberFormat,
          supportedLanguages, passwordPolicy, sessionTimeout
        })
      });

      if (!res.ok) throw new Error('Failed to update system parameters');

      toast.success('System configuration settings saved successfully!');
      fetchSettings();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSaveSettings} className="bg-white border border-gray-100 rounded-3xl p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center border-b border-gray-50 pb-4">
        <div>
          <h3 className="font-bold text-sm text-gray-800 flex items-center space-x-2">
            <Settings className="h-5 w-5 text-rose-500" />
            <span>Core Administration & Clinic Policy Configuration</span>
          </h3>
          <p className="text-[10px] text-gray-400 font-mono mt-0.5">MANAGE GLOBAL PORTAL BEHAVIOR AND HOSPITAL PARAMETERS</p>
        </div>
        <button 
          type="button"
          onClick={fetchSettings}
          className="bg-gray-50 border border-gray-200 p-2 rounded-xl hover:bg-gray-100 text-gray-600 shrink-0 cursor-pointer"
        >
          <RefreshCw className="h-3.5 w-3.5" />
        </button>
      </div>

      {loading ? (
        <div className="text-center py-8 font-mono text-xs text-gray-400">Loading system parameters...</div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* General parameters */}
            <div className="space-y-4">
              <span className="text-[10px] text-gray-400 font-mono uppercase block border-b border-gray-50 pb-1.5">Hospital Identity</span>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[9px] font-bold text-gray-500 font-mono block mb-1">CLINIC NAME</label>
                  <input
                    type="text"
                    value={hospitalName}
                    onChange={e => setHospitalName(e.target.value)}
                    className="w-full text-xs py-1.5 px-3 border border-gray-200 rounded-xl focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[9px] font-bold text-gray-500 font-mono block mb-1">LOGO URL</label>
                  <input
                    type="text"
                    placeholder="Optional image path..."
                    value={hospitalLogo}
                    onChange={e => setHospitalLogo(e.target.value)}
                    className="w-full text-xs py-1.5 px-3 border border-gray-200 rounded-xl focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-[9px] font-bold text-gray-500 font-mono block mb-1">PHYSICAL ADDRESS</label>
                <div className="relative">
                  <MapPin className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-gray-300" />
                  <input
                    type="text"
                    value={address}
                    onChange={e => setAddress(e.target.value)}
                    className="pl-8 w-full text-xs py-1.5 px-3 border border-gray-200 rounded-xl focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[9px] font-bold text-gray-500 font-mono block mb-1">CONTACT TELEPHONE</label>
                  <div className="relative">
                    <Phone className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-gray-300" />
                    <input
                      type="tel"
                      value={contactPhone}
                      onChange={e => setContactPhone(e.target.value)}
                      className="pl-8 w-full text-xs py-1.5 px-3 border border-gray-200 rounded-xl focus:outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[9px] font-bold text-gray-500 font-mono block mb-1">CLINICAL TIMEZONE</label>
                  <div className="relative">
                    <Globe className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-gray-300" />
                    <input
                      type="text"
                      value={timezone}
                      onChange={e => setTimezone(e.target.value)}
                      className="pl-8 w-full text-xs py-1.5 px-3 border border-gray-200 rounded-xl focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Core clinical operations policy parameters */}
            <div className="space-y-4">
              <span className="text-[10px] text-gray-400 font-mono uppercase block border-b border-gray-50 pb-1.5">Operations Policy & Timeout</span>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[9px] font-bold text-gray-500 font-mono block mb-1">ACTIVE BUSINESS HOURS</label>
                  <div className="relative">
                    <Clock className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-gray-300" />
                    <input
                      type="text"
                      value={businessHours}
                      onChange={e => setBusinessHours(e.target.value)}
                      className="pl-8 w-full text-xs py-1.5 px-3 border border-gray-200 rounded-xl focus:outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[9px] font-bold text-gray-500 font-mono block mb-1">DEFAULT CONSULTATION SLOTS (MINS)</label>
                  <input
                    type="number"
                    min={5}
                    value={appointmentDuration}
                    onChange={e => setAppointmentDuration(e.target.value)}
                    className="w-full text-xs py-1.5 px-3 border border-gray-200 rounded-xl focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[9px] font-bold text-gray-500 font-mono block mb-1">SESSION TIMEOUT (MINUTES)</label>
                  <div className="relative">
                    <Lock className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-gray-300" />
                    <input
                      type="number"
                      min={5}
                      value={sessionTimeout}
                      onChange={e => setSessionTimeout(e.target.value)}
                      className="pl-8 w-full text-xs py-1.5 px-3 border border-gray-200 rounded-xl focus:outline-none font-mono"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[9px] font-bold text-gray-500 font-mono block mb-1">PASSWORD POLICY</label>
                  <select
                    value={passwordPolicy}
                    onChange={e => setPasswordPolicy(e.target.value)}
                    className="w-full text-xs py-1.5 px-3 border border-gray-200 rounded-xl focus:outline-none bg-white font-semibold text-gray-700"
                  >
                    <option value="Standard">Standard Password</option>
                    <option value="Strong">Strong Policy (Uppercase/Digit)</option>
                    <option value="MFA">Force Multi-Factor (MFA)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[9px] font-bold text-gray-500 font-mono block mb-1">SUPPORTED LANGUAGES</label>
                  <input
                    type="text"
                    value={supportedLanguages}
                    onChange={e => setSupportedLanguages(e.target.value)}
                    className="w-full text-xs py-1.5 px-3 border border-gray-200 rounded-xl focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[9px] font-bold text-gray-500 font-mono block mb-1">QUEUE TOKEN PATTERN</label>
                  <input
                    type="text"
                    value={queueNumberFormat}
                    onChange={e => setQueueNumberFormat(e.target.value)}
                    className="w-full text-xs py-1.5 px-3 border border-gray-200 rounded-xl focus:outline-none font-mono"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2 border-t border-gray-50">
            <button
              type="submit"
              disabled={submitting}
              className="bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold px-5 py-2.5 rounded-xl transition-colors disabled:opacity-50 flex items-center space-x-2 cursor-pointer"
            >
              <Save className="h-4 w-4" />
              <span>{submitting ? 'Saving Configuration...' : 'Save Configuration'}</span>
            </button>
          </div>
        </div>
      )}
    </form>
  );
}
