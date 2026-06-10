import * as pdfjsLib from "pdfjs-dist";
import workerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";

pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;

/**
 * Extrai o texto de um arquivo PDF no navegador.
 * Retorna o texto concatenado de todas as páginas.
 */
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

/**
 * Lê o texto de um arquivo de texto simples (.txt, .md).
 */
export async function readTextFile(file: File): Promise<string> {
  return (await file.text()).trim();
}
