import axios, { AxiosError } from "axios";
import { getAuthCookie, removeAuthCookie } from "./cookie";

let axiosInstance: ReturnType<typeof axios.create> | null = null;

export const getAxiosInstance = () => {
  if (axiosInstance) return axiosInstance;

  const baseURL = process.env.NEXT_PUBLIC_API_URL;

  if (!baseURL) {
    throw new Error("NEXT_PUBLIC_API_URL is not defined");
  }

  axiosInstance = axios.create({
    baseURL,
    headers: {
      "Content-Type": "application/json",
    },
  });

  /**
   * Attach Bearer token automatically
   */
  axiosInstance.interceptors.request.use((config) => {
    const token = getAuthCookie();

    if (token) {
      config.headers = config.headers ?? {};
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  });

  /**
   * Handle 401 globally
   */
  axiosInstance.interceptors.response.use(
    (response) => response,
    (error: AxiosError) => {
      if (error.response?.status === 401) {
        removeAuthCookie();

        if (typeof window !== "undefined") {
          const currentPath = window.location.pathname;

          // prevent redirect loop
          if (!currentPath.startsWith("/login")) {
            window.location.href = "/login";
          }
        }
      }

      return Promise.reject(error);
    }
  );

  return axiosInstance;
};