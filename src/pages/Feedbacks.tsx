import { useState, useEffect } from "react";
import { MessageCircle, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { FeedbackDialog, FeedbackRecord, TIPO_CONFIG } from "@/components/FeedbackDialog";

interface Profile {
  id: string;
  full_name: string | null;
}

function formatDate(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
}

function FeedbackCard({
  fb, perspective,
}: {
  fb: FeedbackRecord;
  perspective: "enviado" | "recebido" | "admin";
}) {
  const [open, setOpen] = useState(false);
  const tipo = TIPO_CONFIG[fb.tipo as keyof typeof TIPO_CONFIG] ?? TIPO_CONFIG.positivo;

  return (
    <>
      <Card
        className="cursor-pointer hover:shadow-md transition-shadow"
        onClick={() => setOpen(true)}
      >
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className="text-xs text-muted-foreground">{formatDate(fb.created_at)}</span>
                <Badge variant="outline" className={`text-[10px] h-4 ${tipo.color}`}>
                  {tipo.label}
                </Badge>
                {fb.one_on_one_id && (
                  <Badge variant="outline" className="text-[10px] h-4 text-muted-foreground">
                    Pós 1:1
                  </Badge>
                )}
              </div>
              {perspective === "admin" ? (
                <p className="text-sm font-medium text-foreground">
                  {fb.de_user_nome} → {fb.para_user_nome}
                </p>
              ) : (
                <p className="text-sm font-medium text-foreground">
                  {perspective === "recebido" ? `De: ${fb.de_user_nome}` : `Para: ${fb.para_user_nome}`}
                </p>
              )}
              <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">{fb.conteudo}</p>
            </div>
            <MessageCircle className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
          </div>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-primary" />
              Feedback {tipo.label}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-muted-foreground text-xs block">De</span>
                <p className="font-medium">{fb.de_user_nome}</p>
              </div>
              <div>
                <span className="text-muted-foreground text-xs block">Para</span>
                <p className="font-medium">{fb.para_user_nome}</p>
              </div>
            </div>
            <p className="text-sm text-foreground whitespace-pre-wrap p-3 bg-muted/40 rounded-md">
              {fb.conteudo}
            </p>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">{formatDate(fb.created_at)}</span>
              {fb.one_on_one_id && (
                <Badge variant="outline" className="text-[10px] h-4 text-muted-foreground">
                  Pós 1:1
                </Badge>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

const Feedbacks = () => {
  const { user } = useAuth();
  const { role } = useUserRole();
  const isAdmin = role === "admin";

  const [feedbacks, setFeedbacks] = useState<FeedbackRecord[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [novoOpen, setNovoOpen] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!user) return;
      const [{ data: pData }, { data: fData }] = await Promise.all([
        supabase.from("profiles").select("id, full_name"),
        supabase.from("feedbacks").select("*").order("created_at", { ascending: false }),
      ]);
      setProfiles((pData || []) as Profile[]);
      setFeedbacks((fData || []) as FeedbackRecord[]);
      setLoading(false);
    };
    load();
  }, [user]);

  const recebidos = feedbacks.filter((f) => f.para_user_id === user?.id);
  const enviados = feedbacks.filter((f) => f.de_user_id === user?.id);

  const handleCreated = (fbs?: FeedbackRecord[]) => {
    if (fbs && fbs.length > 0) setFeedbacks((prev) => [...fbs, ...prev]);
    setNovoOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <MessageCircle className="h-7 w-7 text-primary" />
          <div>
            <h1 className="text-2xl font-bold text-foreground">Feedbacks</h1>
            <p className="text-sm text-muted-foreground">Feedbacks trocados com a equipe.</p>
          </div>
        </div>
        <Button onClick={() => setNovoOpen(true)}>
          <Plus className="h-4 w-4 mr-1" /> Dar Feedback
        </Button>
      </div>

      {loading ? (
        <p className="text-muted-foreground text-sm">Carregando...</p>
      ) : (
        <Tabs defaultValue="recebidos">
          <TabsList>
            <TabsTrigger value="recebidos">Recebidos ({recebidos.length})</TabsTrigger>
            <TabsTrigger value="enviados">Enviados ({enviados.length})</TabsTrigger>
            {isAdmin && <TabsTrigger value="todos">Todos ({feedbacks.length})</TabsTrigger>}
          </TabsList>

          <TabsContent value="recebidos" className="mt-4 space-y-2">
            {recebidos.length === 0 ? (
              <p className="text-muted-foreground text-sm">Nenhum feedback recebido ainda.</p>
            ) : (
              recebidos.map((fb) => (
                <FeedbackCard key={fb.id} fb={fb} perspective="recebido" />
              ))
            )}
          </TabsContent>

          <TabsContent value="enviados" className="mt-4 space-y-2">
            {enviados.length === 0 ? (
              <p className="text-muted-foreground text-sm">Nenhum feedback enviado ainda.</p>
            ) : (
              enviados.map((fb) => (
                <FeedbackCard key={fb.id} fb={fb} perspective="enviado" />
              ))
            )}
          </TabsContent>

          {isAdmin && (
            <TabsContent value="todos" className="mt-4 space-y-2">
              {feedbacks.length === 0 ? (
                <p className="text-muted-foreground text-sm">Nenhum feedback registrado.</p>
              ) : (
                feedbacks.map((fb) => (
                  <FeedbackCard key={fb.id} fb={fb} perspective="admin" />
                ))
              )}
            </TabsContent>
          )}
        </Tabs>
      )}

      {user && (
        <FeedbackDialog open={novoOpen} onClose={handleCreated} profiles={profiles} />
      )}
    </div>
  );
};

export default Feedbacks;
