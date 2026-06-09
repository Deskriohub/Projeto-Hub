export type AppRole = "admin" | "gestor" | "geral";

const ROLE_HIERARCHY: Record<AppRole, number> = { admin: 3, gestor: 2, geral: 1 };

export function hasMinRole(userRole: AppRole, requiredRole: AppRole): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}

export const ROUTE_PERMISSIONS: Record<string, AppRole> = {
  "/": "geral",
  "/relatorios": "geral",
  "/assistente": "geral",
  "/usuarios": "admin",
  "/one-on-one": "gestor",
  "/one-on-one/novo": "gestor",
  "/meus-one-on-one": "geral",
  "/elogios": "geral",
  "/mural-elogios": "geral",
  "/sugestoes": "admin",
  "/configuracoes": "admin",
};

export const NAV_PERMISSIONS: Record<string, AppRole> = {
  "/": "geral",
  "/relatorios": "geral",
  "/assistente": "geral",
  "/usuarios": "admin",
  "/one-on-one": "gestor",
  "/meus-one-on-one": "geral",
  "/elogios": "geral",
  "/mural-elogios": "geral",
  "/sugestoes": "admin",
  "/configuracoes": "admin",
};

export const REPORT_CATEGORY_PERMISSIONS: Record<string, AppRole> = {};
