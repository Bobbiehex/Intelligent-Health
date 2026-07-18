import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  QrCode, 
  Package, 
  MapPin, 
  Calendar, 
  Thermometer, 
  CheckCircle2,
  AlertCircle,
  Activity,
  History,
  Box,
  User
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Sample {
  id: string;
  sampleId: string;
  type: string;
  status: string;
  collectionDate: string;
  collectionLocation: string;
  collector: string;
  quantity: string;
  labRequest: {
    testName: string;
    patient: { name: string };
  };
}

export const SampleTracking: React.FC = () => {
  const [samples, setSamples] = useState<Sample[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRegistering, setIsRegistering] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Form State
  const [newSample, setNewSample] = useState({
    labRequestId: '',
    type: 'BLOOD',
    sampleId: '',
    collectionLocation: 'Main Lab',
    collector: '',
    storageConditions: 'Refrigerated (2-8°C)',
    quantity: '',
    condition: 'Optimal'
  });

  const [activeRequests, setActiveRequests] = useState<any[]>([]);

  useEffect(() => {
    fetchSamples();
    fetchActiveRequests();
  }, []);

  const fetchSamples = async () => {
    try {
      const response = await fetch('/api/lab/requests', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const requests = await response.json();
      // Extract samples from requests
      const allSamples: Sample[] = [];
      requests.forEach((req: any) => {
        req.samples.forEach((s: any) => {
          allSamples.push({ ...s, labRequest: { testName: req.testName, patient: req.patient } });
        });
      });
      setSamples(allSamples);
    } catch (error) {
      console.error('Failed to fetch samples:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchActiveRequests = async () => {
    try {
      const response = await fetch('/api/lab/requests?status=ACCEPTED', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await response.json();
      setActiveRequests(data);
    } catch (error) {
      console.error('Failed to fetch active requests:', error);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Generate a mock barcode ID if not provided
      const finalSampleId = newSample.sampleId || `LAB-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
      
      const response = await fetch('/api/lab/samples', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}` 
        },
        body: JSON.stringify({ ...newSample, sampleId: finalSampleId })
      });

      if (response.ok) {
        setIsRegistering(false);
        fetchSamples();
        setNewSample({
          labRequestId: '',
          type: 'BLOOD',
          sampleId: '',
          collectionLocation: 'Main Lab',
          collector: '',
          storageConditions: 'Refrigerated (2-8°C)',
          quantity: '',
          condition: 'Optimal'
        });
      }
    } catch (error) {
      console.error('Failed to register sample:', error);
    }
  };

  const filteredSamples = samples.filter(s => 
    s.sampleId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.labRequest.patient.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 tracking-tight">Sample Management</h2>
          <p className="text-sm text-gray-500 font-medium">Register and track clinical specimens across lifecycle</p>
        </div>
        <button 
          onClick={() => setIsRegistering(true)}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold text-sm transition-all shadow-lg shadow-blue-100"
        >
          <Plus className="h-4 w-4" />
          Register New Sample
        </button>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Left: Filters & Search */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-6">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
              <input 
                type="text" 
                placeholder="Search Sample ID..."
                className="w-full pl-11 pr-4 py-3 bg-gray-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">Sample Types</h4>
              {['BLOOD', 'URINE', 'STOOL', 'SALIVA', 'TISSUE'].map(type => (
                <button key={type} className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 rounded-xl transition-colors group">
                  <span className="text-xs font-bold text-gray-600 group-hover:text-blue-600">{type}</span>
                  <span className="text-[10px] font-bold text-gray-300 bg-gray-100 px-2 py-0.5 rounded-lg group-hover:bg-blue-50 group-hover:text-blue-400">12</span>
                </button>
              ))}
            </div>

            <div className="pt-4 border-t border-gray-50">
              <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100">
                <div className="flex items-center gap-2 mb-2">
                  <Thermometer className="h-4 w-4 text-blue-600" />
                  <span className="text-[10px] font-black text-blue-700 uppercase tracking-widest">Storage Status</span>
                </div>
                <p className="text-xs text-blue-600/70 leading-relaxed font-medium">All storage units currently within optimal temperature ranges.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Samples List */}
        <div className="lg:col-span-3 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {loading ? (
              <div className="col-span-2 py-12 flex flex-col items-center justify-center bg-white rounded-3xl border border-dashed border-gray-200">
                <Activity className="h-8 w-8 text-blue-500 animate-spin mb-3" />
                <p className="text-sm font-bold text-gray-400">Synchronizing sample registry...</p>
              </div>
            ) : filteredSamples.length === 0 ? (
              <div className="col-span-2 py-12 flex flex-col items-center justify-center bg-white rounded-3xl border border-dashed border-gray-200">
                <Package className="h-12 w-12 text-gray-200 mb-3" />
                <p className="text-sm font-bold text-gray-400">No specimens found in the current registry.</p>
              </div>
            ) : filteredSamples.map((sample, idx) => (
              <motion.div 
                key={sample.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.1 }}
                className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all group"
              >
                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center gap-4">
                    <div className="h-14 w-14 bg-gray-50 rounded-2xl flex items-center justify-center group-hover:bg-blue-50 transition-colors">
                      <QrCode className="h-7 w-7 text-gray-400 group-hover:text-blue-500 transition-colors" />
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-gray-900 tracking-tight">{sample.sampleId}</h3>
                      <p className="text-[10px] font-bold text-blue-500 uppercase tracking-widest">{sample.type}</p>
                    </div>
                  </div>
                  <span className="px-3 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase tracking-widest rounded-lg border border-emerald-100">
                    {sample.status}
                  </span>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <History className="h-4 w-4 text-gray-300" />
                    <p className="text-xs font-bold text-gray-500">For: <span className="text-gray-900">{sample.labRequest.testName}</span></p>
                  </div>
                  <div className="flex items-center gap-3">
                    <User className="h-4 w-4 text-gray-300" />
                    <p className="text-xs font-bold text-gray-500">Patient: <span className="text-gray-900">{sample.labRequest.patient.name}</span></p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 pt-4 mt-4 border-t border-gray-50">
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Collected At</p>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-3 w-3 text-gray-400" />
                        <span className="text-[10px] font-bold text-gray-700">{sample.collectionLocation}</span>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Collection Date</p>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-3 w-3 text-gray-400" />
                        <span className="text-[10px] font-bold text-gray-700">{new Date(sample.collectionDate).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-8 flex gap-3">
                  <button className="flex-1 py-3 bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">
                    Print Barcode
                  </button>
                  <button className="flex-1 py-3 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">
                    View Details
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Registration Modal */}
      <AnimatePresence>
        {isRegistering && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsRegistering(false)}
              className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative bg-white w-full max-w-xl rounded-[40px] shadow-2xl p-10"
            >
              <div className="flex items-center gap-4 mb-8">
                <div className="h-16 w-16 bg-blue-50 rounded-[20px] flex items-center justify-center">
                  <Box className="h-8 w-8 text-blue-500" />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-gray-900 tracking-tight">Register Specimen</h3>
                  <p className="text-gray-400 font-bold uppercase text-xs tracking-widest">Entry into Clinical Inventory</p>
                </div>
              </div>

              <form onSubmit={handleRegister} className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">Lab Request</label>
                    <select 
                      required
                      className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl text-sm font-bold text-gray-700 focus:ring-2 focus:ring-blue-500 outline-none"
                      value={newSample.labRequestId}
                      onChange={(e) => setNewSample({...newSample, labRequestId: e.target.value})}
                    >
                      <option value="">Select Pending Request</option>
                      {activeRequests.map(req => (
                        <option key={req.id} value={req.id}>{req.testName} - {req.patient.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">Sample Type</label>
                    <select 
                      className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl text-sm font-bold text-gray-700 focus:ring-2 focus:ring-blue-500 outline-none"
                      value={newSample.type}
                      onChange={(e) => setNewSample({...newSample, type: e.target.value})}
                    >
                      {['BLOOD', 'URINE', 'STOOL', 'SALIVA', 'SPUTUM', 'TISSUE', 'SWAB', 'PLASMA', 'SERUM', 'CSF', 'OTHER'].map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">Collector Name</label>
                    <input 
                      required
                      type="text" 
                      placeholder="e.g. Nurse Sarah"
                      className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl text-sm font-bold text-gray-700 focus:ring-2 focus:ring-blue-500 outline-none"
                      value={newSample.collector}
                      onChange={(e) => setNewSample({...newSample, collector: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">Quantity/Volume</label>
                    <input 
                      required
                      type="text" 
                      placeholder="e.g. 5mL"
                      className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl text-sm font-bold text-gray-700 focus:ring-2 focus:ring-blue-500 outline-none"
                      value={newSample.quantity}
                      onChange={(e) => setNewSample({...newSample, quantity: e.target.value})}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">Barcode ID (Optional)</label>
                  <input 
                    type="text" 
                    placeholder="Leave blank to auto-generate"
                    className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl text-sm font-bold text-gray-700 focus:ring-2 focus:ring-blue-500 outline-none"
                    value={newSample.sampleId}
                    onChange={(e) => setNewSample({...newSample, sampleId: e.target.value})}
                  />
                </div>

                <div className="pt-6 flex gap-4">
                  <button 
                    type="button" 
                    onClick={() => setIsRegistering(false)}
                    className="flex-1 py-5 bg-gray-50 hover:bg-gray-100 text-gray-500 rounded-3xl font-black text-sm transition-all uppercase tracking-widest"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 py-5 bg-blue-600 hover:bg-blue-700 text-white rounded-3xl font-black text-sm transition-all shadow-xl shadow-blue-100 uppercase tracking-widest"
                  >
                    Confirm Registration
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
