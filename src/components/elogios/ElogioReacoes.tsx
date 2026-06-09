import { useEffect, useState, useCallback } from "react";
import { Smile } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const REACTION_EMOJIS = ["❤️", "👏", "🔥", "😂", "🌟", "🚀"];

interface Reacao {
  id: string;
  elogio_id: string;
  user_id: string;
  emoji: string;
}

interface Props {
  elogioId: string;
}

export const ElogioReacoes = ({ elogioId }: Props) => {
  const { user } = useAuth();
  const [reacoes, setReacoes] = useState<Reacao[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [namesByUser, setNamesByUser] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    const { data } = await supabase
      .from("elogio_reacoes")
      .select("id, elogio_id, user_id, emoji")
      .eq("elogio_id", elogioId);
    const list = (data as Reacao[]) || [];
    setReacoes(list);

    const missing = Array.from(new Set(list.map((r) => r.user_id))).filter(
      (uid) => !(uid in namesByUser),
    );
    if (missing.length > 0) {
      const { data: profs } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", missing);
      if (profs) {
        setNamesByUser((prev) => {
          const next = { ...prev };
          for (const p of profs as { id: string; full_name: string | null }[]) {
            next[p.id] = p.full_name || "Usuário";
          }
          return next;
        });
      }
    }
  }, [elogioId, namesByUser]);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [elogioId]);

  const toggle = async (emoji: string) => {
    if (!user) return;
    const mine = reacoes.find((r) => r.user_id === user.id && r.emoji === emoji);
    if (mine) {
      const { error } = await supabase.from("elogio_reacoes").delete().eq("id", mine.id);
      if (error) {
        toast({ title: "Erro ao remover reação", description: error.message, variant: "destructive" });
        return;
      }
      setReacoes((prev) => prev.filter((r) => r.id !== mine.id));
    } else {
      const { data, error } = await supabase
        .from("elogio_reacoes")
        .insert({ elogio_id: elogioId, user_id: user.id, emoji })
        .select()
        .maybeSingle();
      if (error) {
        toast({ title: "Erro ao reagir", description: error.message, variant: "destructive" });
        return;
      }
      if (data) {
        setReacoes((prev) => [...prev, data as Reacao]);
        if (!(user.id in namesByUser)) {
          const { data: me } = await supabase
            .from("profiles")
            .select("id, full_name")
            .eq("id", user.id)
            .maybeSingle();
          if (me) {
            setNamesByUser((prev) => ({
              ...prev,
              [me.id]: me.full_name || "Usuário",
            }));
          }
        }
      }
    }
  };

  const handlePick = async (emoji: string) => {
    setPickerOpen(false);
    await toggle(emoji);
  };

  // Group reactions by emoji, only those with at least one
  const groups = REACTION_EMOJIS
    .map((emoji) => ({
      emoji,
      list: reacoes.filter((r) => r.emoji === emoji),
    }))
    .filter((g) => g.list.length > 0);

  return (
    <TooltipProvider delayDuration={150}>
      <div className="flex flex-wrap items-center gap-1.5 mt-3">
        <Popover open={pickerOpen} onOpenChange={setPickerOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              className={cn(
                "inline-flex h-7 w-7 items-center justify-center rounded-full border border-border bg-background text-muted-foreground transition-opacity hover:bg-accent/40 hover:text-foreground",
                "opacity-0 group-hover:opacity-100 focus:opacity-100 data-[state=open]:opacity-100",
              )}
              aria-label="Adicionar reação"
            >
              <Smile className="h-4 w-4" />
            </button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-auto p-1.5">
            <div className="flex gap-1">
              {REACTION_EMOJIS.map((emoji) => {
                const active =
                  !!user && reacoes.some((r) => r.user_id === user.id && r.emoji === emoji);
                return (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => handlePick(emoji)}
                    className={cn(
                      "h-9 w-9 rounded-md text-xl transition-transform hover:scale-125",
                      active && "bg-primary/10",
                    )}
                    aria-label={`Reagir com ${emoji}`}
                  >
                    {emoji}
                  </button>
                );
              })}
            </div>
          </PopoverContent>
        </Popover>

        {groups.map(({ emoji, list }) => {
          const count = list.length;
          const active = !!user && list.some((r) => r.user_id === user.id);
          const names = list
            .map((r) => namesByUser[r.user_id] || "…")
            .join(", ");
          return (
            <Tooltip key={emoji}>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={() => toggle(emoji)}
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs transition-colors",
                    active
                      ? "border-primary bg-primary/10 text-foreground"
                      : "border-border bg-background hover:bg-accent/40 text-muted-foreground",
                  )}
                  aria-label={`Reação ${emoji}`}
                >
                  <span className="text-sm leading-none">{emoji}</span>
                  <span className="font-medium">{count}</span>
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <span className="text-xs">{names}</span>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </TooltipProvider>
  );
};
