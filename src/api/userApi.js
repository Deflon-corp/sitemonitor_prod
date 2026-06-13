import axiosInstance from "./axiosInstance";

/**
 * User API Service Layer
 */

// POST /users
export const createUserApi = async (userData) => {
  try {
    const response = await axiosInstance.post("/users", userData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// GET /users/:id
export const getUserByIdApi = async (userId) => {
  try {
    const response = await axiosInstance.get(`/users/${userId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// PUT /users/:id
export const updateUserApi = async (userId, userData) => {
  try {
    const response = await axiosInstance.put(`/users/${userId}`, userData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// GET /users
export const getUsersApi = async (params) => {
  try {
    const response = await axiosInstance.get("/users", { params });
    return response.data;
  } catch (error) {
    throw error;
  }
};
// DELETE /users/:id
export const deleteUserApi = async (userId) => {
  try {
    const response = await axiosInstance.delete(`/users/${userId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// POST /users/archive/:id
export const archiveUserApi = async (id) => {
  try {
    const response = await axiosInstance.post(`/users/archive/${id}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// POST /users/restore/:id
export const restoreUserApi = async (id) => {
  try {
    const response = await axiosInstance.post(`/users/restore/${id}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// DELETE /users/hard-delete/:id
export const hardDeleteUserApi = async (id) => {
  try {
    const response = await axiosInstance.delete(`/users/hard-delete/${id}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};
