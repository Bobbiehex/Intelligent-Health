import React, { useState, useEffect, useRef } from 'react';
import { 
  MessageSquare, Send, User, Search, Paperclip, 
  AlertCircle, ChevronRight, Phone, Info, MoreVertical,
  Plus
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

interface SecureMessagingProps {
  user: any;
  token: string;
}

export default function SecureMessaging({ user, token }: SecureMessagingProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [showNewMessage, setShowNewMessage] = useState(false);
  const [newMessageData, setNewMessageData] = useState({ receiverId: '', subject: '', content: '' });
  const [appointments, setAppointments] = useState<any[]>([]);

  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchMessages();
    fetchDoctors();
    fetchAppointments();
  }, [token]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedConversation, messages]);

  const fetchMessages = async () => {
    try {
      const response = await fetch('/api/messages', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setMessages(data);
      if (data.length > 0 && !selectedConversation) {
        // Find most recent conversation partner
        const partnerId = data[0].senderId === user.id ? data[0].receiverId : data[0].senderId;
        setSelectedConversation(partnerId);
      }
    } catch (error) {
      toast.error('Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  const fetchAppointments = async () => {
    try {
      const response = await fetch('/api/appointments', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setAppointments(data);
    } catch (error) {}
  };

  const fetchDoctors = async () => {
    try {
      const response = await fetch('/api/patient/doctors', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setDoctors(data);
    } catch (error) {}
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !selectedConversation || sending) return;

    setSending(true);
    try {
      const response = await fetch('/api/patient/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          receiverId: selectedConversation,
          content: input,
          subject: 'Message from Patient'
        })
      });
      if (!response.ok) throw new Error('Send failed');
      setInput('');
      fetchMessages();
    } catch (error) {
      toast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleNewMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    try {
      const response = await fetch('/api/patient/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newMessageData)
      });
      if (!response.ok) throw new Error('Send failed');
      setShowNewMessage(false);
      setNewMessageData({ receiverId: '', subject: '', content: '' });
      fetchMessages();
      toast.success('Message sent!');
    } catch (error) {
      toast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  if (loading) return null;

  // Group messages by conversation partner
  const conversationsMap = messages.reduce((acc: any, msg) => {
    const partnerId = msg.senderId === user.id ? msg.receiverId : msg.senderId;
    if (!acc[partnerId]) {
      acc[partnerId] = {
        partner: msg.senderId === user.id ? msg.receiver : msg.sender,
        lastMessage: msg,
        messages: []
      };
    }
    acc[partnerId].messages.push(msg);
    return acc;
  }, {});

  const conversationList = Object.keys(conversationsMap).map(id => ({
    id,
    ...conversationsMap[id]
  })).sort((a, b) => new Date(b.lastMessage.createdAt).getTime() - new Date(a.lastMessage.createdAt).getTime());

  const currentConversationMessages = selectedConversation 
    ? (conversationsMap[selectedConversation]?.messages || []).sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    : [];

  const currentPartner = conversationsMap[selectedConversation || '']?.partner;

  const hasActiveAppointment = appointments.some(appt => 
    (appt.patientId === user.id && appt.doctorId === selectedConversation) &&
    ['PENDING', 'CONFIRMED', 'WAITING', 'In Progress'].includes(appt.status)
  );

  return (
    <div className="flex h-full w-full bg-white overflow-hidden flex-col md:flex-row">
      {/* Sidebar - Conversation List */}
      <div className={`${selectedConversation ? 'hidden md:flex' : 'flex'} w-full md:w-80 lg:w-96 border-r border-slate-100 flex-col bg-slate-50/50`}>
        <div className="p-4 md:p-6 border-b border-slate-100 bg-white space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-slate-800">Messages</h3>
            <button 
              onClick={() => setShowNewMessage(true)}
              className="p-2 bg-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all"
            >
              <Plus size={18} />
            </button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Search chats..." 
              className="w-full bg-slate-50 border-none rounded-xl py-2 pl-10 pr-4 text-xs outline-none focus:ring-2 focus:ring-indigo-500/10"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {conversationList.map((conv) => {
            const isSelected = selectedConversation === conv.id;
            return (
              <button
                key={conv.id}
                onClick={() => setSelectedConversation(conv.id)}
                className={`w-full p-4 flex items-start space-x-4 rounded-2xl transition-all text-left ${
                  isSelected ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'hover:bg-white hover:shadow-sm'
                }`}
              >
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-sm shrink-0 ${
                  isSelected ? 'bg-white/20 text-white' : 'bg-indigo-50 text-indigo-600'
                }`}>
                  {conv.partner?.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-1">
                    <h4 className={`font-bold truncate text-sm ${isSelected ? 'text-white' : 'text-slate-800'}`}>
                      Dr. {conv.partner?.name}
                    </h4>
                    <span className={`text-[9px] font-bold uppercase ${isSelected ? 'text-white/60' : 'text-slate-400'}`}>
                      {new Date(conv.lastMessage.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                  <p className={`text-xs truncate ${isSelected ? 'text-white/80' : 'text-slate-500'}`}>
                    {conv.lastMessage.content}
                  </p>
                </div>
              </button>
            );
          })}
          {conversationList.length === 0 && (
            <div className="p-12 text-center text-slate-400">
              <MessageSquare size={32} className="mx-auto mb-4 opacity-20" />
              <p className="text-xs italic">No conversations yet.</p>
            </div>
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className={`${selectedConversation ? 'flex' : 'hidden md:flex'} flex-1 flex flex-col bg-white h-full relative`}>
        {selectedConversation ? (
          <>
            {/* Chat Header */}
            <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-white/95 backdrop-blur-sm z-10 sticky top-0">
              <div className="flex items-center space-x-3">
                <button 
                  onClick={() => setSelectedConversation(null)}
                  className="md:hidden p-1.5 hover:bg-slate-50 rounded-lg text-slate-400"
                >
                  <ChevronRight size={18} className="rotate-180" />
                </button>
                <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-indigo-600 font-bold text-sm uppercase">
                  {currentPartner?.name.charAt(0)}
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 text-sm">Dr. {currentPartner?.name}</h4>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Secure Channel</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all">
                  <Phone size={18} />
                </button>
                <button className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all">
                  <Info size={18} />
                </button>
              </div>
            </div>

            {/* Chat History - Larger viewport */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-[#f0f2f5] scroll-smooth">
              <div className="flex justify-center mb-6">
                <div className="px-4 py-1 bg-white/80 backdrop-blur-sm text-[9px] font-bold text-slate-400 rounded-full border border-slate-200 uppercase tracking-[0.15em] shadow-sm">
                  Clinical End-to-End Encryption
                </div>
              </div>

              <div className="flex flex-col gap-2">
                {currentConversationMessages.map((msg: any, idx: number) => {
                  const isMine = msg.senderId === user.id;
                  const prevMsg = currentConversationMessages[idx - 1];
                  const isFirstInGroup = !prevMsg || prevMsg.senderId !== msg.senderId;

                  return (
                    <div 
                      key={msg.id} 
                      className={`flex ${isMine ? 'justify-end' : 'justify-start'} ${isFirstInGroup ? 'mt-4' : 'mt-0.5'}`}
                    >
                      <div className="max-w-[85%] md:max-w-[70%]">
                        <div className={`px-4 py-2 text-sm shadow-sm ${
                          isMine 
                            ? 'bg-indigo-600 text-white rounded-[20px] rounded-tr-[4px]' 
                            : 'bg-white text-slate-800 rounded-[20px] rounded-tl-[4px]'
                        }`}>
                          <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                          <div className={`flex items-center justify-end gap-1 mt-1 opacity-60 text-[8px]`}>
                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div ref={chatEndRef} className="h-4" />
            </div>

            {/* Chat Input */}
            <div className="p-4 border-t border-slate-100 bg-white">
              {!hasActiveAppointment ? (
                <div className="bg-rose-50 border border-rose-100 p-4 rounded-2xl flex items-center gap-3 text-xs text-rose-700">
                  <AlertCircle size={18} className="shrink-0" />
                  <p className="font-medium">Messaging is restricted to active consultation periods.</p>
                </div>
              ) : (
                <form onSubmit={handleSend} className="relative flex items-center gap-2">
                  <div className="flex-1 relative">
                    <button type="button" className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600">
                      <Paperclip size={18} />
                    </button>
                    <input 
                      type="text" 
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder="Type a message to your doctor..."
                      className="w-full bg-slate-50 border-transparent focus:bg-white focus:ring-2 focus:ring-indigo-100 rounded-[1.5rem] py-3.5 pl-12 pr-14 text-sm outline-none transition-all"
                    />
                    <button 
                      type="submit"
                      disabled={!input.trim() || sending}
                      className="absolute right-2 top-2 bottom-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 rounded-2xl flex items-center justify-center transition-all disabled:opacity-30 shadow-md"
                    >
                      <Send size={18} />
                    </button>
                  </div>
                </form>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-12 bg-slate-50/20">
            <div className="w-24 h-24 bg-white rounded-[3rem] flex items-center justify-center mb-6 shadow-sm border border-slate-100">
              <MessageSquare size={40} className="text-indigo-200" />
            </div>
            <h3 className="text-xl font-bold text-slate-800">Secure Clinical Inbox</h3>
            <p className="text-sm text-slate-400 mt-2 max-w-sm leading-relaxed">
              Communicate directly and securely with your medical team. Select a professional to view your history.
            </p>
            <button 
              onClick={() => setShowNewMessage(true)}
              className="mt-8 px-10 py-4 bg-indigo-600 text-white rounded-[2rem] font-bold shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
            >
              Compose New Message
            </button>
          </div>
        )}
      </div>

      {/* New Message Modal */}
      <AnimatePresence>
        {showNewMessage && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden"
            >
              <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <h3 className="text-xl font-bold text-slate-800">New Secure Message</h3>
                <button 
                  onClick={() => setShowNewMessage(false)}
                  className="p-2 hover:bg-white rounded-xl text-slate-400 transition-all"
                >
                  <AlertCircle size={20} className="rotate-45" />
                </button>
              </div>

              <form onSubmit={handleNewMessage} className="p-8 space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Recipient</label>
                  <select 
                    required
                    value={newMessageData.receiverId}
                    className="w-full bg-slate-50 border-none rounded-2xl py-3 px-4 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20"
                    onChange={(e) => setNewMessageData({...newMessageData, receiverId: e.target.value})}
                  >
                    <option value="">Select Professional</option>
                    {doctors.map(d => (
                      <option key={d.id} value={d.id}>{d.name} ({d.department})</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Subject</label>
                  <input 
                    required
                    type="text" 
                    placeholder="e.g. Follow-up on lab results"
                    value={newMessageData.subject}
                    className="w-full bg-slate-50 border-none rounded-2xl py-3 px-4 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20"
                    onChange={(e) => setNewMessageData({...newMessageData, subject: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Message</label>
                  <textarea 
                    required
                    rows={5}
                    placeholder="Describe your query or concern..."
                    value={newMessageData.content}
                    className="w-full bg-slate-50 border-none rounded-2xl py-3 px-4 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 resize-none"
                    onChange={(e) => setNewMessageData({...newMessageData, content: e.target.value})}
                  />
                </div>

                <div className="flex gap-4 pt-4">
                  <button 
                    type="button"
                    onClick={() => setShowNewMessage(false)}
                    className="flex-1 py-4 bg-slate-100 text-slate-600 font-bold rounded-2xl hover:bg-slate-200 transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    disabled={sending || !newMessageData.receiverId}
                    className="flex-[2] py-4 bg-indigo-600 text-white font-bold rounded-2xl shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all disabled:opacity-50"
                  >
                    {sending ? 'Sending...' : 'Send Message'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
