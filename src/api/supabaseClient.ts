import { createClient } from '@supabase/supabase-js';

const envUrl = import.meta.env.VITE_SUPABASE_URL || '';
const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

const storedUrl = localStorage.getItem('SUPABASE_URL') || envUrl;
const storedKey = localStorage.getItem('SUPABASE_KEY') || envKey;

// Ensure we have a valid URL format to prevent createClient from throwing on load
const isValidUrl = (url: string) => {
  try {
    new URL(url);
    return true;
  } catch (e) {
    return false;
  }
};

const finalUrl = isValidUrl(storedUrl) ? storedUrl : 'https://placeholder.supabase.co';
const finalKey = storedKey || 'placeholder-key';

export const supabase = createClient(finalUrl, finalKey);
