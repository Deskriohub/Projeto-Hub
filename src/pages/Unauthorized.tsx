import { ShieldX } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

const Unauthorized = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-6 text-center px-4">
      <ShieldX className="h-20 w-20 text-destructive/60" />
      <h1 className="text-2xl font-bold text-foreground">Acesso negado</h1>
      <p className="text-muted-foreground max-w-md">
        Você não tem permissão para acessar esta página. Entre em contato com um
        administrador se acredita que isso é um erro.
      </p>
      <Button onClick={() => navigate("/")} variant="default">
        Voltar para a Home
      </Button>
    </div>
  );
};

export default Unauthorized;
