import axios from "axios";
import { getAuthCookie, removeAuthCookie } from "./cookie";

let axiosInstance: ReturnType<typeof axios.create> | null = null;

export const getAxiosInstance = () => {
  if (axiosInstance) return axiosInstance;

  axiosInstance = axios.create({
    baseURL:
      process.env.NEXT_PUBLIC_API_URL,
    headers: {
      "Content-Type": "application/json",
    },
  });

  // attach Bearer token automatically
  axiosInstance.interceptors.request.use((config) => {
    const token = getAuthCookie();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  // handle 401 globally
  axiosInstance.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401) {
        removeAuthCookie();
        if (typeof window !== "undefined") {
          window.location.href = "/login";
        }
      }
      return Promise.reject(error);
    }
  );

  return axiosInstance;
};