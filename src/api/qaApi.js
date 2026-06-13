import axiosInstance from "./axiosInstance";

export const triggerQaScanApi = async (domainId) => {
  const response = await axiosInstance.post(`/qa/scan/${domainId}`);
  return response.data;
};

export const getQaScanStatusApi = async (domainId) => {
  const response = await axiosInstance.get(`/qa/scan-status/${domainId}`);
  return response.data;
};

export const getQaSummaryApi = async (domainId) => {
  const response = await axiosInstance.get(`/qa/summary/${domainId}`);
  return response.data;
};

export const getQaPageDetailApi = async (domainId, pageUrl) => {
  const response = await axiosInstance.get(
    `/qa/page-detail/${domainId}?pageUrl=${encodeURIComponent(pageUrl)}`,
  );
  return response.data;
};

export const getQaPagesApi = async (domainId, params = {}) => {
  const qs = new URLSearchParams(params).toString();
  const response = await axiosInstance.get(`/qa/pages/${domainId}?${qs}`);
  return response.data;
};

export const getQaBrokenLinksApi = async (domainId, params = {}) => {
  const qs = new URLSearchParams(params).toString();
  const response = await axiosInstance.get(
    `/qa/broken-links/${domainId}?${qs}`,
  );
  return response.data;
};

export const getQaBrokenLinksSitemapApi = async (domainId, params = {}) => {
  const qs = new URLSearchParams(params).toString();
  const response = await axiosInstance.get(
    `/qa/broken-links-sitemap/${domainId}?${qs}`,
  );
  return response.data;
};

export const getQaBrokenImagesApi = async (domainId, params = {}) => {
  const qs = new URLSearchParams(params).toString();
  const response = await axiosInstance.get(
    `/qa/broken-images/${domainId}?${qs}`,
  );
  return response.data;
};

export const getQaMisspellingsApi = async (domainId, params = {}) => {
  const qs = new URLSearchParams(params).toString();
  const response = await axiosInstance.get(
    `/qa/misspellings/${domainId}?${qs}`,
  );
  return response.data;
};

export const getQaSpellcheckSummaryApi = async (domainId) => {
  const response = await axiosInstance.get(
    `/qa/spellcheck-summary/${domainId}`,
  );
  return response.data;
};

export const getQaReadabilityApi = async (domainId) => {
  const response = await axiosInstance.get(`/qa/readability/${domainId}`);
  return response.data;
};

export const getQaReadabilityPagesApi = async (domainId, params = {}) => {
  const qs = new URLSearchParams(params).toString();
  const response = await axiosInstance.get(
    `/qa/readability-pages/${domainId}?${qs}`,
  );
  return response.data;
};

export const getQaBrokenLinkPagesApi = async (domainId, href) => {
  const response = await axiosInstance.get(
    `/qa/broken-link-pages/${domainId}?href=${encodeURIComponent(href)}`,
  );
  return response.data;
};

export const patchQaLinkStatusApi = async (domainId, body) => {
  const response = await axiosInstance.patch(
    `/qa/link-status/${domainId}`,
    body,
  );
  return response.data;
};
