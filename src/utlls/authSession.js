import Cookies from "js-cookie";
import axios from "axios";
import { createStandaloneToast } from "@chakra-ui/react";
import {
  beginGlobalLoading,
  endGlobalLoading,
  shouldTrackAxiosLoading,
} from "./globalLoading";

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
  sessionStorage.removeItem("qualifierId");
  sessionStorage.removeItem("panelistId");
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

const RETRYABLE_STATUS_CODES = new Set([502, 503, 504]);
const MAX_SAFE_REQUEST_RETRIES = 2;

const retrySafeRequest = async (error) => {
  const config = error?.config;
  const method = String(config?.method || "get").toLowerCase();
  const isSafeMethod = method === "get" || method === "head";
  const isTemporaryFailure =
    !error?.response || RETRYABLE_STATUS_CODES.has(error.response.status);
  const retryCount = Number(config?.__lcaRetryCount || 0);

  if (!config || !isSafeMethod || !isTemporaryFailure || retryCount >= MAX_SAFE_REQUEST_RETRIES) {
    return null;
  }

  config.__lcaRetryCount = retryCount + 1;
  await new Promise((resolve) => setTimeout(resolve, 500 * config.__lcaRetryCount));
  return axios(config);
};

export const registerSessionExpiryHandler = (handler) => {
  sessionExpiryHandler = handler;
};

export const setupAxiosSessionInterceptor = () => {
  if (axiosInterceptorInstalled) return;
  axiosInterceptorInstalled = true;

  axios.interceptors.request.use(
    (config) => {
      if (shouldTrackAxiosLoading(config)) {
        beginGlobalLoading();
        config.__lcaTrackedLoading = true;
      }
      return config;
    },
    (error) => {
      if (error?.config?.__lcaTrackedLoading) endGlobalLoading();
      return Promise.reject(error);
    }
  );

  axios.interceptors.response.use(
    (response) => {
      if (response?.config?.__lcaTrackedLoading) endGlobalLoading();
      return response;
    },
    async (error) => {
      if (error?.config?.__lcaTrackedLoading) endGlobalLoading();
      const requestUrl = String(error.config?.url || "");
      const isPublicSlipVerify = requestUrl.includes("/admission-slips/verify/");
      if (error.response?.status === 401 && !isPublicSlipVerify) {
        expireAuthSession({ showToast: true });
        sessionExpiryHandler?.();
      }

      const retryResponse = await retrySafeRequest(error);
      if (retryResponse) return retryResponse;

      const requestId = error.response?.headers?.["x-request-id"];
      if (requestId) error.requestId = requestId;
      return Promise.reject(error);
    }
  );
};

export const getSessionCookieExpiry = () =>
  new Date(Date.now() + SESSION_DURATION_MS);
