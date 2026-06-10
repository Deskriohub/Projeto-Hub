import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface TeamProfile {
  id: string;
  full_name: string | null;
  email: string | null;
}

/**
 * Pessoas que o admin atual pode escolher nos seletores (o time dele).
 * - Admin de time: só os liderados com gestor_id = ele.
 * - Dono da plataforma (is_owner): todos.
 * - Enquanto o SQL de times não roda (colunas ausentes), não restringe (mostra todos).
 */
export function useTeamProfiles(opts?: { includeSelf?: boolean }) {
  const { user } = useAuth();
  const includeSelf = opts?.includeSelf ?? false;
  const [profiles, setProfiles] = useState<TeamProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOwner, setIsOwner] = useState(false);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data: me, error: meErr } = await supabase
        .from("profiles").select("is_owner").eq("id", user.id).maybeSingle();
      // Se a coluna ainda não existe (SQL não rodado), não restringe.
      const owner = meErr ? true : !!(me as { is_owner?: boolean } | null)?.is_owner;

      let query = supabase.from("profiles").select("id, full_name, email").order("full_name");
      if (!owner) query = query.eq("gestor_id", user.id);
      const { data, error } = await query;
      if (cancelled) return;

      // Fallback de segurança: se o filtro por gestor_id falhar (coluna ausente), traz todos.
      let list = (data as TeamProfile[]) ?? [];
      if (error) {
        const { data: all } = await supabase.from("profiles").select("id, full_name, email").order("full_name");
        list = (all as TeamProfile[]) ?? [];
      }
      if (!includeSelf) list = list.filter((p) => p.id !== user.id);

      setIsOwner(owner);
      setProfiles(list);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [user?.id, includeSelf]);

  return { profiles, loading, isOwner };
}
