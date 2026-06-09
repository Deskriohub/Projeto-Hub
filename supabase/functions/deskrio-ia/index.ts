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
    .slice(0, 6000);
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

    const websiteContent = await getWebsiteContent(supabase);

    const { data: ctxRow } = await supabase
      .from("configuracoes")
      .select("valor")
      .eq("id", "ia_contexto")
      .maybeSingle();
    const adminContext = ctxRow?.valor?.trim() ?? "";

    const systemPrompt = `Você é a IA assistente interna da DeskRio, uma empresa de tecnologia.
Responda sempre em português, de forma clara, objetiva e amigável.
Use as informações abaixo como fonte principal. Se não souber a resposta, diga honestamente.
Não invente informações que não estejam no contexto fornecido.

${adminContext ? `## Contexto adicional (configurado pelo admin)\n${adminContext}\n\n` : ""}## Site DeskRio
${websiteContent}`;

    const orRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${Deno.env.get("OPENROUTER_API_KEY_CENTRALDESK")}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://centraldeskrio.com.br",
        "X-Title": "Central DeskRio IA",
      },
      body: JSON.stringify({
        model: "openai/gpt-4.1-mini",
        messages: [
          { role: "system", content: systemPrompt },
          ...history.slice(-10),
          { role: "user", content: message },
        ],
        stream: true,
        max_tokens: 1024,
        temperature: 0.4,
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
