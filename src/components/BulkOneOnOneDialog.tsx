import { useEffect, useState } from "react";
import { Plus, Trash2, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { notificar } from "@/lib/notify";
import { gerarDatasMensais } from "@/lib/recorrencia";
import { useTeamProfiles } from "@/hooks/useTeamProfiles";

interface Linha { liderado: string; data: string; hora: string; }

function todayStr() {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
function fmtDataBR(d: string) {
  const [y, m, dd] = d.split("-");
  return `${dd}/${m}/${y}`;
}

export function BulkOneOnOneDialog({
  open, onClose, onCreated,
}: { open: boolean; onClose: () => void; onCreated?: () => void; }) {
  const { user } = useAuth();
  const { profiles } = useTeamProfiles();
  const [linhas, setLinhas] = useState<Linha[]>([{ liderado: "", data: todayStr(), hora: "" }]);
  const [repetir, setRepetir] = useState(false);
  const [meses, setMeses] = useState(3);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLinhas([{ liderado: "", data: todayStr(), hora: "" }]);
    setRepetir(false); setMeses(3);
  }, [open]);

  const addLinha = () => setLinhas((p) => [...p, { liderado: "", data: todayStr(), hora: "" }]);
  const addTodos = () => {
    const usados = new Set(linhas.map((l) => l.liderado).filter(Boolean));
    const novos = profiles.filter((p) => !usados.has(p.id)).map((p) => ({ liderado: p.id, data: todayStr(), hora: "" }));
    setLinhas((prev) => [...prev.filter((l) => l.liderado), ...novos]);
  };
  const update = (i: number, patch: Partial<Linha>) =>
    setLinhas((p) => p.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));
  const remove = (i: number) => setLinhas((p) => p.filter((_, idx) => idx !== i));

  const nome = (id: string) => profiles.find((p) => p.id === id)?.full_name ?? "—";

  const handleSave = async () => {
    if (!user) return;
    const validas = linhas.filter((l) => l.liderado && l.data);
    if (validas.length === 0) {
      toast({ title: "Adicione ao menos uma pessoa com data.", variant: "destructive" });
      return;
    }
    setSaving(true);
    const rows: Record<string, unknown>[] = [];
    for (const l of validas) {
      const datas = repetir ? gerarDatasMensais(l.data, meses) : [l.data];
      for (const d of datas) {
        rows.push({
          gestor_id: user.id,
          liderado_id: l.liderado,
          liderado_nome: nome(l.liderado),
          data_reuniao: d,
          hora_reuniao: l.hora || null,
          anotacoes: "",
        });
      }
    }
    const { error } = await supabase.from("one_on_one").insert(rows);
    setSaving(false);
    if (error) { toast({ title: "Erro ao agendar", description: error.message, variant: "destructive" }); return; }

    // Notifica cada liderado individualmente
    for (const l of validas) {
      const qtd = repetir ? meses : 1;
      notificar([l.liderado], {
        titulo: qtd > 1 ? `Você tem ${qtd} 1:1 agendados` : "Você tem um 1:1 agendado",
        descricao: `${qtd > 1 ? "A partir de " : "Dia "}${fmtDataBR(l.data)}${l.hora ? ` às ${l.hora}` : ""}${qtd > 1 ? ", repetindo mensalmente" : ""}.`,
        tipo: "reuniao",
        link: "/meus-one-on-one",
      });
    }

    toast({ title: `Agendado para ${validas.length} pessoa(s)!` });
    onCreated?.();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!saving && !o) onClose(); }}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" /> Agendar 1:1 para o time
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">
            Adicione as pessoas e defina a data e hora de cada uma. Cada pessoa recebe a notificação do seu agendamento.
          </p>

          <div className="flex gap-2">
            <Button type="button" variant="outline" size="sm" onClick={addLinha}>
              <Plus className="h-4 w-4 mr-1" /> Adicionar pessoa
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={addTodos}>
              <Users className="h-4 w-4 mr-1" /> Adicionar time todo
            </Button>
          </div>

          <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
            {linhas.map((l, i) => (
              <div key={i} className="flex items-end gap-2 rounded-md border border-border/60 bg-muted/20 p-2">
                <div className="flex-1 min-w-0">
                  <Label className="text-[10px] text-muted-foreground">Pessoa</Label>
                  <Select value={l.liderado} onValueChange={(v) => update(i, { liderado: v })}>
                    <SelectTrigger className="h-8"><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      {profiles.map((p) => (
                        <SelectItem key={p.id} value={p.id}>{p.full_name || "—"}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-[10px] text-muted-foreground">Data</Label>
                  <Input type="date" value={l.data} onChange={(e) => update(i, { data: e.target.value })} className="h-8 w-36" />
                </div>
                <div>
                  <Label className="text-[10px] text-muted-foreground">Hora</Label>
                  <Input type="time" value={l.hora} onChange={(e) => update(i, { hora: e.target.value })} className="h-8 w-28" />
                </div>
                <Button type="button" variant="ghost" size="icon" className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                  onClick={() => remove(i)} disabled={linhas.length === 1}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>

          <div className="rounded-md border border-border/60 bg-muted/30 p-3">
            <div className="flex items-center gap-2">
              <input id="bulk-repetir" type="checkbox" checked={repetir} onChange={(e) => setRepetir(e.target.checked)} className="rounded" />
              <Label htmlFor="bulk-repetir" className="cursor-pointer">Repetir todo mês</Label>
              {repetir && (
                <div className="flex items-center gap-1.5 ml-2">
                  <span className="text-sm text-muted-foreground">por</span>
                  <Input type="number" min={2} max={12} value={meses}
                    onChange={(e) => setMeses(Math.min(12, Math.max(2, Number(e.target.value) || 2)))} className="w-16 h-8" />
                  <span className="text-sm text-muted-foreground">meses</span>
                </div>
              )}
            </div>
            {repetir && (
              <p className="text-xs text-muted-foreground mt-2">
                Cada pessoa terá {meses} 1:1 mensais a partir da data escolhida. Dá pra editar cada encontro depois.
              </p>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} disabled={saving}>Cancelar</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Agendando..." : "Agendar todos"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
