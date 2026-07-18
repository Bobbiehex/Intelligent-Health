import React, { useState, useEffect } from 'react';
import { 
  Bot, 
  Send, 
  Sparkles, 
  ShieldAlert, 
  BrainCircuit, 
  ThumbsUp, 
  ThumbsDown, 
  RotateCcw,
  MessageSquare,
  Zap,
  Info,
  CheckCircle2,
  XCircle,
  FileText,
  History as HistoryIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';

interface AIPharmacyAssistantProps {
  token: string;
  user: any;
}

export const AIPharmacyAssistant: React.FC<AIPharmacyAssistantProps> = ({ token, user }) => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [activeAnalysis, setActiveAnalysis] = useState<any>(null);

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    try {
      const response = await fetch('/api/pharmacy/ai/analyze', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({
          query,
          context: 'General pharmacological inquiry'
        })
      });

      if (!response.ok) throw new Error('AI Analysis failed');
      
      const result = await response.json();
      setActiveAnalysis(result);
      setHistory([result, ...history]);
      setQuery('');
      toast.success('Pharmacological analysis complete');
    } catch (error) {
      toast.error('AI assistant is currently unavailable');
    } finally {
      setLoading(false);
    }
  };

  const handleFeedback = async (id: string, status: 'ACCEPTED' | 'REJECTED', rating: number) => {
    try {
      const response = await fetch(`/api/pharmacy/ai/feedback/${id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({
          feedbackStatus: status,
          feedbackRating: rating,
          feedbackComments: status === 'ACCEPTED' ? 'Helpful and accurate' : 'Inaccurate or risky'
        })
      });

      if (response.ok) {
        toast.success('Reinforcement Learning feedback recorded');
        // Update local state
        setHistory(history.map(h => h.id === id ? { ...h, feedbackStatus: status } : h));
        if (activeAnalysis?.id === id) setActiveAnalysis({ ...activeAnalysis, feedbackStatus: status });
      }
    } catch (error) {
      toast.error('Failed to submit feedback');
    }
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
      {/* Interaction Hub */}
      <div className="xl:col-span-2 space-y-8">
        <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm space-y-8">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 bg-emerald-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-100">
                <BrainCircuit className="h-7 w-7 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Clinical Decision Engine</h2>
                <p className="text-slate-500 font-medium">Pharmacological intelligence powered by Gemini 1.5</p>
              </div>
            </div>
            <div className="flex bg-slate-50 p-1.5 rounded-xl border border-slate-100">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-lg shadow-sm">
                <Zap className="h-3 w-3 text-emerald-500 fill-emerald-500" />
                <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Active</span>
              </div>
            </div>
          </div>

          <form onSubmit={handleAnalyze} className="relative">
            <textarea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Query pharmacological interactions, contraindications, or dosage guidance..."
              className="w-full h-48 p-8 bg-slate-50 border-none rounded-[2.5rem] text-sm font-bold text-slate-600 focus:ring-2 focus:ring-emerald-500 outline-none resize-none shadow-inner"
            />
            <div className="absolute bottom-6 right-6 flex gap-3">
              <button 
                type="button"
                className="p-4 bg-white text-slate-400 hover:text-slate-600 rounded-2xl border border-slate-100 transition-all"
              >
                <Sparkles className="h-5 w-5" />
              </button>
              <button 
                type="submit"
                disabled={loading || !query.trim()}
                className="px-8 py-4 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-bold text-xs shadow-xl transition-all active:scale-95 flex items-center gap-3 disabled:opacity-50"
              >
                {loading ? <RotateCcw className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                Analyze Logic
              </button>
            </div>
          </form>
        </div>

        {/* Active Result View */}
        <AnimatePresence mode="wait">
          {activeAnalysis && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-xl shadow-slate-200/40 space-y-8"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 text-emerald-600">
                  <CheckCircle2 className="h-6 w-6" />
                  <h3 className="text-xl font-black text-slate-900 tracking-tight">AI Analytical Report</h3>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-xl text-[10px] font-black text-slate-500 uppercase tracking-[0.15em]">
                  Confidence: {activeAnalysis.confidenceScore}%
                </div>
              </div>

              <div className="p-8 bg-slate-50 rounded-[2rem] border border-slate-100">
                <p className="text-sm font-bold text-slate-700 leading-relaxed italic">
                  "{activeAnalysis.response}"
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-rose-600">
                    <ShieldAlert className="h-4 w-4" />
                    <p className="text-[10px] font-black uppercase tracking-widest">Critical Warnings</p>
                  </div>
                  <div className="p-6 bg-rose-50 border border-rose-100 rounded-2xl text-xs font-bold text-rose-800 leading-relaxed">
                    {activeAnalysis.safetyWarnings || 'No immediate contraindications detected for this specific query.'}
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-blue-600">
                    <Info className="h-4 w-4" />
                    <p className="text-[10px] font-black uppercase tracking-widest">Clinical Rationale</p>
                  </div>
                  <div className="p-6 bg-blue-50 border border-blue-100 rounded-2xl text-xs font-bold text-blue-800 leading-relaxed">
                    {activeAnalysis.rationale}
                  </div>
                </div>
              </div>

              {/* RL Feedback Module */}
              <div className="pt-8 border-t border-slate-50 flex flex-col md:flex-row items-center justify-between gap-6">
                <div>
                  <p className="text-sm font-black text-slate-900 tracking-tight">Reinforcement Learning Feedback</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Was this pharmacological analysis accurate?</p>
                </div>
                <div className="flex items-center gap-3">
                  {activeAnalysis.feedbackStatus ? (
                    <div className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-xs font-bold ${
                      activeAnalysis.feedbackStatus === 'ACCEPTED' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                    }`}>
                      {activeAnalysis.feedbackStatus === 'ACCEPTED' ? <ThumbsUp className="h-4 w-4" /> : <ThumbsDown className="h-4 w-4" />}
                      Feedback Recorded
                    </div>
                  ) : (
                    <>
                      <button 
                        onClick={() => handleFeedback(activeAnalysis.id, 'ACCEPTED', 5)}
                        className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-2xl font-bold text-xs hover:bg-emerald-600 transition-all active:scale-95"
                      >
                        <ThumbsUp className="h-4 w-4" /> Yes, Accurate
                      </button>
                      <button 
                        onClick={() => handleFeedback(activeAnalysis.id, 'REJECTED', 1)}
                        className="flex items-center gap-2 px-6 py-3 bg-slate-50 text-slate-400 rounded-2xl font-bold text-xs hover:bg-rose-50 hover:text-rose-600 transition-all active:scale-95"
                      >
                        <ThumbsDown className="h-4 w-4" /> Risky/Incorrect
                      </button>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* History Sidebar */}
      <div className="space-y-6">
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col h-full">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-black text-slate-900 tracking-tight">Analysis History</h3>
            <div className="h-8 w-8 bg-slate-50 rounded-full flex items-center justify-center">
              <HistoryIcon className="h-4 w-4 text-slate-400" />
            </div>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto max-h-[700px] pr-2 custom-scrollbar">
            {history.length > 0 ? (
              history.map((h, idx) => (
                <div 
                  key={idx} 
                  onClick={() => setActiveAnalysis(h)}
                  className={`p-6 rounded-3xl border transition-all cursor-pointer group ${
                    activeAnalysis?.id === h.id ? 'bg-slate-900 border-slate-900' : 'bg-slate-50 border-slate-100 hover:border-emerald-200'
                  }`}
                >
                  <p className={`text-xs font-bold leading-relaxed line-clamp-2 ${
                    activeAnalysis?.id === h.id ? 'text-slate-300' : 'text-slate-600'
                  }`}>
                    "{h.query}"
                  </p>
                  <div className="mt-4 flex items-center justify-between">
                    <p className={`text-[10px] font-black uppercase tracking-widest ${
                      activeAnalysis?.id === h.id ? 'text-emerald-400' : 'text-slate-400'
                    }`}>
                      {new Date(h.createdAt).toLocaleDateString()}
                    </p>
                    <div className={`p-2 rounded-lg transition-colors ${
                      activeAnalysis?.id === h.id ? 'bg-slate-800 text-white' : 'bg-white text-slate-300 group-hover:text-emerald-500'
                    }`}>
                      <Zap className="h-3 w-3" />
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center h-64 text-center opacity-30">
                <MessageSquare className="h-10 w-10 text-slate-300 mb-4" />
                <p className="text-sm font-bold text-slate-400">No history found</p>
              </div>
            )}
          </div>

          <button className="w-full mt-8 py-4 bg-emerald-50 text-emerald-600 font-bold text-xs rounded-2xl hover:bg-emerald-100 transition-all flex items-center justify-center gap-2">
            <FileText className="h-3.5 w-3.5" /> Export Intelligence Log
          </button>
        </div>
      </div>
    </div>
  );
};
