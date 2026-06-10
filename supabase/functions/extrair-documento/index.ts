const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  try {
    const apiKey =
      Deno.env.get("OPENROUTER_API_KEY_CENTRALDESK") ||
      Deno.env.get("OPENROUTER_API_KEY") ||
      Deno.env.get("OPENROUTER_KEY") ||
      Deno.env.get("OPENROUTER");

    if (!apiKey) {
      return new Response(JSON.stringify({ error: "Chave da OpenRouter não configurada." }), {
        status: 500, headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    const { images, nome } = await req.json();
    if (!Array.isArray(images) || images.length === 0) {
      return new Response(JSON.stringify({ error: "Nenhuma imagem recebida." }), {
        status: 400, headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    const prompt = `Estas imagens são páginas de um material/manual interno da DeskRio${nome ? ` (arquivo: ${nome})` : ""}.
Sua tarefa é transcrever o conteúdo de forma COMPLETA e FIEL, em português do Brasil. NÃO resuma e NÃO omita nada.

Regras:
- Transcreva TODO o texto visível, palavra por palavra: títulos, subtítulos, parágrafos, listas, legendas, rótulos de campos, textos dentro dos prints/telas, botões e menus.
- Para cada imagem/print, descreva exatamente o que aparece e o passo a passo: para onde as setas apontam, qual campo preencher, qual botão clicar, em que menu ou aba.
- Preserve a ordem das páginas e a numeração dos passos (Passo 1, Passo 2...).
- Inclua nomes de campos, opções e valores exatamente como aparecem (ex: "Setor Recorrente", "Atendente Recorrente").
- Se houver tabelas, transcreva linha a linha.

Responda apenas com o conteúdo transcrito e organizado, sem comentários ou observações suas.`;

    const content: unknown[] = [{ type: "text", text: prompt }];
    for (const url of images.slice(0, 8)) {
      content.push({ type: "image_url", image_url: { url } });
    }

    const orRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey.trim()}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://centraldeskrio.com.br",
        "X-Title": "Central DeskRio Extrator",
      },
      body: JSON.stringify({
        // Mistral com visão — forte em OCR / leitura de documentos com imagem
        model: "mistralai/mistral-small-3.2-24b-instruct",
        messages: [{ role: "user", content }],
        max_tokens: 6000,
        temperature: 0.1,
      }),
    });

    if (!orRes.ok) {
      const err = await orRes.text();
      console.error("OpenRouter vision error:", err);
      return new Response(JSON.stringify({ error: `Falha na leitura por IA: ${err.slice(0, 200)}` }), {
        status: 502, headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    const data = await orRes.json();
    const texto = data?.choices?.[0]?.message?.content ?? "";

    return new Response(JSON.stringify({ texto }), {
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("extrair-documento error:", e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500, headers: { ...CORS, "Content-Type": "application/json" },
    });
  }
});
