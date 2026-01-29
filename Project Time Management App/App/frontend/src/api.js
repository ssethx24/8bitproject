import axios from "axios";

/**
 * Central Axios instance for API calls
 * - Uses GitHub Pages / Render backend in production
 * - Falls back to localhost for local development
 */
const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL ||
  "https://project-management-fullstack-5idq.onrender.com";

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

/**
 * Automatically attach JWT token to every request
 */
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);
