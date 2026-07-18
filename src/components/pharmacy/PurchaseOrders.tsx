import React, { useState, useEffect } from 'react';
import { 
  ShoppingCart, 
  Truck, 
  Plus, 
  Search, 
  MoreVertical, 
  Clock, 
  CheckCircle2, 
  XCircle,
  Package,
  FileText,
  User,
  Phone,
  Mail,
  MapPin,
  ArrowRight,
  ExternalLink,
  ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';

interface PurchaseOrdersProps {
  token: string;
  user: any;
}

export const PurchaseOrders: React.FC<PurchaseOrdersProps> = ({ token, user }) => {
  const [purchaseOrders, setPurchaseOrders] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'ORDERS' | 'SUPPLIERS'>('ORDERS');
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);

  useEffect(() => {
    fetchPOs();
    fetchSuppliers();
  }, []);

  const fetchPOs = async () => {
    try {
      const response = await fetch('/api/pharmacy/purchase-orders', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to fetch');
      const data = await response.json();
      setPurchaseOrders(Array.isArray(data) ? data : []);
    } catch (error) {
      toast.error('Failed to load purchase orders');
    } finally {
      setLoading(false);
    }
  };

  const fetchSuppliers = async () => {
    try {
      const response = await fetch('/api/pharmacy/suppliers', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to fetch');
      const data = await response.json();
      setSuppliers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to load suppliers');
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case 'PENDING_APPROVAL': return 'bg-amber-50 text-amber-600 border-amber-100';
      case 'ORDERED': return 'bg-blue-50 text-blue-600 border-blue-100';
      case 'CANCELLED': return 'bg-rose-50 text-rose-600 border-rose-100';
      default: return 'bg-slate-50 text-slate-600 border-slate-100';
    }
  };

  return (
    <div className="space-y-8">
      {/* Header & Tabs */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Procurement Console</h2>
          <p className="text-slate-500 font-medium mt-1">Manage supply chains, vendors, and purchase cycles</p>
          
          <div className="flex bg-white p-1 rounded-2xl border border-slate-100 mt-8 shadow-sm inline-flex">
            <button
              onClick={() => setActiveTab('ORDERS')}
              className={`px-8 py-3 rounded-xl text-xs font-black tracking-tight transition-all flex items-center gap-2 ${
                activeTab === 'ORDERS' 
                  ? 'bg-slate-900 text-white shadow-lg' 
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <ShoppingCart className="h-4 w-4" /> Purchase Orders
            </button>
            <button
              onClick={() => setActiveTab('SUPPLIERS')}
              className={`px-8 py-3 rounded-xl text-xs font-black tracking-tight transition-all flex items-center gap-2 ${
                activeTab === 'SUPPLIERS' 
                  ? 'bg-slate-900 text-white shadow-lg' 
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <Truck className="h-4 w-4" /> Supply Chain Partners
            </button>
          </div>
        </div>
        
        <button 
          onClick={() => setIsOrderModalOpen(true)}
          className="px-6 py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold text-xs shadow-xl shadow-emerald-100 flex items-center gap-3 transition-all active:scale-95"
        >
          <Plus className="h-4 w-4" /> New Procurement Order
        </button>
      </div>

      {activeTab === 'ORDERS' ? (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {purchaseOrders.map((po, idx) => (
            <motion.div
              key={po.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden hover:shadow-xl hover:shadow-slate-200/50 transition-all flex flex-col group"
            >
              <div className="p-8 pb-6 flex items-start justify-between border-b border-slate-50">
                <div className="flex gap-5">
                  <div className="h-14 w-14 rounded-2xl bg-slate-50 flex items-center justify-center shrink-0 border border-slate-100 group-hover:bg-emerald-50 transition-colors">
                    <FileText className="h-7 w-7 text-slate-400 group-hover:text-emerald-500 transition-colors" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-xl font-black text-slate-900 tracking-tight">{po.supplier.name}</h3>
                    <div className="flex items-center gap-3">
                      <p className="text-xs font-bold text-slate-400 flex items-center gap-1">
                        <Clock className="h-3 w-3" /> {new Date(po.createdAt).toLocaleDateString()}
                      </p>
                      <div className="h-1 w-1 rounded-full bg-slate-200" />
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">ID: {po.id.split('-')[0]}</p>
                    </div>
                  </div>
                </div>
                <div className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border ${getStatusStyle(po.status)}`}>
                  {po.status.replace('_', ' ')}
                </div>
              </div>

              <div className="p-8 flex-1 space-y-6">
                <div className="space-y-3">
                  {po.items.map((item: any, i: number) => (
                    <div key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <div>
                        <p className="text-sm font-black text-slate-900">{item.medicineName}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Qty: {item.quantity} Units</p>
                      </div>
                      <p className="text-sm font-black text-slate-900">${item.totalPrice.toFixed(2)}</p>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between p-5 bg-slate-900 rounded-3xl">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total Commitment</p>
                  <p className="text-xl font-black text-white">${po.totalAmount.toFixed(2)}</p>
                </div>
              </div>

              <div className="p-8 pt-0 flex gap-3">
                <button className="flex-1 py-4 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-2xl font-bold text-xs transition-all flex items-center justify-center gap-2">
                  <ExternalLink className="h-3.5 w-3.5" /> View Details
                </button>
                <button className="px-6 py-4 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded-2xl font-bold text-xs transition-all">
                  Track Shipment
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {suppliers.map((supplier, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.05 }}
              className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 transition-all space-y-8 flex flex-col group"
            >
              <div className="flex items-start justify-between">
                <div className="h-16 w-16 bg-slate-50 rounded-2xl flex items-center justify-center group-hover:bg-emerald-50 transition-colors border border-slate-100">
                  <Truck className="h-8 w-8 text-slate-400 group-hover:text-emerald-500" />
                </div>
                <button className="p-2 text-slate-300 hover:text-slate-600 transition-colors">
                  <MoreVertical className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-1">
                <h3 className="text-xl font-black text-slate-900 tracking-tight">{supplier.name}</h3>
                <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">{supplier.company || 'Primary Vendor'}</p>
              </div>

              <div className="space-y-4 flex-1">
                <div className="flex items-center gap-4 text-slate-500">
                  <User className="h-4 w-4" />
                  <span className="text-xs font-bold">{supplier.contactPerson || 'Main Representative'}</span>
                </div>
                <div className="flex items-center gap-4 text-slate-500">
                  <Phone className="h-4 w-4" />
                  <span className="text-xs font-bold">{supplier.phone || '+1 555-0123'}</span>
                </div>
                <div className="flex items-center gap-4 text-slate-500">
                  <Mail className="h-4 w-4" />
                  <span className="text-xs font-bold">{supplier.email || 'vendor@supply.com'}</span>
                </div>
              </div>

              <div className="pt-8 border-t border-slate-50 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Meds</p>
                  <p className="text-sm font-black text-slate-900">{supplier.medicines?.length || 0} SKUs</p>
                </div>
                <button className="h-10 w-10 bg-slate-50 hover:bg-slate-900 hover:text-white rounded-xl flex items-center justify-center transition-all">
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};
