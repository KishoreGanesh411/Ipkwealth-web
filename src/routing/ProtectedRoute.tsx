import { JSX } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { Role, useAuth } from "@/context/AuthContex";

type Props = {
  children?: JSX.Element;
  allow?: Role[];
};

export default function ProtectedRoute({ children, allow }: Props) {
  const { firebaseUser, user, loading } = useAuth();
  const loc = useLocation();

  // While auth bootstraps, don't redirect
  if (loading) {
    return <div className="p-6 text-center">Loading…</div>;
  }

  // Not signed in → go to signin
  if (!firebaseUser) {
    return <Navigate to="/signin" state={{ from: loc }} replace />;
  }

  // Role-gated guard
  if (allow && (!user || !allow.includes(user.role as Role))) {
    return <Navigate to="/unauthorized" replace />;
  }

  // Support both wrapper and element usage
  return children ?? <Outlet />;
}
