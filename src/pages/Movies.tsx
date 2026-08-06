import React, { useState, useEffect, useMemo } from 'react';
import { Search, Loader2, FilterX, CheckSquare, Square, Trash2, X, AlertTriangle } from 'lucide-react';
import { dbService } from '../services/dbService';
import type { Movie } from '../types';
import { MovieCard } from '../components/ui/MovieCard';
import { motion, AnimatePresence } from 'framer-motion';
import { staggerContainer } from '../utils/animations';
import { useLanguage } from '../contexts/LanguageContext';

export const Movies: React.FC = () => {
  const { t, language } = useLanguage();
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('date_desc');

  // Selection mode
  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadMovies = async () => {
    try {
      setLoading(true);
      const data = await dbService.getMoviesWithScores();
      setMovies(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadMovies(); }, []);

  const filteredMovies = useMemo(() => {
    let result = [...movies];
    if (searchQuery) {
      const lower = searchQuery.toLowerCase();
      result = result.filter(m => m.title.toLowerCase().includes(lower) || (m.original_title && m.original_title.toLowerCase().includes(lower)));
    }
    result.sort((a, b) => {
      if (sortBy === 'date_desc') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      if (sortBy === 'date_asc') return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      if (sortBy === 'score_desc') return (b.average_score || 0) - (a.average_score || 0);
      if (sortBy === 'score_asc') return (a.average_score || 0) - (b.average_score || 0);
      if (sortBy === 'year_desc') return (b.release_year || 0) - (a.release_year || 0);
      if (sortBy === 'year_asc') return (a.release_year || 0) - (b.release_year || 0);
      return 0;
    });
    return result;
  }, [movies, searchQuery, sortBy]);

  const toggleSelect = (id: number) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const exitSelectMode = () => {
    setSelectMode(false);
    setSelected(new Set());
  };

  const handleDeleteSelected = async () => {
    setIsDeleting(true);
    try {
      await Promise.all([...selected].map(id => dbService.deleteMovie(id)));
      setShowDeleteConfirm(false);
      exitSelectMode();
      await loadMovies();
    } catch (err) {
      console.error(err);
    } finally {
      setIsDeleting(false);
    }
  };

  const allSelected = filteredMovies.length > 0 && filteredMovies.every(m => selected.has(m.id));

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filteredMovies.map(m => m.id)));
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto w-full pb-40 animate-in fade-in duration-500">

      <header className="mb-6 md:mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-5xl font-black text-slate-50 tracking-tight leading-tight mb-2 drop-shadow-md">{t('movies.title')}</h1>
          <p className="text-sm md:text-base text-slate-400 font-medium">{t('dashboard.total_movies')}: {movies.length}</p>
        </div>

        <div className="flex gap-2 w-full md:w-auto mt-2 md:mt-0 items-center">
          {/* Search */}
          {!selectMode && (
            <div className="relative group flex-1 sm:w-64 sm:flex-none">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-red-500 transition-colors" size={18} />
              <input
                type="text"
                placeholder={t('movies.search_placeholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-900/80 border border-slate-700/80 rounded-xl md:rounded-2xl pl-10 pr-4 py-2.5 md:py-3 text-sm md:text-base text-white focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 transition-all shadow-inner font-medium placeholder:text-slate-500"
              />
            </div>
          )}

          {/* Sort */}
          {!selectMode && (
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-slate-900/80 border border-slate-700/80 rounded-xl md:rounded-2xl px-3 py-2.5 md:py-3 text-sm md:text-base text-white focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 appearance-none font-bold shadow-inner cursor-pointer transition-all"
            >
              <option value="date_desc">{t('movies.sort_date_desc')}</option>
              <option value="date_asc">{t('movies.sort_date_asc')}</option>
              <option value="score_desc">{t('movies.sort_score_desc')}</option>
              <option value="score_asc">{t('movies.sort_score_asc')}</option>
              <option value="year_desc">{t('movies.sort_year_desc')}</option>
              <option value="year_asc">{t('movies.sort_year_asc')}</option>
            </select>
          )}

          {/* Select mode label */}
          {selectMode && (
            <div className="flex-1 flex items-center gap-2">
              <button
                onClick={toggleSelectAll}
                className="flex items-center gap-2 text-sm font-bold text-slate-300 hover:text-white transition-colors px-3 py-2.5 rounded-xl hover:bg-slate-800 active:scale-95"
              >
                {allSelected
                  ? <CheckSquare size={18} className="text-red-400" />
                  : <Square size={18} />
                }
                {allSelected
                  ? (language === 'th' ? 'ยกเลิกทั้งหมด' : 'Deselect All')
                  : (language === 'th' ? 'เลือกทั้งหมด' : 'Select All')}
              </button>
              {selected.size > 0 && (
                <span className="text-xs font-black text-red-400 bg-red-500/10 border border-red-500/20 px-2.5 py-1 rounded-full">
                  {selected.size} {language === 'th' ? 'เรื่อง' : 'selected'}
                </span>
              )}
            </div>
          )}

          {/* Select / Cancel button */}
          <button
            onClick={() => selectMode ? exitSelectMode() : setSelectMode(true)}
            className={`flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl font-bold text-sm transition-all active:scale-95 shrink-0 ${
              selectMode
                ? 'bg-slate-700 hover:bg-slate-600 text-white'
                : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/80'
            }`}
          >
            {selectMode ? <X size={17} /> : <CheckSquare size={17} />}
            {selectMode
              ? (language === 'th' ? 'ยกเลิก' : 'Cancel')
              : (language === 'th' ? 'เลือก' : 'Select')}
          </button>
        </div>
      </header>

      {/* Movie Grid */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="animate-spin text-red-600" size={40} />
        </div>
      ) : filteredMovies.length === 0 ? (
        <div className="flex justify-center mt-20">
          <div className="bg-slate-900/50 backdrop-blur-md rounded-3xl p-8 border border-slate-800 text-center max-w-md">
            <FilterX className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">{t('movies.no_results')}</h3>
            <button
              onClick={() => { setSearchQuery(''); setSortBy('date_desc'); }}
              className="mt-4 px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold transition-all active:scale-95 text-sm"
            >
              {t('movies.clear_search')}
            </button>
          </div>
        </div>
      ) : (
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          style={{ pointerEvents: 'none' }}
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-5"
        >
          {filteredMovies.map((movie) => (
            <div key={movie.id} style={{ pointerEvents: 'auto' }} className="relative">
              {/* Selection overlay */}
              {selectMode && (
                <button
                  onClick={() => toggleSelect(movie.id)}
                  className="absolute inset-0 z-20 rounded-2xl transition-all duration-200"
                  style={{ background: selected.has(movie.id) ? 'rgba(239,68,68,0.15)' : 'transparent' }}
                >
                  <div className={`absolute top-2 left-2 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-200 shadow-lg ${
                    selected.has(movie.id)
                      ? 'bg-red-500 border-red-500'
                      : 'bg-black/40 border-white/60 backdrop-blur-sm'
                  }`}>
                    {selected.has(movie.id) && (
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </div>
                  {selected.has(movie.id) && (
                    <div className="absolute inset-0 rounded-2xl ring-2 ring-red-500" />
                  )}
                </button>
              )}
              <MovieCard movie={movie} onDelete={() => loadMovies()} />
            </div>
          ))}
        </motion.div>
      )}

      {/* Floating delete bar */}
      <AnimatePresence>
        {selectMode && selected.size > 0 && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            className="fixed bottom-24 md:bottom-6 left-1/2 -translate-x-1/2 z-50"
          >
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="flex items-center gap-2.5 px-6 py-3.5 bg-red-600 hover:bg-red-500 text-white font-black rounded-2xl shadow-2xl shadow-red-900/50 active:scale-95 transition-all text-sm"
            >
              <Trash2 size={18} />
              {language === 'th' ? `ลบ ${selected.size} เรื่อง` : `Delete ${selected.size} movie${selected.size > 1 ? 's' : ''}`}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete confirm modal */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-6"
            onClick={() => !isDeleting && setShowDeleteConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              transition={{ type: 'spring', damping: 28, stiffness: 320 }}
              className="bg-[#111] border border-red-900/30 rounded-3xl w-full max-w-xs shadow-2xl shadow-black/60 p-6"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex justify-center mb-4">
                <div className="w-14 h-14 rounded-full bg-red-900/40 border border-red-800/50 flex items-center justify-center">
                  <AlertTriangle size={26} className="text-red-500" />
                </div>
              </div>
              <h2 className="text-lg font-black text-white text-center mb-2">
                {language === 'th' ? `ลบ ${selected.size} เรื่อง?` : `Delete ${selected.size} movie${selected.size > 1 ? 's' : ''}?`}
              </h2>
              <p className="text-slate-400 text-sm text-center leading-relaxed mb-6">
                {language === 'th' ? 'ภาพยนตร์ที่เลือกและคะแนนทั้งหมดจะถูกลบถาวร' : 'Selected movies and all their ratings will be permanently deleted.'}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={isDeleting}
                  className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm rounded-2xl transition-all active:scale-95 disabled:opacity-50"
                >
                  {language === 'th' ? 'ยกเลิก' : 'Cancel'}
                </button>
                <button
                  onClick={handleDeleteSelected}
                  disabled={isDeleting}
                  className="flex-1 py-3 bg-red-600 hover:bg-red-500 text-white font-black text-sm rounded-2xl transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isDeleting ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
                  {language === 'th' ? 'ลบทั้งหมด' : 'Delete All'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
