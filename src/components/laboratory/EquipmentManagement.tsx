import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Wrench, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Cpu, 
  ShieldCheck,
  Plus,
  RefreshCw,
  Activity
} from 'lucide-react';
import { motion } from 'motion/react';

interface Equipment {
  id: string;
  name: string;
  model: string;
  manufacturer: string;
  serialNumber: string;
  status: 'ACTIVE' | 'UNDER_MAINTENANCE' | 'FAULTY' | 'RETIRED';
  lastCalibrationDate: string;
  nextCalibrationDate: string;
  qualityControls: any[];
}

export const EquipmentManagement: React.FC = () => {
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEquipment();
  }, []);

  const fetchEquipment = async () => {
    try {
      const response = await fetch('/api/lab/equipment', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await response.json();
      setEquipment(data);
    } catch (error) {
      console.error('Failed to fetch equipment:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case 'UNDER_MAINTENANCE': return 'bg-amber-50 text-amber-600 border-amber-100';
      case 'FAULTY': return 'bg-rose-50 text-rose-600 border-rose-100';
      default: return 'bg-gray-50 text-gray-400 border-gray-100';
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 tracking-tight">Instrumentation & QC</h2>
          <p className="text-sm text-gray-500 font-medium">Manage equipment calibration and quality control standards</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-5 py-3 bg-white hover:bg-gray-50 text-gray-600 rounded-2xl font-bold text-xs transition-all shadow-sm border border-gray-100">
            <RefreshCw className="h-4 w-4" />
            Sync Instruments
          </button>
          <button className="flex items-center gap-2 px-5 py-3 bg-gray-900 hover:bg-gray-800 text-white rounded-2xl font-bold text-xs transition-all shadow-lg">
            <Plus className="h-4 w-4" />
            Add Equipment
          </button>
        </div>
      </div>

      {/* Equipment Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {loading ? (
          <div className="col-span-3 py-24 flex flex-col items-center justify-center bg-white rounded-[40px] border border-gray-100">
            <Activity className="h-10 w-10 text-blue-500 animate-spin mb-4" />
            <p className="text-sm font-bold text-gray-400">Pinging laboratory instrumentation...</p>
          </div>
        ) : equipment.length === 0 ? (
          <div className="col-span-3 py-24 flex flex-col items-center justify-center bg-white rounded-[40px] border border-dashed border-gray-200">
            <Settings className="h-12 w-12 text-gray-200 mb-4" />
            <p className="text-sm font-bold text-gray-400">No instrumentation discovered in the current network.</p>
          </div>
        ) : equipment.map((item, idx) => (
          <motion.div 
            key={item.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm hover:shadow-md transition-all group"
          >
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 bg-gray-50 rounded-2xl flex items-center justify-center group-hover:bg-blue-50 transition-colors">
                  <Cpu className="h-7 w-7 text-gray-400 group-hover:text-blue-500 transition-colors" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-gray-900 tracking-tight">{item.name}</h3>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{item.manufacturer} • {item.model}</p>
                </div>
              </div>
              <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${getStatusColor(item.status)}`}>
                {item.status}
              </span>
            </div>

            <div className="space-y-6 pt-6 border-t border-gray-50">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-2xl">
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Last Calibration</p>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                    <span className="text-[10px] font-bold text-gray-900">{new Date(item.lastCalibrationDate).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="bg-gray-50 p-4 rounded-2xl">
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Next Due</p>
                  <div className="flex items-center gap-2">
                    <Clock className="h-3 w-3 text-amber-500" />
                    <span className="text-[10px] font-bold text-gray-900">{new Date(item.nextCalibrationDate).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-3 px-1">
                  <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Recent QC Checks</h4>
                  <button className="text-[9px] font-bold text-blue-600 uppercase tracking-widest hover:underline">New QC</button>
                </div>
                <div className="space-y-2">
                  {item.qualityControls?.length > 0 ? item.qualityControls.map((qc: any, i: number) => (
                    <div key={i} className="flex items-center justify-between px-4 py-2 bg-gray-50/50 rounded-xl border border-gray-50">
                      <div className="flex items-center gap-2">
                        <ShieldCheck className={`h-3 w-3 ${qc.status === 'PASSED' ? 'text-emerald-500' : 'text-rose-500'}`} />
                        <span className="text-[10px] font-bold text-gray-600">{new Date(qc.testDate).toLocaleDateString()}</span>
                      </div>
                      <span className={`text-[9px] font-black ${qc.status === 'PASSED' ? 'text-emerald-600' : 'text-rose-600'}`}>{qc.status}</span>
                    </div>
                  )) : (
                    <p className="text-[10px] font-bold text-gray-300 italic px-1">No recent quality control records found.</p>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-8 flex gap-3 pt-6 border-t border-gray-50">
              <button className="flex-1 py-3 bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2">
                <Wrench className="h-3 w-3" />
                Maintenance
              </button>
              <button className="flex-1 py-3 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">
                Full Specs
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {/* QC Alerts Panel */}
      <div className="bg-amber-50 border border-amber-100 p-8 rounded-[40px]">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-white rounded-2xl shadow-sm">
            <AlertTriangle className="h-6 w-6 text-amber-500" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-amber-900 tracking-tight">Quality Assurance Alerts</h3>
            <p className="text-sm text-amber-700/70 font-medium mt-1">
              There are currently 2 instruments requiring calibration this week. Reagent inventory for Hematology is below 15%.
            </p>
            <div className="flex gap-4 mt-6">
              <button className="px-6 py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-2xl font-bold text-xs shadow-lg shadow-amber-200 transition-all">
                Calibrate Hematology-X1
              </button>
              <button className="px-6 py-3 bg-white hover:bg-amber-50 text-amber-700 rounded-2xl font-bold text-xs transition-all border border-amber-200">
                Order Reagents
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
