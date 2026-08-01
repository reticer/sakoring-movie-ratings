import { supabase } from '../api/supabaseClient';
import type { Person, Movie, DatabaseExport } from '../types';

export const dbService = {
  getPeople: async (): Promise<Person[]> => {
    const { data, error } = await supabase.from('people').select('*').order('name');
    if (error) throw error;
    return data;
  },
  addPerson: async (name: string): Promise<Person> => {
    const { data, error } = await supabase.from('people').insert([{ name }]).select();
    if (error) throw error;
    return data[0];
  },
  updatePerson: async (id: number, name: string): Promise<boolean> => {
    const { error } = await supabase.from('people').update({ name }).eq('id', id);
    if (error) throw error;
    return true;
  },
  deletePerson: async (id: number): Promise<boolean> => {
    const { error } = await supabase.from('people').delete().eq('id', id);
    if (error) throw error;
    return true;
  },
  checkMovieExistsByTmdbId: async (tmdbId: number): Promise<boolean> => {
    const { data, error } = await supabase.from('movies').select('id').eq('tmdb_id', tmdbId).maybeSingle();
    if (error) throw error;
    return !!data;
  },
  addMovieWithScores: async (movieData: Partial<Movie>, scoresData: { person_id: number, score: number, comment?: string }[]): Promise<boolean> => {
    const { data: movie, error: movieError } = await supabase.from('movies').insert([movieData]).select().single();
    if (movieError) throw movieError;
    
    const scoresToInsert = scoresData.map(s => ({ ...s, movie_id: movie.id, created_at: new Date().toISOString() }));
    const { error: scoresError } = await supabase.from('scores').insert(scoresToInsert);
    
    if (scoresError) {
      console.warn("Failed to bulk insert scores with comment/created_at, falling back...", scoresError.message);
      const fallbackScoresToInsert = scoresData.map(({comment, ...rest}) => ({ ...rest, movie_id: movie.id, created_at: new Date().toISOString() }));
      const { error: fallbackError } = await supabase.from('scores').insert(fallbackScoresToInsert);
      
      if (fallbackError) {
         console.warn("Failed again, falling back to minimal payload without created_at...", fallbackError.message);
         const minimalScoresToInsert = scoresData.map(({comment, ...rest}) => ({ ...rest, movie_id: movie.id }));
         const { error: finalError } = await supabase.from('scores').insert(minimalScoresToInsert);
         if (finalError) {
           await supabase.from('movies').delete().eq('id', movie.id);
           throw finalError;
         }
      }
    }
    return true;
  },
  getMoviesWithScores: async (): Promise<Movie[]> => {
    let movies = [];
    const { data: dataWithComments, error: errComments } = await supabase.from('movies').select(`*, scores(id, score, comment, people(name))`).order('created_at', { ascending: false });
    
    if (errComments) {
      console.warn("Failed to fetch movies with comments, falling back:", errComments.message);
      const { data: dataFallback, error: errFallback } = await supabase.from('movies').select(`*, scores(id, score, people(name))`).order('created_at', { ascending: false });
      if (errFallback) throw errFallback;
      movies = dataFallback;
    } else {
      movies = dataWithComments;
    }
    
    return movies as Movie[];
  },
  getMovieById: async (id: number): Promise<Movie> => {
    const { data: movie, error: movieError } = await supabase.from('movies').select('*').eq('id', id).single();
    if (movieError) throw movieError;

    let scores = [];
    const { data: scoresWithComment, error: scoresErrorWithComment } = await supabase.from('scores').select(`id, score, person_id, comment, people(name)`).eq('movie_id', id);
    
    if (scoresErrorWithComment) {
      console.warn("Could not fetch comment column, falling back to basic score fetch:", scoresErrorWithComment.message);
      const { data: fallbackScores, error: fallbackError } = await supabase.from('scores').select(`id, score, person_id, people(name)`).eq('movie_id', id);
      if (fallbackError) throw fallbackError;
      scores = fallbackScores || [];
    } else {
      scores = scoresWithComment || [];
    }

    return { ...movie, scoreList: scores } as Movie;
  },
  updateMovieDetails: async (id: number, updates: Partial<Movie>): Promise<boolean> => {
    const { error } = await supabase.from('movies').update(updates).eq('id', id);
    if (error) throw error;
    return true;
  },
  deleteMovie: async (id: number): Promise<boolean> => {
    const { error } = await supabase.from('movies').delete().eq('id', id);
    if (error) throw error;
    return true;
  },
  addScore: async (scoreData: { movie_id: number, person_id: number, score: number, comment?: string }): Promise<boolean> => {
    const { error: insertError } = await supabase.from('scores').insert([{ ...scoreData, created_at: new Date().toISOString() }]);
    
    if (insertError) {
      console.warn("Failed to insert score with comment/created_at, falling back to basic insert:", insertError.message);
      const { comment, ...basicScoreData } = scoreData;
      const { error: fallbackError } = await supabase.from('scores').insert([{ ...basicScoreData, created_at: new Date().toISOString() }]);
      
      if (fallbackError) {
         console.warn("Failed again, falling back to minimal payload without created_at:", fallbackError.message);
         const { error: finalError } = await supabase.from('scores').insert([basicScoreData]);
         if (finalError) throw finalError;
      }
    }
    return true;
  },
  updateScore: async (id: number, score: number): Promise<boolean> => {
    const { error } = await supabase.from('scores').update({ score }).eq('id', id);
    if (error) throw error;
    return true;
  },
  deleteScore: async (id: number): Promise<boolean> => {
    const { error } = await supabase.from('scores').delete().eq('id', id);
    if (error) throw error;
    return true;
  },
  exportDatabase: async (): Promise<DatabaseExport> => {
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
  importDatabase: async (parsedData: any): Promise<boolean> => {
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
