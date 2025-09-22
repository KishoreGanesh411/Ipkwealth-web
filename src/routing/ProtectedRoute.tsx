import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/context/AuthContex";
import type { Role } from "@/context/AuthContex";

type Props = {
  roles?: Role[];          // optional allowed roles
  children?: React.ReactNode;
};

export default function ProtectedRoute({ roles, children }: Props) {
  const { user } = useAuth();

  if (!user) return <Navigate to="/signin" replace />;

  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  // Support both wrapper usage and <Route element={<ProtectedRoute />}>
  return children ? <>{children}</> : <Outlet />;
}
