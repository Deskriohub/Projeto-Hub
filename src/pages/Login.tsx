import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Eye, EyeOff } from "lucide-react";
import deskrioLogo from "@/assets/deskrio-logo.png";

export default function Login() {
  const { session, loading, authError, clearAuthError, signInWithEmail, resetPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotSending, setForgotSending] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }
  if (session) return <Navigate to="/" replace />;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    clearAuthError();
    setIsSubmitting(true);
    await signInWithEmail(email, password, rememberMe);
    setIsSubmitting(false);
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotSending(true);
    await resetPassword(forgotEmail);
    setForgotSending(false);
    setShowForgot(false);
    setForgotEmail("");
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center md:justify-start p-6 md:pl-20 bg-cover bg-center bg-no-repeat"
      style={{
        backgroundColor: "hsl(138 35% 92%)",
        backgroundImage: "url('/login-bg.png')",
      }}
    >
      <div className="w-full max-w-sm">
        <div className="bg-white/60 backdrop-blur-md rounded-2xl shadow-xl ring-1 ring-white/40 p-8 flex flex-col gap-5">
          <div className="flex flex-col gap-1">
            <img src={deskrioLogo} alt="DeskRio" className="h-9 object-contain self-start" />
          </div>

          {!showForgot ? (
            <form onSubmit={handleLogin} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="email">Login</Label>
                <Input id="email" type="email" placeholder="seu@deskrio.com.br"
                  value={email} onChange={(e) => setEmail(e.target.value)}
                  required autoComplete="email" className="bg-white" />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="password">Senha</Label>
                <div className="relative">
                  <Input id="password" type={showPassword ? "text" : "password"} placeholder="••••••••"
                    value={password} onChange={(e) => setPassword(e.target.value)}
                    required autoComplete="current-password" className="bg-white pr-10" />
                  <button type="button" onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" tabIndex={-1}>
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox id="remember" checked={rememberMe} onCheckedChange={(v) => setRememberMe(!!v)} />
                <Label htmlFor="remember" className="text-sm font-normal cursor-pointer">Lembrar-me</Label>
              </div>
              {authError && <p role="alert" className="text-sm text-destructive text-center">{authError}</p>}
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? "Entrando..." : "Entrar"}
              </Button>
              <button type="button" onClick={() => { clearAuthError(); setShowForgot(true); }}
                className="text-sm text-primary hover:underline text-center">
                Esqueci minha senha
              </button>
            </form>
          ) : (
            <form onSubmit={handleForgot} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <h2 className="text-base font-semibold">Redefinir senha</h2>
                <p className="text-sm text-muted-foreground">Informe seu e-mail e enviaremos o link de redefinição.</p>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="forgot-email">E-mail</Label>
                <Input id="forgot-email" type="email" placeholder="seu@deskrio.com.br"
                  value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)} required className="bg-white" />
              </div>
              <Button type="submit" className="w-full" disabled={forgotSending}>
                {forgotSending ? "Enviando..." : "Enviar link"}
              </Button>
              <button type="button" onClick={() => setShowForgot(false)}
                className="text-sm text-primary hover:underline text-center">Voltar ao login</button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
