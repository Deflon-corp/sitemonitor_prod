import axiosInstance from "./axiosInstance";

export const createPolicyApi = async (data) => {
  const response = await axiosInstance.post("/policies", data);
  return response.data;
};

export const getPoliciesApi = async (query = {}) => {
  const response = await axiosInstance.get("/policies", { params: query });
  return response.data;
};

export const getPolicyByIdApi = async (id) => {
  const response = await axiosInstance.get(`/policies/${id}`);
  return response.data;
};

export const updatePolicyApi = async (id, data) => {
  const response = await axiosInstance.put(`/policies/${id}`, data);
  return response.data;
};

export const deletePolicyApi = async (id) => {
  const response = await axiosInstance.delete(`/policies/${id}`);
  return response.data;
};

export const getPolicyStatsApi = async (query = {}) => {
  const response = await axiosInstance.get("/policies/stats", { params: query });
  return response.data;
};
