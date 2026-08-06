import React, { useState, useEffect, useMemo } from 'react';
import { Search, Loader2, FilterX } from 'lucide-react';
import { dbService } from '../services/dbService';
import type { Movie } from '../types';
import { MovieCard } from '../components/ui/MovieCard';
import { motion } from 'framer-motion';
import { staggerContainer } from '../utils/animations';
import { useLanguage } from '../contexts/LanguageContext';

export const Movies: React.FC = () => {
  const { t } = useLanguage();
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('date_desc');

  useEffect(() => {
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
    loadMovies();
  }, []);

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

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto w-full pb-32 animate-in fade-in duration-500">
      <header className="mb-6 md:mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-5xl font-black text-slate-50 tracking-tight leading-tight mb-2 drop-shadow-md">{t('movies.title')}</h1>
          <p className="text-sm md:text-base text-slate-400 font-medium">{t('dashboard.total_movies')}: {movies.length}</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto mt-2 md:mt-0">
          <div className="relative group w-full sm:w-64">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-red-500 transition-colors" size={18} />
            <input
              type="text"
              placeholder={t('movies.search_placeholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900/80 border border-slate-700/80 rounded-xl md:rounded-2xl pl-10 pr-4 py-2.5 md:py-3 text-sm md:text-base text-white focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 transition-all shadow-inner font-medium placeholder:text-slate-500"
            />
          </div>
          
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="w-full sm:w-auto bg-slate-900/80 border border-slate-700/80 rounded-xl md:rounded-2xl px-4 py-2.5 md:py-3 text-sm md:text-base text-white focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 appearance-none font-bold shadow-inner cursor-pointer transition-all"
          >
            <option value="date_desc">{t('movies.sort_date_desc')}</option>
            <option value="date_asc">{t('movies.sort_date_asc')}</option>
            <option value="score_desc">{t('movies.sort_score_desc')}</option>
            <option value="score_asc">{t('movies.sort_score_asc')}</option>
            <option value="year_desc">{t('movies.sort_year_desc')}</option>
            <option value="year_asc">{t('movies.sort_year_asc')}</option>
          </select>
        </div>
      </header>

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
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6"
        >
          {filteredMovies.map((movie) => (
            <MovieCard key={movie.id} movie={movie} />
          ))}
        </motion.div>
      )}
    </div>
  );
};
