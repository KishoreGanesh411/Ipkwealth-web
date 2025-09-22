// src/components/common/ProtectedRoute.tsx
import { ReactNode } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { Role, useAuth } from "@/context/AuthContex";

type Props = {
  children?: ReactNode;
  allow?: Role[];
};

export default function ProtectedRoute({ children, allow }: Props) {
  const { user } = useAuth();
  const loc = useLocation();

  if (!user) {
    return <Navigate to="/signin" state={{ from: loc }} replace />;
  }

  if (allow && !allow.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  // Works both for wrapper use and as a <Route element>
  return children ? <>{children}</> : <Outlet />;
}
