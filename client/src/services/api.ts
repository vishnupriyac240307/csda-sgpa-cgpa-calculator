import axios from "axios";
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000",
  withCredentials: true,
  headers: { "Content-Type": "application/json" }
});
api.interceptors.response.use(r => r, error => Promise.reject(error));
export const messageOf = (error: any) => error?.response?.data?.message || "Something went wrong. Please try again.";
