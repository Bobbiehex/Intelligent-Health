import React, { useState, useEffect } from 'react';
import { 
  BookOpen, Search, Filter, Play, FileText, 
  ChevronRight, ExternalLink, Sparkles, Book,
  Heart, Apple, Activity, Brain
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';

interface Resource {
  id: string;
  title: string;
  content: string;
  category: string;
  type: string;
  mediaUrl?: string;
  tags?: string;
}

interface EducationLibraryProps {
  user: any;
  token: string;
}

export default function EducationLibrary({ user, token }: EducationLibraryProps) {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const categories = ['All', 'Nutrition', 'Mental Health', 'Exercise', 'Chronic Care', 'First Aid', 'Wellness'];

  useEffect(() => {
    const fetchResources = async () => {
      try {
        const response = await fetch('/api/patient/educational-resources', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        setResources(data);
      } catch (error) {
        toast.error('Failed to load resources');
      } finally {
        setLoading(false);
      }
    };
    fetchResources();
  }, [token]);

  const filteredResources = resources.filter(r => {
    const matchesCategory = selectedCategory === 'All' || r.category === selectedCategory;
    const matchesSearch = r.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          r.content.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  if (loading) return null;

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-2xl font-display font-bold text-slate-800">Health Education Library</h2>
          <p className="text-slate-500 text-sm mt-1">Validated medical information and wellness resources.</p>
        </div>
        
        <div className="flex-1 max-w-md relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Search articles, guides, videos..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-slate-100 rounded-2xl py-3 pl-12 pr-4 text-sm shadow-sm focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none"
          />
        </div>
      </div>

      <div className="flex items-center space-x-2 overflow-x-auto no-scrollbar pb-2">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-6 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap border ${
              selectedCategory === cat 
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-100' 
                : 'bg-white text-slate-500 border-slate-100 hover:bg-slate-50'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Featured AI Recommendations */}
      <div className="bg-indigo-600 p-8 rounded-[2.5rem] text-white shadow-xl shadow-indigo-100 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/3 translate-x-1/3 blur-3xl"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="space-y-4 max-w-xl">
            <div className="flex items-center space-x-2 text-[10px] font-bold font-mono tracking-widest uppercase opacity-70">
              <Sparkles size={14} />
              <span>Personalized For You</span>
            </div>
            <h3 className="text-2xl font-bold tracking-tight">Understanding Cardiovascular Resilience</h3>
            <p className="text-indigo-100 text-sm leading-relaxed">
              Based on your recent heart rate trends, we recommend this guide on interval-based wellness exercises specifically for managing blood pressure stability.
            </p>
            <button 
              onClick={() => {
                document.getElementById('resources-grid')?.scrollIntoView({ behavior: 'smooth' });
                toast.info('Scrolling to your personalized health guides...');
              }}
              className="bg-white text-indigo-600 px-8 py-3 rounded-2xl font-bold text-sm shadow-sm hover:bg-slate-50 transition-all"
            >
              Read Guide
            </button>
          </div>
          <div className="hidden lg:block">
            <div className="w-48 h-48 bg-white/10 rounded-[3rem] flex items-center justify-center border border-white/10 backdrop-blur-sm">
              <BookOpen size={64} className="text-indigo-200" />
            </div>
          </div>
        </div>
      </div>

      <div id="resources-grid" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredResources.map((res, i) => (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            key={res.id}
            className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden group hover:shadow-md transition-all cursor-pointer"
          >
            <div className="h-48 bg-slate-100 relative overflow-hidden">
              {res.mediaUrl ? (
                <img src={res.mediaUrl} alt={res.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-300">
                  <FileText size={48} />
                </div>
              )}
              <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-lg text-[10px] font-bold text-slate-800 uppercase tracking-widest border border-white/20">
                {res.category}
              </div>
              {res.type === 'Video' && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/30 group-hover:scale-110 transition-transform">
                    <Play size={20} fill="white" />
                  </div>
                </div>
              )}
            </div>
            <div className="p-6">
              <h4 className="font-bold text-slate-800 group-hover:text-indigo-600 transition-colors line-clamp-1">{res.title}</h4>
              <p className="text-xs text-slate-400 mt-2 line-clamp-2 leading-relaxed">{res.content}</p>
              
              <div className="mt-6 pt-6 border-t border-slate-50 flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-300 uppercase font-mono">{res.type} • 5 MIN READ</span>
                <ChevronRight size={16} className="text-slate-300 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {filteredResources.length === 0 && (
        <div className="text-center py-20 bg-white rounded-[3rem] border border-dashed border-slate-200">
          <Book size={48} className="mx-auto mb-4 text-slate-200" />
          <h3 className="text-slate-800 font-bold">No Resources Found</h3>
          <p className="text-slate-400 text-sm mt-1">Try adjusting your search or category filters.</p>
        </div>
      )}

      {/* Footer Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8">
        <div className="bg-emerald-50/50 p-8 rounded-[2.5rem] border border-emerald-100/50 flex items-start space-x-6">
          <div className="w-16 h-16 bg-white rounded-[1.5rem] flex items-center justify-center text-emerald-600 shadow-sm shrink-0">
            <Apple size={32} />
          </div>
          <div>
            <h4 className="font-bold text-emerald-900">Nutrition & Dietetics</h4>
            <p className="text-sm text-emerald-700/70 mt-2 leading-relaxed">
              Explore our collection of clinical nutrition guides vetted by registered dietitians and physicians.
            </p>
            <button 
              onClick={() => {
                setSelectedCategory('Nutrition');
                document.getElementById('resources-grid')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="mt-4 text-xs font-bold text-emerald-600 flex items-center hover:underline"
            >
              Explore Category <ChevronRight size={14} className="ml-1" />
            </button>
          </div>
        </div>

        <div className="bg-rose-50/50 p-8 rounded-[2.5rem] border border-rose-100/50 flex items-start space-x-6">
          <div className="w-16 h-16 bg-white rounded-[1.5rem] flex items-center justify-center text-rose-600 shadow-sm shrink-0">
            <Brain size={32} />
          </div>
          <div>
            <h4 className="font-bold text-rose-900">Mental Wellness</h4>
            <p className="text-sm text-rose-700/70 mt-2 leading-relaxed">
              Resources for cognitive behavioral therapy techniques, stress management, and mindfulness guides.
            </p>
            <button 
              onClick={() => {
                setSelectedCategory('Mental Health');
                document.getElementById('resources-grid')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="mt-4 text-xs font-bold text-rose-600 flex items-center hover:underline"
            >
              Explore Category <ChevronRight size={14} className="ml-1" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
