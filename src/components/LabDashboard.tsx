import React, { useState, useEffect } from 'react';
import { 
  Activity, Clipboard, PlusCircle, CheckSquare, Sparkles, AlertTriangle, AlertCircle, RefreshCw 
} from 'lucide-react';
import { LabReport } from '../types';
import AIFeedback from './AIFeedback';

interface LabDashboardProps {
  user: any;
  token: string;
}

export default function LabDashboard({ user, token }: LabDashboardProps) {
  const [reports, setReports] = useState<LabReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [selectedReport, setSelectedReport] = useState<LabReport | null>(null);

  // Forms
  const [parameters, setParameters] = useState<Array<{ parameter: string; value: string; unit: string; referenceRange: string; isAbnormal: boolean }>>([
    { parameter: 'Total Cholesterol', value: '240', unit: 'mg/dL', referenceRange: '< 200 mg/dL', isAbnormal: true },
    { parameter: 'HDL Cholesterol', value: '35', unit: 'mg/dL', referenceRange: '> 40 mg/dL', isAbnormal: true },
    { parameter: 'LDL Cholesterol', value: '160', unit: 'mg/dL', referenceRange: '< 100 mg/dL', isAbnormal: true },
    { parameter: 'Serum Triglycerides', value: '180', unit: 'mg/dL', referenceRange: '< 150 mg/dL', isAbnormal: true }
  ]);

  useEffect(() => {
    fetchLabReports();
  }, []);

  useEffect(() => {
    if (selectedReportId) {
      const match = reports.find(r => r.id === selectedReportId);
      setSelectedReport(match || null);
    }
  }, [selectedReportId, reports]);

  const fetchLabReports = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/lab-reports', { headers: { 'Authorization': `Bearer ${token}` } });
      let data: any[] = [];
      if (res.ok) {
        try {
          data = await res.json();
        } catch (err) {
          console.error('Failed to parse lab reports JSON:', err);
        }
      }
      setReports(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitResults = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReportId) return;

    try {
      const res = await fetch(`/api/lab-reports/${selectedReportId}/results`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ results: parameters })
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error);
      }
      alert('Lab biomarker results submitted! Gemini is compiling pathology interpretation in background.');
      setSelectedReportId(null);
      setSelectedReport(null);
      fetchLabReports();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Lab Header */}
      <div className="bg-white border border-gray-100 p-6 rounded-3xl shadow-xs flex justify-between items-center">
        <div>
          <h2 className="font-display font-bold text-gray-900 text-lg">Pathology Laboratory Diagnostic Desk</h2>
          <p className="text-xs text-gray-400 mt-0.5">Welcome, {user.name} • Input pathology biomarker measurements and trigger clinical diagnostics</p>
        </div>
        <button 
          onClick={fetchLabReports} 
          className="bg-gray-50 border border-gray-100 p-2.5 rounded-xl text-gray-600 hover:bg-gray-100 transition-colors"
        >
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Side: Pending/Completed Lab orders list */}
        <div className="lg:col-span-5 bg-white border border-gray-100 rounded-3xl p-6 shadow-xs flex flex-col h-[650px]">
          <div className="mb-4">
            <h3 className="font-bold text-sm text-gray-800 flex items-center space-x-2">
              <Activity className="h-4 w-4 text-indigo-500" />
              <span>Lab Accession Queue</span>
            </h3>
            <p className="text-[10px] text-gray-400 font-mono mt-0.5">DOCTOR DIAGNOSTIC REQUESTS</p>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3">
            {loading ? (
              <p className="text-xs text-center text-gray-400 font-mono py-8">Pulling diagnostic records...</p>
            ) : reports.length > 0 ? (
              reports.map((report) => {
                const isSelected = selectedReportId === report.id;
                return (
                  <button
                    key={report.id}
                    onClick={() => setSelectedReportId(report.id)}
                    className={`w-full p-4 rounded-2xl border text-left transition-all ${
                      isSelected 
                        ? 'border-indigo-200 bg-indigo-50/40' 
                        : 'border-gray-50 hover:border-gray-100 hover:bg-gray-50/40'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-[10px] font-mono font-bold text-gray-400 uppercase">ID: {report.id.slice(0, 8).toUpperCase()}</span>
                      <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${
                        report.status === 'Completed' 
                          ? 'bg-emerald-50 text-emerald-700' 
                          : 'bg-amber-50 text-amber-700'
                      }`}>
                        {report.status.toUpperCase()}
                      </span>
                    </div>

                    <span className="font-semibold text-xs text-gray-800 block">{report.testName}</span>
                    <span className="text-[10px] text-gray-400 block mt-0.5 font-mono">Patient: {report.patient?.name || 'In-clinic Patient'} (DOB: {report.patient?.dob || '—'})</span>
                  </button>
                );
              })
            ) : (
              <p className="text-xs text-center text-gray-400 font-mono py-8">No diagnostic panels requested.</p>
            )}
          </div>
        </div>

        {/* Right Side: Log Results Workspace */}
        <div className="lg:col-span-7">
          {selectedReport ? (
            <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-xs space-y-6">
              <div className="border-b border-gray-50 pb-4">
                <span className="text-[10px] font-mono text-gray-400 block uppercase">SECURED WORKSHEET • STATUS: {selectedReport.status}</span>
                <h3 className="font-display font-bold text-gray-800 text-base">{selectedReport.testName}</h3>
                <p className="text-xs text-gray-400 font-mono mt-0.5">Patient Name: {selectedReport.patient?.name} • Ordered by: {selectedReport.orderedBy}</p>
              </div>

              {selectedReport.status === 'Pending' ? (
                <form onSubmit={handleSubmitResults} className="space-y-4 text-xs">
                  <div className="mb-2">
                    <span className="font-bold text-gray-700 block text-xs font-mono uppercase tracking-wide">Enter Biomarker Quantities</span>
                    <p className="text-[10px] text-gray-400 mt-0.5">Adjust measurements and toggle the severity warning flags:</p>
                  </div>

                  <div className="space-y-3">
                    {parameters.map((param, index) => (
                      <div key={index} className="grid grid-cols-12 gap-2 items-center bg-gray-50/50 p-3 rounded-xl border border-gray-100/30">
                        <div className="col-span-4 font-semibold text-gray-700">{param.parameter}</div>
                        
                        <div className="col-span-3">
                          <input
                            required
                            type="text"
                            value={param.value}
                            onChange={(e) => {
                              const copy = [...parameters];
                              copy[index].value = e.target.value;
                              setParameters(copy);
                            }}
                            className="w-full border border-gray-200 rounded-lg p-2 text-xs bg-white text-center font-bold"
                          />
                        </div>

                        <div className="col-span-2 text-gray-400 font-mono text-[10px] text-center">{param.unit}</div>

                        <div className="col-span-3 flex justify-end items-center space-x-2">
                          <label className="text-[10px] font-mono text-gray-400">ABNORMAL?</label>
                          <input
                            type="checkbox"
                            checked={param.isAbnormal}
                            onChange={(e) => {
                              const copy = [...parameters];
                              copy[index].isAbnormal = e.target.checked;
                              setParameters(copy);
                            }}
                            className="h-4 w-4 text-rose-500 accent-rose-500 focus:ring-0 cursor-pointer"
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-indigo-500 hover:bg-indigo-600 text-white font-bold p-3 rounded-xl text-xs transition-colors flex items-center justify-center space-x-2 shadow-xs mt-6"
                  >
                    <Sparkles className="h-4 w-4" />
                    <span>Authorize Lab Panel Results & Trigger Gemini Scan</span>
                  </button>
                </form>
              ) : (
                <div className="space-y-6">
                  {/* Results list */}
                  <div className="space-y-3 text-xs">
                    <span className="font-bold text-gray-700 block font-mono uppercase tracking-wide">Biomarker Measurements Recorded:</span>
                    {selectedReport.results && selectedReport.results.map((r, idx) => (
                      <div key={idx} className="bg-gray-50 p-3 rounded-xl border border-gray-100 flex justify-between items-center">
                        <span className="font-bold text-gray-800">{r.parameter}</span>
                        <div className="flex space-x-4 items-center">
                          <span className={`font-bold px-1.5 py-0.5 rounded ${
                            r.isAbnormal ? 'bg-rose-50 text-rose-600 border border-rose-100' : 'text-gray-700'
                          }`}>
                            {r.value} {r.unit}
                          </span>
                          <span className="text-[10px] text-gray-400 font-mono">Range: {r.referenceRange}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Interpretation */}
                  <div className="bg-blue-50/20 border border-blue-100/30 p-5 rounded-2xl space-y-2 text-xs leading-relaxed">
                    <span className="font-bold text-blue-700 block uppercase tracking-wide font-mono text-[9px]">Google Gemini Pathology Interpretation:</span>
                    <p className="text-gray-600 bg-white/70 p-4 rounded-xl border border-blue-100/20 whitespace-pre-line">{selectedReport.aiInterpretation}</p>
                    
                    {selectedReport.aiInterpretation && (
                      <AIFeedback 
                        feature="LabPathologyInterpretation"
                        query={selectedReport.testName}
                        response={selectedReport.aiInterpretation}
                        token={token}
                      />
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="border border-dashed border-gray-200 rounded-3xl p-12 text-center text-gray-400 bg-white h-[350px] flex flex-col justify-center items-center">
              <Clipboard className="h-10 w-10 text-gray-300 mb-3 animate-pulse" />
              <p className="text-sm">Please select a lab panel order from the accession queue on the left to document results.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
