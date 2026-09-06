import axios from "axios";

export const http = axios.create({
  baseURL: "/api",
});

http.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const path = typeof window !== "undefined" ? window.location.pathname : "";
    const onAuthPage = path === "/login" || path === "/register";

    if (status === 401 && !onAuthPage && typeof window !== "undefined") {
      void fetch("/api/session", { method: "DELETE" }).then(() => {
        window.location.href = `/login?next=${encodeURIComponent(path)}`;
      });
    }

    return Promise.reject(error);
  },
);