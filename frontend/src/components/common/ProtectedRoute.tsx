import React from "react";
import { Navigate, Outlet, useLocation } from "react-router";
import { useAuth } from "../../hooks/useAuth";

interface ProtectedRouteProps {
  allowedRoles?: ("athlete" | "coach")[];
  children?: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  allowedRoles,
  children,
}) => {
  const { user, isAuthenticated, loading, onboardingComplete } = useAuth();
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

  // Onboarding gate: send users who haven't completed onboarding through the
  // flow before anything else. `null` means still loading from /users/me — wait.
  // The /onboarding route itself is exempt to avoid a redirect loop.
  if (
    onboardingComplete === false &&
    location.pathname !== "/onboarding"
  ) {
    return <Navigate to="/onboarding" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    const fallbackRoute = user.role === "coach" ? "/coach/roster" : "/profile";
    return <Navigate to={fallbackRoute} replace />;
  }

  return children ? <>{children}</> : <Outlet />;
};
