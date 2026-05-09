import axios from 'axios';
import { showToast } from '../components/common/alerts/ToastAlert';
import { getTenantId } from '../utils/subdomain';
import { LogoutAlert } from '../components/common/alerts/LogoutAlert';
import { clearSession } from '../utils/auth';

// Create a common axios instance
const axiosInstance = axios.create({
  baseURL: "http://localhost:3000/api",
  headers: {
    'accept': 'application/json',
    'Content-Type': 'application/json',
  },
});

// Request interceptor
axiosInstance.interceptors.request.use(
  (config) => {
    // Inject dynamic header: tenant_id extracted from subdomain
    const tenantId = getTenantId();

    // Set tenant_id header if it exists
    if (tenantId) {
      config.headers['tenant_id'] = tenantId;
    } else {
      showToast('Invalid tenant name', 'error');
    }

    // Auto attach token from localStorage
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }

    // Logging request
    console.log(`[API Request] ${config.method.toUpperCase()} ${config.url}`, config.data);

    return config;
  },
  (error) => {
    console.error('[API Request Error]', error);
    return Promise.reject(error);
  }
);

// Response interceptor
axiosInstance.interceptors.response.use(
  (response) => {
    // Logging response
    console.log(`[API Response] ${response.status} ${response.config.url}`, response.data);
    return response;
  },
  async (error) => {
    const { response, config } = error;
    const originalRequest = config;

    // Determine if it's a login request to avoid refresh loop on invalid credentials
    const isLoginRequest = config.url.includes('/auth/login');

    // Error handling (401 Unauthorized)
    if (response && response.status === 401 && !originalRequest._retry && !isLoginRequest) {
      originalRequest._retry = true;

      const refreshToken = localStorage.getItem('refreshToken');

      if (refreshToken) {
        try {
          // Use a new axios instance or direct axios call to avoid interceptor loop
          const refreshResponse = await axios.post(`${axiosInstance.defaults.baseURL}/auth/refresh-token`, {
            refresh_token: refreshToken,
          });

          // Match the user's specified response structure: { data: { access_token: "..." } }
          if (refreshResponse.data && refreshResponse.data.success) {
            const { access_token } = refreshResponse.data.data;

            // Update localStorage
            localStorage.setItem('token', access_token);

            // Dispatch a custom event to notify the application (e.g., AuthContext) to sync state
            window.dispatchEvent(new CustomEvent('auth:token-refreshed', { detail: { access_token } }));

            // Update Authorization header and retry original request
            originalRequest.headers['Authorization'] = `Bearer ${access_token}`;

            console.log('[Token Refresh] Successfully refreshed access token.');
            return axiosInstance(originalRequest);
          }
        } catch (refreshError) {
          console.error('[Refresh Token Error]', refreshError);

          // Clear session and show alert
          clearSession();
          await LogoutAlert();

          // Force a hard logout if refresh fails
          window.location.href = '/';
          return Promise.reject(refreshError);
        }
      } else {
        // Clear session and show alert
        clearSession();
        await LogoutAlert();

        window.location.href = '/';
      }
    }

    // Generic error handling using backend message
    if (response) {
      // Always prioritize backend message over hardcoded ones
      const backendMessage = response.data?.message;

      if (backendMessage) {
        showToast(backendMessage, 'error');
      } else if (response.status === 500) {
        showToast('Internal Server Error. Please try again later.', 'error');
      } else if (response.status !== 401 || isLoginRequest) {
        // Show generic error only if it's not a standard 401 (which is handled above or should show "Invalid Credentials" if login)
        showToast('Something went wrong. Please try again.', 'error');
      }
    } else {
      showToast('Something went wrong. Please try again.', 'error');
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
