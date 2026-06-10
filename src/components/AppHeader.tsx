import { SidebarTrigger } from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useUserRole } from "@/hooks/useUserRole";
import { useProfile } from "@/hooks/useProfile";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut, Moon } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { NotificationBell } from "@/components/NotificationBell";

const ROLE_LABELS: Record<string, string> = { admin: "Admin", gestor: "Gestor", geral: "Geral" };

export function AppHeader() {
  const { signOut } = useAuth();
  const { role } = useUserRole();
  const { fullName, initials, avatarUrl } = useProfile();
  const [isDark, setIsDark] = useState(
    () => typeof document !== "undefined" && document.documentElement.classList.contains("dark"),
  );

  useEffect(() => {
    if (isDark) { document.documentElement.classList.add("dark"); localStorage.setItem("theme-preference", "dark"); }
    else { document.documentElement.classList.remove("dark"); localStorage.setItem("theme-preference", "light"); }
  }, [isDark]);

  return (
    <header className="h-14 flex items-center justify-between border-b bg-card px-4 shrink-0">
      <div className="flex items-center gap-3">
        <SidebarTrigger />
      </div>
      <div className="flex items-center gap-2">
      <NotificationBell />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center gap-3 cursor-pointer outline-none">
            <div className="hidden sm:flex items-center gap-2">
              <span className="text-sm text-muted-foreground">{fullName}</span>
              <Badge variant="secondary" className="text-xs">{ROLE_LABELS[role] || role}</Badge>
            </div>
            <Avatar className="h-8 w-8">
              <AvatarImage src={avatarUrl ?? ""} alt={fullName} />
              <AvatarFallback className="bg-primary text-primary-foreground text-sm font-semibold">{initials}</AvatarFallback>
            </Avatar>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={signOut} className="cursor-pointer">
            <LogOut className="mr-2 h-4 w-4" />Sair
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={(e) => e.preventDefault()} onClick={() => setIsDark((v) => !v)}
            className="cursor-pointer flex items-center">
            <Moon className="mr-2 h-4 w-4" /><span className="flex-1">Tema Escuro</span>
            <Switch checked={isDark} className="ml-2 pointer-events-none" />
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      </div>
    </header>
  );
}
