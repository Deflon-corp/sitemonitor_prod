import { Navigate } from "react-router-dom";
import useAuth from "../hooks/useAuth";

const ProtectedRouter = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/" />;
  }
  return children;
};

export default ProtectedRouter;
