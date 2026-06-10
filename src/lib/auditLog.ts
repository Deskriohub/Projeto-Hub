import { supabase } from "@/integrations/supabase/client";

interface AuditOptions {
  detalhes?: string;
  antes?: string | null;
  depois?: string | null;
}

/**
 * Registra uma ação na auditoria.
 * Para edições, informe `antes` e `depois` para registrar o histórico da mudança.
 * Para criações, informe só `depois`. Para exclusões, informe só `antes`.
 */
export async function logAudit(
  userId: string,
  userNome: string,
  acao: string,
  modulo: string,
  options?: string | AuditOptions
) {
  // Compatível com a chamada antiga: logAudit(id, nome, acao, modulo, "detalhes")
  const opts: AuditOptions = typeof options === "string" ? { detalhes: options } : (options ?? {});

  await supabase.from("auditoria").insert({
    user_id: userId,
    user_nome: userNome,
    acao,
    modulo,
    detalhes: opts.detalhes ?? null,
    antes: opts.antes ?? null,
    depois: opts.depois ?? null,
  });
}
