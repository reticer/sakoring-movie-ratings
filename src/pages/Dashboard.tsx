import React, { useState, useEffect, useMemo } from 'react';
import { Film, Users, Star, Activity, PlusCircle } from 'lucide-react';
import { dbService } from '../services/dbService';
import type { Movie } from '../types';
import { HeroBanner } from '../components/ui/HeroBanner';
import { StatCard } from '../components/ui/StatCard';
import { CarouselRow } from '../components/ui/CarouselRow';
import { useNavigate } from 'react-router-dom';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [movies, setMovies] = useState<Movie[]>([]);
  const [peopleCount, setPeopleCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [moviesData, peopleData] = await Promise.all([
          dbService.getMoviesWithScores(),
          dbService.getPeople()
        ]);
        setMovies(moviesData || []);
        setPeopleCount((peopleData || []).length);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const { highestRatedMovie, highestRatedList, recentList, globalAvg } = useMemo(() => {
    if (!movies.length) return { highestRatedMovie: null, highestRatedList: [], recentList: [], globalAvg: '0.0' };

    const validScores = movies.filter(m => m.average_score && m.average_score > 0);
    const sortedByScore = [...validScores].sort((a, b) => (b.average_score || 0) - (a.average_score || 0));
    
    const highestRatedMovie = sortedByScore.length > 0 ? sortedByScore[0] : movies[0];
    
    const highestRatedList = sortedByScore.slice(0, 10);
    const recentList = [...movies].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 10);
    
    const totalScore = validScores.reduce((sum, m) => sum + Number(m.average_score), 0);
    const globalAvg = validScores.length ? (totalScore / validScores.length).toFixed(1) : '0.0';

    return { highestRatedMovie, highestRatedList, recentList, globalAvg };
  }, [movies]);

  if (loading) {
    return (
      <div className="flex-1 min-h-screen flex items-center justify-center bg-slate-900">
        <Activity className="animate-spin text-red-600" size={56} />
      </div>
    );
  }

  if (movies.length === 0) {
    return (
      <div className="flex-1 min-h-screen flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-1000 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-900 via-slate-900 to-slate-900">
        <Film size={80} className="text-slate-800 mb-8 drop-shadow-2xl" />
        <h1 className="text-5xl md:text-6xl font-black text-slate-50 tracking-tighter mb-4 drop-shadow-lg">No Movies Yet</h1>
        <p className="text-slate-400 text-lg max-w-lg mb-10 leading-relaxed font-medium">
          Your cinematic journey starts here. Add your first movie to begin building your premium family collection.
        </p>
        <button 
          onClick={() => navigate('/add-movie')}
          className="flex items-center gap-3 px-10 py-5 bg-gradient-to-br from-red-500 to-red-700 hover:from-red-400 hover:to-red-600 text-white rounded-2xl font-black text-lg transition-all duration-300 ease-out active:scale-95 shadow-xl shadow-black/50 hover:shadow-2xl hover:-translate-y-1"
        >
          <PlusCircle size={24} className="fill-current drop-shadow-md" /> Add Your First Movie
        </button>
      </div>
    );
  }

  return (
    <div className="pb-16 animate-in fade-in duration-1000 ease-[cubic-bezier(0.25,1,0.5,1)]">
      {/* Hero Section */}
      <HeroBanner movie={highestRatedMovie} />

      {/* Main Content Area */}
      <div className="px-6 md:px-16 -mt-16 relative z-20 space-y-16 md:space-y-24">
        
        {/* Carousels */}
        <div className="space-y-10 md:space-y-16">
          <CarouselRow title="Highest Rated" movies={highestRatedList} />
          <CarouselRow title="Recently Added" movies={recentList} />
        </div>

        {/* Statistics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          <StatCard 
            title="Total Movies" 
            value={movies.length} 
            icon={Film} 
          />
          <StatCard 
            title="Overall Average" 
            value={globalAvg} 
            subtitle="/10"
            icon={Star} 
          />
          <StatCard 
            title="Family Members" 
            value={peopleCount} 
            icon={Users} 
          />
        </div>
      </div>
    </div>
  );
};
