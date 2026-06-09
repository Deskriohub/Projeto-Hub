import { Bot, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

// URL da IA do DeskRio (Prompt Studio) — defina VITE_DESKRIO_IA_URL no .env
const IA_URL = import.meta.env.VITE_DESKRIO_IA_URL ?? "";

const Assistente = () => {
  return (
    <div className="flex flex-col h-[calc(100vh-5rem)]">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-foreground">Assistente IA</h1>
        <p className="text-muted-foreground mt-1">Converse com a IA do DeskRio.</p>
      </div>

      {IA_URL ? (
        <Card className="flex-1 overflow-hidden">
          <iframe src={IA_URL} title="Assistente IA DeskRio" className="w-full h-full border-0" />
        </Card>
      ) : (
        <Card className="flex-1 flex flex-col items-center justify-center gap-4 text-center p-8">
          <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
            <Bot className="h-7 w-7 text-primary" />
          </div>
          <div>
            <p className="font-medium text-foreground">IA ainda não configurada</p>
            <p className="text-sm text-muted-foreground max-w-sm mt-1">
              Defina <code className="text-xs bg-muted px-1 py-0.5 rounded">VITE_DESKRIO_IA_URL</code> no
              arquivo <code className="text-xs bg-muted px-1 py-0.5 rounded">.env</code> com a URL da IA do Prompt Studio.
            </p>
          </div>
          <Button asChild variant="outline">
            <a href="https://deskrio.com.br" target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4 mr-2" />Abrir DeskRio
            </a>
          </Button>
        </Card>
      )}
    </div>
  );
};
export default Assistente;
