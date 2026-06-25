// Renderizador "markdown leve" usado nas anotações (negrito, itálico e listas "- ").
// Mesmas regras do composer de comentários do 1:1, extraídas para reuso.

const escapeHtml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const formatInline = (s: string) =>
  s
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/(^|[^*])\*(?!\*)([^*\n]+?)\*(?!\*)/g, "$1<em>$2</em>");

export const renderMarkdownLite = (text: string): { __html: string } => {
  const lines = (text || "").split("\n");
  const out: string[] = [];
  let inList = false;
  for (const raw of lines) {
    const isItem = /^- (.*)/.test(raw);
    if (isItem) {
      if (!inList) {
        out.push('<ul class="list-disc ml-5 space-y-0.5">');
        inList = true;
      }
      out.push(`<li>${formatInline(escapeHtml(raw.replace(/^- /, "")))}</li>`);
    } else {
      if (inList) {
        out.push("</ul>");
        inList = false;
      }
      const content = formatInline(escapeHtml(raw));
      out.push(content === "" ? "<br/>" : `<p>${content}</p>`);
    }
  }
  if (inList) out.push("</ul>");
  return { __html: out.join("") };
};
