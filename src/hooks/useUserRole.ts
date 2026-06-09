import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { AppRole } from "@/config/permissions";

export function useUserRole() {
  const { user } = useAuth();
  const [role, setRole] = useState<AppRole>("geral");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setRole("geral"); setLoading(false); return; }
    const fetchRole = async () => {
      try {
        const { data, error } = await supabase
          .from("user_roles").select("role").eq("user_id", user.id).maybeSingle();
        if (!error && data) setRole(data.role as AppRole);
      } catch { /* fallback geral */ }
      finally { setLoading(false); }
    };
    fetchRole();
  }, [user]);

  return { role, loading };
}
