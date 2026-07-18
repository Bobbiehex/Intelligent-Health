import React, { useState, useEffect } from 'react';
import { 
  FileText, Activity, Pill, Clock, Download, Search, 
  ChevronRight, Filter, FileSpreadsheet, Eye, Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { useSWR } from '../../utils/apiClient';

interface MedicalRecordsProps {
  user: any;
  token: string;
}

export default function MedicalRecords({ user, token }: MedicalRecordsProps) {
  const [activeTab, setActiveTab] = useState<'timeline' | 'prescriptions' | 'labs' | 'radiology'>('timeline');
  
  const { data, isLoading } = useSWR<any>('/api/patient/medical-records', { token });

  const handleDownload = async (type: string, id: string) => {
    toast.loading(`Generating ${type} report...`, { id: 'pdf-gen' });
    try {
      let url = '/api/patient/export/';
      if (type === 'Prescription') url += `prescription/${id}`;
      else if (type === 'Lab Report') url += `lab/${id}`;
      else if (type === 'Radiology Images') url += `radiology/${id}`;
      else throw new Error('Unsupported report type');

      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to download');
      
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `${type}-${id}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      toast.success(`${type} report downloaded successfully!`, { id: 'pdf-gen' });
    } catch (error) {
      toast.error(`Failed to download ${type} report`, { id: 'pdf-gen' });
    }
  };

  if (isLoading || !data) return (
    <div className="flex flex-col items-center justify-center min-h-[400px] text-slate-400 font-mono text-xs">
      <FileSpreadsheet className="animate-pulse mb-4 text-indigo-600" size={32} />
      <span>RETRIEVING SECURE CLINICAL DOSSIER...</span>
    </div>
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h2 className="text-2xl font-display font-bold text-slate-800">Medical Records</h2>
          <p className="text-slate-500 text-sm mt-1">Access your complete clinical history and diagnostic reports.</p>
        </div>
        
        <div className="flex p-1.5 bg-white border border-slate-100 rounded-2xl shadow-sm">
          {[
            { id: 'timeline', label: 'Timeline', icon: Clock },
            { id: 'prescriptions', label: 'Prescriptions', icon: Pill },
            { id: 'labs', label: 'Lab Reports', icon: Activity },
            { id: 'radiology', label: 'Radiology', icon: Eye }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
                  isActive 
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' 
                    : 'text-slate-500 hover:bg-slate-50'
                }`}
              >
                <Icon size={16} />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -10 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === 'timeline' && <Timeline records={data.timeline} />}
          {activeTab === 'prescriptions' && <PrescriptionList prescriptions={data.prescriptions} onDownload={handleDownload} />}
          {activeTab === 'labs' && <LabReportList reports={data.labs} onDownload={handleDownload} />}
          {activeTab === 'radiology' && <RadiologyList reports={data.radiology} onDownload={handleDownload} />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function Timeline({ records }: { records: any[] }) {
  return (
    <div className="relative space-y-8 before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent">
      {records.length > 0 ? records.map((item, i) => (
        <div key={i} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
          {/* Icon */}
          <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-slate-100 group-[.is-active]:bg-indigo-600 text-slate-500 group-[.is-active]:text-indigo-100 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 transition-colors duration-500">
            {item.type === 'Appointment' && <Clock size={16} />}
            {item.type === 'Prescription' && <Pill size={16} />}
            {item.type === 'Lab' && <Activity size={16} />}
          </div>
          {/* Card */}
          <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center justify-between space-x-2 mb-1">
              <span className="font-bold text-slate-800">{item.title}</span>
              <time className="font-mono text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full uppercase">
                {new Date(item.date).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
              </time>
            </div>
            <p className="text-slate-500 text-sm">{item.description}</p>
          </div>
        </div>
      )) : (
        <p className="text-center text-slate-400 py-20 bg-white rounded-[3rem] border border-dashed border-slate-200 italic">No historical activities found.</p>
      )}
    </div>
  );
}

function PrescriptionList({ prescriptions, onDownload }: { prescriptions: any[], onDownload: (t: string, id: string) => void }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {prescriptions.map((rx, i) => (
        <div key={i} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
          <div className="flex justify-between items-start">
            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center">
              <Pill size={24} />
            </div>
            <span className="text-[10px] font-bold text-slate-400 font-mono tracking-widest uppercase bg-slate-50 px-3 py-1 rounded-full">
              ID: {rx.id.slice(0, 8)}
            </span>
          </div>
          <div>
            <h4 className="text-lg font-bold text-slate-800">Authorized by Dr. {rx.doctor?.name}</h4>
            <p className="text-xs text-slate-400 mt-1">{new Date(rx.createdAt).toLocaleDateString()}</p>
          </div>
          <div className="space-y-2">
            {rx.items.map((item: any, idx: number) => (
              <div key={idx} className="p-3 bg-slate-50 rounded-xl flex justify-between items-center text-xs">
                <span className="font-bold text-slate-700">{item.medicineName}</span>
                <span className="text-slate-400">{item.dosage} • {item.frequency}</span>
              </div>
            ))}
          </div>
          <div className="pt-6 border-t border-slate-50 flex items-center justify-between">
            <button 
              onClick={() => onDownload('Prescription', rx.id)}
              className="flex items-center space-x-2 text-indigo-600 font-bold text-xs hover:text-indigo-700 transition-all"
            >
              <Download size={14} />
              <span>Download PDF</span>
            </button>
            <div className="flex items-center space-x-2 text-[10px] text-slate-400 font-bold">
              <Sparkles size={12} className="text-indigo-400" />
              <span>AI SCAN VERIFIED</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function LabReportList({ reports, onDownload }: { reports: any[], onDownload: (t: string, id: string) => void }) {
  return (
    <div className="space-y-6">
      {reports.map((report, i) => (
        <div key={i} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col md:flex-row gap-8">
          <div className="flex-1 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xl font-bold text-slate-800">{report.testName}</h4>
                <p className="text-xs text-slate-400 mt-1 uppercase font-mono tracking-widest">Accession: {report.id.slice(0, 8)} • {new Date(report.createdAt).toLocaleDateString()}</p>
              </div>
              <div className="flex items-center space-x-3">
                <button 
                  onClick={() => onDownload('Lab Report', report.id)}
                  className="p-2.5 bg-slate-50 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                >
                  <Download size={18} />
                </button>
                <div className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest border ${
                  report.status === 'Completed' ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-amber-50 border-amber-100 text-amber-600'
                }`}>
                  {report.status}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {report.results.map((r: any, idx: number) => (
                <div key={idx} className={`p-4 rounded-2xl border ${r.isAbnormal ? 'bg-rose-50 border-rose-100 shadow-sm' : 'bg-slate-50 border-slate-100'}`}>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">{r.parameter}</span>
                  <div className="flex items-baseline space-x-2">
                    <span className={`text-lg font-bold ${r.isAbnormal ? 'text-rose-600' : 'text-slate-800'}`}>{r.value}</span>
                    <span className="text-xs text-slate-400">{r.unit}</span>
                  </div>
                  <span className="text-[9px] text-slate-400 mt-1 block">Range: {r.referenceRange || '—'}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="md:w-72 bg-indigo-50/50 p-6 rounded-3xl border border-indigo-100/50 space-y-4">
            <div className="flex items-center space-x-2 text-indigo-600 font-bold text-[10px] uppercase tracking-widest">
              <Sparkles size={14} />
              <span>AI Insight Panel</span>
            </div>
            <p className="text-xs text-indigo-900/70 leading-relaxed italic">
              {report.aiInterpretation || 'No automated interpretation available for this panel yet.'}
            </p>
            <button className="w-full py-3 bg-white text-indigo-600 text-xs font-bold rounded-xl shadow-sm border border-indigo-100 hover:bg-indigo-50 transition-all">
              Request Clinical Note
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

function RadiologyList({ reports, onDownload }: { reports: any[], onDownload: (t: string, id: string) => void }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {reports.map((report, i) => (
        <div key={i} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
          <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-[1.5rem] flex items-center justify-center">
            <Eye size={28} />
          </div>
          <div>
            <h4 className="text-lg font-bold text-slate-800">{report.studyType}</h4>
            <p className="text-xs text-slate-400 mt-1 font-mono">{new Date(report.createdAt).toLocaleDateString()} • Dr. {report.orderedBy}</p>
          </div>
          <div className="p-5 bg-slate-50 rounded-2xl space-y-3">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Findings Summary</span>
            <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">{report.findings || 'Waiting for radiologist findings...'}</p>
          </div>
          <div className="flex items-center justify-between pt-4 border-t border-slate-50">
            <button 
              onClick={() => onDownload('Radiology Images', report.id)}
              className="flex items-center space-x-2 text-indigo-600 font-bold text-xs hover:text-indigo-700 transition-all"
            >
              <Download size={14} />
              <span>View Images</span>
            </button>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{report.status}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
