import { useState, useRef, useEffect } from "react";
import { Bot, Send, Loader2, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/useProfile";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const INITIAL: Message[] = [
  { role: "assistant", content: "Olá! Sou o Deskinho, assistente virtual da DeskRio. Como posso te ajudar?" },
];

const Assistente = () => {
  const { initials } = useProfile();
  const [messages, setMessages] = useState<Message[]>(INITIAL);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput("");

    const history = messages.filter((m) => m.content);
    const newMessages: Message[] = [...history, { role: "user", content: userMessage }];
    setMessages([...newMessages, { role: "assistant", content: "" }]);
    setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/deskrio-ia`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${session?.access_token}`,
            "apikey": import.meta.env.VITE_SUPABASE_ANON_KEY,
          },
          body: JSON.stringify({
            message: userMessage,
            history: history.slice(-10).map(({ role, content }) => ({ role, content })),
          }),
        },
      );

      if (!res.ok) {
        let detalhe = "";
        try {
          const j = await res.json();
          detalhe = j?.error ? ` (${typeof j.error === "string" ? j.error : JSON.stringify(j.error)})` : "";
        } catch { /* sem corpo JSON */ }
        throw new Error(`Status ${res.status}${detalhe}`);
      }
      if (!res.body) throw new Error("Sem resposta do servidor");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let text = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        for (const line of decoder.decode(value).split("\n")) {
          if (!line.startsWith("data: ")) continue;
          const raw = line.slice(6).trim();
          if (raw === "[DONE]") continue;
          try {
            const token = JSON.parse(raw).choices?.[0]?.delta?.content ?? "";
            text += token;
            setMessages((prev) => {
              const updated = [...prev];
              updated[updated.length - 1] = { role: "assistant", content: text };
              return updated;
            });
          } catch {
            // chunk inválido
          }
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          role: "assistant",
          content: `Desculpe, ocorreu um erro. ${msg}`,
        };
        return updated;
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-5rem)]">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Deskinho</h1>
          <p className="text-muted-foreground mt-1">Assistente virtual da DeskRio — pergunte qualquer coisa.</p>
        </div>
        <Button variant="ghost" size="sm" onClick={() => setMessages(INITIAL)} disabled={loading}>
          <Trash2 className="h-4 w-4 mr-1" /> Limpar
        </Button>
      </div>

      <Card className="flex-1 flex flex-col overflow-hidden">
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {messages.map((msg, i) => (
              <div key={i} className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                <Avatar className="h-8 w-8 shrink-0 mt-0.5">
                  {msg.role === "assistant" ? (
                    <AvatarFallback className="bg-primary/10">
                      <Bot className="h-4 w-4 text-primary" />
                    </AvatarFallback>
                  ) : (
                    <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
                      {initials}
                    </AvatarFallback>
                  )}
                </Avatar>
                <div
                  className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground rounded-tr-sm"
                      : "bg-muted text-foreground rounded-tl-sm"
                  }`}
                >
                  {msg.content || (loading && i === messages.length - 1
                    ? <Loader2 className="h-4 w-4 animate-spin" />
                    : null)}
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>
        </ScrollArea>

        <div className="border-t p-4 flex gap-2">
          <Input
            placeholder="Pergunte qualquer coisa ao Deskinho..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
            disabled={loading}
            className="flex-1"
          />
          <Button onClick={sendMessage} disabled={!input.trim() || loading} size="icon">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default Assistente;
