import axiosInstance from "./axiosInstance";

/**
 * Get Dark Pattern summary for a domain
 * GET /api/dark-pattern/summary/:domainName
 */
export const getDarkPatternSummaryApi = async (domainName) => {
  try {
    const encodedDomain = encodeURIComponent(domainName);
    const response = await axiosInstance.get(`/dark-pattern/summary/${encodedDomain}`, {
      baseURL: "http://localhost:4100/api"
    });
    return { success: true, data: response.data };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Get Dark Pattern page issues for a domain
 * GET /api/dark-pattern/issues/:domainName
 */
export const getDarkPatternIssuesApi = async (domainName) => {
  try {
    const encodedDomain = encodeURIComponent(domainName);
    const response = await axiosInstance.get(`/dark-pattern/issues/${encodedDomain}`, {
      baseURL: "http://localhost:4100/api"
    });
    return { success: true, data: response.data };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Trigger a new Dark Pattern scan
 * POST /api/dark-pattern/scan
 */
export const triggerDarkPatternScanApi = async (domainName, pageLimit = 10, sourceDomainDocId) => {
  try {
    const response = await axiosInstance.post('/dark-pattern/scan', { domainName, pageLimit, sourceDomainDocId }, {
      baseURL: "http://localhost:4100/api"
    });
    return { success: true, data: response.data };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Generate remediation code for an issue
 * POST /api/dark-pattern/remediation/generate
 */
export const generateRemediationCodeApi = async (type, description, suggestion) => {
  try {
    const response = await axiosInstance.post('/dark-pattern/remediation/generate', 
      { type, description, suggestion }, 
      { baseURL: "http://localhost:4100/api" }
    );
    return { success: true, data: response.data };
  } catch (error) {
    return { success: false, error: error.message };
  }
};
