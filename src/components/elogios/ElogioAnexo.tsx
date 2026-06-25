import { FileDown } from "lucide-react";

interface Props {
  url: string | null | undefined;
  tipo: string | null | undefined; // 'imagem' | 'video' | 'audio'
  nome?: string | null;
  className?: string;
}

/** Renderiza o anexo de um elogio (print/imagem, vídeo ou áudio do cliente). */
export function ElogioAnexo({ url, tipo, nome, className = "" }: Props) {
  if (!url) return null;

  if (tipo === "imagem") {
    return (
      <a href={url} target="_blank" rel="noreferrer" className={`block mt-2 ${className}`}>
        <img
          src={url}
          alt={nome || "Anexo do elogio"}
          className="max-h-72 rounded-lg border border-border object-contain bg-muted/30"
        />
      </a>
    );
  }

  if (tipo === "video") {
    return (
      <video src={url} controls className={`mt-2 max-h-72 w-full rounded-lg border border-border bg-black ${className}`} />
    );
  }

  if (tipo === "audio") {
    return <audio src={url} controls className={`mt-2 w-full ${className}`} />;
  }

  // Fallback: link de download
  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className={`mt-2 inline-flex items-center gap-1.5 text-sm text-primary hover:underline ${className}`}
    >
      <FileDown className="h-4 w-4" /> {nome || "Abrir anexo"}
    </a>
  );
}

export default ElogioAnexo;
