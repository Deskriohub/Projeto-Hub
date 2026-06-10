import {
  Home, BarChart3, Bot, Users, Smile,
  CalendarRange, Lightbulb, Settings, ChevronDown, Megaphone, MessageCircle, HelpCircle, CalendarPlus, type LucideIcon
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import deskrioLogo from "@/assets/deskrio-logo.png";
import { useLocation, useNavigate } from "react-router-dom";
import { useUserRole } from "@/hooks/useUserRole";
import { NAV_PERMISSIONS, hasMinRole } from "@/config/permissions";
import type { AppRole } from "@/config/permissions";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
  SidebarMenuSub, SidebarMenuSubItem, SidebarMenuSubButton, useSidebar,
} from "@/components/ui/sidebar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";


interface SidebarReport { name: string; url?: string; reportId?: string; workspaceId?: string; isPaginated?: boolean; }

const dashboardsDeskRio: SidebarReport[] = [];

function buildReportUrl(report: SidebarReport): string {
  const params = new URLSearchParams();
  params.set("name", report.name);
  if (report.reportId) params.set("reportId", report.reportId);
  if (report.workspaceId) params.set("workspaceId", report.workspaceId);
  if (report.url) params.set("url", report.url);
  if (report.isPaginated) params.set("isPaginated", "true");
  return `/relatorios?${params.toString()}`;
}

interface SimpleNavItem { title: string; url: string; icon: LucideIcon; minRole?: AppRole; }

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const navigate = useNavigate();
  const { role } = useUserRole();

  const isActive = (path: string) => location.pathname === path;
  const isRelatoriosActive = location.pathname === "/relatorios";
  const currentReportId = new URLSearchParams(location.search).get("reportId");
  const canSee = (url: string) => { const r = NAV_PERMISSIONS[url]; return !r || hasMinRole(role, r); };

  const renderSimpleItem = (item: SimpleNavItem) => {
    return (
      <SidebarMenuItem key={item.title}>
        <SidebarMenuButton asChild isActive={isActive(item.url)} tooltip={item.title}>
          <NavLink to={item.url} end
            className="text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
            activeClassName="bg-sidebar-accent text-sidebar-primary font-semibold">
            <item.icon className="h-5 w-5" />
            {!collapsed && <span>{item.title}</span>}
          </NavLink>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  };

  const inicioItems: SimpleNavItem[] = [
    { title: "Home", url: "/", icon: Home },
  ];

  // Admin/gestor é líder: acompanha os liderados em "Todas as reuniões" (não tem 1:1 próprio).
  // Usuário comum é liderado: vê só "Minhas reuniões".
  const oneOnOneSubItems: { title: string; url: string; minRole: AppRole }[] =
    role === "admin"
      ? [{ title: "Todas as reuniões", url: "/one-on-one", minRole: "admin" }]
      : [{ title: "Minhas reuniões", url: "/meus-one-on-one", minRole: "geral" }];

  const recursosTail: SimpleNavItem[] = [
    { title: "Avisos", url: "/avisos", icon: Megaphone },
    { title: "Eventos", url: "/eventos", icon: CalendarPlus },
    { title: "Deskinho", url: "/assistente", icon: Bot },
    { title: "Ajuda", url: "/ajuda", icon: HelpCircle },
  ];

  const adminItems: SimpleNavItem[] = [
    { title: "Usuários", url: "/usuarios", icon: Users },
    { title: "Sugestões", url: "/sugestoes", icon: Lightbulb },
    { title: "Configurações", url: "/configuracoes", icon: Settings },
  ];

  const visibleInicio = inicioItems.filter((i) => canSee(i.url));
  const visibleRecursosTail = recursosTail.filter((i) => canSee(i.url));
  const visibleAdmin = adminItems.filter((i) => canSee(i.url));

  const renderSubMenu = (
    label: string, icon: LucideIcon,
    subItems: { title: string; url: string; minRole?: AppRole }[], tooltip: string
  ) => {
    const Icon = icon;
    const visible = subItems.filter((s) => hasMinRole(role, s.minRole ?? "geral" as AppRole));
    if (visible.length === 0) return null;
    const active = visible.some((s) => isActive(s.url));
    return (
      <Collapsible defaultOpen={active} className="group/collapsible">
        <SidebarMenuItem>
          <CollapsibleTrigger asChild>
            <SidebarMenuButton tooltip={tooltip} isActive={active}
              className="text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-primary data-[active=true]:font-semibold">
              <Icon className="h-5 w-5" />
              {!collapsed && (<><span className="flex-1">{label}</span>
                <ChevronDown className="h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-180" /></>)}
            </SidebarMenuButton>
          </CollapsibleTrigger>
          {!collapsed && (
            <CollapsibleContent>
              <SidebarMenuSub>
                {visible.map((sub) => (
                  <SidebarMenuSubItem key={sub.url}>
                    <SidebarMenuSubButton asChild isActive={isActive(sub.url)}>
                      <NavLink to={sub.url} end
                        className="text-sidebar-foreground/60 hover:text-sidebar-foreground"
                        activeClassName="text-sidebar-primary font-semibold">
                        <span>{sub.title}</span>
                      </NavLink>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                ))}
              </SidebarMenuSub>
            </CollapsibleContent>
          )}
        </SidebarMenuItem>
      </Collapsible>
    );
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarContent className="pt-6 bg-sidebar">
        <div className="flex flex-col items-center gap-1 px-4 pb-6 border-b border-sidebar-border">
          {collapsed ? (
            <img src={deskrioLogo} alt="DeskRio" className="h-7 w-7 object-contain object-left" style={{ objectPosition: "left" }} />
          ) : (
            <>
              <img src={deskrioLogo} alt="DeskRio" className="h-8 object-contain" />
              <span className="text-xs text-sidebar-foreground/50 font-medium">Central de Gestão</span>
            </>
          )}
        </div>

        {/* Início */}
        {visibleInicio.length > 0 && (
          <SidebarGroup className="mt-4">
            {!collapsed && <SidebarGroupLabel>Início</SidebarGroupLabel>}
            <SidebarGroupContent><SidebarMenu>{visibleInicio.map(renderSimpleItem)}</SidebarMenu></SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Gestão — Relatórios Power BI (preencher com os do DeskRio) */}
        <SidebarGroup>
          {!collapsed && <SidebarGroupLabel>Gestão</SidebarGroupLabel>}
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isRelatoriosActive} tooltip="Relatórios">
                  <NavLink to="/relatorios" end
                    className="text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
                    activeClassName="bg-sidebar-accent text-sidebar-primary font-semibold">
                    <BarChart3 className="h-5 w-5" />
                    {!collapsed && <span>Relatórios</span>}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
              {dashboardsDeskRio.length === 0 && !collapsed && (
                <SidebarMenuItem>
                  <span className="pl-9 text-xs text-sidebar-foreground/40 italic">Em Breve</span>
                </SidebarMenuItem>
              )}
              {dashboardsDeskRio.map((report) => (
                <SidebarMenuItem key={report.name}>
                  <SidebarMenuButton
                    isActive={isRelatoriosActive && report.reportId === currentReportId}
                    onClick={() => navigate(buildReportUrl(report))}
                    className="text-sidebar-foreground/60 hover:text-sidebar-foreground cursor-pointer pl-9">
                    {!collapsed && <span>{report.name}</span>}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Pessoas & Performance — só Mural + 1:1 */}
        <SidebarGroup>
          {!collapsed && <SidebarGroupLabel>Pessoas &amp; Performance</SidebarGroupLabel>}
          <SidebarGroupContent>
            <SidebarMenu>
              {renderSimpleItem({ title: "Mural de Elogios", url: "/mural-elogios", icon: Smile })}
              {renderSimpleItem({ title: "Feedbacks", url: "/feedbacks", icon: MessageCircle })}
              {/* "Minhas Sugestões" só para usuário comum — admin usa "Sugestões" para responder */}
              {role !== "admin" && renderSimpleItem({ title: "Minhas Sugestões", url: "/minhas-sugestoes", icon: Lightbulb })}
              {renderSubMenu("One-on-One", CalendarRange, oneOnOneSubItems, "One-on-One")}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Recursos — Assistente IA */}
        {visibleRecursosTail.length > 0 && (
          <SidebarGroup>
            {!collapsed && <SidebarGroupLabel>Recursos</SidebarGroupLabel>}
            <SidebarGroupContent>
              <SidebarMenu>
                {visibleRecursosTail.map(renderSimpleItem)}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Administração */}
        {visibleAdmin.length > 0 && (
          <SidebarGroup>
            {!collapsed && <SidebarGroupLabel>Administração</SidebarGroupLabel>}
            <SidebarGroupContent><SidebarMenu>{visibleAdmin.map(renderSimpleItem)}</SidebarMenu></SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
    </Sidebar>
  );
}
