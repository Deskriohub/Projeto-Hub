import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL ?? "https://ctsoutcpncmfbsgidrvq.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY ?? "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN0c291dGNwbmNtZmJzZ2lkcnZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEwMjU0ODksImV4cCI6MjA5NjYwMTQ4OX0.sts6Q32Laa2aDaaNrS-udzP9ZriSScq93o9mYkQHM18";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});
