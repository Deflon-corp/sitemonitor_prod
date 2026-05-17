import axiosInstance from "./axiosInstance";

const performanceApi = {
    getSummary: (domainId) => axiosInstance.get(`/domain/performance/summary/${domainId}`).then(res => res.data),
    getPages: (domainId, params) => axiosInstance.get(`/domain/performance/pages/${domainId}`, { params }).then(res => res.data),
};

export default performanceApi;
