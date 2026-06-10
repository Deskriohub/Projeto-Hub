import { useState } from "react";
import { Check, ChevronsUpDown, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";

export interface UserOption {
  id: string;
  full_name: string | null;
}

export function UserMultiSelect({
  users,
  selected,
  onChange,
  placeholder = "Selecionar pessoas...",
}: {
  users: UserOption[];
  selected: string[];
  onChange: (ids: string[]) => void;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const toggle = (id: string) => {
    onChange(selected.includes(id) ? selected.filter((s) => s !== id) : [...selected, id]);
  };

  const filtered = users.filter((u) =>
    (u.full_name || "").toLowerCase().includes(search.toLowerCase())
  );

  const label = selected.length === 0 ? placeholder : `${selected.length} pessoa(s) selecionada(s)`;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" type="button" className="w-full justify-between font-normal">
          <span className="flex items-center gap-2 text-sm truncate">
            <Users className="h-4 w-4 shrink-0" /> {label}
          </span>
          <ChevronsUpDown className="h-4 w-4 opacity-50 shrink-0" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-0" align="start">
        <div className="p-2 border-b">
          <Input placeholder="Buscar pessoa..." value={search} onChange={(e) => setSearch(e.target.value)} className="h-8" />
        </div>
        <ScrollArea className="max-h-60">
          <div className="p-1">
            {filtered.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-3">Ninguém encontrado.</p>
            ) : (
              filtered.map((u) => (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => toggle(u.id)}
                  className="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-accent text-left text-sm"
                >
                  <span className={`h-4 w-4 border rounded flex items-center justify-center shrink-0 ${selected.includes(u.id) ? "bg-primary border-primary" : "border-input"}`}>
                    {selected.includes(u.id) && <Check className="h-3 w-3 text-primary-foreground" />}
                  </span>
                  <span className="truncate">{u.full_name || "—"}</span>
                </button>
              ))
            )}
          </div>
        </ScrollArea>
        {selected.length > 0 && (
          <div className="p-2 border-t">
            <Button variant="ghost" size="sm" className="h-7 text-xs w-full" onClick={() => onChange([])}>
              Limpar seleção
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
