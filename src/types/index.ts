export interface Person {
  id: number;
  name: string;
  created_at?: string;
}

export interface Score {
  id: number;
  movie_id: number;
  person_id: number;
  score: number;
  created_at?: string;
  people?: { name: string };
  count?: number; // Sometimes returned as count from Supabase
}

export interface Movie {
  id: number;
  tmdb_id?: number;
  title: string;
  original_title?: string;
  release_year?: number;
  poster_url?: string;
  overview?: string;
  average_score?: number;
  created_at: string;
  scores?: { count: number }[];
  scoreList?: Score[]; 
}

export interface DatabaseExport {
  app: string;
  export_date: string;
  version: string;
  data: {
    people: Person[];
    movies: Movie[];
    scores: Score[];
  };
}
