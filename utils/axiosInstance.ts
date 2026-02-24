import axios from "axios";

export const getAxiosInstance = () =>
  axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL,
    headers: {
      "Content-Type": "application/json",
    },
    withCredentials: true, //important for cookies// api must support CORS
  });