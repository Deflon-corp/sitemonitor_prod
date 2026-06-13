import axiosInstance from "./axiosInstance";

/**
 * Admin API Service Layer
 */

// GET /admin/:id
export const getAdminByIdApi = async (adminId) => {
  try {
    const response = await axiosInstance.get(`/admin/${adminId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// PUT /admin/:id
export const updateAdminApi = async (adminId, data) => {
  try {
    const response = await axiosInstance.put(`/admin/${adminId}`, data);
    return response.data;
  } catch (error) {
    throw error;
  }
};
