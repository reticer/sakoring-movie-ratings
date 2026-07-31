import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, PlusCircle, Film, Loader2 } from 'lucide-react';
import { dbService } from '../services/dbService';
import type { Movie } from '../types';
import { MovieCard } from '../components/ui/MovieCard';

export const Movies: React.FC = () => {
  const navigate = useNavigate();
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('created_desc');

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
    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      result = result.filter(m => m.title.toLowerCase().includes(lower) || (m.original_title && m.original_title.toLowerCase().includes(lower)));
    }
    result.sort((a, b) => {
      if (sortBy === 'created_desc') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      if (sortBy === 'created_asc') return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      if (sortBy === 'title_asc') return a.title.localeCompare(b.title);
      if (sortBy === 'score_desc') return (b.average_score || 0) - (a.average_score || 0);
      if (sortBy === 'score_asc') return (a.average_score || 0) - (b.average_score || 0);
      if (sortBy === 'year_desc') return (b.release_year || 0) - (a.release_year || 0);
      return 0;
    });
    return result;
  }, [movies, searchTerm, sortBy]);

  return (
    <div className="min-h-screen p-6 md:p-10 max-w-[1600px] mx-auto space-y-8 animate-in fade-in duration-500">
      
      {/* Header & Sticky Bar */}
      <div className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-xl py-4 border-b border-slate-800/50 flex flex-col md:flex-row md:items-center justify-between gap-4 -mx-6 px-6 md:-mx-10 md:px-10">
        <div>
          <h1 className="text-3xl font-black text-slate-50 tracking-tight">Movie Library</h1>
          <p className="text-slate-400 font-medium text-sm mt-1">Explore {movies.length} rated titles</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input 
              type="text" 
              placeholder="Search movies..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 text-slate-50 rounded-full py-2.5 pl-11 pr-4 focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 transition-all text-sm shadow-inner"
            />
          </div>
          <select 
            value={sortBy} 
            onChange={e => setSortBy(e.target.value)}
            className="bg-slate-900 border border-slate-800 text-slate-50 rounded-full py-2.5 px-4 focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 text-sm cursor-pointer shadow-inner appearance-none"
          >
            <option value="created_desc">Recently Added</option>
            <option value="created_asc">Oldest Added</option>
            <option value="score_desc">Highest Rated</option>
            <option value="score_asc">Lowest Rated</option>
            <option value="title_asc">Title (A-Z)</option>
            <option value="year_desc">Release Year (New-Old)</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="animate-spin text-red-600" size={40} />
        </div>
      ) : filteredMovies.length === 0 ? (
        <div className="text-center py-32 bg-slate-900/30 rounded-2xl border border-slate-800/50">
          <Film size={48} className="text-slate-700 mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-slate-200 mb-2">No movies found</h3>
          <p className="text-slate-500 mb-6">Try adjusting your search or add a new movie to your collection.</p>
          <button 
            onClick={() => navigate('/add-movie')} 
            className="inline-flex items-center justify-center gap-2 bg-red-600 hover:bg-red-500 text-white px-6 py-3 rounded font-bold transition-all active:scale-95 shadow-lg shadow-red-600/20"
          >
            <PlusCircle size={20} /> Add Movie
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
          {filteredMovies.map((movie) => (
            <MovieCard key={movie.id} movie={movie} />
          ))}
        </div>
      )}
    </div>
  );
};
