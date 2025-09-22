// src/components/common/ProtectedRoute.tsx
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { Role, useAuth } from "@/context/AuthContext_temp";

export default function ProtectedRoute({ allowed }: { allowed?: Role[] }) {
  const { user } = useAuth();
  const loc = useLocation();

  if (!user) return <Navigate to="/signin" state={{ from: loc }} replace />;
  if (allowed && !allowed.includes(user.role)) return <Navigate to="/unauthorized" replace />;
  return <Outlet />;
}
