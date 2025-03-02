import { useContext } from "react";
import { Navigate, Outlet, useLocation } from "react-router";
import { AuthContext } from "../context/AuthContext";

interface ProtectedRouteProps {
  requireAdmin?: boolean;
  children?: React.ReactNode;
}

const ProtectedRoute = ({
  requireAdmin = false,
  children,
}: ProtectedRouteProps) => {
  const { isAuthenticated, isAdmin, loading } = useContext(AuthContext);
  const location = useLocation();

  // Show loading state while authentication state is being determined
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Check if user is authenticated
  if (!isAuthenticated) {
    // Redirect to login page but save the current location they were trying to access
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check if admin access is required
  if (requireAdmin && !isAdmin) {
    // Redirect to home page if admin access is required but user is not an admin
    return <Navigate to="/" replace />;
  }

  // If there are children, render them, otherwise render the outlet
  return children ? <>{children}</> : <Outlet />;
};

export default ProtectedRoute;