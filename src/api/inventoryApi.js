import axiosInstance from "./axiosInstance";

const inventoryApi = {
    getSummary: (domain) => axiosInstance.get(`/inventory/summary?domain=${domain}`).then(res => res.data),
    getHtmlPages: (domain) => axiosInstance.get(`/inventory/html-pages?domain=${domain}`).then(res => res.data),
    getCss: (domain) => axiosInstance.get(`/inventory/css?domain=${domain}`).then(res => res.data),
    getJs: (domain) => axiosInstance.get(`/inventory/js?domain=${domain}`).then(res => res.data),
    getImages: (domain) => axiosInstance.get(`/inventory/images?domain=${domain}`).then(res => res.data),
    getLinks: (domain) => axiosInstance.get(`/inventory/links?domain=${domain}`).then(res => res.data),
    getDocuments: (domain) => axiosInstance.get(`/inventory/documents?domain=${domain}`).then(res => res.data),
    getForms: (domain) => axiosInstance.get(`/inventory/forms?domain=${domain}`).then(res => res.data),
    getHeadlinks: (domain) => axiosInstance.get(`/inventory/headlinks?domain=${domain}`).then(res => res.data),
    getIframes: (domain) => axiosInstance.get(`/inventory/iframes?domain=${domain}`).then(res => res.data),
    getFrames: (domain) => axiosInstance.get(`/inventory/frames?domain=${domain}`).then(res => res.data),
    getEmailAddresses: (domain) => axiosInstance.get(`/inventory/email-addresses?domain=${domain}`).then(res => res.data),
};

export default inventoryApi;
