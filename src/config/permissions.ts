export type AppRole = "admin" | "gestor" | "geral";

const ROLE_HIERARCHY: Record<AppRole, number> = { admin: 3, gestor: 2, geral: 1 };

export function hasMinRole(userRole: AppRole, requiredRole: AppRole): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}

export const ROLE_LABELS: Record<string, string> = {
  admin: "Admin",
  gestor: "Admin",
  geral: "Usuário",
};

export const ROUTE_PERMISSIONS: Record<string, AppRole> = {
  "/": "geral",
  "/assistente": "geral",
  "/usuarios": "admin",
  "/one-on-one": "admin",
  "/one-on-one/novo": "admin",
  "/meus-one-on-one": "geral",
  "/anotacoes": "admin",
  "/elogios": "geral",
  "/mural-elogios": "geral",
  "/sugestoes": "admin",
  "/minhas-sugestoes": "geral",
  "/avisos": "geral",
  "/eventos": "geral",
  "/ajuda": "geral",
  "/base-conhecimento": "admin",
  "/configuracoes": "geral",
};

export const NAV_PERMISSIONS: Record<string, AppRole> = {
  "/": "geral",
  "/assistente": "geral",
  "/usuarios": "admin",
  "/one-on-one": "admin",
  "/meus-one-on-one": "geral",
  "/anotacoes": "admin",
  "/elogios": "geral",
  "/mural-elogios": "geral",
  "/sugestoes": "admin",
  "/minhas-sugestoes": "geral",
  "/avisos": "geral",
  "/eventos": "geral",
  "/ajuda": "geral",
  "/base-conhecimento": "admin",
  "/configuracoes": "geral",
};

export const REPORT_CATEGORY_PERMISSIONS: Record<string, AppRole> = {};
