import React, { useState, useEffect } from 'react';
import { 
  Building, UserCheck, Plus, Search, RefreshCw, Archive, CheckCircle2, Heart, Award
} from 'lucide-react';
import { toast } from 'sonner';

interface DepartmentsTabProps {
  token: string;
  doctors: any[];
}

export default function DepartmentsTab({ token, doctors }: DepartmentsTabProps) {
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [headId, setHeadId] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    setLoading(false);
    try {
      const res = await fetch('/api/admin/departments', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setDepartments(data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !code) {
      toast.error('Department name and unique code are required.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/admin/departments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name, code, headId: headId || undefined })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to create department');
      }

      toast.success(`Department "${name}" successfully established.`);
      setIsCreating(false);
      setName('');
      setCode('');
      setHeadId('');
      fetchDepartments();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleArchiveDept = async (id: string, deptName: string) => {
    const confirmed = confirm(`Are you sure you want to archive "${deptName}"? This registers the clinical department as archived.`);
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/admin/departments/${id}/archive`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!res.ok) throw new Error('Failed to archive department');

      toast.success(`Department "${deptName}" successfully archived.`);
      fetchDepartments();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const filteredDepts = departments.filter(d => {
    const query = search.toLowerCase();
    return d.name.toLowerCase().includes(query) || d.code.toLowerCase().includes(query);
  });

  return (
    <div className="space-y-6">
      {/* Action panel */}
      <div className="bg-white border border-gray-100 rounded-3xl p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="text-[10px] text-gray-400 font-mono uppercase block">Hospital Infrastructure</span>
          <h4 className="font-bold text-sm text-gray-800">Clinical Departments & Unit Command Heads</h4>
        </div>

        <button
          onClick={() => setIsCreating(!isCreating)}
          className="bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-colors cursor-pointer flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>{isCreating ? 'Dismiss Provisioner' : 'Establish New Department'}</span>
        </button>
      </div>

      {/* Register Form */}
      {isCreating && (
        <form onSubmit={handleCreateDepartment} className="bg-white border border-gray-100 rounded-3xl p-6 space-y-4 animate-fadeIn">
          <div className="border-b border-gray-50 pb-2">
            <h5 className="font-bold text-xs text-gray-700 uppercase tracking-wider font-mono">Departmental Registry Protocol</h5>
            <p className="text-[10px] text-gray-400">Initialize a new medical unit with regulatory code definitions and clinic leadership assignments.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-[10px] font-bold text-gray-500 font-mono block mb-1">DEPARTMENT NAME *</label>
              <input
                type="text"
                required
                placeholder="e.g. Cardiology"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full text-xs py-1.5 px-3 border border-gray-200 rounded-xl focus:outline-none"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-gray-500 font-mono block mb-1">DEPARTMENT CODE *</label>
              <input
                type="text"
                required
                placeholder="e.g. CARD"
                value={code}
                onChange={e => setCode(e.target.value)}
                className="w-full text-xs py-1.5 px-3 border border-gray-200 rounded-xl focus:outline-none uppercase"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-gray-500 font-mono block mb-1">ASSIGNED HEAD OF DEPARTMENT</label>
              <select
                value={headId}
                onChange={e => setHeadId(e.target.value)}
                className="w-full text-xs py-1.5 px-3 border border-gray-200 rounded-xl focus:outline-none bg-white font-semibold text-gray-700"
              >
                <option value="">No head assigned (Administrative Vacancy)...</option>
                {doctors.map(doc => (
                  <option key={doc.id} value={doc.id}>
                    {doc.name} - {doc.specialization || 'Clinical Specialist'}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-end pt-2 border-t border-gray-50">
            <button
              type="submit"
              disabled={submitting}
              className="bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold px-5 py-2 rounded-xl transition-colors disabled:opacity-50 cursor-pointer"
            >
              {submitting ? 'Establishing...' : 'Establish Department'}
            </button>
          </div>
        </form>
      )}

      {/* Directory Grid */}
      <div className="bg-white border border-gray-100 rounded-3xl p-6">
        <div className="flex items-center justify-between border-b border-gray-50 pb-4 mb-4 gap-4">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-gray-300" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by department name or code..."
              className="pl-8 pr-4 py-1.5 text-xs border border-gray-200 rounded-xl bg-gray-50 focus:outline-none w-full"
            />
          </div>

          <button 
            onClick={fetchDepartments}
            className="bg-gray-50 border border-gray-200 p-2 rounded-xl hover:bg-gray-100 text-gray-600 shrink-0"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDepts.length > 0 ? (
            filteredDepts.map((dept) => {
              const headDoc = doctors.find(doc => doc.id === dept.headId);
              return (
                <div 
                  key={dept.id} 
                  className={`border border-gray-100 rounded-2xl p-5 space-y-4 hover:border-gray-200 transition-all ${
                    dept.archived ? 'bg-gray-50 opacity-60' : 'bg-white'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <Building className="h-4 w-4 text-rose-500 shrink-0" />
                        <span className="font-bold text-sm text-gray-800">{dept.name}</span>
                      </div>
                      <span className="bg-indigo-50 border border-indigo-100 text-indigo-700 font-mono font-bold text-[9px] px-1.5 py-0.5 rounded uppercase">
                        {dept.code}
                      </span>
                    </div>

                    {!dept.archived && (
                      <button
                        onClick={() => handleArchiveDept(dept.id, dept.name)}
                        className="text-gray-400 hover:text-rose-500 p-1.5 transition-colors cursor-pointer"
                        title="Archive Department"
                      >
                        <Archive className="h-4 w-4" />
                      </button>
                    )}
                  </div>

                  <div className="space-y-2 text-xs text-gray-500 border-t border-gray-50 pt-3">
                    <div className="flex items-start">
                      <UserCheck className="h-4 w-4 mr-2 text-gray-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-mono text-[9px] font-bold text-gray-400 block uppercase leading-none">HEAD OF UNIT</span>
                        <span className="font-semibold text-gray-700 block mt-1">
                          {headDoc ? headDoc.name : 'Unassigned (Vacancy)'}
                        </span>
                        {headDoc && (
                          <span className="text-[10px] text-gray-400 block mt-0.5">{headDoc.specialization || 'Clinical Specialist'}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-[10px] text-gray-400 font-mono border-t border-gray-50 pt-2.5">
                    <span>Active Doctors: {doctors.filter(doc => doc.department === dept.name).length}</span>
                    <span>Status: {dept.archived ? 'Archived' : 'Active'}</span>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="col-span-full text-center text-gray-400 py-8 font-mono">No clinical departments established.</div>
          )}
        </div>
      </div>
    </div>
  );
}
