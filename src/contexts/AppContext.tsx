import React, { createContext, useContext, useState, useEffect } from 'react';
import { dbService } from '../services/dbService';
import type { Movie } from '../types';

interface AppState {
  currentPath: string;
  activeMovieId: number | null;
  movies: Movie[];
  peopleCount: number;
  loading: boolean;
}

interface AppContextType extends AppState {
  navigate: (path: string, options?: { id?: number }) => void;
  refreshData: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AppState>({
    currentPath: '/',
    activeMovieId: null,
    movies: [],
    peopleCount: 0,
    loading: true,
  });

  const refreshData = async () => {
    try {
      setState(prev => ({ ...prev, loading: true }));
      const [moviesData, peopleData] = await Promise.all([
        dbService.getMoviesWithScores(),
        dbService.getPeople()
      ]);
      setState(prev => ({
        ...prev,
        movies: moviesData || [],
        peopleCount: (peopleData || []).length,
        loading: false,
      }));
    } catch (error) {
      console.error('Failed to fetch app data:', error);
      setState(prev => ({ ...prev, loading: false }));
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  const navigate = (path: string, options?: { id?: number }) => {
    window.scrollTo(0, 0); // Scroll to top on navigate
    setState(prev => ({
      ...prev,
      currentPath: path,
      activeMovieId: options?.id ?? null
    }));
  };

  return (
    <AppContext.Provider value={{ ...state, navigate, refreshData }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
