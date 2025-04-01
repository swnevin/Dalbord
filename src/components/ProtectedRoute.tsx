
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  // Show a loading state while checking authentication
  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">
      <img 
        src="/lovable-uploads/f59d2e9a-80de-456b-bf9a-dd2bd0058c4b.png"
        alt="Loading..." 
        className="animate-pulse w-16 h-16"
      />
    </div>;
  }

  if (!user) {
    // Redirect to login, but preserve the intended destination
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
