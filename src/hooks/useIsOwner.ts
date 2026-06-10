import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

/** True somente para o dono da plataforma (profiles.is_owner). */
export function useIsOwner() {
  const { user } = useAuth();
  const [isOwner, setIsOwner] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setIsOwner(false); setLoading(false); return; }
    let cancelled = false;
    supabase.from("profiles").select("is_owner").eq("id", user.id).maybeSingle()
      .then(({ data }) => {
        if (cancelled) return;
        setIsOwner(!!(data as { is_owner?: boolean } | null)?.is_owner);
        setLoading(false);
      });
    return () => { cancelled = true; };
  }, [user?.id]);

  return { isOwner, loading };
}
