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

// GET /domains/:id
export const getDomainByIdApi = async (id) => {
  try {
    const response = await axiosInstance.get(`/domains/${id}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// GET /domains/:id/scan-history
export const getDomainScanHistoryApi = async (id) => {
  try {
    const response = await axiosInstance.get(`/domains/${id}/scan-history`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// GET /domains/:id/latest-summary
export const getDomainLatestSummaryApi = async (id) => {
  try {
    const response = await axiosInstance.get(`/domains/${id}/latest-summary`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// POST /domains/:id/scan
export const triggerDomainScanApi = async (id) => {
  try {
    const response = await axiosInstance.post(`/domains/${id}/scan`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// GET /domains/:id/seo-pages
export const getDomainSeoPagesApi = async (id, page = 1, limit = 10, search = '', issue = '') => {
  try {
    const response = await axiosInstance.get(`/domains/${id}/seo-pages?page=${page}&limit=${limit}&search=${search}&issue=${encodeURIComponent(issue)}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// GET /domains/:id/seo-checkpoints
export const getDomainSeoCheckpointsApi = async (id) => {
  try {
    const response = await axiosInstance.get(`/domains/${id}/seo-checkpoints`);
    return response.data;
  } catch (error) {
    throw error;
  }
};
