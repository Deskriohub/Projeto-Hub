import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface Profile {
  full_name: string | null;
  avatar_url: string | null;
}

export function useProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    if (!user) { setProfile(null); return; }
    supabase
      .from("profiles")
      .select("full_name, avatar_url")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (!error) {
          setProfile(data ?? null);
        } else {
          // avatar_url column may not exist yet — fallback to name only
          supabase
            .from("profiles")
            .select("full_name")
            .eq("id", user.id)
            .maybeSingle()
            .then(({ data: d2 }) => {
              setProfile(d2 ? { full_name: d2.full_name, avatar_url: null } : null);
            });
        }
      });
  }, [user]);

  const fullName =
    profile?.full_name ||
    user?.user_metadata?.full_name ||
    "Usuário";

  const firstName = fullName.split(" ")[0];

  const initials = fullName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  const avatarUrl = profile?.avatar_url ?? null;

  return { fullName, firstName, initials, avatarUrl };
}
