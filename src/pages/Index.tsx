import { CompactCards } from "@/components/home/CompactCards";
import { EventCalendar } from "@/components/home/EventCalendar";
import { NoticeBoard } from "@/components/home/NoticeBoard";
import { ElogiosRecebidos } from "@/components/home/ElogiosRecebidos";
import { useProfile } from "@/hooks/useProfile";

const Index = () => {
  const { firstName } = useProfile();
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Olá, {firstName}! 👋</h1>
          <p className="text-sm text-muted-foreground">Bem-vindo(a) à Central DeskRio.</p>
        </div>
      </div>
      <CompactCards />
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_2fr] gap-6 items-start">
        <div className="space-y-6">
          <NoticeBoard />
          <ElogiosRecebidos />
        </div>
        <EventCalendar />
      </div>
    </div>
  );
};
export default Index;
