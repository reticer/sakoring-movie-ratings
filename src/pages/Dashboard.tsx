import React, { useState, useEffect, useMemo } from 'react';
import { Film, Users, Star, Activity, PlusCircle } from 'lucide-react';
import { dbService } from '../services/dbService';
import type { Movie } from '../types';
import { HeroBanner } from '../components/ui/HeroBanner';
import { StatCard } from '../components/ui/StatCard';
import { CarouselRow } from '../components/ui/CarouselRow';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

import { useLanguage } from '../contexts/LanguageContext';

export const Dashboard: React.FC = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [movies, setMovies] = useState<Movie[]>([]);
  const [peopleCount, setPeopleCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filterYear, setFilterYear] = useState<string>(new Date().getFullYear().toString());

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

  const { highestRatedList, recentList, globalAvg } = useMemo(() => {
    if (!movies.length) return { highestRatedList: [], recentList: [], globalAvg: '0.0' };

    const validScores = movies.filter(m => m.average_score && m.average_score > 0);
    
    // Filter highest rated by selected year
    const filteredForHighest = filterYear === 'all' 
      ? validScores 
      : validScores.filter(m => m.release_year?.toString() === filterYear);

    const sortedByScore = [...filteredForHighest].sort((a, b) => (b.average_score || 0) - (a.average_score || 0));
    const highestRatedList = sortedByScore.slice(0, 10);
    
    const recentList = [...movies].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 10);
    
    const totalScore = validScores.reduce((sum, m) => sum + Number(m.average_score), 0);
    const globalAvg = validScores.length ? (totalScore / validScores.length).toFixed(1) : '0.0';

    return { highestRatedList, recentList, globalAvg };
  }, [movies, filterYear]);

  const currentYear = new Date().getFullYear();
  const yearOptions = ["all", ...Array.from({ length: currentYear - 2000 + 1 }, (_, i) => (currentYear - i).toString())];

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
        <h1 className="text-5xl md:text-6xl font-black text-slate-50 tracking-tighter mb-4 drop-shadow-lg">{t('dashboard.no_movies')}</h1>
        <p className="text-slate-400 text-lg max-w-lg mb-10 leading-relaxed font-medium">
          {t('dashboard.no_movies_desc')}
        </p>
        <button 
          onClick={() => navigate('/add-movie')}
          className="flex items-center gap-3 px-10 py-5 bg-gradient-to-br from-red-500 to-red-700 hover:from-red-400 hover:to-red-600 text-white rounded-2xl font-black text-lg transition-all duration-300 ease-out active:scale-95 shadow-xl shadow-black/50 hover:shadow-2xl hover:-translate-y-1"
        >
          <PlusCircle size={24} className="fill-current drop-shadow-md" /> {t('dashboard.add_first')}
        </button>
      </div>
    );
  }

  return (
    <div className="pb-16 animate-in fade-in duration-1000 ease-[cubic-bezier(0.25,1,0.5,1)]">
      {/* Hero Section */}
      <HeroBanner movies={highestRatedList.slice(0, 5)} />

      {/* Main Content Area */}
      <div className="px-6 md:px-16 -mt-24 md:-mt-28 relative z-20 space-y-16 md:space-y-24">
        
        {/* Carousels */}
        <div className="space-y-8 md:space-y-12">
          <CarouselRow 
            title={t('dashboard.highest_rated')} 
            movies={highestRatedList} 
            actionElement={
              <select 
                value={filterYear} 
                onChange={e => setFilterYear(e.target.value)}
                className="bg-slate-900/80 border border-slate-700/80 text-white rounded-lg md:rounded-xl px-3 py-1.5 md:px-4 md:py-2 focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 cursor-pointer font-bold shadow-inner transition-colors text-xs md:text-sm"
              >
                {yearOptions.map(y => (
                  <option key={y} value={y}>{y === "all" ? t('dashboard.all_time') : y}</option>
                ))}
              </select>
            }
          />
          <CarouselRow title={t('dashboard.recently_added')} movies={recentList} />
        </div>

        {/* Statistics Grid */}
        <div 
          className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8"
        >
          <div className="animate-card" style={{ animationDelay: '100ms' }}>
            <StatCard 
              title={t('dashboard.total_movies')} 
              value={movies.length} 
              icon={Film} 
            />
          </div>
          <div className="animate-card" style={{ animationDelay: '200ms' }}>
            <StatCard 
              title={t('dashboard.overall_avg')} 
              value={globalAvg} 
              subtitle="/10"
              icon={Star} 
            />
          </div>
          <div className="animate-card" style={{ animationDelay: '300ms' }}>
            <StatCard 
              title={t('dashboard.family_members')} 
              value={peopleCount} 
              icon={Users} 
            />
          </div>
        </div>
      </div>
    </div>
  );
};
