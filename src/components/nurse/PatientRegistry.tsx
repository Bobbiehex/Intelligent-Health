import React, { useState } from 'react';
import { 
  Search, Users, ChevronRight, User, Phone, MapPin, 
  Calendar, Droplets, Activity, FileText, Info
} from 'lucide-react';
import { User as UserType } from '../../types';

interface PatientRegistryProps {
  patients: UserType[];
  loading: boolean;
  onSelect: (patientId: string) => void;
}

export default function PatientRegistry({ patients, loading, onSelect }: PatientRegistryProps) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');

  const filtered = patients.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || 
                         p.patientId?.toLowerCase().includes(search.toLowerCase()) ||
                         p.mrn?.toLowerCase().includes(search.toLowerCase());
    if (filter === 'All') return matchesSearch;
    return matchesSearch && p.gender === filter;
  });

  return (
    <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm flex flex-col h-full" id="patient-registry">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
            <Users className="h-4 w-4 text-rose-500" />
            Ward Patient Registry
          </h3>
          <p className="text-[10px] text-gray-400 font-mono uppercase tracking-wider mt-0.5">Search and view patient medical files</p>
        </div>
        <div className="flex gap-2">
          {['All', 'Male', 'Female'].map(g => (
            <button 
              key={g}
              onClick={() => setFilter(g)}
              className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase transition-all ${
                filter === g ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-400 hover:bg-gray-100'
              }`}
            >
              {g}
            </button>
          ))}
        </div>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input 
          type="text"
          placeholder="Search by Name, Patient ID, or MRN..."
          className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-xs focus:bg-white focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all outline-none"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-thin scrollbar-thumb-gray-200">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full py-12 space-y-4">
            <div className="h-8 w-8 border-2 border-rose-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-[10px] text-gray-400 font-mono uppercase tracking-widest">Retrieving clinical records...</p>
          </div>
        ) : filtered.length > 0 ? (
          filtered.map((p) => (
            <button 
              key={p.id}
              onClick={() => onSelect(p.id)}
              className="w-full group text-left bg-white border border-gray-100 p-4 rounded-2xl hover:border-rose-200 hover:bg-rose-50/30 transition-all flex items-center gap-4 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <ChevronRight className="h-4 w-4 text-rose-500" />
              </div>
              
              <div className="h-10 w-10 rounded-xl bg-gray-50 flex items-center justify-center group-hover:bg-rose-100 group-hover:scale-110 transition-all">
                <User className="h-5 w-5 text-gray-400 group-hover:text-rose-600" />
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start mb-0.5">
                  <h4 className="text-xs font-bold text-gray-900 truncate">{p.name}</h4>
                  <span className="text-[9px] font-bold text-rose-600 font-mono">{p.bloodGroup || 'O+'}</span>
                </div>
                <div className="flex items-center gap-3 text-[10px] text-gray-400 font-medium">
                  <span className="flex items-center gap-1">
                    <Info className="h-3 w-3" />
                    {p.patientId || `PAT-${p.id.slice(0, 4)}`}
                  </span>
                  <span className="w-1 h-1 rounded-full bg-gray-200" />
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {p.gender}, {p.dob ? new Date().getFullYear() - new Date(p.dob).getFullYear() : '??'}y
                  </span>
                </div>
              </div>
            </button>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center h-full py-12 text-center">
            <Users className="h-12 w-12 text-gray-100 mb-2" />
            <p className="text-xs text-gray-400 font-medium italic">No matching patient records found.</p>
          </div>
        )}
      </div>
      
      <div className="mt-6 p-4 bg-amber-50 border border-amber-100 rounded-2xl flex items-start gap-3">
        <Activity className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
        <p className="text-[10px] leading-relaxed text-amber-800 font-medium">
          <span className="font-bold">Nurse Advisory:</span> Verify patient identity using at least two identifiers before clinical intervention.
        </p>
      </div>
    </div>
  );
}
