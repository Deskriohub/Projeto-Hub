import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { Navigate, useLocation } from "react-router-dom";
import { ROUTE_PERMISSIONS, hasMinRole } from "@/config/permissions";
import type { AppRole } from "@/config/permissions";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { session, loading: authLoading } = useAuth();
  const { role, loading: roleLoading } = useUserRole();
  const location = useLocation();

  if (authLoading || roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!session) return <Navigate to="/login" replace />;

  // Check route permission — longest matching key wins (exact match always longest)
  const path = location.pathname;
  const match = Object.keys(ROUTE_PERMISSIONS)
    .filter((k) => k !== "/" && (path === k || path.startsWith(k + "/")))
    .sort((a, b) => b.length - a.length)[0];
  const requiredRole = (match ? ROUTE_PERMISSIONS[match] : ROUTE_PERMISSIONS[path]) as
    | AppRole
    | undefined;

  // Wait until role is resolved before redirecting (avoid race on first render)
  if (requiredRole && !roleLoading && !hasMinRole(role, requiredRole)) {
    if (path.startsWith("/premiacao") || path.startsWith("/minha-premiacao")) return <Navigate to="/" replace />;
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
}
