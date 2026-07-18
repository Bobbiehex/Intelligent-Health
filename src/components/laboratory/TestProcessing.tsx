import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Send, 
  FlaskConical, 
  AlertCircle, 
  CheckCircle2, 
  Search,
  ChevronRight,
  ClipboardList,
  Cpu,
  BrainCircuit,
  Star,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface LabRequest {
  id: string;
  testName: string;
  department: string;
  status: string;
  patient: { name: string; patientId: string };
  samples: any[];
}

export const TestProcessing: React.FC = () => {
  const [requests, setRequests] = useState<LabRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<LabRequest | null>(null);
  const [activeTab, setActiveTab] = useState<'ENTRY' | 'AI'>('ENTRY');

  // Result Form State
  const [resultForm, setResultForm] = useState({
    resultValue: '',
    unit: '',
    referenceRange: '',
    interpretation: '',
    technicianNotes: '',
    isAbnormal: false,
    abnormalityLevel: 'NORMAL'
  });

  // AI State
  const [aiQuery, setAiQuery] = useState('');
  const [aiResponse, setAiResponse] = useState<any>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [feedback, setFeedback] = useState({
    status: '',
    rating: 0,
    comments: '',
    correction: ''
  });

  useEffect(() => {
    fetchActiveTests();
  }, []);

  const fetchActiveTests = async () => {
    try {
      const response = await fetch('/api/lab/requests?status=SAMPLE_COLLECTED', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await response.json();
      setRequests(data);
    } catch (error) {
      console.error('Failed to fetch tests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitResult = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRequest) return;

    try {
      const response = await fetch('/api/lab/results', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}` 
        },
        body: JSON.stringify({ 
          labRequestId: selectedRequest.id,
          testName: selectedRequest.testName,
          ...resultForm 
        })
      });

      if (response.ok) {
        setSelectedRequest(null);
        fetchActiveTests();
        setResultForm({
          resultValue: '',
          unit: '',
          referenceRange: '',
          interpretation: '',
          technicianNotes: '',
          isAbnormal: false,
          abnormalityLevel: 'NORMAL'
        });
      }
    } catch (error) {
      console.error('Failed to submit result:', error);
    }
  };

  const handleAIInterpret = async () => {
    if (!selectedRequest || !aiQuery) return;
    setAiLoading(true);
    try {
      const response = await fetch('/api/lab/ai/interpret', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}` 
        },
        body: JSON.stringify({ 
          query: aiQuery,
          labRequestId: selectedRequest.id
        })
      });
      const data = await response.json();
      setAiResponse(data);
    } catch (error) {
      console.error('AI interpretation failed:', error);
    } finally {
      setAiLoading(false);
    }
  };

  const submitFeedback = async () => {
    if (!aiResponse?.interactionId) return;
    try {
      await fetch(`/api/lab/ai/feedback/${aiResponse.interactionId}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}` 
        },
        body: JSON.stringify({
          feedbackStatus: feedback.status,
          feedbackRating: feedback.rating,
          feedbackComments: feedback.comments,
          feedbackCorrection: feedback.correction
        })
      });
      // Reset or show success
    } catch (error) {
      console.error('Feedback submission failed:', error);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Left: Active Test Queue */}
      <div className="lg:col-span-1 space-y-6">
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-gray-900 tracking-tight">Active Analysis</h3>
            <span className="text-[10px] font-bold text-blue-500 bg-blue-50 px-2 py-1 rounded-lg uppercase tracking-wider">{requests.length} Processing</span>
          </div>
          
          <div className="space-y-3">
            {loading ? (
              <div className="py-8 text-center text-gray-400 font-medium">Scanning laboratory systems...</div>
            ) : requests.length === 0 ? (
              <div className="py-8 text-center text-gray-400 font-medium">No specimens currently under analysis.</div>
            ) : requests.map((req) => (
              <button 
                key={req.id}
                onClick={() => setSelectedRequest(req)}
                className={`w-full text-left p-5 rounded-2xl border transition-all group ${
                  selectedRequest?.id === req.id 
                    ? 'bg-blue-600 border-blue-600 shadow-lg shadow-blue-100' 
                    : 'bg-white border-gray-100 hover:border-blue-200'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <h4 className={`text-sm font-bold ${selectedRequest?.id === req.id ? 'text-white' : 'text-gray-900'}`}>{req.testName}</h4>
                  <ChevronRight className={`h-4 w-4 transition-transform ${selectedRequest?.id === req.id ? 'text-white translate-x-1' : 'text-gray-300 group-hover:text-blue-500 group-hover:translate-x-1'}`} />
                </div>
                <div className="flex items-center justify-between">
                  <p className={`text-[10px] font-bold uppercase tracking-wider ${selectedRequest?.id === req.id ? 'text-blue-100' : 'text-gray-400'}`}>
                    {req.patient.name}
                  </p>
                  <div className={`h-1.5 w-1.5 rounded-full ${selectedRequest?.id === req.id ? 'bg-white' : 'bg-blue-500'}`} />
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Right: Processing Workspace */}
      <div className="lg:col-span-2">
        <AnimatePresence mode="wait">
          {!selectedRequest ? (
            <motion.div 
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-full flex flex-col items-center justify-center bg-gray-50/50 rounded-[40px] border-2 border-dashed border-gray-200 p-12 text-center"
            >
              <div className="h-20 w-20 bg-white rounded-3xl flex items-center justify-center shadow-sm mb-6">
                <FlaskConical className="h-10 w-10 text-gray-300" />
              </div>
              <h3 className="text-xl font-bold text-gray-400 tracking-tight">Select a specimen from the queue to start analysis</h3>
              <p className="text-gray-300 mt-2 max-w-sm mx-auto">Access digital instrumentation results and AI-powered diagnostic assistance.</p>
            </motion.div>
          ) : (
            <motion.div 
              key="workspace"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-white rounded-[40px] border border-gray-100 shadow-xl overflow-hidden flex flex-col h-[700px]"
            >
              {/* Workspace Header */}
              <div className="p-8 border-b border-gray-50 bg-gray-50/30">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="h-14 w-14 bg-white rounded-2xl flex items-center justify-center shadow-sm">
                      <Cpu className="h-7 w-7 text-blue-500" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-black text-gray-900 tracking-tight">{selectedRequest.testName}</h3>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">{selectedRequest.patient.name} • {selectedRequest.patient.patientId}</p>
                    </div>
                  </div>
                  <div className="flex bg-white p-1 rounded-xl shadow-sm border border-gray-100">
                    <button 
                      onClick={() => setActiveTab('ENTRY')}
                      className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${activeTab === 'ENTRY' ? 'bg-blue-600 text-white shadow-lg shadow-blue-100' : 'text-gray-400'}`}
                    >
                      Result Entry
                    </button>
                    <button 
                      onClick={() => setActiveTab('AI')}
                      className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${activeTab === 'AI' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'text-gray-400'}`}
                    >
                      AI Assistant
                    </button>
                  </div>
                </div>
              </div>

              {/* Workspace Content */}
              <div className="flex-1 overflow-y-auto p-8">
                {activeTab === 'ENTRY' ? (
                  <form onSubmit={handleSubmitResult} className="space-y-8">
                    <div className="grid grid-cols-2 gap-8">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">Primary Result Value</label>
                        <input 
                          required
                          type="text" 
                          placeholder="Enter observed value"
                          className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl text-lg font-bold text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                          value={resultForm.resultValue}
                          onChange={(e) => setResultForm({...resultForm, resultValue: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">Unit of Measurement</label>
                        <input 
                          required
                          type="text" 
                          placeholder="e.g. mg/dL, mmol/L"
                          className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl text-lg font-bold text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                          value={resultForm.unit}
                          onChange={(e) => setResultForm({...resultForm, unit: e.target.value})}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-8">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">Reference Range</label>
                        <input 
                          required
                          type="text" 
                          placeholder="e.g. 70 - 110"
                          className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl text-sm font-bold text-gray-700 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                          value={resultForm.referenceRange}
                          onChange={(e) => setResultForm({...resultForm, referenceRange: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">Abnormality Status</label>
                        <div className="flex gap-3">
                          <button 
                            type="button"
                            onClick={() => setResultForm({...resultForm, isAbnormal: false, abnormalityLevel: 'NORMAL'})}
                            className={`flex-1 py-4 rounded-2xl font-bold text-xs uppercase tracking-widest transition-all ${!resultForm.isAbnormal ? 'bg-emerald-500 text-white' : 'bg-gray-50 text-gray-400'}`}
                          >
                            Normal
                          </button>
                          <button 
                            type="button"
                            onClick={() => setResultForm({...resultForm, isAbnormal: true, abnormalityLevel: 'HIGH'})}
                            className={`flex-1 py-4 rounded-2xl font-bold text-xs uppercase tracking-widest transition-all ${resultForm.isAbnormal ? 'bg-rose-500 text-white' : 'bg-gray-50 text-gray-400'}`}
                          >
                            Abnormal
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">Technician Observations</label>
                      <textarea 
                        rows={4}
                        placeholder="Clinical observations or instrument flags..."
                        className="w-full px-6 py-4 bg-gray-50 border-none rounded-3xl text-sm font-medium text-gray-700 focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none"
                        value={resultForm.technicianNotes}
                        onChange={(e) => setResultForm({...resultForm, technicianNotes: e.target.value})}
                      />
                    </div>

                    <div className="pt-4">
                      <button 
                        type="submit"
                        className="w-full py-6 bg-blue-600 hover:bg-blue-700 text-white rounded-3xl font-black text-sm transition-all shadow-xl shadow-blue-100 uppercase tracking-widest flex items-center justify-center gap-3"
                      >
                        <Send className="h-5 w-5" />
                        Submit for Verification
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="space-y-8 h-full flex flex-col">
                    <div className="relative group shrink-0">
                      <BrainCircuit className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-indigo-400" />
                      <input 
                        type="text" 
                        placeholder="Request AI interpretation or clinical significance..."
                        className="w-full pl-16 pr-24 py-6 bg-indigo-50 border-none rounded-[32px] text-sm font-bold text-indigo-900 focus:ring-4 focus:ring-indigo-100 outline-none transition-all"
                        value={aiQuery}
                        onChange={(e) => setAiQuery(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleAIInterpret()}
                      />
                      <button 
                        onClick={handleAIInterpret}
                        disabled={aiLoading}
                        className="absolute right-3 top-1/2 -translate-y-1/2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all disabled:opacity-50"
                      >
                        {aiLoading ? 'Thinking...' : 'Consult AI'}
                      </button>
                    </div>

                    <div className="flex-1 min-h-0">
                      {aiResponse ? (
                        <motion.div 
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="h-full flex flex-col"
                        >
                          <div className="flex-1 overflow-y-auto space-y-6 pr-4">
                            <div className="bg-indigo-50/50 p-8 rounded-[40px] border border-indigo-100 relative">
                              <div className="flex items-center justify-between mb-4">
                                <span className="px-3 py-1 bg-white text-indigo-600 text-[10px] font-black uppercase tracking-widest rounded-lg border border-indigo-100 shadow-sm">
                                  AI Analysis Result
                                </span>
                                <div className="flex items-center gap-2">
                                  <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Confidence</span>
                                  <span className="text-sm font-black text-indigo-900">{(aiResponse.confidenceScore || 0).toFixed(1)}%</span>
                                </div>
                              </div>
                              <p className="text-gray-700 leading-relaxed font-medium mb-6">{aiResponse.response}</p>
                              
                              <div className="space-y-4">
                                <div className="flex items-start gap-3">
                                  <div className="mt-1 h-5 w-5 bg-white rounded-lg flex items-center justify-center shrink-0 shadow-sm">
                                    <ClipboardList className="h-3 w-3 text-indigo-500" />
                                  </div>
                                  <div>
                                    <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">Clinical Rationale</p>
                                    <p className="text-xs text-gray-600 font-medium">{aiResponse.rationale}</p>
                                  </div>
                                </div>
                                <div className="flex items-start gap-3">
                                  <div className="mt-1 h-5 w-5 bg-white rounded-lg flex items-center justify-center shrink-0 shadow-sm">
                                    <Info className="h-3 w-3 text-indigo-500" />
                                  </div>
                                  <div>
                                    <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">Alternatives & Follow-up</p>
                                    <p className="text-xs text-gray-600 font-medium">{aiResponse.alternatives}</p>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Reinforcement Learning Feedback Section */}
                            <div className="bg-gray-50 p-8 rounded-[40px] border border-gray-100">
                              <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-6 px-2">Training Feedback (RL)</h4>
                              <div className="space-y-6">
                                <div className="flex items-center gap-4">
                                  <span className="text-xs font-bold text-gray-500">Rate Recommendation:</span>
                                  <div className="flex gap-2">
                                    {[1, 2, 3, 4, 5].map(star => (
                                      <button 
                                        key={star}
                                        onClick={() => setFeedback({...feedback, rating: star})}
                                        className={`p-2 rounded-xl transition-all ${feedback.rating >= star ? 'bg-amber-50 text-amber-500 shadow-sm' : 'bg-white text-gray-200'}`}
                                      >
                                        <Star className="h-4 w-4 fill-current" />
                                      </button>
                                    ))}
                                  </div>
                                </div>
                                
                                <div className="flex gap-4">
                                  <button 
                                    onClick={() => setFeedback({...feedback, status: 'ACCEPTED'})}
                                    className={`flex-1 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest border transition-all ${feedback.status === 'ACCEPTED' ? 'bg-emerald-500 text-white border-emerald-500' : 'bg-white text-emerald-500 border-emerald-200'}`}
                                  >
                                    Accept Logic
                                  </button>
                                  <button 
                                    onClick={() => setFeedback({...feedback, status: 'REJECTED'})}
                                    className={`flex-1 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest border transition-all ${feedback.status === 'REJECTED' ? 'bg-rose-500 text-white border-rose-500' : 'bg-white text-rose-500 border-rose-200'}`}
                                  >
                                    Reject Logic
                                  </button>
                                </div>

                                {feedback.status === 'REJECTED' && (
                                  <textarea 
                                    rows={3}
                                    placeholder="Please provide clinical corrections to improve the AI model..."
                                    className="w-full px-6 py-4 bg-white border-none rounded-2xl text-xs font-medium text-gray-700 focus:ring-2 focus:ring-indigo-500 outline-none transition-all resize-none shadow-sm"
                                    value={feedback.correction}
                                    onChange={(e) => setFeedback({...feedback, correction: e.target.value})}
                                  />
                                )}

                                <button 
                                  onClick={submitFeedback}
                                  className="w-full py-4 bg-gray-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-gray-800 transition-all shadow-lg"
                                >
                                  Submit Training Feedback
                                </button>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ) : (
                        <div className="h-full flex flex-col items-center justify-center text-center p-12">
                          <Cpu className="h-12 w-12 text-indigo-100 mb-4" />
                          <p className="text-sm font-bold text-indigo-200">Request analysis to see AI insights here.</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
              
              {/* Mandatory Disclaimer */}
              <div className="px-8 py-4 bg-amber-50 border-t border-amber-100 shrink-0">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-3 w-3 text-amber-500" />
                  <p className="text-[9px] font-bold text-amber-700 leading-none">
                    AI recommendations are intended to support laboratory analysis and must always be verified by qualified laboratory professionals.
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
