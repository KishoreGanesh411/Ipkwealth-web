import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContex";
import { JSX } from "react";

export default function ProtectedRoute({
  children,
  roles,
}: {
  children: JSX.Element;
  roles?: Array<"ADMIN" | "RM" | "STAFF" | "MARKETING">;
}) {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) return <Navigate to="/signin" replace />;

  if (roles && user && !roles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
}
