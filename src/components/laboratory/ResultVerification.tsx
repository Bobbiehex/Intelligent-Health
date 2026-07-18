import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  XCircle, 
  RotateCcw, 
  Eye, 
  FileCheck,
  Search,
  User,
  Activity,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface LabResult {
  id: string;
  testName: string;
  resultValue: string;
  unit: string;
  referenceRange: string;
  interpretation?: string;
  isAbnormal: boolean;
  abnormalityLevel: string;
  verificationStatus: string;
  createdAt: string;
  labRequest: {
    patient: { name: string; patientId: string };
    doctor: { name: string };
  };
}

export const ResultVerification: React.FC = () => {
  const [pendingResults, setPendingResults] = useState<LabResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedResult, setSelectedResult] = useState<LabResult | null>(null);

  useEffect(() => {
    fetchPendingResults();
  }, []);

  const fetchPendingResults = async () => {
    try {
      const response = await fetch('/api/lab/requests?status=AWAITING_VERIFICATION', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await response.json();
      // Extract results from requests
      const results: LabResult[] = [];
      data.forEach((req: any) => {
        req.results.forEach((res: any) => {
          if (res.verificationStatus === 'PENDING') {
            results.push({ ...res, labRequest: { patient: req.patient, doctor: req.doctor } });
          }
        });
      });
      setPendingResults(results);
    } catch (error) {
      console.error('Failed to fetch pending results:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (id: string, status: 'APPROVED' | 'CORRECTION_REQUESTED') => {
    try {
      const response = await fetch(`/api/lab/results/${id}/verify`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}` 
        },
        body: JSON.stringify({ status })
      });
      if (response.ok) {
        setSelectedResult(null);
        fetchPendingResults();
      }
    } catch (error) {
      console.error('Verification failed:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 tracking-tight">Result Verification Queue</h2>
          <p className="text-sm text-gray-500 font-medium">Review and authorize completed laboratory analysis reports</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Queue List */}
        <div className="lg:col-span-5 bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden flex flex-col h-[600px]">
          <div className="p-6 border-b border-gray-50">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input 
                type="text" 
                placeholder="Search pending reports..."
                className="w-full pl-11 pr-4 py-3 bg-gray-50 border-none rounded-2xl text-xs font-bold outline-none"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {loading ? (
              <div className="py-12 text-center">
                <Activity className="h-6 w-6 text-blue-500 animate-spin mx-auto mb-2" />
                <p className="text-xs font-bold text-gray-400">Loading pending reviews...</p>
              </div>
            ) : pendingResults.length === 0 ? (
              <div className="py-12 text-center">
                <FileCheck className="h-10 w-10 text-gray-200 mx-auto mb-2" />
                <p className="text-xs font-bold text-gray-400">All results have been verified.</p>
              </div>
            ) : pendingResults.map((res) => (
              <button 
                key={res.id}
                onClick={() => setSelectedResult(res)}
                className={`w-full text-left p-5 rounded-2xl border transition-all ${
                  selectedResult?.id === res.id 
                    ? 'bg-blue-600 border-blue-600 shadow-lg shadow-blue-100 text-white' 
                    : 'bg-white border-gray-100 hover:border-blue-200'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <h4 className="text-sm font-bold">{res.testName}</h4>
                  {res.isAbnormal && <AlertCircle className={`h-4 w-4 ${selectedResult?.id === res.id ? 'text-white' : 'text-rose-500'}`} />}
                </div>
                <p className={`text-[10px] font-bold uppercase tracking-wider ${selectedResult?.id === res.id ? 'text-blue-100' : 'text-gray-400'}`}>
                  {res.labRequest.patient.name} • {new Date(res.createdAt).toLocaleDateString()}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Verification Detail View */}
        <div className="lg:col-span-7 h-[600px]">
          <AnimatePresence mode="wait">
            {!selectedResult ? (
              <motion.div 
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="h-full flex flex-col items-center justify-center bg-gray-50/50 rounded-[40px] border-2 border-dashed border-gray-200 p-12 text-center"
              >
                <FileCheck className="h-12 w-12 text-gray-200 mb-4" />
                <h3 className="text-lg font-bold text-gray-400 tracking-tight">Select a result to begin clinical verification</h3>
              </motion.div>
            ) : (
              <motion.div 
                key="detail"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white h-full rounded-[40px] border border-gray-100 shadow-xl overflow-hidden flex flex-col"
              >
                <div className="p-8 bg-gray-50/30 border-b border-gray-50 shrink-0">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-4">
                      <div className="h-14 w-14 bg-white rounded-2xl flex items-center justify-center shadow-sm">
                        <User className="h-7 w-7 text-blue-500" />
                      </div>
                      <div>
                        <h3 className="text-xl font-black text-gray-900 tracking-tight">{selectedResult.labRequest.patient.name}</h3>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{selectedResult.labRequest.patient.patientId}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Test Panel</p>
                      <p className="text-sm font-bold text-blue-600">{selectedResult.testName}</p>
                    </div>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-10 space-y-8">
                  <div className="grid grid-cols-2 gap-8">
                    <div className="bg-gray-50 p-8 rounded-[32px] border border-gray-100 flex flex-col items-center justify-center text-center">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Observed Result</p>
                      <p className={`text-4xl font-black ${selectedResult.isAbnormal ? 'text-rose-600' : 'text-gray-900'}`}>
                        {selectedResult.resultValue} <span className="text-lg text-gray-400 font-bold">{selectedResult.unit}</span>
                      </p>
                      <p className={`text-[10px] font-black uppercase mt-4 px-3 py-1 rounded-lg ${selectedResult.isAbnormal ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-600'}`}>
                        {selectedResult.abnormalityLevel || 'NORMAL'}
                      </p>
                    </div>
                    <div className="bg-gray-50 p-8 rounded-[32px] border border-gray-100 flex flex-col items-center justify-center text-center">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Reference Range</p>
                      <p className="text-2xl font-black text-gray-600">{selectedResult.referenceRange}</p>
                      <p className="text-[10px] font-bold text-gray-400 mt-4 uppercase tracking-widest">Normal Interval</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">Medical Interpretation</h4>
                    <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm italic text-gray-600 text-sm leading-relaxed">
                      {selectedResult.interpretation || "No automatic interpretation provided."}
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">Ordering Physician</h4>
                    <div className="flex items-center gap-3 bg-gray-50 p-4 rounded-2xl border border-gray-100">
                      <div className="h-8 w-8 bg-white rounded-lg flex items-center justify-center shadow-sm">
                        <User className="h-4 w-4 text-gray-400" />
                      </div>
                      <span className="text-xs font-bold text-gray-700">{selectedResult.labRequest.doctor.name}</span>
                    </div>
                  </div>
                </div>

                <div className="p-8 border-t border-gray-50 flex gap-4 bg-gray-50/20 shrink-0">
                  <button 
                    onClick={() => handleVerify(selectedResult.id, 'CORRECTION_REQUESTED')}
                    className="flex-1 py-5 bg-white border border-rose-200 text-rose-600 rounded-[24px] font-black text-[10px] uppercase tracking-widest hover:bg-rose-50 transition-all flex items-center justify-center gap-2"
                  >
                    <RotateCcw className="h-4 w-4" />
                    Request Correction
                  </button>
                  <button 
                    onClick={() => handleVerify(selectedResult.id, 'APPROVED')}
                    className="flex-1 py-5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-[24px] font-black text-[10px] uppercase tracking-widest shadow-xl shadow-emerald-100 transition-all flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Authorize & Release
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
