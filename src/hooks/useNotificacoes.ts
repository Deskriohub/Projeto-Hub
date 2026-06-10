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

  // Atualiza periodicamente para pegar novas notificações
  useEffect(() => {
    const id = setInterval(() => { fetchNotificacoes(); }, 60000);
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
