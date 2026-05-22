import React from "react";
import { Navigate, Outlet, useLocation } from "react-router";
import { useAuth } from "../../hooks/useAuth";

interface ProtectedRouteProps {
  // Making this optional means the route can just check for basic auth if no roles are passed
  allowedRoles?: ("athlete" | "coach")[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  allowedRoles,
}) => {
  const { user, isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background text-muted-foreground font-dmsans">
        Loading...
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    const fallbackRoute = user.role === "coach" ? "/coach/roster" : "/profile";
    return <Navigate to={fallbackRoute} replace />;
  }

  return <Outlet />;
};
