import axios from "axios";

const configuredUrl = (
  import.meta.env.VITE_API_URL || "http://localhost:8000"
).replace(/\/+$/, "");

const apiBaseUrl = configuredUrl.endsWith("/api")
  ? configuredUrl
  : `${configuredUrl}/api`;

const apiOrigin = apiBaseUrl.replace(/\/api$/, "");

const api = axios.create({
  baseURL: apiBaseUrl,
  withCredentials: true,
  withXSRFToken: true,
  xsrfCookieName: "XSRF-TOKEN",
  xsrfHeaderName: "X-XSRF-TOKEN",
  headers: {
    Accept: "application/json",
    "X-Requested-With": "XMLHttpRequest",
  },
});

const csrfClient = axios.create({
  baseURL: apiOrigin,
  withCredentials: true,
  withXSRFToken: true,
  xsrfCookieName: "XSRF-TOKEN",
  xsrfHeaderName: "X-XSRF-TOKEN",
  headers: {
    Accept: "application/json",
    "X-Requested-With": "XMLHttpRequest",
  },
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const requestUrl = String(error?.config?.url || "");

    if (
      error?.response?.status === 401 &&
      !requestUrl.endsWith("/login") &&
      typeof window !== "undefined"
    ) {
      window.dispatchEvent(new Event("point:unauthorized"));
    }

    return Promise.reject(error);
  },
);

export function initializeCsrf() {
  return csrfClient.get("/sanctum/csrf-cookie");
}

export function getApiFieldError(error, ...fields) {
  const errors = error?.response?.data?.errors;

  if (!errors) return "";

  for (const field of fields) {
    const fieldError = errors[field];

    if (Array.isArray(fieldError) && fieldError.length > 0) {
      return fieldError[0];
    }

    if (typeof fieldError === "string") {
      return fieldError;
    }
  }

  return "";
}

export function getApiErrorMessage(
  error,
  fallback = "Não foi possível concluir a operação.",
) {
  const responseData = error?.response?.data;

  if (typeof responseData?.message === "string" && responseData.message) {
    return responseData.message;
  }

  const firstValidationError = Object.values(
    responseData?.errors || {},
  ).find(Boolean);

  if (Array.isArray(firstValidationError)) {
    return firstValidationError[0] || fallback;
  }

  if (typeof firstValidationError === "string") {
    return firstValidationError;
  }

  return error?.message || fallback;
}

export default api;
