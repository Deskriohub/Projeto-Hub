// Categorias de elogio de cliente — sobre o quê é o elogio.
export const CATEGORIAS_CLIENTE = [
  { value: "colaborador", label: "Colaborador" },
  { value: "atendimento", label: "Atendimento" },
  { value: "produto", label: "Produto" },
  { value: "plataforma", label: "Funcionalidade / Plataforma" },
  { value: "outro", label: "Outro" },
] as const;

export function categoriaLabel(value: string | null | undefined): string {
  return CATEGORIAS_CLIENTE.find((c) => c.value === value)?.label || "—";
}

// Exibição da categoria: quando é "Outro", mostra o texto livre digitado.
export function categoriaDisplay(
  value: string | null | undefined,
  detalhe?: string | null,
): string {
  if (value === "outro") return detalhe?.trim() || "Outro";
  return categoriaLabel(value);
}

export type AnexoTipo = "imagem" | "video" | "audio";

// Deriva o tipo do anexo a partir do MIME do arquivo.
export function anexoTipoFromMime(mime: string): AnexoTipo | null {
  if (mime.startsWith("image/")) return "imagem";
  if (mime.startsWith("video/")) return "video";
  if (mime.startsWith("audio/")) return "audio";
  return null;
}

export const ANEXO_MAX_BYTES = 50 * 1024 * 1024; // 50 MB
