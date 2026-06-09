import { ReactNode } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

const formatTooltipDate = (iso: string) => {
  try {
    const d = new Date(iso);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  } catch {
    return iso;
  }
};

interface RowProps {
  checked: boolean;
  disabled?: boolean;
  onToggle?: () => void;
  concluidoPorNome?: string | null;
  concluidoEm?: string | null;
  /** Strikethrough label text/content */
  text: ReactNode;
  /** Extra classes for the label span (e.g. text-sm) */
  textClassName?: string;
  /** Extra classes for the checkbox */
  checkboxClassName?: string;
  /** Gap between checkbox and label */
  gapClassName?: string;
}

/**
 * Renders a single completed-aware row: checkbox + strikethrough label.
 * Both elements are wrapped in a single tooltip trigger (with pointer-events:auto)
 * so hover works even when the underlying checkbox is disabled.
 *
 * Caller controls the surrounding <li> and any trailing badges/selects/buttons.
 */
export const OneOnOneTodoRow = ({
  checked,
  disabled,
  onToggle,
  concluidoPorNome,
  concluidoEm,
  text,
  textClassName,
  checkboxClassName,
  gapClassName = "gap-2",
}: RowProps) => {
  const inner = (
    <span
      className={cn("inline-flex items-center flex-1 min-w-0", gapClassName)}
      style={{ pointerEvents: "auto" }}
    >
      <Checkbox
        checked={checked}
        disabled={disabled}
        onCheckedChange={() => onToggle?.()}
        className={checkboxClassName}
      />
      <span
        className={cn(
          "flex-1 min-w-0",
          checked ? "line-through text-muted-foreground" : "text-foreground",
          textClassName,
        )}
      >
        {text}
      </span>
    </span>
  );

  if (!checked) return inner;

  const tooltipText =
    concluidoPorNome && concluidoEm
      ? `Concluído por ${concluidoPorNome} em ${formatTooltipDate(concluidoEm)}`
      : "Concluído (autor não registrado)";

  return (
    <Tooltip>
      <TooltipTrigger asChild>{inner}</TooltipTrigger>
      <TooltipContent
        side="top"
        align="start"
        sideOffset={6}
        collisionPadding={8}
        className="z-[60] text-xs px-2 py-1 rounded-md shadow-sm"
      >
        {tooltipText}
      </TooltipContent>
    </Tooltip>
  );
};

/* Backward-compatible thin wrapper (checkbox-only). Prefer OneOnOneTodoRow. */
interface CheckProps {
  checked: boolean;
  disabled?: boolean;
  onToggle?: () => void;
  concluidoPorNome?: string | null;
  concluidoEm?: string | null;
  className?: string;
}
export const OneOnOneTodoCheck = ({
  checked,
  disabled,
  onToggle,
  concluidoPorNome,
  concluidoEm,
  className,
}: CheckProps) => {
  const checkbox = (
    <span className="inline-flex" style={{ pointerEvents: "auto" }}>
      <Checkbox
        checked={checked}
        disabled={disabled}
        onCheckedChange={() => onToggle?.()}
        className={className}
      />
    </span>
  );
  if (!checked) return checkbox;
  const tooltipText =
    concluidoPorNome && concluidoEm
      ? `Concluído por ${concluidoPorNome} em ${formatTooltipDate(concluidoEm)}`
      : "Concluído (autor não registrado)";
  return (
    <Tooltip>
      <TooltipTrigger asChild>{checkbox}</TooltipTrigger>
      <TooltipContent
        side="top"
        align="start"
        sideOffset={6}
        collisionPadding={8}
        className="z-[60] text-xs px-2 py-1 rounded-md shadow-sm"
      >
        {tooltipText}
      </TooltipContent>
    </Tooltip>
  );
};

export default OneOnOneTodoRow;
