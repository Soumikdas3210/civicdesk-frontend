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
        // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- a hard navigation is intended. It discards all in-memory React state, which is correct when the previous session has just expired.
        window.location.href = `/login?next=${encodeURIComponent(path)}`;
      });
    }

    return Promise.reject(error);
  },
);