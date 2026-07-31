import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AlertCircle, ChevronLeft, ImageOff, Trash2, Edit3, Loader2, Star } from 'lucide-react';
import { dbService } from '../services/dbService';
import type { Movie } from '../types';

export const MovieDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [movie, setMovie] = useState<Movie | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [isEditingScore, setIsEditingScore] = useState(false);
  const [editScores, setEditScores] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (id) {
      loadMovieData(Number(id));
    }
  }, [id]);

  const loadMovieData = async (movieId: number) => {
    try {
      setLoading(true);
      const data = await dbService.getMovieById(movieId);
      setMovie(data);
      
      const scoreMap: Record<string, string> = {};
      data.scoreList?.forEach(s => { scoreMap[s.person_id] = String(s.score); });
      setEditScores(scoreMap);
    } catch (err) {
      setError("Failed to load movie details.");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveScores = async () => {
    if (!movie || !id) return;
    try {
      setIsSaving(true);
      const validScores = Object.entries(editScores)
        .filter(([_, val]) => val !== '' && val !== null)
        .map(([pId, val]) => ({ person_id: Number(pId), score: parseFloat(val) }));

      if (validScores.length === 0) {
         setError("Please provide at least 1 score.");
         setIsSaving(false);
         return;
      }

      if (movie.scoreList) {
        for (const old of movie.scoreList) {
          const stillExists = validScores.find(v => v.person_id === old.person_id);
          if (!stillExists) await dbService.deleteScore(old.id);
        }
        for (const current of validScores) {
          const old = movie.scoreList.find(s => s.person_id === current.person_id);
          if (old) {
            if (old.score !== current.score) await dbService.updateScore(old.id, current.score);
          } else {
            await dbService.addScore({ movie_id: Number(id), person_id: current.person_id, score: current.score });
          }
        }
      }

      const sum = validScores.reduce((acc, curr) => acc + curr.score, 0);
      const newAvg = parseFloat((sum / validScores.length).toFixed(2));
      await dbService.updateMovieDetails(Number(id), { average_score: newAvg });

      await loadMovieData(Number(id));
      setIsEditingScore(false);
      setError('');
    } catch (err: any) {
      setError("Error saving scores: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!movie) return;
    try {
      setIsDeleting(true);
      await dbService.deleteMovie(movie.id);
      navigate('/movies');
    } catch (err) {
      setError("Failed to delete movie.");
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900">
      <Loader2 className="animate-spin text-red-600" size={56} />
    </div>
  );

  if (error && !movie) return (
    <div className="p-10 max-w-lg mx-auto text-center mt-32 bg-slate-900/60 backdrop-blur-md rounded-2xl border border-slate-800/80 shadow-xl shadow-black/50 transition-all duration-300">
      <AlertCircle size={56} className="mx-auto text-red-500 mb-6 drop-shadow-md" />
      <h3 className="text-3xl font-black text-slate-50 mb-3 tracking-tighter">Error</h3>
      <p className="text-slate-400 mb-8 font-medium text-lg">{error}</p>
      <button onClick={() => navigate('/movies')} className="bg-slate-800/60 hover:bg-slate-700/80 text-white px-8 py-4 rounded-2xl font-black transition-all duration-300 ease-out active:scale-95 border border-slate-700/50 shadow-xl hover:-translate-y-1">Return to Library</button>
    </div>
  );

  if (!movie) return null;

  const bgImage = movie.poster_url?.replace('w500', 'original') || movie.poster_url;

  return (
    <div className="relative min-h-screen bg-slate-900 pb-24">
      {/* Immersive Background */}
      <div className="absolute top-0 left-0 right-0 h-[60vh] z-0 overflow-hidden">
        {bgImage && (
          <img src={bgImage} alt="Backdrop" className="w-full h-full object-cover opacity-30 blur-2xl scale-110" />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-slate-900/90 to-slate-900"></div>
      </div>

      <div className="relative z-10 p-6 md:p-10 max-w-7xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-1000 ease-[cubic-bezier(0.25,1,0.5,1)]">
        
        {/* Navigation */}
        <button onClick={() => navigate('/movies')} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors w-fit group font-bold tracking-wide">
          <ChevronLeft size={24} className="group-hover:-translate-x-1 transition-transform duration-300 ease-out" /> BACK TO LIBRARY
        </button>

        {error && isEditingScore && (
          <div className="p-5 bg-red-500/10 border border-red-500/20 text-red-500 rounded-2xl flex items-center gap-3">
            <AlertCircle size={24} className="shrink-0" /> <p className="font-bold">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 md:gap-16 pt-4">
          
          {/* Left: Poster */}
          <div className="md:col-span-4 lg:col-span-3 flex justify-center md:justify-start">
            {movie.poster_url ? (
              <img src={movie.poster_url} alt={movie.title} className="w-full max-w-sm rounded-2xl shadow-xl shadow-black/50 border border-slate-800/80 transition-all duration-300 hover:-translate-y-1" />
            ) : (
              <div className="w-full max-w-sm aspect-[2/3] bg-slate-900/60 backdrop-blur-md rounded-2xl flex flex-col items-center justify-center border border-slate-800/80 text-slate-700 shadow-xl shadow-black/50">
                <ImageOff size={56} className="mb-4"/>
                <span className="font-black tracking-widest uppercase text-sm">No Poster</span>
              </div>
            )}
          </div>

          {/* Right: Info & Scores */}
          <div className="md:col-span-8 lg:col-span-9 space-y-10">
            <div>
              <h1 className="text-5xl md:text-7xl font-black text-slate-50 mb-3 leading-none tracking-tighter drop-shadow-2xl">{movie.title}</h1>
              <div className="flex items-center gap-4 text-slate-300 font-bold text-lg">
                {movie.release_year && <span className="px-4 py-1.5 bg-slate-900/60 backdrop-blur-md rounded-2xl border border-slate-800/80 drop-shadow-sm">{movie.release_year}</span>}
              </div>
            </div>

            {/* Massive Score Block */}
            <div className="flex items-center gap-6 bg-slate-900/60 backdrop-blur-md border border-slate-800/80 p-8 rounded-2xl w-fit shadow-xl shadow-black/50 transition-all duration-300 ease-out hover:-translate-y-1 hover:border-slate-700/80">
               <div className="flex flex-col">
                 <span className="text-slate-500 text-sm mb-2 uppercase tracking-widest font-black">Family Average</span>
                 <div className="flex items-end gap-3 text-amber-400">
                   <Star fill="currentColor" size={64} className="drop-shadow-[0_0_20px_rgba(251,191,36,0.4)]" />
                   <span className="text-8xl font-black leading-none tracking-tighter drop-shadow-md">{movie.average_score?.toFixed(1) || '0.0'}</span>
                   <span className="text-3xl text-slate-500 mb-2 font-black">/10</span>
                 </div>
               </div>
            </div>

            <div>
               <p className="text-slate-300 leading-relaxed text-xl max-w-4xl font-medium drop-shadow-md">
                 {movie.overview || 'No overview available for this movie.'}
               </p>
            </div>

            {/* Family Ratings Grid */}
            <div className="pt-10">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
                 <h3 className="text-3xl font-black text-slate-50 tracking-tighter">Family Ratings</h3>
                 {!isEditingScore ? (
                   <button onClick={() => setIsEditingScore(true)} className="flex items-center gap-2 bg-slate-900/60 hover:bg-slate-800/80 text-white px-6 py-4 rounded-2xl font-bold transition-all duration-300 ease-out active:scale-95 border border-slate-800/80 shadow-xl shadow-black/50 hover:-translate-y-1 w-fit">
                     <Edit3 size={18}/> Edit Scores
                   </button>
                 ) : (
                   <div className="flex gap-3">
                     <button onClick={() => setIsEditingScore(false)} className="text-slate-400 hover:text-white px-6 py-4 transition-colors font-bold rounded-2xl">Cancel</button>
                     <button onClick={handleSaveScores} disabled={isSaving} className="flex items-center gap-2 bg-gradient-to-br from-red-500 to-red-700 hover:from-red-400 hover:to-red-600 text-white px-8 py-4 rounded-2xl font-black transition-all duration-300 ease-out active:scale-95 disabled:opacity-50 shadow-xl shadow-black/50 hover:shadow-2xl hover:-translate-y-1">
                       {isSaving ? <Loader2 size={20} className="animate-spin"/> : null}
                       Save Ratings
                     </button>
                   </div>
                 )}
              </div>

              {!isEditingScore ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
                  {(!movie.scoreList || movie.scoreList.length === 0) && (
                    <div className="col-span-full py-12 text-slate-600 text-center border-2 border-dashed border-slate-800 rounded-2xl font-bold text-lg">No ratings yet.</div>
                  )}
                  {movie.scoreList?.map(score => {
                    let borderCol = 'border-amber-400/30';
                    let textCol = 'text-amber-400';
                    let bgCol = 'bg-amber-400/10';
                    if (score.score < 5) { borderCol = 'border-red-500/30'; textCol = 'text-red-500'; bgCol = 'bg-red-500/10'; }
                    else if (score.score < 8) { borderCol = 'border-slate-300/30'; textCol = 'text-slate-300'; bgCol = 'bg-slate-300/10'; }

                    return (
                      <div key={score.id} className="bg-slate-900/60 backdrop-blur-md rounded-2xl p-6 flex flex-col items-center justify-center border border-slate-800/80 hover:border-slate-700/80 transition-all duration-300 ease-out shadow-xl shadow-black/50 hover:-translate-y-2 group">
                        <div className={`w-20 h-20 rounded-2xl flex items-center justify-center text-3xl font-black mb-4 shadow-inner transition-colors duration-300 ${borderCol} ${textCol} ${bgCol}`}>
                          {score.people?.name?.substring(0,2).toUpperCase()}
                        </div>
                        <span className="text-slate-50 font-bold text-lg text-center line-clamp-1 mb-2 group-hover:text-white transition-colors">{score.people?.name}</span>
                        <div className={`flex items-center gap-1.5 font-black text-2xl transition-colors duration-300 ${textCol}`}>
                          <Star size={24} className="fill-current drop-shadow-md" />
                          {score.score.toFixed(1)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 bg-slate-900/60 backdrop-blur-md p-8 rounded-2xl border border-slate-800/80 shadow-xl shadow-black/50">
                  {movie.scoreList?.map(score => (
                    <div key={score.id} className="flex items-center justify-between p-5 bg-slate-900/60 rounded-2xl border border-slate-800/80 transition-all duration-300 hover:border-slate-700/80">
                      <span className="text-slate-50 font-bold">{score.people?.name || 'Unknown'}</span>
                      <select 
                        value={editScores[score.person_id] || ''}
                        onChange={e => setEditScores(prev => ({ ...prev, [score.person_id]: e.target.value }))}
                        className="bg-slate-800/60 border border-slate-700/80 text-white rounded-xl px-4 py-2 focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 cursor-pointer font-bold shadow-inner transition-colors"
                      >
                        <option value="">Remove</option>
                        {Array.from({length: 20}, (_, i) => (i + 1) * 0.5).map(val => (
                          <option key={val} value={val}>{val.toFixed(1)}</option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Bottom Action Bar for Delete */}
      <div className="fixed bottom-16 md:bottom-0 left-0 md:left-64 right-0 bg-slate-900/60 backdrop-blur-md border-t border-slate-800/80 p-4 flex justify-end px-6 md:px-10 z-40 shadow-[0_-10px_30px_rgba(0,0,0,0.5)]">
        <button onClick={() => setShowDeleteConfirm(true)} className="flex items-center gap-2 text-sm text-slate-500 hover:text-red-500 font-bold transition-all duration-300 ease-out p-2 rounded-xl hover:bg-red-500/10">
          <Trash2 size={18}/> DELETE MOVIE
        </button>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-in fade-in zoom-in-95 duration-300">
          <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-10 max-w-md w-full shadow-2xl shadow-black/80">
            <h3 className="text-3xl font-black text-white mb-3 tracking-tighter">Delete Movie?</h3>
            <p className="text-slate-400 mb-10 text-lg leading-relaxed font-medium">This will permanently remove <span className="text-white font-black">{movie.title}</span> and all associated family ratings from the database.</p>
            <div className="flex gap-4">
              <button onClick={() => setShowDeleteConfirm(false)} disabled={isDeleting} className="flex-1 px-4 py-4 bg-slate-800/60 hover:bg-slate-700/80 text-white rounded-2xl font-bold transition-all duration-300 ease-out border border-slate-700/50 shadow-xl hover:-translate-y-1">Cancel</button>
              <button onClick={confirmDelete} disabled={isDeleting} className="flex-1 flex items-center justify-center gap-2 px-4 py-4 bg-gradient-to-br from-red-500 to-red-700 hover:from-red-400 hover:to-red-600 text-white rounded-2xl font-black transition-all duration-300 ease-out shadow-xl shadow-black/50 hover:shadow-2xl hover:-translate-y-1">
                {isDeleting ? <Loader2 className="animate-spin" size={20} /> : null}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
