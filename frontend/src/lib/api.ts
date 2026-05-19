import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:8080",
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
