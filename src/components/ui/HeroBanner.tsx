import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Star, Plus } from 'lucide-react';
import type { Movie } from '../../types';

interface HeroBannerProps {
  movie: Movie | null;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({ movie }) => {
  const navigate = useNavigate();

  if (!movie) {
    return (
      <div className="w-full h-[85vh] bg-slate-900 animate-pulse flex items-center justify-center">
        <div className="text-slate-700">Loading featured...</div>
      </div>
    );
  }

  const bgImage = movie.poster_url?.replace('w500', 'original') || movie.poster_url;

  return (
    <div className="relative w-full h-[85vh] min-h-[600px] flex items-end pb-24 md:pb-32 px-6 md:px-16 overflow-hidden">
      {/* Background Image: Sharp, no blur */}
      {bgImage && (
        <div className="absolute inset-0 z-0">
          <img 
            src={bgImage} 
            alt={movie.title} 
            className="w-full h-full object-cover object-top opacity-70" 
          />
        </div>
      )}
      
      {/* Heavy Cinematic Gradients */}
      <div className="absolute inset-0 z-0 bg-gradient-to-t from-slate-900 via-slate-900/90 to-transparent"></div>
      <div className="absolute inset-0 z-0 bg-gradient-to-r from-slate-900 via-slate-900/60 to-transparent w-3/4"></div>

      {/* Content */}
      <div className="relative z-10 max-w-4xl space-y-6 animate-in fade-in slide-in-from-bottom-12 duration-1000 ease-[cubic-bezier(0.25,1,0.5,1)]">
        <h1 className="text-6xl md:text-8xl font-black text-slate-50 tracking-tighter drop-shadow-2xl leading-none">
          {movie.title}
        </h1>
        
        <div className="flex items-center gap-4 text-slate-300 font-bold text-lg">
          {movie.release_year && <span className="drop-shadow-md">{movie.release_year}</span>}
          {movie.average_score ? (
             <div className="flex items-center gap-1.5 text-amber-400 font-black drop-shadow-md">
               <Star size={20} className="fill-current drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]" />
               Family Score: {movie.average_score.toFixed(1)}/10
             </div>
          ) : null}
        </div>

        <p className="text-xl text-slate-300 line-clamp-3 md:line-clamp-4 leading-relaxed max-w-3xl drop-shadow-lg font-medium">
          {movie.overview || 'No overview available for this movie.'}
        </p>

        <div className="flex flex-wrap items-center gap-4 pt-4">
          <button 
            onClick={() => navigate(`/movies/${movie.id}`)}
            className="flex items-center gap-2 px-10 py-4 bg-gradient-to-br from-red-500 to-red-700 hover:from-red-400 hover:to-red-600 text-white rounded-2xl font-black text-lg transition-all duration-300 ease-out active:scale-95 shadow-xl shadow-black/50 hover:shadow-2xl hover:-translate-y-1"
          >
            <Play size={24} className="fill-current" /> View Details
          </button>
          <button 
            onClick={() => navigate(`/movies/${movie.id}`)}
            className="flex items-center gap-2 px-10 py-4 bg-slate-900/60 hover:bg-slate-800/80 backdrop-blur-md text-white rounded-2xl font-black text-lg transition-all duration-300 ease-out active:scale-95 border border-slate-800/80 shadow-xl shadow-black/50 hover:-translate-y-1"
          >
            <Plus size={24} /> Rate Now
          </button>
        </div>
      </div>
    </div>
  );
};
