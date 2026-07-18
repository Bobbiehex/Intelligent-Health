import React, { useState } from 'react';
import { 
  Megaphone, ShieldAlert, Send, RefreshCw, Eye, MessageSquare, AlertTriangle, Users
} from 'lucide-react';
import { toast } from 'sonner';

interface BroadcastTabProps {
  token: string;
}

export default function BroadcastTab({ token }: BroadcastTabProps) {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [targetRole, setTargetRole] = useState('ALL');
  const [submitting, setSubmitting] = useState(false);

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !message) {
      toast.error('Announcement Title and Message are required.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/admin/notifications/broadcast', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ title, message, targetRole })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Broadcast failed');

      toast.success(`Announcement broadcasted to ${data.count} active profiles!`);
      setTitle('');
      setMessage('');
      setTargetRole('ALL');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Broadcast Creation Form */}
      <form onSubmit={handleBroadcast} className="bg-white border border-gray-100 rounded-3xl p-6 lg:col-span-7 space-y-4">
        <div className="border-b border-gray-50 pb-2">
          <h4 className="font-bold text-sm text-gray-800 flex items-center space-x-2">
            <Megaphone className="h-4 w-4 text-rose-500" />
            <span>Hospital-Wide Broadcast dispatch</span>
          </h4>
          <p className="text-[10px] text-gray-400 font-mono uppercase mt-0.5">DISPATCH ALERTS AND POLICY MEMOS IN REAL-TIME</p>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-[10px] font-bold text-gray-500 font-mono block mb-1">TARGET RECIPIENTS ROLE POOL</label>
            <select
              value={targetRole}
              onChange={e => setTargetRole(e.target.value)}
              className="w-full text-xs py-2 px-3 border border-gray-200 rounded-xl bg-white font-semibold text-gray-700 focus:outline-none"
            >
              <option value="ALL">ALL USERS (GLOBAL BROADCAST)</option>
              <option value="DOCTOR">DOCTORS CLINICAL TEAM</option>
              <option value="NURSE">NURSING & WARD STAFF</option>
              <option value="PHARMACIST">CLINICAL PHARMACISTS</option>
              <option value="LABORATORY">LAB SCIENTIFIC STAFF</option>
              <option value="RECEPTIONIST">FRONT DESK ADMISSIONS</option>
              <option value="PATIENT">REGISTERED PATIENT POOL</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] font-bold text-gray-500 font-mono block mb-1">ANNOUNCEMENT SUBJECT / TITLE *</label>
            <input
              type="text"
              required
              placeholder="e.g. Scheduled IT Portal System Maintenance Notice"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full text-xs py-2 px-3 border border-gray-200 rounded-xl focus:outline-none"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-gray-500 font-mono block mb-1">BROADCAST BODY MESSAGE *</label>
            <textarea
              required
              rows={5}
              placeholder="Provide clean and detailed operational directives..."
              value={message}
              onChange={e => setMessage(e.target.value)}
              className="w-full text-xs py-2 px-3 border border-gray-200 rounded-xl focus:outline-none resize-none"
            />
          </div>
        </div>

        <div className="flex justify-end pt-2 border-t border-gray-50">
          <button
            type="submit"
            disabled={submitting}
            className="bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold px-5 py-2.5 rounded-xl transition-colors disabled:opacity-50 flex items-center space-x-2 cursor-pointer"
          >
            <Send className="h-4 w-4" />
            <span>{submitting ? 'Dispatching...' : 'Dispatch Announcement'}</span>
          </button>
        </div>
      </form>

      {/* Broadcast safety guide */}
      <div className="bg-white border border-gray-100 rounded-3xl p-6 lg:col-span-5 flex flex-col justify-between">
        <div className="space-y-4">
          <div className="flex items-start space-x-3 text-amber-700">
            <ShieldAlert className="h-5 w-5 shrink-0 mt-0.5" />
            <div>
              <h5 className="font-bold text-xs uppercase tracking-wider font-mono">Administrative Dispatch Policy</h5>
              <p className="text-[10px] text-gray-500 mt-1 leading-relaxed">
                Broadcast announcements utilize Server-Sent Events to push notifications immediately to the dashboards of all online clinicians matching the pool. Use responsibly to prevent clinician alert fatigue.
              </p>
            </div>
          </div>

          <div className="space-y-2.5">
            <span className="text-[10px] text-gray-400 font-mono uppercase block">Standard Incident Directives</span>
            
            <div className="p-3 bg-rose-50/50 border border-rose-100/50 rounded-xl text-[11px] leading-relaxed text-rose-800">
              <span className="font-bold block uppercase text-[9px] font-mono mb-0.5 text-rose-600">CRITICAL SYSTEM WARNING</span>
              Trigger immediate role-based notifications during environmental emergencies or core power failures.
            </div>

            <div className="p-3 bg-indigo-50/50 border border-indigo-100/50 rounded-xl text-[11px] leading-relaxed text-indigo-800">
              <span className="font-bold block uppercase text-[9px] font-mono mb-0.5 text-indigo-600">SCHEDULING ROTATIONS</span>
              Broadcast general notices regarding ward shift timings, policy amendments, or audit schedules.
            </div>
          </div>
        </div>

        <div className="border-t border-gray-50 pt-4 mt-6 text-center text-[10px] text-gray-400 font-mono">
          <span>Logged under Section 11 Compliance Guidelines</span>
        </div>
      </div>
    </div>
  );
}
