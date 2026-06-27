import axiosInstance from "./axiosInstance";

/**
 * Logs API Service Layer
 */

// GET /logs
export const getLogsApi = async () => {
  try {
    const response = await axiosInstance.get("/logs");
    return response.data;
  } catch (error) {
    throw error;
  }
};

// DELETE /logs
export const deleteLogsApi = async () => {
  try {
    const response = await axiosInstance.delete("/logs");
    return response.data;
  } catch (error) {
    throw error;
  }
};
