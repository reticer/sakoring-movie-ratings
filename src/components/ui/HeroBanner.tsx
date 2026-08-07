import React, { useState, useEffect } from 'react';
import { useApp } from '../../contexts/AppContext';
import { Play, Star, Plus } from 'lucide-react';
import type { Movie } from '../../types';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../../contexts/LanguageContext';

interface HeroBannerProps {
  movies: Movie[];
}

export const HeroBanner: React.FC<HeroBannerProps> = ({ movies }) => {
  const { t } = useLanguage();
  const { navigate } = useApp();
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (!movies || movies.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % movies.length);
    }, 8000);
    return () => clearInterval(timer);
  }, [movies?.length]);

  if (!movies || movies.length === 0) {
    return (
      <div className="w-full h-[65vh] md:h-[70vh] min-h-[450px] bg-slate-900 animate-pulse flex items-center justify-center">
        <div className="text-slate-700">{t('hero.loading')}</div>
      </div>
    );
  }

  const movie = movies[currentIndex];
  const bgImage = movie.poster_url?.replace('w500', 'original') || movie.poster_url;

  return (
    <div className="relative w-full h-[65vh] md:h-[75vh] min-h-[450px] flex items-center pt-16 px-6 md:px-16 overflow-hidden">
      {/* Background Image: Crossfade */}
      <div className="absolute inset-0 z-0 bg-slate-950">
        <AnimatePresence>
          {bgImage && (
            <motion.img 
              key={bgImage}
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.5 }}
              src={bgImage} 
              alt={movie.title} 
              className="absolute inset-0 w-full h-full object-cover object-top" 
            />
          )}
        </AnimatePresence>
      </div>
      
      {/* Heavy Cinematic Gradients */}
      <div className="absolute inset-0 z-0 bg-gradient-to-t from-slate-900 via-slate-900/80 to-transparent"></div>
      <div className="absolute inset-0 z-0 bg-gradient-to-r from-slate-900 via-slate-900/50 to-transparent w-full md:w-3/4"></div>

      {/* Content */}
      <AnimatePresence mode="wait">
        <motion.div 
          key={movie.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="relative z-10 max-w-4xl space-y-3 md:space-y-5"
        >
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-slate-50 tracking-normal drop-shadow-2xl leading-tight line-clamp-2">
            {movie.title}
          </h1>
          
          <div className="flex items-center gap-3 md:gap-4 text-slate-300 font-bold text-sm md:text-lg">
            {movie.release_year && <span className="drop-shadow-md">{movie.release_year}</span>}
            {movie.average_score ? (
               <div className="flex items-center gap-1.5 text-amber-400 font-black drop-shadow-md">
                 <Star size={16} className="fill-current drop-shadow-[0_0_8px_rgba(251,191,36,0.5)] md:w-5 md:h-5" />
                 {t('hero.family_score')}: {movie.average_score.toFixed(1)}/10
               </div>
            ) : null}
          </div>

          <p className="text-sm sm:text-base md:text-lg text-slate-300 line-clamp-2 leading-relaxed max-w-2xl drop-shadow-lg font-medium">
            {movie.overview || t('hero.no_overview')}
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2 md:pt-4">
            <button 
              onClick={() => navigate('/movies/detail', { id: movie.id })}
              className="flex items-center gap-2 px-5 py-2.5 md:px-8 md:py-3 bg-gradient-to-br from-red-500 to-red-700 hover:from-red-400 hover:to-red-600 text-white rounded-xl md:rounded-2xl font-black text-sm md:text-lg tracking-wide transition-all duration-300 ease-out active:scale-95 shadow-xl shadow-black/50 hover:shadow-2xl hover:-translate-y-1"
            >
              <Play size={18} className="fill-current md:w-5 md:h-5" /> {t('hero.view_details')}
            </button>
            <button 
              onClick={() => navigate('/movies/detail', { id: movie.id })}
              className="flex items-center gap-2 px-5 py-2.5 md:px-8 md:py-3 bg-slate-900/60 hover:bg-slate-800/80 backdrop-blur-md text-white rounded-xl md:rounded-2xl font-black text-sm md:text-lg tracking-wide transition-all duration-300 ease-out active:scale-95 border border-slate-800/80 shadow-xl shadow-black/50 hover:-translate-y-1"
            >
              <Plus size={18} className="md:w-5 md:h-5" /> {t('hero.rate_now')}
            </button>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Pagination Indicators */}
      {movies.length > 1 && (
        <div className="absolute bottom-28 md:bottom-36 left-6 md:left-16 flex gap-2 z-20">
          {movies.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={`h-1.5 rounded-full transition-all duration-300 ${idx === currentIndex ? 'w-6 bg-red-500' : 'w-2 bg-slate-600 hover:bg-slate-400'}`}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};
