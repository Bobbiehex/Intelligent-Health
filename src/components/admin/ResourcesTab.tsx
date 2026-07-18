import React, { useState, useEffect } from 'react';
import { 
  Building, ShieldCheck, Plus, RefreshCw, PenTool, CheckCircle2, AlertTriangle, Hammer, Trash2, Shield
} from 'lucide-react';
import { toast } from 'sonner';

interface ResourcesTabProps {
  token: string;
}

export default function ResourcesTab({ token }: ResourcesTabProps) {
  const [resources, setResources] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [type, setType] = useState('Consultation Room');
  const [status, setStatus] = useState('Available');
  const [occupancy, setOccupancy] = useState(0);
  const [maxCapacity, setMaxCapacity] = useState(1);
  const [maintenanceNotes, setMaintenanceNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Edit states
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editStatus, setEditStatus] = useState('');
  const [editOccupancy, setEditOccupancy] = useState(0);
  const [editMaintenance, setEditMaintenance] = useState('');

  useEffect(() => {
    fetchResources();
  }, []);

  const fetchResources = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/resources', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setResources(data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateResource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) {
      toast.error('Asset/Resource name is required.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/admin/resources', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name, type, status, occupancy, maxCapacity, maintenanceNotes })
      });

      if (!res.ok) throw new Error('Failed to create asset');

      toast.success(`Asset "${name}" successfully registered into clinic inventories.`);
      setIsCreating(false);
      setName('');
      setType('Consultation Room');
      setStatus('Available');
      setOccupancy(0);
      setMaxCapacity(1);
      setMaintenanceNotes('');
      fetchResources();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateResource = async (id: string) => {
    try {
      const original = resources.find(r => r.id === id);
      const res = await fetch(`/api/admin/resources/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: original.name,
          type: original.type,
          status: editStatus,
          occupancy: Number(editOccupancy),
          maxCapacity: original.maxCapacity,
          maintenanceNotes: editMaintenance,
          lastMaintenance: editStatus === 'Maintenance' ? new Date().toISOString() : original.lastMaintenance
        })
      });

      if (!res.ok) throw new Error('Failed to update asset parameters');

      toast.success(`Asset parameters successfully synchronized.`);
      setEditingId(null);
      fetchResources();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Action Bar */}
      <div className="bg-white border border-gray-100 rounded-3xl p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="text-[10px] text-gray-400 font-mono uppercase block">Hospital Resource Command</span>
          <h4 className="font-bold text-sm text-gray-800">Operational Assets, Ward Occupancy & Maintenances</h4>
        </div>

        <button
          onClick={() => setIsCreating(!isCreating)}
          className="bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-colors cursor-pointer flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>{isCreating ? 'Dismiss Provisioner' : 'Provision Asset / Room'}</span>
        </button>
      </div>

      {/* Register Asset */}
      {isCreating && (
        <form onSubmit={handleCreateResource} className="bg-white border border-gray-100 rounded-3xl p-6 space-y-4 animate-fadeIn">
          <div className="border-b border-gray-50 pb-2">
            <h5 className="font-bold text-xs text-gray-700 uppercase tracking-wider font-mono">Resource Provisioning Protocol</h5>
            <p className="text-[10px] text-gray-400">Add physical capacity (wards, consultation hubs, lab machinery) to hospital resource routing tables.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-[10px] font-bold text-gray-500 font-mono block mb-1">ASSET / LOCATION NAME *</label>
              <input
                type="text"
                required
                placeholder="e.g. Ward A, Bed 4"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full text-xs py-1.5 px-3 border border-gray-200 rounded-xl focus:outline-none"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-gray-500 font-mono block mb-1">ASSET / SPACE TYPE</label>
              <select
                value={type}
                onChange={e => setType(e.target.value)}
                className="w-full text-xs py-1.5 px-3 border border-gray-200 rounded-xl focus:outline-none bg-white font-semibold text-gray-700"
              >
                <option value="Consultation Room">Consultation Room</option>
                <option value="Ward">Ward</option>
                <option value="Bed">Bed</option>
                <option value="Operating Theatre">Operating Theatre</option>
                <option value="Laboratory">Laboratory Asset</option>
                <option value="Pharmacy Location">Pharmacy Location</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] font-bold text-gray-500 font-mono block mb-1">CAPACITY (MAX PEOPLE)</label>
              <input
                type="number"
                min={1}
                value={maxCapacity}
                onChange={e => setMaxCapacity(Number(e.target.value))}
                className="w-full text-xs py-1.5 px-3 border border-gray-200 rounded-xl focus:outline-none"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-gray-500 font-mono block mb-1">INITIAL STATUS</label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value)}
                className="w-full text-xs py-1.5 px-3 border border-gray-200 rounded-xl focus:outline-none bg-white font-semibold text-gray-700"
              >
                <option value="Available">Available</option>
                <option value="Occupied">Occupied</option>
                <option value="Maintenance">Maintenance</option>
                <option value="Cleaning">Cleaning</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold text-gray-500 font-mono block mb-1">ASSET NOTES / INVENTORY REMARKS</label>
            <input
              type="text"
              placeholder="e.g. Equipped with cardiac monitors and oxygen supply lines"
              value={maintenanceNotes}
              onChange={e => setMaintenanceNotes(e.target.value)}
              className="w-full text-xs py-1.5 px-3 border border-gray-200 rounded-xl focus:outline-none"
            />
          </div>

          <div className="flex justify-end pt-2 border-t border-gray-50">
            <button
              type="submit"
              disabled={submitting}
              className="bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold px-5 py-2 rounded-xl transition-colors disabled:opacity-50 cursor-pointer"
            >
              {submitting ? 'Registering...' : 'Provision Asset'}
            </button>
          </div>
        </form>
      )}

      {/* Grid of resources */}
      <div className="bg-white border border-gray-100 rounded-3xl p-6">
        <div className="flex justify-between items-center border-b border-gray-50 pb-4 mb-4">
          <span className="text-[10px] font-mono text-gray-400 block uppercase">ASSET COMPLIANCE DIRECTORY</span>
          <button 
            onClick={fetchResources}
            className="bg-gray-50 border border-gray-200 p-2 rounded-xl hover:bg-gray-100 text-gray-600 shrink-0"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
        </div>

        {loading ? (
          <div className="text-center py-8 font-mono text-gray-400 text-xs">Querying asset registries...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {resources.length > 0 ? (
              resources.map((item) => {
                const isEditing = editingId === item.id;
                return (
                  <div 
                    key={item.id} 
                    className={`border rounded-2xl p-5 space-y-4 hover:border-gray-200 transition-all bg-white ${
                      item.status === 'Maintenance' 
                        ? 'border-amber-100' 
                        : item.status === 'Occupied'
                        ? 'border-indigo-50'
                        : 'border-gray-100'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5">
                          <Building className="h-4 w-4 text-rose-500 shrink-0" />
                          <span className="font-bold text-sm text-gray-800">{item.name}</span>
                        </div>
                        <span className="text-[10px] text-gray-400 font-mono block">{item.type}</span>
                      </div>

                      {isEditing ? (
                        <div className="flex gap-1 shrink-0">
                          <button
                            onClick={() => handleUpdateResource(item.id)}
                            className="bg-rose-500 hover:bg-rose-600 text-white font-mono font-bold text-[9px] px-2 py-1 rounded cursor-pointer"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="bg-gray-100 hover:bg-gray-200 text-gray-600 font-mono font-bold text-[9px] px-2 py-1 rounded cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setEditingId(item.id);
                            setEditStatus(item.status);
                            setEditOccupancy(item.occupancy);
                            setEditMaintenance(item.maintenanceNotes || '');
                          }}
                          className="text-gray-400 hover:text-indigo-600 p-1.5 transition-colors cursor-pointer"
                          title="Edit asset status"
                        >
                          <PenTool className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>

                    <div className="space-y-3 text-xs text-gray-500 border-t border-gray-50 pt-3">
                      {isEditing ? (
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[8px] font-bold text-gray-400 font-mono block mb-1">STATUS</label>
                            <select
                              value={editStatus}
                              onChange={e => setEditStatus(e.target.value)}
                              className="w-full text-xs py-1 px-1.5 border border-gray-200 rounded bg-white"
                            >
                              <option value="Available">Available</option>
                              <option value="Occupied">Occupied</option>
                              <option value="Maintenance">Maintenance</option>
                              <option value="Cleaning">Cleaning</option>
                            </select>
                          </div>
                          <div>
                            <label className="text-[8px] font-bold text-gray-400 font-mono block mb-1">OCCUPANCY</label>
                            <input
                              type="number"
                              min={0}
                              max={item.maxCapacity}
                              value={editOccupancy}
                              onChange={e => setEditOccupancy(Number(e.target.value))}
                              className="w-full text-xs py-1 px-1.5 border border-gray-200 rounded"
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="flex justify-between items-center bg-gray-50/50 p-2 rounded-xl">
                          <div>
                            <span className="text-[8px] text-gray-400 font-mono block">OCCUPANCY CAPACITY</span>
                            <span className="text-xs font-bold text-gray-700 font-mono">
                              {item.occupancy} / {item.maxCapacity}
                            </span>
                          </div>
                          <span className={`font-mono font-bold text-[9px] px-1.5 py-0.5 rounded border uppercase flex items-center space-x-1 ${
                            item.status === 'Available' 
                              ? 'bg-emerald-50 border-emerald-100 text-emerald-600' 
                              : item.status === 'Occupied'
                              ? 'bg-indigo-50 border-indigo-100 text-indigo-600'
                              : item.status === 'Maintenance'
                              ? 'bg-amber-50 border-amber-100 text-amber-600'
                              : 'bg-gray-50 border-gray-100 text-gray-600'
                          }`}>
                            {item.status}
                          </span>
                        </div>
                      )}

                      {/* Notes / Remarks */}
                      <div className="space-y-1">
                        <span className="text-[8px] font-mono text-gray-400 block uppercase">INVENTORY REMARKS & MAINTENANCE LOG</span>
                        {isEditing ? (
                          <input
                            type="text"
                            value={editMaintenance}
                            onChange={e => setEditMaintenance(e.target.value)}
                            className="w-full text-xs py-1 px-2 border border-gray-200 rounded"
                            placeholder="Add maintenance notes..."
                          />
                        ) : (
                          <p className="text-[11px] leading-relaxed text-gray-600">
                            {item.maintenanceNotes || 'No maintenance logs or remarks.'}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex justify-between items-center text-[9px] text-gray-400 font-mono border-t border-gray-50 pt-2.5">
                      <span>Created: {new Date(item.createdAt).toLocaleDateString()}</span>
                      {item.lastMaintenance && (
                        <span>Last Maint: {new Date(item.lastMaintenance).toLocaleDateString()}</span>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="col-span-full text-center text-gray-400 py-8 font-mono">No physical assets registered. Click Provision Asset to establish.</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
