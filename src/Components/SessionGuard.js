import { useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  expireAuthSession,
  getSessionRemainingMs,
  isAuthSessionExpired,
  registerSessionExpiryHandler,
  setupAxiosSessionInterceptor,
} from "../utlls/authSession";

function SessionGuard({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const expiryTimerRef = useRef(null);

  const redirectToLogin = (showToast = false) => {
    if (location.pathname === "/login") return;
    expireAuthSession({ showToast });
    navigate("/login", { replace: true });
  };

  const clearExpiryTimer = () => {
    if (expiryTimerRef.current) {
      clearTimeout(expiryTimerRef.current);
      expiryTimerRef.current = null;
    }
  };

  const scheduleSessionExpiry = () => {
    clearExpiryTimer();

    if (location.pathname === "/login") return;

    if (isAuthSessionExpired()) {
      redirectToLogin(false);
      return;
    }

    const remainingMs = getSessionRemainingMs();
    if (remainingMs <= 0) {
      redirectToLogin(false);
      return;
    }

    expiryTimerRef.current = setTimeout(() => {
      redirectToLogin(true);
    }, remainingMs);
  };

  useEffect(() => {
    setupAxiosSessionInterceptor();
    registerSessionExpiryHandler(() => redirectToLogin(true));
  }, []);

  useEffect(() => {
    scheduleSessionExpiry();

    const handleVisibilityChange = () => {
      if (
        document.visibilityState === "visible" &&
        location.pathname !== "/login" &&
        isAuthSessionExpired()
      ) {
        redirectToLogin(true);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      clearExpiryTimer();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [location.pathname]);

  return children;
}

export default SessionGuard;
