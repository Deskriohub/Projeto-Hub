import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

// Sem env não dá pra criar o cliente — em vez de tela branca, mostra o motivo.
if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
  const faltando = [
    !SUPABASE_URL && 'VITE_SUPABASE_URL',
    !SUPABASE_PUBLISHABLE_KEY && 'VITE_SUPABASE_ANON_KEY',
  ].filter(Boolean).join(' e ');
  const msg =
    `Configuração ausente: defina ${faltando} no arquivo .env.local ` +
    `(valores em Supabase → Project Settings → API) e reinicie o "npm run dev".`;
  // eslint-disable-next-line no-console
  console.error('[DeskRio] ' + msg);
  if (typeof document !== 'undefined') {
    document.documentElement.innerHTML =
      `<body style="font-family:system-ui,sans-serif;padding:2rem;max-width:640px;margin:0 auto;color:#1f2937">` +
      `<h1 style="font-size:1.1rem;color:#b91c1c">Variáveis de ambiente faltando</h1>` +
      `<p style="font-size:.9rem;line-height:1.5">${msg}</p>` +
      `<pre style="background:#f3f4f6;padding:1rem;border-radius:8px;font-size:.8rem">VITE_SUPABASE_URL=https://SEU_PROJECT_ID.supabase.co\nVITE_SUPABASE_ANON_KEY=sua_anon_key</pre>` +
      `</body>`;
  }
  throw new Error(msg);
}

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
