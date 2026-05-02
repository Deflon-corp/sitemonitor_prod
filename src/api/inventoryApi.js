import axiosInstance from "./axiosInstance";

const inventoryApi = {
    getSummary: (domain) => axiosInstance.get(`/inventory/summary?domain=${domain}`),
    getHtmlPages: (domain) => axiosInstance.get(`/inventory/html-pages?domain=${domain}`),
    getCss: (domain) => axiosInstance.get(`/inventory/css?domain=${domain}`),
    getJs: (domain) => axiosInstance.get(`/inventory/js?domain=${domain}`),
    getImages: (domain) => axiosInstance.get(`/inventory/images?domain=${domain}`),
    getLinks: (domain) => axiosInstance.get(`/inventory/links?domain=${domain}`),
};

export default inventoryApi;
