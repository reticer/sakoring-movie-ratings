import React, { useState } from 'react';
import { useApp } from '../../contexts/AppContext';
import { ImageOff, Trash2, Loader2, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Movie } from '../../types';
import { RatingBadge } from './RatingBadge';
import { dbService } from '../../services/dbService';
import { scaleIn } from '../../utils/animations';

interface MovieCardProps {
  movie: Movie;
  onDelete?: () => void;
  rank?: number;
  className?: string;
  style?: React.CSSProperties;
}

export const MovieCard: React.FC<MovieCardProps> = ({ movie, onDelete, rank, className = '', style }) => {
  const { navigate } = useApp();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const avatarInitials = movie.scoreList 
    ? movie.scoreList.map(s => s.people?.name?.substring(0, 2).toUpperCase() || '?').slice(0, 3) 
    : [];

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      setIsDeleting(true);
      await dbService.deleteMovie(movie.id);
      if (onDelete) {
        onDelete();
      } else {
        window.location.reload();
      }
    } catch (error) {
      console.error("Failed to delete movie:", error);
      alert("Failed to delete movie.");
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const cancelDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDeleteConfirm(false);
  };

  return (
    <>
      <div 
        onClick={() => navigate('/movies/detail', { id: movie.id })}
        className={`relative aspect-[2/3] bg-slate-800 border border-slate-700/50 rounded-2xl overflow-visible cursor-pointer group transition-all duration-300 ease-out hover:scale-[1.03] active:scale-95 hover:z-30 shadow-xl shadow-black/50 hover:shadow-[0_20px_50px_rgba(0,0,0,0.8)] ${rank ? 'ml-6 md:ml-10' : ''} ${className}`}
        style={style}
      >
        {/* Netflix-style Rank Overlay */}
        {rank !== undefined && (
          <span 
            className="absolute -left-6 md:-left-10 -bottom-2 md:-bottom-4 text-7xl md:text-9xl font-black text-slate-900 z-50 pointer-events-none select-none drop-shadow-2xl"
            style={{ 
              WebkitTextStroke: '2px #f8fafc',
              textShadow: '0 0 15px rgba(0,0,0,0.8)'
            }}
          >
            {rank}
          </span>
        )}

        {/* Poster Image */}
        {movie.poster_url ? (
          <img 
            src={movie.poster_url} 
            alt={movie.title} 
            className="w-full h-full object-cover rounded-2xl transition-transform duration-700 ease-[cubic-bezier(0.25,1,0.5,1)] group-hover:scale-105" 
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-slate-700">
            <ImageOff size={40} className="mb-2" />
            <span className="text-xs uppercase tracking-wider font-bold">No Poster</span>
          </div>
        )}

        {/* Floating Rating Pill (Top Right) */}
        {movie.average_score && movie.average_score > 0 ? (
          <div className="absolute top-3 right-3 z-20 transition-opacity duration-300 group-hover:opacity-0 shadow-[0_4px_10px_rgba(0,0,0,0.8)] rounded-full">
            <RatingBadge score={movie.average_score} size="sm" />
          </div>
        ) : null}

        {/* Hover Overlay with Slide-Up effect */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/90 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 ease-[cubic-bezier(0.25,1,0.5,1)] flex flex-col justify-end p-5 z-10 translate-y-4 group-hover:translate-y-0">
          
          {/* Delete Button - Distinctly placed in overlay top-right */}
          <button 
            onClick={handleDeleteClick}
            className="absolute top-3 right-3 p-2.5 bg-red-500/80 hover:bg-red-600 backdrop-blur-md text-white rounded-full transition-all duration-300 ease-out opacity-0 group-hover:opacity-100 translate-y-[-10px] group-hover:translate-y-0 shadow-lg shadow-black/50 hover:scale-110 active:scale-95 border border-red-400/50"
            title="Delete Movie"
          >
            <Trash2 size={18} />
          </button>

          <h3 className="font-black text-slate-50 text-xl leading-tight line-clamp-2 mb-1 drop-shadow-md pr-10">{movie.title}</h3>
          <p className="text-slate-400 font-bold text-sm mb-4">{movie.release_year || 'N/A'}</p>
          
          {avatarInitials.length > 0 && (
            <div className="flex items-center gap-2 mt-auto border-t border-white/10 pt-3">
              <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Rated by</span>
              <div className="flex -space-x-2">
                {avatarInitials.map((initial, idx) => (
                  <div key={idx} className="w-7 h-7 rounded-full bg-slate-800 border border-slate-900 flex items-center justify-center text-xs font-black text-slate-300 shadow-md">
                    {initial}
                  </div>
                ))}
                {movie.scoreList && movie.scoreList.length > 3 && (
                  <div className="w-7 h-7 rounded-full bg-slate-800 border border-slate-900 flex items-center justify-center text-xs font-black text-slate-400 shadow-md">
                    +{movie.scoreList.length - 3}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Safety Confirmation Modal */}
      <AnimatePresence>
      {showDeleteConfirm && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-slate-900/80 backdrop-blur-md flex items-center justify-center z-[100] p-4"
          onClick={cancelDelete} // Clicking outside cancels
        >
          <motion.div 
            variants={scaleIn}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="bg-slate-800/90 backdrop-blur-xl border border-slate-700/80 rounded-2xl p-6 max-w-sm w-full shadow-2xl shadow-black/80 flex flex-col items-center text-center"
            onClick={(e) => e.stopPropagation()} // Prevent clicking inside modal from closing it
          >
            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center text-red-500 mb-4 border border-red-500/20">
              <AlertTriangle size={32} />
            </div>
            <h3 className="text-2xl font-black text-white mb-2">Delete Movie?</h3>
            <p className="text-slate-300 mb-6 text-sm font-medium">This will permanently remove <span className="text-white font-bold">{movie.title}</span> and all associated ratings.</p>
            
            <div className="flex gap-3 w-full">
              <button 
                onClick={cancelDelete}
                disabled={isDeleting} 
                className="flex-1 px-4 py-3 bg-slate-700/60 hover:bg-slate-600/80 active:scale-95 text-white rounded-xl font-bold transition-all duration-300 ease-out border border-slate-600/50"
              >
                Cancel
              </button>
              <button 
                onClick={confirmDelete}
                disabled={isDeleting} 
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-br from-red-500 to-red-700 hover:from-red-400 hover:to-red-600 active:scale-95 text-white rounded-xl font-black transition-all duration-300 ease-out shadow-lg shadow-black/30"
              >
                {isDeleting ? <Loader2 className="animate-spin" size={18} /> : <Trash2 size={18} />}
                Delete
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
      </AnimatePresence>
    </>
  );
};
