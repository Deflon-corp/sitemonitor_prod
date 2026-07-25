import axiosInstance from './axiosInstance';

export const getCompetitorReportsApi = async (domainName) => {
  try {
    const encodedDomain = encodeURIComponent(domainName);
    const response = await axiosInstance.get(`/competitor/reports/${encodedDomain}`, {
      baseURL: 'http://localhost:4100/api'
    });
    return { success: true, data: response.data };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const triggerCompetitorScanApi = async (domainName, sourceDomainDocId) => {
  try {
    const response = await axiosInstance.post('/competitor/scan', { domainName, sourceDomainDocId }, {
      baseURL: 'http://localhost:4100/api'
    });
    return { success: true, data: response.data };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const addCompetitorApi = async (sourceDomainDocId, competitorUrl) => {
  try {
    const response = await axiosInstance.post('/competitor/add', { sourceDomainDocId, competitorUrl }, {
      baseURL: 'http://localhost:4100/api'
    });
    return { success: true, data: response.data };
  } catch (error) {
    return { success: false, error: error.message };
  }
};
