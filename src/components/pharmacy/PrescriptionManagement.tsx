import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  MoreVertical, 
  Eye, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  ArrowRight,
  Pill,
  User,
  Calendar,
  X,
  Printer,
  ChevronDown,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';

interface PrescriptionManagementProps {
  token: string;
  user: any;
}

export const PrescriptionManagement: React.FC<PrescriptionManagementProps> = ({ token, user }) => {
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [selectedPrescription, setSelectedPrescription] = useState<any>(null);
  const [isDispenseModalOpen, setIsDispenseModalOpen] = useState(false);
  const [inventory, setInventory] = useState<any[]>([]);

  useEffect(() => {
    fetchPrescriptions();
    fetchInventory();
  }, []);

  const fetchPrescriptions = async () => {
    try {
      const response = await fetch('/api/pharmacy/prescriptions', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to fetch');
      const data = await response.json();
      setPrescriptions(Array.isArray(data) ? data : []);
    } catch (error) {
      toast.error('Failed to load prescriptions');
    } finally {
      setLoading(false);
    }
  };

  const fetchInventory = async () => {
    try {
      const response = await fetch('/api/pharmacy/inventory', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to fetch');
      const data = await response.json();
      setInventory(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to load inventory');
    }
  };

  const handleDispense = async (prescription: any) => {
    setSelectedPrescription(prescription);
    setIsDispenseModalOpen(true);
  };

  const confirmDispense = async (items: any[]) => {
    try {
      for (const item of items) {
        const medicine = inventory.find(m => m.name.toLowerCase().includes(item.medicineName.toLowerCase()));
        if (!medicine) {
          toast.error(`Medicine "${item.medicineName}" not found in inventory`);
          continue;
        }

        const response = await fetch('/api/pharmacy/dispense', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}` 
          },
          body: JSON.stringify({
            prescriptionId: selectedPrescription.id,
            medicineId: medicine.id,
            quantity: 30, // Default or calculated based on dosage/duration
            batchNumber: medicine.batchNumber || 'B-DEFAULT',
            notes: 'Dispensed per prescription',
            counseling: 'Take as directed by physician'
          })
        });

        if (!response.ok) throw new Error('Dispense failed');
      }

      toast.success('Prescription dispensed successfully');
      setIsDispenseModalOpen(false);
      fetchPrescriptions();
      fetchInventory();
    } catch (error) {
      toast.error('Dispensing process failed');
    }
  };

  const filtered = prescriptions.filter(rx => {
    const matchesSearch = rx.patient.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          rx.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'ALL' || rx.status.toUpperCase() === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Search & Filter Bar */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
        <div className="relative flex-1 w-full max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search by patient name or Rx ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-slate-50 border-none rounded-2xl text-sm font-medium outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
          />
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <div className="flex bg-slate-50 p-1 rounded-2xl">
            {['ALL', 'PENDING', 'DISPENSED'].map(status => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-6 py-2.5 rounded-xl text-xs font-black tracking-tight transition-all ${
                  filterStatus === status 
                    ? 'bg-white text-emerald-600 shadow-sm' 
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
          <button className="p-3 bg-slate-50 hover:bg-slate-100 text-slate-500 rounded-2xl transition-all">
            <Filter className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Prescriptions List */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <AnimatePresence>
          {filtered.map((rx, idx) => (
            <motion.div
              key={rx.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ delay: idx * 0.05 }}
              className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden hover:shadow-xl hover:shadow-slate-200/50 transition-all flex flex-col"
            >
              {/* Card Header */}
              <div className="p-8 pb-6 flex items-start justify-between border-b border-slate-50">
                <div className="flex gap-5">
                  <div className="h-14 w-14 rounded-2xl bg-emerald-50 flex items-center justify-center shrink-0">
                    <User className="h-7 w-7 text-emerald-600" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-xl font-black text-slate-900 tracking-tight">{rx.patient.name}</h3>
                    <div className="flex items-center gap-3">
                      <p className="text-xs font-bold text-slate-400 flex items-center gap-1">
                        <Calendar className="h-3 w-3" /> {new Date(rx.patient.dob).toLocaleDateString()}
                      </p>
                      <div className="h-1 w-1 rounded-full bg-slate-200" />
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{rx.patient.gender}</p>
                    </div>
                  </div>
                </div>
                <div className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-[0.1em] ${
                  rx.status === 'Dispensed' 
                    ? 'bg-emerald-50 text-emerald-600' 
                    : 'bg-amber-50 text-amber-600'
                }`}>
                  {rx.status}
                </div>
              </div>

              {/* Items List */}
              <div className="p-8 flex-1 space-y-6">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Prescribed Medications</p>
                  <p className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Qty: 30 Day Supply</p>
                </div>
                <div className="space-y-4">
                  {rx.items.map((item: any, i: number) => (
                    <div key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 group hover:border-emerald-200 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 bg-white rounded-xl flex items-center justify-center border border-slate-100">
                          <Pill className="h-5 w-5 text-emerald-500" />
                        </div>
                        <div>
                          <p className="text-sm font-black text-slate-900">{item.medicineName}</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{item.dosage} • {item.drugType || 'Tablet'} • {item.frequency}</p>
                        </div>
                      </div>
                      <div className="h-8 w-8 rounded-lg flex items-center justify-center text-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity">
                        <CheckCircle2 className="h-4 w-4" />
                      </div>
                    </div>
                  ))}
                </div>
                
                {rx.aiInteractionWarnings && (
                  <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex gap-3">
                    <AlertCircle className="h-5 w-5 text-rose-500 shrink-0" />
                    <div>
                      <p className="text-xs font-bold text-rose-900">Pharmacological Alert</p>
                      <p className="text-[10px] font-medium text-rose-700 mt-1 line-clamp-2">{rx.aiInteractionWarnings}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Footer */}
              <div className="p-8 pt-0 flex gap-3">
                <button 
                  onClick={() => handleDispense(rx)}
                  disabled={rx.status === 'Dispensed'}
                  className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl font-bold text-xs transition-all ${
                    rx.status === 'Dispensed'
                      ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-100 active:scale-[0.98]'
                  }`}
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Verify & Dispense
                </button>
                <button className="px-5 py-4 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-2xl font-bold text-xs transition-all">
                  <Eye className="h-4 w-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Dispense Confirmation Modal */}
      <AnimatePresence>
        {isDispenseModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDispenseModalOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-2xl bg-white rounded-[3rem] shadow-2xl overflow-hidden"
            >
              <div className="p-10 pb-0 flex items-start justify-between">
                <div>
                  <h3 className="text-2xl font-black text-slate-900 tracking-tight">Dispense Verification</h3>
                  <p className="text-slate-500 font-medium mt-1">Reviewing medications for {selectedPrescription.patient.name}</p>
                </div>
                <button 
                  onClick={() => setIsDispenseModalOpen(false)}
                  className="p-3 hover:bg-slate-50 rounded-2xl transition-all"
                >
                  <X className="h-5 w-5 text-slate-400" />
                </button>
              </div>

              <div className="p-10 space-y-8">
                {/* Inventory Check Section */}
                <div className="space-y-4">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Inventory Availability Check</p>
                  <div className="space-y-3">
                    {selectedPrescription.items.map((item: any, i: number) => {
                      const med = inventory.find(m => m.name.toLowerCase().includes(item.medicineName.toLowerCase()));
                      const inStock = med ? med.quantityInStock >= 30 : false;
                      
                      return (
                        <div key={i} className="flex items-center justify-between p-5 bg-slate-50 rounded-3xl border border-slate-100">
                          <div className="flex items-center gap-4">
                            <div className={`h-10 w-10 rounded-xl flex items-center justify-center border ${
                              inStock ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-rose-50 border-rose-100 text-rose-600'
                            }`}>
                              <Pill className="h-5 w-5" />
                            </div>
                            <div>
                              <p className="text-sm font-black text-slate-900">{item.medicineName}</p>
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Stock: {med?.quantityInStock || 0} Units</p>
                            </div>
                          </div>
                          <div className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider ${
                            inStock ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'
                          }`}>
                            {inStock ? 'Available' : 'Shortage'}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* AI Review Section */}
                {selectedPrescription.aiInteractionWarnings && (
                  <div className="p-6 bg-slate-900 rounded-3xl space-y-3 border border-slate-800">
                    <div className="flex items-center gap-2 text-emerald-400">
                      <CheckCircle2 className="h-4 w-4" />
                      <p className="text-[10px] font-black uppercase tracking-[0.2em]">Clinical AI Scan Complete</p>
                    </div>
                    <p className="text-xs font-medium text-slate-400 leading-relaxed italic">
                      "{selectedPrescription.aiInteractionWarnings}"
                    </p>
                  </div>
                )}

                {/* Confirm Button */}
                <div className="flex gap-4 pt-4">
                  <button 
                    onClick={() => setIsDispenseModalOpen(false)}
                    className="flex-1 py-5 rounded-2xl font-bold text-xs text-slate-500 bg-slate-50 hover:bg-slate-100 transition-all"
                  >
                    Cancel Dispensing
                  </button>
                  <button 
                    onClick={() => confirmDispense(selectedPrescription.items)}
                    className="flex-[2] py-5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold text-xs shadow-xl shadow-emerald-100 transition-all active:scale-95"
                  >
                    Confirm & Update Inventory
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
