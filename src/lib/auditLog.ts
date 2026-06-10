import { supabase } from "@/integrations/supabase/client";

export async function logAudit(
  userId: string,
  userNome: string,
  acao: string,
  modulo: string,
  detalhes?: string
) {
  await supabase.from("auditoria").insert({
    user_id: userId,
    user_nome: userNome,
    acao,
    modulo,
    detalhes: detalhes ?? null,
  });
}
