import axios from "axios";

// Normalize the base URL: strip any trailing slash(es) so that
// `${API_URL}/endpoint` never produces a double slash (e.g. `//chat`),
// which would not map to the backend routes.
export const API_URL = (import.meta.env.VITE_API_URL ?? "").replace(/\/+$/, "");

const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("risbo_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("risbo_token");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  },
);

export const getProfileSummary = async () => {
  const response = await api.get("/profile/summary");
  return response.data;
};

export const getProfileMetrics = async (metricName: string) => {
  const response = await api.get(`/profile/metrics/${metricName}`);
  return response.data;
};

export default api;
