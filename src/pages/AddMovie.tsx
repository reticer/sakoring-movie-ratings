import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Loader2, Film, ImageOff, ChevronLeft, AlertCircle, Users, CheckCircle2 } from 'lucide-react';
import { dbService } from '../services/dbService';
import type { Person, Movie } from '../types';

export const AddMovie: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedMovie, setSelectedMovie] = useState<Partial<Movie> | null>(null);

  const [people, setPeople] = useState<Person[]>([]);
  const [scores, setScores] = useState<Record<string, string>>({});
  const [comments, setComments] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const TMDB_API_KEY = localStorage.getItem('TMDB_API_KEY') || import.meta.env.VITE_TMDB_API_KEY || 'YOUR_TMDB_API_KEY';

  useEffect(() => {
    if (step === 2) {
      dbService.getPeople().then(setPeople).catch(err => {
        console.error(err);
        setError("Unable to load family members. Please try again.");
      });
    }
  }, [step]);

  const searchMovies = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    if (TMDB_API_KEY === 'YOUR_TMDB_API_KEY') {
      setError("Please configure your TMDB API Key in Settings first.");
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
        setError("No movies found.");
      }
    } catch (err) {
      setError("Error connecting to TMDB API.");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectMovie = async (movie: any) => {
    try {
      const exists = await dbService.checkMovieExistsByTmdbId(movie.id);
      if (exists) {
        setError("This movie already exists in your library.");
        window.scrollTo({ top: 0, behavior: 'smooth' });
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
      setError("Error checking for duplicate movie.");
    }
  };

  const handleScoreChange = (personId: string, val: string) => {
    setScores(prev => ({ ...prev, [personId]: val }));
  };

  const handleCommentChange = (personId: string, val: string) => {
    setComments(prev => ({ ...prev, [personId]: val }));
  };

  const handleSaveMovie = async () => {
    const validScores = Object.entries(scores)
      .filter(([_, val]) => val !== '' && val !== null)
      .map(([personId, val]) => ({ 
        person_id: Number(personId), 
        score: parseFloat(val),
        comment: comments[personId]?.trim() || undefined
      }));

    if (validScores.length === 0) {
      setError("Please provide at least 1 rating.");
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
      setError(err.message || "Error saving movie to database.");
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500 min-h-screen">
      <div className="flex items-center gap-4">
        {step === 2 && (
          <button onClick={() => setStep(1)} className="p-2 hover:bg-slate-800 rounded-full transition-colors active:scale-95 text-slate-400 hover:text-slate-50">
            <ChevronLeft size={24} />
          </button>
        )}
        <div>
          <h1 className="text-3xl font-black text-slate-50 tracking-tight">Add Movie</h1>
          <p className="text-slate-400 font-medium mt-1">{step === 1 ? 'Search the TMDB database' : 'Provide family ratings'}</p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-lg flex items-center gap-3 animate-in slide-in-from-top-2">
          <AlertCircle size={20} className="shrink-0" /> <p className="font-medium">{error}</p>
        </div>
      )}

      {step === 1 ? (
        <div className="space-y-8 animate-in fade-in duration-500">
          <form onSubmit={searchMovies} className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
              <input 
                type="text" 
                placeholder="Type a movie name..." 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-slate-900/60 backdrop-blur-md border border-slate-800/80 text-slate-50 rounded-full py-4 pl-12 pr-4 focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 transition-colors duration-300 ease-out shadow-inner font-medium"
              />
            </div>
            <button type="submit" disabled={loading} className="px-8 py-4 bg-gradient-to-br from-red-500 to-red-700 hover:from-red-400 hover:to-red-600 text-white rounded-full font-bold transition-all duration-300 ease-out active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[140px] shadow-xl shadow-black/50 hover:shadow-2xl">
              {loading ? <Loader2 className="animate-spin" size={20} /> : 'Search'}
            </button>
          </form>

          {searchResults.length === 0 && !loading && !error && (
            <div className="py-24 flex flex-col items-center justify-center text-slate-600 border-2 border-dashed border-slate-800/80 rounded-2xl bg-slate-900/40 backdrop-blur-md">
               <Film size={48} className="mb-4 opacity-50" />
               <p className="font-medium text-lg">Search results will appear here</p>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {searchResults.map(movie => (
              <div key={movie.id} onClick={() => handleSelectMovie(movie)} className="bg-slate-900/60 backdrop-blur-md rounded-2xl border border-slate-800/80 overflow-hidden flex flex-col cursor-pointer hover:border-slate-700/80 hover:bg-slate-800/60 transition-all duration-300 ease-out hover:-translate-y-2 group shadow-xl shadow-black/50">
                <div className="aspect-[2/3] w-full bg-slate-900 overflow-hidden relative">
                  {movie.poster_path ? (
                    <img src={`https://image.tmdb.org/t/p/w300${movie.poster_path}`} alt={movie.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-700"><ImageOff size={32} className="mb-2"/></div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent opacity-80"></div>
                  <div className="absolute bottom-0 left-0 p-4 w-full">
                    <h3 className="font-bold text-slate-50 line-clamp-2 leading-tight">{movie.title || movie.original_title}</h3>
                    <p className="text-sm text-red-500 mt-1 font-bold">{movie.release_date?.substring(0,4) || 'N/A'}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12 animate-in fade-in slide-in-from-right-4 duration-500">
          <div className="md:col-span-4 lg:col-span-3 space-y-4">
            {selectedMovie?.poster_url ? (
               <img src={selectedMovie.poster_url} alt="Poster" className="w-full rounded-2xl shadow-xl shadow-black/50 border border-slate-800/80" />
            ) : (
               <div className="w-full aspect-[2/3] bg-slate-900/60 backdrop-blur-md rounded-2xl border border-slate-800/80 flex flex-col items-center justify-center text-slate-700 shadow-xl"><ImageOff size={48} className="mb-2" /></div>
            )}
            <div className="text-center">
              <h2 className="text-xl font-black text-slate-50 leading-tight">{selectedMovie?.title}</h2>
              <p className="text-slate-400 font-medium">{selectedMovie?.release_year}</p>
            </div>
          </div>

          <div className="md:col-span-8 lg:col-span-9 bg-slate-900/60 backdrop-blur-md rounded-2xl border border-slate-800/80 p-6 sm:p-8 space-y-8 shadow-xl shadow-black/50 transition-all duration-300 ease-out h-fit">
            <h3 className="text-2xl font-bold text-slate-50 border-b border-slate-800 pb-4">Rate this Movie</h3>
            
            {people.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed border-slate-800 rounded-xl bg-slate-900/50">
                <Users size={40} className="mx-auto text-slate-600 mb-4" />
                <p className="text-slate-400 mb-4 font-medium">No family members found.</p>
                <button onClick={() => navigate('/people')} className="text-red-500 hover:text-red-400 font-bold transition-colors">Add Family Members First</button>
              </div>
            ) : (
              <div className="space-y-3">
                {people.map(person => (
                  <div key={person.id} className="flex flex-col gap-3 p-4 bg-slate-900/60 rounded-2xl border border-slate-800/80">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-400">
                          {person.name.substring(0, 2).toUpperCase()}
                        </div>
                        <span className="font-medium text-slate-200">{person.name}</span>
                      </div>
                      <select 
                        value={scores[person.id] || ''}
                        onChange={e => handleScoreChange(person.id.toString(), e.target.value)}
                        className="bg-slate-900 border border-slate-700 text-slate-50 rounded px-4 py-2 focus:outline-none focus:border-red-600 font-medium cursor-pointer"
                      >
                        <option value="">-- Rate --</option>
                        {Array.from({length: 20}, (_, i) => (i + 1) * 0.5).map(val => (
                          <option key={val} value={val}>{val.toFixed(1)}</option>
                        ))}
                      </select>
                    </div>
                    {scores[person.id] && (
                      <textarea
                        value={comments[person.id] || ''}
                        onChange={e => handleCommentChange(person.id.toString(), e.target.value)}
                        placeholder={`Optional review for ${person.name}...`}
                        rows={2}
                        className="w-full bg-slate-800/40 border border-slate-700/60 text-slate-300 rounded-xl px-4 py-3 focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 shadow-inner transition-colors resize-none text-sm placeholder:text-slate-500"
                      />
                    )}
                  </div>
                ))}
              </div>
            )}
            
            <div className="pt-6 border-t border-slate-800">
              <button 
                onClick={handleSaveMovie}
                disabled={submitting || people.length === 0}
                className="w-full py-4 bg-gradient-to-br from-red-500 to-red-700 hover:from-red-400 hover:to-red-600 text-white font-bold rounded-2xl transition-all duration-300 ease-out active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-xl shadow-black/50 hover:shadow-2xl"
              >
                {submitting ? <Loader2 className="animate-spin" size={20} /> : <CheckCircle2 size={20} />}
                {submitting ? 'Saving to Database...' : 'Save Movie & Ratings'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
