import axiosInstance from './axiosInstance';

/**
 * Domain API Service Layer
 */

// GET /domains?page=1&limit=10&is_archived=false
export const getDomainsApi = async (page = 1, limit = 10, isArchived = false) => {
  try {
    const response = await axiosInstance.get(`/domains?page=${page}&limit=${limit}&is_archived=${isArchived}`);
    return response.data;
  } catch (error) {
    // Error is already handled/toasted in axiosInstance interceptor
    throw error;
  }
};

// DELETE /domains/:dm_id
export const deleteDomainApi = async (dmId) => {
  try {
    const response = await axiosInstance.delete(`/domains/${dmId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// POST /domains/archive/:id
export const archiveDomainApi = async (id) => {
  try {
    const response = await axiosInstance.post(`/domains/archive/${id}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// POST /domains/restore/:id
export const restoreDomainApi = async (id) => {
  try {
    const response = await axiosInstance.post(`/domains/restore/${id}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// DELETE /domains/hard-delete/:id
export const hardDeleteDomainApi = async (id) => {
  try {
    const response = await axiosInstance.delete(`/domains/hard-delete/${id}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};
