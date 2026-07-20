import Cookies from "js-cookie";
import { extractRoleFromToken } from "./useful";

/**
 * Principal and Vice-Principal share the same access:
 * all screens except Roles, Permissions, and all activity logs.
 */
export const PRINCIPAL_BLOCKED_ROUTE_PATHS = [
  "/role",
  "/permission",
  "/activity-logs/students",
  "/activity-logs/teachers",
  "/activity-logs/admins",
];

const normalizeRole = (role) =>
  String(role || "")
    .trim()
    .toLowerCase()
    .replace(/[_]+/g, "-")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

export const isPrincipalRoleName = (role) => {
  const normalized = normalizeRole(role);
  return (
    normalized === "principal" ||
    normalized === "vice-principal" ||
    normalized === "viceprincipal"
  );
};

export const isPrincipalRole = () => {
  const storedRole = sessionStorage.getItem("role");
  if (storedRole) {
    return isPrincipalRoleName(storedRole);
  }

  try {
    const authToken = Cookies.get("authToken");
    if (authToken) {
      return isPrincipalRoleName(extractRoleFromToken(authToken));
    }
  } catch {
    return false;
  }

  return false;
};

const isPrincipalBlockedPath = (path) => {
  if (PRINCIPAL_BLOCKED_ROUTE_PATHS.includes(path)) return true;
  // Any activity-log screen (student / teacher / admin logs)
  if (String(path || "").startsWith("/activity-logs")) return true;
  return false;
};

export const canAccessPrincipalRoute = (path) => {
  if (!isPrincipalRole()) {
    return true;
  }
  return !isPrincipalBlockedPath(path);
};

export const getPrincipalVisibleRoutes = (allRoutes) => {
  if (!isPrincipalRole()) {
    return allRoutes;
  }
  return allRoutes.filter((route) => !isPrincipalBlockedPath(route.path));
};
