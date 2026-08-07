import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Loader2, Film, ImageOff, ChevronLeft, AlertCircle, PlusCircle, Users, CheckCircle2, Star } from 'lucide-react';
import { dbService } from '../services/dbService';
import type { Person, Movie } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { scaleIn } from '../utils/animations';
import { useLanguage } from '../contexts/LanguageContext';

export const AddMovie: React.FC = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedMovie, setSelectedMovie] = useState<Partial<Movie> | null>(null);
  const [addingId, setAddingId] = useState<number | null>(null);

  const [people, setPeople] = useState<Person[]>([]);
  const [scores, setScores] = useState<Record<string, string>>({});
  const [comments, setComments] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const TMDB_API_KEY = localStorage.getItem('TMDB_API_KEY') || import.meta.env.VITE_TMDB_API_KEY || 'YOUR_TMDB_API_KEY';

  useEffect(() => {
    if (step === 2) {
      dbService.getPeople().then(setPeople).catch(err => {
        console.error(err);
        setError(t('error.load_people'));
      });
    }
  }, [step, t]);

  const searchMovies = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    if (TMDB_API_KEY === 'YOUR_TMDB_API_KEY') {
      setError('TMDB API key not configured');
      return;
    }
    
    setLoading(true);
    setError('');
    setSearchResults([]);

    try {
      const res = await fetch(`https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(searchQuery)}&language=en-US`);
      const data = await res.json();
      if (data.results && data.results.length > 0) {
        setSearchResults(data.results);
      } else {
        setError(t('add_movie.no_results'));
      }
    } catch (err) {
      setError(t('error.connection'));
    } finally {
      setLoading(false);
    }
  };

  const handleAddMovie = async (movie: any) => {
    setAddingId(movie.id);
    try {
      const exists = await dbService.checkMovieExistsByTmdbId(movie.id);
      if (exists) {
        setError(t('add_movie.already_exists'));
        setAddingId(null);
        return;
      }
      setSelectedMovie({
        tmdb_id: movie.id,
        title: movie.title || movie.original_title,
        original_title: movie.original_title,
        release_year: movie.release_date ? parseInt(movie.release_date.substring(0, 4)) : undefined,
        poster_url: movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : undefined,
        overview: movie.overview
      });
      setStep(2);
      setError('');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setError(t('error.generic'));
    } finally {
      setAddingId(null);
    }
  };

  const handleScoreChange = (personId: string, val: string) => {
    setScores(prev => ({ ...prev, [personId]: val }));
  };

  const handleCommentChange = (personId: string, val: string) => {
    setComments(prev => ({ ...prev, [personId]: val }));
  };

  const validateAndShowConfirm = () => {
    const validScores = Object.entries(scores)
      .filter(([_, val]) => val !== '' && val !== null);
      
    if (validScores.length === 0) {
      setError(t('add_movie.min_rating'));
      return;
    }
    
    setError('');
    setShowConfirmModal(true);
  };

  const handleSaveMovie = async () => {
    setShowConfirmModal(false);
    
    const validScores = Object.entries(scores)
      .filter(([_, val]) => val !== '' && val !== null)
      .map(([personId, val]) => ({ 
        person_id: Number(personId), 
        score: parseFloat(val),
        comment: comments[personId]?.trim() || undefined
      }));

    if (validScores.length === 0) {
      setError(t('add_movie.min_rating'));
      return;
    }

    setSubmitting(true);
    setError('');

    const sum = validScores.reduce((acc, curr) => acc + curr.score, 0);
    const average = parseFloat((sum / validScores.length).toFixed(2));

    try {
      await dbService.addMovieWithScores({ ...selectedMovie, average_score: average }, validScores);
      navigate('/movies');
    } catch (err: any) {
      setError(err.message || t('error.save_movie'));
      setSubmitting(false);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto w-full pb-32 animate-in fade-in duration-500">
      <header className="mb-8 md:mb-10 text-center flex flex-col justify-center items-center">
        <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mb-6 shadow-inner">
          <Film size={32} />
        </div>
        <h1 className="text-3xl md:text-5xl font-black text-slate-50 tracking-tight leading-tight mb-3 drop-shadow-md">{t('add_movie.title')}</h1>
        <p className="text-sm md:text-lg text-slate-400 font-medium max-w-xl leading-relaxed">{step === 1 ? t('add_movie.desc') : t('add_movie.rating_desc')}</p>
      </header>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-5 rounded-2xl mb-8 flex items-center gap-4 shadow-sm animate-in slide-in-from-top-4">
          <AlertCircle size={24} className="shrink-0" />
          <p className="font-bold">{error === 'TMDB API key not configured' ? t('add_movie.tmdb_error') : error}</p>
        </div>
      )}

      {step === 1 ? (
        <div className="space-y-8">
          <form onSubmit={searchMovies} className="mb-12 max-w-2xl mx-auto">
            <div className="relative group flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-red-500 transition-colors" size={20} />
                <input 
                  type="text" 
                  placeholder={t('add_movie.search_placeholder')}
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-900/80 border border-slate-700/80 rounded-2xl pl-12 pr-4 py-4 text-base md:text-lg text-white focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 transition-all shadow-inner font-medium placeholder:text-slate-500"
                />
              </div>
              <button type="submit" disabled={loading} className="w-full sm:w-auto bg-gradient-to-br from-red-500 to-red-700 hover:from-red-400 hover:to-red-600 text-white px-8 py-4 rounded-2xl font-black transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 shadow-xl shadow-red-900/20 hover:shadow-2xl hover:-translate-y-1">
                {loading ? <Loader2 size={20} className="animate-spin" /> : <Search size={20} />}
                <span className="sm:hidden">{t('add_movie.search_btn')}</span>
              </button>
            </div>
          </form>

          {searchResults.length === 0 && !loading && (
            <div className="text-center py-20 bg-slate-900/50 backdrop-blur-md rounded-3xl border border-slate-800">
              <Film size={48} className="text-slate-700 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white">{t('add_movie.no_results')}</h3>
            </div>
          )}

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {searchResults.map((movie, index) => (
              <div key={movie.id} className="bg-slate-900/60 backdrop-blur-md rounded-2xl border border-slate-800/80 p-3 group hover:border-slate-700 transition-all animate-card" style={{ animationDelay: `${(index % 20) * 50}ms` }}>
                <div className="aspect-[2/3] w-full bg-slate-950 rounded-xl overflow-hidden mb-3 relative">
                  {movie.poster_path ? (
                    <img src={`https://image.tmdb.org/t/p/w300${movie.poster_path}`} alt={movie.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-700"><ImageOff size={32}/></div>
                  )}
                </div>
                <h3 className="font-bold text-slate-200 line-clamp-1 mb-1">{movie.title}</h3>
                <p className="text-sm text-slate-500 mb-4">{movie.release_date?.substring(0,4)}</p>
                <button
                  onClick={() => handleAddMovie(movie)}
                  disabled={addingId === movie.id}
                  className="w-full py-3 font-bold rounded-xl transition-all active:scale-95 flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-white border border-slate-700"
                >
                  {addingId === movie.id ? <Loader2 size={18} className="animate-spin" /> : <PlusCircle size={18} />}
                  {t('add_movie.add_to_library')}
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12 animate-in fade-in slide-in-from-right-4 duration-500">
          <div className="md:col-span-4 lg:col-span-3 space-y-4">
             <button onClick={() => setStep(1)} className="text-slate-400 hover:text-white flex items-center gap-2 mb-4">
                <ChevronLeft size={20} /> {t('common.back')}
             </button>
             <div className="flex flex-row md:flex-col items-center md:items-start gap-6 md:gap-4">
               <div className="w-28 sm:w-40 md:w-full shrink-0">
                 {selectedMovie?.poster_url ? (
                    <img src={selectedMovie.poster_url} alt="Poster" className="w-full rounded-2xl shadow-xl shadow-black/50 border border-slate-800/80" />
                 ) : (
                    <div className="w-full aspect-[2/3] bg-slate-900/60 backdrop-blur-md rounded-2xl border border-slate-800/80 flex items-center justify-center text-slate-700 shadow-xl"><ImageOff size={48} /></div>
                 )}
               </div>
               <div className="text-left md:text-center flex-1">
                 <h2 className="text-xl sm:text-2xl md:text-xl lg:text-2xl font-black text-slate-50 leading-tight mb-1">{selectedMovie?.title}</h2>
                 <p className="text-slate-400 font-medium">{selectedMovie?.release_year}</p>
               </div>
             </div>
          </div>

          <div className="md:col-span-8 lg:col-span-9 bg-slate-900/60 backdrop-blur-md rounded-2xl border border-slate-800/80 p-6 sm:p-8 space-y-8 shadow-xl shadow-black/50 h-fit">
            <h3 className="text-2xl font-bold text-slate-50 border-b border-slate-800 pb-4">{t('add_movie.rate_title')}</h3>
            
            {people.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed border-slate-800 rounded-xl bg-slate-900/50">
                <Users size={40} className="mx-auto text-slate-600 mb-4" />
                <p className="text-slate-400 mb-4 font-medium">{t('add_movie.no_people')}</p>
                <button onClick={() => navigate('/people')} className="text-red-500 hover:text-red-400 font-bold transition-colors">{t('add_movie.add_people_link')}</button>
              </div>
            ) : (
              <div className="divide-y divide-slate-800/60 bg-slate-900/40 rounded-2xl border border-slate-800/60 overflow-hidden">
                {people.map(person => (
                  <div key={person.id} className="p-3 sm:p-4 flex flex-col transition-colors hover:bg-slate-800/20">
                    <div className="flex flex-row items-center justify-between gap-3">
                      <div className="flex items-center gap-3 truncate">
                        <div className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700/50 flex items-center justify-center text-xs font-bold text-slate-300 shadow-sm shrink-0">
                          {person.name.substring(0, 2).toUpperCase()}
                        </div>
                        <span className="font-bold text-slate-100 text-sm sm:text-base truncate">{person.name}</span>
                      </div>
                      <div className="w-[110px] sm:w-[140px] shrink-0">
                        <select 
                          value={scores[person.id] || ''}
                          onChange={e => handleScoreChange(person.id.toString(), e.target.value)}
                          className="w-full bg-slate-950 border border-slate-700/80 text-white rounded-lg px-2 sm:px-3 py-2 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 font-bold shadow-sm transition-all text-xs sm:text-sm cursor-pointer appearance-none"
                          style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2394a3b8'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.5rem center', backgroundSize: '1rem' }}
                        >
                          <option value="">{t('add_movie.rate_placeholder')}</option>
                          {Array.from({length: 20}, (_, i) => 10.0 - (i * 0.5)).map(val => (
                            <option key={val} value={val}>{val.toFixed(1)}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    {scores[person.id] && (
                      <div className="ml-12 mt-2 pr-1">
                        <input
                          type="text"
                          value={comments[person.id] || ''}
                          onChange={e => handleCommentChange(person.id.toString(), e.target.value)}
                          placeholder={t('add_movie.comment_placeholder')}
                          className="w-full bg-transparent border-b border-slate-700/60 text-slate-300 px-1 py-1.5 focus:outline-none focus:border-red-500 transition-colors text-xs sm:text-sm placeholder:text-slate-600"
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
            
            <div className="pt-6 border-t border-slate-800">
              <button 
                onClick={validateAndShowConfirm}
                disabled={submitting || people.length === 0}
                className="w-full py-4 bg-gradient-to-br from-red-500 to-red-700 hover:from-red-400 hover:to-red-600 text-white font-bold rounded-2xl transition-all duration-300 ease-out active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-xl shadow-black/50 hover:shadow-2xl"
              >
                {submitting ? <Loader2 className="animate-spin" size={20} /> : <CheckCircle2 size={20} />}
                {submitting ? t('add_movie.saving_btn') : t('add_movie.save_btn')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Score confirm modal */}
      <AnimatePresence>
        {showConfirmModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4 sm:p-6"
            onClick={() => setShowConfirmModal(false)}
          >
            <motion.div
              variants={scaleIn}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="bg-slate-900 border border-white/10 rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              <div className="p-6 flex flex-col items-center text-center">
                <div className="w-14 h-14 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500 mb-4 border border-amber-500/20">
                  <Star size={26} className="fill-current" />
                </div>
                <h2 className="text-lg font-black text-white mb-1">{t('movie_detail.confirm_score_title')}</h2>
                <div className="text-slate-400 text-sm mb-6 flex flex-wrap gap-2 justify-center">
                  {Object.entries(scores)
                    .filter(([_, val]) => val !== '' && val !== null)
                    .map(([personId, val], idx, arr) => {
                      const person = people.find(p => String(p.id) === personId);
                      return (
                        <span key={personId}>
                          {person?.name} <span className="text-white font-bold">{val}/10</span>
                          {idx < arr.length - 1 && ', '}
                        </span>
                      );
                    })}
                </div>
              </div>
              <div className="p-6 pt-0 flex gap-3 w-full">
                <button
                  onClick={() => setShowConfirmModal(false)}
                  className="flex-1 py-3.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm rounded-xl transition-all active:scale-95 border border-slate-700/50"
                >
                  {t('common.cancel')}
                </button>
                <button
                  onClick={handleSaveMovie}
                  className="flex-1 py-3.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm rounded-xl transition-all active:scale-95 shadow-lg shadow-amber-500/20"
                >
                  {t('movie_detail.confirm')}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
