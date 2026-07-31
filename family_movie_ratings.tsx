import React, { useState, useEffect, useMemo } from 'react';
import { HashRouter as Router, Routes, Route, NavLink, useNavigate, useParams } from 'react-router-dom';
import {
  Home, PlusCircle, Film, Users, Settings as SettingsIcon,
  Star, Eye, Search, ImageOff, ChevronLeft, Calendar,
  Trash2, Clock, Activity, Download, Upload, FileJson, AlertCircle, CheckCircle2, Loader2
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const defaultSupabaseUrl = 'YOUR_SUPABASE_URL';
const defaultSupabaseKey = 'YOUR_SUPABASE_KEY';
const supabaseUrl = localStorage.getItem('SUPABASE_URL') || defaultSupabaseUrl;
const supabaseKey = localStorage.getItem('SUPABASE_KEY') || defaultSupabaseKey;
const supabase = createClient(supabaseUrl, supabaseKey);

const dbService = {
  getPeople: async () => {
    const { data, error } = await supabase.from('people').select('*').order('name');
    if (error) throw error;
    return data;
  },
  addPerson: async (name) => {
    const { data, error } = await supabase.from('people').insert([{ name }]).select();
    if (error) throw error;
    return data[0];
  },
  updatePerson: async (id, name) => {
    const { error } = await supabase.from('people').update({ name }).eq('id', id);
    if (error) throw error;
    return true;
  },
  deletePerson: async (id) => {
    const { error } = await supabase.from('people').delete().eq('id', id);
    if (error) throw error;
    return true;
  },
  checkMovieExistsByTmdbId: async (tmdbId) => {
    const { data, error } = await supabase.from('movies').select('id').eq('tmdb_id', tmdbId).maybeSingle();
    if (error) throw error;
    return !!data;
  },
  addMovieWithScores: async (movieData, scoresData) => {
    const { data: movie, error: movieError } = await supabase.from('movies').insert([movieData]).select().single();
    if (movieError) throw movieError;
    
    const scoresToInsert = scoresData.map(s => ({ ...s, movie_id: movie.id }));
    const { error: scoresError } = await supabase.from('scores').insert(scoresToInsert);
    
    if (scoresError) {
      await supabase.from('movies').delete().eq('id', movie.id);
      throw scoresError;
    }
    return true;
  },
  getMoviesWithScores: async () => {
    const { data, error } = await supabase.from('movies').select(`*, scores (count)`).order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },
  getMovieById: async (id) => {
    const { data: movie, error: movieError } = await supabase.from('movies').select('*').eq('id', id).single();
    if (movieError) throw movieError;

    const { data: scores, error: scoresError } = await supabase.from('scores').select(`id, score, person_id, people(name)`).eq('movie_id', id);
    if (scoresError) throw scoresError;

    return { ...movie, scoreList: scores };
  },
  updateMovieDetails: async (id, updates) => {
    const { error } = await supabase.from('movies').update(updates).eq('id', id);
    if (error) throw error;
    return true;
  },
  deleteMovie: async (id) => {
    const { error } = await supabase.from('movies').delete().eq('id', id);
    if (error) throw error;
    return true;
  },
  addScore: async (scoreData) => {
    const { error } = await supabase.from('scores').insert([scoreData]);
    if (error) throw error;
    return true;
  },
  updateScore: async (id, score) => {
    const { error } = await supabase.from('scores').update({ score }).eq('id', id);
    if (error) throw error;
    return true;
  },
  deleteScore: async (id) => {
    const { error } = await supabase.from('scores').delete().eq('id', id);
    if (error) throw error;
    return true;
  },
  exportDatabase: async () => {
    const { data: people, error: errP } = await supabase.from('people').select('*');
    if (errP) throw errP;
    
    const { data: movies, error: errM } = await supabase.from('movies').select('*');
    if (errM) throw errM;
    
    const { data: scores, error: errS } = await supabase.from('scores').select('*');
    if (errS) throw errS;

    return {
      app: "Family Movie Ratings",
      export_date: new Date().toISOString(),
      version: "1.0",
      data: {
        people: people || [],
        movies: movies || [],
        scores: scores || []
      }
    };
  },
  importDatabase: async (parsedData) => {
    if (!parsedData || !parsedData.data) {
      throw new Error("รูปแบบไฟล์ไม่ถูกต้อง: ไม่พบชุดข้อมูล");
    }
    const { people, movies, scores } = parsedData.data;
    if (!Array.isArray(people) || !Array.isArray(movies) || !Array.isArray(scores)) {
      throw new Error("รูปแบบไฟล์ไม่ถูกต้อง: โครงสร้างข้อมูลไม่ครบถ้วน");
    }

    if (people.length > 0) {
      const { error } = await supabase.from('people').upsert(people);
      if (error) throw new Error("ข้อผิดพลาด People: " + error.message);
    }
    if (movies.length > 0) {
      const { error } = await supabase.from('movies').upsert(movies);
      if (error) throw new Error("ข้อผิดพลาด Movies: " + error.message);
    }
    if (scores.length > 0) {
      const { error } = await supabase.from('scores').upsert(scores);
      if (error) throw new Error("ข้อผิดพลาด Scores: " + error.message);
    }
    return true;
  }
};

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const { data: movies } = await supabase.from('movies').select('*');
        const { count: peopleCount } = await supabase.from('people').select('*', { count: 'exact', head: true });
        
        if (!movies || movies.length === 0) {
          setStats({ count: 0, people: peopleCount, avg: 0, top: null, bottom: null, recent: [], graphData: [] });
          setLoading(false);
          return;
        }

        const validScores = movies.filter(m => m.average_score > 0);
        const totalScore = validScores.reduce((sum, m) => sum + Number(m.average_score), 0);
        const globalAvg = validScores.length ? (totalScore / validScores.length).toFixed(1) : 0;

        const sortedByScore = [...validScores].sort((a, b) => b.average_score - a.average_score);
        const topMovie = sortedByScore[0] || null;
        const bottomMovie = sortedByScore[sortedByScore.length - 1] || null;

        const recentMovies = [...movies].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 5);
        
        const graphData = [...movies]
          .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
          .slice(0, 7)
          .reverse()
          .map(m => ({
            name: m.title.substring(0, 15) + (m.title.length > 15 ? '...' : ''),
            score: Number(m.average_score)
          }));

        setStats({ count: movies.length, people: peopleCount || 0, avg: globalAvg, top: topMovie, bottom: bottomMovie, recent: recentMovies, graphData });
      } catch (err) {
        console.error("Dashboard error:", err);
      } finally {
        setLoading(false);
      }
    };
    loadStats();
  }, []);

  if (loading) return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8 animate-pulse">
      <div className="h-10 bg-gray-800 rounded-xl w-48 mb-2"></div>
      <div className="h-4 bg-gray-800 rounded w-64 mb-8"></div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1,2,3,4].map(i => <div key={i} className="bg-gray-800 h-28 rounded-2xl border border-gray-700"></div>)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-gray-800 h-[350px] rounded-2xl border border-gray-700"></div>
        <div className="space-y-6">
          <div className="bg-gray-800 h-32 rounded-2xl border border-gray-700"></div>
          <div className="bg-gray-800 h-32 rounded-2xl border border-gray-700"></div>
        </div>
      </div>
    </div>
  );

  if (!stats) return null;

  return (
    <div className="p-6 md:p-10 text-gray-100 max-w-7xl mx-auto space-y-8">
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
        <h1 className="text-3xl font-bold text-white">Dashboard</h1>
        <p className="text-gray-400 mt-1">ภาพรวมและสถิติทั้งหมดในระบบ</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gray-800 p-6 rounded-2xl border border-gray-700 flex items-center gap-4 hover:-translate-y-1 hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] transition-all duration-300">
          <div className="p-3 bg-blue-500/20 text-blue-400 rounded-xl"><Film size={28} /></div>
          <div><p className="text-sm text-gray-400">ภาพยนตร์ทั้งหมด</p><p className="text-2xl font-bold">{stats.count}</p></div>
        </div>
        <div className="bg-gray-800 p-6 rounded-2xl border border-gray-700 flex items-center gap-4 hover:-translate-y-1 hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] transition-all duration-300">
          <div className="p-3 bg-purple-500/20 text-purple-400 rounded-xl"><Users size={28} /></div>
          <div><p className="text-sm text-gray-400">ผู้ให้คะแนน</p><p className="text-2xl font-bold">{stats.people}</p></div>
        </div>
        <div className="bg-gray-800 p-6 rounded-2xl border border-gray-700 flex items-center gap-4 hover:-translate-y-1 hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] transition-all duration-300">
          <div className="p-3 bg-amber-500/20 text-amber-400 rounded-xl"><Star size={28} /></div>
          <div><p className="text-sm text-gray-400">คะแนนเฉลี่ยรวม</p><p className="text-2xl font-bold text-amber-400">{stats.avg}</p></div>
        </div>
        <div className="bg-gray-800 p-6 rounded-2xl border border-gray-700 flex items-center gap-4 hover:-translate-y-1 hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] transition-all duration-300">
          <div className="p-3 bg-emerald-500/20 text-emerald-400 rounded-xl"><Activity size={28} /></div>
          <div className="overflow-hidden">
            <p className="text-sm text-gray-400">เพิ่มล่าสุด</p>
            <p className="text-lg font-bold truncate">{stats.recent[0]?.title || "-"}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Chart */}
        <div className="lg:col-span-2 bg-gray-800 p-6 rounded-2xl border border-gray-700 hover:shadow-lg transition-shadow duration-300">
          <h2 className="text-lg font-semibold mb-6 flex items-center gap-2"><Activity size={20} className="text-blue-400"/> แนวโน้มคะแนน 7 เรื่องล่าสุด</h2>
          {stats.graphData.length > 0 ? (
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.graphData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                  <XAxis dataKey="name" stroke="#9CA3AF" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#9CA3AF" fontSize={12} tickLine={false} axisLine={false} domain={[0, 10]} />
                  <RechartsTooltip cursor={{fill: '#374151', opacity: 0.4}} contentStyle={{ backgroundColor: '#1F2937', borderColor: '#374151', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                  <Bar dataKey="score" fill="#3B82F6" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
             <div className="h-[280px] flex flex-col items-center justify-center text-gray-500 gap-3 border-2 border-dashed border-gray-700 rounded-xl">
                <Box size={40} className="text-gray-600" />
                <p>ยังไม่มีข้อมูลเพียงพอสำหรับสร้างกราฟ</p>
             </div>
          )}
        </div>

        {/* Highlights */}
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-amber-500/20 to-orange-500/5 p-6 rounded-2xl border border-amber-500/20 hover:scale-[1.02] transition-transform duration-300">
            <h3 className="text-sm font-medium text-amber-500 mb-2 uppercase tracking-wider flex items-center gap-2">
              <Star size={16} /> คะแนนสูงสุด
            </h3>
            {stats.top ? (
              <div>
                <p className="text-xl font-bold line-clamp-1">{stats.top.title}</p>
                <p className="text-4xl font-black text-amber-400 mt-2">{stats.top.average_score}</p>
              </div>
            ) : <p className="text-gray-400">-</p>}
          </div>

          <div className="bg-gradient-to-br from-red-500/20 to-rose-500/5 p-6 rounded-2xl border border-red-500/20 hover:scale-[1.02] transition-transform duration-300">
            <h3 className="text-sm font-medium text-red-500 mb-2 uppercase tracking-wider flex items-center gap-2">
              <Star size={16} /> คะแนนต่ำสุด
            </h3>
            {stats.bottom ? (
              <div>
                <p className="text-xl font-bold line-clamp-1">{stats.bottom.title}</p>
                <p className="text-4xl font-black text-red-400 mt-2">{stats.bottom.average_score}</p>
              </div>
            ) : <p className="text-gray-400">-</p>}
          </div>
        </div>
      </div>
    </div>
  );
};

// Box Icon Helper (as an inline SVG for empty state)
const Box = ({ size = 24, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
    <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
    <line x1="12" y1="22.08" x2="12" y2="12"></line>
  </svg>
);

const AddMovie = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedMovie, setSelectedMovie] = useState(null);

  const [people, setPeople] = useState([]);
  const [scores, setScores] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const TMDB_API_KEY = localStorage.getItem('TMDB_API_KEY') || 'YOUR_TMDB_API_KEY';

  useEffect(() => {
    if (step === 2) {
      dbService.getPeople().then(setPeople).catch(err => {
        console.error(err);
        setError("ไม่สามารถดึงรายชื่อได้ กรุณาลองใหม่");
      });
    }
  }, [step]);

  const searchMovies = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    if (TMDB_API_KEY === 'YOUR_TMDB_API_KEY') {
      setError("กรุณาตั้งค่า TMDB API Key ก่อนใช้งาน");
      return;
    }
    
    setLoading(true);
    setError('');
    setSearchResults([]);

    try {
      const res = await fetch(`https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(searchQuery)}&language=th-TH`);
      const data = await res.json();
      if (data.results && data.results.length > 0) {
        setSearchResults(data.results);
      } else {
        setError("ไม่พบภาพยนตร์ที่ค้นหา");
      }
    } catch (err) {
      setError("เกิดข้อผิดพลาดในการเชื่อมต่อ TMDB");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectMovie = async (movie) => {
    try {
      const exists = await dbService.checkMovieExistsByTmdbId(movie.id);
      if (exists) {
        setError("ภาพยนตร์เรื่องนี้มีอยู่ในระบบแล้ว");
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
      setSelectedMovie({
        tmdb_id: movie.id,
        title: movie.title || movie.original_title,
        original_title: movie.original_title,
        release_year: movie.release_date ? parseInt(movie.release_date.substring(0, 4)) : null,
        poster_url: movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : null,
        overview: movie.overview
      });
      setStep(2);
      setError('');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setError("เกิดข้อผิดพลาดในการตรวจสอบข้อมูลซ้ำ");
    }
  };

  const handleScoreChange = (personId, val) => {
    setScores(prev => ({ ...prev, [personId]: val }));
  };

  const handleSaveMovie = async () => {
    const validScores = Object.entries(scores)
      .filter(([_, val]) => val !== '' && val !== null)
      .map(([personId, val]) => ({ person_id: personId, score: parseFloat(val) }));

    if (validScores.length === 0) {
      setError("กรุณาให้คะแนนอย่างน้อย 1 คน");
      return;
    }

    setSubmitting(true);
    setError('');

    const sum = validScores.reduce((acc, curr) => acc + curr.score, 0);
    const average = parseFloat((sum / validScores.length).toFixed(2));

    try {
      await dbService.addMovieWithScores({ ...selectedMovie, average_score: average }, validScores);
      navigate('/movies');
    } catch (err) {
      setError(err.message || "เกิดข้อผิดพลาดในการบันทึกข้อมูล");
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6 md:p-10 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4 animate-in fade-in duration-500">
        {step === 2 && (
          <button onClick={() => setStep(1)} className="p-2 hover:bg-gray-800 rounded-full transition-colors active:scale-95">
            <ChevronLeft size={24} className="text-gray-400" />
          </button>
        )}
        <div>
          <h1 className="text-3xl font-bold text-white">Add Movie</h1>
          <p className="text-gray-400 mt-1">{step === 1 ? 'ค้นหาภาพยนตร์เพื่อเพิ่มเข้าระบบ' : 'ให้คะแนนภาพยนตร์'}</p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl flex items-center gap-3 animate-in slide-in-from-top-2">
          <AlertCircle size={20} className="shrink-0" /> <p>{error}</p>
        </div>
      )}

      {step === 1 ? (
        <div className="space-y-6 animate-in fade-in duration-500">
          <form onSubmit={searchMovies} className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input 
                type="text" 
                placeholder="พิมพ์ชื่อภาพยนตร์..." 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 text-white rounded-xl py-3 pl-12 pr-4 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all shadow-sm"
              />
            </div>
            <button type="submit" disabled={loading} className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-xl transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center min-w-[120px] shadow-lg shadow-blue-500/20">
              {loading ? <Loader2 className="animate-spin" size={20} /> : 'ค้นหา'}
            </button>
          </form>

          {searchResults.length === 0 && !loading && !error && (
            <div className="py-20 flex flex-col items-center justify-center text-gray-500 border-2 border-dashed border-gray-800 rounded-2xl">
               <Film size={48} className="mb-4 opacity-50" />
               <p>ผลการค้นหาจะแสดงที่นี่</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {searchResults.map(movie => (
              <div key={movie.id} onClick={() => handleSelectMovie(movie)} className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden flex cursor-pointer hover:border-blue-500 hover:shadow-[0_4px_20px_rgb(59,130,246,0.15)] transition-all hover:-translate-y-1 group">
                {movie.poster_path ? (
                  <img src={`https://image.tmdb.org/t/p/w200${movie.poster_path}`} alt={movie.title} className="w-24 object-cover group-hover:brightness-110 transition-all" />
                ) : (
                  <div className="w-24 bg-gray-900 flex flex-col items-center justify-center text-gray-600"><ImageOff size={24} /></div>
                )}
                <div className="p-4 flex-1 flex flex-col justify-center">
                  <h3 className="font-bold text-white line-clamp-1 text-lg group-hover:text-blue-400 transition-colors">{movie.title || movie.original_title}</h3>
                  <p className="text-sm text-gray-400 line-clamp-1">{movie.original_title}</p>
                  <p className="text-sm text-blue-400 mt-3 flex items-center gap-1.5 font-medium"><Calendar size={14}/> {movie.release_date?.substring(0,4) || 'N/A'}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 animate-in fade-in slide-in-from-right-4 duration-500">
          <div className="md:col-span-1 space-y-4">
            {selectedMovie.poster_url ? (
               <img src={selectedMovie.poster_url} alt="Poster" className="w-full rounded-2xl shadow-2xl border border-gray-700" />
            ) : (
               <div className="w-full aspect-[2/3] bg-gray-900 rounded-2xl border border-gray-800 flex items-center justify-center text-gray-600"><ImageOff size={48} /></div>
            )}
            <h2 className="text-xl font-bold text-white text-center">{selectedMovie.title}</h2>
            <p className="text-gray-400 text-center">{selectedMovie.release_year}</p>
          </div>

          <div className="md:col-span-2 bg-gray-800 rounded-2xl border border-gray-700 p-6 sm:p-8 space-y-6 shadow-xl">
            <h3 className="text-lg font-semibold text-white border-b border-gray-700 pb-4">ให้คะแนน</h3>
            {people.length === 0 ? (
              <div className="text-center py-10 border-2 border-dashed border-gray-700 rounded-xl">
                <Users size={40} className="mx-auto text-gray-500 mb-3" />
                <p className="text-gray-400 mb-4">ยังไม่มีรายชื่อบุคคลในระบบ</p>
                <button onClick={() => navigate('/people')} className="text-blue-400 hover:text-blue-300 underline font-medium">ไปเพิ่มรายชื่อกันเลย</button>
              </div>
            ) : (
              <div className="space-y-3">
                {people.map(person => (
                  <div key={person.id} className="flex items-center justify-between p-4 bg-gray-900/50 hover:bg-gray-900 rounded-xl border border-gray-700/50 transition-colors">
                    <span className="font-medium text-gray-200">{person.name}</span>
                    <select 
                      value={scores[person.id] || ''}
                      onChange={e => handleScoreChange(person.id, e.target.value)}
                      className="bg-gray-800 border border-gray-600 text-white rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all cursor-pointer"
                    >
                      <option value="">- เลือกคะแนน -</option>
                      {Array.from({length: 20}, (_, i) => (i + 1) * 0.5).map(val => (
                        <option key={val} value={val}>{val.toFixed(1)}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            )}
            
            <div className="pt-6 border-t border-gray-700">
              <button 
                onClick={handleSaveMovie}
                disabled={submitting || people.length === 0}
                className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20"
              >
                {submitting ? <Loader2 className="animate-spin" size={20} /> : <CheckCircle2 size={20} />}
                {submitting ? 'กำลังบันทึก...' : 'บันทึกข้อมูลภาพยนตร์'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const Movies = () => {
  const navigate = useNavigate();
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('created_desc');
  const [page, setPage] = useState(1);
  const itemsPerPage = 8;

  const [movieToDelete, setMovieToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    loadMovies();
  }, []);

  const loadMovies = async () => {
    try {
      setLoading(true);
      const data = await dbService.getMoviesWithScores();
      setMovies(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = async () => {
    if (!movieToDelete) return;
    try {
      setIsDeleting(true);
      await dbService.deleteMovie(movieToDelete.id);
      setMovies(prev => prev.filter(m => m.id !== movieToDelete.id));
      setMovieToDelete(null);
    } catch (err) {
      console.error(err);
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredMovies = useMemo(() => {
    let result = [...movies];
    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      result = result.filter(m => m.title.toLowerCase().includes(lower) || (m.original_title && m.original_title.toLowerCase().includes(lower)));
    }
    result.sort((a, b) => {
      if (sortBy === 'created_desc') return new Date(b.created_at) - new Date(a.created_at);
      if (sortBy === 'created_asc') return new Date(a.created_at) - new Date(b.created_at);
      if (sortBy === 'title_asc') return a.title.localeCompare(b.title);
      if (sortBy === 'score_desc') return b.average_score - a.average_score;
      if (sortBy === 'score_asc') return a.average_score - b.average_score;
      if (sortBy === 'year_desc') return b.release_year - a.release_year;
      return 0;
    });
    return result;
  }, [movies, searchTerm, sortBy]);

  const paginatedMovies = filteredMovies.slice((page - 1) * itemsPerPage, page * itemsPerPage);
  const totalPages = Math.ceil(filteredMovies.length / itemsPerPage);

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 animate-in fade-in">
        <div>
          <h1 className="text-3xl font-bold text-white">Movies</h1>
          <p className="text-gray-400 mt-1">รายการภาพยนตร์ที่ให้คะแนนแล้ว ({filteredMovies.length})</p>
        </div>
        <button onClick={() => navigate('/add-movie')} className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-5 py-3 rounded-xl font-medium transition-all shadow-lg shadow-blue-500/20 active:scale-95">
          <PlusCircle size={20} /> Add Movie
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 animate-in fade-in">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
          <input 
            type="text" 
            placeholder="ค้นหาชื่อภาพยนตร์..." 
            value={searchTerm}
            onChange={e => { setSearchTerm(e.target.value); setPage(1); }}
            className="w-full bg-gray-900 border border-gray-700 text-white rounded-xl py-3 pl-12 pr-4 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all shadow-sm"
          />
        </div>
        <select 
          value={sortBy} 
          onChange={e => { setSortBy(e.target.value); setPage(1); }}
          className="bg-gray-900 border border-gray-700 text-white rounded-xl py-3 px-4 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 min-w-[200px] cursor-pointer shadow-sm"
        >
          <option value="created_desc">เพิ่มล่าสุด</option>
          <option value="created_asc">เพิ่มเก่าสุด</option>
          <option value="score_desc">คะแนนสูงสุด</option>
          <option value="score_asc">คะแนนต่ำสุด</option>
          <option value="title_asc">ชื่อเรื่อง (A-Z)</option>
          <option value="year_desc">ปีที่ฉาย (ใหม่-เก่า)</option>
        </select>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 animate-pulse mt-8">
          {Array.from({length: 8}).map((_, i) => (
             <div key={i} className="bg-gray-800 rounded-2xl border border-gray-700 h-[380px]"></div>
          ))}
        </div>
      ) : paginatedMovies.length === 0 ? (
        <div className="text-center py-24 bg-gray-800/30 rounded-3xl border-2 border-gray-700 border-dashed animate-in fade-in zoom-in-95 duration-300">
          <div className="bg-gray-800 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
             <Film size={32} className="text-gray-400" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">ไม่พบภาพยนตร์</h3>
          <p className="text-gray-400">ลองค้นหาด้วยคำอื่น หรือเพิ่มภาพยนตร์ใหม่เข้าระบบ</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {paginatedMovies.map((movie, idx) => (
            <div key={movie.id} className="bg-gray-800 rounded-2xl border border-gray-700 overflow-hidden flex flex-col group relative hover:-translate-y-2 hover:shadow-[0_10px_40px_-10px_rgba(0,0,0,0.5)] transition-all duration-300 animate-in fade-in" style={{ animationDelay: `${idx * 50}ms` }}>
              <div className="aspect-[2/3] w-full relative bg-gray-900 overflow-hidden">
                {movie.poster_url ? (
                  <img src={movie.poster_url} alt={movie.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-600"><ImageOff size={40} /></div>
                )}
                
                {/* Score Badge */}
                <div className="absolute top-3 right-3 bg-black/80 backdrop-blur-md px-3 py-1.5 rounded-xl flex items-center gap-1.5 border border-white/10 shadow-xl z-10">
                  <Star size={16} className="text-amber-400 fill-amber-400" />
                  <span className="font-bold text-white text-sm">{movie.average_score}</span>
                </div>
                
                {/* Overlay Actions */}
                <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-4 backdrop-blur-sm">
                   <button onClick={() => navigate(`/movies/${movie.id}`)} className="p-4 bg-blue-600 hover:bg-blue-500 text-white rounded-full transition-transform hover:scale-110 shadow-xl" title="ดูรายละเอียด"><Eye size={24}/></button>
                   <button onClick={() => setMovieToDelete(movie)} className="p-4 bg-red-600/90 hover:bg-red-500 text-white rounded-full transition-transform hover:scale-110 shadow-xl" title="ลบข้อมูล"><Trash2 size={24}/></button>
                </div>
              </div>
              <div className="p-5 flex flex-col flex-1 bg-gradient-to-b from-gray-800 to-gray-900">
                <h3 className="font-bold text-white line-clamp-1 text-lg mb-1 group-hover:text-blue-400 transition-colors">{movie.title}</h3>
                <div className="flex items-center justify-between text-sm text-gray-400 mt-auto pt-3 border-t border-gray-700/50">
                  <span className="bg-gray-800 px-2 py-1 rounded">{movie.release_year || '-'}</span>
                  <span className="flex items-center gap-1.5"><Users size={14}/> {movie.scores[0]?.count || 0} คน</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-4 pt-8">
          <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="px-5 py-2.5 bg-gray-800 hover:bg-gray-700 rounded-xl text-white disabled:opacity-50 transition-colors active:scale-95">ก่อนหน้า</button>
          <span className="text-gray-400 font-medium px-2">หน้า {page} / {totalPages}</span>
          <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)} className="px-5 py-2.5 bg-gray-800 hover:bg-gray-700 rounded-xl text-white disabled:opacity-50 transition-colors active:scale-95">ถัดไป</button>
        </div>
      )}

      {/* Delete Modal */}
      {movieToDelete && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-in fade-in duration-200">
          <div className="bg-gray-800 rounded-3xl border border-gray-700 p-8 w-full max-w-sm shadow-2xl animate-in zoom-in-95">
            <div className="w-16 h-16 bg-red-500/20 text-red-500 rounded-full flex items-center justify-center mb-6 mx-auto">
               <Trash2 size={32} />
            </div>
            <h3 className="text-2xl font-bold text-white mb-2 text-center">ลบภาพยนตร์?</h3>
            <p className="text-gray-400 mb-8 text-center leading-relaxed">คุณแน่ใจหรือไม่ที่จะลบ <br/><b className="text-white">{movieToDelete.title}</b>?<br/>ข้อมูลและคะแนนทั้งหมดจะถูกลบถาวร</p>
            <div className="flex gap-4">
              <button onClick={() => setMovieToDelete(null)} disabled={isDeleting} className="flex-1 px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl transition-colors active:scale-95 font-medium">ยกเลิก</button>
              <button onClick={confirmDelete} disabled={isDeleting} className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-500 text-white rounded-xl transition-colors active:scale-95 font-medium flex items-center justify-center gap-2">
                {isDeleting ? <Loader2 className="animate-spin" size={18} /> : null}
                {isDeleting ? 'กำลังลบ...' : 'ลบถาวร'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const MovieDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [isEditingScore, setIsEditingScore] = useState(false);
  const [editScores, setEditScores] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadMovieData();
  }, [id]);

  const loadMovieData = async () => {
    try {
      setLoading(true);
      const data = await dbService.getMovieById(id);
      setMovie(data);
      
      const scoreMap = {};
      data.scoreList.forEach(s => { scoreMap[s.person_id] = s.score; });
      setEditScores(scoreMap);
    } catch (err) {
      setError("ไม่พบข้อมูลภาพยนตร์หรือเกิดข้อผิดพลาด");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveScores = async () => {
    try {
      setIsSaving(true);
      const validScores = Object.entries(editScores)
        .filter(([_, val]) => val !== '' && val !== null)
        .map(([pId, val]) => ({ person_id: pId, score: parseFloat(val) }));

      if (validScores.length === 0) {
         setError("ต้องมีคะแนนอย่างน้อย 1 คน");
         setIsSaving(false);
         return;
      }

      for (const old of movie.scoreList) {
        const stillExists = validScores.find(v => v.person_id === old.person_id);
        if (!stillExists) await dbService.deleteScore(old.id);
      }

      for (const current of validScores) {
        const old = movie.scoreList.find(s => s.person_id === current.person_id);
        if (old) {
          if (old.score !== current.score) await dbService.updateScore(old.id, current.score);
        } else {
          await dbService.addScore({ movie_id: id, person_id: current.person_id, score: current.score });
        }
      }

      const sum = validScores.reduce((acc, curr) => acc + curr.score, 0);
      const newAvg = parseFloat((sum / validScores.length).toFixed(2));
      await dbService.updateMovieDetails(id, { average_score: newAvg });

      await loadMovieData();
      setIsEditingScore(false);
      setError('');
    } catch (err) {
      setError("เกิดข้อผิดพลาดในการบันทึกคะแนน: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto space-y-6 animate-pulse">
      <div className="w-32 h-6 bg-gray-800 rounded"></div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 mt-6">
         <div className="md:col-span-1 aspect-[2/3] bg-gray-800 rounded-2xl"></div>
         <div className="md:col-span-2 space-y-6">
            <div className="w-3/4 h-12 bg-gray-800 rounded-lg"></div>
            <div className="w-48 h-6 bg-gray-800 rounded"></div>
            <div className="w-32 h-20 bg-gray-800 rounded-xl mt-8"></div>
            <div className="space-y-3 mt-8">
               <div className="w-full h-4 bg-gray-800 rounded"></div>
               <div className="w-full h-4 bg-gray-800 rounded"></div>
               <div className="w-2/3 h-4 bg-gray-800 rounded"></div>
            </div>
            <div className="h-64 bg-gray-800 rounded-2xl mt-8"></div>
         </div>
      </div>
    </div>
  );

  if (error && !movie) return (
    <div className="p-10 max-w-lg mx-auto text-center mt-20 bg-gray-800/50 rounded-3xl border border-gray-700 animate-in fade-in">
      <AlertCircle size={48} className="mx-auto text-red-500 mb-4" />
      <h3 className="text-xl font-bold text-white mb-2">เกิดข้อผิดพลาด</h3>
      <p className="text-gray-400 mb-6">{error}</p>
      <button onClick={() => navigate('/movies')} className="bg-gray-700 hover:bg-gray-600 text-white px-6 py-2.5 rounded-xl transition-colors">กลับหน้าหลัก</button>
    </div>
  );
  if (!movie) return null;

  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <button onClick={() => navigate('/movies')} className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors w-fit group">
        <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform" /> กลับไปหน้ารวม
      </button>

      {error && isEditingScore && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl flex items-center gap-3">
          <AlertCircle size={20} /> <p>{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
        <div className="md:col-span-1">
          {movie.poster_url ? (
            <img src={movie.poster_url} alt={movie.title} className="w-full rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-gray-800" />
          ) : (
            <div className="w-full aspect-[2/3] bg-gray-900 rounded-2xl flex items-center justify-center border border-gray-800"><ImageOff size={48} className="text-gray-600"/></div>
          )}
        </div>

        <div className="md:col-span-2 space-y-8">
          <div>
            <h1 className="text-4xl md:text-5xl font-black text-white mb-3 leading-tight">{movie.title}</h1>
            <div className="flex flex-wrap items-center gap-4 text-gray-400 text-sm">
              <span className="bg-gray-800 px-3 py-1.5 rounded-lg border border-gray-700 font-medium">{movie.release_year || 'N/A'}</span>
              <span className="flex items-center gap-1.5"><Clock size={16}/>เพิ่มเมื่อ {new Date(movie.created_at).toLocaleDateString('th-TH')}</span>
            </div>
          </div>

          <div className="flex items-center gap-6">
             <div className="flex flex-col">
               <span className="text-gray-400 text-sm mb-1 uppercase tracking-wider font-semibold">Average Score</span>
               <div className="flex items-end gap-2 text-amber-400">
                 <Star fill="currentColor" size={48} className="drop-shadow-[0_0_15px_rgba(251,191,36,0.4)]" />
                 <span className="text-6xl font-black leading-none">{movie.average_score}</span>
                 <span className="text-2xl text-gray-500 mb-1 font-bold">/10</span>
               </div>
             </div>
          </div>

          <div>
             <h3 className="text-xl font-semibold text-white mb-3 flex items-center gap-2"><Film size={20} className="text-blue-400"/> เรื่องย่อ</h3>
             <p className="text-gray-300 leading-relaxed text-lg bg-gray-800/50 p-6 rounded-2xl border border-gray-700/50">{movie.overview || 'ไม่มีเรื่องย่อสำหรับภาพยนตร์เรื่องนี้'}</p>
          </div>

          <div className="bg-gray-800/80 backdrop-blur-md rounded-3xl border border-gray-700 p-6 md:p-8 shadow-xl">
            <div className="flex items-center justify-between mb-6">
               <h3 className="text-xl font-semibold text-white flex items-center gap-2"><Users size={20} className="text-purple-400"/> คะแนนรายบุคคล</h3>
               {!isEditingScore ? (
                 <button onClick={() => setIsEditingScore(true)} className="text-sm bg-gray-700 hover:bg-gray-600 text-white px-5 py-2.5 rounded-xl transition-all active:scale-95 font-medium shadow-sm">แก้ไขคะแนน</button>
               ) : (
                 <div className="flex gap-3">
                   <button onClick={() => setIsEditingScore(false)} className="text-sm text-gray-400 hover:text-white px-4 py-2.5 transition-colors">ยกเลิก</button>
                   <button onClick={handleSaveScores} disabled={isSaving} className="text-sm bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl transition-all active:scale-95 disabled:opacity-50 font-medium shadow-lg shadow-blue-500/20 flex items-center gap-2">
                     {isSaving ? <Loader2 size={16} className="animate-spin"/> : null}
                     {isSaving ? 'บันทึก...' : 'บันทึก'}
                   </button>
                 </div>
               )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {movie.scoreList.length === 0 && <div className="col-span-full text-center py-6 text-gray-500 border border-dashed border-gray-700 rounded-xl">ไม่มีข้อมูลผู้ให้คะแนน</div>}
              {movie.scoreList.map(score => (
                <div key={score.id} className="flex items-center justify-between p-4 bg-gray-900/80 rounded-xl border border-gray-700/50 hover:border-gray-600 transition-colors">
                  <span className="text-gray-200 font-medium text-lg">{score.people?.name || 'Unknown'}</span>
                  {!isEditingScore ? (
                    <span className="text-2xl font-bold text-white flex items-center gap-1.5"><Star size={18} className="text-amber-500"/>{score.score}</span>
                  ) : (
                    <select 
                      value={editScores[score.person_id] || ''}
                      onChange={e => setEditScores(prev => ({ ...prev, [score.person_id]: e.target.value }))}
                      className="bg-gray-800 border border-gray-600 text-white rounded-lg px-3 py-1.5 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 cursor-pointer"
                    >
                      <option value="">ลบ</option>
                      {Array.from({length: 20}, (_, i) => (i + 1) * 0.5).map(val => (
                        <option key={val} value={val}>{val.toFixed(1)}</option>
                      ))}
                    </select>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const People = () => {
  const [people, setPeople] = useState([]);
  const [newName, setNewName] = useState('');
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [editId, setEditId] = useState(null);
  const [editName, setEditName] = useState('');

  useEffect(() => { loadPeople(); }, []);

  const loadPeople = async () => {
    try {
      setInitialLoading(true);
      const data = await dbService.getPeople();
      setPeople(data || []);
    } catch (err) {
      setError("โหลดข้อมูลล้มเหลว ตรวจสอบการตั้งค่าฐานข้อมูล");
    } finally {
      setInitialLoading(false);
    }
  };

  const isDuplicate = (nameToCheck) => {
    return people.some(p => p.name.toLowerCase().trim() === nameToCheck.toLowerCase().trim());
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    const name = newName.trim();
    if (!name) return;
    if (isDuplicate(name)) { setError("ชื่อนี้มีอยู่ในระบบแล้ว"); return; }

    try {
      setLoading(true);
      setError('');
      const newPerson = await dbService.addPerson(name);
      setPeople([...people, newPerson].sort((a, b) => a.name.localeCompare(b.name)));
      setNewName('');
    } catch (err) {
      setError(err.message || "เกิดข้อผิดพลาดในการเพิ่มข้อมูล");
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (person) => {
    setEditId(person.id);
    setEditName(person.name);
    setError('');
  };

  const handleUpdate = async (id) => {
    const name = editName.trim();
    if (!name) { setEditId(null); return; }
    const person = people.find(p => p.id === id);
    if (person.name === name) { setEditId(null); return; }
    if (isDuplicate(name)) { setError("ชื่อนี้มีอยู่ในระบบแล้ว"); return; }

    try {
      setLoading(true);
      setError('');
      await dbService.updatePerson(id, name);
      setPeople(people.map(p => p.id === id ? { ...p, name } : p).sort((a, b) => a.name.localeCompare(b.name)));
      setEditId(null);
    } catch (err) {
      setError("เกิดข้อผิดพลาดในการแก้ไข");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      setLoading(true);
      await dbService.deletePerson(id);
      setPeople(people.filter(p => p.id !== id));
    } catch (err) {
      setError("เกิดข้อผิดพลาดในการลบ");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 md:p-10 max-w-3xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">People</h1>
        <p className="text-gray-400">จัดการรายชื่อสมาชิกหรือเพื่อนสำหรับให้คะแนน</p>
      </div>

      {error && <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl flex items-center gap-3 animate-in slide-in-from-top-2"><AlertCircle size={20} /> {error}</div>}

      <form onSubmit={handleAdd} className="flex flex-col sm:flex-row gap-3">
        <input 
          type="text" 
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="พิมพ์ชื่อบุคคล (เช่น พ่อ, แม่, พี่ชาย)..." 
          className="flex-1 bg-gray-900 border border-gray-700 text-white rounded-xl px-5 py-3.5 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all shadow-sm"
          disabled={loading || initialLoading}
        />
        <button type="submit" disabled={loading || !newName.trim() || initialLoading} className="px-8 py-3.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-medium transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20">
          {loading ? <Loader2 size={20} className="animate-spin" /> : <PlusCircle size={20} />} เพิ่ม
        </button>
      </form>

      <div className="bg-gray-800 rounded-3xl border border-gray-700 overflow-hidden shadow-xl">
        {initialLoading ? (
           <div className="p-12 text-center text-gray-500 flex flex-col items-center">
             <Loader2 size={32} className="animate-spin mb-4 text-blue-500" />
             กำลังโหลดรายชื่อ...
           </div>
        ) : people.length === 0 ? (
          <div className="p-16 text-center text-gray-500 flex flex-col items-center">
            <Users size={48} className="mb-4 opacity-40" />
            <p className="text-lg">ยังไม่มีรายชื่อในระบบ</p>
            <p className="text-sm mt-1">พิมพ์ชื่อด้านบนเพื่อเพิ่มรายชื่อแรก</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-700/50">
            {people.map((person) => (
              <li key={person.id} className="flex items-center justify-between p-5 hover:bg-gray-750/50 transition-colors group">
                {editId === person.id ? (
                  <input 
                    autoFocus
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="bg-gray-900 border border-blue-500 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500 w-full max-w-sm mr-4 transition-all"
                  />
                ) : (
                  <span className="text-gray-200 font-medium text-lg">{person.name}</span>
                )}
                
                <div className="flex items-center gap-3">
                  {editId === person.id ? (
                    <>
                      <button onClick={() => setEditId(null)} className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors">ยกเลิก</button>
                      <button onClick={() => handleUpdate(person.id)} className="px-4 py-2 text-sm bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-all active:scale-95 shadow-lg shadow-emerald-600/20">บันทึก</button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => startEdit(person)} className="p-2.5 bg-gray-700/50 hover:bg-blue-600 text-gray-400 hover:text-white rounded-lg transition-all opacity-100 sm:opacity-0 sm:group-hover:opacity-100"><SettingsIcon size={18} /></button>
                      <button onClick={() => handleDelete(person.id)} className="p-2.5 bg-gray-700/50 hover:bg-red-600 text-gray-400 hover:text-white rounded-lg transition-all opacity-100 sm:opacity-0 sm:group-hover:opacity-100"><Trash2 size={18} /></button>
                    </>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

const ImportExport = () => {
  const [exportStatus, setExportStatus] = useState({ loading: false, error: null, success: false });
  const [importStatus, setImportStatus] = useState({ loading: false, error: null, success: false });

  const handleExport = async () => {
    try {
      setExportStatus({ loading: true, error: null, success: false });
      
      const data = await dbService.exportDatabase();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `movie-ratings-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      setExportStatus({ loading: false, error: null, success: true });
      setTimeout(() => setExportStatus(prev => ({ ...prev, success: false })), 3000);
    } catch (error) {
      setExportStatus({ loading: false, error: error.message, success: false });
    }
  };

  const handleImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.type !== "application/json" && !file.name.endsWith('.json')) {
      setImportStatus({ loading: false, error: "กรุณาเลือกไฟล์ JSON เท่านั้น", success: false });
      e.target.value = '';
      return;
    }

    try {
      setImportStatus({ loading: true, error: null, success: false });
      
      const text = await file.text();
      const json = JSON.parse(text);

      await dbService.importDatabase(json);
      
      setImportStatus({ loading: false, error: null, success: true });
      setTimeout(() => setImportStatus(prev => ({ ...prev, success: false })), 3000);
    } catch (error) {
      setImportStatus({ loading: false, error: error.message || "เกิดข้อผิดพลาดในการอ่านไฟล์ JSON", success: false });
    }
    
    e.target.value = '';
  };

  return (
    <div className="p-6 md:p-10 text-gray-100 max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Import & Export</h1>
        <p className="text-gray-400">สำรองข้อมูลทั้งหมดหรือกู้คืนข้อมูลจากไฟล์ JSON</p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Export Card */}
        <div className="bg-gray-800 rounded-3xl border border-gray-700 p-8 flex flex-col items-center text-center space-y-4 shadow-xl hover:-translate-y-1 transition-transform duration-300">
          <div className="w-20 h-20 bg-blue-500/20 rounded-2xl flex items-center justify-center text-blue-400 mb-2 rotate-3">
            <Download size={40} />
          </div>
          <h2 className="text-2xl font-bold text-white">สำรองข้อมูล</h2>
          <p className="text-gray-400 text-sm leading-relaxed max-w-xs">
            ดาวน์โหลดข้อมูลทั้งหมด (รายชื่อ, ภาพยนตร์, คะแนน) ลงในอุปกรณ์ของคุณในรูปแบบไฟล์ JSON
          </p>
          
          <button 
            onClick={handleExport}
            disabled={exportStatus.loading}
            className="flex items-center gap-2 px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-medium transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed mt-6 w-full justify-center shadow-lg shadow-blue-600/20"
          >
            {exportStatus.loading ? <Loader2 size={20} className="animate-spin" /> : <FileJson size={20} />}
            {exportStatus.loading ? "กำลังสร้างไฟล์..." : "Export to JSON"}
          </button>

          {exportStatus.error && (
            <div className="flex items-center gap-3 text-red-400 bg-red-400/10 px-4 py-3 rounded-xl w-full text-sm animate-in zoom-in-95">
              <AlertCircle size={20} className="shrink-0" />
              <span className="text-left">{exportStatus.error}</span>
            </div>
          )}
          {exportStatus.success && (
            <div className="flex items-center justify-center gap-2 text-green-400 bg-green-400/10 px-4 py-3 rounded-xl w-full text-sm font-medium animate-in zoom-in-95">
              <CheckCircle2 size={20} /> สำรองข้อมูลสำเร็จ!
            </div>
          )}
        </div>

        {/* Import Card */}
        <div className="bg-gray-800 rounded-3xl border border-gray-700 p-8 flex flex-col items-center text-center space-y-4 shadow-xl hover:-translate-y-1 transition-transform duration-300">
          <div className="w-20 h-20 bg-emerald-500/20 rounded-2xl flex items-center justify-center text-emerald-400 mb-2 -rotate-3">
            <Upload size={40} />
          </div>
          <h2 className="text-2xl font-bold text-white">กู้คืนข้อมูล</h2>
          <p className="text-gray-400 text-sm leading-relaxed max-w-xs">
            นำเข้าข้อมูลจากไฟล์ JSON ที่เคยสำรองไว้ ข้อมูลเดิมที่มี ID ตรงกันจะถูกอัปเดตอัตโนมัติ
          </p>
          
          <label className={`flex items-center gap-2 px-8 py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-medium transition-all active:scale-95 cursor-pointer mt-6 w-full justify-center shadow-lg shadow-emerald-600/20 ${importStatus.loading ? 'opacity-50 pointer-events-none' : ''}`}>
            {importStatus.loading ? <Loader2 size={20} className="animate-spin" /> : <FileJson size={20} />}
            {importStatus.loading ? "กำลังนำเข้าข้อมูล..." : "Select JSON File"}
            <input 
              type="file" 
              accept=".json"
              className="hidden"
              onChange={handleImport}
              disabled={importStatus.loading}
            />
          </label>

          {importStatus.error && (
            <div className="flex items-center gap-3 text-red-400 bg-red-400/10 px-4 py-3 rounded-xl w-full text-sm animate-in zoom-in-95">
              <AlertCircle size={20} className="shrink-0" />
              <span className="text-left">{importStatus.error}</span>
            </div>
          )}
          {importStatus.success && (
            <div className="flex items-center justify-center gap-2 text-green-400 bg-green-400/10 px-4 py-3 rounded-xl w-full text-sm font-medium animate-in zoom-in-95">
              <CheckCircle2 size={20} /> กู้คืนข้อมูลเสร็จสมบูรณ์!
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const Settings = () => {
  const navigate = useNavigate();
  const [tmdbKey, setTmdbKey] = useState(localStorage.getItem('TMDB_API_KEY') || '');
  const [sbUrl, setSbUrl] = useState(localStorage.getItem('SUPABASE_URL') || '');
  const [sbKey, setSbKey] = useState(localStorage.getItem('SUPABASE_KEY') || '');
  const [status, setStatus] = useState({ type: '', msg: '' });
  const [isTesting, setIsTesting] = useState(false);

  const handleSave = () => {
    localStorage.setItem('TMDB_API_KEY', tmdbKey);
    localStorage.setItem('SUPABASE_URL', sbUrl);
    localStorage.setItem('SUPABASE_KEY', sbKey);
    setStatus({ type: 'success', msg: 'บันทึกการตั้งค่าเรียบร้อยแล้ว ระบบจะรีโหลด...' });
    setTimeout(() => {
      window.location.reload();
    }, 1500);
  };

  const handleTestConnections = async () => {
    setIsTesting(true);
    setStatus({ type: '', msg: '' });
    
    let tmdbOk = false;
    let sbOk = false;
    let errorMessage = '';

    // Test TMDB
    if (tmdbKey) {
      try {
        const res = await fetch(`https://api.themoviedb.org/3/authentication?api_key=${tmdbKey}`);
        const data = await res.json();
        if (data.success) {
          tmdbOk = true;
        } else {
          errorMessage += 'TMDB Key ไม่ถูกต้อง ';
        }
      } catch (e) {
        errorMessage += 'เชื่อมต่อ TMDB ไม่ได้ ';
      }
    } else {
       errorMessage += 'ไม่ได้ใส่ TMDB Key ';
    }

    // Test Supabase
    if (sbUrl && sbKey) {
      try {
        // ใช้ Supabase Client ชั่วคราวสำหรับการทดสอบ
        const tempClient = window.supabase.createClient(sbUrl, sbKey);
        const { error } = await tempClient.from('people').select('*', { count: 'exact', head: true });
        if (!error) {
          sbOk = true;
        } else {
          errorMessage += '| Supabase Error: ' + error.message;
        }
      } catch (e) {
        errorMessage += '| เชื่อมต่อ Supabase ไม่ได้ ';
      }
    } else {
        errorMessage += '| ไม่ได้ใส่ Supabase URL หรือ Key';
    }

    setIsTesting(false);

    if (tmdbOk && sbOk) {
      setStatus({ type: 'success', msg: 'การเชื่อมต่อทั้งหมดถูกต้อง! พร้อมใช้งาน' });
    } else if (tmdbOk) {
      setStatus({ type: 'warning', msg: 'TMDB เชื่อมต่อได้ แต่ Supabase มีปัญหา: ' + errorMessage });
    } else if (sbOk) {
      setStatus({ type: 'warning', msg: 'Supabase เชื่อมต่อได้ แต่ TMDB มีปัญหา: ' + errorMessage });
    } else {
      setStatus({ type: 'error', msg: 'การเชื่อมต่อล้มเหลว: ' + errorMessage });
    }
  };

  return (
    <div className="p-6 md:p-10 text-gray-100 max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Settings</h1>
        <p className="text-gray-400">ตั้งค่าระบบและการเชื่อมต่อ API ของคุณ</p>
      </div>

      {status.msg && (
        <div className={`p-4 rounded-xl flex items-center gap-3 animate-in zoom-in-95 ${status.type === 'success' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : status.type === 'error' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'}`}>
          {status.type === 'error' ? <AlertCircle size={20} /> : <CheckCircle2 size={20} />}
          <p>{status.msg}</p>
        </div>
      )}

      <div className="bg-gray-800 rounded-3xl border border-gray-700 p-6 sm:p-8 space-y-6 shadow-xl">
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">TMDB API Key</label>
          <input 
            type="text" 
            value={tmdbKey}
            onChange={e => setTmdbKey(e.target.value)}
            placeholder="ใส่ API Key ของ TMDB" 
            className="w-full bg-gray-900 border border-gray-700 rounded-xl px-5 py-3.5 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all" 
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">Supabase URL</label>
          <input 
            type="text" 
            value={sbUrl}
            onChange={e => setSbUrl(e.target.value)}
            placeholder="https://xxxx.supabase.co" 
            className="w-full bg-gray-900 border border-gray-700 rounded-xl px-5 py-3.5 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all" 
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">Supabase Anon Key</label>
          <input 
            type="password" 
            value={sbKey}
            onChange={e => setSbKey(e.target.value)}
            placeholder="ใส่ API Key ของ Supabase" 
            className="w-full bg-gray-900 border border-gray-700 rounded-xl px-5 py-3.5 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all" 
          />
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 pt-4">
          <button 
            onClick={handleSave} 
            className="flex-1 px-6 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-medium transition-all active:scale-95 shadow-lg shadow-blue-600/20"
          >
            บันทึกการตั้งค่า
          </button>
          <button 
            onClick={handleTestConnections} 
            disabled={isTesting}
            className="flex-1 px-6 py-4 bg-gray-700 hover:bg-gray-600 text-white rounded-xl font-medium transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isTesting ? <Loader2 className="animate-spin" size={20} /> : null}
            {isTesting ? 'กำลังทดสอบ...' : 'ทดสอบการเชื่อมต่อ'}
          </button>
        </div>
      </div>

      <div className="bg-gray-800 rounded-3xl border border-gray-700 p-6 sm:p-8 shadow-xl">
        <h2 className="text-xl font-bold text-white mb-2">Data Management</h2>
        <p className="text-gray-400 mb-6">สำรองข้อมูลทั้งหมดหรือกู้คืนข้อมูลจากไฟล์ JSON</p>
        <button 
          onClick={() => navigate('/import-export')} 
          className="px-6 py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-medium transition-all active:scale-95 flex items-center justify-center gap-2 w-full sm:w-auto shadow-lg shadow-emerald-600/20"
        >
          <FileJson size={20} /> จัดการข้อมูล Import / Export
        </button>
      </div>
    </div>
  );
};

const Sidebar = () => {
  const navItems = [
    { path: '/', name: 'Dashboard', icon: <Home size={20} /> },
    { path: '/add-movie', name: 'Add Movie', icon: <PlusCircle size={20} /> },
    { path: '/movies', name: 'Movies', icon: <Film size={20} /> },
    { path: '/people', name: 'People', icon: <Users size={20} /> },
    { path: '/import-export', name: 'Import / Export', icon: <Download size={20} /> },
    { path: '/settings', name: 'Settings', icon: <SettingsIcon size={20} /> },
  ];

  return (
    <div className="w-64 bg-gray-900/50 border-r border-gray-800 flex flex-col h-screen sticky top-0 backdrop-blur-xl">
      <div className="p-6 border-b border-gray-800">
        <h1 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
          <div className="bg-gradient-to-br from-amber-400 to-orange-500 p-1.5 rounded-lg">
            <Star className="text-gray-900 fill-gray-900" size={20} />
          </div>
          Family Ratings
        </h1>
      </div>
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium ${
                isActive 
                  ? 'bg-blue-600/15 text-blue-400 shadow-inner' 
                  : 'text-gray-400 hover:bg-gray-800/80 hover:text-gray-200'
              }`
            }
          >
            {item.icon}
            {item.name}
          </NavLink>
        ))}
      </nav>
      <div className="p-6 border-t border-gray-800 text-xs text-center text-gray-500 font-medium">
        v1.0.0
      </div>
    </div>
  );
};

const Layout = ({ children }) => {
  return (
    <div className="flex min-h-screen bg-[#0f1115] text-gray-200 font-sans selection:bg-blue-500/30">
      <div className="hidden md:block z-40">
        <Sidebar />
      </div>
      <main className="flex-1 overflow-x-hidden pb-24 md:pb-0 relative">
        {/* Subtle Background Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-blue-500/10 blur-[120px] rounded-full pointer-events-none -z-10"></div>
        {children}
      </main>
      
      {/* Mobile Bottom Nav */}
      <div className="md:hidden fixed bottom-0 w-full bg-gray-900/90 backdrop-blur-lg border-t border-gray-800 flex justify-around p-3 z-50 shadow-[0_-10px_40px_rgba(0,0,0,0.3)] pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
         <NavLink to="/" className={({isActive}) => `p-3 rounded-xl transition-all ${isActive ? 'text-blue-400 bg-blue-500/15' : 'text-gray-400 hover:text-gray-200'}`}><Home size={24}/></NavLink>
         <NavLink to="/add-movie" className={({isActive}) => `p-3 rounded-xl transition-all ${isActive ? 'text-blue-400 bg-blue-500/15' : 'text-gray-400 hover:text-gray-200'}`}><PlusCircle size={24}/></NavLink>
         <NavLink to="/movies" className={({isActive}) => `p-3 rounded-xl transition-all ${isActive ? 'text-blue-400 bg-blue-500/15' : 'text-gray-400 hover:text-gray-200'}`}><Film size={24}/></NavLink>
         <NavLink to="/people" className={({isActive}) => `p-3 rounded-xl transition-all ${isActive ? 'text-blue-400 bg-blue-500/15' : 'text-gray-400 hover:text-gray-200'}`}><Users size={24}/></NavLink>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/add-movie" element={<AddMovie />} />
          <Route path="/movies" element={<Movies />} />
          <Route path="/movies/:id" element={<MovieDetail />} />
          <Route path="/people" element={<People />} />
          <Route path="/import-export" element={<ImportExport />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </Layout>
    </Router>
  );
}