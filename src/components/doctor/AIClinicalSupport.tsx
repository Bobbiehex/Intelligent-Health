import React, { useState } from 'react';
import { Sparkles, Send, Star, ThumbsUp, ThumbsDown, Info, AlertTriangle, CheckCircle2, RotateCcw } from 'lucide-react';
import { AIRecommendation } from '../../types';
import AIFeedback from '../AIFeedback';

interface AIClinicalSupportProps {
  consultationId: string;
  patientContext: string;
  token: string;
}

export default function AIClinicalSupport({ consultationId, patientContext, token }: AIClinicalSupportProps) {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<AIRecommendation[]>([]);
  const [feedbackState, setFeedbackState] = useState<{ [id: string]: any }>({});

  const requestSupport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    try {
      const res = await fetch('/api/doctor/ai-assist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ consultationId, prompt: query, patientContext })
      });
      const data = await res.json();
      console.log('Response data:', data);
      if (!res.ok) throw new Error(data.error || 'Failed to get support');
      setRecommendations([data, ...recommendations]);
      setQuery('');
    } catch (err: any) {
      console.error('AI Request Error:', err);
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const submitFeedback = async (recId: string, action: string) => {
    const feedback = feedbackState[recId] || { rating: 5, feedbackText: '' };
    try {
      const res = await fetch(`/api/doctor/ai-recommendations/${recId}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ ...feedback, doctorAction: action })
      });
      if (!res.ok) throw new Error('Failed to submit feedback');
      
      // Update local state
      setRecommendations(recommendations.map(r => 
        r.id === recId ? { ...r, status: action === 'Accept' ? 'Accepted' : 'Rejected' } : r
      ));
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-gray-100 shadow-xl shadow-indigo-500/5 flex flex-col h-[700px]">
      <div className="p-6 border-b border-gray-50 flex items-center justify-between bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-t-3xl">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5" />
          <h2 className="font-bold">AI Clinical Assistant</h2>
        </div>
        <div className="px-2 py-1 bg-white/20 rounded-lg text-[10px] font-bold uppercase tracking-wider">
          Decision Support
        </div>
      </div>

      {/* Prominent Clinical Disclaimer */}
      <div className="mx-4 mt-4 p-3 bg-amber-50 border border-amber-100 rounded-2xl flex items-start gap-3">
        <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
        <p className="text-[10px] leading-relaxed text-amber-800 font-medium">
          <span className="font-bold">Clinical Advisory:</span> AI recommendations are intended for decision support only. All outputs must be reviewed, verified, and authorized by a licensed medical professional before implementation.
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {recommendations.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-8 opacity-40">
            <Sparkles className="h-12 w-12 mb-4 text-indigo-300" />
            <p className="text-sm font-medium text-gray-500">How can I assist your clinical decision-making today?</p>
            <p className="text-xs text-gray-400 mt-2">Ask for differential diagnosis, drug interactions, or treatment guidelines.</p>
          </div>
        ) : (
          recommendations.map((rec) => (
            <div key={rec.id} className="bg-gray-50/50 rounded-2xl border border-gray-100 overflow-hidden">
              <div className="p-4 space-y-3">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg uppercase">
                      Recommendation
                    </span>
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">
                      {rec.confidenceScore}% Confidence
                    </span>
                  </div>
                  {rec.status !== 'Pending' && (
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-lg uppercase ${
                      rec.status === 'Accepted' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                    }`}>
                      {rec.status}
                    </span>
                  )}
                </div>

                <p className="text-xs font-bold text-gray-800 leading-relaxed">
                  {rec.recommendation}
                </p>

                <AIFeedback 
                  feature="DoctorClinicalAssistant"
                  query={rec.recommendation} // Using the recommendation as query context for generic feedback
                  response={rec.explanation || ''}
                  token={token}
                />

                <details className="group">
                  <summary className="text-[10px] font-bold text-gray-400 cursor-pointer flex items-center gap-1 hover:text-indigo-600 transition-colors">
                    <Info className="h-3 w-3" />
                    SEE REASONING & EVIDENCE
                  </summary>
                  <div className="mt-3 p-3 bg-white rounded-xl border border-gray-100 text-[11px] text-gray-600 space-y-2">
                    <p><span className="font-bold text-gray-800">Clinical Reasoning:</span> {rec.clinicalReasoning}</p>
                    <p><span className="font-bold text-gray-800">Rationale:</span> {rec.supportingRationale}</p>
                    {rec.possibleRisks && <p className="text-rose-600"><span className="font-bold">Risks:</span> {rec.possibleRisks}</p>}
                  </div>
                </details>

                {rec.status === 'Pending' && (
                  <div className="pt-3 border-t border-gray-100 flex gap-2">
                    <button 
                      onClick={() => submitFeedback(rec.id, 'Accept')}
                      className="flex-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 py-2 rounded-xl text-[10px] font-bold flex items-center justify-center gap-1 transition-all"
                    >
                      <ThumbsUp className="h-3 w-3" />
                      Accept
                    </button>
                    <button 
                      onClick={() => submitFeedback(rec.id, 'Reject')}
                      className="flex-1 bg-rose-50 hover:bg-rose-100 text-rose-700 py-2 rounded-xl text-[10px] font-bold flex items-center justify-center gap-1 transition-all"
                    >
                      <ThumbsDown className="h-3 w-3" />
                      Reject
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      <div className="p-4 border-t border-gray-50">
        <form onSubmit={requestSupport} className="relative">
          <input 
            type="text" 
            placeholder="Enter clinical decision support query..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            disabled={loading}
            className="w-full pl-4 pr-12 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-xs focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all"
          />
          <button 
            type="submit"
            disabled={loading || !query.trim()}
            className="absolute right-2 top-2 h-8 w-8 bg-indigo-600 text-white rounded-xl flex items-center justify-center hover:bg-indigo-700 disabled:opacity-50 transition-all"
          >
            {loading ? (
              <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
