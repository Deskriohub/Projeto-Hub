import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface Notificacao {
  id: string;
  titulo: string;
  descricao: string | null;
  tipo: string;
  link: string | null;
  lida: boolean;
  created_at: string;
}

export function useNotificacoes() {
  const { user } = useAuth();
  const [items, setItems] = useState<Notificacao[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotificacoes = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("notificacoes")
      .select("id, titulo, descricao, tipo, link, lida, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50);
    setItems((data as Notificacao[]) || []);
    setLoading(false);
  }, [user?.id]);

  useEffect(() => { fetchNotificacoes(); }, [fetchNotificacoes]);

  // Tempo real: novas notificações aparecem na hora (sem esperar o polling)
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`notif-${user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notificacoes", filter: `user_id=eq.${user.id}` },
        () => { fetchNotificacoes(); },
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user?.id, fetchNotificacoes]);

  // Fallback: atualiza a cada 20s caso o tempo real não esteja ativo
  useEffect(() => {
    const id = setInterval(() => { fetchNotificacoes(); }, 20000);
    return () => clearInterval(id);
  }, [fetchNotificacoes]);

  const naoLidas = items.filter((n) => !n.lida).length;

  const marcarLida = async (id: string) => {
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, lida: true } : n)));
    await supabase.from("notificacoes").update({ lida: true }).eq("id", id);
  };

  const marcarTodasLidas = async () => {
    if (!user) return;
    setItems((prev) => prev.map((n) => ({ ...n, lida: true })));
    await supabase.from("notificacoes").update({ lida: true }).eq("user_id", user.id).eq("lida", false);
  };

  return { items, naoLidas, loading, marcarLida, marcarTodasLidas, refetch: fetchNotificacoes };
}
