import axiosInstance from "./axiosInstance";

export const getAccessibilitySummaryApi = async (domainId) => {
  const response = await axiosInstance.get(
    `/accessibility/${domainId}/summary`,
  );
  return response.data;
};

export const getAccessibilityPageDetailApi = async (domainId, pageUrl) => {
  const response = await axiosInstance.get(
    `/accessibility/${domainId}/page-detail`,
    { params: { pageUrl } },
  );
  return response.data;
};

export const getAccessibilityPagesApi = async (domainId, params) => {
  const response = await axiosInstance.get(`/accessibility/${domainId}/pages`, {
    params,
  });
  return response.data;
};

export const getAccessibilityScanStatusApi = async (domainId) => {
  const response = await axiosInstance.get(`/accessibility/${domainId}/status`);
  return response.data;
};

export const triggerAccessibilityScanApi = async (domainId) => {
  const response = await axiosInstance.post(
    `/accessibility/${domainId}/trigger`,
  );
  return response.data;
};
