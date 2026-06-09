import { useSearchParams } from "react-router-dom";
import { BarChart3 } from "lucide-react";
import PowerBIReport from "@/components/PowerBIReport";

const Relatorios = () => {
  const [searchParams] = useSearchParams();
  const name = searchParams.get("name");
  const reportId = searchParams.get("reportId");
  const workspaceId = searchParams.get("workspaceId") || undefined;
  const url = searchParams.get("url");
  const isPaginated = searchParams.get("isPaginated") === "true";
  const hasReport = name && (reportId || url);

  return (
    <div className="flex h-[calc(100vh-4rem)] -m-6">
      <div className="flex-1 flex flex-col min-w-0">
        {hasReport ? (
          <>
            <div className="px-6 py-4 border-b border-border bg-background">
              <h1 className="text-xl font-bold text-foreground">{name}</h1>
            </div>
            <div className="flex-1">
              {reportId ? (
                <PowerBIReport key={reportId} reportId={reportId} workspaceId={workspaceId} isPaginated={isPaginated} />
              ) : url ? (
                <iframe src={url} title={name ?? "Relatório"} className="w-full h-full border-0" allowFullScreen />
              ) : null}
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center p-8">
            <BarChart3 className="h-12 w-12 text-muted-foreground/40" />
            <p className="font-medium text-foreground">Relatórios Power BI</p>
            <p className="text-sm text-muted-foreground max-w-sm">
              Cadastre os relatórios do DeskRio em <code className="text-xs bg-muted px-1 py-0.5 rounded">AppSidebar.tsx</code> (lista <code className="text-xs bg-muted px-1 py-0.5 rounded">dashboardsDeskRio</code>).
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
export default Relatorios;
