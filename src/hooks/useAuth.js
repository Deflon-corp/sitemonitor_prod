import { useAuthContext } from "../context/AuthContext";

/**
 * Custom Hook: useAuth
 * Combines Redux and Context usage for easy authentication management
 */
const useAuth = () => {
  const auth = useAuthContext();

  // You can add more logic here, like checking for specific roles or permissions
  const isAuthenticated = !!auth.token;

  return {
    ...auth,
    isAuthenticated,
  };
};

export default useAuth;
