import Cookies from "js-cookie";
import { extractRoleFromToken } from "./useful";
import { isInterviewConductRoute } from "./interviewEvaluation";

/** Screens allowed for the Panelist role. */export const PANELIST_ROUTE_PATHS = [
  "/dashboard",
  "/profile",
  "/interview-panel-schedules",
];

const normalizeRole = (role) =>
  String(role || "")
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ");

export const isPanelistRoleName = (role) =>
  normalizeRole(role) === "panelist";

export const isPanelistRole = () => {
  const storedRole = sessionStorage.getItem("role");
  if (storedRole) {
    return isPanelistRoleName(storedRole);
  }

  try {
    const authToken = Cookies.get("authToken");
    if (authToken) {
      return isPanelistRoleName(extractRoleFromToken(authToken));
    }
  } catch {
    return false;
  }

  return false;
};

export const getPanelistId = () => sessionStorage.getItem("panelistId");

export const canAccessPanelistRoute = (path) => {
  if (!isPanelistRole()) {
    return true;
  }
  const normalized = String(path || "");
  if (isInterviewConductRoute(normalized)) {
    return true;
  }
  return PANELIST_ROUTE_PATHS.includes(normalized);
};

export const getPanelistVisibleRoutes = (allRoutes) => {
  if (!isPanelistRole()) {
    return allRoutes;
  }
  return PANELIST_ROUTE_PATHS.map((path) => {
    const route = allRoutes.find((item) => item.path === path);
    if (!route || route.hidden) return null;
    if (path === "/interview-panel-schedules") {
      return { ...route, name: "Panel Schedules", hidden: false };
    }
    return route;
  }).filter(Boolean);
};
