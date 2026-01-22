import axios from "axios";

export const api = axios.create({
  baseURL: "https://eightbitproject.onrender.com",
  headers: {
    "Content-Type": "application/json",
  },
});

