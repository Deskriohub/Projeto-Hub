import { useEffect, useRef, useState, useCallback } from "react";
import { models, service, factories } from "powerbi-client";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, AlertCircle } from "lucide-react";

interface PowerBIReportProps {
  reportId: string;
  workspaceId?: string;
  isPaginated?: boolean;
}

interface EmbedData {
  accessToken: string;
  embedUrl: string;
  expiry: string;
  reportId: string;
}

interface FunctionErrorPayload {
  error?: string;
  stage?: string;
  details?: string;
  upstreamStatus?: number;
}

const powerbiService = new service.Service(
  factories.hpmFactory,
  factories.wpmpFactory,
  factories.routerFactory
);

function formatFunctionError(payload: FunctionErrorPayload | null, fallback: string) {
  if (!payload) return fallback;

  return [payload.stage ? `Etapa: ${payload.stage}` : null, payload.error, payload.details]
    .filter(Boolean)
    .join(" — ");
}

async function getFunctionErrorMessage(error: unknown, fallback: string) {
  if (!error || typeof error !== "object") return fallback;

  const response = "context" in error ? (error.context as Response | undefined) : undefined;
  if (!response) {
    return "message" in error && typeof error.message === "string"
      ? error.message
      : fallback;
  }

  try {
    const payload = (await response.clone().json()) as FunctionErrorPayload;
    return formatFunctionError(payload, fallback);
  } catch {
    try {
      const text = await response.clone().text();
      return text || fallback;
    } catch {
      return fallback;
    }
  }
}

export default function PowerBIReport({
  reportId,
  workspaceId,
  isPaginated,
}: PowerBIReportProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const reportRef = useRef<any>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEmbedData = useCallback(async (): Promise<EmbedData> => {
    const { data, error } = await supabase.functions.invoke("powerbi-embed", {
      body: { reportId, workspaceId, isPaginated },
    });

    if (error) {
      throw new Error(
        await getFunctionErrorMessage(error, "Falha ao obter token de embed")
      );
    }

    if (data?.error) {
      throw new Error(
        formatFunctionError(data as FunctionErrorPayload, "Falha ao obter token de embed")
      );
    }

    return data as EmbedData;
  }, [reportId, workspaceId, isPaginated]);

  const scheduleRenewal = useCallback(
    (expiry: string) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      const expiryMs = new Date(expiry).getTime();
      const renewAt = expiryMs - 5 * 60 * 1000;
      const delay = Math.max(renewAt - Date.now(), 30_000);

      timerRef.current = setTimeout(async () => {
        try {
          const fresh = await fetchEmbedData();
          if (reportRef.current) {
            await reportRef.current.setAccessToken(fresh.accessToken);
          }
          scheduleRenewal(fresh.expiry);
        } catch (err) {
          console.error("Erro ao renovar token:", err);
        }
      }, delay);
    },
    [fetchEmbedData]
  );

  useEffect(() => {
    let cancelled = false;

    async function embed() {
      setLoading(true);
      setError(null);

      try {
        const embedData = await fetchEmbedData();
        if (cancelled || !containerRef.current) return;


        const config: models.IReportEmbedConfiguration = {
          type: "report",
          id: embedData.reportId,
          embedUrl: embedData.embedUrl,
          accessToken: embedData.accessToken,
          tokenType: models.TokenType.Embed,
          settings: {
            panes: {
              filters: { expanded: false, visible: false },
              pageNavigation: { visible: true },
            },
            background: models.BackgroundType.Default,
            layoutType: models.LayoutType.Custom,
            customLayout: {
              displayOption: models.DisplayOption.FitToWidth,
            },
            bars: {
              actionBar: { visible: true },
            },
          },
        };

        powerbiService.reset(containerRef.current);
        const report = powerbiService.embed(containerRef.current, config);
        reportRef.current = report;

        report.on("loaded", () => {
          if (!cancelled) setLoading(false);
        });

        report.on("error", (event: any) => {
          console.error("Power BI embed error:", event.detail);
          if (!cancelled) {
            setError("Erro ao carregar o relatório.");
            setLoading(false);
          }
        });

        scheduleRenewal(embedData.expiry);
      } catch (err: any) {
        if (!cancelled) {
          console.error("Embed error:", err);
          setError(err.message || "Erro ao carregar o relatório.");
          setLoading(false);
        }
      }
    }

    embed();

    return () => {
      cancelled = true;
      if (timerRef.current) clearTimeout(timerRef.current);
      if (containerRef.current) powerbiService.reset(containerRef.current);
      reportRef.current = null;
    };
  }, [reportId, workspaceId, isPaginated, fetchEmbedData, scheduleRenewal]);

  return (
    <div className="relative w-full h-full">
      {loading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/80">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}
      {error && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-background px-6">
          <AlertCircle className="h-10 w-10 text-destructive" />
          <p className="max-w-2xl text-center text-sm text-muted-foreground">
            {error}
          </p>
        </div>
      )}
      <div ref={containerRef} style={{ width: "100%", height: "calc(100vh - 120px)", minHeight: "600px" }} />
    </div>
  );
}
