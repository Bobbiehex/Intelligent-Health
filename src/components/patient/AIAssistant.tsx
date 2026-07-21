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
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = '0px';
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = `${Math.min(scrollHeight, 400)}px`;
    }
  }, [input]);

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    if (textareaRef.current) {
      textareaRef.current.style.height = '0px';
    }
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
    <div className="flex flex-col flex-1 h-full min-h-0 w-full bg-white relative">
      {/* Header */}
      <div className="shrink-0 px-4 sm:px-8 py-4 sm:py-6 border-b border-slate-100 bg-white z-10">
        <div className="max-w-4xl mx-auto w-full flex items-center justify-between">
          <div className="flex items-center space-x-3 sm:space-x-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-indigo-50 text-indigo-600 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-sm">
              <Bot size={24} className="sm:w-7 sm:h-7" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-800 flex items-center space-x-2">
                <span>Health Assistant</span>
                <div className="px-2 py-0.5 bg-indigo-50 text-indigo-600 text-[9px] sm:text-[10px] font-bold rounded-md flex items-center">
                  <span className="w-1 h-1 bg-indigo-500 rounded-full mr-1 animate-pulse"></span>
                  ACTIVE
                </div>
              </h3>
              <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5">Clinical Insight Engine v3.5</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button 
              onClick={() => setMessages([messages[0]])}
              className="p-2 sm:p-2.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all group"
              title="Clear Chat"
            >
              <RefreshCcw size={16} className="sm:w-[18px] sm:h-[18px] group-hover:rotate-180 transition-transform duration-500" />
            </button>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 min-h-0 overflow-y-auto scroll-smooth p-4 sm:p-8">
        <div className="max-w-4xl mx-auto w-full space-y-6 sm:space-y-8">
          {messages.map((msg, i) => (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            key={i} 
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} items-start space-x-2 sm:space-x-4`}
          >
            {msg.role === 'assistant' && (
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center shrink-0 border border-indigo-100 shadow-sm mt-1">
                <Sparkles size={16} className="sm:w-[18px] sm:h-[18px]" />
              </div>
            )}
            
            <div className={`max-w-[90%] sm:max-w-[80%] ${
              msg.role === 'user' 
                ? 'bg-indigo-600 text-white rounded-[1.5rem] sm:rounded-[2rem] rounded-tr-none p-4 sm:p-6 shadow-lg shadow-indigo-100' 
                : 'bg-slate-50 text-slate-800 rounded-[1.5rem] sm:rounded-[2rem] rounded-tl-none p-4 sm:p-6 border border-slate-100'
            }`}>
              <div className={`markdown-body prose max-w-none text-sm leading-relaxed ${msg.role === 'user' ? 'prose-invert text-white' : 'prose-slate'}`}>
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

              <div className={`flex items-center gap-1.5 sm:gap-2 mt-2 sm:mt-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'assistant' && msg.content.includes('apologize') && (
                  <AlertCircle size={10} className="text-rose-500" />
                )}
                <span className={`text-[8px] sm:text-[9px] font-bold uppercase tracking-widest opacity-60 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                  {msg.role === 'user' ? 'Patient' : 'Clinical AI'} • {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>

            {msg.role === 'user' && (
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-slate-100 text-slate-500 rounded-xl flex items-center justify-center shrink-0 border border-slate-200 shadow-sm mt-1 font-bold text-xs uppercase">
                {user.name.charAt(0)}
              </div>
            )}
          </motion.div>
        ))}
        {loading && (
          <div className="flex items-start space-x-2 sm:space-x-4">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center shrink-0 border border-indigo-100 shadow-sm mt-1 animate-pulse">
              <BrainCircuit size={16} className="sm:w-[18px] sm:h-[18px]" />
            </div>
            <div className="bg-slate-50 rounded-[1.5rem] sm:rounded-[2rem] rounded-tl-none p-4 sm:p-6 border border-slate-100">
              <div className="flex space-x-2">
                <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce"></div>
                <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce delay-75"></div>
                <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce delay-150"></div>
              </div>
            </div>
          </div>
        )}
        <div ref={chatEndRef} className="h-4" />
        </div>
      </div>

      {/* Input */}
      <div className="shrink-0 p-1.5 sm:p-2 border-t border-slate-100 bg-white">
        <div className="max-w-4xl mx-auto w-full">
          <div className="bg-rose-50 border border-rose-100 p-1 sm:p-1.5 rounded-lg mb-1 sm:mb-1.5 flex items-start sm:items-center space-x-1.5 text-[8px] sm:text-[9px] text-rose-700 font-bold uppercase tracking-widest">
            <AlertCircle size={12} className="shrink-0 mt-0.5 sm:mt-0" />
            <span>Disclaimer: This AI is educational. For emergencies, call 911 or your doctor immediately.</span>
          </div>
          
          <form onSubmit={handleSend} className="relative">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Ask about medications, lab results, or health tips..."
              className="w-full bg-slate-50 border border-slate-100 rounded-lg sm:rounded-xl py-2 pl-3 pr-10 sm:pr-12 text-xs sm:text-sm focus:ring-4 focus:ring-indigo-500/10 focus:bg-white focus:border-indigo-200 transition-shadow outline-none shadow-inner resize-none min-h-[36px] sm:min-h-[40px] custom-scrollbar overflow-y-auto"
              rows={1}
            />
            <button 
              type="submit"
              disabled={!input.trim() || loading}
              className="absolute right-1 bottom-1 bg-indigo-600 hover:bg-indigo-700 text-white w-7 h-7 sm:w-8 sm:h-8 rounded-md sm:rounded-lg flex items-center justify-center transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-indigo-100"
            >
              <Send size={14} className="sm:w-[16px] sm:h-[16px]" />
            </button>
          </form>
          
          <div className="hidden sm:flex items-center justify-center space-x-4 mt-1.5">
            {[
              { label: 'Explain my BP', icon: Activity },
              { label: 'Medication Side Effects', icon: Pill },
              { label: 'Healthy Diet Tips', icon: Sparkles }
            ].map((s, i) => (
              <button 
                type="button"
                key={i}
                onClick={() => setInput(s.label)}
                className="text-[9px] font-bold text-slate-400 hover:text-indigo-600 flex items-center space-x-1 transition-colors group"
              >
                <s.icon size={10} className="group-hover:scale-110 transition-transform" />
                <span>{s.label}</span>
              </button>
            ))}
          </div>
          <div className="flex sm:hidden overflow-x-auto no-scrollbar items-center space-x-2 mt-1 pb-0.5">
            {[
              { label: 'Explain my BP', icon: Activity },
              { label: 'Medication Side Effects', icon: Pill },
              { label: 'Healthy Diet Tips', icon: Sparkles }
            ].map((s, i) => (
              <button 
                type="button"
                key={i}
                onClick={() => setInput(s.label)}
                className="shrink-0 bg-slate-50 px-2 py-0.5 rounded text-[9px] font-bold text-slate-500 flex items-center space-x-1 active:bg-slate-100"
              >
                <s.icon size={10} />
                <span>{s.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
