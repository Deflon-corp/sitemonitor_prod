import { Navigate } from "react-router-dom";
import useAuth from "../hooks/useAuth";

/**
 * GuestRouter Component
 * Redirects authenticated users to the home page.
 * Used for routes that should only be accessible to guests (e.g., Login, Forgot Password).
 */
const GuestRouter = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  // If user is already authenticated, redirect to home
  if (isAuthenticated) {
    return <Navigate to="/home" replace />;
  }

  // If not authenticated, render the guest component (e.g., LoginPage)
  return children;
};

export default GuestRouter;
