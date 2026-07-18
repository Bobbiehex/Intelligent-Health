import React, { useState } from 'react';
import { Search, Filter, User, Calendar, Activity, ChevronRight, MoreHorizontal, UserCheck } from 'lucide-react';
import { User as Patient } from '../../types';

interface PatientListProps {
  patients: Patient[];
  onSelectPatient: (patient: Patient) => void;
  loading: boolean;
}

export default function PatientList({ patients, onSelectPatient, loading }: PatientListProps) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');

  const filtered = patients.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || 
                         p.patientId?.toLowerCase().includes(search.toLowerCase()) ||
                         p.phone?.includes(search);
    const matchesFilter = filter === 'All' || p.gender === filter || (filter === 'High Risk' && p.bloodGroup === 'O-'); // Example filter
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden flex flex-col h-full">
      <div className="p-6 border-b border-gray-50 space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-bold text-gray-900">Patient Directory</h2>
          <span className="text-xs text-gray-400 font-mono">{filtered.length} Patients Total</span>
        </div>
        
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-300" />
            <input 
              type="text" 
              placeholder="Search by name, ID, or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
          <button className="p-2.5 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
            <Filter className="h-4 w-4 text-gray-500" />
          </button>
        </div>

        <div className="flex gap-2">
          {['All', 'Male', 'Female', 'High Risk'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                filter === f ? 'bg-indigo-600 text-white shadow-md' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-12 text-center text-gray-400">
            <div className="animate-spin h-6 w-6 border-2 border-indigo-500 border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-xs">Accessing patient records...</p>
          </div>
        ) : filtered.length > 0 ? (
          <div className="divide-y divide-gray-50">
            {filtered.map((patient) => (
              <div 
                key={patient.id} 
                onClick={() => onSelectPatient(patient)}
                className="p-4 hover:bg-gray-50 cursor-pointer transition-colors group flex items-center gap-4"
              >
                <div className="h-12 w-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold overflow-hidden relative">
                  {patient.name.charAt(0)}
                  <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/10 to-transparent" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-gray-900 truncate group-hover:text-indigo-600 transition-colors">
                      {patient.name}
                    </h3>
                    {patient.bloodGroup === 'O-' && (
                      <span className="px-1.5 py-0.5 bg-rose-50 text-rose-600 text-[8px] font-bold rounded uppercase">High Risk</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-[10px] text-gray-400 font-mono">
                    <span className="flex items-center gap-1">
                      <UserCheck className="h-3 w-3" />
                      {patient.patientId || 'NO-ID'}
                    </span>
                    <span className="flex items-center gap-1">
                      <Activity className="h-3 w-3" />
                      {patient.gender} • {patient.dob}
                    </span>
                  </div>
                </div>

                <div className="text-right flex flex-col items-end gap-1">
                  <span className="text-[10px] text-gray-300 font-medium">Last Visit</span>
                  <span className="text-xs text-gray-500 font-semibold italic">12 Jun 2024</span>
                </div>
                
                <ChevronRight className="h-4 w-4 text-gray-300 group-hover:translate-x-1 transition-transform" />
              </div>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center text-gray-400">
            <User className="h-8 w-8 mx-auto mb-3 opacity-20" />
            <p className="text-xs">No patients found matching your search.</p>
          </div>
        )}
      </div>
    </div>
  );
}
