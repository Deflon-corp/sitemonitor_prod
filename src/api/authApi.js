import axiosInstance from './axiosInstance';

/**
 * Authentication API Service Layer
 */

// POST /auth/login
export const loginUser = async (data) => {
  try {
    const response = await axiosInstance.post('/auth/login', data);
    return response.data;
  } catch (error) {
    // Error is already logged in axiosInstance interceptor
    throw error;
  }
};

// POST /auth/refresh-token
export const refreshAccessTokenApi = async (refreshToken) => {
  try {
    const response = await axiosInstance.post('/auth/refresh-token', {
      refresh_token: refreshToken,
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};
// POST /auth/send-otp
export const sendOtpApi = async (loginId) => {
  try {
    const response = await axiosInstance.post('/auth/send-otp', {
      login_id: loginId,
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// POST /auth/verify-otp
export const verifyOtpApi = async (loginId, otp) => {
  try {
    const response = await axiosInstance.post('/auth/verify-otp', {
      login_id: loginId,
      otp: otp,
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};
