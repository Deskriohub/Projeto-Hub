import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export default function AuthCallback() {
  const navigate = useNavigate();
  useEffect(() => {
    const handleCallback = async () => {
      try {
        const url = new URL(window.location.href);
        const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
        const errorDescription = url.searchParams.get("error_description") || hashParams.get("error_description");
        const errorCode = url.searchParams.get("error") || hashParams.get("error");
        if (errorDescription || errorCode) {
          toast({ title: "Erro", description: errorDescription || errorCode || "Falha na autenticação", variant: "destructive" });
          navigate("/login", { replace: true }); return;
        }
        const code = url.searchParams.get("code");
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(window.location.href);
          if (error) {
            toast({ title: "Erro", description: error.message, variant: "destructive" });
            navigate("/login", { replace: true }); return;
          }
        } else {
          await supabase.auth.getSession();
        }
        navigate("/", { replace: true });
      } catch (e) {
        toast({ title: "Erro inesperado", description: e instanceof Error ? e.message : "Falha", variant: "destructive" });
        navigate("/login", { replace: true });
      }
    };
    handleCallback();
  }, [navigate]);
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
    </div>
  );
}
