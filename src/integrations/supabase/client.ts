import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL!;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY!;

// Lê de sessionStorage primeiro; cai no localStorage se "Lembrar-me" estava ativo.
// Escreve em ambos apenas quando rememberMe=true (flag 'deskrio_remember_me').
const authStorage = {
  getItem: (key: string) =>
    sessionStorage.getItem(key) ?? localStorage.getItem(key),
  setItem: (key: string, value: string) => {
    sessionStorage.setItem(key, value);
    if (localStorage.getItem("deskrio_remember_me") === "true") {
      localStorage.setItem(key, value);
    }
  },
  removeItem: (key: string) => {
    sessionStorage.removeItem(key);
    localStorage.removeItem(key);
  },
};

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: authStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});
