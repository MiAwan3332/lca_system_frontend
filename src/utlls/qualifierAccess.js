import Cookies from "js-cookie";
import { extractRoleFromToken } from "./useful";

/** Screens allowed for the Qualifier role. */
export const QUALIFIER_ROUTE_PATHS = [
  "/dashboard",
  "/profile",
  "/qualifiers",
  "/interview-panel-schedules",
];

const normalizeRole = (role) =>
  String(role || "")
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ");

export const isQualifierRoleName = (role) =>
  normalizeRole(role) === "qualifier";

export const isQualifierRole = () => {
  const storedRole = sessionStorage.getItem("role");
  if (storedRole) {
    return isQualifierRoleName(storedRole);
  }

  try {
    const authToken = Cookies.get("authToken");
    if (authToken) {
      return isQualifierRoleName(extractRoleFromToken(authToken));
    }
  } catch {
    return false;
  }

  return false;
};

export const getQualifierId = () => sessionStorage.getItem("qualifierId");

export const canAccessQualifierRoute = (path) => {
  if (!isQualifierRole()) {
    return true;
  }
  const normalized = String(path || "");
  if (QUALIFIER_ROUTE_PATHS.includes(normalized)) return true;
  // Allow nested schedule detail only if we ever link it; keep locked for now
  return false;
};

export const getQualifierVisibleRoutes = (allRoutes) => {
  if (!isQualifierRole()) {
    return allRoutes;
  }
  return QUALIFIER_ROUTE_PATHS.map((path) => {
    const route = allRoutes.find((item) => item.path === path);
    if (!route || route.hidden) return null;
    // Avoid duplicate Profile + My Profile entries; fee details live on My Profile
    if (path === "/profile") return null;
    if (path === "/qualifiers") {
      return { ...route, name: "My Profile", hidden: false };
    }
    return route;
  }).filter(Boolean);
};
