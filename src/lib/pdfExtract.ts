import * as pdfjsLib from "pdfjs-dist";
import workerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import mammoth from "mammoth/mammoth.browser";
import JSZip from "jszip";

pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;

/** Extrai o texto de um PDF no navegador. */
export async function extractPdfText(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
  const pages: string[] = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const strings = (content.items as Array<{ str?: string }>)
      .map((it) => it.str ?? "")
      .filter(Boolean);
    pages.push(strings.join(" "));
  }
  return pages.join("\n\n").replace(/\s+\n/g, "\n").trim();
}

/** Extrai o texto de um DOCX (Word) no navegador. */
export async function extractDocxText(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  return (result.value || "").trim();
}

/** Extrai o texto de um PPTX (PowerPoint) no navegador. */
export async function extractPptxText(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const zip = await JSZip.loadAsync(arrayBuffer);

  // Pega os slides na ordem correta (slide1.xml, slide2.xml, ...)
  const slidePaths = Object.keys(zip.files)
    .filter((p) => /^ppt\/slides\/slide\d+\.xml$/.test(p))
    .sort((a, b) => {
      const na = parseInt(a.match(/slide(\d+)\.xml/)?.[1] ?? "0", 10);
      const nb = parseInt(b.match(/slide(\d+)\.xml/)?.[1] ?? "0", 10);
      return na - nb;
    });

  const slides: string[] = [];
  for (const path of slidePaths) {
    const xml = await zip.files[path].async("string");
    // Extrai o texto dentro das tags <a:t>...</a:t>
    const matches = xml.match(/<a:t>([\s\S]*?)<\/a:t>/g) || [];
    const text = matches
      .map((m) => m.replace(/<a:t>([\s\S]*?)<\/a:t>/, "$1"))
      .join(" ")
      .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'");
    if (text.trim()) slides.push(text.trim());
  }
  return slides.join("\n\n").trim();
}

/** Lê o texto de um arquivo de texto simples (.txt, .md). */
export async function readTextFile(file: File): Promise<string> {
  return (await file.text()).trim();
}

/** Renderiza as páginas de um PDF como imagens JPEG (data URLs) para leitura por IA de visão. */
export async function renderPdfToImages(file: File, maxPages = 8): Promise<string[]> {
  const buffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
  const total = Math.min(pdf.numPages, maxPages);
  const images: string[] = [];
  for (let i = 1; i <= total; i++) {
    const page = await pdf.getPage(i);
    // escala maior = mais nitidez para o OCR ler textos pequenos nos prints
    const viewport = page.getViewport({ scale: 2.0 });
    const canvas = document.createElement("canvas");
    canvas.width = Math.floor(viewport.width);
    canvas.height = Math.floor(viewport.height);
    const ctx = canvas.getContext("2d");
    if (!ctx) continue;
    await page.render({ canvasContext: ctx, viewport, canvas } as Parameters<typeof page.render>[0]).promise;
    images.push(canvas.toDataURL("image/jpeg", 0.8));
  }
  return images;
}

/** Converte um arquivo de imagem em data URL. */
export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/** Detecta o tipo do arquivo e extrai o texto com o método adequado. */
export async function extractDocumentText(file: File): Promise<string> {
  const name = file.name.toLowerCase();
  if (name.endsWith(".pdf") || file.type === "application/pdf") return extractPdfText(file);
  if (name.endsWith(".docx")) return extractDocxText(file);
  if (name.endsWith(".pptx")) return extractPptxText(file);
  if (name.endsWith(".txt") || name.endsWith(".md") || file.type.startsWith("text/")) return readTextFile(file);
  throw new Error("Formato não suportado. Use PDF, DOCX, PPTX, TXT ou MD.");
}
