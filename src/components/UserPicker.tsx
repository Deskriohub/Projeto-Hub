import { useMemo, useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";

export interface UserPickerOption {
  id: string;
  full_name: string | null;
  email: string | null;
}

interface UserPickerProps {
  options: UserPickerOption[];
  value: string;
  onChange: (id: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  noOptionsText?: string;
  loadingText?: string;
  loading?: boolean;
  disabled?: boolean;
  id?: string;
}

export function UserPicker({
  options,
  value,
  onChange,
  placeholder = "Selecione um usuário",
  searchPlaceholder = "Buscar por nome ou e-mail...",
  emptyText = "Nenhum usuário encontrado.",
  noOptionsText = "Nenhum usuário disponível.",
  loadingText = "Carregando usuários...",
  loading = false,
  disabled = false,
  id,
}: UserPickerProps) {
  const [search, setSearch] = useState("");

  const selected = useMemo(() => options.find((o) => o.id === value), [options, value]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return options;
    return options.filter(
      (p) =>
        (p.full_name ?? "").toLowerCase().includes(q) ||
        (p.email ?? "").toLowerCase().includes(q),
    );
  }, [options, search]);

  const label = (p: UserPickerOption) => p.full_name || p.email || "—";

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          id={id}
          variant="outline"
          role="combobox"
          disabled={disabled}
          className="w-full justify-between font-normal"
        >
          {selected ? label(selected) : placeholder}
          <ChevronsUpDown className="h-4 w-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder={searchPlaceholder}
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            {loading || options.length === 0 ? (
              <div className="py-6 text-center text-sm text-muted-foreground">
                {loading ? loadingText : noOptionsText}
              </div>
            ) : (
              <>
                <CommandEmpty>{emptyText}</CommandEmpty>
                <CommandGroup>
                  {filtered.map((p) => (
                    <CommandItem
                      key={p.id}
                      value={p.id}
                      onSelect={(v) => {
                        onChange(v);
                        setSearch("");
                      }}
                    >
                      <Check
                        className={cn(
                          "h-4 w-4",
                          value === p.id ? "opacity-100" : "opacity-0",
                        )}
                      />
                      <div className="flex flex-col">
                        <span>{p.full_name || "—"}</span>
                        {p.email && (
                          <span className="text-xs text-muted-foreground">{p.email}</span>
                        )}
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
