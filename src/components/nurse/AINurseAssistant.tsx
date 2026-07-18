import React, { useState, useRef, useEffect } from 'react';
import { 
  Sparkles, Send, MessageSquare, ShieldCheck, 
  RefreshCw, ThumbsUp, ThumbsDown, Info, AlertTriangle, Brain
} from 'lucide-react';
import { toast } from 'sonner';
import Markdown from 'react-markdown';
import AIFeedback from '../AIFeedback';

interface AINurseAssistantProps {
  patient: any;
  token: string;
}

export default function AINurseAssistant({ patient, token }: AINurseAssistantProps) {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || loading) return;

    const userMsg = query;
    setQuery('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setLoading(true);

    try {
      const patientContext = `
        Patient: ${patient.name}
        MRN: ${patient.mrn}
        Vitals: ${JSON.stringify(patient.vitalsLogs?.[0] || {})}
        History: ${patient.medicalHistoryNotes || 'None'}
      `;

      const res = await fetch('/api/nurse/ai-assist', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ query: userMsg, patientContext })
      });

      if (res.ok) {
        const data = await res.json();
        setMessages(prev => [...prev, { role: 'ai', content: data.response }]);
      } else {
        throw new Error('AI Assistant is currently unavailable');
      }
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm flex flex-col h-full" id="ai-nursing-support">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-purple-500" />
            AI Nursing Decision Support
          </h3>
          <p className="text-[10px] text-gray-400 font-mono uppercase tracking-wider mt-0.5">Nursing care recommendations & guidance</p>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1 bg-purple-50 rounded-lg">
          <Brain className="h-3 w-3 text-purple-600" />
          <span className="text-[9px] font-bold text-purple-700 uppercase tracking-widest">Powered by Gemini</span>
        </div>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden bg-gray-50/50 rounded-2xl border border-gray-100 relative">
        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-gray-200">
          {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-4 opacity-50">
              <Sparkles className="h-10 w-10 text-purple-300" />
              <div className="space-y-1">
                <p className="text-xs font-bold text-gray-600 uppercase tracking-widest">Clinical AI Assistant</p>
                <p className="text-[10px] text-gray-400 max-w-[200px]">Ask for nursing care suggestions, medication explanations, or monitoring guidance.</p>
              </div>
              <div className="grid grid-cols-1 gap-2 w-full max-w-[240px]">
                {[
                  "Explain these lab results...",
                  "Suggest care plan for post-op...",
                  "Risk of drug interactions?",
                  "Infection prevention tips"
                ].map((q, i) => (
                  <button 
                    key={i} 
                    onClick={() => setQuery(q)}
                    className="text-[9px] font-bold text-gray-500 bg-white border border-gray-200 py-1.5 rounded-lg hover:border-purple-300 hover:text-purple-600 transition-all"
                  >
                    "{q}"
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] p-4 rounded-2xl shadow-sm ${
                msg.role === 'user' 
                  ? 'bg-gray-900 text-white rounded-br-none' 
                  : 'bg-white border border-gray-100 text-gray-800 rounded-bl-none'
              }`}>
                {msg.role === 'ai' && (
                  <div className="flex items-center gap-2 mb-2 pb-2 border-b border-gray-50">
                    <Sparkles className="h-3 w-3 text-purple-500" />
                    <span className="text-[9px] font-bold text-purple-600 uppercase tracking-widest">Decision Support Recommendation</span>
                  </div>
                )}
                <div className="text-[11px] leading-relaxed markdown-body">
                  <Markdown>{msg.content}</Markdown>
                </div>
                {msg.role === 'ai' && (
                  <AIFeedback 
                    feature="NurseAIAssistant"
                    query={messages[i-1]?.content || ''}
                    response={msg.content}
                    token={token}
                  />
                )}
                {msg.role === 'ai' && (
                  <div className="mt-3 pt-3 border-t border-gray-50 flex justify-between items-center">
                    <div className="flex gap-3">
                      <button className="text-[9px] font-bold text-gray-400 hover:text-emerald-600 flex items-center gap-1 transition-colors uppercase">
                        <ThumbsUp className="h-3 w-3" />
                        Accept
                      </button>
                      <button className="text-[9px] font-bold text-gray-400 hover:text-rose-600 flex items-center gap-1 transition-colors uppercase">
                        <ThumbsDown className="h-3 w-3" />
                        Reject
                      </button>
                    </div>
                    <button className="text-[9px] font-bold text-gray-300 hover:text-purple-600 transition-colors uppercase">
                      Report Utility
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-white border border-gray-100 p-4 rounded-2xl rounded-bl-none shadow-sm flex items-center gap-3">
                <div className="h-4 w-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                <span className="text-[10px] font-bold text-purple-600 uppercase tracking-widest animate-pulse">Consulting Knowledge Base...</span>
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <form onSubmit={handleSubmit} className="p-4 bg-white border-t border-gray-100">
          <div className="relative">
            <input 
              type="text"
              placeholder="Ask for nursing care support or guidance..."
              className="w-full pl-4 pr-12 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-xs outline-none focus:bg-white focus:ring-2 focus:ring-purple-500/10 focus:border-purple-500 transition-all"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              disabled={loading}
            />
            <button 
              type="submit"
              disabled={!query.trim() || loading}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-gray-900 text-white p-2 rounded-xl hover:bg-black disabled:opacity-50 transition-all"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </form>
      </div>

      <div className="mt-6 p-4 bg-amber-50 border border-amber-100 rounded-2xl flex items-start gap-3">
        <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
        <p className="text-[10px] leading-relaxed text-amber-800 font-medium italic">
          "AI recommendations are intended to assist nursing care and must always be reviewed by qualified healthcare professionals."
        </p>
      </div>
    </div>
  );
}
