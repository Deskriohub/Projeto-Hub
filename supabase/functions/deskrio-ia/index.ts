import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const WEBSITE_URLS = [
  "https://deskrio.com.br/docs/",
  "https://deskrio.com.br/quem-somos/",
];

const CACHE_TTL_MS = 12 * 60 * 60 * 1000; // 12h

function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<nav[\s\S]*?<\/nav>/gi, "")
    .replace(/<footer[\s\S]*?<\/footer>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 4000);
}

async function getWebsiteContent(supabase: ReturnType<typeof createClient>): Promise<string> {
  const { data: cached } = await supabase
    .from("ia_context_cache")
    .select("content, fetched_at")
    .eq("id", "website")
    .maybeSingle();

  if (cached) {
    const age = Date.now() - new Date(cached.fetched_at).getTime();
    if (age < CACHE_TTL_MS) return cached.content;
  }

  const parts: string[] = [];
  for (const url of WEBSITE_URLS) {
    try {
      const res = await fetch(url, { headers: { "User-Agent": "DeskRio-IA/1.0" } });
      const html = await res.text();
      parts.push(`## ${url}\n${stripHtml(html)}`);
    } catch {
      // ignora erros de fetch
    }
  }

  const content = parts.join("\n\n");
  await supabase.from("ia_context_cache").upsert({
    id: "website",
    content,
    fetched_at: new Date().toISOString(),
  });

  return content;
}

async function getPlatformManual(supabase: ReturnType<typeof createClient>): Promise<string> {
  try {
    const { data } = await supabase
      .from("ajuda_artigos")
      .select("titulo, categoria, conteudo")
      .order("categoria")
      .order("ordem");

    if (!data || data.length === 0) return "";

    const grouped: Record<string, typeof data> = {};
    for (const art of data) {
      if (!grouped[art.categoria]) grouped[art.categoria] = [];
      grouped[art.categoria].push(art);
    }

    return Object.entries(grouped)
      .map(([cat, arts]) =>
        `### ${cat}\n` + arts.map((a) => `**${a.titulo}**\n${a.conteudo}`).join("\n\n")
      )
      .join("\n\n");
  } catch {
    return "";
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { message, history = [] } = await req.json();
    if (!message?.trim()) {
      return new Response(JSON.stringify({ error: "message obrigatório" }), {
        status: 400,
        headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    const [websiteContent, manualContent, ctxRow] = await Promise.all([
      getWebsiteContent(supabase),
      getPlatformManual(supabase),
      supabase.from("configuracoes").select("valor").eq("id", "ia_contexto").maybeSingle()
        .then(({ data }) => data?.valor?.trim() ?? ""),
    ]);

    const systemPrompt = `Você é o Deskinho, assistente virtual inteligente da DeskRio.

Você é um assistente geral — pode responder qualquer tipo de pergunta como um assistente de inteligência artificial completo (como o ChatGPT). Isso inclui:
- Dúvidas sobre a plataforma Central de Gestão DeskRio
- Dúvidas gerais de trabalho, comunicação, gestão de pessoas
- Perguntas de clientes que os funcionários precisam responder
- Redação de textos, e-mails, mensagens
- Qualquer outra questão que o funcionário precisar de ajuda

Responda sempre em português do Brasil, de forma clara, amigável e objetiva.
Seja direto e prático — os funcionários precisam de respostas rápidas.
Quando a pergunta for sobre a plataforma, use o Manual da Plataforma abaixo como referência prioritária.
Para outros assuntos, use seu conhecimento geral.

${ctxRow ? `## Informações sobre a empresa (configurado pelo admin)\n${ctxRow}\n\n` : ""}${manualContent ? `## Manual da Plataforma DeskRio\n${manualContent}\n\n` : ""}${websiteContent ? `## Conteúdo do site DeskRio\n${websiteContent}` : ""}`;

    const orRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${Deno.env.get("OPENROUTER_API_KEY_CENTRALDESK")}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://centraldeskrio.com.br",
        "X-Title": "Central DeskRio — Deskinho",
      },
      body: JSON.stringify({
        model: "openai/gpt-4.1-mini",
        messages: [
          { role: "system", content: systemPrompt },
          ...history.slice(-10),
          { role: "user", content: message },
        ],
        stream: true,
        max_tokens: 1500,
        temperature: 0.5,
      }),
    });

    if (!orRes.ok) {
      const err = await orRes.text();
      return new Response(JSON.stringify({ error: err }), {
        status: 502,
        headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    return new Response(orRes.body, {
      headers: {
        ...CORS,
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
      },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  }
});
