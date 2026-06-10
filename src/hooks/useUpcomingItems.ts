import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface UpcomingItem {
  id: string;
  tipo: "evento" | "aviso" | "reuniao";
  titulo: string;
  data: string;          // YYYY-MM-DD
  hora?: string | null;  // HH:MM
  link?: string | null;
  rota?: string | null;  // navegação ao clicar
}

const DAYS_AHEAD = 7;

function toDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function useUpcomingItems() {
  const { user } = useAuth();
  const [items, setItems] = useState<UpcomingItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchItems = useCallback(async () => {
    if (!user) return;
    const now = new Date();
    const today = toDateStr(now);
    const end = new Date(now);
    end.setDate(end.getDate() + DAYS_AHEAD);
    const endStr = toDateStr(end);

    const [evRes, avRes, reRes] = await Promise.all([
      supabase
        .from("eventos")
        .select("*")
        .gte("data_inicio", today)
        .lte("data_inicio", endStr),
      supabase
        .from("avisos")
        .select("*"),
      supabase
        .from("one_on_one")
        .select("id, data_reuniao, liderado_nome")
        .or(`gestor_id.eq.${user.id},liderado_id.eq.${user.id}`)
        .gte("data_reuniao", today)
        .lte("data_reuniao", endStr),
    ]);

    const result: UpcomingItem[] = [];

    if (!evRes.error && evRes.data) {
      for (const e of evRes.data as any[]) {
        result.push({
          id: `ev-${e.id}`,
          tipo: "evento",
          titulo: e.titulo,
          data: e.data_inicio,
          hora: e.dia_todo ? null : (e.hora_inicio?.slice(0, 5) ?? null),
        });
      }
    }

    if (!avRes.error && avRes.data) {
      for (const a of avRes.data as any[]) {
        if (!a.data_inicio || a.data_inicio < today || a.data_inicio > endStr) continue;
        // respeita direcionamento por pessoas
        if (a.destinatarios && a.destinatarios.length > 0 && !a.destinatarios.includes(user.id)) continue;
        result.push({
          id: `av-${a.id}`,
          tipo: "aviso",
          titulo: a.titulo,
          data: a.data_inicio,
          link: a.link ?? null,
        });
      }
    }

    if (!reRes.error && reRes.data) {
      for (const r of reRes.data as any[]) {
        result.push({
          id: `re-${r.id}`,
          tipo: "reuniao",
          titulo: `1:1 — ${r.liderado_nome}`,
          data: r.data_reuniao,
          rota: `/meus-one-on-one/${r.id}`,
        });
      }
    }

    result.sort((a, b) => a.data.localeCompare(b.data));
    setItems(result);
    setLoading(false);
  }, [user?.id]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const todayStr = toDateStr(new Date());
  const todayItems = items.filter((i) => i.data === todayStr);

  return { items, todayItems, loading, refetch: fetchItems, todayStr };
}
