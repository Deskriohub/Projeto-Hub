import { lazy, Suspense } from "react";
import { Loader2 } from "lucide-react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AppLayout } from "@/components/AppLayout";
import Login from "./pages/Login.tsx";
import AuthCallback from "./pages/AuthCallback.tsx";
import Unauthorized from "./pages/Unauthorized.tsx";

// Páginas carregadas sob demanda (code-splitting) — deixa o app inicial mais leve
const Index = lazy(() => import("./pages/Index.tsx"));
const Relatorios = lazy(() => import("./pages/Relatorios.tsx"));
const Assistente = lazy(() => import("./pages/Assistente.tsx"));
const Usuarios = lazy(() => import("./pages/Usuarios.tsx"));
const OneOnOne = lazy(() => import("./pages/OneOnOne.tsx"));
const OneOnOneForm = lazy(() => import("./pages/OneOnOneForm.tsx"));
const MeusOneOnOne = lazy(() => import("./pages/MeusOneOnOne.tsx"));
const MeusOneOnOneView = lazy(() => import("./pages/MeusOneOnOneView.tsx"));
const Elogios = lazy(() => import("./pages/Elogios.tsx"));
const MuralElogios = lazy(() => import("./pages/MuralElogios.tsx"));
const Sugestoes = lazy(() => import("./pages/Sugestoes.tsx"));
const MinhasSugestoes = lazy(() => import("./pages/MinhasSugestoes.tsx"));
const Ajuda = lazy(() => import("./pages/Ajuda.tsx"));
const Eventos = lazy(() => import("./pages/Eventos.tsx"));
const BaseConhecimento = lazy(() => import("./pages/BaseConhecimento.tsx"));
const AvisosAdmin = lazy(() => import("./pages/AvisosAdmin.tsx"));
const Configuracoes = lazy(() => import("./pages/Configuracoes.tsx"));
const NotFound = lazy(() => import("./pages/NotFound.tsx"));

const queryClient = new QueryClient();

function PageLoader() {
  return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="h-6 w-6 animate-spin text-primary" />
    </div>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/unauthorized" element={<Unauthorized />} />
            <Route path="/*" element={
              <ProtectedRoute>
                <AppLayout>
                  <Suspense fallback={<PageLoader />}>
                    <Routes>
                      <Route path="/" element={<Index />} />
                      <Route path="/relatorios" element={<Relatorios />} />
                      <Route path="/assistente" element={<Assistente />} />
                      <Route path="/usuarios" element={<Usuarios />} />
                      <Route path="/one-on-one" element={<OneOnOne />} />
                      <Route path="/one-on-one/novo" element={<OneOnOneForm />} />
                      <Route path="/one-on-one/:id" element={<OneOnOneForm />} />
                      <Route path="/meus-one-on-one" element={<MeusOneOnOne />} />
                      <Route path="/meus-one-on-one/:id" element={<MeusOneOnOneView />} />
                      <Route path="/elogios" element={<Elogios />} />
                      <Route path="/mural-elogios" element={<MuralElogios />} />
                      <Route path="/sugestoes" element={<Sugestoes />} />
                      <Route path="/minhas-sugestoes" element={<MinhasSugestoes />} />
                      <Route path="/ajuda" element={<Ajuda />} />
                      <Route path="/base-conhecimento" element={<BaseConhecimento />} />
                      <Route path="/avisos" element={<AvisosAdmin />} />
                      <Route path="/eventos" element={<Eventos />} />
                      <Route path="/configuracoes" element={<Configuracoes />} />
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </Suspense>
                </AppLayout>
              </ProtectedRoute>
            } />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
