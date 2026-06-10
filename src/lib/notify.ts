import { supabase } from "@/integrations/supabase/client";

interface NotifyInput {
  titulo: string;
  descricao?: string | null;
  tipo?: string;
  link?: string | null;
}

/**
 * Cria notificações na tela para um ou mais usuários.
 * Ignora ids vazios e duplicados. Não notifica ninguém se a lista ficar vazia.
 */
export async function notificar(userIds: (string | null | undefined)[], n: NotifyInput) {
  const unique = Array.from(new Set(userIds.filter(Boolean))) as string[];
  if (unique.length === 0) return;
  const rows = unique.map((uid) => ({
    user_id: uid,
    titulo: n.titulo,
    descricao: n.descricao ?? null,
    tipo: n.tipo ?? "geral",
    link: n.link ?? null,
    lida: false,
  }));
  await supabase.from("notificacoes").insert(rows);
}
