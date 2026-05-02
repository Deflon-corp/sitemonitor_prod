/**
 * Authentication utilities for session management
 */

/**
 * Clears all session-related data from storage
 * This includes tokens and potentially other cached user data
 */
export const clearSession = () => {
    // Clear fundamental authentication tokens
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user'); // If user object is stored here
    
    // Clear session storage if any sensitive data is there
    sessionStorage.clear();
    
    // Log for debugging
    console.log('[Auth] Session cleared successfully.');
};

/**
 * Checks if the current token is physically present
 * (Optional: could also check expiration if using jwt-decode)
 */
export const isAuthenticated = () => {
    return !!localStorage.getItem('token');
};
