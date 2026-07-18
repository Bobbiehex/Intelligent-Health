import React from 'react';
import { toast } from 'sonner';
import { 
  FileText, Download, PieChart, BarChart3, 
  Calendar, CheckCircle, UserPlus, ArrowRight
} from 'lucide-react';

interface ReportsProps {
  token: string;
}

export default function Reports({ token }: ReportsProps) {
  const reportTypes = [
    { title: 'Daily Patient Registrations', icon: UserPlus, color: 'text-emerald-500', bg: 'bg-emerald-50' },
    { title: 'Appointment Attendance', icon: Calendar, color: 'text-rose-500', bg: 'bg-rose-50' },
    { title: 'Check-in/Out Performance', icon: CheckCircle, color: 'text-blue-500', bg: 'bg-blue-50' },
    { title: 'Clinic Traffic Heatmap', icon: PieChart, color: 'text-amber-500', bg: 'bg-amber-50' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h2 className="font-display font-bold text-gray-900 text-xl">Operational Intelligence</h2>
        <p className="text-sm text-gray-400">Generate, view, and export front-desk performance reports</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {reportTypes.map((report, idx) => (
          <div key={idx} className="bg-white border border-gray-100 rounded-[2.5rem] p-8 shadow-sm group hover:shadow-md transition-all">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-4">
                <div className={`w-14 h-14 ${report.bg} ${report.color} rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110`}>
                  <report.icon className="h-7 w-7" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-base">{report.title}</h3>
                  <p className="text-[10px] text-gray-400 font-mono mt-1 uppercase tracking-wider">Operational Dataset</p>
                </div>
              </div>
              <div className="flex flex-col space-y-2">
                <button 
                  onClick={async () => {
                    toast.loading(`Generating ${report.title} report...`, { id: 'report-gen' });
                    try {
                      // Note: This now calls the centralized export route
                      const response = await fetch(`/api/patient/export?title=${encodeURIComponent(report.title)}`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                      });
                      if (!response.ok) throw new Error('Failed to generate report');
                      
                      const blob = await response.blob();
                      const url = window.URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `${report.title.replace(/\s+/g, '-').toLowerCase()}.pdf`;
                      document.body.appendChild(a);
                      a.click();
                      a.remove();
                      toast.success('Report downloaded!', { id: 'report-gen' });
                    } catch (error) {
                      console.error(error);
                      toast.error('Failed to download report', { id: 'report-gen' });
                    }
                  }}
                  className="p-3 bg-gray-50 text-gray-400 rounded-xl hover:bg-rose-50 hover:text-rose-500 transition-all"
                >
                  <Download className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="mt-8 pt-8 border-t border-gray-50 flex items-center justify-between">
              <div className="flex space-x-2">
                <span className="text-[10px] font-bold text-gray-400 px-3 py-1 bg-gray-50 rounded-full cursor-default">PDF</span>
                <span className="text-[10px] font-bold text-gray-400 px-3 py-1 bg-gray-50 rounded-full cursor-default">CSV</span>
                <span className="text-[10px] font-bold text-gray-400 px-3 py-1 bg-gray-50 rounded-full cursor-default">XLSX</span>
              </div>
              <button 
                onClick={() => toast.info('Previewing data...', { description: 'This would open a modal with live clinical metrics.' })}
                className="text-xs font-bold text-rose-500 flex items-center space-x-1 group-hover:translate-x-1 transition-transform"
              >
                <span>Generate Preview</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-gray-900 rounded-[2.5rem] p-10 text-white flex flex-col md:flex-row items-center justify-between gap-8">
        <div>
          <h3 className="text-2xl font-display font-bold">Custom Analytics Query</h3>
          <p className="text-sm text-white/50 mt-2 max-w-md">Need a specialized report? Our system allows filtering clinical data by department, date range, and staff ID.</p>
        </div>
        <button 
          onClick={() => toast.info('Advanced Analytics Engine', { description: 'Custom query builder is available in the administrator portal.' })}
          className="bg-rose-500 hover:bg-rose-600 text-white font-bold px-10 py-5 rounded-3xl text-sm transition-all shadow-xl shadow-rose-950/20"
        >
          Open Advanced Filter
        </button>
      </div>
    </div>
  );
}
