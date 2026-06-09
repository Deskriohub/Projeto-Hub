import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export type Trend = "up" | "down" | "flat";

interface Props {
  trend: Trend | null;
  tooltip?: string;
  emptyLabel?: string;
}

export function TrendIndicator({ trend, tooltip, emptyLabel = "—" }: Props) {
  if (!trend) return <span className="text-muted-foreground">{emptyLabel}</span>;
  const content =
    trend === "up" ? (
      <span className="inline-flex items-center gap-1 text-green-600"><TrendingUp className="h-4 w-4" /> Subiu</span>
    ) : trend === "down" ? (
      <span className="inline-flex items-center gap-1 text-red-600"><TrendingDown className="h-4 w-4" /> Desceu</span>
    ) : (
      <span className="inline-flex items-center gap-1 text-muted-foreground"><Minus className="h-4 w-4" /> Estagnou</span>
    );
  if (!tooltip) return content;
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>{content}</TooltipTrigger>
        <TooltipContent>{tooltip}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
