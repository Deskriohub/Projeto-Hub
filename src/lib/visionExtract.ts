import { supabase } from "@/integrations/supabase/client";

/**
 * Envia imagens (data URLs) para a edge function que usa OCR/visão (Pixtral)
 * e retorna o texto extraído. Usado para PDFs com imagem e arquivos de imagem.
 */
export async function extrairComVisao(images: string[], nome: string): Promise<string> {
  const { data: { session } } = await supabase.auth.getSession();
  const res = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/extrair-documento`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${session?.access_token}`,
        "apikey": import.meta.env.VITE_SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({ images, nome }),
    },
  );
  if (!res.ok) {
    const e = await res.json().catch(() => ({}));
    throw new Error(e.error || `Erro ao ler com IA (HTTP ${res.status})`);
  }
  const data = await res.json();
  return (data.texto || "").trim();
}
