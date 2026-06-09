import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AppLayout } from "@/components/AppLayout";
import Index from "./pages/Index.tsx";
import Relatorios from "./pages/Relatorios.tsx";
import Assistente from "./pages/Assistente.tsx";
import Usuarios from "./pages/Usuarios.tsx";
import OneOnOne from "./pages/OneOnOne.tsx";
import OneOnOneForm from "./pages/OneOnOneForm.tsx";
import MeusOneOnOne from "./pages/MeusOneOnOne.tsx";
import MeusOneOnOneView from "./pages/MeusOneOnOneView.tsx";
import Elogios from "./pages/Elogios.tsx";
import MuralElogios from "./pages/MuralElogios.tsx";
import Sugestoes from "./pages/Sugestoes.tsx";
import AvisosAdmin from "./pages/AvisosAdmin.tsx";
import Configuracoes from "./pages/Configuracoes.tsx";
import Login from "./pages/Login.tsx";
import AuthCallback from "./pages/AuthCallback.tsx";
import Unauthorized from "./pages/Unauthorized.tsx";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

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
                    <Route path="/avisos" element={<AvisosAdmin />} />
                    <Route path="/configuracoes" element={<Configuracoes />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
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
