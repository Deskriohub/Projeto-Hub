import { Card, CardContent } from "@/components/ui/card";
import { Target, Eye, Heart } from "lucide-react";

// ⚠️ Ajuste missão/visão/valores conforme a DeskRio.
const items = [
  { label: "MISSÃO", text: "Nossa missão.", borderColor: "border-t-accent", icon: Target },
  { label: "VISÃO", text: "Nossa visão.", borderColor: "border-t-accent", icon: Eye },
  { label: "VALORES", text: "Nossos valores.", borderColor: "border-t-primary", icon: Heart },
];

export function CompactCards() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full">
      {items.map((item, idx) => {
        const Icon = item.icon;
        return (
          <Card key={idx} className={`border-t-4 ${item.borderColor} shadow-sm flex-1`}>
            <CardContent className="p-4">
              <div className="flex items-center gap-1.5 mb-1">
                <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                <p className="text-[10px] font-bold tracking-wider text-muted-foreground">{item.label}</p>
              </div>
              <p className="text-xs text-foreground leading-relaxed">{item.text}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
