import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  Download, 
  Package, 
  AlertTriangle, 
  Calendar, 
  Tag, 
  Database,
  ArrowUpDown,
  MoreHorizontal,
  ChevronRight,
  TrendingDown,
  TrendingUp,
  X,
  QrCode,
  Barcode,
  Save,
  Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';

interface InventoryManagementProps {
  token: string;
  user: any;
}

export const InventoryManagement: React.FC<InventoryManagementProps> = ({ token, user }) => {
  const [medicines, setMedicines] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [selectedMed, setSelectedMed] = useState<any>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    genericName: '',
    category: '',
    strength: '',
    dosageForm: '',
    unit: 'Box',
    purchasePrice: 0,
    sellingPrice: 0,
    quantityInStock: 0,
    reorderLevel: 10,
    expiryDate: '',
    batchNumber: '',
    barcode: ''
  });

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    try {
      const response = await fetch('/api/pharmacy/inventory', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to fetch');
      const data = await response.json();
      setMedicines(Array.isArray(data) ? data : []);
    } catch (error) {
      toast.error('Failed to load inventory');
    } finally {
      setLoading(false);
    }
  };

  const handleAddMedicine = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/pharmacy/inventory', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify(formData)
      });
      if (response.ok) {
        toast.success('Medicine added to inventory');
        setIsAddModalOpen(false);
        fetchInventory();
      }
    } catch (error) {
      toast.error('Failed to add medicine');
    }
  };

  const handleAdjustStock = async (medicineId: string, type: 'ADD' | 'REMOVE', quantity: number) => {
    try {
      const response = await fetch('/api/pharmacy/inventory/adjust', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({
          medicineId,
          type,
          quantity,
          reason: 'Manual adjustment'
        })
      });
      if (response.ok) {
        toast.success('Stock adjusted successfully');
        setIsAdjustModalOpen(false);
        fetchInventory();
      }
    } catch (error) {
      toast.error('Adjustment failed');
    }
  };

  const filtered = medicines.filter(m => 
    m.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    m.genericName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8">
      {/* Action Bar */}
      <div className="flex flex-col xl:flex-row gap-6 justify-between items-center">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Stock Repository</h2>
          <p className="text-slate-500 font-medium mt-1">Manage pharmaceutical inventory and SKU tracking</p>
        </div>
        <div className="flex gap-4 w-full xl:w-auto">
          <div className="relative flex-1 xl:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search SKUs, Generic names..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3.5 bg-white border border-slate-100 rounded-2xl text-sm font-medium outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm"
            />
          </div>
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="px-6 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold text-xs shadow-lg shadow-emerald-100 flex items-center gap-2 transition-all active:scale-95 shrink-0"
          >
            <Plus className="h-4 w-4" /> Add Medication
          </button>
        </div>
      </div>

      {/* Stats Quick View */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-6">
          <div className="h-16 w-16 bg-blue-50 text-blue-600 rounded-[1.25rem] flex items-center justify-center">
            <Database className="h-8 w-8" />
          </div>
          <div>
            <p className="text-3xl font-black text-slate-900 tracking-tight">{medicines.length}</p>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Active SKUs</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-6">
          <div className="h-16 w-16 bg-amber-50 text-amber-600 rounded-[1.25rem] flex items-center justify-center">
            <AlertTriangle className="h-8 w-8" />
          </div>
          <div>
            <p className="text-3xl font-black text-slate-900 tracking-tight">
              {medicines.filter(m => m.quantityInStock <= m.reorderLevel).length}
            </p>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Low Stock Items</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-6">
          <div className="h-16 w-16 bg-rose-50 text-rose-600 rounded-[1.25rem] flex items-center justify-center">
            <Calendar className="h-8 w-8" />
          </div>
          <div>
            <p className="text-3xl font-black text-slate-900 tracking-tight">
              {medicines.filter(m => m.expiryDate && new Date(m.expiryDate) < new Date()).length}
            </p>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Expired Batches</p>
          </div>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Medication & Generic</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Category</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Stock Level</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Price</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Expiry</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map((med, idx) => (
                <tr key={med.id} className="hover:bg-slate-50/30 transition-colors group">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-2xl bg-slate-50 flex items-center justify-center group-hover:bg-white transition-colors border border-transparent group-hover:border-slate-100 shadow-sm">
                        <Package className="h-6 w-6 text-slate-400" />
                      </div>
                      <div>
                        <p className="text-sm font-black text-slate-900">{med.name}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate max-w-[150px]">{med.genericName}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-black tracking-tight inline-block">
                      {med.category}
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-1.5 w-16 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${med.quantityInStock <= med.reorderLevel ? 'bg-amber-500' : 'bg-emerald-500'}`}
                          style={{ width: `${Math.min(100, (med.quantityInStock / 100) * 100)}%` }}
                        />
                      </div>
                      <span className="text-sm font-black text-slate-900">{med.quantityInStock}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <p className="text-sm font-black text-slate-900">${med.sellingPrice.toFixed(2)}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Unit Price</p>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3.5 w-3.5 text-slate-400" />
                      <span className="text-xs font-bold text-slate-600">
                        {med.expiryDate ? new Date(med.expiryDate).toLocaleDateString() : 'N/A'}
                      </span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider ${
                      med.status === 'AVAILABLE' ? 'bg-emerald-50 text-emerald-600' :
                      med.status === 'LOW_STOCK' ? 'bg-amber-50 text-amber-600' :
                      'bg-rose-50 text-rose-600'
                    }`}>
                      {med.status.replace('_', ' ')}
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => { setSelectedMed(med); setIsAdjustModalOpen(true); }}
                        className="p-3 hover:bg-emerald-50 text-slate-300 hover:text-emerald-600 rounded-xl transition-all"
                      >
                        <ArrowUpDown className="h-4 w-4" />
                      </button>
                      <button className="p-3 hover:bg-slate-100 text-slate-300 hover:text-slate-600 rounded-xl transition-all">
                        <MoreHorizontal className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Medicine Modal */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddModalOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-4xl bg-white rounded-[3rem] shadow-2xl overflow-hidden"
            >
              <form onSubmit={handleAddMedicine}>
                <div className="p-10 pb-0 flex items-start justify-between">
                  <div>
                    <h3 className="text-2xl font-black text-slate-900 tracking-tight">Register New Medication</h3>
                    <p className="text-slate-500 font-medium mt-1">Add a new SKU to the central pharmaceutical repository</p>
                  </div>
                  <button 
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="p-3 hover:bg-slate-50 rounded-2xl transition-all"
                  >
                    <X className="h-5 w-5 text-slate-400" />
                  </button>
                </div>

                <div className="p-10 grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Brand Name</label>
                      <input 
                        required
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-emerald-500"
                        placeholder="e.g. Amoxil"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Generic Composition</label>
                      <input 
                        required
                        type="text"
                        value={formData.genericName}
                        onChange={(e) => setFormData({...formData, genericName: e.target.value})}
                        className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-emerald-500"
                        placeholder="e.g. Amoxicillin"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Category</label>
                        <select 
                          required
                          value={formData.category}
                          onChange={(e) => setFormData({...formData, category: e.target.value})}
                          className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-emerald-500 appearance-none"
                        >
                          <option value="">Select...</option>
                          <option value="Antibiotic">Antibiotic</option>
                          <option value="Analgesic">Analgesic</option>
                          <option value="Antiviral">Antiviral</option>
                          <option value="Cardiovascular">Cardiovascular</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Dosage Form</label>
                        <select 
                          required
                          value={formData.dosageForm}
                          onChange={(e) => setFormData({...formData, dosageForm: e.target.value})}
                          className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-emerald-500 appearance-none"
                        >
                          <option value="">Select...</option>
                          <option value="Tablet">Tablet</option>
                          <option value="Capsule">Capsule</option>
                          <option value="Syrup">Syrup</option>
                          <option value="Injection">Injection</option>
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Purchase Price ($)</label>
                        <input 
                          required
                          type="number"
                          step="0.01"
                          value={formData.purchasePrice}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value);
                            setFormData({...formData, purchasePrice: isNaN(val) ? 0 : val});
                          }}
                          className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Selling Price ($)</label>
                        <input 
                          required
                          type="number"
                          step="0.01"
                          value={formData.sellingPrice}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value);
                            setFormData({...formData, sellingPrice: isNaN(val) ? 0 : val});
                          }}
                          className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Initial Stock</label>
                        <input 
                          required
                          type="number"
                          value={formData.quantityInStock}
                          onChange={(e) => {
                            const val = parseInt(e.target.value);
                            setFormData({...formData, quantityInStock: isNaN(val) ? 0 : val});
                          }}
                          className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Reorder Level</label>
                        <input 
                          required
                          type="number"
                          value={formData.reorderLevel}
                          onChange={(e) => {
                            const val = parseInt(e.target.value);
                            setFormData({...formData, reorderLevel: isNaN(val) ? 0 : val});
                          }}
                          className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Expiry Date</label>
                      <input 
                        required
                        type="date"
                        value={formData.expiryDate}
                        onChange={(e) => setFormData({...formData, expiryDate: e.target.value})}
                        className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Batch Number</label>
                      <input 
                        required
                        type="text"
                        value={formData.batchNumber}
                        onChange={(e) => setFormData({...formData, batchNumber: e.target.value})}
                        className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-emerald-500"
                        placeholder="e.g. B-2024-001"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                      <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 flex flex-col items-center justify-center gap-3">
                        <Barcode className="h-8 w-8 text-slate-400" />
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Generate Barcode</p>
                      </div>
                      <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 flex flex-col items-center justify-center gap-3">
                        <QrCode className="h-8 w-8 text-slate-400" />
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Generate QR Code</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-10 pt-0 flex gap-4">
                  <button 
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="flex-1 py-5 rounded-3xl font-bold text-xs text-slate-500 bg-slate-50 hover:bg-slate-100 transition-all"
                  >
                    Discard
                  </button>
                  <button 
                    type="submit"
                    className="flex-[2] py-5 bg-slate-900 hover:bg-slate-800 text-white rounded-3xl font-bold text-xs shadow-xl transition-all active:scale-95 flex items-center justify-center gap-2"
                  >
                    <Save className="h-4 w-4" /> Save to Inventory
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Adjust Stock Modal */}
      <AnimatePresence>
        {isAdjustModalOpen && selectedMed && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAdjustModalOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative w-full max-w-md bg-white rounded-[3rem] shadow-2xl p-10"
            >
              <div className="text-center space-y-2 mb-10">
                <div className="h-16 w-16 bg-emerald-50 text-emerald-600 rounded-[1.5rem] flex items-center justify-center mx-auto mb-6">
                  <ArrowUpDown className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-black text-slate-900 tracking-tight">Inventory Adjustment</h3>
                <p className="text-slate-500 text-sm font-medium">Updating stock for {selectedMed.name}</p>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <button 
                    onClick={() => handleAdjustStock(selectedMed.id, 'ADD', 10)}
                    className="p-6 bg-slate-50 hover:bg-emerald-50 border border-slate-100 hover:border-emerald-200 rounded-[2rem] flex flex-col items-center gap-3 transition-all group"
                  >
                    <TrendingUp className="h-6 w-6 text-slate-400 group-hover:text-emerald-500" />
                    <span className="text-[10px] font-black text-slate-400 group-hover:text-emerald-600 uppercase tracking-widest">+10 Units</span>
                  </button>
                  <button 
                    onClick={() => handleAdjustStock(selectedMed.id, 'REMOVE', 10)}
                    className="p-6 bg-slate-50 hover:bg-rose-50 border border-slate-100 hover:border-rose-200 rounded-[2rem] flex flex-col items-center gap-3 transition-all group"
                  >
                    <TrendingDown className="h-6 w-6 text-slate-400 group-hover:text-rose-500" />
                    <span className="text-[10px] font-black text-slate-400 group-hover:text-rose-600 uppercase tracking-widest">-10 Units</span>
                  </button>
                </div>

                <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-slate-500">Current Stock</p>
                    <p className="text-lg font-black text-slate-900">{selectedMed.quantityInStock}</p>
                  </div>
                </div>

                <button 
                  onClick={() => setIsAdjustModalOpen(false)}
                  className="w-full py-5 text-xs font-bold text-slate-500 hover:text-slate-900 transition-all"
                >
                  Close Window
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
