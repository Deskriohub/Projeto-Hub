import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { logAudit } from "@/lib/auditLog";
import { notificar } from "@/lib/notify";
import { gerarDatasMensais } from "@/lib/recorrencia";
import { UserMultiSelect, UserOption } from "@/components/UserMultiSelect";
import { toast } from "@/hooks/use-toast";

export interface Evento {
  id: string;
  titulo: string;
  descricao: string | null;
  data_inicio: string;
  data_fim: string | null;
  hora_inicio: string | null;
  hora_fim: string | null;
  dia_todo: boolean;
  visibilidade: string;
  participantes: string[] | null;
  criado_por: string | null;
  criador_nome?: string;
}

function todayStr(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

const emptyForm = (date?: string) => ({
  titulo: "",
  descricao: "",
  data_inicio: date || todayStr(),
  data_fim: "",
  hora_inicio: "",
  hora_fim: "",
  visibilidade: "todos" as "todos" | "privado",
  participantes: [] as string[],
  repetir: false,
  meses: 3,
});

interface Props {
  open: boolean;
  onClose: () => void;
  editing: Evento | null;
  defaultDate?: string;
  onSaved?: () => void;
}

export function EventoDialog({ open, onClose, editing, defaultDate, onSaved }: Props) {
  const { user } = useAuth();
  const { fullName } = useProfile();
  const [profiles, setProfiles] = useState<UserOption[]>([]);
  const [form, setForm] = useState(emptyForm(defaultDate));
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!open) return;
    supabase.from("profiles").select("id, full_name").order("full_name")
      .then(({ data }) => setProfiles((data as UserOption[]) ?? []));
    if (editing) {
      setForm({
        titulo: editing.titulo,
        descricao: editing.descricao || "",
        data_inicio: editing.data_inicio,
        data_fim: editing.data_fim || "",
        hora_inicio: editing.hora_inicio ? editing.hora_inicio.slice(0, 5) : "",
        hora_fim: editing.hora_fim ? editing.hora_fim.slice(0, 5) : "",
        visibilidade: (editing.visibilidade as "todos" | "privado") || "todos",
        participantes: editing.participantes ?? [],
        repetir: false,
        meses: 3,
      });
    } else {
      setForm(emptyForm(defaultDate));
    }
  }, [open, editing, defaultDate]);

  const resumo = (ev: { titulo: string; data_inicio: string; descricao?: string | null; hora_inicio?: string | null; visibilidade?: string }) =>
    `Título: ${ev.titulo}\nData: ${ev.data_inicio}${ev.hora_inicio ? `\nHora: ${ev.hora_inicio}` : ""}${ev.descricao ? `\nDescrição: ${ev.descricao}` : ""}\nVisibilidade: ${ev.visibilidade === "privado" ? "Só para mim" : "Todos"}`;

  const handleSave = async () => {
    if (!form.titulo.trim()) { toast({ title: "Título obrigatório", variant: "destructive" }); return; }
    if (!user) return;
    setSaving(true);

    const diaTodo = !form.hora_inicio;
    const payload = {
      titulo: form.titulo.trim(),
      descricao: form.descricao.trim() || null,
      data_inicio: form.data_inicio,
      data_fim: form.data_fim || null,
      hora_inicio: form.hora_inicio || null,
      hora_fim: form.hora_fim || null,
      dia_todo: diaTodo,
      visibilidade: form.visibilidade,
      participantes: form.participantes.length > 0 ? form.participantes : null,
      criado_por: user.id,
    };

    const horaTxt = form.hora_inicio ? ` às ${form.hora_inicio}` : "";

    if (editing) {
      const { error } = await supabase.from("eventos").update(payload).eq("id", editing.id);
      if (error) { toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" }); setSaving(false); return; }
      logAudit(user.id, fullName, `Editou o evento "${form.titulo}"`, "Calendário", {
        antes: resumo({ ...editing, hora_inicio: editing.hora_inicio?.slice(0, 5) ?? "" }),
        depois: resumo({ ...form }),
      });
      const antesIds = editing.participantes ?? [];
      const horaAntes = editing.hora_inicio ? editing.hora_inicio.slice(0, 5) : "";
      const mudouDataHora = editing.data_inicio !== form.data_inicio || horaAntes !== (form.hora_inicio || "");
      const novos = form.participantes.filter((id) => !antesIds.includes(id) && id !== user.id);
      notificar(novos, { titulo: "Você foi marcado em um evento", descricao: `${form.titulo} — ${form.data_inicio}${horaTxt}`, tipo: "evento", link: "/eventos" });
      if (mudouDataHora) {
        const jaEstavam = antesIds.filter((id) => form.participantes.includes(id) && id !== user.id);
        notificar(jaEstavam, { titulo: `Evento remarcado: ${form.titulo}`, descricao: `Nova data: ${form.data_inicio}${horaTxt}.`, tipo: "evento", link: "/eventos" });
      }
      toast({ title: "Evento atualizado" });
    } else {
      const { error } = await supabase.from("eventos").insert(payload);
      if (error) { toast({ title: "Erro ao criar evento", description: error.message, variant: "destructive" }); setSaving(false); return; }
      logAudit(user.id, fullName, `Criou o evento "${form.titulo}"`, "Calendário", { depois: resumo({ ...form }) });
      const datas = form.repetir ? gerarDatasMensais(form.data_inicio, form.meses).slice(1) : [];
      if (datas.length > 0) {
        await supabase.from("eventos").insert(datas.map((d) => ({ ...payload, data_inicio: d, data_fim: null })));
      }
      notificar(form.participantes.filter((id) => id !== user.id), {
        titulo: "Você foi marcado em um evento",
        descricao: datas.length > 0 ? `${form.titulo} — a partir de ${form.data_inicio}, mensal` : `${form.titulo} — ${form.data_inicio}${horaTxt}`,
        tipo: "evento", link: "/eventos",
      });
      toast({ title: datas.length > 0 ? `Evento criado (${datas.length + 1} ocorrências)` : "Evento criado" });
    }

    setSaving(false);
    onSaved?.();
    onClose();
  };

  const handleDelete = async () => {
    if (!editing || !user) return;
    setDeleting(true);
    const { error } = await supabase.from("eventos").delete().eq("id", editing.id);
    setDeleting(false);
    if (error) { toast({ title: "Erro ao excluir", description: error.message, variant: "destructive" }); return; }
    logAudit(user.id, fullName, `Excluiu o evento "${editing.titulo}"`, "Calendário", { antes: `Título: ${editing.titulo}\nData: ${editing.data_inicio}` });
    toast({ title: "Evento excluído" });
    onSaved?.();
    onClose();
  };

  const canDelete = editing && editing.criado_por === user?.id;

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o && !saving) onClose(); }}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editing ? "Editar evento" : "Novo evento"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label htmlFor="evt-titulo">Título *</Label>
            <Input id="evt-titulo" value={form.titulo} onChange={(e) => setForm((f) => ({ ...f, titulo: e.target.value }))} placeholder="Ex: Reunião de equipe" className="mt-1" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="evt-inicio">Data início *</Label>
              <Input id="evt-inicio" type="date" value={form.data_inicio} onChange={(e) => setForm((f) => ({ ...f, data_inicio: e.target.value }))} className="mt-1" />
            </div>
            <div>
              <Label htmlFor="evt-fim">Data fim</Label>
              <Input id="evt-fim" type="date" value={form.data_fim} onChange={(e) => setForm((f) => ({ ...f, data_fim: e.target.value }))} className="mt-1" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="evt-hi">Hora início</Label>
              <Input id="evt-hi" type="time" value={form.hora_inicio} onChange={(e) => setForm((f) => ({ ...f, hora_inicio: e.target.value }))} className="mt-1" />
            </div>
            <div>
              <Label htmlFor="evt-hf">Hora fim</Label>
              <Input id="evt-hf" type="time" value={form.hora_fim} onChange={(e) => setForm((f) => ({ ...f, hora_fim: e.target.value }))} className="mt-1" />
            </div>
          </div>
          <p className="text-xs text-muted-foreground -mt-1">Deixe a hora em branco para um evento de dia inteiro.</p>
          <div>
            <Label htmlFor="evt-desc">Descrição</Label>
            <Textarea id="evt-desc" value={form.descricao} onChange={(e) => setForm((f) => ({ ...f, descricao: e.target.value }))} placeholder="Detalhes opcionais..." rows={2} className="mt-1 resize-none" />
          </div>
          <div>
            <Label htmlFor="evt-vis">Visibilidade</Label>
            <Select value={form.visibilidade} onValueChange={(v) => setForm((f) => ({ ...f, visibilidade: v as "todos" | "privado" }))}>
              <SelectTrigger id="evt-vis" className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">📅 Mostrar no calendário (todos veem)</SelectItem>
                <SelectItem value="privado">🔒 Só para mim (lembrete pessoal)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Marcar pessoas (avisar e mostrar no calendário delas)</Label>
            <div className="mt-1">
              <UserMultiSelect users={profiles} selected={form.participantes} onChange={(ids) => setForm((f) => ({ ...f, participantes: ids }))} placeholder="Marcar participantes..." />
            </div>
            {form.participantes.length > 0 && (
              <p className="text-xs text-muted-foreground mt-1">As pessoas marcadas recebem uma notificação e veem o evento no calendário delas.</p>
            )}
          </div>
          {!editing && (
            <div className="rounded-md border border-border/60 bg-muted/30 p-3">
              <div className="flex items-center gap-2 flex-wrap">
                <input id="evt-repetir" type="checkbox" checked={form.repetir} onChange={(e) => setForm((f) => ({ ...f, repetir: e.target.checked }))} className="rounded" />
                <Label htmlFor="evt-repetir" className="cursor-pointer">Repetir todo mês</Label>
                {form.repetir && (
                  <div className="flex items-center gap-1.5 ml-2">
                    <span className="text-sm text-muted-foreground">por</span>
                    <Input type="number" min={2} max={12} value={form.meses}
                      onChange={(e) => setForm((f) => ({ ...f, meses: Math.min(12, Math.max(2, Number(e.target.value) || 2)) }))} className="w-16 h-8" />
                    <span className="text-sm text-muted-foreground">meses</span>
                  </div>
                )}
              </div>
              {form.repetir && (
                <p className="text-xs text-muted-foreground mt-2">
                  Cria {form.meses} eventos, um por mês (contando este). Dá pra editar cada um depois.
                </p>
              )}
            </div>
          )}
        </div>
        <DialogFooter className="gap-2 flex-wrap">
          {canDelete && (
            <Button variant="destructive" size="sm" disabled={deleting} onClick={handleDelete}>
              <Trash2 className="h-4 w-4 mr-1" />{deleting ? "Excluindo..." : "Excluir"}
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={onClose}>Cancelar</Button>
          <Button size="sm" disabled={saving} onClick={handleSave}>
            {saving ? "Salvando..." : editing ? "Salvar" : "Criar evento"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
