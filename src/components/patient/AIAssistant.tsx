import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, Bot, User, Sparkles, AlertCircle, Info, 
  RefreshCcw, ChevronRight, MessageSquare, BrainCircuit,
  Activity, Pill
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import Markdown from 'react-markdown';
import AIFeedback from '../AIFeedback';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface AIAssistantProps {
  user: any;
  token: string;
}

export default function AIAssistant({ user, token }: AIAssistantProps) {
  const [messages, setMessages] = useState<Message[]>([
    { 
      role: 'assistant', 
      content: `Hello ${user.name.split(' ')[0]}, I am your AI Health Assistant. How can I help you today? Please note that I can explain medical concepts and your records, but I cannot provide clinical diagnoses or prescriptions.` 
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);

    try {
      const response = await fetch('/api/patient/ai/ask', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ query: userMessage })
      });

      if (!response.ok) throw new Error('AI service unavailable');
      const data = await response.json();
      setMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
    } catch (error) {
      toast.error('AI Assistant encountered an error');
      setMessages(prev => [...prev, { role: 'assistant', content: 'I apologize, but I am having trouble connecting to my knowledge base right now. Please try again in a moment.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col flex-1 h-full w-full max-w-5xl mx-auto bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-100/50 overflow-hidden relative">
      {/* Header */}
      <div className="px-8 py-6 border-b border-slate-100 bg-white sticky top-0 z-10 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shadow-sm">
            <Bot size={28} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-800 flex items-center space-x-2">
              <span>Health Assistant</span>
              <div className="px-2 py-0.5 bg-indigo-50 text-indigo-600 text-[10px] font-bold rounded-md flex items-center">
                <span className="w-1 h-1 bg-indigo-500 rounded-full mr-1 animate-pulse"></span>
                ACTIVE
              </div>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">Clinical Insight Engine v3.5</p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button 
            onClick={() => setMessages([messages[0]])}
            className="p-2.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all group"
            title="Clear Chat"
          >
            <RefreshCcw size={18} className="group-hover:rotate-180 transition-transform duration-500" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-8 space-y-8 scroll-smooth no-scrollbar">
        {messages.map((msg, i) => (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            key={i} 
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} items-start space-x-4`}
          >
            {msg.role === 'assistant' && (
              <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center shrink-0 border border-indigo-100 shadow-sm mt-1">
                <Sparkles size={18} />
              </div>
            )}
            
            <div className={`max-w-[85%] sm:max-w-[80%] ${
              msg.role === 'user' 
                ? 'bg-indigo-600 text-white rounded-[2rem] rounded-tr-none p-6 shadow-lg shadow-indigo-100' 
                : 'bg-slate-50 text-slate-800 rounded-[2rem] rounded-tl-none p-6 border border-slate-100'
            }`}>
              <div className="markdown-body prose prose-slate max-w-none text-sm leading-relaxed">
                <Markdown>{msg.content}</Markdown>
              </div>
              
              {msg.role === 'assistant' && i > 0 && msg.content !== 'I apologize, but I am having trouble connecting to my knowledge base right now. Please try again in a moment.' && (
                <AIFeedback 
                  feature="PatientAIAssistant"
                  query={messages[i-1]?.content || ''}
                  response={msg.content}
                  token={token}
                />
              )}

              <div className={`flex items-center gap-2 mt-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'assistant' && msg.content.includes('apologize') && (
                  <AlertCircle size={10} className="text-rose-500" />
                )}
                <span className={`text-[9px] font-bold uppercase tracking-widest opacity-40 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                  {msg.role === 'user' ? 'Patient' : 'Clinical AI'} • {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>

            {msg.role === 'user' && (
              <div className="w-10 h-10 bg-slate-100 text-slate-400 rounded-xl flex items-center justify-center shrink-0 border border-slate-200 shadow-sm mt-1 font-bold text-xs uppercase">
                {user.name.charAt(0)}
              </div>
            )}
          </motion.div>
        ))}
        {loading && (
          <div className="flex items-start space-x-4">
            <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center shrink-0 border border-indigo-100 shadow-sm mt-1 animate-pulse">
              <BrainCircuit size={18} />
            </div>
            <div className="bg-slate-50 rounded-[2rem] rounded-tl-none p-6 border border-slate-100">
              <div className="flex space-x-2">
                <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce"></div>
                <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce delay-75"></div>
                <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce delay-150"></div>
              </div>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Input */}
      <div className="p-8 border-t border-slate-100 bg-white">
        <div className="bg-rose-50 border border-rose-100 p-3 rounded-2xl mb-4 flex items-center space-x-3 text-[10px] text-rose-700 font-bold uppercase tracking-widest">
          <AlertCircle size={14} className="shrink-0" />
          <span>Disclaimer: This AI is educational. For emergencies, call 911 or your doctor immediately.</span>
        </div>
        
        <form onSubmit={handleSend} className="relative">
          <input 
            type="text" 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about medications, lab results, or health tips..."
            className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 pl-6 pr-16 text-sm focus:ring-4 focus:ring-indigo-500/10 focus:bg-white focus:border-indigo-200 transition-all outline-none shadow-inner"
          />
          <button 
            type="submit"
            disabled={!input.trim() || loading}
            className="absolute right-2 top-2 bottom-2 bg-indigo-600 hover:bg-indigo-700 text-white w-12 rounded-xl flex items-center justify-center transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-indigo-100"
          >
            <Send size={18} />
          </button>
        </form>
        
        <div className="flex items-center justify-center space-x-6 mt-6">
          {[
            { label: 'Explain my BP', icon: Activity },
            { label: 'Medication Side Effects', icon: Pill },
            { label: 'Healthy Diet Tips', icon: Sparkles }
          ].map((s, i) => (
            <button 
              key={i}
              onClick={() => setInput(s.label)}
              className="text-[10px] font-bold text-slate-400 hover:text-indigo-600 flex items-center space-x-1.5 transition-colors group"
            >
              <s.icon size={12} className="group-hover:scale-110 transition-transform" />
              <span>{s.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
