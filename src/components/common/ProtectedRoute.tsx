import { ReactNode } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";

import { Role, useAuth } from "@/context/AuthContex";

type Props = {
  children?: ReactNode;
  allow?: Role[];
};

export default function ProtectedRoute({ children, allow }: Props) {
  const { firebaseUser, user, loading } = useAuth();
  const loc = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm font-medium text-gray-600">
        Loading...
      </div>
    );
  }

  if (!firebaseUser) {
    return <Navigate to="/signin" state={{ from: loc }} replace />;
  }

  if (allow && (!user || !allow.some((role) => role === user.role))) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children ? <>{children}</> : <Outlet />;
}
