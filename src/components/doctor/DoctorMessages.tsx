import React, { useState, useEffect, useRef } from 'react';
import { 
  MessageSquare, Send, User as UserIcon, Search, AlertCircle, 
  ChevronRight, Phone, Heart, Check, Clock, Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';

interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  subject?: string;
  content: string;
  isRead: boolean;
  isEmergency: boolean;
  createdAt: string;
  sender?: { name: string; role: string };
  receiver?: { name: string; role: string };
}

interface DoctorMessagesProps {
  token: string;
  user: any;
}

export default function DoctorMessages({ token, user }: DoctorMessagesProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [appointments, setAppointments] = useState<any[]>([]);

  const chatEndRef = useRef<HTMLDivElement>(null);

  const fetchMessages = async () => {
    try {
      const response = await fetch('/api/messages', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setMessages(data);
      }
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
  };

  const fetchAppointments = async () => {
    try {
      const response = await fetch('/api/appointments', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setAppointments(data);
      }
    } catch (error) {
      console.error('Failed to load appointments:', error);
    }
  };

  const fetchPatients = async () => {
    try {
      const response = await fetch('/api/doctor/patients', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setPatients(data);
      }
    } catch (error) {
      console.error('Failed to load patients:', error);
    }
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([fetchMessages(), fetchPatients(), fetchAppointments()]);
      setLoading(false);
    };
    init();

    // Setup polling for messaging updates
    const interval = setInterval(async () => {
      await fetchMessages();
      await fetchAppointments();
    }, 4000);
    return () => clearInterval(interval);
  }, [token]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedPatientId, messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !selectedPatientId || sending) return;

    setSending(true);
    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          receiverId: selectedPatientId,
          content: input,
          subject: 'Message from Doctor'
        })
      });

      if (!response.ok) throw new Error('Send failed');
      setInput('');
      await fetchMessages();
    } catch (error) {
      toast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  // Group messages by conversation partner (either sender or receiver that isn't the doctor)
  const conversationPartners = React.useMemo(() => {
    const map = new Map<string, { lastMessage: Message; unreadCount: number }>();
    
    // Sort oldest first so last message is most recent
    const sorted = [...messages].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    
    sorted.forEach(msg => {
      const partnerId = msg.senderId === user.id ? msg.receiverId : msg.senderId;
      const isUnread = !msg.isRead && msg.receiverId === user.id;
      
      const existing = map.get(partnerId);
      map.set(partnerId, {
        lastMessage: msg,
        unreadCount: (existing?.unreadCount || 0) + (isUnread ? 1 : 0)
      });
    });

    return map;
  }, [messages, user.id]);

  const activeChats = patients.map(pat => {
    const partnerInfo = conversationPartners.get(pat.id);
    return {
      ...pat,
      lastMessage: partnerInfo?.lastMessage || null,
      unreadCount: partnerInfo?.unreadCount || 0
    };
  }).filter(pat => {
    const matchesSearch = pat.name.toLowerCase().includes(searchQuery.toLowerCase());
    // Either they match search, or they have a message history
    return matchesSearch || pat.lastMessage !== null;
  }).sort((a, b) => {
    if (a.lastMessage && b.lastMessage) {
      return new Date(b.lastMessage.createdAt).getTime() - new Date(a.lastMessage.createdAt).getTime();
    }
    if (a.lastMessage) return -1;
    if (b.lastMessage) return 1;
    return a.name.localeCompare(b.name);
  });

  const selectedPatient = patients.find(p => p.id === selectedPatientId);

  const hasActiveAppointment = appointments.some(appt => 
    (appt.patientId === selectedPatientId && appt.doctorId === user.id) &&
    ['PENDING', 'CONFIRMED', 'WAITING', 'In Progress'].includes(appt.status)
  );
  
  const conversationMessages = [...messages]
    .filter(msg => 
      (msg.senderId === user.id && msg.receiverId === selectedPatientId) ||
      (msg.senderId === selectedPatientId && msg.receiverId === user.id)
    )
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  return (
    <div className="bg-white overflow-hidden h-full w-full flex flex-col md:flex-row">
      {/* Patients / Conversations List */}
      <div className={`${selectedPatientId ? 'hidden md:flex' : 'flex'} w-full md:w-80 lg:w-96 border-r border-gray-100 flex-col h-full bg-gray-50/10`}>
        <div className="p-4 md:p-6 border-b border-gray-50 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-display font-bold text-gray-900 text-lg">Patient Conversations</h3>
            <span className="bg-indigo-50 text-indigo-700 text-[10px] px-2 py-1 rounded-lg font-bold">
              {activeChats.length} Channels
            </span>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-300" />
            <input 
              type="text" 
              placeholder="Search patients..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-gray-100 rounded-xl py-2 pl-9 pr-4 text-xs focus:ring-2 focus:ring-indigo-500/10 transition-all outline-none"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {loading ? (
            <div className="p-8 text-center text-gray-400 font-mono text-xs">
              <div className="animate-spin h-5 w-5 border-2 border-indigo-600 border-t-transparent rounded-full mx-auto mb-2" />
              <span>Loading channels...</span>
            </div>
          ) : activeChats.length === 0 ? (
            <div className="p-8 text-center text-gray-400">
              <MessageSquare className="h-8 w-8 mx-auto opacity-20 mb-2" />
              <p className="text-xs">No active chats.</p>
            </div>
          ) : (
            activeChats.map(patient => {
              const isSelected = patient.id === selectedPatientId;
              return (
                <button
                  key={patient.id}
                  onClick={() => setSelectedPatientId(patient.id)}
                  className={`w-full p-3 rounded-xl flex items-center gap-3 transition-all text-left ${
                    isSelected 
                      ? 'bg-indigo-600 text-white shadow-md' 
                      : 'hover:bg-white hover:shadow-sm text-gray-700'
                  }`}
                >
                  <div className={`h-10 w-10 rounded-xl font-bold flex items-center justify-center text-sm shrink-0 ${
                    isSelected ? 'bg-white/20 text-white' : 'bg-indigo-100 text-indigo-700'
                  }`}>
                    {patient.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline">
                      <h4 className="font-bold text-xs truncate">{patient.name}</h4>
                      {patient.lastMessage && (
                        <span className={`text-[8px] ${isSelected ? 'text-white/60' : 'text-gray-400'}`}>
                          {new Date(patient.lastMessage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                    </div>
                    <p className={`text-[10px] mt-0.5 truncate ${isSelected ? 'text-white/80' : 'text-gray-400'}`}>
                      {patient.lastMessage ? patient.lastMessage.content : `Start conversation...`}
                    </p>
                  </div>
                  {patient.unreadCount > 0 && (
                    <span className="h-4 w-4 rounded-full bg-rose-500 text-white text-[8px] font-bold flex items-center justify-center">
                      {patient.unreadCount}
                    </span>
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Chat History Pane */}
      <div className={`${selectedPatientId ? 'flex' : 'hidden md:flex'} flex-1 flex-col h-full bg-white relative`}>
        {selectedPatient ? (
          <>
            {/* Active chat header */}
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between bg-white/95 backdrop-blur-sm z-10">
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setSelectedPatientId(null)}
                  className="md:hidden p-1.5 hover:bg-gray-50 rounded-lg"
                >
                  <ChevronRight className="h-4 w-4 rotate-180" />
                </button>
                <div className="h-10 w-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 font-bold text-sm">
                  {selectedPatient.name.charAt(0)}
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 text-sm">{selectedPatient.name}</h4>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    <span className="text-[10px] text-gray-400 font-medium">Patient Channel</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <button className="p-2 hover:bg-gray-50 rounded-xl text-gray-400">
                  <Phone className="h-4 w-4" />
                </button>
                <button className="p-2 hover:bg-gray-50 rounded-xl text-gray-400">
                  <AlertCircle className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Chat Messages Area - Large and scrollable */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-[#f0f2f5] scroll-smooth">
              {conversationMessages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center text-gray-400 p-8">
                  <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center mb-4 shadow-sm">
                    <Sparkles className="h-8 w-8 text-indigo-400" />
                  </div>
                  <h5 className="font-bold text-gray-800 text-sm">New Secure Conversation</h5>
                  <p className="text-xs max-w-[240px] mt-2 leading-relaxed">
                    This is the start of your secure clinical channel with {selectedPatient.name}.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {conversationMessages.map((msg, idx) => {
                    const isMe = msg.senderId === user.id;
                    const prevMsg = conversationMessages[idx - 1];
                    const isFirstInGroup = !prevMsg || prevMsg.senderId !== msg.senderId;
                    
                    return (
                      <div 
                        key={msg.id} 
                        className={`flex ${isMe ? 'justify-end' : 'justify-start'} ${isFirstInGroup ? 'mt-4' : 'mt-0.5'}`}
                      >
                        <div className={`max-w-[85%] md:max-w-[70%] group relative`}>
                          <div className={`px-4 py-2 shadow-sm text-sm ${
                            isMe 
                              ? 'bg-indigo-600 text-white rounded-[20px] rounded-tr-[4px]' 
                              : 'bg-white text-gray-800 rounded-[20px] rounded-tl-[4px]'
                          }`}>
                            <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                            <div className={`flex items-center justify-end gap-1 mt-1 opacity-60 text-[8px]`}>
                              {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              {isMe && <Check className="h-2.5 w-2.5" />}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              <div ref={chatEndRef} className="h-4" />
            </div>

            {/* Chat Input Area */}
            <div className="p-4 bg-white border-t border-gray-100">
              {!hasActiveAppointment ? (
                <div className="bg-amber-50 border border-amber-100 p-3 rounded-xl flex items-center gap-3 text-xs text-amber-800">
                  <AlertCircle size={16} className="shrink-0" />
                  <p>Messaging is restricted to patients with active encounters. Please start a consultation first.</p>
                </div>
              ) : (
                <form onSubmit={handleSend} className="flex items-center gap-2">
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      placeholder="Type a message..."
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      className="w-full bg-gray-50 border border-transparent focus:border-indigo-100 focus:bg-white rounded-2xl py-3 px-5 text-sm outline-none transition-all pr-12"
                    />
                    <button
                      type="submit"
                      disabled={!input.trim() || sending}
                      className="absolute right-2 top-1.5 p-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all shadow-sm disabled:opacity-30"
                    >
                      <Send className="h-5 w-5" />
                    </button>
                  </div>
                </form>
              )}
            </div>
          </>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center text-gray-400 p-12 bg-gray-50/50">
            <div className="w-20 h-20 bg-white rounded-[2.5rem] flex items-center justify-center mb-6 shadow-sm">
              <MessageSquare className="h-10 w-10 text-indigo-200" />
            </div>
            <h4 className="font-bold text-gray-900 text-lg">Your Messages</h4>
            <p className="text-sm max-w-sm mt-2">
              Select a patient from the list to start a secure conversation or review clinical history.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
