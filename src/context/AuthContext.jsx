import { createContext, useContext, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { loginUserThunk, logout, updateTokens, sendOtpThunk, verifyOtpThunk } from '../redux/slices/auth/authSlice';

// Create Auth Context
const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const dispatch = useDispatch();
  const { user, token, loading, error, success } = useSelector((state) => state.auth);

  // Sync token from axios interceptor (via custom event) back to Redux
  useEffect(() => {
    const handleTokenRefreshed = (event) => {
      const { access_token } = event.detail;
      if (access_token) {
        dispatch(updateTokens({ access_token }));
      }
    };

    window.addEventListener('auth:token-refreshed', handleTokenRefreshed);
    return () => window.removeEventListener('auth:token-refreshed', handleTokenRefreshed);
  }, [dispatch]);

  // Function to handle login
  const login = async (data) => {
    return dispatch(loginUserThunk(data));
  };

  // Function to handle send OTP
  const sendOtp = async (loginId) => {
    return dispatch(sendOtpThunk(loginId));
  };

  // Function to handle verify OTP
  const verifyOtp = async (loginId, otp) => {
    return dispatch(verifyOtpThunk({ loginId, otp }));
  };

  // Function to handle logout
  const handleLogout = () => {
    dispatch(logout());
  };

  // Optional: Auto logout if token expires or is invalid (handled in axios interceptor but also here)
  useEffect(() => {
    if (!token) {
      // Logic for missing token
    }
  }, [token]);

  const value = {
    user,
    token,
    loading,
    error,
    success,
    login,
    sendOtp,
    verifyOtp,
    logout: handleLogout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Use this hook for Context API usage
export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
};