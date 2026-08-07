import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AlertCircle, ChevronLeft, ImageOff, Trash2, PlusCircle, Loader2, Star, AlertTriangle, CheckCircle } from 'lucide-react';
import { dbService } from '../services/dbService';
import type { Movie, Person } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { springUp, scaleIn } from '../utils/animations';
import { useLanguage } from '../contexts/LanguageContext';

export const MovieDetail: React.FC = () => {
  const { t } = useLanguage();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [movie, setMovie] = useState<Movie | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [isAddingScore, setIsAddingScore] = useState(false);
  const [people, setPeople] = useState<Person[]>([]);
  const [selectedPersonId, setSelectedPersonId] = useState<string>('');
  const [newScore, setNewScore] = useState<string>('');
  const [newComment, setNewComment] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (id) loadMovieData(Number(id));
  }, [id]);

  const loadMovieData = async (movieId: number) => {
    try {
      setLoading(true);
      const [data, allPeople] = await Promise.all([
        dbService.getMovieById(movieId),
        dbService.getPeople()
      ]);
      setMovie(data);
      setPeople(allPeople);
    } catch {
      setError('Failed to load movie details.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddScoreClick = () => {
    if (!movie || !id || !selectedPersonId || !newScore) return;
    setShowConfirmModal(true);
  };

  const executeAddScore = async () => {
    setShowConfirmModal(false);
    try {
      setIsSaving(true);
      const pId = Number(selectedPersonId);
      const scoreVal = parseFloat(newScore);
      await dbService.addScore({
        movie_id: Number(id),
        person_id: pId,
        score: scoreVal,
        comment: newComment.trim() || undefined
      });
      const currentScores = movie?.scoreList?.map(s => s.score) || [];
      const allScores = [...currentScores, scoreVal];
      const newAvg = parseFloat((allScores.reduce((a, b) => a + b, 0) / allScores.length).toFixed(2));
      await dbService.updateMovieDetails(Number(id), { average_score: newAvg });
      await loadMovieData(Number(id));
      setIsAddingScore(false);
      setSelectedPersonId('');
      setNewScore('');
      setNewComment('');
      setError('');
    } catch (err: any) {
      setError('Error adding score: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const unratedPeople = people.filter(p => !movie?.scoreList?.find(s => s.person_id === p.id));

  const handleDeleteMovie = async () => {
    if (!movie) return;
    try {
      setIsDeleting(true);
      await dbService.deleteMovie(movie.id);
      navigate('/movies');
    } catch {
      setError('Failed to delete movie.');
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900">
      <Loader2 className="animate-spin text-red-600" size={56} />
    </div>
  );

  if (error && !movie) return (
    <div className="p-10 max-w-lg mx-auto text-center mt-32">
      <AlertCircle size={56} className="mx-auto text-red-500 mb-6" />
      <h3 className="text-2xl font-black text-white mb-3">Error</h3>
      <p className="text-slate-400 mb-8">{error}</p>
      <button onClick={() => navigate('/movies')} className="bg-slate-800 text-white px-8 py-3 rounded-2xl font-bold">{t('common.back')}</button>
    </div>
  );

  if (!movie) return null;

  const bgImage = movie.poster_url?.replace('w500', 'original') || movie.poster_url;
  const scoreColor = (s: number) => s >= 8 ? 'text-amber-400' : s >= 5 ? 'text-slate-300' : 'text-red-400';
  const scoreBg = (s: number) => s >= 8 ? 'bg-amber-400/10 border-amber-400/30' : s >= 5 ? 'bg-slate-300/10 border-slate-300/30' : 'bg-red-400/10 border-red-400/30';

  return (
    <div className="relative min-h-screen bg-slate-950 pb-32">

      {/* Blurred backdrop */}
      <div className="absolute top-0 left-0 right-0 h-[55vh] z-0 overflow-hidden">
        {bgImage && <img src={bgImage} alt="" className="w-full h-full object-cover opacity-25 blur-3xl scale-110" />}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/40 via-slate-950/80 to-slate-950" />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-5xl mx-auto px-4 md:px-8 pt-4 md:pt-8">

        {/* Back button */}
        <button
          onClick={() => navigate('/movies')}
          className="flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors font-semibold mb-6 group"
        >
          <ChevronLeft size={20} className="group-hover:-translate-x-0.5 transition-transform" />
          {t('common.back')}
        </button>

        {/* === HERO SECTION === */}
        <div className="flex flex-col md:flex-row gap-6 md:gap-10 mb-8">

          {/* Poster */}
          <div className="flex-shrink-0 mx-auto md:mx-0 w-40 md:w-52">
            {movie.poster_url ? (
              <img
                src={movie.poster_url}
                alt={movie.title}
                className="w-full rounded-2xl shadow-2xl shadow-black/70 ring-1 ring-white/10"
              />
            ) : (
              <div className="w-full aspect-[2/3] bg-slate-800 rounded-2xl flex flex-col items-center justify-center text-slate-600 ring-1 ring-white/5">
                <ImageOff size={40} className="mb-2" />
                <span className="text-xs font-bold uppercase tracking-wider">No Poster</span>
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 flex flex-col justify-end text-center md:text-left">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white leading-tight mb-2 drop-shadow-lg">
              {movie.title}
            </h1>

            {movie.release_year && (
              <span className="inline-block text-sm font-bold text-slate-400 bg-slate-800/60 px-3 py-1 rounded-full w-fit mx-auto md:mx-0 mb-4">
                {movie.release_year}
              </span>
            )}

            {/* Score pill */}
            <div className="flex items-center gap-3 justify-center md:justify-start mb-4">
              <div className="flex items-center gap-2 bg-slate-900/80 backdrop-blur-md border border-white/8 rounded-2xl px-5 py-3 shadow-xl">
                <Star size={20} className="text-amber-400 fill-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]" />
                <span className="text-3xl font-black text-white">{movie.average_score?.toFixed(1) || '—'}</span>
                <span className="text-slate-500 font-bold text-sm">/10</span>
              </div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{t('hero.family_score')}</span>
            </div>

            {movie.overview && (
              <p className="text-slate-400 text-sm md:text-base leading-relaxed line-clamp-3 md:line-clamp-none">
                {movie.overview}
              </p>
            )}
          </div>
        </div>

        {/* === RATINGS SECTION === */}
        <div className="bg-slate-900/60 backdrop-blur-xl border border-white/5 rounded-3xl overflow-hidden shadow-2xl shadow-black/50 mb-6">

          {/* Section header */}
          <div className="flex items-center justify-between p-5 border-b border-white/5">
            <h3 className="text-base font-bold text-white">{t('movie_detail.family_ratings')}</h3>
            {unratedPeople.length > 0 && (
              <button
                onClick={() => setIsAddingScore(true)}
                className="flex items-center gap-1.5 text-sm font-bold text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 px-4 py-2 rounded-xl transition-all active:scale-95"
              >
                <PlusCircle size={15} />
                {t('movie_detail.add_rating')}
              </button>
            )}
          </div>

          {/* Remove inline form - now it's a modal */}

          {/* Scores grid */}
          <div className="p-5">
            {(!movie.scoreList || movie.scoreList.length === 0) && (
              <div className="py-12 text-center text-slate-600 font-semibold text-sm">
                {t('movie_detail.no_ratings')}
              </div>
            )}

            <div
              className="grid grid-cols-1 sm:grid-cols-2 gap-3"
            >
              {movie.scoreList?.map((score, index) => (
                <div
                  key={score.id}
                  className="flex items-center gap-4 bg-slate-800/50 hover:bg-slate-800/80 border border-white/5 rounded-2xl px-4 py-3.5 transition-all duration-200 animate-card"
                  style={{ animationDelay: `${(index % 20) * 50}ms` }}
                >
                  {/* Avatar */}
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black border shrink-0 ${scoreBg(score.score)} ${scoreColor(score.score)}`}>
                    {score.people?.name?.substring(0, 2).toUpperCase()}
                  </div>

                  {/* Name + comment */}
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-white text-sm leading-tight">{score.people?.name}</p>
                    {score.comment && (
                      <p className="text-slate-500 text-xs mt-0.5 truncate">"{score.comment}"</p>
                    )}
                  </div>

                  {/* Score badge */}
                  <div className={`flex items-center gap-1 font-black text-base shrink-0 ${scoreColor(score.score)}`}>
                    <Star size={14} className="fill-current" />
                    {score.score.toFixed(1)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Delete button — inline at bottom */}
        <div className="flex justify-center pb-4">
          <button
            onClick={() => setShowDeleteModal(true)}
            className="flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-red-500 transition-colors px-4 py-2.5 rounded-xl hover:bg-red-500/10 active:scale-95"
          >
            <Trash2 size={16} />
            {t('movie_detail.delete_movie')}
          </button>
        </div>
      </div>

      {/* Add Score Modal */}
      <AnimatePresence>
        {isAddingScore && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
            onClick={() => { setIsAddingScore(false); setSelectedPersonId(''); setNewScore(''); setNewComment(''); }}
          >
            <motion.div
              initial={{ y: 80, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 80, opacity: 0 }}
              transition={{ type: 'spring', damping: 28, stiffness: 320 }}
              className="bg-slate-900 border border-white/10 rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-white/5">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-red-500/10 flex items-center justify-center text-red-400">
                    <Star size={16} className="fill-current" />
                  </div>
                  <h3 className="font-black text-white text-base">{t('movie_detail.add_rating')}</h3>
                </div>
                <button
                  onClick={() => { setIsAddingScore(false); setSelectedPersonId(''); setNewScore(''); setNewComment(''); }}
                  className="text-slate-500 hover:text-white w-8 h-8 flex items-center justify-center rounded-xl hover:bg-slate-800 transition-all text-xl font-light"
                >
                  ×
                </button>
              </div>

              {/* Form */}
              <div className="p-5 space-y-3">
                {error && (
                  <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 border border-red-500/20 px-4 py-3 rounded-xl">
                    <AlertCircle size={14} /> {error}
                  </div>
                )}

                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">{t('movie_detail.select_member')}</label>
                  <select
                    value={selectedPersonId}
                    onChange={e => setSelectedPersonId(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700/80 text-white rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-red-500 cursor-pointer transition-colors"
                  >
                    <option value="">{t('movie_detail.select_member')}</option>
                    {unratedPeople.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">{t('movie_detail.select_score')}</label>
                  <select
                    value={newScore}
                    onChange={e => setNewScore(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700/80 text-white rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-red-500 cursor-pointer transition-colors"
                  >
                    <option value="">{t('movie_detail.select_score')}</option>
                    {Array.from({ length: 20 }, (_, i) => 10.0 - i * 0.5).map(val => (
                      <option key={val} value={val}>{val.toFixed(1)}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">{t('movie_detail.comment_placeholder')}</label>
                  <textarea
                    value={newComment}
                    onChange={e => setNewComment(e.target.value)}
                    placeholder="ความคิดเห็น (ไม่บังคับ)"
                    rows={3}
                    className="w-full bg-slate-800 border border-slate-700/80 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-red-500 resize-none placeholder:text-slate-600 transition-colors"
                  />
                </div>

                <button
                  onClick={handleAddScoreClick}
                  disabled={isSaving || !selectedPersonId || !newScore}
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-br from-red-500 to-red-700 hover:from-red-400 hover:to-red-600 text-white py-3.5 rounded-xl font-black transition-all active:scale-95 disabled:opacity-40 shadow-lg shadow-red-900/30 text-sm mt-1"
                >
                  {isSaving ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
                  {t('movie_detail.submit')}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete confirm modal */}
      <AnimatePresence>
        {showDeleteModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-6"
            onClick={() => !isDeleting && setShowDeleteModal(false)}
          >
            <motion.div
              variants={scaleIn}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="bg-[#111] border border-red-900/30 rounded-3xl w-full max-w-xs shadow-2xl shadow-black/60 p-6"
              onClick={e => e.stopPropagation()}
            >
              {/* Icon */}
              <div className="flex justify-center mb-4">
                <div className="w-14 h-14 rounded-full bg-red-900/40 border border-red-800/50 flex items-center justify-center">
                  <AlertTriangle size={26} className="text-red-500" />
                </div>
              </div>
              {/* Text */}
              <h2 className="text-lg font-black text-white text-center mb-2">{t('movie_detail.confirm_delete')}</h2>
              <p className="text-slate-400 text-sm text-center leading-relaxed mb-6">{t('movie_detail.confirm_delete_movie')}</p>
              {/* Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  disabled={isDeleting}
                  className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm rounded-2xl transition-all active:scale-95 disabled:opacity-50"
                >
                  {t('movie_detail.cancel')}
                </button>
                <button
                  onClick={handleDeleteMovie}
                  disabled={isDeleting}
                  className="flex-1 py-3 bg-red-600 hover:bg-red-500 text-white font-black text-sm rounded-2xl transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isDeleting ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
                  {t('movie_detail.confirm')}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
                <p className="text-slate-400 text-sm mb-6">
                  {people.find(p => String(p.id) === selectedPersonId)?.name} — <span className="text-white font-bold">{newScore}/10</span>
                </p>
              </div>
              <div className="p-6 pt-0 flex gap-3 w-full">
                <button
                  onClick={() => setShowConfirmModal(false)}
                  className="flex-1 py-3.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm rounded-xl transition-all active:scale-95 border border-slate-700/50"
                >
                  {t('common.cancel')}
                </button>
                <button
                  onClick={executeAddScore}
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
