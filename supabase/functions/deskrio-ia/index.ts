import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const WEBSITE_URLS = [
  "https://deskrio.com.br/docs/",
  "https://deskrio.com.br/quem-somos/",
];

const CACHE_TTL_MS = 12 * 60 * 60 * 1000;

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
  try {
    const { data: cached } = await supabase
      .from("ia_context_cache")
      .select("content, fetched_at")
      .eq("id", "website")
      .maybeSingle();

    if (cached && cached.fetched_at) {
      const age = Date.now() - new Date(cached.fetched_at).getTime();
      if (age < CACHE_TTL_MS && cached.content) return cached.content;
    }

    const parts: string[] = [];
    for (const url of WEBSITE_URLS) {
      try {
        const res = await fetch(url, { signal: AbortSignal.timeout(5000), headers: { "User-Agent": "DeskRio-IA/1.0" } });
        const html = await res.text();
        parts.push(`## ${url}\n${stripHtml(html)}`);
      } catch {
        // site inacessível — ignora
      }
    }

    const content = parts.join("\n\n");
    if (content) {
      await supabase.from("ia_context_cache").upsert({
        id: "website",
        content,
        fetched_at: new Date().toISOString(),
      });
    }
    return content;
  } catch {
    return "";
  }
}

async function getPlatformManual(supabase: ReturnType<typeof createClient>): Promise<string> {
  try {
    const { data, error } = await supabase
      .from("ajuda_artigos")
      .select("titulo, categoria, ordem, conteudo")
      .order("categoria", { ascending: true })
      .order("ordem", { ascending: true });

    if (error || !data || data.length === 0) return "";

    const grouped: Record<string, Array<{ titulo: string; conteudo: string }>> = {};
    for (const art of data as Array<{ titulo: string; categoria: string; conteudo: string }>) {
      if (!grouped[art.categoria]) grouped[art.categoria] = [];
      grouped[art.categoria].push({ titulo: art.titulo, conteudo: art.conteudo });
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

async function getAdminContext(supabase: ReturnType<typeof createClient>): Promise<string> {
  try {
    const { data } = await supabase
      .from("configuracoes")
      .select("valor")
      .eq("id", "ia_contexto")
      .maybeSingle();
    return data?.valor?.trim() ?? "";
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

    const body = await req.json();
    const message: string = body?.message ?? "";
    const history: Array<{ role: string; content: string }> = body?.history ?? [];

    if (!message.trim()) {
      return new Response(JSON.stringify({ error: "message obrigatório" }), {
        status: 400,
        headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    // Procura a chave da OpenRouter em vários nomes possíveis de secret
    const apiKey =
      Deno.env.get("OPENROUTER_API_KEY_CENTRALDESK") ||
      Deno.env.get("OPENROUTER_API_KEY") ||
      Deno.env.get("OPENROUTER_KEY") ||
      Deno.env.get("OPENROUTER");

    if (!apiKey) {
      console.error("Nenhuma secret da OpenRouter encontrada.");
      return new Response(
        JSON.stringify({ error: "Chave da OpenRouter não configurada. Defina a secret OPENROUTER_API_KEY no Supabase." }),
        { status: 500, headers: { ...CORS, "Content-Type": "application/json" } },
      );
    }

    const websiteContent = await getWebsiteContent(supabase);
    const manualContent = await getPlatformManual(supabase);
    const adminContext = await getAdminContext(supabase);

    let systemPrompt = `Você é o Deskinho, assistente virtual inteligente da DeskRio.

Você é um assistente completo e pode ajudar com qualquer tipo de pergunta:
- Dúvidas sobre como usar a plataforma Central de Gestão DeskRio
- Perguntas gerais de trabalho, comunicação, gestão de pessoas e atendimento
- Perguntas de clientes que os funcionários precisam responder
- Redação de textos, e-mails, mensagens profissionais
- Qualquer outro assunto que o funcionário precisar de ajuda

Responda sempre em português do Brasil.
Seja direto, claro e acolhedor — use linguagem simples e tom calmo e explicativo.
Para perguntas sobre a plataforma, use o Manual da Plataforma como referência principal.
Para outros assuntos, use seu conhecimento geral.`;

    if (adminContext) {
      systemPrompt += `\n\n## Informações sobre a empresa\n${adminContext}`;
    }
    if (manualContent) {
      systemPrompt += `\n\n## Manual da Plataforma DeskRio\n${manualContent}`;
    }
    if (websiteContent) {
      systemPrompt += `\n\n## Site DeskRio\n${websiteContent}`;
    }

    const orRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey.trim()}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://centraldeskrio.com.br",
        "X-Title": "Central DeskRio Deskinho",
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
      console.error("OpenRouter error:", err);
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
    console.error("Edge function error:", e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  }
});
