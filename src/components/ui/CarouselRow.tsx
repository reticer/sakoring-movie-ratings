import React from 'react';
import type { Movie } from '../../types';
import { MovieCard } from './MovieCard';
import { ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { LiveCommentCarousel } from './LiveCommentCarousel';

interface CarouselRowProps {
  title: string;
  movies: Movie[];
  actionElement?: React.ReactNode;
}

export const CarouselRow: React.FC<CarouselRowProps> = ({ title, movies, actionElement }) => {
  const navigate = useNavigate();

  return (
    <div className="py-2 space-y-4">
      <div className="px-6 md:px-16 flex items-end justify-between flex-wrap gap-4">
        <h2 className="text-2xl md:text-3xl font-black text-slate-50 tracking-tight flex items-center gap-2 group cursor-pointer hover:text-red-500 transition-colors" onClick={() => navigate('/movies')}>
          {title}
          <ChevronRight size={28} className="opacity-0 group-hover:opacity-100 transition-all duration-300 -ml-4 group-hover:ml-0 text-red-500" />
        </h2>
        {actionElement && (
          <div className="flex items-center">
            {actionElement}
          </div>
        )}
      </div>
      
      {/* We use negative margins and padding to allow the hover:scale to overflow gracefully without clipping, while maintaining the page padding for the first/last elements. */}
      {(!movies || movies.length === 0) ? (
        <div className="py-12 px-6 md:px-16 text-slate-500 font-bold text-center border-2 border-dashed border-slate-800 rounded-2xl mx-6 md:mx-16 mt-4">
          No movies added for this year.
        </div>
      ) : (
        <div className="flex gap-4 md:gap-6 overflow-x-auto overflow-y-visible hide-scrollbar scroll-smooth snap-x snap-mandatory py-8 -mx-6 px-6 md:-mx-16 md:px-16">
          {movies.map((movie, index) => (
            <div key={movie.id} className="flex-none w-[150px] md:w-[220px] snap-start flex flex-col">
              <MovieCard movie={movie} rank={title === "Highest Rated" ? index + 1 : undefined} />
              <LiveCommentCarousel scores={movie.scoreList || (movie as any).scores} />
            </div>
          ))}
        </div>
      )}
      
      <style>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
};
