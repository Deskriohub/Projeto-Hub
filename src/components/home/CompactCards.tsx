import { Card, CardContent } from "@/components/ui/card";
import { Target, Eye, Heart } from "lucide-react";

const items = [
  {
    label: "MISSÃO",
    icon: Target,
    borderColor: "border-t-accent",
    text: "Transformar o atendimento ao cliente por meio de uma plataforma inteligente, ágil e centralizada. Conectamos empresas aos seus clientes através dos principais canais digitais — WhatsApp, Facebook e Instagram — promovendo uma comunicação mais eficiente, humanizada e com foco em resultados.",
  },
  {
    label: "VISÃO",
    icon: Eye,
    borderColor: "border-t-accent",
    text: "Ser a plataforma de referência para empresas que desejam profissionalizar e centralizar seu atendimento digital, tornando cada conversa uma oportunidade de fidelização.",
  },
  {
    label: "VALORES",
    icon: Heart,
    borderColor: "border-t-primary",
    text: "Foco no Cliente · Simplicidade · Inovação Contínua · Humanização · Parceria Estratégica · Confiança e Segurança",
  },
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
