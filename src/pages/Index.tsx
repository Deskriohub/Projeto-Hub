import { useState } from "react";
import { Lightbulb } from "lucide-react";
import { CompactCards } from "@/components/home/CompactCards";
import { DestaquesPodium } from "@/components/home/DestaquesPodium";
import { EventCalendar } from "@/components/home/EventCalendar";
import { NoticeBoard } from "@/components/home/NoticeBoard";
import { ElogiosRecebidos } from "@/components/home/ElogiosRecebidos";
import { Button } from "@/components/ui/button";
import { SugestaoModal } from "@/components/SugestaoModal";
import { useProfile } from "@/hooks/useProfile";

const Index = () => {
  const { firstName } = useProfile();
  const [sugestaoOpen, setSugestaoOpen] = useState(false);
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Olá, {firstName}! 👋</h1>
          <p className="text-sm text-muted-foreground">Bem-vindo(a) à Central DeskRio.</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => setSugestaoOpen(true)}>
          <Lightbulb className="h-4 w-4" />Dar sugestão
        </Button>
      </div>
      <SugestaoModal open={sugestaoOpen} onOpenChange={setSugestaoOpen} />
      <CompactCards />
      <NoticeBoard />
      <ElogiosRecebidos />
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_2fr] gap-6 items-start">
        <DestaquesPodium />
        <EventCalendar />
      </div>
    </div>
  );
};
export default Index;
