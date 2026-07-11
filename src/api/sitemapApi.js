import axiosInstance from "./axiosInstance";

export const getDomainSitemapsApi = async (domainId) => {
  try {
    const response = await axiosInstance.get(`/sitemap?domainId=${domainId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};
