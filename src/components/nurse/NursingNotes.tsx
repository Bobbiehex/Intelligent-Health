import React, { useState, useEffect } from 'react';
import { 
  ClipboardList, Plus, FileText, Clock, 
  User, RefreshCw, Save, MessageSquare, History, Stethoscope
} from 'lucide-react';
import { toast } from 'sonner';

interface NursingNotesProps {
  patientId: string;
  token: string;
}

export default function NursingNotes({ patientId, token }: NursingNotesProps) {
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [notes, setNotes] = useState<any[]>([]);
  const [newNote, setNewNote] = useState('');
  const [noteType, setNoteType] = useState('Progress');

  const fetchNotes = async () => {
    setFetching(true);
    try {
      const res = await fetch(`/api/nurse/patients/${patientId}/notes`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setNotes(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, [patientId]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;

    setLoading(true);
    try {
      const res = await fetch('/api/nurse/notes', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({
          patientId,
          note: newNote,
          type: noteType
        })
      });

      if (res.ok) {
        toast.success('Nursing note saved');
        setNewNote('');
        fetchNotes();
      } else {
        throw new Error('Failed to save note');
      }
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm flex flex-col h-full" id="nursing-notes-module">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-amber-500" />
            Nursing Progress Notes
          </h3>
          <p className="text-[10px] text-gray-400 font-mono uppercase tracking-wider mt-0.5">Clinical observations & shift reports</p>
        </div>
        <button onClick={fetchNotes} className="p-2 hover:bg-gray-50 rounded-xl transition-colors">
          <RefreshCw className={`h-4 w-4 text-gray-400 ${fetching ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="flex-1 flex flex-col gap-8 overflow-hidden">
        {/* Entry Section */}
        <form onSubmit={handleSave} className="space-y-4">
          <div className="flex gap-2">
            {['Progress', 'Shift Change', 'Observation'].map(t => (
              <button 
                key={t} type="button"
                onClick={() => setNoteType(t)}
                className={`px-4 py-1.5 rounded-xl text-[9px] font-bold uppercase tracking-widest transition-all ${
                  noteType === t ? 'bg-amber-100 text-amber-700 border border-amber-200' : 'bg-gray-50 text-gray-400 border border-transparent hover:bg-gray-100'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
          <div className="relative">
            <textarea 
              rows={4}
              placeholder="Record clinical updates, patient responses, family education, or shift handover details..."
              className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-xs outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all resize-none leading-relaxed"
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
            />
            <button 
              type="submit"
              disabled={loading || !newNote.trim()}
              className="absolute bottom-3 right-3 bg-gray-900 text-white p-2 rounded-xl hover:bg-black disabled:opacity-50 transition-all shadow-lg shadow-black/10"
            >
              {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            </button>
          </div>
        </form>

        {/* History Section */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="mb-3 flex items-center gap-2">
            <History className="h-3.5 w-3.5 text-gray-400" />
            <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Previous Clinical Notes</h4>
          </div>
          
          <div className="flex-1 overflow-y-auto space-y-4 pr-2 scrollbar-thin scrollbar-thumb-gray-100">
            {fetching ? (
              <div className="py-12 flex flex-col items-center justify-center space-y-3">
                <div className="h-6 w-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-[9px] text-gray-400 font-mono uppercase">Retrieving chart notes...</p>
              </div>
            ) : notes.length > 0 ? (
              notes.map((note) => {
                const isDoctorInstruction = note.type === 'Doctor Instruction' || note.nurseId.startsWith('Doctor');
                return (
                  <div 
                    key={note.id} 
                    className={`border rounded-2xl p-4 space-y-3 transition-colors ${
                      isDoctorInstruction 
                        ? 'bg-indigo-50/40 border-indigo-100 hover:border-indigo-300 shadow-sm shadow-indigo-50/50' 
                        : 'bg-gray-50/50 border-gray-100 hover:border-amber-200'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-lg border ${
                        isDoctorInstruction 
                          ? 'bg-indigo-100 text-indigo-700 border-indigo-200 flex items-center gap-1' 
                          : 'bg-amber-100 text-amber-700 border-amber-200'
                      }`}>
                        {isDoctorInstruction && <Stethoscope className="h-2.5 w-2.5" />}
                        {note.type}
                      </span>
                      <div className="flex items-center gap-1.5 text-[9px] text-gray-400 font-medium">
                        <Clock className="h-3 w-3" />
                        {new Date(note.createdAt).toLocaleString()}
                      </div>
                    </div>
                    <p className={`text-xs leading-relaxed font-medium ${
                      isDoctorInstruction ? 'text-indigo-950 font-semibold' : 'text-gray-700'
                    }`}>
                      {note.note}
                    </p>
                    <div className="pt-2 border-t border-gray-100 flex items-center gap-2">
                      <div className={`h-5 w-5 rounded-full border flex items-center justify-center text-[8px] font-bold ${
                        isDoctorInstruction 
                          ? 'bg-indigo-50 border-indigo-100 text-indigo-700' 
                          : 'bg-white border-gray-100 text-amber-600'
                      }`}>
                        {isDoctorInstruction ? 'DR' : 'NS'}
                      </div>
                      <span className="text-[10px] font-bold text-gray-500 tracking-tight">
                        {isDoctorInstruction ? note.nurseId : `Staff ID: ${note.nurseId.slice(0, 8)}`}
                      </span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="py-12 flex flex-col items-center justify-center text-center space-y-3 opacity-40">
                <FileText className="h-10 w-10 text-gray-300" />
                <p className="text-xs text-gray-400 font-medium italic">No nursing notes registered for this patient.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
