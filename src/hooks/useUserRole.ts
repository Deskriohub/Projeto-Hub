import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { AppRole } from "@/config/permissions";

export function useUserRole() {
  const { user } = useAuth();
  // Guardamos para QUAL usuário a role foi carregada. Assim "loading" é derivado
  // e fica verdadeiro de forma síncrona enquanto a role do usuário atual não chegou
  // (evita o flicker que jogava o usuário para /unauthorized ao atualizar a página).
  const [data, setData] = useState<{ role: AppRole; loadedFor: string | null }>({
    role: "geral",
    loadedFor: null,
  });

  useEffect(() => {
    if (!user) {
      setData({ role: "geral", loadedFor: null });
      return;
    }
    let cancelled = false;
    (async () => {
      let role: AppRole = "geral";
      try {
        const { data: row, error } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id)
          .maybeSingle();
        if (!error && row) role = row.role as AppRole;
      } catch {
        /* fallback geral */
      }
      if (!cancelled) setData({ role, loadedFor: user.id });
    })();
    return () => { cancelled = true; };
  }, [user?.id]);

  // Há usuário logado, mas ainda não terminamos de buscar a role DELE → continua carregando.
  const loading = user ? data.loadedFor !== user.id : false;

  return { role: data.role, loading };
}
