import Cookies from "js-cookie";
import { extractRoleFromToken } from "./useful";

/**
 * Roles allowed to open Interview Panel and Panel Schedules.
 * Matches: Superadmin, Secrate Superadmin, Principal, Vice-Principal, CEO,
 * Super Admin Development.
 */
export const INTERVIEW_PANEL_ALLOWED_ROLE_NAMES = [
  "ceo",
  "superadmin",
  "super admin",
  "super_admin",
  "secrateadmin",
  "secrate admin",
  "secratesuperadmin",
  "secrate superadmin",
  "secrate super admin",
  "secretadmin",
  "secret admin",
  "super admin development",
  "superadmin development",
  "principal",
  "principle",
  "vice-principal",
  "vice principal",
  "viceprincipal",
  "vice-principle",
  "vice principle",
  "viceprinciple",
];

const normalizeRole = (role) =>
  String(role || "")
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ");

export const isInterviewPanelAllowedRoleName = (role) => {
  const normalized = normalizeRole(role);
  if (!normalized) return false;

  if (
    INTERVIEW_PANEL_ALLOWED_ROLE_NAMES.some(
      (name) => normalizeRole(name) === normalized
    )
  ) {
    return true;
  }

  const compact = normalized.replace(/\s+/g, "");
  return (
    compact === "ceo" ||
    compact === "superadmin" ||
    compact === "superadmindevelopment" ||
    compact === "secrateadmin" ||
    compact === "secratesuperadmin" ||
    compact === "secretadmin" ||
    compact === "principal" ||
    compact === "principle" ||
    compact === "viceprincipal" ||
    compact === "viceprinciple"
  );
};

export const getCurrentRoleName = () => {
  const storedRole = sessionStorage.getItem("role");
  if (storedRole) return storedRole;

  try {
    const authToken = Cookies.get("authToken");
    if (authToken) {
      return extractRoleFromToken(authToken) || "";
    }
  } catch {
    return "";
  }
  return "";
};

export const canAccessInterviewPanel = () =>
  isInterviewPanelAllowedRoleName(getCurrentRoleName());

export const isInterviewPanelRoute = (path) => {
  const normalized = String(path || "");
  return (
    normalized === "/interview-panel" ||
    normalized === "/interview-panel-schedules" ||
    normalized.startsWith("/interview-panel/")
  );
};
