import Cookies from "js-cookie";
import axios from "axios";
import { createStandaloneToast } from "@chakra-ui/react";

const { toast } = createStandaloneToast();

export const SESSION_DURATION_MS = 12 * 60 * 60 * 1000;
export const SESSION_EXPIRED_MESSAGE =
  "Your session has expired. Please login again.";

const parseJwtPayload = (token) => {
  const base64Url = token.split(".")[1];
  const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
  return JSON.parse(window.atob(base64));
};

export const getAuthToken = () =>
  Cookies.get("authToken") || sessionStorage.getItem("authToken");

const getTokenExpiryMs = (payload) => {
  if (payload.exp) {
    return payload.exp * 1000;
  }

  const storedExpiry = sessionStorage.getItem("sessionExpiresAt");
  if (storedExpiry) {
    return Number(storedExpiry);
  }

  if (payload.iat) {
    return payload.iat * 1000 + SESSION_DURATION_MS;
  }

  return null;
};

export const isTokenExpired = (token) => {
  if (!token) return true;

  try {
    const payload = parseJwtPayload(token);
    const expiryMs = getTokenExpiryMs(payload);
    if (!expiryMs) return false;
    return Date.now() >= expiryMs;
  } catch {
    return true;
  }
};

export const isAuthSessionExpired = () => isTokenExpired(getAuthToken());

export const markSessionStarted = () => {
  sessionStorage.setItem(
    "sessionExpiresAt",
    String(Date.now() + SESSION_DURATION_MS)
  );
};

export const getSessionRemainingMs = (token = getAuthToken()) => {
  if (!token) return 0;

  try {
    const payload = parseJwtPayload(token);
    const expiryMs = getTokenExpiryMs(payload);
    if (!expiryMs) return SESSION_DURATION_MS;
    return Math.max(0, expiryMs - Date.now());
  } catch {
    return 0;
  }
};

export const clearAuthSession = () => {
  sessionStorage.removeItem("authToken");
  sessionStorage.removeItem("permissions");
  sessionStorage.removeItem("role");
  sessionStorage.removeItem("studentId");
  sessionStorage.removeItem("teacherId");
  sessionStorage.removeItem("profileUpdatedOnce");
  sessionStorage.removeItem("skipProfileCompletion");
  sessionStorage.removeItem("sessionExpiresAt");
  Cookies.remove("authToken");
};

export const expireAuthSession = ({ showToast = false } = {}) => {
  clearAuthSession();

  if (showToast) {
    toast({
      title: "Session expired",
      description: SESSION_EXPIRED_MESSAGE,
      status: "warning",
      duration: 5000,
      isClosable: true,
    });
  }
};

let axiosInterceptorInstalled = false;
let sessionExpiryHandler = null;

export const registerSessionExpiryHandler = (handler) => {
  sessionExpiryHandler = handler;
};

export const setupAxiosSessionInterceptor = () => {
  if (axiosInterceptorInstalled) return;
  axiosInterceptorInstalled = true;

  axios.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401) {
        expireAuthSession({ showToast: true });
        sessionExpiryHandler?.();
      }
      return Promise.reject(error);
    }
  );
};

export const getSessionCookieExpiry = () =>
  new Date(Date.now() + SESSION_DURATION_MS);
